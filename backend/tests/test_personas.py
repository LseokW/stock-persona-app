"""
test_personas.py — 각 페르소나의 decide() 단위 테스트.
"""

import pandas as pd
import pytest

from app.services.personas import AIPersona, Beast, Contrarian, Coward
from app.services.portfolio import ActionType, PortfolioState


# ---------------------------------------------------------------------------
# 헬퍼: 단조 증가/감소 close 시리즈를 가진 더미 DataFrame 생성
# ---------------------------------------------------------------------------

def make_df(closes: list[float]) -> pd.DataFrame:
    """close 값 리스트로 최소한의 OHLCV DataFrame을 만든다."""
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


def make_state(cash=10000.0, shares=0.0, entry=None) -> PortfolioState:
    return PortfolioState(cash=cash, shares=shares, entry_price=entry)


# ---------------------------------------------------------------------------
# Coward 테스트
# ---------------------------------------------------------------------------

def test_coward_holds_without_enough_data():
    """history가 13봉 미만이면 반드시 HOLD."""
    from app.services.personas import DecisionContext, HOLD

    coward = Coward()
    df = make_df([100.0] * 12)
    ctx = DecisionContext(
        history=df,
        current_price=100.0,
        state=make_state(),
    )
    action = coward.decide(ctx)
    assert action.type == ActionType.HOLD


def test_coward_buys_on_rising_ma_near_price():
    """MA가 상승 중이고 현재가가 MA에 ±0.5% 이내면 BUY."""
    from app.services.personas import DecisionContext

    coward = Coward()
    # 완만한 상승 추세: 이전 12봉 평균 < 최신 12봉 평균
    # 현재가를 최신 MA에 가깝게 맞춤
    closes = list(range(100, 126))  # 26봉, 100~125
    df = make_df(closes)
    current_price = float(df["close"].tail(12).mean())  # MA와 동일 → near_ma 조건 충족
    ctx = DecisionContext(
        history=df,
        current_price=current_price,
        state=make_state(),
    )
    action = coward.decide(ctx)
    assert action.type == ActionType.BUY


# ---------------------------------------------------------------------------
# Beast 테스트
# ---------------------------------------------------------------------------

def test_beast_holds_without_enough_data():
    """history가 4봉 미만이면 HOLD."""
    from app.services.personas import DecisionContext

    beast = Beast()
    df = make_df([100.0, 101.0, 102.0])
    ctx = DecisionContext(
        history=df,
        current_price=102.0,
        state=make_state(),
    )
    action = beast.decide(ctx)
    assert action.type == ActionType.HOLD


def test_beast_buys_on_momentum():
    """직전 3봉 수익률 합 > 0.5%이면 BUY."""
    from app.services.personas import DecisionContext

    beast = Beast()
    # 3봉 수익률 합이 +0.5% 초과가 되도록 설정
    closes = [100.0, 100.2, 100.5, 100.9, 101.4]  # 각 봉 약 +0.2~0.5%씩 상승
    df = make_df(closes)
    ctx = DecisionContext(
        history=df,
        current_price=closes[-1],
        state=make_state(),
    )
    action = beast.decide(ctx)
    assert action.type == ActionType.BUY


def test_beast_sells_on_down_tick():
    """보유 중 직전 수익률 < -0.3%이면 SELL."""
    from app.services.personas import DecisionContext

    beast = Beast()
    closes = [100.0, 100.5, 100.8, 100.2]  # 마지막 봉 -0.6% 하락
    df = make_df(closes)
    ctx = DecisionContext(
        history=df,
        current_price=closes[-1],
        state=make_state(cash=8000.0, shares=20.0, entry=100.5),
    )
    action = beast.decide(ctx)
    assert action.type == ActionType.SELL


# ---------------------------------------------------------------------------
# Contrarian 테스트
# ---------------------------------------------------------------------------

def test_contrarian_buys_on_drop():
    """직전 1봉 수익률 < -1%이면 BUY."""
    from app.services.personas import DecisionContext

    contrarian = Contrarian()
    closes = [100.0, 98.5]  # -1.5% 하락
    df = make_df(closes)
    ctx = DecisionContext(
        history=df,
        current_price=closes[-1],
        state=make_state(),
    )
    action = contrarian.decide(ctx)
    assert action.type == ActionType.BUY


def test_contrarian_holds_on_small_drop():
    """직전 수익률이 -1% 미만(작은 하락)이면 HOLD."""
    from app.services.personas import DecisionContext

    contrarian = Contrarian()
    closes = [100.0, 99.5]  # -0.5% → 매수 조건 미충족
    df = make_df(closes)
    ctx = DecisionContext(
        history=df,
        current_price=closes[-1],
        state=make_state(),
    )
    action = contrarian.decide(ctx)
    assert action.type == ActionType.HOLD


# ---------------------------------------------------------------------------
# AIPersona 테스트
# ---------------------------------------------------------------------------

def test_ai_holds_without_predictor():
    """predictor=None이면 항상 HOLD."""
    from app.services.personas import DecisionContext

    ai = AIPersona()
    closes = [100.0] * 30
    df = make_df(closes)
    ctx = DecisionContext(
        history=df,
        current_price=100.0,
        state=make_state(),
        predictor=None,  # predictor 없음
    )
    action = ai.decide(ctx)
    assert action.type == ActionType.HOLD


def test_ai_holds_with_insufficient_window():
    """history가 24봉 미만이면 HOLD (predictor가 있어도)."""
    from app.services.personas import DecisionContext

    class FakePredictor:
        def predict(self, window_df):
            return 0.9  # 항상 높은 확률

    ai = AIPersona()
    df = make_df([100.0] * 20)  # 24봉 미만
    ctx = DecisionContext(
        history=df,
        current_price=100.0,
        state=make_state(),
        predictor=FakePredictor(),
    )
    action = ai.decide(ctx)
    assert action.type == ActionType.HOLD


def test_ai_buys_on_high_probability():
    """predictor가 p > BUY_THRESHOLD를 반환하면 BUY."""
    from app.services.personas import DecisionContext

    class FakePredictor:
        def predict(self, window_df):
            return 0.80  # BUY_THRESHOLD(0.48) 초과

    ai = AIPersona()
    df = make_df([100.0] * 30)
    ctx = DecisionContext(
        history=df,
        current_price=100.0,
        state=make_state(),
        predictor=FakePredictor(),
    )
    action = ai.decide(ctx)
    assert action.type == ActionType.BUY
