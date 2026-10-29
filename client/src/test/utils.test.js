import { describe, expect, it } from 'vitest';
import { isSafeUrl, optimizedImage } from '../utils/links.js';
import { buildPalette, contrastRatio } from '../utils/theme.js';
import { getIn, setIn } from '../admin/utils.js';

describe('isSafeUrl', () => {
  it.each(['', '/about', '#contact', 'https://example.com', 'mailto:a@b.c', 'tel:+123'])('allows %s', (u) => expect(isSafeUrl(u)).toBe(true));
  it.each(['javascript:alert(1)', 'data:text/html,x', '//evil.com', 'vbscript:x', 'http://a b'])('rejects %s', (u) => expect(isSafeUrl(u)).toBe(false));
});

describe('theme palette', () => {
  it('keeps body text readable on the configured background', () => {
    const p = buildPalette({ mode: 'dark', background: '#0b1120', primary: '#000080' }, 'dark');
    expect(contrastRatio(p.text, p.bg)).toBeGreaterThan(7);
    // A too-dark primary is lightened until it is legible on the dark background.
    expect(contrastRatio(p.primary, p.bg)).toBeGreaterThanOrEqual(3);
  });

  it('ignores a background that does not match the active mode', () => {
    const p = buildPalette({ mode: 'dark', background: '#0b1120' }, 'light');
    expect(p.bg).toEqual([255, 255, 255]);
  });
});

describe('helpers', () => {
  it('adds Cloudinary optimisation parameters', () => {
    expect(optimizedImage('https://res.cloudinary.com/demo/image/upload/v1/a.jpg', 600)).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_600,c_limit/v1/a.jpg');
    expect(optimizedImage('/uploads/a.png', 600)).toBe('/uploads/a.png');
  });

  it('reads and writes nested paths immutably', () => {
    const src = { a: { b: [1, { c: 2 }] } };
    const out = setIn(src, 'a.b.1.c', 3);
    expect(getIn(out, 'a.b.1.c')).toBe(3);
    expect(getIn(src, 'a.b.1.c')).toBe(2);
  });
});
