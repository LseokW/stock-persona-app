import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const apiClient = axios.create({ baseURL: API_BASE });

// 토큰 자동 주입
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → 강제 로그아웃, 402 → 그대로 통과
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// 하위 호환용 named exports (기존 컴포넌트에서 import 중)
export async function validateTicker(ticker) {
  const res = await apiClient.get(`/api/validate/${ticker}`);
  return res.data;
}

export async function runBacktest(ticker, periodMonths = 6, persona = "random") {
  const res = await apiClient.post("/api/backtest", {
    ticker,
    period_months: periodMonths,
    initial_capital: 10000,
    persona,
  });
  return res.data;
}
