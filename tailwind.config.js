const {theme} = require('@sanity/demo/tailwind')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './intro-template/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    ...theme,
    // Overriding fontFamily to use our new custom Google Fonts
    fontFamily: {
      mono: 'var(--font-mono)',   // Keeps default for any code blocks
      sans: 'var(--font-inter)',  // Now uses Inter for normal text!
      serif: 'var(--font-lora)',  // Now uses Lora for headings!
    },
  },
  plugins: [require('@tailwindcss/typography')],
}