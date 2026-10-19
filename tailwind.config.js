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
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
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
        // Design "Plume" : les 4 couleurs de la plume du logo TourShop.
        // Lime "Shop" : action et argent (Accepter, En ligne, gains). Toujours
        // avec un texte fonce (accent-900) sur les aplats 300/400 ; 600/700
        // sont assez sombres pour du texte sur fond clair (>= 5,9:1).
        accent: {
          50: '#fafbe7',
          100: '#f2f6c4',
          200: '#e5ee8f',
          300: '#d2e052',
          400: '#bdce2e',
          500: '#a3b01e',
          600: '#636b16',
          700: '#505619',
          800: '#45491b',
          900: '#24270a',
        },
        // Navy de la plume : structure (en-tetes, carte solde, onglet actif).
        navy: {
          50: '#eeeef6',
          100: '#dfdeee',
          200: '#c1bfdf',
          300: '#9e9bcb',
          400: '#7a75b3',
          500: '#5c5599',
          600: '#453d80',
          700: '#363065',
          800: '#2b2650',
          900: '#241f41',
          950: '#16132a',
        },
        // Cyan de la plume : "en mouvement" (mission en cours, etapes, trace).
        teal: {
          50: '#edfbfc',
          100: '#d3f5f8',
          200: '#a9eaf0',
          300: '#71d9e3',
          400: '#34bfcc',
          500: '#159faf',
          600: '#10808d',
          700: '#126672',
          800: '#15525c',
          900: '#16444c',
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
          50: '#f4f6fb',
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
        // Barre flottante : 52 px d'onglet + 2 x 8 px de padding + 12 px de marge.
        'bottom-nav': '5rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.375rem',
        '3xl': '1.75rem',
      },
      // Ombres douces teintees navy.
      boxShadow: {
        'nav': '0 10px 30px -12px rgba(36, 31, 65, 0.3), 0 0 0 1px rgba(22, 19, 42, 0.04)',
        'card': '0 1px 2px rgba(22, 19, 42, 0.04), 0 0 0 1px rgba(22, 19, 42, 0.06)',
        'raised': '0 12px 30px -14px rgba(36, 31, 65, 0.38)',
        'sticky': '0 -1px 0 rgba(22, 19, 42, 0.05), 0 -10px 24px -14px rgba(22, 19, 42, 0.25)',
        'brand': '0 10px 30px -10px rgba(36, 31, 65, 0.55)',
        'lime': '0 10px 22px -10px rgba(99, 107, 22, 0.7)',
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
