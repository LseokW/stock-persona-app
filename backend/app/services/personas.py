"""
personas.py — 4개 페르소나 의사결정 로직.

v2 구조:
  - 규칙 기반 3개: 겁쟁이(coward), 야수(beast), 청개구리(contrarian)
  - ML 기반 1개: AI형(ai)

모든 페르소나는 Persona ABC를 상속하고 decide(ctx) 하나만 구현한다.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

import pandas as pd

from .portfolio import Action, BUY, HOLD, SELL_ALL, PortfolioState


@dataclass
class DecisionContext:
    """
    페르소나가 의사결정에 필요한 모든 정보를 담는 컨테이너.

    history: 현재 시점(t)까지의 OHLCV (df.iloc[:t+1]).
             현재 봉 종가까지 포함. 시간 갭 신경 쓰지 않고 행 번호로만 접근.
    current_price: df.iloc[t]["close"] — history.iloc[-1]["close"]와 동일.
    state: 현재 포트폴리오 상태 (현금, 보유 주식, 진입가).
    predictor: AI형만 사용. 나머지는 None.
    """

    history: pd.DataFrame
    current_price: float
    state: PortfolioState
    predictor: object | None = None


class Persona(ABC):
    id: str
    name: str
    type: str  # "rule_based" | "ml_based"

    @abstractmethod
    def decide(self, ctx: DecisionContext) -> Action:
        pass


class Coward(Persona):
    """
    겁쟁이 — 이동평균 기반, 보수적 진입.

    매수 조건:
      1. 최근 12봉 MA가 그 이전 12봉 MA보다 높음 (상승 추세)
      2. 현재가가 12봉 MA에 ±0.5% 이내 (MA 근처에서만 진입)
    포지션: 자본의 20%
    매도: 진입가 대비 ±2% 이탈 시 전량 매도
    """

    id = "coward"
    name = "겁쟁이"
    type = "rule_based"

    def decide(self, ctx: DecisionContext) -> Action:
        # 최소 13봉이 있어야 두 MA를 비교할 수 있음
        if len(ctx.history) < 13:
            return HOLD

        closes = ctx.history["close"]
        ma12 = closes.tail(12).mean()
        ma12_prev = closes.iloc[-13:-1].mean()
        ma_rising = ma12 > ma12_prev
        near_ma = abs(ctx.current_price - ma12) / ma12 < 0.005

        if not ctx.state.holding and ma_rising and near_ma:
            shares = ctx.state.cash * 0.20 / ctx.current_price
            return BUY(shares)

        if ctx.state.holding:
            entry = ctx.state.entry_price
            if abs(ctx.current_price - entry) / entry > 0.02:
                return SELL_ALL

        return HOLD


class Beast(Persona):
    """
    야수 — 모멘텀 추격.

    매수 조건: 직전 3봉 수익률 합 > +0.5%
    포지션: 자본의 80%
    매도: 직전 1봉 수익률 < -0.3%
    """

    id = "beast"
    name = "야수"
    type = "rule_based"

    def decide(self, ctx: DecisionContext) -> Action:
        # 수익률 계산에 최소 4봉 필요 (pct_change로 3개 수익률을 얻으려면)
        if len(ctx.history) < 4:
            return HOLD

        returns = ctx.history["close"].pct_change().tail(3).sum()

        if not ctx.state.holding and returns > 0.005:
            shares = ctx.state.cash * 0.80 / ctx.current_price
            return BUY(shares)

        if ctx.state.holding:
            last_return = ctx.history["close"].pct_change().iloc[-1]
            if last_return < -0.003:
                return SELL_ALL

        return HOLD


class Contrarian(Persona):
    """
    청개구리 — 역추세 (급락 후 반등 기대).

    매수 조건: 직전 1봉 수익률 < -1%
    포지션: 자본의 50%
    매도: 진입가 대비 +1% 수익 또는 -1% 손실
    """

    id = "contrarian"
    name = "청개구리"
    type = "rule_based"

    def decide(self, ctx: DecisionContext) -> Action:
        if len(ctx.history) < 2:
            return HOLD

        last_return = ctx.history["close"].pct_change().iloc[-1]

        if not ctx.state.holding and last_return < -0.01:
            shares = ctx.state.cash * 0.50 / ctx.current_price
            return BUY(shares)

        if ctx.state.holding:
            entry = ctx.state.entry_price
            change = (ctx.current_price - entry) / entry
            if change > 0.01 or change < -0.01:
                return SELL_ALL

        return HOLD


class AIPersona(Persona):
    """
    AI형 — LSTM 모델 예측 기반.

    매수 조건: 상승 확률 p > 0.48
    포지션: 자본의 50%
    매도 조건: p < 0.42
    """

    id = "ai"
    name = "AI형"
    type = "ml_based"

    BUY_THRESHOLD = 0.48
    SELL_THRESHOLD = 0.42

    def decide(self, ctx: DecisionContext) -> Action:
        if ctx.predictor is None:
            return HOLD

        window = ctx.history.tail(24)
        if len(window) < 24:
            return HOLD

        p = ctx.predictor.predict(window)

        if not ctx.state.holding and p > self.BUY_THRESHOLD:
            shares = ctx.state.cash * 0.50 / ctx.current_price
            return BUY(shares)

        if ctx.state.holding and p < self.SELL_THRESHOLD:
            return SELL_ALL

        return HOLD


# 백테스트 엔진에서 반복할 전체 페르소나 목록
ALL_PERSONAS = [Coward(), Beast(), Contrarian(), AIPersona()]
