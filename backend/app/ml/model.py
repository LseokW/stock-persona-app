"""
model.py — LSTM 기반 방향 예측 모델.

입력: (batch, 24, 6) — 6개 피처 (log_return, range_ratio, log_volume_norm, rsi, macd, bb)
출력: logit scalar. 추론 시 sigmoid 적용 → p ∈ [0, 1]
"""

import torch
import torch.nn as nn


class LSTMDirectionModel(nn.Module):
    def __init__(
        self,
        input_size: int = 6,
        hidden_size: int = 64,
        num_layers: int = 1,
        dropout: float = 0.3,
    ):
        super().__init__()

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.0,
        )

        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.lstm(x)
        last_hidden = out[:, -1, :]
        return self.fc(last_hidden)
