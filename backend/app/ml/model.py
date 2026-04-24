"""
model.py — LSTM 기반 방향 예측 모델.

설계 이유:
  데이터가 ~600 샘플(훈련셋)이라 파라미터가 많으면 금방 과적합된다.
  hidden_size=32, num_layers=1로 의도적으로 작게 유지.

출력:
  logit (sigmoid 적용 전 값). sigmoid는 BCEWithLogitsLoss가 내부에서 처리.
  추론 시에는 sigmoid를 직접 적용해서 확률 p ∈ [0, 1]로 변환.
"""

import torch
import torch.nn as nn


class LSTMDirectionModel(nn.Module):
    """
    구조:
      LSTM → 마지막 hidden state → Linear(hidden, 16) → ReLU → Dropout → Linear(16, 1)

    왜 마지막 hidden state만 쓰는가:
      LSTM은 매 스텝마다 hidden state를 출력하지만,
      마지막 스텝의 hidden state가 24봉 전체 시퀀스의 정보를 압축하고 있다.
      분류 문제에서는 이것만 사용하는 것이 가장 일반적이다.
    """

    def __init__(
        self,
        input_size: int = 3,
        hidden_size: int = 32,
        num_layers: int = 1,
        dropout: float = 0.2,
    ):
        """
        Parameters
        ----------
        input_size : int
            피처 수. log_return, range_ratio, log_volume_norm = 3.
        hidden_size : int
            LSTM 내부 차원. 작을수록 단순한 패턴만 학습.
        num_layers : int
            LSTM 레이어 수. 1이면 단층 LSTM.
        dropout : float
            FC 레이어 직전 Dropout 비율. 과적합 방지.
        """
        super().__init__()

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,   # 입력 shape = (batch, seq, feature)
            dropout=0.0,        # num_layers=1이면 LSTM 내부 dropout 효과 없음
        )

        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 16),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(16, 1),
            # sigmoid는 여기서 적용하지 않음
            # BCEWithLogitsLoss가 내부에서 수치적으로 안정적으로 처리함
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Parameters
        ----------
        x : torch.Tensor, shape = (batch, 24, 3)

        Returns
        -------
        torch.Tensor, shape = (batch, 1)
            logit 값. 확률로 변환하려면 torch.sigmoid(output) 사용.
        """
        # LSTM 실행
        # out: (batch, seq=24, hidden=32) — 각 타임스텝의 hidden state
        # _:  (h_n, c_n) — 마지막 hidden/cell state
        out, _ = self.lstm(x)

        # 마지막 타임스텝(봉)의 hidden state만 사용: (batch, hidden=32)
        last_hidden = out[:, -1, :]

        # FC 레이어를 통과시켜 logit 반환: (batch, 1)
        logit = self.fc(last_hidden)
        return logit
