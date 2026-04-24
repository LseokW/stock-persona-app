from dataclasses import asdict

from fastapi import APIRouter, HTTPException

from app.ml.predictor import Predictor
from app.schemas import BacktestRequest, BacktestResponse, PersonaResult
from app.services.backtest import run_all_personas
from app.services.data_loader import load_ohlcv, validate_sp500_ticker

router = APIRouter()

# 모듈 로드 시 Predictor 1회만 초기화 (매 요청마다 로드하지 않음)
_predictor: Predictor | None = None


def get_predictor() -> Predictor:
    global _predictor
    if _predictor is None:
        _predictor = Predictor(
            model_path="models/lstm_direction.pt",
            norm_stats_path="models/norm_stats.json",
        )
    return _predictor


@router.post("/backtest", response_model=BacktestResponse)
def backtest(req: BacktestRequest):
    ticker = req.ticker.upper()

    if not validate_sp500_ticker(ticker):
        raise HTTPException(status_code=400, detail=f"Invalid ticker: {ticker}")

    try:
        df = load_ohlcv(ticker, period_months=req.period_months)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data load failed: {e}")

    if df.empty or len(df) < 25:
        raise HTTPException(status_code=500, detail="Not enough data")

    predictor = get_predictor()
    results = run_all_personas(df, predictor=predictor, initial_capital=req.initial_capital)

    # 벤치마크: 백테스트 시작 시점(인덱스 24)부터 매수, 마지막 시점에 매도
    first_price = float(df.iloc[24]["close"])
    last_price = float(df.iloc[-1]["close"])
    benchmark_pct = (last_price / first_price - 1) * 100

    return BacktestResponse(
        ticker=ticker,
        period={
            "start": df.index[24].isoformat(),
            "end": df.index[-1].isoformat(),
        },
        benchmark_buy_hold_pct=round(benchmark_pct, 2),
        personas=[
            PersonaResult(
                id=r.persona_id,
                name=r.persona_name,
                type=r.persona_type,
                equity_curve=r.equity_curve,
                trades=r.trades,
                metrics=r.metrics,
            )
            for r in results
        ],
    )
