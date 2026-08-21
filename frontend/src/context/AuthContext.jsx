import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const storageKey = 'campusBiteAuth';

function getStoredSession() {
  try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession);
  const setAuthSession = (nextSession) => {
    localStorage.setItem(storageKey, JSON.stringify(nextSession));
    setSession(nextSession);
  };
  const logout = () => { localStorage.removeItem(storageKey); setSession(null); };
  useEffect(() => { const handleExpiredSession = () => setSession(null); window.addEventListener('campusBiteUnauthenticated', handleExpiredSession); return () => window.removeEventListener('campusBiteUnauthenticated', handleExpiredSession); }, []);
  const value = useMemo(() => ({ user: session?.user || null, token: session?.token || null, setAuthSession, logout }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

api.interceptors.request.use((config) => {
  const session = getStoredSession();
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) { localStorage.removeItem(storageKey); window.dispatchEvent(new Event('campusBiteUnauthenticated')); }
  return Promise.reject(error);
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
