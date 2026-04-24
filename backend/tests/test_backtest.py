"""
test_backtest.py — 포트폴리오 상태 및 백테스트 엔진 단위 테스트.
"""

import pandas as pd
import pytest

from app.services.backtest import BacktestResult, compute_metrics, run_backtest
from app.services.personas import Coward
from app.services.portfolio import ActionType, BUY, HOLD, SELL_ALL, PortfolioState


# ---------------------------------------------------------------------------
# PortfolioState 테스트
# ---------------------------------------------------------------------------

def test_portfolio_buy_reduces_cash():
    """매수 후 현금이 정확히 차감되어야 한다."""
    state = PortfolioState(cash=10000.0)
    price = 100.0
    shares = 10.0
    fee = 0.0005
    state.apply(BUY(shares), price, fee=fee)

    expected_cost = shares * price * (1 + fee)
    assert abs(state.cash - (10000.0 - expected_cost)) < 1e-6
    assert state.shares == shares
    assert state.entry_price == price


def test_portfolio_sell_restores_cash():
    """매도 후 현금이 수수료 차감분 반영하여 증가해야 한다."""
    state = PortfolioState(cash=9000.0, shares=10.0, entry_price=90.0)
    price = 100.0
    fee = 0.0005
    trade = state.apply(SELL_ALL, price, fee=fee)

    expected_proceeds = 10.0 * price * (1 - fee)
    assert abs(state.cash - (9000.0 + expected_proceeds)) < 1e-6
    assert state.shares == 0.0
    assert state.entry_price is None
    assert trade["pnl"] > 0  # 90 → 100 이므로 수익


def test_portfolio_buy_sell_cycle():
    """매수 → 매도 사이클 후 현금이 초기값보다 적어야 한다 (수수료 2회 차감)."""
    initial = 10000.0
    state = PortfolioState(cash=initial)
    price = 100.0
    shares = 10.0

    state.apply(BUY(shares), price, fee=0.0005)
    state.apply(SELL_ALL, price, fee=0.0005)  # 같은 가격에 매도 → 수수료만 손해

    assert state.cash < initial  # 수수료 때문에 손실
    assert abs(state.cash - initial) < 2.0  # 수수료는 소액이어야 함
    assert state.shares == 0.0


def test_portfolio_no_double_buy():
    """이미 보유 중에 BUY를 보내면 None을 반환하고 상태가 변하지 않아야 한다."""
    state = PortfolioState(cash=8000.0, shares=10.0, entry_price=100.0)
    result = state.apply(BUY(5.0), 105.0)
    assert result is None
    assert state.shares == 10.0  # 변화 없음


def test_portfolio_total_value():
    """total_value = cash + shares * price."""
    state = PortfolioState(cash=5000.0, shares=10.0, entry_price=100.0)
    assert abs(state.total_value(120.0) - 6200.0) < 1e-6


# ---------------------------------------------------------------------------
# compute_metrics 테스트
# ---------------------------------------------------------------------------

def test_metrics_on_synthetic_flat_curve():
    """단조 평탄 equity curve: 수익률 0%, MDD 0%."""
    equity_curve = [(f"2025-01-01T{i:02d}:30:00", 10000.0) for i in range(10)]
    metrics = compute_metrics(equity_curve, [], initial_capital=10000.0)
    assert metrics["total_return_pct"] == 0.0
    assert metrics["mdd_pct"] == 0.0


def test_metrics_mdd_on_known_curve():
    """
    알려진 곡선으로 MDD 검증.
    10000 → 12000 → 9000: MDD = (9000 - 12000) / 12000 = -25%
    """
    equity_curve = [
        ("2025-01-01T09:30:00", 10000.0),
        ("2025-01-01T10:30:00", 12000.0),
        ("2025-01-01T11:30:00", 9000.0),
    ]
    metrics = compute_metrics(equity_curve, [], initial_capital=10000.0)
    assert abs(metrics["mdd_pct"] - (-25.0)) < 0.01


def test_metrics_win_rate():
    """수익 거래 1개, 손실 거래 1개 → 승률 0.5."""
    trades = [
        {"action": "BUY", "price": 100.0, "shares": 10.0, "cost": 1000.5, "timestamp": "2025-01-01T09:30:00"},
        {"action": "SELL", "price": 110.0, "shares": 10.0, "proceeds": 1099.45, "pnl": 99.0, "timestamp": "2025-01-01T11:30:00"},
        {"action": "BUY", "price": 110.0, "shares": 9.0, "cost": 990.5, "timestamp": "2025-01-01T12:30:00"},
        {"action": "SELL", "price": 100.0, "shares": 9.0, "proceeds": 899.55, "pnl": -89.0, "timestamp": "2025-01-01T13:30:00"},
    ]
    equity_curve = [("2025-01-01T09:30:00", 10000.0)] * 4
    metrics = compute_metrics(equity_curve, trades, initial_capital=10000.0)
    assert abs(metrics["win_rate"] - 0.5) < 1e-6


# ---------------------------------------------------------------------------
# run_backtest 통합 테스트
# ---------------------------------------------------------------------------

def make_df(closes: list[float]) -> pd.DataFrame:
    n = len(closes)
    idx = pd.date_range("2025-01-01 09:30", periods=n, freq="1h", tz="America/New_York")
    return pd.DataFrame(
        {
            "open": closes,
            "high": [c * 1.002 for c in closes],
            "low": [c * 0.998 for c in closes],
            "close": closes,
            "volume": [1_000_000] * n,
        },
        index=idx,
    )


def test_run_backtest_with_coward_completes():
    """실제 데이터로 겁쟁이 백테스트가 에러 없이 완주하고 결과 구조가 올바른지 확인."""
    from app.services.data_loader import load_ohlcv

    df = load_ohlcv("AAPL", period_months=1)
    result = run_backtest(df, Coward(), predictor=None)

    assert isinstance(result, BacktestResult)
    assert result.persona_id == "coward"
    assert len(result.equity_curve) > 0
    assert "total_return_pct" in result.metrics
    assert "mdd_pct" in result.metrics


def test_run_backtest_equity_consistency():
    """
    equity_curve의 마지막 값이 최종 포트폴리오 가치와 일치해야 한다.
    (보유 주식이 없는 상태면 equity = cash)
    """
    from app.services.data_loader import load_ohlcv

    df = load_ohlcv("AAPL", period_months=1)
    result = run_backtest(df, Coward(), predictor=None, initial_capital=10000.0)

    last_equity = result.equity_curve[-1][1]
    assert last_equity > 0  # 음수 자산 불가
