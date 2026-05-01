import { useEffect, useState } from "react";

const WARNINGS = [
  "스윙 트레이딩, 재미로만 보세요!",
  "지금 이 시뮬레이션 도는 동안에도 주가는 움직이고 있습니다.",
  "스윙 트레이딩으로 꾸준히 돈 번 사람, 주변에서 본 적 있으신가요?",
  "Buy & Hold가 부끄럽지 않습니다.",
  "증권사는 수수료로 오늘도 잘 자고 있습니다.",
  "결과가 좋게 나와도 실전은 다릅니다. 진짜로요.",
  "이 시뮬레이션이 끝나도 시장은 여러분 편이 아닙니다.",
  "지금 결과 좋으면 '정말?' 하고, 나쁘면 '그럼 그렇지' 하시면 됩니다.",
  "단기 매매의 97%는 손실로 끝납니다. 나머지 3%는 운이었습니다.",
  "S&P 500 ETF 사고 20년 기다리는 게 제일 무서운 전략입니다.",
];

export default function LoadingSpinner() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * WARNINGS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WARNINGS.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-5">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/10 border-t-violet-500" />
      <p className="text-sm text-slate-400">백테스트 실행 중... (5~10초)</p>
      <p
        className="text-xs text-amber-400/80 max-w-xs text-center leading-relaxed transition-opacity duration-400"
        style={{ opacity: visible ? 1 : 0 }}
      >
        ⚠ {WARNINGS[index]}
      </p>
    </div>
  );
}
