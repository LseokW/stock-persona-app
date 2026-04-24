"""
train.py — LSTM 방향 예측 모델 학습 스크립트.

실행:
    cd backend
    uv run python train.py --ticker AAPL

출력 파일:
    models/lstm_direction.pt   — best 모델 가중치
    models/norm_stats.json     — 훈련셋 기준 정규화 통계
    models/training_curve.png  — train/val loss + val accuracy 곡선
"""

import argparse
import json
import random
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from app.ml.dataset import OHLCVDataset
from app.ml.model import LSTMDirectionModel
from app.services.data_loader import load_ohlcv

MODELS_DIR = Path(__file__).parent / "models"


def set_seed(seed: int) -> None:
    """재현성을 위해 모든 난수 시드를 고정한다."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def split_dataframe(df, train_ratio=0.70, val_ratio=0.15):
    """
    시간 순서를 유지한 채로 DataFrame을 3등분한다.

    [데이터 유출 방지] random split 절대 금지.
    미래 데이터가 훈련에 섞이면 실제보다 훨씬 좋은 성능이 나온다 (look-ahead bias).

    Returns
    -------
    train_df, val_df, test_df
    """
    n = len(df)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))

    return df.iloc[:train_end], df.iloc[train_end:val_end], df.iloc[val_end:]


def train_one_epoch(model, loader, criterion, optimizer, device):
    """훈련 루프 1 epoch. train loss 반환."""
    model.train()
    total_loss = 0.0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        logit = model(x)
        loss = criterion(logit, y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * len(x)
    return total_loss / len(loader.dataset)


def evaluate(model, loader, criterion, device):
    """검증/테스트 루프. (loss, accuracy) 반환."""
    model.eval()
    total_loss = 0.0
    correct = 0
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            logit = model(x)
            loss = criterion(logit, y)
            total_loss += loss.item() * len(x)
            pred = (torch.sigmoid(logit) > 0.5).float()
            correct += (pred == y).sum().item()
    n = len(loader.dataset)
    return total_loss / n, correct / n


def collect_probs(model, loader, device):
    """테스트셋 전체의 예측 확률 p를 모아서 반환."""
    model.eval()
    probs = []
    with torch.no_grad():
        for x, _ in loader:
            x = x.to(device)
            p = torch.sigmoid(model(x)).cpu().numpy().flatten()
            probs.extend(p.tolist())
    return probs


def save_training_curve(train_losses, val_losses, val_accs, out_path):
    """학습 곡선을 PNG로 저장한다."""
    epochs = range(1, len(train_losses) + 1)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

    ax1.plot(epochs, train_losses, label="train loss")
    ax1.plot(epochs, val_losses, label="val loss")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("BCE Loss")
    ax1.set_title("Loss")
    ax1.legend()

    ax2.plot(epochs, [a * 100 for a in val_accs], color="green", label="val accuracy")
    ax2.axhline(50, color="gray", linestyle="--", label="random baseline")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Accuracy (%)")
    ax2.set_title("Validation Accuracy")
    ax2.legend()

    fig.tight_layout()
    fig.savefig(out_path, dpi=100)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ticker", default="AAPL")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--months", type=int, default=24)
    args = parser.parse_args()

    set_seed(args.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"디바이스: {device}")

    # --- 1. 데이터 로드 ---
    print(f"\n{args.ticker} 데이터 로드 중...")
    df = load_ohlcv(args.ticker, period_months=args.months)
    print(f"전체 행 수: {len(df)}")

    # --- 2. 시간 순서 분할 ---
    train_df, val_df, test_df = split_dataframe(df)
    print(f"분할: train={len(train_df)} / val={len(val_df)} / test={len(test_df)}")

    # --- 3. Dataset 구성 ---
    WINDOW = 24
    # 훈련셋: norm_stats를 자체 계산
    train_ds = OHLCVDataset(train_df, window_size=WINDOW, norm_stats=None)
    norm_stats = train_ds.norm_stats  # 훈련셋 기준 통계

    # [데이터 유출 방지] 검증/테스트셋은 훈련 통계를 주입
    val_ds = OHLCVDataset(val_df, window_size=WINDOW, norm_stats=norm_stats)
    test_ds = OHLCVDataset(test_df, window_size=WINDOW, norm_stats=norm_stats)

    print(f"\n샘플 수: train={len(train_ds)} / val={len(val_ds)} / test={len(test_ds)}")

    # --- 4. DataLoader ---
    # 훈련만 shuffle=True: 배치 순서를 섞어야 모델이 순서에 과적합하지 않음
    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=32, shuffle=False)

    # --- 5. 모델 / 손실함수 / 옵티마이저 ---
    model = LSTMDirectionModel().to(device)
    # BCEWithLogitsLoss = sigmoid + BCE를 수치적으로 안정적으로 합친 것
    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    # --- 6. 학습 루프 ---
    best_val_acc = 0.0
    best_state = None
    best_epoch = 0
    patience = 5
    patience_counter = 0
    best_val_loss = float("inf")

    train_losses, val_losses, val_accs = [], [], []

    print("\n--- 학습 시작 ---")
    print(f"{'Epoch':>5} | {'Train Loss':>10} | {'Val Loss':>8} | {'Val Acc':>7}")
    print("-" * 42)

    for epoch in range(1, args.epochs + 1):
        tr_loss = train_one_epoch(model, train_loader, criterion, optimizer, device)
        vl_loss, vl_acc = evaluate(model, val_loader, criterion, device)

        train_losses.append(tr_loss)
        val_losses.append(vl_loss)
        val_accs.append(vl_acc)

        print(f"{epoch:>5} | {tr_loss:>10.4f} | {vl_loss:>8.4f} | {vl_acc*100:>6.1f}%")

        # best 모델 저장 (val accuracy 기준)
        if vl_acc > best_val_acc:
            best_val_acc = vl_acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            best_epoch = epoch

        # early stopping (val loss 기준)
        if vl_loss < best_val_loss:
            best_val_loss = vl_loss
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\nEarly stopping at epoch {epoch} (val loss {patience}회 미개선)")
                break

    # --- 7. 저장 ---
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # best 가중치 저장
    model.load_state_dict(best_state)
    torch.save(best_state, MODELS_DIR / "lstm_direction.pt")

    # 정규화 통계 저장
    with open(MODELS_DIR / "norm_stats.json", "w") as f:
        json.dump(norm_stats, f, indent=2)

    # 학습 곡선 저장
    save_training_curve(
        train_losses, val_losses, val_accs,
        MODELS_DIR / "training_curve.png",
    )

    # --- 8. 테스트셋 평가 ---
    _, test_acc = evaluate(model, test_loader, criterion, device)
    probs = collect_probs(model, test_loader, device)
    probs = np.array(probs)

    # 확률 분포 구간별 카운트
    bins = [
        ("p < 0.3 ", probs < 0.3),
        ("0.3-0.5 ", (probs >= 0.3) & (probs < 0.5)),
        ("0.5-0.7 ", (probs >= 0.5) & (probs < 0.7)),
        ("p > 0.7 ", probs >= 0.7),
    ]

    print("\n=== 학습 완료 ===")
    print(f"훈련 샘플 수: {len(train_ds)}")
    print(f"검증 샘플 수: {len(val_ds)}")
    print(f"테스트 샘플 수: {len(test_ds)}")
    print()
    print(f"최고 검증 정확도: {best_val_acc*100:.1f}% (epoch {best_epoch})")
    print(f"테스트 정확도:     {test_acc*100:.1f}%")
    print()
    print("예측 확률 분포 (테스트셋):")
    for label, mask in bins:
        cnt = mask.sum()
        pct = cnt / len(probs) * 100
        print(f"  {label}: {cnt:3d}개 ({pct:.1f}%)")
    print()
    print("저장된 파일:")
    print(f"  {MODELS_DIR / 'lstm_direction.pt'}")
    print(f"  {MODELS_DIR / 'norm_stats.json'}")
    print(f"  {MODELS_DIR / 'training_curve.png'}")


if __name__ == "__main__":
    main()
