/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5b8fc",
          400: "#8191f9",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        accent: {
          amber: "#f59e0b",
          emerald: "#10b981",
          rose: "#f43f5e",
          violet: "#8b5cf6",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        display: ["'Clash Display'", "'Plus Jakarta Sans'", "sans-serif"],
        body: ["'DM Sans'", "'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(99, 102, 241, 0.3)",
        "glow-md": "0 0 25px rgba(99, 102, 241, 0.4)",
        "glow-lg": "0 0 50px rgba(99, 102, 241, 0.5)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      },
      backgroundImage: {
        "mesh-gradient":
          "radial-gradient(at 40% 20%, hsla(240,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,0.05) 0px, transparent 50%)",
        "card-glass": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "slide-in-right": "slideInRight 0.3s ease forwards",
        "pulse-slow": "pulse 3s ease infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideInRight: { from: { opacity: 0, transform: "translateX(20px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
