from app.services.data_loader import load_ohlcv
from app.ml.dataset import OHLCVDataset
import numpy as np

df = load_ohlcv("AAPL", period_months=23)

# 전체 라벨 분포
labels = (df["close"].shift(-1) > df["close"]).astype(int).dropna()
print(f"전체 라벨 분포:")
print(f"  상승(1): {labels.sum()} ({labels.mean()*100:.1f}%)")
print(f"  하락(0): {(1-labels).sum()} ({(1-labels.mean())*100:.1f}%)")

# train/val/test 각각의 라벨 분포
n = len(df)
train_end = int(n * 0.7)
val_end = int(n * 0.85)

for name, start, end in [
    ("훈련", 0, train_end),
    ("검증", train_end, val_end),
    ("테스트", val_end, n - 1)
]:
    seg = labels.iloc[start:end]
    print(f"{name}셋 라벨 분포: 상승 {seg.mean()*100:.1f}%, 하락 {(1-seg.mean())*100:.1f}%")

# 각 구간의 주가 시작/종료
print("\n각 구간 주가 변화:")
for name, start, end in [
    ("훈련", 0, train_end),
    ("검증", train_end, val_end),
    ("테스트", val_end, n)
]:
    p_start = df["close"].iloc[start]
    p_end = df["close"].iloc[end-1]
    change = (p_end - p_start) / p_start * 100
    print(f"  {name}: {p_start:.2f} → {p_end:.2f} ({change:+.1f}%)")

# 수익률 분포
returns = df["close"].pct_change().dropna()
print(f"\n시간당 수익률 통계:")
print(f"  평균: {returns.mean()*100:.4f}%")
print(f"  표준편차: {returns.std()*100:.4f}%")
print(f"  최소: {returns.min()*100:.2f}%")
print(f"  최대: {returns.max()*100:.2f}%")
