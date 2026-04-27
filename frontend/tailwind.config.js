/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        persona: {
          coward:     "#3B82F6",
          beast:      "#EF4444",
          contrarian: "#10B981",
          ai:         "#8B5CF6",
          random:     "#6B7280",
        },
        surface: {
          DEFAULT: "#0D1117",
          card:    "#161B27",
          glass:   "rgba(255,255,255,0.04)",
          border:  "rgba(255,255,255,0.08)",
        },
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.25) 0%, transparent 70%), linear-gradient(135deg, #0A0F1E 0%, #0D1117 100%)",
        "card-shine":    "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)",
      },
      boxShadow: {
        "glow-violet": "0 0 30px rgba(139,92,246,0.25)",
        "glow-blue":   "0 0 30px rgba(59,130,246,0.25)",
        "glow-red":    "0 0 30px rgba(239,68,68,0.25)",
        "glow-green":  "0 0 30px rgba(16,185,129,0.25)",
        "card":        "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease-out forwards",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
