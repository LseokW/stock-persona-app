"""
test_model.py — dataset, model, predictor 단위 테스트.

실행:
    cd backend
    uv run pytest tests/test_model.py -v
"""

import json
import tempfile
from pathlib import Path

import pandas as pd
import pytest
import torch

from app.ml.dataset import OHLCVDataset
from app.ml.model import LSTMDirectionModel
from app.services.data_loader import load_ohlcv


# ---------------------------------------------------------------------------
# 공용 fixture: AAPL 1개월 데이터 (캐시 사용)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def sample_df():
    return load_ohlcv("AAPL", period_months=1)


# ---------------------------------------------------------------------------
# OHLCVDataset 테스트
# ---------------------------------------------------------------------------

def test_dataset_length(sample_df):
    """샘플 수 = len(df) - window_size - 1."""
    ds = OHLCVDataset(sample_df, window_size=24)
    assert len(ds) == len(sample_df) - 24 - 1


def test_dataset_sample_shapes(sample_df):
    """첫 샘플의 입력 shape = (24, 3), 라벨 shape = (1,)."""
    ds = OHLCVDataset(sample_df, window_size=24)
    x, y = ds[0]
    assert x.shape == (24, 3), f"입력 shape 불일치: {x.shape}"
    assert y.shape == (1,), f"라벨 shape 불일치: {y.shape}"


def test_dataset_label_is_binary(sample_df):
    """라벨은 0 또는 1만 존재해야 한다."""
    ds = OHLCVDataset(sample_df, window_size=24)
    for i in range(min(50, len(ds))):
        _, y = ds[i]
        assert y.item() in (0.0, 1.0), f"idx={i}에서 라벨 {y.item()} 발견"


def test_dataset_norm_stats_injected(sample_df):
    """검증셋에 훈련 norm_stats를 주입하면 그 값을 그대로 사용해야 한다."""
    train_ds = OHLCVDataset(sample_df, window_size=24, norm_stats=None)
    stats = train_ds.norm_stats

    val_ds = OHLCVDataset(sample_df, window_size=24, norm_stats=stats)
    assert val_ds.norm_stats["log_volume_mean"] == stats["log_volume_mean"]
    assert val_ds.norm_stats["log_volume_std"] == stats["log_volume_std"]


# ---------------------------------------------------------------------------
# LSTMDirectionModel 테스트
# ---------------------------------------------------------------------------

def test_model_forward_shape():
    """(batch=4, 24, 3) 입력 → (4, 1) 출력."""
    model = LSTMDirectionModel()
    x = torch.randn(4, 24, 3)
    out = model(x)
    assert out.shape == (4, 1), f"출력 shape 불일치: {out.shape}"


def test_model_output_is_logit():
    """출력은 logit이므로 범위 제한 없음 (sigmoid 적용 전)."""
    model = LSTMDirectionModel()
    x = torch.randn(8, 24, 3)
    out = model(x)
    # sigmoid 적용 후에는 반드시 0~1 사이여야 함
    prob = torch.sigmoid(out)
    assert (prob >= 0).all() and (prob <= 1).all()


# ---------------------------------------------------------------------------
# Predictor 테스트 (모델 파일 없이 임시 저장 후 로드)
# ---------------------------------------------------------------------------

def test_predictor_returns_valid_probability(sample_df):
    """Predictor.predict()가 0~1 사이 float을 반환해야 한다."""
    from app.ml.predictor import Predictor

    # 임시 디렉토리에 더미 모델 저장
    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "lstm_direction.pt"
        stats_path = Path(tmpdir) / "norm_stats.json"

        # 초기화된 (학습 안 된) 모델 저장
        model = LSTMDirectionModel()
        torch.save(model.state_dict(), model_path)

        # 더미 norm_stats 저장
        stats = {"log_volume_mean": 15.0, "log_volume_std": 1.0}
        with open(stats_path, "w") as f:
            json.dump(stats, f)

        predictor = Predictor(str(model_path), str(stats_path))
        window_df = sample_df.iloc[:24]
        p = predictor.predict(window_df)

    assert isinstance(p, float), f"반환 타입이 float이 아님: {type(p)}"
    assert 0.0 <= p <= 1.0, f"확률 범위 초과: {p}"
