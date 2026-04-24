"""
predictor.py — 학습된 LSTM 모델을 로드해서 단일 윈도우의 상승 확률을 반환하는 래퍼.

나중에 백테스트 엔진(3단계)에서 아래처럼 호출한다:
    predictor = Predictor("models/lstm_direction.pt", "models/norm_stats.json")
    p = predictor.predict(window_df)   # 0.0 ~ 1.0
"""

import json

import numpy as np
import pandas as pd
import torch

from app.ml.model import LSTMDirectionModel


class Predictor:
    """
    학습된 모델 파일과 정규화 통계를 로드해서 추론을 수행한다.

    설계 원칙:
      - map_location="cpu" 고정: 학습은 데스크탑(GPU 가능), 추론은 노트북(CPU).
        저장 시 GPU에 올라가 있던 가중치도 CPU에서 바로 쓸 수 있게 된다.
      - model.eval(): Dropout이 추론 시 비활성화됨. 반드시 필요.
      - torch.no_grad(): 역전파 그래프를 만들지 않아서 메모리/속도 절약.
    """

    def __init__(self, model_path: str, norm_stats_path: str):
        """
        Parameters
        ----------
        model_path : str
            models/lstm_direction.pt 경로
        norm_stats_path : str
            models/norm_stats.json 경로
        """
        # 모델 구조 생성 후 저장된 가중치 로드
        self.model = LSTMDirectionModel()
        state_dict = torch.load(model_path, map_location="cpu", weights_only=True)
        self.model.load_state_dict(state_dict)
        self.model.eval()   # Dropout 비활성화

        # 정규화 통계 로드
        with open(norm_stats_path, "r") as f:
            self.norm_stats = json.load(f)

    def predict(self, window_df: pd.DataFrame) -> float:
        """
        24행짜리 OHLCV DataFrame을 받아 상승 확률 p를 반환한다.

        Parameters
        ----------
        window_df : pd.DataFrame
            컬럼: open, high, low, close, volume. 반드시 24행.

        Returns
        -------
        float
            p ∈ [0, 1]. p > 0.5 이면 상승 예측.
        """
        if len(window_df) != 24:
            raise ValueError(f"window_df는 24행이어야 합니다. 입력: {len(window_df)}행")

        # 피처 계산 (dataset.py와 동일한 방식)
        log_return = np.log(
            window_df["close"].values / np.concatenate([[window_df["close"].values[0]], window_df["close"].values[:-1]])
        )
        # 위 계산: close[0]/close[0]=1 → log=0 (첫 행 수익률은 0으로 처리)

        range_ratio = (
            (window_df["high"] - window_df["low"]) / window_df["close"]
        ).values

        log_volume = np.log(window_df["volume"].astype(float).values)
        lv_mean = self.norm_stats["log_volume_mean"]
        lv_std = self.norm_stats["log_volume_std"]
        log_volume_norm = (log_volume - lv_mean) / (lv_std + 1e-8)

        features = np.stack(
            [log_return, range_ratio, log_volume_norm], axis=1
        ).astype(np.float32)

        # NaN/Inf 처리 (안전장치)
        features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)

        # (1, 24, 3) 텐서로 변환 후 추론
        x = torch.tensor(features).unsqueeze(0)  # batch dim 추가

        with torch.no_grad():
            logit = self.model(x)               # (1, 1)
            p = torch.sigmoid(logit).item()     # float

        return p
