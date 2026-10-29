const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

const luminance = ([r, g, b]) => {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const contrastRatio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const DARK_BG = [11, 17, 32];
const LIGHT_BG = [255, 255, 255];
const DARK_TEXT = [15, 23, 42];
const LIGHT_TEXT = [226, 232, 240];

/** Moves a colour toward black/white until it reaches 3:1 against the background (used for text & links). */
function ensureContrast(color, bg, min = 3) {
  const target = luminance(bg) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  let c = color;
  for (let i = 0; i < 10 && contrastRatio(c, bg) < min; i += 1) c = mix(c, target, 0.15);
  return c;
}

export const FONT_PRESETS = {
  modern: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif", google: 'Inter:wght@400;500;600;700;800' },
  technical: {
    heading: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
    google: 'Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500',
  },
  classic: { heading: "'Fraunces', serif", body: "'Source Sans 3', sans-serif", google: 'Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;600' },
  system: { heading: 'ui-sans-serif, system-ui, sans-serif', body: 'ui-sans-serif, system-ui, sans-serif' },
};

export const RADII = { none: '0px', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1.25rem' };

/**
 * Derives a full, contrast-safe palette from the few colours the admin controls.
 * `mode` may differ from theme.mode when the visitor toggles light/dark.
 */
export function buildPalette(theme = {}, mode = theme.mode || 'dark') {
  const isDark = mode === 'dark';
  const configuredBg = hexToRgb(theme.background);
  let bg = isDark ? DARK_BG : LIGHT_BG;
  // Use the configured background only if it belongs to the active mode.
  if (configuredBg && theme.mode === mode && (luminance(configuredBg) < 0.4) === isDark) bg = configuredBg;

  const text = isDark ? LIGHT_TEXT : DARK_TEXT;
  const primary = ensureContrast(hexToRgb(theme.primary) || [56, 189, 248], bg);
  const secondary = ensureContrast(hexToRgb(theme.secondary) || [129, 140, 248], bg);
  const accent = ensureContrast(hexToRgb(theme.accent) || [52, 211, 153], bg);
  const onPrimary = contrastRatio(primary, [255, 255, 255]) >= contrastRatio(primary, DARK_BG) ? [255, 255, 255] : DARK_BG;

  return {
    primary,
    secondary,
    accent,
    bg,
    surface: mix(bg, isDark ? [255, 255, 255] : [15, 23, 42], isDark ? 0.045 : 0.035),
    text,
    muted: mix(text, bg, isDark ? 0.38 : 0.42),
    border: mix(bg, text, isDark ? 0.14 : 0.12),
    'on-primary': onPrimary,
  };
}

const loadedFonts = new Set();
function loadFont(preset) {
  const spec = FONT_PRESETS[preset]?.google;
  if (!spec || loadedFonts.has(spec) || typeof document === 'undefined') return;
  loadedFonts.add(spec);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(link);
}

/** Writes theme settings to CSS variables on the given element (defaults to <html>). */
export function applyTheme(theme = {}, mode, el = document.documentElement) {
  const palette = buildPalette(theme, mode);
  for (const [k, rgb] of Object.entries(palette)) el.style.setProperty(`--c-${k}`, rgb.join(' '));
  const font = FONT_PRESETS[theme.fontPreset] || FONT_PRESETS.modern;
  el.style.setProperty('--font-heading', font.heading);
  el.style.setProperty('--font-body', font.body);
  if (font.mono) el.style.setProperty('--font-mono', font.mono);
  else el.style.removeProperty('--font-mono');
  el.style.setProperty('--radius', RADII[theme.radius] || RADII.lg);
  el.style.setProperty('--btn-radius', theme.buttonStyle === 'pill' ? '9999px' : 'var(--radius)');
  el.dataset.buttonStyle = theme.buttonStyle || 'solid';
  el.style.colorScheme = (mode || theme.mode) === 'light' ? 'light' : 'dark';
  loadFont(theme.fontPreset || 'modern');
}
