import typography from '@tailwindcss/typography';

const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

/** Public-site colours come from CSS variables written by the theme loader (see src/utils/theme.js). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: v('primary'),
        secondary: v('secondary'),
        accent: v('accent'),
        bg: v('bg'),
        surface: v('surface'),
        fg: v('text'),
        muted: v('muted'),
        line: v('border'),
        'on-primary': v('on-primary'),
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        theme: 'var(--radius)',
        'theme-lg': 'calc(var(--radius) * 1.5)',
      },
      maxWidth: { content: '72rem' },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .6s cubic-bezier(.2,.7,.2,1) both' },
    },
  },
  plugins: [typography],
};
