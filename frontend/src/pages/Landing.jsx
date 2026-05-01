import { useEffect } from "react";
import {
  ShieldAlert, Flame, ArrowDownUp, Cpu, ArrowRight, BarChart2,
  TrendingUp, Clock, Zap, Shield, Brain, Users
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const PERSONAS = [
  {
    icon: ShieldAlert,
    name: "신중함",
    color: "#3B82F6",
    desc: "보수적 진입, 손익 ±2% 정리",
    risk: 1,
  },
  {
    icon: Users,
    name: "개미",
    color: "#10B981",
    desc: "모멘텀 80% 매수, 즉시 손절",
    risk: 5,
  },
  {
    icon: Flame,
    name: "야수의 심장",
    color: "#EF4444",
    desc: "급락 반등 기대 역발상 전략",
    risk: 3,
  },
  {
    icon: Cpu,
    name: "초보 예언가",
    color: "#8B5CF6",
    desc: "LSTM 확률 기반 자동 매매",
    risk: 2,
  },
];

const RISK_COLORS = ["", "#10B981", "#3B82F6", "#F59E0B", "#F97316", "#EF4444"];

const HOW_IT_WORKS = [
  {
    icon: Brain,
    title: "페르소나 선택",
    desc: "4가지 투자 성향 중 원하는 전략을 선택하세요.",
  },
  {
    icon: TrendingUp,
    title: "종목 입력",
    desc: "S&P 500에 포함된 종목 티커(예: AAPL, TSLA)를 입력하세요.",
  },
  {
    icon: Zap,
    title: "백테스트 실행",
    desc: "AI가 최근 6개월 실제 데이터로 선택한 전략을 시뮬레이션합니다.",
  },
  {
    icon: BarChart2,
    title: "결과 분석",
    desc: "수익률, MDD, 승률, 거래 내역을 시각화로 확인하세요.",
  },
];

const FEATURES = [
  { icon: Shield, label: "실제 주가 데이터", desc: "yfinance 기반 실시간 데이터" },
  { icon: Clock, label: "6개월 시뮬레이션", desc: "최근 6개월 1시간봉 기준" },
  { icon: Brain, label: "LSTM AI 탑재", desc: "딥러닝 모델 기반 매매 신호" },
];

function RiskDots({ level }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-2.5 h-1 rounded-full"
          style={{
            backgroundColor: i <= level ? RISK_COLORS[level] : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".fade-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col relative overflow-hidden">
      {/* 배경 글로우 */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] left-[5%] w-[350px] h-[350px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[55%] right-[5%] w-[300px] h-[300px] bg-emerald-600/6 rounded-full blur-[120px] pointer-events-none" />

      {/* 헤더 */}
      <header className="border-b border-white/[0.08] bg-[#0D1117]/60 backdrop-blur-md relative z-10 sticky top-0">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-violet-400" />
            <span className="text-sm font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
              Swing Trading 백테스트
            </span>
          </div>
          <button
            onClick={() => { window.location.href = `${API_BASE}/auth/google/login`; }}
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10"
          >
            로그인
          </button>
        </div>
      </header>

      {/* 히어로 */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative z-10">
        {/* 배지 */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          ML 기반 투자 성향 분석
        </div>

        {/* 제목 */}
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
          단기 보유 백테스팅
        </h1>

        {/* 부제 */}
        <p className="text-slate-400 text-base max-w-lg mb-4 leading-relaxed">
          강제청산... 손절... 모멘텀... 4가지 전략이 같은 종목에서 어떤 결말을 맞이하는지 직접 확인해보세요.
        </p>
        <p className="text-slate-500 text-sm mb-12">
          실제 시장 데이터 · LSTM 딥러닝 모델
        </p>

        {/* CTA 버튼 */}
        <button
          onClick={() => { window.location.href = `${API_BASE}/auth/google/login`; }}
          className="flex items-center gap-2.5 px-8 py-4 text-sm font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-[0_0_32px_rgba(139,92,246,0.4)] hover:shadow-[0_0_48px_rgba(139,92,246,0.6)] transition-all duration-200 active:scale-95 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 무료 시작하기
          <ArrowRight size={15} />
        </button>
        <p className="text-[11px] text-slate-500">실제 시장 데이터 기반 · 페르소나별 전략 차이를 직접 확인</p>
      </section>

      {/* Swing Trading 정의 */}
      <section className="fade-section relative z-10 px-6 pb-20 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto pt-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full mb-6">
            <TrendingUp size={12} />
            개념 정리
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Swing Trading이란?</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-2xl">
            수시간에서 수주 단위로 포지션을 유지하며 <span className="text-white font-semibold">단기 가격 흐름</span>에서 수익을 추구하는 전략입니다.
            장기 투자(Buy &amp; Hold)와 초단타(Day Trading) 사이의 중간 영역에 위치합니다.
          </p>

          {/* 비교 테이블 */}
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-1/3">구분</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wide w-1/3">Swing Trading</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-red-400 uppercase tracking-wide w-1/3">Day Trading (단타)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["보유 기간",   "수시간 ~ 수주",          "당일 내 전량 청산"],
                  ["분석 방법",   "기술적 분석 + 차트 패턴", "틱 차트, 초단기 모멘텀"],
                  ["모니터링",    "하루 몇 번 확인",         "시장 시간 내내 집중"],
                  ["스트레스",    "상대적으로 낮음",         "매우 높음"],
                  ["진입 빈도",   "기회 선별, 적게 거래",    "매우 잦은 거래"],
                  ["이 앱 기준",  "최대 48봉(약 2거래일)",   "12봉(12시간) 이내 청산"],
                ].map(([label, swing, day]) => (
                  <tr key={label} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-slate-500 text-xs font-semibold">{label}</td>
                    <td className="px-5 py-3 text-slate-200 text-xs">{swing}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{day}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl px-6 py-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="text-emerald-400 font-semibold">핵심 차이:</span>{" "}
              Day Trading은 하루 안에 모든 포지션을 닫아야 하지만, Swing Trading은 며칠에 걸쳐 추세를 타도 됩니다.
              덜 바쁘고 덜 위험하며, 기관 알고리즘과 직접 부딪히지 않아도 됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* 스캘핑·단타의 현실 */}
      <section className="fade-section relative z-10 px-6 pb-20 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto pt-16">
          <h2 className="text-center text-xl font-bold text-white mb-2">스캘핑 &amp; 단타의 현실</h2>
          <p className="text-center text-sm text-slate-500 mb-10">Swing Trading보다 짧게 들어가면 이런 일이 생겨요</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                stat: "97%",
                label: "300일 이상 단타한 사람 중 손실",
                desc: "브라질 선물 시장 연구 (Fang et al., 2017). 꾸준히 할수록 더 잃습니다.",
                color: "#EF4444",
              },
              {
                stat: "0.3 초",
                label: "기관 HFT의 평균 반응 속도",
                desc: "스캘퍼가 클릭하는 순간 알고리즘은 이미 수십 번 거래했습니다. 속도 싸움에서 개인은 집니다.",
                color: "#F97316",
              },
              {
                stat: "수수료",
                label: "조용히 다 먹고 가요",
                desc: "1일 10회 거래 시 연간 수익의 상당 부분이 수수료로 빠집니다. 이 앱도 0.05% 적용돼요.",
                color: "#F59E0B",
              },
            ].map(({ stat, label, desc, color }) => (
              <div
                key={label}
                className="glass-card rounded-2xl p-5 border-t-2"
                style={{ borderTopColor: color + "80" }}
              >
                <p className="text-3xl font-extrabold mb-1" style={{ color }}>{stat}</p>
                <p className="text-sm font-semibold text-slate-200 mb-2">{label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-red-500/[0.06] border border-red-500/20 rounded-2xl px-6 py-5">
            <p className="text-sm text-slate-300 leading-relaxed text-center">
              <span className="text-red-400 font-semibold">결론:</span>{" "}
              스캘핑·단타는 기관과 알고리즘이 지배하는 영역입니다.{" "}
              <span className="text-white font-semibold">Swing Trading은 그나마 개인이 싸울 수 있는 시간대입니다.</span>
            </p>
          </div>
        </div>
      </section>

      {/* 페르소나 미리보기 */}
      <section className="fade-section relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl font-bold text-white mb-2">4가지 투자 성향</h2>
          <p className="text-center text-sm text-slate-500 mb-8">각기 다른 전략으로 같은 종목을 거래합니다</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PERSONAS.map(({ icon: Icon, name, color, desc, risk }) => (
              <div
                key={name}
                className="glass-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center hover:scale-105 transition-transform duration-200 cursor-default"
                style={{
                  borderTop: `2px solid ${color}50`,
                  boxShadow: `0 0 24px ${color}10`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: color + "20",
                    color,
                    boxShadow: `0 0 16px ${color}40`,
                  }}
                >
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <span className="text-sm font-bold text-white">{name}</span>
                <span className="text-[11px] text-slate-400 leading-snug">{desc}</span>
                <RiskDots level={risk} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="fade-section relative z-10 px-6 pb-20 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto pt-16">
          <h2 className="text-center text-xl font-bold text-white mb-2">어떻게 작동하나요?</h2>
          <p className="text-center text-sm text-slate-500 mb-10">4단계로 내 투자 성향의 수익률을 확인하세요</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="glass-card rounded-2xl p-5 relative">
                <span className="absolute top-4 right-4 text-[11px] font-bold text-slate-700">0{i + 1}</span>
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-violet-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 특징 */}
      <section className="fade-section relative z-10 px-6 pb-20 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto pt-16">
          <h2 className="text-center text-xl font-bold text-white mb-2">주요 특징</h2>
          <p className="text-center text-sm text-slate-500 mb-10">실제 데이터와 AI 기술로 신뢰할 수 있는 결과</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card rounded-2xl p-5 text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon size={18} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">{label}</p>
                  <p className="text-[11px] text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="fade-section relative z-10 px-6 pb-20 border-t border-white/[0.06]">
        <div className="max-w-xl mx-auto pt-16 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">지금 바로 체험해보세요</h2>
          <p className="text-sm text-slate-400 mb-8">Google 계정으로 시작 · 4가지 전략의 결말을 직접 확인</p>
          <button
            onClick={() => { window.location.href = `${API_BASE}/auth/google/login`; }}
            className="flex items-center gap-2.5 px-8 py-4 text-sm font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-[0_0_32px_rgba(139,92,246,0.4)] transition-all duration-200 active:scale-95 mx-auto"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 시작하기
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 size={13} className="text-slate-600" />
            <span className="text-xs text-slate-600 font-medium">단기 보유 백테스팅</span>
          </div>
          <p className="text-[11px] text-slate-700">
            이 서비스는 교육 목적으로 제작되었으며 투자 조언이 아닙니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
