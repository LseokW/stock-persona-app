# 페르소나 백테스트 — AI 투자 성향 분석 웹앱

> **"당신의 투자 성향은 수익을 낼 수 있을까요?"**
> 4가지 AI 페르소나가 동일한 S&P 500 종목을 최근 6개월 동안 어떻게 거래했는지 직접 확인하는 교육용 백테스트 플랫폼.

---

## 개요

페르소나 백테스트는 투자 전략을 **캐릭터(페르소나)** 로 의인화해 백테스트를 쉽게 체험할 수 있게 만든 풀스택 웹 애플리케이션입니다.

- 실제 S&P 500 주가 데이터(yfinance)로 과거 6개월을 시뮬레이션
- 4가지 페르소나가 각자의 전략 로직으로 자동 매매
- 수익률·MDD·승률·거래 횟수를 차트와 지표로 비교
- AI형 페르소나는 LSTM 딥러닝 모델로 상승 확률을 예측해 매매

---

## 페르소나

| 페르소나 | 전략 | 위험도 |
|----------|------|--------|
| 🛡️ **신중함** | 이동평균 상승 + 가격 안정 시 진입, ±2% 손익 정리 | ★☆☆☆☆ |
| 🔥 **야수의 심장** | 직전 3봉 모멘텀 감지 시 자본 80% 매수, -0.3% 즉시 손절 | ★★★★★ |
| 🔄 **공포에 투자** | 1시간 -1% 급락 시 반등 기대 매수, ±1% 청산 | ★★★☆☆ |
| 🤖 **초보 예언가** | LSTM 예측 상승 확률 기반 매매, 파라미터 직접 조정 가능 | ★★☆☆☆ |
| 📊 **전체 비교** | 구매한 페르소나를 같은 종목으로 동시 실행해 한 화면에서 비교 | — |

---

## 주요 기능

### 백테스트
- S&P 500 주요 10개 종목(AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, JPM, V, WMT) 지원
- 최근 6개월 1시간봉 데이터로 시뮬레이션
- 수수료 0.05% 적용, Buy & Hold 벤치마크 자동 비교

### AI형 파라미터 조정
- 매수 기준(p >), 매도 기준(p <), 최소·최대 보유 시간을 슬라이더로 실시간 조정
- 프리셋 4종: **정석**(그리드 탐색 최적값) / 신중한 진입 / 단타형 / 초단타

### 전체 종목 한눈에
- 단일 페르소나로 10개 종목 전체를 한 번에 백테스트
- 수익률 · MDD · 승률 · 거래 횟수 기준 정렬 바 차트 제공

### 전체 비교 모드
- 구매한 페르소나를 동일 종목에 동시 실행
- 수익률 곡선과 지표 카드를 나란히 비교

### 성과 지표
| 지표 | 설명 |
|------|------|
| 수익률 | 최종 자산 / 시작 자본 |
| MDD | 고점 대비 최대 낙폭 (클수록 위험) |
| 승률 | 매도 거래 중 수익 비율 |
| 거래 횟수 | 매수 기준 총 거래 수 |
| 평균 보유 시간 | 매수~매도 평균 시간(h) |

---

## 기술 스택

### 백엔드
| 항목 | 내용 |
|------|------|
| 언어 | Python 3.12 |
| 프레임워크 | FastAPI |
| ML 모델 | PyTorch LSTM |
| 데이터 | yfinance (1시간봉, parquet 캐싱) |
| 인증 | Google OAuth 2.0 + JWT |
| DB | SQLite (aiosqlite + SQLAlchemy async) |
| 결제 | Polar (sandbox) |

### 프론트엔드
| 항목 | 내용 |
|------|------|
| 프레임워크 | React 18 + Vite |
| 스타일 | Tailwind CSS |
| 차트 | Recharts |
| 아이콘 | Lucide React |

---

## 로컬 실행

### 사전 요구사항
- Python 3.12
- Node.js 18+
- [uv](https://github.com/astral-sh/uv)

### 백엔드

```bash
cd backend
uv run python -m uvicorn app.main:app --reload --port 8000
```

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

접속: **http://localhost:5173**

### 환경 변수 (`backend/.env`)

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

JWT_SECRET=...
FRONTEND_URL=http://localhost:5173
DATABASE_URL=sqlite+aiosqlite:///./app.db

POLAR_ACCESS_TOKEN=...
POLAR_SERVER=sandbox
POLAR_PRODUCT_ID_COWARD=...
POLAR_PRODUCT_ID_BEAST=...
POLAR_PRODUCT_ID_CONTRARIAN=...
POLAR_PRODUCT_ID_AI=...
```

---

## 프로젝트 구조

```
stock-persona-app/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI 라우터
│   │   ├── auth/         # Google OAuth, JWT
│   │   ├── ml/           # LSTM 모델, 예측기
│   │   ├── services/     # 백테스트 엔진, 페르소나 로직
│   │   └── main.py
│   └── models/           # 학습된 모델 파일
└── frontend/
    └── src/
        ├── components/   # Header, PersonaCard, EquityChart 등
        ├── pages/        # Landing, Dashboard, BacktestPage 등
        └── constants/    # 페르소나 메타데이터
```

---

## 주의사항

> 이 서비스는 **교육 목적**으로 제작된 백테스트 시뮬레이터입니다.
> 과거 데이터 기반 결과이며 실제 투자 수익을 보장하지 않습니다.
> 투자 판단의 근거로 사용하지 마세요.
