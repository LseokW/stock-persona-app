"""
train.py — LSTM 방향 예측 모델 학습 스크립트.

실행:
    cd backend
    uv run python train.py
    uv run python train.py --tickers AAPL MSFT SPY --months 48 --epochs 100

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
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import ConcatDataset, DataLoader

from app.ml.dataset import OHLCVDataset
from app.ml.model import LSTMDirectionModel
from app.services.data_loader import load_ohlcv

MODELS_DIR = Path(__file__).parent / "models"


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def split_dataframe(df, train_ratio=0.70, val_ratio=0.15):
    n = len(df)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))
    return df.iloc[:train_end], df.iloc[train_end:val_end], df.iloc[val_end:]


def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss = 0.0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        loss = criterion(model(x), y)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item() * len(x)
    return total_loss / len(loader.dataset)


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0.0
    correct = 0
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            logit = model(x)
            total_loss += criterion(logit, y).item() * len(x)
            pred = (torch.sigmoid(logit) > 0.5).float()
            correct += (pred == y).sum().item()
    n = len(loader.dataset)
    return total_loss / n, correct / n


def collect_probs(model, loader, device):
    model.eval()
    probs = []
    with torch.no_grad():
        for x, _ in loader:
            p = torch.sigmoid(model(x.to(device))).cpu().numpy().flatten()
            probs.extend(p.tolist())
    return probs


def save_training_curve(train_losses, val_losses, val_accs, out_path):
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
    parser.add_argument("--tickers", nargs="+", default=["AAPL", "MSFT", "SPY"])
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--months", type=int, default=24)
    args = parser.parse_args()

    set_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"디바이스: {device}")
    print(f"티커: {args.tickers} | 기간: {args.months}개월 | 최대 epoch: {args.epochs}")

    WINDOW = 24

    # --- 1. 데이터 로드 및 분할 ---
    all_train, all_val, all_test = [], [], []
    for ticker in args.tickers:
        print(f"\n{ticker} 데이터 로드 중...")
        df = load_ohlcv(ticker, period_months=args.months)
        tr, va, te = split_dataframe(df)
        all_train.append(tr)
        all_val.append(va)
        all_test.append(te)
        print(f"  {ticker}: 전체 {len(df)} → train {len(tr)} / val {len(va)} / test {len(te)}")

    # --- 2. 통합 norm_stats 계산 (훈련셋 전체 기준) ---
    combined_train = pd.concat(all_train, ignore_index=True)
    log_volume = np.log(combined_train["volume"].astype(float))
    norm_stats = {
        "log_volume_mean": float(log_volume.mean()),
        "log_volume_std": float(log_volume.std()),
    }

    # --- 3. pos_weight 계산 (라벨 불균형 보정) ---
    combined_labels = (combined_train["close"].shift(-1) > combined_train["close"]).dropna()
    n_pos = int(combined_labels.sum())
    n_neg = int(len(combined_labels) - n_pos)
    pos_weight = torch.tensor([n_neg / (n_pos + 1e-8)], dtype=torch.float32).to(device)
    print(f"\n라벨 분포: 상승 {n_pos} / 하락 {n_neg} → pos_weight = {pos_weight.item():.4f}")

    # --- 4. Dataset 구성 ---
    train_ds = ConcatDataset([OHLCVDataset(df, WINDOW, norm_stats) for df in all_train])
    val_ds   = ConcatDataset([OHLCVDataset(df, WINDOW, norm_stats) for df in all_val])
    test_ds  = ConcatDataset([OHLCVDataset(df, WINDOW, norm_stats) for df in all_test])
    print(f"\n샘플 수: train={len(train_ds)} / val={len(val_ds)} / test={len(test_ds)}")

    # --- 5. DataLoader ---
    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)
    val_loader   = DataLoader(val_ds,   batch_size=64, shuffle=False)
    test_loader  = DataLoader(test_ds,  batch_size=64, shuffle=False)

    # --- 6. 모델 / 손실함수 / 옵티마이저 ---
    model = LSTMDirectionModel().to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.Adam(model.parameters(), lr=3e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=5, min_lr=1e-5
    )

    # --- 7. 학습 루프 ---
    best_val_acc = 0.0
    best_state = None
    best_epoch = 0
    patience = 15
    patience_counter = 0
    best_val_loss = float("inf")

    train_losses, val_losses, val_accs = [], [], []

    print("\n--- 학습 시작 ---")
    print(f"{'Epoch':>5} | {'Train Loss':>10} | {'Val Loss':>8} | {'Val Acc':>7} | {'LR':>8}")
    print("-" * 55)

    for epoch in range(1, args.epochs + 1):
        tr_loss = train_one_epoch(model, train_loader, criterion, optimizer, device)
        vl_loss, vl_acc = evaluate(model, val_loader, criterion, device)
        scheduler.step(vl_loss)

        train_losses.append(tr_loss)
        val_losses.append(vl_loss)
        val_accs.append(vl_acc)

        current_lr = optimizer.param_groups[0]["lr"]
        print(f"{epoch:>5} | {tr_loss:>10.4f} | {vl_loss:>8.4f} | {vl_acc*100:>6.1f}% | {current_lr:.2e}")

        if vl_acc > best_val_acc:
            best_val_acc = vl_acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            best_epoch = epoch

        if vl_loss < best_val_loss:
            best_val_loss = vl_loss
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\nEarly stopping at epoch {epoch}")
                break

    # --- 8. 저장 ---
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model.load_state_dict(best_state)
    torch.save(best_state, MODELS_DIR / "lstm_direction.pt")

    with open(MODELS_DIR / "norm_stats.json", "w") as f:
        json.dump(norm_stats, f, indent=2)

    save_training_curve(
        train_losses, val_losses, val_accs,
        MODELS_DIR / "training_curve.png",
    )

    # --- 9. 테스트셋 평가 ---
    _, test_acc = evaluate(model, test_loader, criterion, device)
    probs = np.array(collect_probs(model, test_loader, device))

    bins = [
        ("p < 0.3 ", probs < 0.3),
        ("0.3-0.45", (probs >= 0.3) & (probs < 0.45)),
        ("0.45-0.55", (probs >= 0.45) & (probs < 0.55)),
        ("0.55-0.7", (probs >= 0.55) & (probs < 0.7)),
        ("p > 0.7 ", probs >= 0.7),
    ]

    print("\n=== 학습 완료 ===")
    print(f"최고 검증 정확도: {best_val_acc*100:.1f}% (epoch {best_epoch})")
    print(f"테스트 정확도:     {test_acc*100:.1f}%")
    print("\n예측 확률 분포 (테스트셋):")
    for label, mask in bins:
        cnt = mask.sum()
        print(f"  {label}: {cnt:4d}개 ({cnt/len(probs)*100:.1f}%)")


if __name__ == "__main__":
    main()
