import type { Config } from 'tailwindcss';

/**
 * Tema claro/oscuro basado en variables CSS (ver globals.css).
 * Los tokens aceptan alpha (`bg-paper/60`, `text-moss/80`, ...).
 */
const variable = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: variable('--c-ink'),
        moss: variable('--c-moss'),
        fern: variable('--c-fern'),
        citrus: variable('--c-citrus'),
        paper: variable('--c-paper'),
        clay: variable('--c-clay'),
        surface: variable('--c-surface'),
        panel: variable('--c-panel'),
        line: variable('--c-line'),
        linestrong: variable('--c-line-strong'),
        muted: variable('--c-muted'),
        faint: variable('--c-faint'),
        warnsoft: variable('--c-warn-soft'),
        warn: variable('--c-warn'),
        dangersoft: variable('--c-danger-soft'),
        infosoft: variable('--c-info-soft'),
        info: variable('--c-info'),
        neutralsoft: variable('--c-neutral-soft'),
        neutral: variable('--c-neutral'),
        parchment: variable('--c-parchment'),
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 14px 40px rgb(var(--c-shadow) / .18)',
      },
    },
  },
  plugins: [],
};

export default config;
