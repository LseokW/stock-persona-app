import random as rand_module

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_utils import get_current_user_id
from app.database import get_db
from app.ml.predictor import Predictor
from app.models import Purchase
from app.schemas import BacktestRequest, BacktestResponse, PersonaResult
from app.services.backtest import run_backtest
from app.services.data_loader import load_ohlcv, validate_sp500_ticker
from app.services.personas import ALL_PERSONAS

router = APIRouter()

_predictor: Predictor | None = None

PERSONA_MAP = {p.id: p for p in ALL_PERSONAS}
FREE_PERSONA = "random"
PAID_PERSONAS = set(PERSONA_MAP.keys())  # {"coward", "beast", "contrarian", "ai"}


def get_predictor() -> Predictor:
    global _predictor
    if _predictor is None:
        _predictor = Predictor(
            model_path="models/lstm_direction.pt",
            norm_stats_path="models/norm_stats.json",
        )
    return _predictor


@router.post("/backtest", response_model=BacktestResponse)
async def backtest(
    req: BacktestRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    persona_key = req.persona.lower()

    if persona_key != FREE_PERSONA and persona_key not in PAID_PERSONAS:
        raise HTTPException(status_code=400, detail=f"Unknown persona: {persona_key}")

    if persona_key != FREE_PERSONA:
        result = await db.execute(
            select(Purchase).where(
                Purchase.user_id == user_id,
                Purchase.persona == persona_key,
                Purchase.status == "completed",
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=402, detail="이 페르소나는 잠겨 있습니다")

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

    if persona_key == FREE_PERSONA:
        selected = rand_module.choice(list(PERSONA_MAP.values()))
    else:
        selected = PERSONA_MAP[persona_key]

    r = run_backtest(df, selected, predictor=predictor, initial_capital=req.initial_capital)

    first_price = float(df.iloc[24]["close"])
    last_price = float(df.iloc[-1]["close"])
    benchmark_pct = (last_price / first_price - 1) * 100

    return BacktestResponse(
        ticker=ticker,
        period={"start": df.index[24].isoformat(), "end": df.index[-1].isoformat()},
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
        ],
    )
