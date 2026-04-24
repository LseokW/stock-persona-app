from fastapi import APIRouter

from app.schemas import ValidateResponse
from app.services.data_loader import validate_sp500_ticker

router = APIRouter()


@router.get("/validate/{ticker}", response_model=ValidateResponse)
def validate(ticker: str):
    ticker_upper = ticker.upper()
    return ValidateResponse(ticker=ticker_upper, valid=validate_sp500_ticker(ticker_upper))
