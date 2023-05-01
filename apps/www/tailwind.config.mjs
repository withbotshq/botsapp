/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    '../../libs/ui/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  }
}

export default tailwindConfig
