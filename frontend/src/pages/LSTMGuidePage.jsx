import { Link } from "react-router-dom";
import { ChevronLeft, Cpu } from "lucide-react";
import Header from "../components/Header";

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08] mt-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.03]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-300">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-slate-400">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ children }) {
  return (
    <pre className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-slate-300 leading-relaxed overflow-x-auto mt-3 whitespace-pre-wrap">
      {children}
    </pre>
  );
}

function InfoBox({ color = "#8B5CF6", children }) {
  return (
    <div
      className="rounded-xl px-5 py-4 mt-4 text-sm text-slate-300 leading-relaxed"
      style={{ backgroundColor: color + "10", border: `1px solid ${color}25` }}
    >
      {children}
    </div>
  );
}

const TOC = [
  { id: "what-is", label: "1. LSTM이란?" },
  { id: "why-rnn", label: "2. 왜 일반 신경망이 아닌가?" },
  { id: "how-works", label: "3. LSTM의 작동 원리" },
  { id: "in-this-app", label: "4. 이 앱에서의 LSTM" },
  { id: "limits", label: "5. LSTM의 한계" },
  { id: "glossary", label: "6. 용어 정리" },
];

export default function LSTMGuidePage() {
  return (
    <div className="min-h-screen bg-[#0D1117]">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={14} />
            대시보드
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Cpu size={12} />
            LSTM 가이드
          </span>
        </div>

        <div className="flex gap-8">
          {/* 사이드 TOC */}
          <aside className="hidden lg:block w-44 flex-shrink-0">
            <div className="sticky top-20 glass-card rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3">목차</p>
              <ul className="space-y-1.5">
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-[11px] text-slate-400 hover:text-violet-400 transition-colors block leading-tight"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* 본문 */}
          <div className="flex-1 space-y-10">
            {/* 제목 */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <Cpu size={20} className="text-violet-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">LSTM이란 무엇인가?</h1>
              </div>
              <p className="text-sm text-slate-400">
                이 앱의 AI 페르소나가 사용하는 딥러닝 모델, LSTM을 쉽게 설명합니다.
              </p>
            </div>

            {/* 1. LSTM이란 */}
            <Section id="what-is" title="LSTM이란?">
              <p className="text-sm text-slate-400 leading-relaxed">
                <strong className="text-slate-200">LSTM(Long Short-Term Memory)</strong>은 시간 순서가 있는 데이터를 다루는 데 특화된 딥러닝 모델입니다.
                주가처럼 <em className="text-violet-300">과거 흐름이 현재에 영향을 주는 데이터</em>를 처리하는 데 적합합니다.
              </p>
              <InfoBox>
                한 문장 요약: <strong className="text-white">"과거를 기억하면서 미래를 예측하는 신경망"</strong>
              </InfoBox>
              <p className="text-sm text-slate-400 leading-relaxed mt-4">
                1997년 Hochreiter와 Schmidhuber가 제안했으며, 음성 인식·번역·주가 예측 등 다양한 시계열 문제에 널리 쓰였습니다.
                최근에는 Transformer 계열 모델이 많은 분야를 대체했지만, 짧은 시계열 예측에서는 LSTM이 여전히 실용적입니다.
              </p>
            </Section>

            {/* 2. 왜 일반 신경망이 아닌가 */}
            <Section id="why-rnn" title="왜 일반 신경망이 아닌가?">
              <p className="text-sm text-slate-400 leading-relaxed">
                일반 신경망(MLP)은 입력을 독립적으로 처리합니다. 즉, 오늘 주가를 볼 때 어제·그제 데이터를 <strong className="text-slate-200">기억하지 못합니다</strong>.
              </p>
              <CodeBlock>{`일반 신경망:
  입력 → 연산 → 출력   (과거 맥락 없음)

RNN:
  입력 + 이전 상태 → 연산 → 출력   (과거를 참조하지만 오래된 것은 잊음)

LSTM:
  입력 + 단기 기억 + 장기 기억 → 연산 → 출력   (무엇을 기억하고 잊을지 스스로 결정)`}</CodeBlock>
              <p className="text-sm text-slate-400 leading-relaxed mt-4">
                기존 RNN은 과거 정보가 멀어질수록 기울기가 소실되는 문제(<strong className="text-slate-200">기울기 소실 문제</strong>)가 있습니다.
                LSTM은 이를 해결하기 위해 <em className="text-violet-300">게이트(gate)</em> 구조를 도입했습니다.
              </p>
            </Section>

            {/* 3. 작동 원리 */}
            <Section id="how-works" title="LSTM의 작동 원리">
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                LSTM 셀 내부에는 세 가지 게이트가 있습니다. 각 게이트는 0~1 사이 값으로 정보를 얼마나 통과시킬지 결정합니다.
              </p>

              <div className="space-y-3">
                {[
                  {
                    gate: "망각 게이트 (Forget Gate)",
                    color: "#EF4444",
                    desc: "장기 기억 중 무엇을 버릴지 결정합니다. 0이면 완전히 삭제, 1이면 그대로 유지.",
                    example: "예: '3일 전 급등 신호는 이제 의미 없다' → 잊기로 결정",
                  },
                  {
                    gate: "입력 게이트 (Input Gate)",
                    color: "#3B82F6",
                    desc: "새로운 정보 중 무엇을 장기 기억에 추가할지 결정합니다.",
                    example: "예: '방금 거래량이 급증했다' → 기억하기로 결정",
                  },
                  {
                    gate: "출력 게이트 (Output Gate)",
                    color: "#10B981",
                    desc: "현재 기억을 바탕으로 다음 예측값(단기 기억)을 얼마나 출력할지 결정합니다.",
                    example: "예: '지금 상황에서 상승 확률은 0.63이다' → 출력",
                  },
                ].map(({ gate, color, desc, example }) => (
                  <div
                    key={gate}
                    className="glass-card rounded-xl p-4 border-l-4"
                    style={{ borderLeftColor: color }}
                  >
                    <p className="text-xs font-bold mb-1" style={{ color }}>{gate}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                    <p className="text-[11px] text-slate-600 mt-1.5 italic">{example}</p>
                  </div>
                ))}
              </div>

              <InfoBox color="#8B5CF6">
                <strong className="text-white">핵심:</strong> LSTM은 "무엇을 기억하고, 무엇을 잊고, 무엇을 출력할지"를 데이터로부터 <strong className="text-white">스스로 학습</strong>합니다.
                사람이 규칙을 정해주지 않아도 됩니다.
              </InfoBox>
            </Section>

            {/* 4. 이 앱에서의 LSTM */}
            <Section id="in-this-app" title="이 앱에서의 LSTM">
              <p className="text-sm text-slate-400 leading-relaxed">
                이 앱의 AI 페르소나(초보 예언가)는 PyTorch로 구현된 LSTM 모델을 사용합니다.
              </p>

              <div className="mt-4 space-y-4">
                <div className="glass-card rounded-xl p-5">
                  <p className="text-xs font-bold text-slate-200 mb-3">입력 → 출력 흐름</p>
                  <CodeBlock>{`최근 60봉 OHLCV 데이터 (지표 계산 컨텍스트)
  ↓ 피처 변환 (6개)
  - 로그 수익률:      ln(close_t / close_{t-1})
  - 가격 범위 비율:   (high - low) / close
  - 정규화 거래량:    (log(volume) - mean) / std
  - RSI(14) 정규화:   (RSI - 50) / 50  → [-1, 1]
  - MACD 히스토그램:  (MACD선 - 시그널선) / close
  - 볼린저밴드 위치:  (close - MA20) / (2 × σ20)
  ↓ 마지막 24봉 추출 → LSTM 입력
  ↓ Sigmoid 활성화
출력: 다음 1시간봉 상승 확률 p (0 ~ 1)`}</CodeBlock>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <p className="text-xs font-bold text-slate-200 mb-3">매매 결정 방식</p>
                  <Table
                    headers={["조건", "행동"]}
                    rows={[
                      ["p > 0.52", "자본의 50% 매수"],
                      ["최소 2봉 보유 후 p < 0.48", "전량 매도"],
                      ["48봉(약 2거래일) 초과", "강제 청산"],
                    ]}
                  />
                </div>
              </div>
            </Section>

            {/* 5. 한계 */}
            <Section id="limits" title="LSTM의 한계">
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                LSTM이 강력하다고 해서 주가를 잘 예측할 수 있다는 의미는 아닙니다.
              </p>
              <Table
                headers={["한계", "설명"]}
                rows={[
                  ["효율적 시장 가설", "주가에는 이미 알려진 모든 정보가 반영되어 있어, 패턴으로 이기기 매우 어렵습니다"],
                  ["노이즈 과적합", "과거 데이터의 우연한 패턴을 학습해 미래에 작동하지 않을 수 있습니다"],
                  ["뉴스·이벤트 미반영", "실적 발표, 금리 결정 같은 외부 충격은 OHLCV 데이터에 나타나지 않습니다"],
                  ["분포 이동", "시장 환경이 바뀌면 과거에 학습한 패턴이 무효화됩니다"],
                ]}
              />
              <InfoBox color="#EF4444">
                이 앱의 LSTM 모델은 <strong className="text-white">교육 목적</strong>으로 제작됐습니다.
                실제 투자에서 수익을 보장하지 않으며, 결과가 좋게 나오더라도 과거 시뮬레이션일 뿐입니다.
              </InfoBox>
            </Section>

            {/* 6. 용어 정리 */}
            <Section id="glossary" title="용어 정리">
              <Table
                headers={["용어", "설명"]}
                rows={[
                  ["LSTM", "Long Short-Term Memory. 장단기 기억 신경망"],
                  ["RNN", "Recurrent Neural Network. 순환 신경망. LSTM의 전신"],
                  ["게이트(Gate)", "정보를 얼마나 통과시킬지 결정하는 LSTM 내부 구조"],
                  ["기울기 소실", "역전파 시 기울기가 너무 작아져 학습이 안 되는 현상. LSTM이 해결"],
                  ["시계열", "시간 순서가 있는 데이터. 주가·기온·심박수 등"],
                  ["Sigmoid", "0~1 사이 값을 출력하는 활성화 함수. 확률 출력에 사용"],
                  ["오버피팅", "과거 데이터에 지나치게 맞춰 미래엔 잘 작동하지 않는 현상"],
                  ["Transformer", "현재 NLP·이미지 등 대부분 분야에서 LSTM을 대체한 모델 구조"],
                ]}
              />
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}
