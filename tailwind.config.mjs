import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        glass: {
          primary: '#7c3aed',
          'primary-content': '#ffffff',
          secondary: '#ec4899',
          'secondary-content': '#ffffff',
          accent: '#06b6d4',
          'accent-content': '#ffffff',
          neutral: '#64748b',
          'base-100': '#ffffff',
          'base-200': '#f8fafc',
          'base-300': '#e2e8f0',
          'base-content': '#0f172a',
          info: '#0ea5e9',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
    ],
  },
}

export default config


