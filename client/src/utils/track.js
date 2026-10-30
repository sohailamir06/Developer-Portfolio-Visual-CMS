/**
 * Privacy-friendly visit counter. Sends only the event kind and the page path — no cookies,
 * IDs or personal data — and never throws, so analytics can't break the page.
 */
const recent = new Map(); // de-duplicate repeats (React StrictMode, quick re-renders)

export function track(kind, path = window.location.pathname) {
  try {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return;
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
    const key = `${kind}:${path}`;
    const now = Date.now();
    if (now - (recent.get(key) || 0) < 3000) return;
    recent.set(key, now);
    fetch('/api/public/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, path: path.replace(/[^a-z0-9\-/]/gi, '').slice(0, 200) || '/' }),
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => {});
  } catch {
    /* analytics must never affect the visitor */
  }
}

/** True for links that download the CV: the configured résumé URL or any PDF. */
export function isResumeLink(href, resumeUrl) {
  if (!href) return false;
  try {
    const url = new URL(href, window.location.origin);
    if (resumeUrl && url.href === new URL(resumeUrl, window.location.origin).href) return true;
    return /\.pdf$/i.test(url.pathname);
  } catch {
    return false;
  }
}
