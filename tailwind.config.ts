import type { Config } from "tailwindcss";

// Motion tokens mirror lib/motion.ts. Class names other components rely on:
//   motion-safe:animate-fade-up   motion-safe:animate-fade-in   motion-safe:animate-draw
//   motion-safe:animate-page-enter
//   ease-out-expo  ease-out-quart  ease-in-out-quart
//   duration-fast (180ms)  duration-base (400ms)  duration-slow (700ms)
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // These reference the CSS variables set by Next.js font optimization in layout.tsx
        serif:  ['var(--font-serif)', 'Georgia', 'serif'],
        sans:   ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono:   ['var(--font-mono)', '"Courier New"', 'monospace'],
      },
      transitionTimingFunction: {
        'out-expo':     'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart':    'cubic-bezier(0.25, 1, 0.5, 1)',
        'in-out-quart': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        fast: '180ms',
        base: '400ms',
        slow: '700ms',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'page-enter': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        // For SVG paths: set `pathLength="1"` on the element so dasharray 1 = full length.
        draw: {
          from: { strokeDasharray: '1', strokeDashoffset: '1' },
          to:   { strokeDasharray: '1', strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fade-in 0.4s cubic-bezier(0.25, 1, 0.5, 1) both',
        'page-enter': 'page-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        draw:         'draw 0.7s cubic-bezier(0.25, 1, 0.5, 1) both',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body':          'rgb(168 162 158)', // stone-400
            '--tw-prose-headings':      'rgb(255 255 255)',
            '--tw-prose-lead':          'rgb(168 162 158)',
            '--tw-prose-links':         'rgb(255 255 255)',
            '--tw-prose-bold':          'rgb(214 211 209)', // stone-200
            '--tw-prose-counters':      'rgb(120 113 108)', // stone-500
            '--tw-prose-bullets':       'rgb(120 113 108)',
            '--tw-prose-hr':            'rgba(255,255,255,0.05)',
            '--tw-prose-quotes':        'rgb(120 113 108)',
            '--tw-prose-quote-borders': 'rgb(87 83 78)',   // stone-600
            '--tw-prose-code':          'rgb(214 211 209)',
            '--tw-prose-pre-code':      'rgb(214 211 209)',
            '--tw-prose-pre-bg':        'rgb(10 10 10)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
