import { PERSONAS } from "../constants/personas";

function fmtPct(v) {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export default function MetricsGrid({ result }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {result.personas.map((p) => {
        const meta = PERSONAS[p.id];
        const m = p.metrics;
        const returnColor = m.total_return_pct >= 0 ? "text-green-600" : "text-red-600";
        return (
          <div
            key={p.id}
            className="bg-white rounded-lg shadow-sm border p-5 border-t-4"
            style={{ borderTopColor: meta.color }}
          >
            <h3 className="font-bold text-gray-900 mb-3">{meta.name}</h3>
            <div className={`text-3xl font-bold ${returnColor}`}>
              {fmtPct(m.total_return_pct)}
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <div>MDD: <span className="text-red-600">{fmtPct(m.mdd_pct)}</span></div>
              <div>거래 횟수: {m.num_trades}</div>
              <div>승률: {(m.win_rate * 100).toFixed(0)}%</div>
              <div>평균 보유: {m.avg_hold_hours.toFixed(1)}h</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
