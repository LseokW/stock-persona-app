"""
dataset.py — OHLCV DataFrame을 LSTM 학습용 PyTorch Dataset으로 변환.

핵심 설계 원칙:
  - 행 번호 기반 슬라이딩 윈도우 (시간 연속성 가정 금지)
    이유: 장 마감/주말/공휴일로 인한 시간 갭이 존재하기 때문.
  - 정규화 통계는 훈련셋에서만 계산, 검증/테스트셋은 그 통계를 주입받음
    이유: 미래 정보가 훈련에 섞이는 데이터 유출 방지.
"""

import math

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset


class OHLCVDataset(Dataset):
    """
    슬라이딩 윈도우 방식으로 LSTM 입력 샘플을 구성한다.

    피처 (3개):
      1. log_return      = log(close_t / close_{t-1})
         → 절대 가격 대신 수익률을 쓰는 이유: 가격 범위(245~287)가 종목마다 다르므로
           수익률로 바꾸면 종목 간 스케일이 비슷해진다.
      2. range_ratio     = (high - low) / close
         → 변동성의 대리 지표. 값이 클수록 그 시간에 가격이 크게 흔들렸음.
      3. log_volume_norm = (log(volume) - mean) / std
         → 거래량은 최대/최소 비율이 42배(6~8자리)라 직접 쓰면 스케일 문제 발생.
           log 변환 후 Z-score 정규화.

    라벨:
      label_t = 1 if close_{t+1} > close_t else 0
      즉, "다음 봉에서 가격이 오를 것인가"를 이진 분류.
    """

    def __init__(
        self,
        df: pd.DataFrame,
        window_size: int = 24,
        norm_stats: dict | None = None,
    ):
        """
        Parameters
        ----------
        df : pd.DataFrame
            load_ohlcv()의 반환값. 컬럼: open, high, low, close, volume.
        window_size : int
            입력으로 사용할 과거 봉 개수. 기본 24 = 하루치.
        norm_stats : dict | None
            None → 이 df로부터 log_volume의 mean/std를 직접 계산 (훈련셋에서 사용).
            dict → 주어진 통계를 그대로 사용 (검증/테스트셋에서 사용).
            구조: {"log_volume_mean": float, "log_volume_std": float}
        """
        self.window_size = window_size

        # --- 피처 계산 ---

        # [데이터 유출 방지] log_return은 과거 종가만 참조 (t-1 → t 방향)
        # shift(1)은 한 칸 뒤로 밀기 = 현재 행이 이전 행의 값을 참조
        # shift(-1) 같은 미래 참조는 절대 사용하지 않음
        log_return = np.log(df["close"] / df["close"].shift(1))  # NaN at row 0

        range_ratio = (df["high"] - df["low"]) / df["close"]

        log_volume = np.log(df["volume"].astype(float))

        # [데이터 유출 방지] 정규화 통계는 훈련셋에서만 계산
        if norm_stats is None:
            # 훈련셋: 이 df 자체에서 통계 계산
            lv_mean = float(log_volume.mean())
            lv_std = float(log_volume.std())
            self._norm_stats = {
                "log_volume_mean": lv_mean,
                "log_volume_std": lv_std,
            }
        else:
            # 검증/테스트셋: 훈련셋에서 받아온 통계 사용 (자체 계산 금지)
            lv_mean = norm_stats["log_volume_mean"]
            lv_std = norm_stats["log_volume_std"]
            self._norm_stats = norm_stats

        log_volume_norm = (log_volume - lv_mean) / (lv_std + 1e-8)

        # 세 피처를 하나의 2D 배열로 합치기: shape = (len(df), 3)
        features = np.stack(
            [log_return.values, range_ratio.values, log_volume_norm.values],
            axis=1,
        ).astype(np.float32)

        # [데이터 유출 방지] 라벨: close_{t+1} > close_t
        # iloc[i] 행의 라벨은 iloc[i+1]의 종가와 비교
        # 마지막 행은 다음 봉이 없으므로 라벨 생성 불가 → 제거됨 (아래 __len__ 참고)
        labels = (df["close"].shift(-1) > df["close"]).astype(np.float32).values

        self.features = features  # (N, 3)
        self.labels = labels      # (N,)

        # row 0의 log_return은 NaN (이전 봉 없음) → window_size 이상 인덱스부터 안전
        # 첫 번째 윈도우의 시작 행이 최소 row 1 이상이어야 NaN을 피할 수 있음
        # → __getitem__에서 idx=0이면 features[0:24]를 쓰므로 row 0(NaN)이 포함됨
        # → 이를 막기 위해 슬라이스 시작을 row 1로 강제 (window는 [idx+1 : idx+1+window])
        # 실제로는 log_return[0] = NaN이지만 모델이 이걸 배우지 않도록
        # 가장 단순한 방법: NaN을 0으로 채움 (수익률 0 = 변화 없음으로 해석)
        self.features[~np.isfinite(self.features)] = 0.0

    def __len__(self) -> int:
        # 샘플 수 = 전체 행 수 - window_size - 1
        # window_size개를 입력으로 쓰고, 그 다음 행을 라벨로 쓰므로
        # 마지막 가능한 윈도우 끝 = len - 2 (라벨 행 = len - 1)
        return len(self.features) - self.window_size - 1

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        """
        idx번째 샘플을 반환한다.

        [데이터 유출 방지]
          - 입력: features[idx : idx + window_size]  (과거 24봉)
          - 라벨: labels[idx + window_size]           (바로 다음 봉의 방향)
          - 반드시 행 번호(iloc) 기준. 시간 인덱스 사용 금지.
        """
        x = self.features[idx : idx + self.window_size]          # (24, 3)
        y = self.labels[idx + self.window_size]                   # scalar

        return (
            torch.tensor(x, dtype=torch.float32),
            torch.tensor([y], dtype=torch.float32),               # (1,)
        )

    @property
    def norm_stats(self) -> dict:
        """훈련셋에서 계산한 정규화 통계. 검증/테스트 Dataset 생성 시 전달용."""
        return self._norm_stats
