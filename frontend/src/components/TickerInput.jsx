import { useState } from "react";
import { Search } from "lucide-react";

const SUGGESTED = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "WMT"];

export default function TickerInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("AAPL");

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim().toUpperCase());
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        종목 티커
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 disabled:opacity-40 transition-all duration-200 font-mono tracking-widest"
          placeholder="AAPL"
          disabled={disabled}
        />
        <button
          onClick={submit}
          disabled={disabled}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold rounded-xl hover:from-violet-500 hover:to-violet-400 disabled:opacity-40 transition-all duration-200 shadow-[0_0_16px_rgba(139,92,246,0.3)] flex items-center gap-2 active:scale-95"
        >
          <Search size={14} />
          실행
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTED.map((t) => (
          <button
            key={t}
            onClick={() => setValue(t)}
            disabled={disabled}
            className="text-xs px-3 py-1.5 bg-white/5 border border-white/[0.08] text-slate-400 rounded-lg hover:bg-white/10 hover:text-white hover:border-white/15 disabled:opacity-40 transition-all duration-200 font-mono tracking-wide"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
