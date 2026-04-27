import { ShieldAlert, Flame, ArrowDownUp, Cpu, Shuffle, Lock, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PERSONAS, FREE_PERSONA } from "../constants/personas";

const ICON_MAP = { ShieldAlert, Flame, ArrowDownUp, Cpu, Shuffle };

export default function PersonaCard({ persona, isPurchased }) {
  const navigate = useNavigate();
  const meta = PERSONAS[persona];
  const isFree = persona === FREE_PERSONA;
  const unlocked = isFree || isPurchased;
  const Icon = ICON_MAP[meta.icon] ?? Shuffle;

  return (
    <div
      className={`glass-card rounded-xl flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-1 ${
        unlocked ? "" : "opacity-60"
      }`}
      style={{
        borderTop: `2px solid ${unlocked ? meta.color + "80" : "rgba(255,255,255,0.06)"}`,
        boxShadow: unlocked
          ? `0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px ${meta.color}12`
          : undefined,
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: meta.color + "18",
            color: meta.color,
            boxShadow: `0 0 16px ${meta.color}35`,
          }}
        >
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm">{meta.name}</h3>
            {unlocked ? (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: meta.color + "15",
                  color: meta.color,
                  borderColor: meta.color + "40",
                }}
              >
                {isFree ? "무료" : "구매완료"}
              </span>
            ) : (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/8 text-slate-400 border border-white/10">
                ${meta.price}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-xs text-slate-400 leading-relaxed flex-1">{meta.description}</p>

      {/* 액션 버튼 */}
      {unlocked ? (
        <button
          onClick={() => navigate(`/backtest/${persona}`)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: meta.color,
            boxShadow: `0 0 16px ${meta.color}40`,
          }}
        >
          <PlayCircle size={15} />
          백테스트 시작
        </button>
      ) : (
        <button
          onClick={() => navigate(`/checkout/${persona}`)}
          className="w-full py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all duration-200 hover:bg-white/5"
          style={{ borderColor: meta.color + "60", color: meta.color }}
        >
          <Lock size={13} />
          ${meta.price}에 잠금 해제
        </button>
      )}
    </div>
  );
}
