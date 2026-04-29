"""
predictor.py — 학습된 LSTM 모델을 로드해서 단일 윈도우의 상승 확률을 반환하는 래퍼.

사용법:
    predictor = Predictor("models/lstm_direction.pt", "models/norm_stats.json")
    p = predictor.predict(context_df)   # context_df: 최소 CONTEXT_SIZE(60)행
"""

import json

import pandas as pd
import torch

from app.ml.dataset import compute_features
from app.ml.model import LSTMDirectionModel


class Predictor:
    CONTEXT_SIZE = 60   # 지표 계산에 필요한 최소 컨텍스트 (MACD 35+ 안정화)
    WINDOW_SIZE = 24    # LSTM 입력 시퀀스 길이

    def __init__(self, model_path: str, norm_stats_path: str):
        self.model = LSTMDirectionModel()
        state_dict = torch.load(model_path, map_location="cpu", weights_only=True)
        self.model.load_state_dict(state_dict)
        self.model.eval()

        with open(norm_stats_path, "r") as f:
            self.norm_stats = json.load(f)

    def predict(self, context_df: pd.DataFrame) -> float:
        """
        OHLCV DataFrame을 받아 상승 확률 p를 반환한다.

        context_df: 최소 CONTEXT_SIZE(60)행. 지표 계산 안정화를 위해 충분한 이력 필요.
        반환: p ∈ [0, 1]. p > 0.5 이면 상승 예측.
        """
        if len(context_df) < self.CONTEXT_SIZE:
            return 0.5

        # 컨텍스트 전체로 지표 계산 후 마지막 WINDOW_SIZE 행만 사용
        features = compute_features(context_df, self.norm_stats)
        window = features[-self.WINDOW_SIZE:]   # (24, 6)

        x = torch.tensor(window, dtype=torch.float32).unsqueeze(0)  # (1, 24, 6)

        with torch.no_grad():
            logit = self.model(x)
            p = torch.sigmoid(logit).item()

        return p
