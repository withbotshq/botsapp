/* eslint-env node */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    fontSize: {
      xs: '0.625rem',
      sm: '0.75rem',
      base: '0.8125rem',
      xl: '0.875rem',
      '2xl': '1rem'
    },
    extend: {
      borderColor: {
        DEFAULT: colors.neutral[800]
      },
      colors: {
        gray: colors.neutral
      }
    }
  },
  plugins: []
}
