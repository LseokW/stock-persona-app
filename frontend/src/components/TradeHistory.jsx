import { useState } from "react";
import { PERSONAS } from "../constants/personas";

export default function TradeHistory({ result }) {
  const [activeId, setActiveId] = useState(result.personas[0]?.id);
  const active = result.personas.find((p) => p.id === activeId);

  if (!active) return null;

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-base font-bold text-white mb-4">거래 내역</h2>
      <div className="flex gap-1 mb-4 border-b border-white/[0.08]">
        {result.personas.map((p) => {
          const meta = PERSONAS[p.id];
          const isActive = p.id === activeId;
          return (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                isActive ? "text-white" : "text-slate-500 border-transparent hover:text-slate-300"
              }`}
              style={isActive ? { borderColor: meta?.color ?? "#6B7280" } : {}}
            >
              {meta?.name ?? p.id}
            </button>
          );
        })}
      </div>

      {active.trades.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500">거래가 발생하지 않았습니다.</p>
          <p className="text-sm text-emerald-400 font-semibold mt-1.5">이것이 정답입니다!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b border-white/[0.08]">
              <tr>
                <th className="py-2 text-xs font-medium text-slate-500">시점</th>
                <th className="py-2 text-xs font-medium text-slate-500">액션</th>
                <th className="py-2 text-xs font-medium text-slate-500 text-right">가격</th>
                <th className="py-2 text-xs font-medium text-slate-500 text-right">수량</th>
                <th className="py-2 text-xs font-medium text-slate-500 text-right">손익</th>
              </tr>
            </thead>
            <tbody>
              {active.trades.map((t, i) => (
                <tr key={i} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 text-xs text-slate-400 font-mono">{t.timestamp.slice(0, 16).replace("T", " ")}</td>
                  <td className="py-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        t.action === "BUY"
                          ? "text-emerald-400 bg-emerald-400/10"
                          : "text-red-400 bg-red-400/10"
                      }`}
                    >
                      {t.action}
                    </span>
                  </td>
                  <td className="py-2 text-xs text-slate-300 text-right font-mono">${t.price.toFixed(2)}</td>
                  <td className="py-2 text-xs text-slate-300 text-right font-mono">{t.shares.toFixed(2)}</td>
                  <td className="py-2 text-xs text-right font-mono font-semibold">
                    {t.pnl !== undefined ? (
                      <span className={t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
