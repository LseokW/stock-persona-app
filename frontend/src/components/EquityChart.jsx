import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PERSONAS, PERSONA_ORDER } from "../constants/personas";

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
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-4">수익률 추이 ({result.ticker})</h2>
      <p className="text-sm text-gray-500 mb-4">
        Buy & Hold 벤치마크: {result.benchmark_buy_hold_pct.toFixed(2)}%
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) => ts.slice(5, 10)}
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            labelFormatter={(ts) => ts.slice(0, 16).replace("T", " ")}
            formatter={(v) => `$${v.toFixed(2)}`}
          />
          <Legend />
          {PERSONA_ORDER.map((id) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              name={PERSONAS[id].name}
              stroke={PERSONAS[id].color}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
