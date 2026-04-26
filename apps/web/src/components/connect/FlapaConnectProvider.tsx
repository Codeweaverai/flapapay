import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { FlapaConnectInstance, FlapaConnectSession, FlapaConnectAppearance } from '../../lib/flapaConnect';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005';

interface FlapaConnectContextValue {
  session: FlapaConnectSession | null;
  loading: boolean;
  error: string | null;
  appearance: FlapaConnectAppearance;
  portalFetch: (path: string, init?: RequestInit) => Promise<Response>;
  refresh: () => void;
}

const FlapaConnectContext = createContext<FlapaConnectContextValue | null>(null);

export function useFlapaConnect(): FlapaConnectContextValue {
  const ctx = useContext(FlapaConnectContext);
  if (!ctx) throw new Error('useFlapaConnect must be used inside <FlapaConnectProvider>');
  return ctx;
}

interface FlapaConnectProviderProps {
  connectInstance: FlapaConnectInstance;
  children: React.ReactNode;
}

export function FlapaConnectProvider({ connectInstance, children }: FlapaConnectProviderProps) {
  const [session, setSession] = useState<FlapaConnectSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    setError(null);
    connectInstance.getSession()
      .then(s => { if (mounted.current) { setSession(s); setLoading(false); } })
      .catch(e => { if (mounted.current) { setError(e.message); setLoading(false); } });
    return () => { mounted.current = false; };
  }, [connectInstance, refreshTick]);

  const portalFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
    const s = await connectInstance.getSession();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${s.portalToken}`,
    };
    // Only set Content-Type for non-FormData bodies
    if (!(init.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> || {}) },
    });
  };

  const refresh = () => setRefreshTick(t => t + 1);

  // Build CSS variables from appearance
  const cssVars: React.CSSProperties = {};
  const vars = connectInstance.appearance?.variables || {};
  if (vars.colorPrimary) (cssVars as any)['--flapa-color-primary'] = vars.colorPrimary;
  if (vars.colorBackground) (cssVars as any)['--flapa-color-bg'] = vars.colorBackground;
  if (vars.colorText) (cssVars as any)['--flapa-color-text'] = vars.colorText;
  if (vars.fontFamily) (cssVars as any)['--flapa-font-family'] = vars.fontFamily;
  if (vars.borderRadius) (cssVars as any)['--flapa-radius'] = vars.borderRadius;

  return (
    <FlapaConnectContext.Provider value={{ session, loading, error, appearance: connectInstance.appearance, portalFetch, refresh }}>
      <div style={cssVars}>
        {children}
      </div>
    </FlapaConnectContext.Provider>
  );
}
