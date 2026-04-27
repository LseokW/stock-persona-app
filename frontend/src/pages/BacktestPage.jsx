import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Header from "../components/Header";
import TickerInput from "../components/TickerInput";
import EquityChart from "../components/EquityChart";
import MetricsGrid from "../components/MetricsGrid";
import TradeHistory from "../components/TradeHistory";
import LoadingSpinner from "../components/LoadingSpinner";
import Disclaimer from "../components/Disclaimer";
import { useAuth } from "../hooks/useAuth";
import { PERSONAS, FREE_PERSONA } from "../constants/personas";
import apiClient from "../api/client";

export default function BacktestPage() {
  const { persona } = useParams();
  const navigate = useNavigate();
  const { purchasedPersonas } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFree = persona === FREE_PERSONA;
  const isUnlocked = isFree || purchasedPersonas.includes(persona);
  const meta = PERSONAS[persona];

  if (!meta || !isUnlocked) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (ticker) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.post("/api/backtest", {
        ticker,
        period_months: 6,
        initial_capital: 10000,
        persona,
      });
      setResult(res.data);
    } catch (e) {
      if (e.response?.status === 402) {
        setError("이 페르소나는 잠겨 있습니다");
      } else {
        setError(e.response?.data?.detail ?? e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={14} />
            대시보드
          </Link>
          <span className="text-slate-700">/</span>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full border"
            style={{
              backgroundColor: meta.color + "18",
              color: meta.color,
              borderColor: meta.color + "40",
              boxShadow: `0 0 12px ${meta.color}25`,
            }}
          >
            {meta.name}
          </span>
        </div>

        <TickerInput onSubmit={handleSubmit} disabled={loading} />

        {loading && <LoadingSpinner />}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            {error.includes("잠겨") && (
              <Link to="/dashboard" className="text-xs underline text-red-300 hover:text-red-200">
                대시보드로
              </Link>
            )}
          </div>
        )}

        {result && (
          <>
            <EquityChart result={result} />
            <MetricsGrid result={result} />
            <TradeHistory result={result} />
          </>
        )}

        <Disclaimer />
      </main>
    </div>
  );
}
