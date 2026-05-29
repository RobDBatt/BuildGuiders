/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#06b6d4', // Electric Cyan
        darkSlate: '#0f172a',
        secondarySlate: '#334155',
        safetyAmber: '#f59e0b',
      },
      backgroundImage: {
        'manual-texture': "url('/path-to-subtle-noise.png')", // Optional grain texture
      },
    },
  },
  plugins: [],
};
