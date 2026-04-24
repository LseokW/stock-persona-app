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

## 기타 스크립트

```bash
# 데이터 확인
uv run python try_data.py

# 백테스트 CLI 실행
uv run python run_backtest.py --ticker AAPL

# 모델 재학습
uv run python train.py --ticker AAPL --months 23 --seed 42
```
