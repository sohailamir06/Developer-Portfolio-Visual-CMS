import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi, api, setCsrfToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: u, csrfToken } = await adminApi.me();
      setCsrfToken(csrfToken);
      setUser(u);
    } catch {
      setCsrfToken(null);
      setUser(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // If the session expires mid-edit, drop to the login screen instead of failing silently.
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (err) => {
      if (err?.response?.status === 401 && !String(err.config?.url).includes('/auth/')) setUser(null);
      return Promise.reject(err);
    });
    return () => api.interceptors.response.eject(id);
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u, csrfToken } = await adminApi.login({ email, password });
    setCsrfToken(csrfToken);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setCsrfToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, checking, login, logout, refresh }), [user, checking, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
