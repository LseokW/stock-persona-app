import { useState } from "react";
import { PERSONAS, PERSONA_ORDER } from "../constants/personas";

export default function TradeHistory({ result }) {
  const [activeId, setActiveId] = useState(PERSONA_ORDER[0]);
  const active = result.personas.find((p) => p.id === activeId);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-4">거래 내역</h2>
      <div className="flex gap-2 mb-4 border-b">
        {PERSONA_ORDER.map((id) => {
          const meta = PERSONAS[id];
          const isActive = id === activeId;
          return (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                isActive ? "text-gray-900" : "text-gray-500 border-transparent"
              }`}
              style={isActive ? { borderColor: meta.color } : {}}
            >
              {meta.name}
            </button>
          );
        })}
      </div>

      {active.trades.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          거래가 발생하지 않았습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="py-2">시점</th>
                <th className="py-2">액션</th>
                <th className="py-2 text-right">가격</th>
                <th className="py-2 text-right">수량</th>
                <th className="py-2 text-right">손익</th>
              </tr>
            </thead>
            <tbody>
              {active.trades.map((t, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 text-gray-700">{t.timestamp.slice(0, 16).replace("T", " ")}</td>
                  <td className="py-2">
                    <span className={t.action === "BUY" ? "text-green-700" : "text-red-700"}>
                      {t.action}
                    </span>
                  </td>
                  <td className="py-2 text-right">${t.price.toFixed(2)}</td>
                  <td className="py-2 text-right">{t.shares.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    {t.pnl !== undefined ? (
                      <span className={t.pnl >= 0 ? "text-green-700" : "text-red-700"}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                      </span>
                    ) : "-"}
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
