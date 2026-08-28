/**
 * BackendBridge — connects the running app to the Cloudflare edge API.
 *
 * On mount it:
 *   1. Pings /api/health (cached). If D1 is bound, backend mode is available.
 *   2. If a session token exists, pulls /api/v1/bootstrap and hydrates the
 *      store with the tenant's real D1 data (replacing the demo snapshot).
 *   3. If the token is rejected, logs out of the backend session and stays
 *      in demo mode so the app remains fully usable.
 */
import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import {
  apiBootstrap,
  apiHealth,
  getToken,
  setToken,
  clearToken,
  resetHealthCache,
} from './api';

export function BackendBridge() {
  const { setBackendMode, hydrateBackend, logout } = useAppStore();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-invoke guard
    ran.current = true;

    (async () => {
      const token = getToken();
      if (!token) {
        const healthy = await apiHealth();
        if (healthy) setBackendMode(true);
        return;
      }

      const boot = await apiBootstrap();
      if (boot.ok && boot.data) {
        setBackendMode(true);
        hydrateBackend(boot.data);
        return;
      }

      // Stale/expired session — clean it up and fall back to demo mode.
      if (boot.status === 401) {
        clearToken();
        logout();
      }
      const healthy = await apiHealth();
      if (healthy) setBackendMode(true);
    })();
  }, [setBackendMode, hydrateBackend, logout]);

  return null;
}

/** Re-check backend availability (call after configuring/restoring a session). */
export async function recheckBackend() {
  resetHealthCache();
  return apiHealth();
}

export { setToken, clearToken };
