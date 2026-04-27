import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShieldAlert, Flame, ArrowDownUp, Cpu, Shuffle, Lock, CreditCard, ChevronLeft } from "lucide-react";
import { createCheckout } from "../api/checkout";
import Header from "../components/Header";
import { PAID_PERSONAS, PERSONAS } from "../constants/personas";
import { useAuth } from "../hooks/useAuth";

const ICON_MAP = { ShieldAlert, Flame, ArrowDownUp, Cpu, Shuffle };

export default function Checkout() {
  const { persona } = useParams();
  const navigate = useNavigate();
  const { purchasedPersonas } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const meta = PERSONAS[persona];

  if (!meta || !PAID_PERSONAS.includes(persona)) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  if (purchasedPersonas.includes(persona)) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const Icon = ICON_MAP[meta.icon] ?? Shuffle;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await createCheckout(persona);
      window.location.href = data.checkout_url;
    } catch (e) {
      const msg = e.response?.data?.detail ?? "결제 시작에 실패했습니다.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-sm mx-auto px-6 py-12">
        {/* 뒤로 */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-8 transition-colors"
        >
          <ChevronLeft size={14} />
          대시보드로
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center gap-6 text-center shadow-sm">
          {/* 아이콘 */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: meta.color + "1A", color: meta.color }}
          >
            <Icon size={30} strokeWidth={1.8} />
          </div>

          {/* 페르소나 정보 */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{meta.name} 페르소나</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{meta.description}</p>
          </div>

          {/* 가격 */}
          <div className="w-full border-t border-gray-100 pt-5">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-500">{meta.name} 페르소나 잠금 해제</span>
              <span className="font-semibold text-gray-900">${meta.price}.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">영구 이용권</span>
              <span className="text-gray-400">1회 결제</span>
            </div>
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg w-full">{error}</p>
          )}

          {/* 결제 버튼 */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: meta.color }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <CreditCard size={15} />
            )}
            {loading ? "연결 중..." : "결제하기"}
          </button>

          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Lock size={10} />
            Polar 보안 결제
          </p>
        </div>
      </main>
    </div>
  );
}
