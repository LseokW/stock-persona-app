import { PERSONAS } from "../constants/personas";

function fmtPct(v) {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function Stat({ label, value, valueClass = "text-slate-300" }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function MetricsGrid({ result }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {result.personas.map((p) => {
        const meta = PERSONAS[p.id];
        const m = p.metrics;
        const isPos = m.total_return_pct >= 0;
        return (
          <div
            key={p.id}
            className="glass-card rounded-2xl p-5 flex flex-col gap-3"
            style={{
              borderTop: `2px solid ${isPos ? "#10B981" : "#EF4444"}40`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: meta.color }}
              />
              <span className="text-xs font-semibold text-slate-300">{meta.name}</span>
            </div>
            <div
              className="text-3xl font-extrabold tracking-tight"
              style={{
                color: isPos ? "#10B981" : "#EF4444",
                textShadow: `0 0 20px ${isPos ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"}`,
              }}
            >
              {fmtPct(m.total_return_pct)}
            </div>
            <div className="flex flex-col">
              <Stat label="MDD" value={fmtPct(m.mdd_pct)} valueClass="text-red-400" />
              <Stat label="거래 횟수" value={`${m.num_trades}회`} />
              <Stat label="승률" value={`${(m.win_rate * 100).toFixed(0)}%`} />
              <Stat label="평균 보유" value={`${m.avg_hold_hours.toFixed(1)}h`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
