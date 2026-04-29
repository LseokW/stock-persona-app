import { ShieldAlert, Flame, ArrowDownUp, Cpu, Shuffle, Layers, Lock, PlayCircle, Info, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PERSONAS, FREE_PERSONA, PAID_PERSONAS } from "../constants/personas";

const ICON_MAP = { ShieldAlert, Flame, ArrowDownUp, Cpu, Shuffle, Layers };
const RISK_COLORS = ["", "#10B981", "#3B82F6", "#F59E0B", "#F97316", "#EF4444"];
const RISK_LABELS = ["", "매우 낮음", "낮음", "보통", "높음", "매우 높음"];

function RiskDots({ level }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-3 h-1.5 rounded-full"
            style={{
              backgroundColor: i <= level ? RISK_COLORS[level] : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
      <span className="text-[10px]" style={{ color: RISK_COLORS[level] }}>
        {RISK_LABELS[level]}
      </span>
    </div>
  );
}

const PERSONA_COLORS = {
  coward: "#3B82F6",
  beast: "#EF4444",
  contrarian: "#10B981",
  ai: "#8B5CF6",
};

export default function PersonaCard({ persona, isPurchased, purchasedPersonas = [] }) {
  const navigate = useNavigate();
  const meta = PERSONAS[persona];
  const isFree = persona === FREE_PERSONA;
  const unlocked = isFree || isPurchased;
  const Icon = ICON_MAP[meta.icon] ?? Shuffle;
  const isCompare = persona === FREE_PERSONA;

  return (
    <div
      className={`glass-card rounded-xl flex flex-col gap-3 p-5 transition-all duration-300 hover:-translate-y-1 ${
        unlocked ? "" : "opacity-70"
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
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-white text-sm">{meta.name}</h3>
            {unlocked && !isCompare ? (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: meta.color + "15",
                  color: meta.color,
                  borderColor: meta.color + "40",
                }}
              >
                구매완료
              </span>
            ) : (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/8 text-slate-400 border border-white/10">
                ${meta.price}
              </span>
            )}
          </div>
          {/* 위험도 (전체 비교 탭 제외) */}
          {!isCompare && <RiskDots level={meta.risk_level} />}
        </div>
      </div>

      {/* 설명 */}
      <p className="text-xs text-slate-400 leading-relaxed flex-1">{meta.description}</p>

      {/* 전체 비교: 보유 페르소나 현황 */}
      {isCompare ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">보유 페르소나</p>
          <div className="flex gap-1.5">
            {PAID_PERSONAS.map((pid) => {
              const owned = purchasedPersonas.includes(pid);
              return (
                <div
                  key={pid}
                  className="flex-1 py-1 rounded-lg text-center text-[10px] font-semibold border transition-all"
                  style={{
                    backgroundColor: owned ? PERSONA_COLORS[pid] + "20" : "rgba(255,255,255,0.04)",
                    color: owned ? PERSONA_COLORS[pid] : "#475569",
                    borderColor: owned ? PERSONA_COLORS[pid] + "50" : "rgba(255,255,255,0.08)",
                  }}
                >
                  {PERSONAS[pid].name}
                </div>
              );
            })}
          </div>
          {purchasedPersonas.length === 0 && (
            <p className="text-[10px] text-amber-500/80">페르소나를 먼저 구매해주세요</p>
          )}
        </div>
      ) : (
        /* 일반 카드: 특성 태그 */
        <div className="flex flex-wrap gap-1">
          {meta.traits.map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: meta.color + "10",
                color: meta.color + "cc",
                borderColor: meta.color + "30",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-1.5">
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
        <button
          onClick={() => navigate(`/persona/${persona}`)}
          className="w-full py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1.5 transition-colors duration-200 hover:bg-white/5"
        >
          <Info size={12} />
          전략 상세보기
        </button>
      </div>
    </div>
  );
}
