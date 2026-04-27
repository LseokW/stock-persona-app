import Header from "../components/Header";
import PersonaCard from "../components/PersonaCard";
import { useAuth } from "../hooks/useAuth";
import { FREE_PERSONA, PAID_PERSONAS } from "../constants/personas";

const ALL_DISPLAY = [FREE_PERSONA, ...PAID_PERSONAS];

export default function Dashboard() {
  const { purchasedPersonas } = useAuth();

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 pb-6 border-b border-white/[0.08]">
          <h2 className="text-2xl font-bold text-white">페르소나 선택</h2>
          <p className="text-sm text-slate-400 mt-2">
            투자 성향을 골라 S&P 500 종목의 최근 6개월 백테스트를 실행하세요.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_DISPLAY.map((id) => (
            <PersonaCard
              key={id}
              persona={id}
              isPurchased={purchasedPersonas.includes(id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
