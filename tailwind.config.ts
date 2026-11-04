import type { Config } from 'tailwindcss';

const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { ink: '#17241f', moss: '#2b6a50', fern: '#e7f1e8', citrus: '#f2c94c', paper: '#f7f8f3', clay: '#c96b4b' }, fontFamily: { sans: ['var(--font-manrope)', 'sans-serif'], display: ['var(--font-space-grotesk)', 'sans-serif'] }, boxShadow: { soft: '0 14px 40px rgba(23, 36, 31, .08)' } } }, plugins: [] };
export default config;
