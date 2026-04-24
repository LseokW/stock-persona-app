"""
test_data_loader.py — data_loader 모듈의 단위 테스트.

실행 방법 (backend/ 디렉토리에서):
    uv run pytest tests/ -v
"""

import time
import pytest
import pandas as pd

from app.services.data_loader import load_ohlcv, validate_sp500_ticker


# ---------------------------------------------------------------------------
# validate_sp500_ticker 테스트
# ---------------------------------------------------------------------------

def test_valid_ticker_aapl():
    """AAPL은 화이트리스트에 있어야 한다."""
    assert validate_sp500_ticker("AAPL") is True


def test_invalid_ticker_zzzz():
    """존재하지 않는 티커 ZZZZ는 False를 반환해야 한다."""
    assert validate_sp500_ticker("ZZZZ") is False


def test_ticker_case_insensitive():
    """소문자로 입력해도 동일하게 동작해야 한다."""
    assert validate_sp500_ticker("aapl") is True


# ---------------------------------------------------------------------------
# load_ohlcv 테스트
# ---------------------------------------------------------------------------

def test_load_ohlcv_returns_nonempty_dataframe():
    """AAPL 데이터를 받아오면 비어 있지 않은 DataFrame이어야 한다."""
    df = load_ohlcv("AAPL", period_months=1)
    assert isinstance(df, pd.DataFrame)
    assert len(df) > 0


def test_load_ohlcv_columns():
    """반환된 DataFrame의 컬럼이 정확히 5개여야 한다."""
    df = load_ohlcv("AAPL", period_months=1)
    expected = ["open", "high", "low", "close", "volume"]
    assert list(df.columns) == expected


def test_load_ohlcv_no_missing_values():
    """반환된 DataFrame에 결측치가 없어야 한다."""
    df = load_ohlcv("AAPL", period_months=1)
    assert df.isnull().sum().sum() == 0


def test_load_ohlcv_cache_is_faster(tmp_path, monkeypatch):
    """
    두 번째 호출은 캐시를 사용하므로 첫 번째 호출보다 10배 이상 빨라야 한다.

    첫 번째 호출: yfinance 네트워크 요청 (수 초)
    두 번째 호출: 로컬 parquet 읽기 (수십 밀리초)

    monkeypatch로 CACHE_DIR을 tmp_path로 교체해서
    이전 테스트의 캐시 영향을 받지 않도록 한다.
    """
    import app.services.data_loader as dl_module

    # 이 테스트에서만 캐시 디렉토리를 빈 임시 폴더로 교체
    monkeypatch.setattr(dl_module, "CACHE_DIR", tmp_path)

    # 첫 번째 호출: 캐시가 없으므로 반드시 네트워크 요청
    t0 = time.perf_counter()
    load_ohlcv("AAPL", period_months=1)
    first_call = time.perf_counter() - t0

    # 두 번째 호출: 방금 저장된 캐시 사용
    t1 = time.perf_counter()
    load_ohlcv("AAPL", period_months=1)
    second_call = time.perf_counter() - t1

    print(f"\n  첫 번째 호출: {first_call:.3f}s")
    print(f"  두 번째 호출: {second_call:.3f}s")
    print(f"  속도 비율: {first_call / second_call:.1f}x")

    assert second_call * 10 < first_call, (
        f"두 번째 호출({second_call:.3f}s)이 첫 번째({first_call:.3f}s)보다 "
        f"충분히 빠르지 않습니다. 캐시가 동작하지 않을 수 있습니다."
    )


def test_load_ohlcv_invalid_period():
    """period_months가 범위를 벗어나면 ValueError가 발생해야 한다."""
    with pytest.raises(ValueError):
        load_ohlcv("AAPL", period_months=0)

    with pytest.raises(ValueError):
        load_ohlcv("AAPL", period_months=25)
