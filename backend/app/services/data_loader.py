"""
data_loader.py — yfinance에서 OHLCV 데이터를 받아와서 parquet으로 캐싱하는 모듈.

핵심 아이디어:
  - 같은 데이터를 매번 네트워크로 받으면 느리고 API 제한에 걸릴 수 있다.
  - 한 번 받은 데이터는 로컬 파일(parquet)로 저장해두고,
    1시간 이내에 같은 요청이 오면 파일에서 바로 읽는다.
"""

import time
import datetime
from pathlib import Path

import pandas as pd
import yfinance as yf

# 이 파일 기준으로 ../../cache/ 를 가리킨다
# Path(__file__) = .../backend/app/services/data_loader.py
# .parents[2]   = .../backend/
CACHE_DIR = Path(__file__).parents[2] / "cache"
CACHE_MAX_AGE_SECONDS = 3600  # 1시간

# S&P 500 주요 구성종목 화이트리스트 (현재는 10개, 추후 확장 가능)
_SP500_WHITELIST = {
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
    "META", "TSLA", "JPM", "V", "WMT",
}

# 미국 정규장 시간: 09:30 ~ 16:00 ET
_MARKET_OPEN = datetime.time(9, 30)
_MARKET_CLOSE = datetime.time(16, 0)


def validate_sp500_ticker(ticker: str) -> bool:
    """
    티커가 S&P 500 주요 구성종목인지 확인한다.

    현재는 하드코딩된 10개 종목만 허용한다.
    나중에 이 함수만 수정하면 범위를 넓힐 수 있도록
    인터페이스(함수 이름과 반환 타입)는 그대로 유지한다.

    Parameters
    ----------
    ticker : str
        확인할 티커 문자열 (예: "AAPL")

    Returns
    -------
    bool
        화이트리스트에 있으면 True, 없으면 False
    """
    return ticker.upper() in _SP500_WHITELIST


def load_ohlcv(ticker: str, period_months: int = 6) -> pd.DataFrame:
    """
    주어진 티커의 최근 N개월 1시간 봉 OHLCV 데이터를 반환한다.

    동작 순서:
      1. 캐시 파일이 있고 1시간 이내에 만들어졌으면 → 캐시에서 읽기
      2. 캐시가 없거나 만료됐으면 → yfinance로 다운로드 후 캐시 저장
      3. 다운로드 실패 시 → 캐시가 남아 있으면 캐시 fallback (오래됐어도 반환)

    Parameters
    ----------
    ticker : str
        S&P 500 티커 (예: "AAPL")
    period_months : int
        몇 개월치 데이터를 가져올지. yfinance 1h 봉은 최대 730일(약 24개월) 지원.

    Returns
    -------
    pd.DataFrame
        컬럼: ['open', 'high', 'low', 'close', 'volume']
        인덱스: timezone-aware datetime (America/New_York)
        정규장(09:30~16:00 ET) 구간만 포함.

    Raises
    ------
    ValueError
        period_months가 1 미만이거나 24 초과일 때.
    RuntimeError
        네트워크 실패 + 캐시도 없을 때.
    """
    if not (1 <= period_months <= 24):
        raise ValueError(f"period_months는 1~24 사이여야 합니다. 입력값: {period_months}")

    ticker = ticker.upper()
    cache_path = CACHE_DIR / f"{ticker}_{period_months}mo.parquet"

    # --- 1단계: 유효한 캐시가 있으면 바로 반환 ---
    if _cache_is_fresh(cache_path):
        print(f"[cache] {cache_path.name} 캐시 사용")
        return pd.read_parquet(cache_path)

    # --- 2단계: yfinance로 다운로드 ---
    period_str = f"{period_months}mo"
    print(f"[download] {ticker} {period_str} 1h 봉 다운로드 중...")

    try:
        raw = yf.download(
            ticker,
            period=period_str,
            interval="1h",
            auto_adjust=True,   # 주식 분할·배당 자동 조정
            progress=False,     # 터미널 진행 바 숨김
        )

        if raw.empty:
            raise ValueError(f"yfinance가 {ticker}에 대해 빈 데이터를 반환했습니다.")

        df = _clean(raw)
        _save_cache(df, cache_path)
        print(f"[download] 완료. 총 {len(df)}행 → {cache_path.name} 저장")
        return df

    except Exception as exc:
        print(f"[error] 다운로드 실패: {exc}")

        # --- 3단계: 실패해도 오래된 캐시라도 있으면 반환 ---
        if cache_path.exists():
            print(f"[fallback] 만료된 캐시 {cache_path.name} 를 사용합니다.")
            return pd.read_parquet(cache_path)

        raise RuntimeError(
            f"{ticker} 데이터를 가져올 수 없고 캐시도 없습니다."
        ) from exc


# ---------------------------------------------------------------------------
# 내부 헬퍼 함수들 (모듈 외부에서 직접 호출할 필요 없음)
# ---------------------------------------------------------------------------

def _cache_is_fresh(cache_path: Path) -> bool:
    """캐시 파일이 존재하고 1시간 이내에 만들어졌으면 True."""
    if not cache_path.exists():
        return False
    age = time.time() - cache_path.stat().st_mtime
    return age < CACHE_MAX_AGE_SECONDS


def _clean(raw: pd.DataFrame) -> pd.DataFrame:
    """
    yfinance 원시 데이터를 정제한다.

    처리 내용:
      1. 컬럼명을 소문자로 통일 (Open → open 등)
      2. MultiIndex 컬럼 처리 (yfinance 0.2+ 는 (컬럼명, 티커) 형태로 반환할 수 있음)
      3. 필요한 컬럼 5개만 선택
      4. 인덱스를 America/New_York 타임존으로 변환
      5. 정규장 시간(09:30~16:00 ET)만 필터링
      6. 결측치: forward fill 후 남은 행 제거
      7. 거래량 0인 행(거래 정지일) 제거
    """
    df = raw.copy()

    # MultiIndex 컬럼 처리: ('Close', 'AAPL') → 'close'
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [col[0].lower() for col in df.columns]
    else:
        df.columns = [col.lower() for col in df.columns]

    # 필요한 컬럼만 선택
    df = df[["open", "high", "low", "close", "volume"]]

    # 인덱스 타임존 변환
    if df.index.tz is None:
        df.index = df.index.tz_localize("America/New_York")
    else:
        df.index = df.index.tz_convert("America/New_York")

    # 정규장 시간만 필터링 (09:30 이상, 16:00 미만)
    times = df.index.time
    market_mask = (times >= _MARKET_OPEN) & (times < _MARKET_CLOSE)
    df = df[market_mask]

    # 결측치 처리: forward fill → 그래도 남으면 행 제거
    df = df.ffill().dropna()

    # 거래량 0인 행 제거 (거래 정지일)
    df = df[df["volume"] > 0]

    return df


def _save_cache(df: pd.DataFrame, cache_path: Path) -> None:
    """DataFrame을 parquet 파일로 저장한다."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    df.to_parquet(cache_path)
