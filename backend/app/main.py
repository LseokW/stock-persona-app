import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import backtest, validate
from app.schemas import HealthResponse

app = FastAPI(title="Stock Persona Backtest API", version="0.2.0")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,https://persona-trade-lab.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(validate.router, prefix="/api", tags=["validate"])
app.include_router(backtest.router, prefix="/api", tags=["backtest"])


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok")
