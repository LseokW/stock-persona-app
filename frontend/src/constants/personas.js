export const PERSONAS = {
  coward: {
    id: "coward",
    name: "겁쟁이",
    description: "이동평균이 상승 중이고 가격이 안정적일 때만 진입. 손익 ±2%에서 정리.",
    color: "#3B82F6",
  },
  beast: {
    id: "beast",
    name: "야수",
    description: "직전 3시간 상승 모멘텀 감지 시 자본 80% 매수. 1시간 -0.3% 하락 시 즉시 정리.",
    color: "#EF4444",
  },
  contrarian: {
    id: "contrarian",
    name: "청개구리",
    description: "직전 1시간 -1% 이상 급락 시 반등 기대 매수. 진입가 대비 ±1%에서 정리.",
    color: "#8B5CF6",
  },
  ai: {
    id: "ai",
    name: "AI형",
    description: "LSTM이 예측한 상승 확률에 따라 매매. 모델이 확신 없을 땐 거래하지 않음.",
    color: "#10B981",
  },
};

export const PERSONA_ORDER = ["coward", "beast", "contrarian", "ai"];
