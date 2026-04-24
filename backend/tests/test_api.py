"""
test_api.py — FastAPI 엔드포인트 통합 테스트.

TestClient는 실제 서버를 띄우지 않고 ASGI 앱을 직접 호출한다.
httpx가 TestClient 의존성이므로 dev group에 포함되어 있어야 함.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_validate_valid():
    r = client.get("/api/validate/AAPL")
    assert r.status_code == 200
    body = r.json()
    assert body["ticker"] == "AAPL"
    assert body["valid"] is True


def test_validate_valid_lowercase():
    """소문자 입력도 대문자로 정규화되어 유효해야 한다."""
    r = client.get("/api/validate/aapl")
    assert r.status_code == 200
    assert r.json()["valid"] is True


def test_validate_invalid():
    r = client.get("/api/validate/ZZZZ")
    assert r.status_code == 200
    assert r.json()["valid"] is False


def test_backtest_invalid_ticker():
    r = client.post("/api/backtest", json={"ticker": "ZZZZ"})
    assert r.status_code == 400


def test_backtest_aapl():
    """실제 AAPL 데이터로 백테스트 엔드포인트 end-to-end 확인."""
    r = client.post("/api/backtest", json={"ticker": "AAPL", "period_months": 6})
    assert r.status_code == 200

    data = r.json()
    assert data["ticker"] == "AAPL"
    assert "start" in data["period"]
    assert "end" in data["period"]
    assert isinstance(data["benchmark_buy_hold_pct"], float)

    # 4개 페르소나 모두 포함
    assert len(data["personas"]) == 4
    persona_ids = {p["id"] for p in data["personas"]}
    assert persona_ids == {"coward", "beast", "contrarian", "ai"}

    # 각 페르소나의 metrics 키 확인
    for p in data["personas"]:
        m = p["metrics"]
        assert "total_return_pct" in m
        assert "mdd_pct" in m
        assert "win_rate" in m
        assert "num_trades" in m
        assert "avg_hold_hours" in m

    # equity_curve가 비어있지 않음
    for p in data["personas"]:
        assert len(p["equity_curve"]) > 0
