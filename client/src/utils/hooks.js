import { useCallback, useEffect, useRef, useState } from 'react';
import { toApiError } from '../services/api.js';

/** Runs an async loader and tracks { data, error, loading }. Re-runs when deps change. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef
      .current()
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((err) => active && setState({ data: undefined, error: toApiError(err), loading: false }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);
  return { ...state, reload: run, setData };
}

// Small in-memory cache for public collections shared by several sections on one page.
const cache = new Map();
export function cachedFetch(key, loader) {
  if (!cache.has(key)) {
    const p = loader().catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, p);
  }
  return cache.get(key);
}
export const clearPublicCache = () => cache.clear();

/** Sets <title>, description, canonical, Open Graph and robots tags for the current page. */
export function useDocumentMeta({ title, description, image, canonical, noindex, type = 'website' } = {}) {
  useEffect(() => {
    if (!title) return;
    document.title = title;
    const upsert = (selector, create, attr, value) => {
      let el = document.head.querySelector(selector);
      if (!value) {
        el?.remove();
        return;
      }
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    const meta = (key, value, prop = 'name') => {
      const create = () => {
        const m = document.createElement('meta');
        m.setAttribute(prop, key);
        return m;
      };
      upsert(`meta[${prop}="${key}"]`, create, 'content', value);
    };
    const abs = (u) => (u && u.startsWith('/') ? window.location.origin + u : u);
    meta('description', description);
    meta('og:title', title, 'property');
    meta('og:description', description, 'property');
    meta('og:type', type, 'property');
    meta('og:image', abs(image), 'property');
    meta('og:url', window.location.href, 'property');
    meta('twitter:card', image ? 'summary_large_image' : 'summary');
    meta('robots', noindex ? 'noindex, nofollow' : '');
    upsert('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', abs(canonical) || window.location.origin + window.location.pathname);
  }, [title, description, image, canonical, noindex, type]);
}
