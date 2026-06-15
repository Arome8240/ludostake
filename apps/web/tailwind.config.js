/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    // Mobile-first: 390px base
    screens: {
      sm: '390px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    container: {
      center: true,
      padding: '1rem',
      screens: { sm: '390px', md: '768px' },
    },
    extend: {
      colors: {
        // ── Semantic tokens (shadcn-compatible CSS vars) ──────────────────────
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // ── Ludo Stakes brand palette ─────────────────────────────────────────
        // Deep blacks (base surfaces)
        surface: {
          DEFAULT: '#0a0a0a',
          raised: '#111111',
          overlay: '#1a1a1a',
          border: '#2a2a2a',
        },
        // Celo / primary green
        primary: {
          DEFAULT: '#16a34a', // green-600
          light: '#22c55e', // green-500
          dark: '#15803d', // green-700
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#2A2C34',
          foreground: '#ffffff',
        },
        // Gold — rewards, wins, highlights
        gold: {
          DEFAULT: '#eab308', // yellow-500
          light: '#facc15', // yellow-400
          dark: '#ca8a04', // yellow-600
          foreground: '#0a0a0a',
        },
        // Ludo piece colors
        piece: {
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#eab308',
          blue: '#3b82f6',
        },
        // Status
        win: '#22c55e',
        loss: '#ef4444',
        draw: '#94a3b8',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      spacing: {
        // Safe-area insets
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        // Bottom nav height
        'nav-height': '4rem',
        // Min tap target
        'tap-target': '3rem',
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      boxShadow: {
        glow: '0 0 20px rgba(22, 163, 74, 0.35)',
        'glow-gold': '0 0 20px rgba(234, 179, 8, 0.35)',
        card: '0 2px 8px rgba(0, 0, 0, 0.5)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(22, 163, 74, 0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(22, 163, 74, 0.8)' },
        },
        'dice-shake': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(-12deg)' },
          '40%': { transform: 'rotate(12deg)' },
          '60%': { transform: 'rotate(-8deg)' },
          '80%': { transform: 'rotate(8deg)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'dice-shake': 'dice-shake 0.5s ease-in-out',
        'bounce-in': 'bounce-in 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

module.exports = config;
