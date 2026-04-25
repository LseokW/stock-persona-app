const API_BASE = "http://localhost:8000/api";

export async function validateTicker(ticker) {
  const r = await fetch(`${API_BASE}/validate/${ticker}`);
  if (!r.ok) throw new Error("validate failed");
  return r.json();
}

export async function runBacktest(ticker, periodMonths = 6) {
  const r = await fetch(`${API_BASE}/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticker,
      period_months: periodMonths,
      initial_capital: 10000,
    }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${r.status}`);
  }
  return r.json();
}
