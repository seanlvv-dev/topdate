/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F5',
          100: '#FFE0E0',
          200: '#FFB3B3',
          300: '#FF8585',
          400: '#FF5757',
          500: '#FF6B6B',
          600: '#FF4141',
          700: '#E63535',
          800: '#CC2828',
          900: '#B32020',
        },
        accent: {
          50: '#FFF8F0',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF8E53',
          600: '#F97316',
          700: '#EA580C',
          800: '#C2410C',
          900: '#9A3412',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
