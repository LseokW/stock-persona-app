import { useState } from "react";
import { runBacktest } from "./api/client";
import TickerInput from "./components/TickerInput";
import PersonaCards from "./components/PersonaCards";
import EquityChart from "./components/EquityChart";
import MetricsGrid from "./components/MetricsGrid";
import TradeHistory from "./components/TradeHistory";
import LoadingSpinner from "./components/LoadingSpinner";
import Disclaimer from "./components/Disclaimer";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (ticker) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await runBacktest(ticker);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            AI 페르소나 주식 백테스트
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            네 가지 투자 성향이 같은 종목에서 어떻게 다른 결과를 내는지 비교
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <TickerInput onSubmit={handleSubmit} disabled={loading} />
        <PersonaCards />

        {loading && <LoadingSpinner />}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            오류: {error}
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
