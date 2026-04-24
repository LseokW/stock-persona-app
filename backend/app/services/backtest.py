"""
backtest.py — 백테스트 시뮬레이션 엔진.

핵심 원칙:
  - 시점 t에서는 df.iloc[:t+1] (과거 + 현재 봉)까지만 볼 수 있다.
  - 미래 봉(t+1 이후)은 절대 참조하지 않는다.
  - 첫 24봉은 AI형 predictor의 윈도우 워밍업 구간으로 건너뛴다.
"""

from dataclasses import dataclass

import numpy as np
import pandas as pd

from .personas import ALL_PERSONAS, DecisionContext, Persona
from .portfolio import PortfolioState


@dataclass
class BacktestResult:
    persona_id: str
    persona_name: str
    persona_type: str
    equity_curve: list   # [(timestamp_iso_str, float), ...]
    trades: list         # [{"timestamp", "action", "price", ...}, ...]
    metrics: dict


def run_backtest(
    df: pd.DataFrame,
    persona: Persona,
    predictor=None,
    initial_capital: float = 10000.0,
    fee: float = 0.0005,
) -> BacktestResult:
    """
    단일 페르소나의 백테스트를 실행한다.

    Parameters
    ----------
    df : pd.DataFrame
        load_ohlcv()의 반환값. 컬럼: open, high, low, close, volume.
    persona : Persona
        실행할 페르소나 인스턴스.
    predictor : Predictor | None
        AI형 페르소나에서만 사용. 나머지는 None.
    initial_capital : float
        시작 자본금 (USD).
    fee : float
        매수/매도 각각 적용되는 수수료율.
    """
    state = PortfolioState(cash=initial_capital)
    equity_curve = []
    trades = []

    # 첫 24봉은 건너뜀: AI형이 24봉 윈도우를 채워야 첫 예측 가능
    start_idx = 24

    for t in range(start_idx, len(df)):
        ctx = DecisionContext(
            history=df.iloc[:t + 1],           # 현재 봉(t) 포함
            current_price=float(df.iloc[t]["close"]),
            state=state,
            predictor=predictor,
        )

        action = persona.decide(ctx)
        trade = state.apply(action, ctx.current_price, fee=fee)

        if trade is not None:
            trade["timestamp"] = df.index[t].isoformat()
            trades.append(trade)

        equity_curve.append(
            (df.index[t].isoformat(), state.total_value(ctx.current_price))
        )

    metrics = compute_metrics(equity_curve, trades, initial_capital)

    return BacktestResult(
        persona_id=persona.id,
        persona_name=persona.name,
        persona_type=persona.type,
        equity_curve=equity_curve,
        trades=trades,
        metrics=metrics,
    )


def compute_metrics(
    equity_curve: list,
    trades: list,
    initial_capital: float,
) -> dict:
    """
    equity_curve와 trades로부터 성과 지표를 계산한다.
    """
    if not equity_curve:
        return {}

    values = np.array([v for _, v in equity_curve])
    final = values[-1]
    total_return_pct = (final / initial_capital - 1) * 100

    # MDD: 고점 대비 최대 낙폭
    peak = np.maximum.accumulate(values)
    drawdown = (values - peak) / peak
    mdd_pct = float(drawdown.min()) * 100

    # 승률: SELL 거래 중 pnl > 0인 비율
    sells = [t for t in trades if t["action"] == "SELL"]
    wins = [t for t in sells if t["pnl"] > 0]
    win_rate = len(wins) / len(sells) if sells else 0.0

    # 거래 횟수 (매수 기준)
    num_trades = len([t for t in trades if t["action"] == "BUY"])

    # 평균 보유 시간 (시간 단위)
    avg_hold_hours = 0.0
    if sells:
        hold_hours = []
        buys = [t for t in trades if t["action"] == "BUY"]
        # BUY와 SELL을 순서대로 페어링
        for sell, buy in zip(sells, buys):
            delta = pd.Timestamp(sell["timestamp"]) - pd.Timestamp(buy["timestamp"])
            hold_hours.append(delta.total_seconds() / 3600)
        avg_hold_hours = float(np.mean(hold_hours)) if hold_hours else 0.0

    return {
        "total_return_pct": round(total_return_pct, 2),
        "mdd_pct": round(mdd_pct, 2),
        "win_rate": round(win_rate, 3),
        "num_trades": num_trades,
        "avg_hold_hours": round(avg_hold_hours, 1),
    }


def run_all_personas(
    df: pd.DataFrame,
    predictor=None,
    initial_capital: float = 10000.0,
) -> list[BacktestResult]:
    """ALL_PERSONAS 전체를 순서대로 실행한다."""
    results = []
    for persona in ALL_PERSONAS:
        result = run_backtest(
            df, persona, predictor=predictor, initial_capital=initial_capital
        )
        results.append(result)
    return results
