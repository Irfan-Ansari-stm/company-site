/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  safelist: [
    { pattern: /grid-cols-(1|2|3|4|5|6|12)/ },
    { pattern: /gap-(2|3|4|6|8|10|12)/ },
    { pattern: /col-span-(1|2|3|4|5|6|12)/ },
    { pattern: /(p|py|px|m|my|mx)-(2|4|6|8|10|12|16|20|24)/ },
    { pattern: /(bg|text|border)-(slate|cyan|blue|indigo|emerald|rose|amber)-(50|100|200|300|400|500|600|700|800|900|950)/ },
    { pattern: /rounded-(sm|md|lg|xl|2xl|3xl|full)/ },
    { pattern: /shadow-(sm|md|lg|xl|2xl)/ },
    'text-left', 'text-center', 'text-right',
    'flex-row', 'flex-col', 'items-center', 'justify-between', 'justify-center',
  ],
  plugins: [],
}
