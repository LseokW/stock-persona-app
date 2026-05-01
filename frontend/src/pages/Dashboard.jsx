import Header from "../components/Header";
import PersonaCard from "../components/PersonaCard";
import { useAuth } from "../hooks/useAuth";
import { FREE_PERSONA, PAID_PERSONAS, PERSONAS } from "../constants/personas";
import { Shuffle } from "lucide-react";

const ALL_DISPLAY = [FREE_PERSONA, ...PAID_PERSONAS];

export default function Dashboard() {
  const { purchasedPersonas, user } = useAuth();

  const totalOwned = purchasedPersonas.length;
  const totalPersonas = PAID_PERSONAS.length;

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* 상단 인사 */}
        <div className="mb-8 pb-6 border-b border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">
                {user?.name ? `${user.name}님,` : ""} 안녕하세요 👋
              </p>
              <h2 className="text-2xl font-bold text-white">페르소나 선택</h2>
              <p className="text-sm text-slate-400 mt-1.5">
                투자 성향을 골라 S&P 500 종목의 최근 6개월 백테스트를 실행하세요.
              </p>
            </div>

            {/* 보유 현황 뱃지 */}
            <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Shuffle size={15} className="text-violet-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">보유 페르소나</p>
                <p className="text-sm font-bold text-white">
                  {totalOwned} / {totalPersonas}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 페르소나 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_DISPLAY.map((id) => (
            <PersonaCard
              key={id}
              persona={id}
              isPurchased={purchasedPersonas.includes(id)}
              purchasedPersonas={purchasedPersonas}
            />
          ))}
        </div>

        {/* 안내 문구 */}
        <p className="text-center text-xs text-slate-600 mt-8">
          페르소나 카드의 <span className="text-slate-500">전략 상세보기</span>를 눌러 각 전략의 로직과 위험도를 먼저 확인해보세요.
        </p>
      </main>
    </div>
  );
}
