const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/** Mirrors the server-side rule: '', /path, #anchor, http(s), mailto, tel. */
export function isSafeUrl(value) {
  if (value === '' || value == null) return true;
  const v = String(value).trim();
  if (/[\s<>"]/.test(v)) return false;
  if (v.startsWith('#')) return true;
  if (v.startsWith('/') && !v.startsWith('//')) return true;
  try {
    return SAFE_PROTOCOLS.includes(new URL(v).protocol);
  } catch {
    return false;
  }
}

export const isExternal = (url) => /^(https?:|mailto:|tel:)/i.test(String(url || ''));

export const pagePath = (slug) => (slug === 'home' ? '/' : `/${slug}`);

/** Adds Cloudinary on-the-fly optimisation (format/quality/width) when the image is hosted there. */
export function optimizedImage(url, width) {
  if (!url) return '';
  if (/^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\//.test(url) && !url.includes('/f_auto')) {
    return url.replace('/image/upload/', `/image/upload/f_auto,q_auto${width ? `,w_${width},c_limit` : ''}/`);
  }
  return url;
}

export const formatMonthYear = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';

export const cx = (...c) => c.filter(Boolean).join(' ');
