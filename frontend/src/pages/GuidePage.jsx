import { Link } from "react-router-dom";
import { ChevronLeft, BookOpen, AlertTriangle, TrendingUp, Shield, Cpu, ArrowDownUp, Flame } from "lucide-react";
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

function SubSection({ title, children }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08] mt-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.03]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-300">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-slate-400">
                  {cell}
                </td>
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

function PersonaBlock({ icon, name, color, strategy, traits }) {
  return (
    <div
      className="glass-card rounded-xl p-5 border-l-4 mt-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="text-sm font-bold" style={{ color }}>
          {name}
        </h3>
      </div>
      <CodeBlock>{strategy}</CodeBlock>
      <p className="text-[11px] text-slate-500 mt-2">{traits}</p>
    </div>
  );
}

const TOC = [
  { id: "what-is", label: "1. 백테스트란?" },
  { id: "structure", label: "2. 앱의 백테스트 구조" },
  { id: "personas", label: "3. 페르소나별 전략" },
  { id: "metrics", label: "4. 성과 지표 해석" },
  { id: "all-tickers", label: "5. 전체 종목 분석" },
  { id: "compare", label: "6. 전체 비교 모드" },
  { id: "tips", label: "7. 결과를 올바르게 읽는 법" },
  { id: "glossary", label: "8. 용어 정리" },
];

export default function GuidePage() {
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
            <BookOpen size={12} />
            백테스트 가이드
          </span>
        </div>

        <div className="flex gap-8">
          {/* 사이드 TOC (데스크탑) */}
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
                  <BookOpen size={20} className="text-violet-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">백테스트 완전 가이드</h1>
              </div>
              <p className="text-sm text-slate-400 ml-13">
                페르소나 백테스트 앱의 작동 원리와 결과를 올바르게 해석하는 방법을 설명합니다.
              </p>
            </div>

            {/* 1. 백테스트란 */}
            <Section id="what-is" title="백테스트란?">
              <p className="text-sm text-slate-400 leading-relaxed">
                <strong className="text-slate-200">백테스트(Backtest)</strong>는 과거 데이터에 특정 투자 전략을 적용해{" "}
                <em className="text-violet-300">"만약 그때 이 전략을 썼다면 얼마를 벌었을까?"</em>를 시뮬레이션하는 기법입니다.
              </p>
              <CodeBlock>과거 주가 데이터 + 매매 전략 규칙 → 가상의 매매 실행 → 성과 측정</CodeBlock>

              <SubSection title="왜 백테스트를 하나요?">
                <p className="text-sm text-slate-400 leading-relaxed">
                  실제 돈을 투자하기 전에 전략의 강점과 약점을 파악할 수 있습니다.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-400">
                  <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span>어떤 시장 환경에서 수익이 났는가?</li>
                  <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span>최악의 경우 얼마나 잃었는가?</li>
                  <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span>거래가 충분히 자주 발생하는가?</li>
                </ul>
              </SubSection>

              <SubSection title="백테스트의 한계">
                <Table
                  headers={["한계", "설명"]}
                  rows={[
                    ["과거 ≠ 미래", "과거에 잘 통한 전략이 미래에도 통한다는 보장이 없습니다"],
                    ["생존 편향", "현재까지 살아남은 종목만 분석하므로 실제보다 낙관적으로 보일 수 있습니다"],
                    ["슬리피지 미반영", "실제 거래에서는 원하는 가격에 체결되지 않을 수 있습니다"],
                    ["유동성 가정", "언제든 원하는 수량을 매매할 수 있다고 가정합니다"],
                  ]}
                />
              </SubSection>
            </Section>

            {/* 2. 앱의 구조 */}
            <Section id="structure" title="앱의 백테스트 구조">
              <SubSection title="데이터">
                <ul className="space-y-1 text-sm text-slate-400">
                  <li className="flex items-start gap-2"><span className="text-slate-500">출처</span><span>Yahoo Finance (yfinance)</span></li>
                  <li className="flex items-start gap-2"><span className="text-slate-500">봉</span><span>1시간봉 (1-hour candlestick)</span></li>
                  <li className="flex items-start gap-2"><span className="text-slate-500">기간</span><span>최근 6개월</span></li>
                  <li className="flex items-start gap-2"><span className="text-slate-500">시장</span><span>미국 정규장만 포함 (09:30 ~ 16:00 ET, 주말·공휴일 제외)</span></li>
                  <li className="flex items-start gap-2"><span className="text-slate-500">대상</span><span>AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, JPM, V, WMT</span></li>
                </ul>
                <p className="text-xs text-slate-500 mt-2">* 1시간봉 6개월 ≈ 약 840개 캔들 (130거래일 × 6.5시간)</p>
              </SubSection>

              <SubSection title="시뮬레이션 흐름">
                <CodeBlock>{`1. 과거 6개월 1시간봉 데이터 로드
2. 첫 60봉은 워밍업 구간 (AI형 기술 지표 계산 준비)
3. t=24 봉부터 매봉마다:
   a. 페르소나가 현재까지의 데이터를 보고 매수/매도/관망 결정
   b. 결정에 따라 포트폴리오 업데이트 (수수료 0.05% 적용)
   c. 현재 자산 가치 기록 → 수익 곡선 생성
4. 마지막 봉까지 반복
5. 전체 지표 계산`}</CodeBlock>
              </SubSection>

              <SubSection title="포트폴리오 규칙">
                <Table
                  headers={["항목", "값"]}
                  rows={[
                    ["시작 자본", "$10,000"],
                    ["동시 포지션", "1개만 보유 가능"],
                    ["수수료", "매수·매도 각 0.05%"],
                    ["공매도", "없음 (매수만 가능)"],
                  ]}
                />
              </SubSection>
            </Section>

            {/* 3. 페르소나별 전략 */}
            <Section id="personas" title="페르소나별 전략 상세">
              <PersonaBlock
                icon="🛡️"
                name="신중함 (Coward)"
                color="#3B82F6"
                strategy={`매수 조건:
  1. 최근 12봉 이동평균 > 그 이전 12봉 이동평균 (상승 추세)
  2. 현재가 - 이동평균 < ±0.5% (MA 근처에서만 진입)
  → 두 조건 모두 충족 시 가용 자본의 20% 매수

매도 조건:
  - 진입가 대비 +2% 도달 → 익절
  - 진입가 대비 -2% 도달 → 손절`}
                traits="특징: 거래 빈도 낮음, MDD 작음, 횡보장에서 거래 거의 없음"
              />
              <PersonaBlock
                icon="👥"
                name="개미 (Beast)"
                color="#EF4444"
                strategy={`매수 조건:
  - 직전 3봉 수익률 합계 > +0.5% (3시간 연속 상승 모멘텀)
  → 가용 자본의 80% 매수

매도 조건:
  - 직전 1봉 수익률 < -0.3% → 즉시 전량 손절`}
                traits="특징: 거래 빈도 높음, MDD 큼, 강한 추세장에서 강함"
              />
              <PersonaBlock
                icon="🔥"
                name="야수의 심장 (Contrarian)"
                color="#10B981"
                strategy={`매수 조건:
  - 직전 1봉 수익률 < -1% (1시간 내 급락)
  → 가용 자본의 50% 매수

매도 조건:
  - 진입가 대비 +1% 도달 → 익절
  - 진입가 대비 -1% 도달 → 손절`}
                traits="특징: 급락 후 반등 시 빠른 수익, 하락 추세가 지속되면 연속 손절 위험"
              />
              <PersonaBlock
                icon="🤖"
                name="초보 예언가 (AI)"
                color="#8B5CF6"
                strategy={`매 봉마다:
  1. 최근 60봉으로 RSI·MACD·볼린저밴드 등 6개 피처 계산
  2. 마지막 24봉을 LSTM에 입력 → 다음 봉 상승 확률 p (0~1) 출력

매수 조건:
  - 포지션 없음 AND p > 0.52
  → 가용 자본의 50% 매수

매도 조건:
  - 최소 2봉 이상 보유 AND p < 0.48 → 전량 매도
  - 48봉(약 2거래일) 초과 → 강제 청산`}
                traits="특징: RSI·MACD·볼린저밴드 6개 피처 학습 / AAPL·MSFT·SPY 3종목 데이터로 훈련"
              />
            </Section>

            {/* 4. 성과 지표 */}
            <Section id="metrics" title="성과 지표 해석">
              <div className="space-y-5">
                {[
                  {
                    title: "수익률 (Total Return %)",
                    formula: "수익률 = (최종 자산 / 시작 자본 - 1) × 100",
                    desc: "양수면 수익, 음수면 손실. Buy & Hold(같은 기간 사서 보유만) 수익률과 비교합니다.",
                  },
                  {
                    title: "MDD (Maximum Drawdown, 최대 낙폭)",
                    formula: "MDD = min((현재 자산 - 직전 고점) / 직전 고점) × 100",
                    desc: "포트폴리오가 고점 대비 최대 얼마나 떨어졌는지를 나타냅니다. MDD가 -20%라면 고점에서 매수한 사람은 자산이 한때 20% 줄어든 것을 견뎌야 했습니다.",
                  },
                  {
                    title: "승률 (Win Rate)",
                    formula: "승률 = (수익 실현 매도 횟수) / (전체 매도 횟수)",
                    desc: "승률이 높다고 반드시 좋은 전략이 아닙니다. 승률 40%라도 수익 거래의 이익이 손실 거래의 손실보다 크면 전체 수익이 날 수 있습니다.",
                  },
                  {
                    title: "거래 횟수",
                    formula: "",
                    desc: "매수 기준으로 집계합니다. 너무 적으면 전략이 거의 작동하지 않는 것, 너무 많으면 수수료 부담이 커집니다.",
                  },
                  {
                    title: "평균 보유 시간",
                    formula: "",
                    desc: "매수 시점부터 매도 시점까지의 평균 시간(시간 단위). 단기 전략은 수 시간, 장기 전략은 수십~수백 시간.",
                  },
                ].map(({ title, formula, desc }) => (
                  <div key={title} className="glass-card rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
                    {formula && <CodeBlock>{formula}</CodeBlock>}
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">MDD 해석 기준</p>
                <Table
                  headers={["MDD", "해석"]}
                  rows={[
                    ["0% ~ -5%", "매우 안정적"],
                    ["-5% ~ -15%", "보통"],
                    ["-15% ~ -30%", "변동성 큼, 버티기 어려울 수 있음"],
                    ["-30% 이하", "고위험, 심리적으로 매우 힘든 구간"],
                  ]}
                />
              </div>
            </Section>

            {/* 5. 전체 종목 */}
            <Section id="all-tickers" title="전체 종목 분석">
              <p className="text-sm text-slate-400 leading-relaxed">
                단일 종목 결과는 <strong className="text-slate-200">운의 영향</strong>이 클 수 있습니다. 10개 종목 전체를 한 번에 돌리면:
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
                <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span>전략이 특정 종목에 편향됐는지 확인 가능</li>
                <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span>전략의 <strong className="text-slate-200">일반성</strong>을 검증할 수 있습니다</li>
                <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span>수익 종목 수 / 전체 10개 비율로 전략의 안정성 판단</li>
              </ul>
            </Section>

            {/* 6. 전체 비교 */}
            <Section id="compare" title="전체 비교 모드">
              <p className="text-sm text-slate-400 leading-relaxed">
                구매한 페르소나를 <strong className="text-slate-200">동일 종목·동일 기간·동일 자본</strong>으로 동시에 실행합니다.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
                <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span>같은 출발점에서 전략 간 성과를 공정하게 비교 가능</li>
                <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span>수익 곡선 차트에서 각 전략의 리스크·변동성 패턴 차이를 시각적으로 확인</li>
              </ul>
            </Section>

            {/* 7. 결과를 올바르게 읽는 법 */}
            <Section id="tips" title="결과를 올바르게 읽는 법">
              <SubSection title="좋은 전략의 기준 (참고용)">
                <Table
                  headers={["지표", "참고 기준"]}
                  rows={[
                    ["수익률", "Buy & Hold 수익률 이상"],
                    ["MDD", "-15% 이내"],
                    ["승률", "40% 이상"],
                    ["거래 횟수", "5회 이상 (통계적 의미)"],
                  ]}
                />
              </SubSection>

              <SubSection title="자주 하는 실수">
                <div className="space-y-2 mt-2">
                  {[
                    ["수익률만 보기", "MDD가 크면 실제로 버티기 어렵습니다"],
                    ["1개 종목 결과로 일반화", "반드시 여러 종목으로 검증하세요"],
                    ["백테스트 결과를 그대로 믿기", "실제 투자에는 심리·세금·유동성 등 변수가 추가됩니다"],
                    ["파라미터 과최적화(오버피팅)", "과거 데이터에만 맞춘 파라미터는 미래에 잘 작동하지 않을 수 있습니다"],
                  ].map(([title, desc], i) => (
                    <div key={i} className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                      <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-amber-300">{title}</span>
                        <span className="text-xs text-slate-400"> — {desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SubSection>
            </Section>

            {/* 8. 용어 정리 */}
            <Section id="glossary" title="용어 정리">
              <Table
                headers={["용어", "설명"]}
                rows={[
                  ["캔들 / 봉", "일정 기간의 시가·고가·저가·종가를 하나로 표현한 단위. 이 앱은 1시간봉 사용"],
                  ["이동평균 (MA)", "최근 N봉의 종가 평균. 추세 방향 판단에 사용"],
                  ["모멘텀", "가격 변화의 속도·방향. 오르는 것이 계속 오르는 경향"],
                  ["역발상 전략", "시장의 반대로 행동하는 전략. 과매도 시 매수, 과매수 시 매도"],
                  ["LSTM", "Long Short-Term Memory. 시계열 데이터 예측에 특화된 딥러닝 모델"],
                  ["로그 수익률", "ln(P_t / P_{t-1}). 수익률을 정규 분포에 가깝게 변환한 값"],
                  ["수수료 (Fee)", "거래 시 발생하는 비용. 이 앱은 매수·매도 각 0.05% 적용"],
                  ["Buy & Hold", "처음에 사서 끝까지 보유하는 단순 전략. 비교 기준으로 사용"],
                  ["오버피팅", "과거 데이터에 지나치게 맞춰 미래 데이터에는 잘 작동하지 않는 현상"],
                ]}
              />
            </Section>

            {/* 면책 고지 */}
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-5 py-4 text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-400">면책 고지</strong> — 이 앱의 모든 백테스트 결과는 교육 목적의 과거 시뮬레이션입니다.
              실제 투자 수익을 보장하지 않으며, 투자 판단의 근거로 사용하지 마세요.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
