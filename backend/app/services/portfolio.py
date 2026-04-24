"""
portfolio.py — 포트폴리오 상태 관리.

단일 종목, 단일 포지션(동시에 1개만 보유) 모델.
"""

from dataclasses import dataclass
from enum import Enum


class ActionType(Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


@dataclass
class Action:
    type: ActionType
    shares: float = 0.0  # BUY일 때만 의미 있음


# 편의 생성자
def BUY(shares: float) -> Action:
    return Action(ActionType.BUY, shares)


SELL_ALL = Action(ActionType.SELL)
HOLD = Action(ActionType.HOLD)


@dataclass
class PortfolioState:
    cash: float
    shares: float = 0.0
    entry_price: float | None = None  # 매수 진입 가격 (매도 시 손익 계산용)

    @property
    def holding(self) -> bool:
        """현재 포지션을 보유 중인지 여부."""
        return self.shares > 0

    def total_value(self, current_price: float) -> float:
        """현재 평가 자산 = 현금 + 보유 주식 평가액."""
        return self.cash + self.shares * current_price

    def apply(self, action: Action, price: float, fee: float = 0.0005) -> dict | None:
        """
        액션을 실행하고 거래 내역(dict)을 반환한다.
        HOLD이거나 조건 미충족이면 None 반환.

        수수료 처리:
          - 매수: 실제 지출 = shares × price × (1 + fee)
          - 매도: 실제 수령 = shares × price × (1 - fee)
        """
        if action.type == ActionType.BUY and not self.holding:
            cost = action.shares * price * (1 + fee)
            if cost > self.cash:
                return None  # 현금 부족 → 거래 안 함
            self.cash -= cost
            self.shares = action.shares
            self.entry_price = price
            return {
                "action": "BUY",
                "price": price,
                "shares": action.shares,
                "cost": cost,
            }

        if action.type == ActionType.SELL and self.holding:
            proceeds = self.shares * price * (1 - fee)
            sold_shares = self.shares
            # 손익 = (현재가 - 진입가) × 수량 × (1 - fee) 근사
            pnl = (price - self.entry_price) * sold_shares * (1 - fee)
            self.cash += proceeds
            self.shares = 0.0
            self.entry_price = None
            return {
                "action": "SELL",
                "price": price,
                "shares": sold_shares,
                "proceeds": proceeds,
                "pnl": pnl,
            }

        return None  # HOLD 또는 조건 미충족
