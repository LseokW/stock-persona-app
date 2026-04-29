import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phase, setPhase] = useState("loading"); // loading | enter | visible | leaving

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    login(token).then(() => {
      setPhase("enter");
      setTimeout(() => setPhase("visible"), 50);
      setTimeout(() => setPhase("leaving"), 3000);
      setTimeout(() => navigate("/dashboard", { replace: true }), 5800);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <span className="w-7 h-7 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#050508] flex flex-col items-center justify-center px-8 text-center"
      style={{
        opacity: phase === "visible" ? 1 : 0,
        transition: phase === "leaving"
          ? "opacity 2800ms cubic-bezier(0.4, 0, 1, 1)"
          : "opacity 500ms ease-out",
      }}
    >
      <p
        className="text-2xl sm:text-[2rem] font-light text-white leading-relaxed max-w-2xl mb-8"
        style={{ fontFamily: "'Batang', '바탕', 'Nanum Myeongjo', serif", letterSpacing: "0.01em" }}
      >
        "나는 천체의 움직임을 계산할 수 있지만,<br />
        인간의 광기는 계산할 수 없다."
      </p>
      <p className="text-sm text-slate-500 tracking-[0.2em]">— 아이작 뉴턴</p>
    </div>
  );
}
