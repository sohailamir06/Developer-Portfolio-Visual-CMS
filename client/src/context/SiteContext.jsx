import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { publicApi, toApiError } from '../services/api.js';
import { applyTheme } from '../utils/theme.js';

const SiteContext = createContext(null);
const MODE_KEY = 'pf-color-mode'; // visitor preference only — not sensitive

function readStoredMode() {
  try {
    return localStorage.getItem(MODE_KEY);
  } catch {
    return null;
  }
}

/**
 * Loads global settings + navigation (published values) and applies the theme.
 * The editor preview can pass `override` to render unsaved settings.
 */
export function SiteProvider({ children, override }) {
  const [settings, setSettings] = useState(null);
  const [navigation, setNavigation] = useState({ main: [], footer: [] });
  const [error, setError] = useState(null);
  const [mode, setModeState] = useState(readStoredMode);

  const load = useCallback(async () => {
    try {
      const [s, n] = await Promise.all([publicApi.settings(), publicApi.navigation()]);
      setSettings(s);
      setNavigation(n);
      setError(null);
    } catch (err) {
      setError(toApiError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const effective = override?.settings || settings;
  const allowToggle = effective?.theme?.allowToggle !== false;
  const activeMode = (allowToggle && mode) || effective?.theme?.mode || 'dark';

  useEffect(() => {
    if (effective?.theme) applyTheme(effective.theme, activeMode);
    if (effective?.favicon) {
      let link = document.head.querySelector('link[rel="icon"]');
      if (!link) {
        link = Object.assign(document.createElement('link'), { rel: 'icon' });
        document.head.appendChild(link);
      }
      link.href = effective.favicon;
    }
  }, [effective, activeMode]);

  const setMode = useCallback((m) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* storage unavailable — preference lasts for this visit only */
    }
  }, []);

  const value = useMemo(
    () => ({
      settings: effective,
      navigation: override?.navigation || navigation,
      error,
      reload: load,
      mode: activeMode,
      toggleMode: allowToggle ? () => setMode(activeMode === 'dark' ? 'light' : 'dark') : null,
    }),
    [effective, override, navigation, error, load, activeMode, allowToggle, setMode],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext) || { settings: null, navigation: { main: [], footer: [] }, mode: 'dark' };

/** Formats a page title with the configured template (e.g. "%s | Jane Doe"). */
export function useTitle(title, { raw = false } = {}) {
  const { settings } = useSite();
  if (!settings) return title;
  if (raw || !title) return title || settings.siteTitle;
  return (settings.seo?.titleTemplate || '%s').replace('%s', title);
}
