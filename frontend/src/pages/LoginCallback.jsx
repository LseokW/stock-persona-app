import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    login(token).then(() => navigate("/dashboard", { replace: true }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <span className="w-8 h-8 border-[3px] border-gray-200 border-t-violet-500 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">로그인 처리 중...</p>
    </div>
  );
}
