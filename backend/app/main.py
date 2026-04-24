from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import backtest, validate
from app.schemas import HealthResponse

app = FastAPI(title="Stock Persona Backtest API", version="0.2.0")

# 개발 중에는 모든 origin 허용 (배포 시 수정 필요)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(validate.router, prefix="/api", tags=["validate"])
app.include_router(backtest.router, prefix="/api", tags=["backtest"])


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok")
