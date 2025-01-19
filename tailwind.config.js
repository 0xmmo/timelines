/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    {
      pattern: /^(bg|text|border)-(indigo|rose|amber|emerald|sky|violet|orange|teal|pink|cyan|lime|fuchsia)-600/,
    },
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          600: '#4f46e5',
        },
        rose: {
          600: '#e11d48',
        },
        amber: {
          600: '#d97706',
        },
        emerald: {
          600: '#059669',
        },
        sky: {
          600: '#0284c7',
        },
        violet: {
          600: '#7c3aed',
        },
        orange: {
          600: '#ea580c',
        },
        teal: {
          600: '#0d9488',
        },
        pink: {
          600: '#db2777',
        },
        cyan: {
          600: '#0891b2',
        },
        lime: {
          600: '#65a30d',
        },
        fuchsia: {
          600: '#c026d3',
        },
        border: '#999',
        background: '#fff',
        foreground: '#000',
      },
    },
  },
  plugins: [],
}

