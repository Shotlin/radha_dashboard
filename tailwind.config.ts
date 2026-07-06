import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand accent
        accent: 'var(--accent)',
        'accent-deep': 'var(--accent-deep)',
        'accent-tint': 'var(--accent-tint)',
        // Ink
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        // Surfaces
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        'surface-sunken': 'var(--surface-sunken)',
        // Borders
        hairline: 'var(--hairline)',
        // Semantic
        success: 'var(--success)',
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        teal: 'var(--teal)',
        // Category tints
        'cat-amber': 'var(--cat-amber)',
        'cat-violet': 'var(--cat-violet)',
        'cat-green': 'var(--cat-green)',
        'cat-teal': 'var(--cat-teal)',
        'cat-orange': 'var(--cat-orange)',
        // Festive (celebratory only)
        marigold: 'var(--marigold)',
        turmeric: 'var(--turmeric)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-md': 'var(--shadow-card-md)',
        drawer: 'var(--shadow-drawer)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      spacing: {
        // 4pt grid named steps
        '2': '2px',
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
      },
      transitionTimingFunction: {
        'radha-enter': 'cubic-bezier(.23,1,.32,1)',
        'radha-exit': 'cubic-bezier(.55,0,1,.45)',
      },
      transitionDuration: {
        '120': '120ms',
        '200': '200ms',
        '320': '320ms',
      },
      animation: {
        'fade-up': 'fadeUp 200ms cubic-bezier(.23,1,.32,1) both',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
