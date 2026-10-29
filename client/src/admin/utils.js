export { pagePath } from '../utils/links.js';

export const toSlug = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 120);

export const newId = (prefix = 's') => `${prefix}_${Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('')}`;

export const clone = (v) => JSON.parse(JSON.stringify(v));

/** Gets/sets nested values by dotted path ("primaryButton.label", "items.0.quote"). */
export function getIn(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function setIn(obj, path, value) {
  const keys = path.split('.');
  const root = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = root;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value;
    else {
      const next = cur[k];
      cur[k] = Array.isArray(next) ? [...next] : { ...(next || {}) };
      cur = cur[k];
    }
  });
  return root;
}
