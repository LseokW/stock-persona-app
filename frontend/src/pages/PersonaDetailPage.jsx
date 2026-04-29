import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ShieldAlert, Flame, ArrowDownUp, Cpu, Shuffle,
  PlayCircle, Lock, AlertTriangle, CheckCircle2, XCircle,
  TrendingUp, Info, Zap
} from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import { PERSONAS, FREE_PERSONA } from "../constants/personas";

const ICON_MAP = { ShieldAlert, Flame, ArrowDownUp, Cpu, Shuffle };

const RISK_LABELS = ["", "매우 낮음", "낮음", "보통", "높음", "매우 높음"];
const RISK_COLORS = ["", "#10B981", "#3B82F6", "#F59E0B", "#F97316", "#EF4444"];

function RiskBar({ level }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-5 h-2 rounded-full transition-all"
            style={{
              backgroundColor: i <= level ? RISK_COLORS[level] : "rgba(255,255,255,0.1)",
              boxShadow: i <= level ? `0 0 6px ${RISK_COLORS[level]}80` : "none",
            }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: RISK_COLORS[level] }}>
        {RISK_LABELS[level]}
      </span>
    </div>
  );
}

function TraitBadge({ label, color }) {
  return (
    <span
      className="text-[11px] font-medium px-2.5 py-1 rounded-full border"
      style={{
        backgroundColor: color + "18",
        color: color,
        borderColor: color + "40",
      }}
    >
      {label}
    </span>
  );
}

export default function PersonaDetailPage() {
  const { persona } = useParams();
  const navigate = useNavigate();
  const { purchasedPersonas } = useAuth();

  const meta = PERSONAS[persona];
  if (!meta) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const isFree = persona === FREE_PERSONA;
  const isUnlocked = isFree || purchasedPersonas.includes(persona);
  const Icon = ICON_MAP[meta.icon] ?? Shuffle;

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* 브레드크럼 */}
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={14} />
            대시보드
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-xs text-slate-400">페르소나 상세</span>
        </div>

        {/* 히어로 카드 */}
        <div
          className="glass-card rounded-2xl p-7 relative overflow-hidden"
          style={{ borderTop: `2px solid ${meta.color}80` }}
        >
          {/* 배경 글로우 */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ backgroundColor: meta.color, transform: "translate(30%, -30%)" }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: meta.color + "20",
                color: meta.color,
                boxShadow: `0 0 32px ${meta.color}50`,
              }}
            >
              <Icon size={32} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-2xl font-extrabold text-white">{meta.name} 페르소나</h1>
                {isFree ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    무료
                  </span>
                ) : isUnlocked ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    구매완료
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-400 border border-white/10">
                    ${meta.price}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{meta.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {meta.traits.map((t) => (
                  <TraitBadge key={t} label={t} color={meta.color} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 위험도 */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">위험도</span>
          </div>
          <RiskBar level={meta.risk_level} />
        </div>

        {/* 전략 단계 */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">전략 로직</span>
          </div>
          <ol className="space-y-3">
            {meta.strategy_steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: meta.color + "25", color: meta.color }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 적합/불리 시장 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">이런 시장에서 유리</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{meta.best_for}</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={14} className="text-red-400" />
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">이런 시장에서 불리</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{meta.worst_for}</p>
          </div>
        </div>

        {/* 노트 */}
        <div className="glass-card rounded-2xl p-5 border-l-2" style={{ borderLeftColor: meta.color + "80" }}>
          <div className="flex gap-2.5">
            <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: meta.color }} />
            <p className="text-sm text-slate-300 leading-relaxed">{meta.detail_note}</p>
          </div>
        </div>

        {/* 주의사항 */}
        <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-2.5">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-relaxed">
              이 백테스트는 과거 데이터 기반 시뮬레이션입니다. 실제 투자 수익을 보장하지 않으며, 투자 판단의 근거로 사용하지 마세요.
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          {isUnlocked ? (
            <button
              onClick={() => navigate(`/backtest/${persona}`)}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: meta.color,
                boxShadow: `0 0 24px ${meta.color}50`,
              }}
            >
              <PlayCircle size={16} />
              백테스트 시작하기
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(`/checkout/${persona}`)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-95 border"
                style={{
                  backgroundColor: meta.color + "18",
                  color: meta.color,
                  borderColor: meta.color + "60",
                  boxShadow: `0 0 16px ${meta.color}25`,
                }}
              >
                <Lock size={15} />
                ${meta.price}에 잠금 해제
              </button>
            </>
          )}
          <Link
            to="/dashboard"
            className="px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all duration-200 flex items-center"
          >
            목록으로
          </Link>
        </div>

      </main>
    </div>
  );
}
