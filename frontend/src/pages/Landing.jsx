import { ShieldAlert, Flame, ArrowDownUp, Cpu, ArrowRight, BarChart2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const PREVIEWS = [
  { icon: ShieldAlert, name: "겁쟁이",   color: "#3B82F6", desc: "보수적 진입, 손익 ±2% 정리" },
  { icon: Flame,       name: "야수",     color: "#EF4444", desc: "모멘텀 80% 매수, 즉시 손절" },
  { icon: ArrowDownUp, name: "청개구리", color: "#10B981", desc: "급락 반등 기대 역발산 전략" },
  { icon: Cpu,         name: "AI형",     color: "#8B5CF6", desc: "LSTM 확률 기반 자동 매매" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col relative overflow-hidden">
      {/* 배경 글로우 오브 */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[5%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[50%] right-[5%] w-[250px] h-[250px] bg-emerald-600/8 rounded-full blur-[100px] pointer-events-none" />

      {/* 헤더 */}
      <header className="border-b border-white/[0.08] bg-[#0D1117]/60 backdrop-blur-md relative z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-violet-400" />
            <span className="text-sm font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
              페르소나 백테스트
            </span>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative z-10">
        {/* 배지 */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-slow" />
          ML 기반 투자 성향 분석
        </div>

        {/* 제목 */}
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          당신의 투자 성향은<br />수익을 낼 수 있을까요?
        </h1>

        {/* 부제 */}
        <p className="text-slate-400 text-sm max-w-md mb-12 leading-relaxed">
          4가지 AI 페르소나가 동일한 S&P 500 종목을 최근 6개월 동안<br className="hidden sm:block" />
          어떻게 거래했는지 비교해보세요.
        </p>

        {/* 페르소나 미리보기 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12 w-full max-w-xl">
          {PREVIEWS.map(({ icon: Icon, name, color, desc }) => (
            <div
              key={name}
              className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:scale-105 transition-transform duration-200 cursor-default"
              style={{ boxShadow: `0 0 20px ${color}15` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: color + "20",
                  color,
                  boxShadow: `0 0 12px ${color}40`,
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold text-white">{name}</span>
              <span className="text-[10px] text-slate-400 leading-snug">{desc}</span>
            </div>
          ))}
        </div>

        {/* CTA 버튼 */}
        <button
          onClick={() => { window.location.href = `${API_BASE}/auth/google/login`; }}
          className="flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_32px_rgba(139,92,246,0.6)] transition-all duration-200 active:scale-95"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 시작하기
          <ArrowRight size={14} />
        </button>

        <p className="text-[11px] text-slate-500 mt-4">무료 랜덤 백테스트 포함 · 유료 페르소나는 각 $2</p>
      </main>
    </div>
  );
}
