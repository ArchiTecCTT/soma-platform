import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          black: '#030303',
          dark: '#080808',
          gray: '#121212',
          lightGray: '#1E1E1E',
          accent: '#FF5733',
          cyan: '#00F0FF',
          textMuted: '#7E7E7E',
        },
      },
    },
  },
} satisfies Config;