import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: { DEFAULT: '#1a1a1a', muted: '#5a5a5a', faint: '#8a8a8a' },
        paper: { DEFAULT: '#fafaf7', card: '#ffffff' },
        accent: { DEFAULT: '#7a5b2f', muted: '#b89a6f' },
      },
    },
  },
  plugins: [],
};
export default config;
