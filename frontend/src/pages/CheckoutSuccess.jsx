import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { getCheckoutStatus } from "../api/checkout";
import Header from "../components/Header";
import { useAuth } from "../hooks/useAuth";

const MAX_POLLS = 30;
const POLL_INTERVAL_MS = 2000;

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const checkoutId = searchParams.get("checkout_id");

  const [status, setStatus] = useState("pending");
  const [pollCount, setPollCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!checkoutId) {
      navigate("/dashboard", { replace: true });
      return;
    }

    let count = 0;

    const poll = async () => {
      try {
        const data = await getCheckoutStatus(checkoutId);
        count += 1;
        setPollCount(count);

        if (data.status === "completed") {
          setStatus("completed");
          await refreshUser();
          navigate("/dashboard", { replace: true });
          return;
        }

        if (data.status === "failed" || data.status === "expired") {
          setStatus(data.status);
          return;
        }

        if (count >= MAX_POLLS) {
          setStatus("timeout");
          return;
        }

        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        setStatus("error");
      }
    };

    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [checkoutId]); // eslint-disable-line react-hooks/exhaustive-deps

  const STATES = {
    pending: {
      icon: <span className="w-10 h-10 border-[3px] border-gray-200 border-t-violet-500 rounded-full animate-spin" />,
      title: "결제 확인 중",
      desc: `잠시만 기다려 주세요 (${pollCount}/${MAX_POLLS})`,
      sub: "Polar에서 결제 상태를 확인하고 있습니다.",
      btn: null,
    },
    timeout: {
      icon: <Clock size={40} className="text-amber-400" />,
      title: "확인 지연",
      desc: "결제 확인이 지연되고 있습니다.",
      sub: "잠시 후 대시보드에서 다시 확인해 주세요.",
      btn: "대시보드로 이동",
    },
    failed: {
      icon: <XCircle size={40} className="text-red-400" />,
      title: "결제 실패",
      desc: "결제에 실패했습니다.",
      sub: "다시 시도하거나 다른 결제 수단을 이용해 주세요.",
      btn: "대시보드로 이동",
    },
    expired: {
      icon: <XCircle size={40} className="text-gray-400" />,
      title: "결제 만료",
      desc: "결제 시간이 초과됐습니다.",
      sub: "처음부터 다시 시도해 주세요.",
      btn: "대시보드로 이동",
    },
    error: {
      icon: <AlertTriangle size={40} className="text-amber-400" />,
      title: "오류 발생",
      desc: "결제 상태를 확인할 수 없습니다.",
      sub: "네트워크 문제일 수 있습니다. 대시보드에서 확인해 주세요.",
      btn: "대시보드로 이동",
    },
    completed: {
      icon: <CheckCircle size={40} className="text-emerald-500" />,
      title: "결제 완료",
      desc: "페르소나가 잠금 해제됐습니다!",
      sub: null,
      btn: null,
    },
  };

  const s = STATES[status] ?? STATES.pending;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-sm mx-auto px-6 py-20 flex flex-col items-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center gap-4 text-center w-full">
          {s.icon}
          <h2 className="text-base font-bold text-gray-900">{s.title}</h2>
          <p className="text-sm text-gray-600">{s.desc}</p>
          {s.sub && <p className="text-xs text-gray-400">{s.sub}</p>}
          {s.btn && (
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              {s.btn}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
