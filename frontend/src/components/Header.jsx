import { Link } from "react-router-dom";
import { LogOut, BarChart2, BookOpen, Cpu } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0D1117]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold">
          <BarChart2 size={18} className="text-violet-400" />
          <span className="text-sm tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            단타 페르소나 백테스트
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/guide"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-violet-500/10"
          >
            <BookOpen size={13} />
            <span className="hidden sm:inline">백테스트 가이드</span>
          </Link>
          <Link
            to="/lstm-guide"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-violet-500/10"
          >
            <Cpu size={13} />
            <span className="hidden sm:inline">LSTM 가이드</span>
          </Link>

          {user && (
            <>
              {user.picture_url && (
                <img
                  src={user.picture_url}
                  alt={user.name ?? ""}
                  className="w-8 h-8 rounded-full ring-2 ring-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                />
              )}
              <span className="text-xs text-slate-400 hidden sm:block">{user.name ?? user.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
              >
                <LogOut size={13} />
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
