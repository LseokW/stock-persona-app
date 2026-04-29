# 백엔드

## 구현 상태

| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | 데이터 파이프라인 (yfinance + 캐시) | ✅ 완료 |
| 2 | LSTM 모델 학습 | ✅ 완료 |
| 3 | 페르소나 + 백테스트 엔진 | ✅ 완료 |
| 4 | FastAPI 엔드포인트 | ✅ 완료 |

## 디렉토리 구조

```
backend/
├── app/
│   ├── main.py                  # FastAPI 앱 진입점
│   ├── schemas.py               # Pydantic 요청/응답 모델
│   ├── api/
│   │   ├── validate.py          # GET /api/validate/{ticker}
│   │   └── backtest.py          # POST /api/backtest
│   ├── services/
│   │   ├── data_loader.py       # yfinance 래퍼 + parquet 캐시
│   │   ├── personas.py          # 겁쟁이/야수/청개구리/AI형
│   │   ├── backtest.py          # 백테스트 시뮬레이션 엔진
│   │   └── portfolio.py         # 포트폴리오 상태 관리
│   └── ml/
│       ├── dataset.py           # PyTorch Dataset
│       ├── model.py             # LSTM 모델 정의
│       └── predictor.py         # 추론 래퍼
├── models/
│   ├── lstm_direction.pt        # 학습된 모델 가중치 (git 포함)
│   └── norm_stats.json          # 정규화 통계
├── cache/                       # parquet 캐시 (gitignore됨)
├── tests/                       # 단위/통합 테스트 (41개)
├── train.py                     # 모델 학습 스크립트
├── run_backtest.py              # 백테스트 CLI
└── pyproject.toml
```

## 개발 환경 설정

```bash
cd backend
uv sync
```

## 서버 실행

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

실행 후:
- Swagger UI: http://localhost:8000/docs
- 헬스 체크: http://localhost:8000/api/health

## 테스트 실행

```bash
uv run pytest tests/ -v
```

## 향후 개선 사항

### AI 페르소나 (LSTM 모델) 개선 필요

현재 모델은 사실상 학습이 실패한 상태이다.

**증상**
- BCE Loss ≈ 0.693 (= ln(2)): 모델이 모든 입력에 대해 p ≈ 0.5 출력 (아무것도 학습 안 함)
- Val accuracy 47.5% < 50% (random baseline): 랜덤보다 못함
- Early stopping이 epoch 6에서 조기 종료

**근본 원인**
- 피처 부족: log_return, range_ratio, log_volume 3개만 사용. 방향 예측 신호가 너무 약함
- 데이터 부족: 2년 1개 종목 hourly ≈ 학습 샘플 ~2,000개
- pos_weight 미설정: 상승/하락 라벨 불균형 시 gradient 평균이 0 수렴
- 모델 출력이 항상 0.47 근방에 몰려 있어 BUY_THRESHOLD / SELL_THRESHOLD를 의미 있게 넘지 못함

**개선 방향**

| 우선순위 | 항목 | 내용 |
|---------|------|------|
| 상 | 피처 추가 | RSI(14), MACD histogram, Bollinger Band position 추가 → input_size 3→6 |
| 상 | 데이터 확대 | 학습 기간 2년→5년, 단일 종목→다중 종목(SPY/QQQ/AAPL 등) |
| 중 | pos_weight 적용 | 라벨 비율 계산 후 `BCEWithLogitsLoss(pos_weight=...)` 설정 |
| 중 | LR 조정 | 1e-3 → 3e-4, ReduceLROnPlateau 스케줄러 추가 |
| 하 | 대안 구조 | LSTM 대신 RSI+MACD 조합 규칙 기반으로 AI 페르소나 교체 검토 |

> 현실적 기대치: 1시간봉 방향 예측은 전문 퀀트도 52~53%면 우수. 목표는 50% 이상의 안정적 신호.

---

## 기타 스크립트

```bash
# 데이터 확인
uv run python try_data.py

# 백테스트 CLI 실행
uv run python run_backtest.py --ticker AAPL

# 모델 재학습
uv run python train.py --ticker AAPL --months 23 --seed 42
```
