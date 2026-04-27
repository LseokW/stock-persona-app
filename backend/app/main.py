from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import backtest, validate
from app.auth.router import router as auth_router
from app.config import settings
from app.database import init_db
from app.routers.checkout import router as checkout_router
from app.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Stock Persona Backtest API", version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(validate.router, prefix="/api", tags=["validate"])
app.include_router(backtest.router, prefix="/api", tags=["backtest"])
app.include_router(auth_router)
app.include_router(checkout_router)


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok")
