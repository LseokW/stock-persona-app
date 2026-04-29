from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_utils import get_current_user_id
from app.database import get_db
from app.ml.predictor import Predictor
from app.models import Purchase
from app.schemas import (
    BacktestRequest, BacktestResponse, PersonaResult,
    AllTickersRequest, AllTickersResponse, TickerSummary,
)
from app.services.backtest import run_backtest
from app.services.data_loader import load_ohlcv, validate_sp500_ticker, SP500_TICKERS
from app.services.personas import ALL_PERSONAS, AIPersona

router = APIRouter()

_predictor: Predictor | None = None

PERSONA_MAP = {p.id: p for p in ALL_PERSONAS}
COMPARE_PERSONA = "random"   # 프론트에서 "전체 비교" 탭 ID
PAID_PERSONAS = set(PERSONA_MAP.keys())


def get_predictor() -> Predictor:
    global _predictor
    if _predictor is None:
        _predictor = Predictor(
            model_path="models/lstm_direction.pt",
            norm_stats_path="models/norm_stats.json",
        )
    return _predictor


def _make_ai_persona(req: BacktestRequest) -> AIPersona:
    p = AIPersona()
    if req.ai_params:
        p.BUY_THRESHOLD = req.ai_params.buy_threshold
        p.SELL_THRESHOLD = req.ai_params.sell_threshold
        p.MIN_HOLD_CANDLES = req.ai_params.min_hold_candles
        p.MAX_HOLD_CANDLES = req.ai_params.max_hold_candles
    return p


@router.post("/backtest", response_model=BacktestResponse)
async def backtest(
    req: BacktestRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    persona_key = req.persona.lower()

    if persona_key != COMPARE_PERSONA and persona_key not in PAID_PERSONAS:
        raise HTTPException(status_code=400, detail=f"Unknown persona: {persona_key}")

    # 단일 페르소나 구매 확인
    if persona_key != COMPARE_PERSONA:
        row = await db.execute(
            select(Purchase).where(
                Purchase.user_id == user_id,
                Purchase.persona == persona_key,
                Purchase.status == "completed",
            )
        )
        if row.scalar_one_or_none() is None:
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

    first_price = float(df.iloc[24]["close"])
    last_price = float(df.iloc[-1]["close"])
    benchmark_pct = round((last_price / first_price - 1) * 100, 2)

    # ── 전체 비교 모드 ──────────────────────────────────────────
    if persona_key == COMPARE_PERSONA:
        purchases = await db.execute(
            select(Purchase).where(
                Purchase.user_id == user_id,
                Purchase.status == "completed",
            )
        )
        purchased_ids = [p.persona for p in purchases.scalars().all()]

        if not purchased_ids:
            raise HTTPException(
                status_code=400,
                detail="구매한 페르소나가 없습니다. 먼저 페르소나를 하나 이상 구매해주세요.",
            )

        results = []
        for pid in purchased_ids:
            instance = _make_ai_persona(req) if pid == "ai" else PERSONA_MAP[pid]
            results.append(run_backtest(df, instance, predictor=predictor, initial_capital=req.initial_capital))

        return BacktestResponse(
            ticker=ticker,
            period={"start": df.index[24].isoformat(), "end": df.index[-1].isoformat()},
            benchmark_buy_hold_pct=benchmark_pct,
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

    # ── 단일 페르소나 모드 ──────────────────────────────────────
    instance = _make_ai_persona(req) if persona_key == "ai" else PERSONA_MAP[persona_key]
    r = run_backtest(df, instance, predictor=predictor, initial_capital=req.initial_capital)

    return BacktestResponse(
        ticker=ticker,
        period={"start": df.index[24].isoformat(), "end": df.index[-1].isoformat()},
        benchmark_buy_hold_pct=benchmark_pct,
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


@router.post("/backtest/all-tickers", response_model=AllTickersResponse)
async def backtest_all_tickers(
    req: AllTickersRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    persona_key = req.persona.lower()

    if persona_key not in PAID_PERSONAS:
        raise HTTPException(status_code=400, detail=f"Unknown persona: {persona_key}")

    row = await db.execute(
        select(Purchase).where(
            Purchase.user_id == user_id,
            Purchase.persona == persona_key,
            Purchase.status == "completed",
        )
    )
    if row.scalar_one_or_none() is None:
        raise HTTPException(status_code=402, detail="이 페르소나는 잠겨 있습니다")

    predictor = get_predictor()
    summaries = []

    for ticker in SP500_TICKERS:
        try:
            df = load_ohlcv(ticker, period_months=req.period_months)
            if df.empty or len(df) < 25:
                continue
            instance = _make_ai_persona(req) if persona_key == "ai" else PERSONA_MAP[persona_key]
            r = run_backtest(df, instance, predictor=predictor, initial_capital=req.initial_capital)
            m = r.metrics
            summaries.append(TickerSummary(
                ticker=ticker,
                total_return_pct=m["total_return_pct"],
                mdd_pct=m["mdd_pct"],
                num_trades=m["num_trades"],
                win_rate=m["win_rate"],
            ))
        except Exception:
            continue

    meta = PERSONA_MAP[persona_key]
    return AllTickersResponse(
        persona_id=meta.id,
        persona_name=meta.name,
        tickers=sorted(summaries, key=lambda x: x.total_return_pct, reverse=True),
    )
