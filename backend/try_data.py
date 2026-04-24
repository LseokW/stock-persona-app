"""
try_data.py — AAPL 6개월 데이터를 실제로 받아서 내용을 확인하는 스크립트.

실행 방법 (backend/ 디렉토리에서):
    uv run python try_data.py
"""

from app.services.data_loader import load_ohlcv

df = load_ohlcv("AAPL", period_months=6)

print("=" * 60)
print(f"총 행 수: {len(df)}")

print("\n--- 첫 3행 ---")
print(df.head(3))

print("\n--- 마지막 3행 ---")
print(df.tail(3))

print("\n--- 컬럼별 결측치 개수 ---")
print(df.isnull().sum())

print("\n--- 거래 시간 범위 ---")
print(f"시작: {df.index[0]}")
print(f"종료: {df.index[-1]}")

print("\n--- 요약 통계 ---")
print(df.describe())
