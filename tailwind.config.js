/** @type {import('tailwindcss').Config} */
// Light mode uniquement : aucune variante `dark:` n'est generee (darkMode absent
// et aucune classe `dark` n'est jamais posee sur <html>).
export default {
  // Pas d'etat hover "colle" apres un tap sur ecran tactile.
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Tailles intermediaires de l'interface mobile (en plus de xs/sm/base/lg).
      // Sans line-height imposee : elle reste heritee, comme avant les tokens.
      fontSize: {
        micro: '0.625rem', // 10px — pastilles de compteur
        caption: '0.6875rem', // 11px — meta, micro-libelles (.eyebrow)
        label: '0.8125rem', // 13px — texte d'interface secondaire, chips, btn-sm
        lead: '0.9375rem', // 15px — noms, montants mis en avant
        title: '1.0625rem', // 17px — titre de TopBar
      },
      colors: {
        // Bleu de marque TourShop (identique a client-app).
        primary: {
          50: '#eff7fe',
          100: '#dceefc',
          200: '#b7ddfa',
          300: '#82c3f5',
          400: '#47a3eb',
          500: '#2185d6',
          600: '#156fbe',
          700: '#10589a',
          800: '#12477b',
          900: '#143c64',
          950: '#0c2540',
        },
        // Orange "livraison" : reserve aux actions terrain (demarrer, livrer).
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Statuts metier : success = terminee, warning = en cours / a surveiller,
        // danger = probleme / annulee / bloque.
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },
        surface: {
          50: '#f7f9fc',
          100: '#eff3f8',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      spacing: {
        'bottom-nav': '4.5rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'nav': '0 -1px 0 rgba(15, 23, 42, 0.06), 0 -8px 24px rgba(15, 23, 42, 0.04)',
        'card': '0 1px 2px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.05)',
        'raised': '0 8px 24px -8px rgba(15, 23, 42, 0.18)',
        'sticky': '0 -1px 0 rgba(15, 23, 42, 0.06), 0 -8px 24px rgba(15, 23, 42, 0.06)',
        'brand': '0 10px 30px -10px rgba(21, 111, 190, 0.55)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'sheet-up': 'sheetUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
