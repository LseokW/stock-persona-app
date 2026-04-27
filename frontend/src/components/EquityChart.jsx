import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PERSONAS } from "../constants/personas";

export default function EquityChart({ result }) {
  const merged = {};
  result.personas.forEach((persona) => {
    persona.equity_curve.forEach(([ts, value]) => {
      if (!merged[ts]) merged[ts] = { timestamp: ts };
      merged[ts][persona.id] = value;
    });
  });
  const data = Object.values(merged).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-white">수익률 추이</h2>
          <p className="text-xs text-slate-400 mt-0.5">{result.ticker}</p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
          B&amp;H {result.benchmark_buy_hold_pct.toFixed(2)}%
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) => ts.slice(5, 10)}
            tick={{ fontSize: 11, fill: "#64748B" }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            labelFormatter={(ts) => ts.slice(0, 16).replace("T", " ")}
            formatter={(v) => `$${v.toFixed(2)}`}
            contentStyle={{
              background: "#1E293B",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              fontSize: 12,
              color: "#E2E8F0",
            }}
            cursor={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94A3B8" }}
          />
          {result.personas.map((p) => {
            const meta = PERSONAS[p.id];
            return (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                name={meta?.name ?? p.id}
                stroke={meta?.color ?? "#6B7280"}
                dot={false}
                strokeWidth={2.5}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
