import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // These reference the CSS variables set by Next.js font optimization in layout.tsx
        serif:  ['var(--font-serif)', 'Georgia', 'serif'],
        sans:   ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono:   ['var(--font-mono)', '"Courier New"', 'monospace'],
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