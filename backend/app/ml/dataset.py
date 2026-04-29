"""
dataset.py — OHLCV DataFrame을 LSTM 학습용 PyTorch Dataset으로 변환.

피처 6개:
  1. log_return       = log(close_t / close_{t-1})
  2. range_ratio      = (high - low) / close
  3. log_volume_norm  = (log(volume) - mean) / std
  4. rsi_norm         = (RSI(14) - 50) / 50  → [-1, 1]
  5. macd_hist_norm   = (MACD histogram) / close
  6. bb_pos           = (close - MA20) / (2 * std20)  → z-score

norm_stats는 훈련셋에서만 계산, 검증/테스트셋은 주입받는다 (데이터 유출 방지).
"""

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset


def compute_features(df: pd.DataFrame, norm_stats: dict) -> np.ndarray:
    """
    OHLCV DataFrame → (N, 6) float32 numpy array.

    norm_stats: {"log_volume_mean": float, "log_volume_std": float}
    """
    close = df["close"]

    # 1. log_return
    log_return = np.log(close / close.shift(1))

    # 2. range_ratio
    range_ratio = (df["high"] - df["low"]) / close

    # 3. log_volume_norm
    log_volume = np.log(df["volume"].astype(float))
    lv_mean = norm_stats["log_volume_mean"]
    lv_std = norm_stats["log_volume_std"]
    log_volume_norm = (log_volume - lv_mean) / (lv_std + 1e-8)

    # 4. RSI(14) — Wilder EWM, normalized to [-1, 1]
    delta = close.diff()
    avg_gain = delta.clip(lower=0).ewm(alpha=1 / 14, min_periods=1, adjust=False).mean()
    avg_loss = (-delta.clip(upper=0)).ewm(alpha=1 / 14, min_periods=1, adjust=False).mean()
    rs = avg_gain / (avg_loss + 1e-8)
    rsi_norm = (100 - 100 / (1 + rs) - 50) / 50

    # 5. MACD histogram / close
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    macd_hist_norm = (macd_line - signal_line) / (close.abs() + 1e-8)

    # 6. Bollinger Band z-score: (close - MA20) / (2 * std20)
    ma20 = close.rolling(20, min_periods=1).mean()
    std20 = close.rolling(20, min_periods=1).std().fillna(0)
    bb_pos = (close - ma20) / (2 * std20 + 1e-8)

    features = np.stack([
        log_return.values,
        range_ratio.values,
        log_volume_norm.values,
        rsi_norm.values,
        macd_hist_norm.values,
        bb_pos.values,
    ], axis=1).astype(np.float32)

    features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
    return features


class OHLCVDataset(Dataset):
    """
    슬라이딩 윈도우 방식으로 LSTM 입력 샘플을 구성한다.

    라벨: 1 if close_{t+1} > close_t else 0
    """

    def __init__(
        self,
        df: pd.DataFrame,
        window_size: int = 24,
        norm_stats: dict | None = None,
    ):
        self.window_size = window_size

        if norm_stats is None:
            log_volume = np.log(df["volume"].astype(float))
            self._norm_stats = {
                "log_volume_mean": float(log_volume.mean()),
                "log_volume_std": float(log_volume.std()),
            }
        else:
            self._norm_stats = norm_stats

        self.features = compute_features(df, self._norm_stats)
        self.labels = (df["close"].shift(-1) > df["close"]).astype(np.float32).values

    def __len__(self) -> int:
        return len(self.features) - self.window_size - 1

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        x = self.features[idx : idx + self.window_size]
        y = self.labels[idx + self.window_size]
        return (
            torch.tensor(x, dtype=torch.float32),
            torch.tensor([y], dtype=torch.float32),
        )

    @property
    def norm_stats(self) -> dict:
        return self._norm_stats
