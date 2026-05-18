/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{ts,tsx}'],
  },
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          700: '#0369a1',
        },
        hotpink: {
          50: '#fff0f7',
          100: '#ffe0ef',
          300: '#ff80c4',
          500: '#ff1493',
          700: '#c2185b',
          900: '#880e4f',
        },
      },
    },
  },
  plugins: [],
};
