from pydantic import BaseModel, Field
from typing import Literal, Optional


class AIParams(BaseModel):
    buy_threshold: float = Field(default=0.42, ge=0.0, le=1.0)
    sell_threshold: float = Field(default=0.50, ge=0.0, le=1.0)
    min_hold_candles: int = Field(default=4, ge=1, le=100)
    max_hold_candles: int = Field(default=24, ge=1, le=500)


class BacktestRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=5)
    period_months: int = Field(default=6, ge=1, le=24)
    initial_capital: float = Field(default=10000.0, gt=0)
    # "random" = 무료 페르소나. "coward"|"beast"|"contrarian"|"ai" = 결제 필요
    persona: str = Field(default="random")
    ai_params: Optional[AIParams] = None


class PersonaResult(BaseModel):
    id: str
    name: str
    type: Literal["rule_based", "ml_based"]
    equity_curve: list   # [[timestamp_iso, value], ...]
    trades: list
    metrics: dict


class BacktestResponse(BaseModel):
    ticker: str
    period: dict         # {"start": iso, "end": iso}
    benchmark_buy_hold_pct: float
    personas: list[PersonaResult]


class ValidateResponse(BaseModel):
    ticker: str
    valid: bool


class AllTickersRequest(BaseModel):
    persona: str
    period_months: int = Field(default=6, ge=1, le=24)
    initial_capital: float = Field(default=10000.0, gt=0)
    ai_params: Optional[AIParams] = None


class TickerSummary(BaseModel):
    ticker: str
    total_return_pct: float
    mdd_pct: float
    num_trades: int
    win_rate: float


class AllTickersResponse(BaseModel):
    persona_id: str
    persona_name: str
    tickers: list[TickerSummary]


class HealthResponse(BaseModel):
    status: str


class MeResponse(BaseModel):
    id: int
    email: str
    name: str | None
    picture_url: str | None
    purchased_personas: list[str]
