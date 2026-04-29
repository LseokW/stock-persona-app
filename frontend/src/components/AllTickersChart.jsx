import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";
import { BarChart2, Loader2 } from "lucide-react";
import { PERSONAS } from "../constants/personas";
import apiClient from "../api/client";

const SORT_OPTIONS = [
  { key: "total_return_pct", label: "수익률" },
  { key: "mdd_pct",          label: "MDD" },
  { key: "num_trades",       label: "거래 횟수" },
  { key: "win_rate",         label: "승률" },
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-xl border px-4 py-3 text-xs space-y-1"
      style={{
        background: "#1E293B",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p className="font-bold text-white text-sm mb-2">{d.ticker}</p>
      <p className={d.total_return_pct >= 0 ? "text-emerald-400" : "text-red-400"}>
        수익률: {d.total_return_pct >= 0 ? "+" : ""}{d.total_return_pct.toFixed(2)}%
      </p>
      <p className="text-red-400">MDD: {d.mdd_pct.toFixed(2)}%</p>
      <p className="text-slate-300">승률: {(d.win_rate * 100).toFixed(0)}%</p>
      <p className="text-slate-300">거래: {d.num_trades}회</p>
    </div>
  );
}

export default function AllTickersChart({ persona, aiParams }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [sortKey, setSortKey] = useState("total_return_pct");

  const meta = PERSONAS[persona];

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const body = {
        persona,
        period_months: 6,
        initial_capital: 10000,
        ...(persona === "ai" && aiParams ? { ai_params: aiParams } : {}),
      };
      const res = await apiClient.post("/api/backtest/all-tickers", body);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  const sorted = data
    ? [...data.tickers].sort((a, b) =>
        sortKey === "mdd_pct"
          ? a[sortKey] - b[sortKey]          // MDD: 작은(덜 나쁜) 게 위
          : b[sortKey] - a[sortKey]
      )
    : [];

  return (
    <div className="glass-card rounded-2xl p-5" style={{ borderTop: `2px solid ${meta.color}50` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} style={{ color: meta.color }} />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            전체 종목 한눈에
          </span>
        </div>

        {!data && !loading && (
          <button
            onClick={handleFetch}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: meta.color,
              color: "#fff",
              boxShadow: `0 0 16px ${meta.color}40`,
            }}
          >
            <BarChart2 size={12} />
            10개 종목 분석 시작
          </button>
        )}

        {data && (
          <div className="flex gap-1">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => setSortKey(o.key)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                style={{
                  backgroundColor: sortKey === o.key ? meta.color + "25" : "rgba(255,255,255,0.05)",
                  color: sortKey === o.key ? meta.color : "#64748B",
                  border: `1px solid ${sortKey === o.key ? meta.color + "60" : "transparent"}`,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: meta.color }} />
          <p className="text-xs text-slate-400">10개 종목 백테스트 실행 중...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* 요약 통계 */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                label: "평균 수익률",
                value: (sorted.reduce((s, d) => s + d.total_return_pct, 0) / sorted.length).toFixed(2) + "%",
                color: sorted.reduce((s, d) => s + d.total_return_pct, 0) >= 0 ? "#10B981" : "#EF4444",
              },
              {
                label: "수익 종목",
                value: `${sorted.filter((d) => d.total_return_pct > 0).length} / ${sorted.length}`,
                color: "#F59E0B",
              },
              {
                label: "평균 거래 횟수",
                value: (sorted.reduce((s, d) => s + d.num_trades, 0) / sorted.length).toFixed(1) + "회",
                color: "#8B5CF6",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* 바 차트 */}
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sorted} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="ticker"
                tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  sortKey === "win_rate"
                    ? `${(v * 100).toFixed(0)}%`
                    : sortKey === "num_trades"
                    ? `${v}회`
                    : `${v.toFixed(1)}%`
                }
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Bar dataKey={sortKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
                {sorted.map((d) => {
                  const val = d[sortKey];
                  const isPos =
                    sortKey === "mdd_pct"
                      ? val > -5
                      : sortKey === "num_trades"
                      ? true
                      : val >= 0;
                  return (
                    <Cell
                      key={d.ticker}
                      fill={
                        sortKey === "num_trades"
                          ? meta.color
                          : sortKey === "win_rate"
                          ? val >= 0.5 ? "#10B981" : "#EF4444"
                          : isPos ? "#10B981" : "#EF4444"
                      }
                      opacity={0.85}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <button
            onClick={handleFetch}
            className="mt-3 w-full py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            다시 분석
          </button>
        </>
      )}
    </div>
  );
}
