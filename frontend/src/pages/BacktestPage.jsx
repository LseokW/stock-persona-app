import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, SlidersHorizontal, RotateCcw } from "lucide-react";
import Header from "../components/Header";
import TickerInput from "../components/TickerInput";
import EquityChart from "../components/EquityChart";
import MetricsGrid from "../components/MetricsGrid";
import TradeHistory from "../components/TradeHistory";
import LoadingSpinner from "../components/LoadingSpinner";
import Disclaimer from "../components/Disclaimer";
import AllTickersChart from "../components/AllTickersChart";
import { useAuth } from "../hooks/useAuth";
import { PERSONAS, FREE_PERSONA } from "../constants/personas";
import apiClient from "../api/client";

const DEFAULT_AI_PARAMS = {
  buy_threshold: 0.55,
  sell_threshold: 0.44,
  min_hold_candles: 1,
  max_hold_candles: 48,
};

const PRESETS = [
  {
    label: "정석",
    tag: "최적값",
    tagColor: "#F59E0B",
    desc: "10개 종목 그리드 탐색 최고점 (2026-04-29 기준) — p>0.55 매수, p<0.44 매도, 최대 48h",
    params: { buy_threshold: 0.55, sell_threshold: 0.44, min_hold_candles: 1, max_hold_candles: 48 },
  },
  {
    label: "신중한 진입",
    tag: "보수적",
    tagColor: "#3B82F6",
    desc: "높은 확신(58%)에서만 매수, 48h 이내 청산",
    params: { buy_threshold: 0.58, sell_threshold: 0.44, min_hold_candles: 2, max_hold_candles: 48 },
  },
  {
    label: "단타형",
    tag: "빠른청산",
    tagColor: "#F97316",
    desc: "상승 확신(53%) 이상 진입, 24h 내 청산",
    params: { buy_threshold: 0.53, sell_threshold: 0.48, min_hold_candles: 1, max_hold_candles: 24 },
  },
  {
    label: "초단타",
    tag: "빠른청산",
    tagColor: "#EF4444",
    desc: "최소 확신(51%)으로 자주 진입, 12h 강제 청산",
    params: { buy_threshold: 0.51, sell_threshold: 0.49, min_hold_candles: 1, max_hold_candles: 12 },
  },
];

function ParamSlider({ label, description, value, min, max, step, onChange, format }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-300">{label}</span>
          <span className="text-[10px] text-slate-500 ml-2">{description}</span>
        </div>
        <span className="text-xs font-bold text-violet-400 tabular-nums w-12 text-right">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

function AIParamsPanel({ params, onChange, onReset, activePreset, onPresetSelect }) {
  return (
    <div className="glass-card rounded-2xl p-5 border-t-2 border-violet-500/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-violet-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">AI 파라미터 조정</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RotateCcw size={11} />
          기본값
        </button>
      </div>

      {/* 프리셋 버튼 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.label;
          return (
            <button
              key={preset.label}
              onClick={() => onPresetSelect(preset)}
              className="flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-150"
              style={{
                borderColor: isActive ? preset.tagColor + "80" : "rgba(255,255,255,0.08)",
                backgroundColor: isActive ? preset.tagColor + "12" : "rgba(255,255,255,0.02)",
                boxShadow: isActive ? `0 0 12px ${preset.tagColor}20` : "none",
              }}
            >
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: preset.tagColor + "20",
                  color: preset.tagColor,
                }}
              >
                {preset.tag}
              </span>
              <span className="text-xs font-semibold text-white leading-tight">{preset.label}</span>
              <span className="text-[10px] text-slate-500 leading-tight">{preset.desc}</span>
            </button>
          );
        })}
      </div>

      {/* 슬라이더 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ParamSlider
          label="매수 기준 (p >)"
          description="모델 상승 확률 임계값"
          value={params.buy_threshold}
          min={0.30}
          max={0.70}
          step={0.01}
          onChange={(v) => onChange({ ...params, buy_threshold: v })}
          format={(v) => v.toFixed(2)}
        />
        <ParamSlider
          label="매도 기준 (p <)"
          description="이 확률 아래면 청산"
          value={params.sell_threshold}
          min={0.30}
          max={0.70}
          step={0.01}
          onChange={(v) => onChange({ ...params, sell_threshold: v })}
          format={(v) => v.toFixed(2)}
        />
        <ParamSlider
          label="최소 보유 (캔들)"
          description="매수 후 최소 유지 시간"
          value={params.min_hold_candles}
          min={1}
          max={24}
          step={1}
          onChange={(v) => onChange({ ...params, min_hold_candles: v })}
          format={(v) => `${v}h`}
        />
        <ParamSlider
          label="최대 보유 (캔들)"
          description="강제 청산까지 최대 시간"
          value={params.max_hold_candles}
          min={6}
          max={120}
          step={6}
          onChange={(v) => onChange({ ...params, max_hold_candles: v })}
          format={(v) => `${v}h`}
        />
      </div>

      {params.buy_threshold >= params.sell_threshold && (
        <p className="text-[11px] text-amber-400 mt-4 flex items-center gap-1.5">
          ⚠ 매수 기준이 매도 기준보다 높거나 같으면 즉시 청산될 수 있습니다.
        </p>
      )}
    </div>
  );
}

export default function BacktestPage() {
  const { persona } = useParams();
  const navigate = useNavigate();
  const { purchasedPersonas } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiParams, setAiParams] = useState(DEFAULT_AI_PARAMS);
  const [activePreset, setActivePreset] = useState(null);

  const isFree = persona === FREE_PERSONA;
  const isUnlocked = isFree || purchasedPersonas.includes(persona);
  const meta = PERSONAS[persona];
  const isAI = persona === "ai";
  const isCompare = persona === FREE_PERSONA;

  if (!meta || !isUnlocked) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (ticker) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = {
        ticker,
        period_months: 6,
        initial_capital: 10000,
        persona,
        ...(isAI && { ai_params: aiParams }),
      };
      const res = await apiClient.post("/api/backtest", body);
      setResult(res.data);
    } catch (e) {
      if (e.response?.status === 402) {
        setError("이 페르소나는 잠겨 있습니다");
      } else {
        setError(e.response?.data?.detail ?? e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={14} />
            대시보드
          </Link>
          <span className="text-slate-700">/</span>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full border"
            style={{
              backgroundColor: meta.color + "18",
              color: meta.color,
              borderColor: meta.color + "40",
              boxShadow: `0 0 12px ${meta.color}25`,
            }}
          >
            {meta.name}
          </span>
        </div>

        {/* 전체 비교 안내 배너 */}
        {isCompare && (
          <div className="glass-card rounded-2xl px-5 py-4 border-t-2 border-cyan-500/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
              <span className="text-cyan-400 text-base">⚡</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">전체 비교 모드</p>
              <p className="text-xs text-slate-400 mt-0.5">구매한 페르소나가 동일 종목·기간으로 동시 실행됩니다. 차트와 지표가 나란히 표시됩니다.</p>
            </div>
          </div>
        )}

        {/* AI 파라미터 패널 (AI형만 표시) */}
        {isAI && (
          <AIParamsPanel
            params={aiParams}
            onChange={(p) => { setAiParams(p); setActivePreset(null); }}
            onReset={() => { setAiParams(DEFAULT_AI_PARAMS); setActivePreset(null); }}
            activePreset={activePreset}
            onPresetSelect={(preset) => { setAiParams(preset.params); setActivePreset(preset.label); }}
          />
        )}

        <TickerInput onSubmit={handleSubmit} disabled={loading} />

        {loading && <LoadingSpinner />}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            {error.includes("잠겨") && (
              <Link to="/dashboard" className="text-xs underline text-red-300 hover:text-red-200">
                대시보드로
              </Link>
            )}
          </div>
        )}

        {result && (
          <>
            <EquityChart result={result} />
            <MetricsGrid result={result} />
            <TradeHistory result={result} />
          </>
        )}

        {/* 전체 종목 차트 (전체비교 탭 제외한 단일 페르소나에서만 표시) */}
        {!isCompare && (
          <AllTickersChart persona={persona} aiParams={isAI ? aiParams : null} />
        )}

        <Disclaimer />
      </main>
    </div>
  );
}
