"""
optimize.py — AI 페르소나 파라미터 그리드 서치.

전략:
  1. 10개 종목 전체 df 로드
  2. 배치 추론으로 모든 캔들의 예측값을 사전 계산 (캐싱)
  3. CachedPredictor로 그리드 서치 실행 (PyTorch 호출 없이 dict 조회만)

실행:
    cd backend
    uv run python optimize.py
"""

import itertools
from pathlib import Path

import numpy as np
import torch

from app.ml.dataset import compute_features
from app.ml.predictor import Predictor
from app.services.backtest import run_backtest
from app.services.data_loader import SP500_TICKERS, load_ohlcv
from app.services.personas import AIPersona


# ─── 배치 추론 + 캐시 ──────────────────────────────────────────────────────────

def precompute_predictions(df, predictor: Predictor) -> dict:
    """
    전체 df에 대해 배치 추론을 실행, {pandas_Timestamp: p} 반환.
    AIPersona.decide()에서 ctx.history.tail(60).index[-1]로 조회한다.
    """
    CONTEXT = predictor.CONTEXT_SIZE   # 60
    WINDOW  = predictor.WINDOW_SIZE    # 24

    features = compute_features(df, predictor.norm_stats)  # (N, 6)

    indices = list(range(CONTEXT, len(df)))
    if not indices:
        return {}

    # 배치 텐서: (K, 24, 6)
    windows = np.stack([features[i - WINDOW : i] for i in indices])
    x = torch.tensor(windows, dtype=torch.float32)

    with torch.no_grad():
        probs = torch.sigmoid(predictor.model(x)).squeeze(1).numpy()

    return {df.index[i]: float(p) for i, p in zip(indices, probs)}


class CachedPredictor:
    """배치 추론 캐시를 감싸는 mock predictor."""
    CONTEXT_SIZE = 60
    WINDOW_SIZE  = 24

    def __init__(self, preds: dict):
        self._preds = preds

    def predict(self, context_df) -> float:
        return self._preds.get(context_df.index[-1], 0.5)


# ─── 메인 ─────────────────────────────────────────────────────────────────────

def main():
    # 1. 데이터 로드
    print("10개 종목 데이터 로드 중...")
    datasets = {}
    for ticker in SP500_TICKERS:
        try:
            df = load_ohlcv(ticker, period_months=6)
            if len(df) >= 80:
                datasets[ticker] = df
                print(f"  {ticker}: {len(df)}행")
        except Exception as e:
            print(f"  {ticker}: 실패 ({e})")

    if not datasets:
        print("데이터 없음. 종료.")
        return

    # 2. 배치 추론 (ticker별 1회)
    print(f"\n배치 추론 중 (모델: models/lstm_direction.pt)...")
    real_predictor = Predictor("models/lstm_direction.pt", "models/norm_stats.json")
    cached = {}
    for ticker, df in datasets.items():
        cached[ticker] = precompute_predictions(df, real_predictor)
        print(f"  {ticker}: {len(cached[ticker])}개 예측값")

    # 3. 그리드 정의
    buy_thresholds  = [0.50, 0.51, 0.52, 0.53, 0.54, 0.55]
    sell_thresholds = [0.44, 0.46, 0.48, 0.50]
    min_holds       = [1, 2, 4]
    max_holds       = [12, 24, 48]

    combos = [
        (bt, st, mn, mx)
        for bt, st, mn, mx in itertools.product(
            buy_thresholds, sell_thresholds, min_holds, max_holds
        )
        if bt > st  # 매수임계값 > 매도임계값 조건
    ]

    n_tickers = len(datasets)
    print(f"\n탐색: {len(combos)}개 조합 × {n_tickers}개 종목 = {len(combos)*n_tickers}회 백테스트\n")

    # 4. 그리드 서치
    best_avg = -float("inf")
    best_params = None
    all_results = []

    for i, (bt, st, mn, mx) in enumerate(combos):
        ticker_returns = []

        for ticker, df in datasets.items():
            persona = AIPersona()
            persona.BUY_THRESHOLD    = bt
            persona.SELL_THRESHOLD   = st
            persona.MIN_HOLD_CANDLES = mn
            persona.MAX_HOLD_CANDLES = mx

            mock = CachedPredictor(cached[ticker])
            r = run_backtest(df, persona, predictor=mock, initial_capital=10000)
            ticker_returns.append(r.metrics["total_return_pct"])

        avg_ret = float(np.mean(ticker_returns))
        med_ret = float(np.median(ticker_returns))
        win_cnt = sum(1 for x in ticker_returns if x > 0)

        all_results.append({
            "params": {
                "buy_threshold": bt,
                "sell_threshold": st,
                "min_hold_candles": mn,
                "max_hold_candles": mx,
            },
            "avg_return":    avg_ret,
            "median_return": med_ret,
            "win_tickers":   win_cnt,
            "returns":       dict(zip(datasets.keys(), ticker_returns)),
        })

        if avg_ret > best_avg:
            best_avg = avg_ret
            best_params = (bt, st, mn, mx)
            print(f"[{i+1:3d}/{len(combos)}] 새 최고  avg={avg_ret:+.2f}%  "
                  f"bt={bt:.2f} st={st:.2f} min={mn} max={mx}")

    # 5. 결과 출력
    all_results.sort(key=lambda x: x["avg_return"], reverse=True)

    print("\n" + "=" * 72)
    print("TOP 10 파라미터 조합")
    print("=" * 72)
    print(f"{'순위':>4} | {'매수':>5} | {'매도':>5} | {'최소':>4} | {'최대':>4} | {'평균수익':>8} | {'중앙수익':>8} | {'수익종목':>6}")
    print("-" * 72)
    for rank, res in enumerate(all_results[:10], 1):
        p = res["params"]
        print(
            f"{rank:>4} | {p['buy_threshold']:>5.2f} | {p['sell_threshold']:>5.2f} | "
            f"{p['min_hold_candles']:>4} | {p['max_hold_candles']:>4} | "
            f"{res['avg_return']:>+7.2f}% | {res['median_return']:>+7.2f}% | "
            f"{res['win_tickers']:>2}/{n_tickers}"
        )

    best_res = all_results[0]
    bp = best_res["params"]

    print("\n" + "=" * 72)
    print("최적 파라미터 (프론트엔드 '정석' 프리셋에 반영할 값)")
    print("=" * 72)
    print(f"  buy_threshold    = {bp['buy_threshold']}")
    print(f"  sell_threshold   = {bp['sell_threshold']}")
    print(f"  min_hold_candles = {bp['min_hold_candles']}")
    print(f"  max_hold_candles = {bp['max_hold_candles']}")
    print(f"  평균 수익률      = {best_res['avg_return']:+.2f}%")
    print(f"  중앙 수익률      = {best_res['median_return']:+.2f}%")
    print(f"\n종목별 수익률:")
    for ticker, ret in sorted(best_res["returns"].items(), key=lambda x: -x[1]):
        bar = "█" * max(0, int(ret)) if ret > 0 else "▒" * max(0, int(-ret))
        print(f"  {ticker:>5}: {ret:+7.2f}%  {bar}")


if __name__ == "__main__":
    main()
