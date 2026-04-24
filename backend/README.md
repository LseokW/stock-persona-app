# 백엔드

## 현재 구현 상태

**1단계: 데이터 파이프라인** (완료)

- `app/services/data_loader.py`: yfinance로 1시간 봉 OHLCV 데이터 수집 + parquet 캐싱

아직 구현되지 않은 것: LSTM 모델, 페르소나 로직, FastAPI 엔드포인트

## 디렉토리 구조

```
backend/
├── app/
│   ├── services/
│   │   └── data_loader.py   # yfinance 래퍼 + 캐시 (1단계)
│   └── schemas.py           # Pydantic 스키마 (추후)
├── cache/                   # 종목별 parquet 캐시 파일 (gitignore됨)
├── models/                  # 학습된 모델 가중치 .pt (git 포함)
├── tests/
│   └── test_data_loader.py  # 단위 테스트
├── try_data.py              # 데이터 확인용 스크립트
└── pyproject.toml
```

## 테스트 실행

```bash
uv run pytest tests/ -v
```
