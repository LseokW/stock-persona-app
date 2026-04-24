from pydantic import BaseModel, Field
from typing import Literal


class BacktestRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=5)
    period_months: int = Field(default=6, ge=1, le=24)
    initial_capital: float = Field(default=10000.0, gt=0)


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


class HealthResponse(BaseModel):
    status: str
