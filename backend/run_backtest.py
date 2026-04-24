"""
run_backtest.py — 4개 페르소나 백테스트 CLI 실행 스크립트.

실행:
    cd backend
    uv run python run_backtest.py --ticker AAPL

출력:
    - 터미널에 결과 표
    - backtest_results/{ticker}_{timestamp}.json
"""

import argparse
import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from app.ml.predictor import Predictor
from app.services.backtest import run_all_personas
from app.services.data_loader import load_ohlcv

MODELS_DIR = Path(__file__).parent / "models"
RESULTS_DIR = Path(__file__).parent / "backtest_results"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ticker", default="AAPL")
    args = parser.parse_args()

    ticker = args.ticker.upper()

    # --- 데이터 로드 (백테스트는 최근 6개월만) ---
    print(f"\n{ticker} 6개월 데이터 로드 중...")
    df = load_ohlcv(ticker, period_months=6)
    print(f"데이터: {len(df)}행  ({df.index[0].date()} ~ {df.index[-1].date()})")

    # 벤치마크: Buy & Hold 수익률
    bh_return = (df["close"].iloc[-1] / df["close"].iloc[0] - 1) * 100

    # --- Predictor 로드 ---
    predictor = Predictor(
        model_path=str(MODELS_DIR / "lstm_direction.pt"),
        norm_stats_path=str(MODELS_DIR / "norm_stats.json"),
    )

    # --- 백테스트 실행 ---
    print("\n백테스트 실행 중...")
    results = run_all_personas(df, predictor=predictor, initial_capital=10000.0)

    # --- 터미널 출력 ---
    print(f"\n=== 백테스트 결과 ({ticker}, 최근 6개월) ===\n")
    header = f"{'페르소나':<10} | {'수익률':>8} | {'MDD':>7} | {'거래':>4} | {'승률':>5} | {'평균보유(h)':>10}"
    sep = "-" * len(header)
    print(header)
    print(sep)

    for r in results:
        m = r.metrics
        ret_str = f"{m['total_return_pct']:+.2f}%"
        mdd_str = f"{m['mdd_pct']:.2f}%"
        wr_str = f"{m['win_rate']:.2f}"
        print(
            f"{r.persona_name:<10} | {ret_str:>8} | {mdd_str:>7} | "
            f"{m['num_trades']:>4} | {wr_str:>5} | {m['avg_hold_hours']:>10.1f}"
        )

    print(sep)
    print(f"\n벤치마크 (Buy & Hold): {bh_return:+.2f}%")

    # --- JSON 저장 ---
    RESULTS_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = RESULTS_DIR / f"{ticker}_{ts}.json"

    payload = {
        "ticker": ticker,
        "period": {
            "start": df.index[0].isoformat(),
            "end": df.index[-1].isoformat(),
        },
        "benchmark_buy_hold_pct": round(bh_return, 2),
        "personas": [
            {
                "id": r.persona_id,
                "name": r.persona_name,
                "type": r.persona_type,
                "metrics": r.metrics,
                "trades": r.trades,
                "equity_curve": r.equity_curve,
            }
            for r in results
        ],
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"\n결과 저장: {out_path}")


if __name__ == "__main__":
    main()
