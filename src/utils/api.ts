/**
 * ═══════════════════════════════════════════════════════════════════════
 * TAX PRO HUB UNIVERSITY — Edge API Client + Optimistic Sync Engine
 * ═══════════════════════════════════════════════════════════════════════
 * Talks to /api/* (Cloudflare Pages Functions → D1). The app runs in two
 * modes:
 *   • BACKEND MODE — real auth + D1 persistence; every store mutation is
 *     mirrored to the edge via upserts (PUT /api/v1/:entity/:id) and deletes.
 *   • DEMO MODE    — backend unreachable / not configured; the existing
 *     localStorage store keeps working so the product is always usable.
 */

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  configured?: boolean;
  data?: T;
  error?: string;
}

const TOKEN_KEY = 'tph_session_token';
const DEMO_KEY = 'tph_demo_hint';

let token = '';
try {
  token = localStorage.getItem(TOKEN_KEY) || '';
} catch { /* SSR / privacy mode */ }

export const getToken = () => token;
export const setToken = (t: string) => { token = t; try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } };
export const clearToken = () => { token = ''; try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };
export const rememberDemoHint = (v: string) => { try { localStorage.setItem(DEMO_KEY, v); } catch { /* ignore */ } };
export const getDemoHint = () => { try { return localStorage.getItem(DEMO_KEY); } catch { return null; } };

export async function apiFetch<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(path, { ...options, headers, credentials: 'same-origin' });
    let data: any = null;
    try { data = await res.json(); } catch { data = null; }
    return {
      ok: res.ok && (data?.ok !== false),
      status: res.status,
      configured: data?.configured !== false,
      data,
      error: data?.error || (res.ok ? undefined : `HTTP ${res.status}`),
    };
  } catch (err) {
    return { ok: false, status: 0, data: undefined, error: String(err) };
  }
}

/* ────────────────────────── HEALTH / MODE ────────────────────────── */

let backendHealthy: boolean | null = null;

export async function apiHealth(): Promise<boolean> {
  if (backendHealthy !== null) return backendHealthy;
  const res = await apiFetch('/api/health');
  const d1 = Boolean((res.data as any)?.integrations?.database_d1);
  backendHealthy = res.ok && d1;
  return backendHealthy;
}

/** Full /api/health payload (integration flags) for live status dashboards. */
export async function apiHealthDetail(): Promise<{ ok: boolean; integrations: Record<string, boolean> }> {
  const res = await apiFetch('/api/health');
  const integrations = ((res.data as any)?.integrations || {}) as Record<string, boolean>;
  return { ok: res.ok, integrations };
}

export const isBackendConfigured = () => backendHealthy === true;

export function resetHealthCache() { backendHealthy = null; }

/* ─────────────────────────────── AUTH ─────────────────────────────── */

export interface AuthPayload {
  token: string;
  expiresAt: string;
  user: Record<string, unknown>;
  tenant: Record<string, unknown>;
}

export const apiSignup = (payload: {
  fullName: string; businessName: string; email: string; password: string; phone?: string;
}) => apiFetch<AuthPayload>('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) });

export const apiLogin = (email: string, password: string) =>
  apiFetch<AuthPayload>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const apiMe = () => apiFetch<{ user: unknown; tenant: unknown }>('/api/auth/me');

export const apiLogout = () => apiFetch('/api/auth/logout', { method: 'POST' });

export const apiChangePassword = (current: string, next: string) =>
  apiFetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ current, next }) });

/* ─────────────────────────── BOOTSTRAP ─────────────────────────── */

export interface BootstrapPayload {
  user: Record<string, unknown>;
  tenant: Record<string, unknown>;
  pipelines: unknown[];
  contacts: unknown[];
  deals: unknown[];
  appointments: unknown[];
  campaigns: unknown[];
  workflows: unknown[];
  funnels: unknown[];
  websites: unknown[];
  forms: unknown[];
  blogPosts: unknown[];
  preparers: unknown[];
  payouts: unknown[];
}

export const apiBootstrap = () => apiFetch<BootstrapPayload>('/api/v1/bootstrap');

/* ──────────────────────── GENERIC CRUD ──────────────────────── */

export type SyncEntity =
  | 'contacts' | 'deals' | 'appointments' | 'campaigns' | 'workflows'
  | 'funnels' | 'websites' | 'forms' | 'blog-posts' | 'preparers' | 'payouts' | 'pipelines';

export const apiUpsert = <T = Record<string, unknown>>(entity: SyncEntity, id: string, item: Record<string, unknown>) =>
  apiFetch<T>(`/api/v1/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(item) });

export const apiCreate = <T = Record<string, unknown>>(entity: SyncEntity, item: Record<string, unknown>) =>
  apiFetch<T>(`/api/v1/${entity}`, { method: 'POST', body: JSON.stringify(item) });

export const apiDelete = (entity: SyncEntity, id: string) =>
  apiFetch(`/api/v1/${entity}/${id}`, { method: 'DELETE' });

export const apiList = <T = Record<string, unknown>>(entity: SyncEntity, params: Record<string, string | number> = {}) => {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  return apiFetch<{ items: T[]; total: number }>(`/api/v1/${entity}${qs ? `?${qs}` : ''}`);
};

/* ─────────────── OPTIMISTIC MIRROR QUEUE (store → D1) ─────────────── */

type SyncOp =
  | { kind: 'upsert'; entity: SyncEntity; id: string; item: Record<string, unknown> }
  | { kind: 'delete'; entity: SyncEntity; id: string };

let syncQueue: SyncOp[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

export function enqueueSync(op: SyncOp) {
  // avoid unbounded growth — replace earlier op on same entity+id
  const existing = syncQueue.findIndex((o) => o.kind === op.kind && o.entity === op.entity && o.id === op.id);
  if (existing >= 0 && op.kind === 'upsert') syncQueue[existing] = op;
  else if (existing < 0) syncQueue.push(op);
  if (syncQueue.length > 500) syncQueue = syncQueue.slice(-500);
  if (!flushTimer) flushTimer = setTimeout(() => { flushTimer = null; void flushSync(); }, 900);
}

export async function flushSync(): Promise<void> {
  if (flushing || syncQueue.length === 0) return;
  flushing = true;
  const ops = syncQueue.splice(0, syncQueue.length);
  // Upserts first, deletes last — so a create-then-delete resolves correctly.
  const upserts = ops.filter((o) => o.kind === 'upsert');
  const deletes = ops.filter((o) => o.kind === 'delete');
  for (const op of upserts) {
    if (op.kind !== 'upsert') continue;
    try { await apiUpsert(op.entity, op.id, op.item); }
    catch { /* demo mode / transient — queue reruns on next change */ }
  }
  for (const op of deletes) {
    if (op.kind !== 'delete') continue;
    try { await apiDelete(op.entity, op.id); }
    catch { /* ignore */ }
  }
  flushing = false;
}

/**
 * Snapshot fingerprint of the persisted collections. Used to detect which
 * items changed between two store states without touching store internals.
 */
export type Fingerprint = Record<string, Record<string, string>>;

export function fingerprintState(state: Record<string, unknown>): Fingerprint {
  const collections: Array<[string, unknown[]]> = [
    ['contacts', state.allContacts as unknown[]],
    ['deals', state.allDeals as unknown[]],
    ['appointments', state.allAppointments as unknown[]],
    ['campaigns', state.allCampaigns as unknown[]],
    ['workflows', state.allWorkflows as unknown[]],
    ['funnels', state.allFunnels as unknown[]],
    ['websites', state.allWebsites as unknown[]],
    ['forms', state.allForms as unknown[]],
    ['blog-posts', state.allBlogPosts as unknown[]],
    ['preparers', state.allPreparers as unknown[]],
    ['payouts', state.allPayouts as unknown[]],
    ['pipelines', state.pipelines as unknown[]],
    ['tenants', state.subAccounts as unknown[]],
  ];
  const fp: Fingerprint = {};
  for (const [collection, items] of collections) {
    const map: Record<string, string> = {};
    for (const raw of items || []) {
      const item = raw as Record<string, unknown>;
      const id = String(item.id || '');
      if (!id) continue;
      map[id] = JSON.stringify(item);
    }
    fp[collection] = map;
  }
  return fp;
}

/**
 * Diff two fingerprints → sync ops. Callers should pass the PREVIOUS state
 * fingerprint and the current store state.
 */
export function diffFingerprints(prev: Fingerprint, nextState: Record<string, unknown>): SyncOp[] {
  const next = fingerprintState(nextState);
  const ops: SyncOp[] = [];
  for (const collection of Object.keys(next)) {
    const entity = collection as SyncEntity;
    const prevMap = prev[collection] || {};
    const nextMap = next[collection] || {};
    for (const id of Object.keys(nextMap)) {
      if (prevMap[id] !== nextMap[id]) {
        const item = (nextState as Record<string, any>)[
          collection === 'tenants' ? 'subAccounts'
            : collection === 'pipelines' ? 'pipelines'
            : `all${collection === 'blog-posts' ? 'BlogPosts' : collection.charAt(0).toUpperCase() + collection.slice(1)}`
        ]?.find?.((i: Record<string, unknown>) => i.id === id);
        if (item) {
          const payload: Record<string, unknown> = { ...item };
          const tenantId = (nextState as any).currentSubAccount?.id || payload.subAccountId || payload.tenantId;
          if (collection !== 'tenants' && tenantId && !payload.subAccountId) payload.subAccountId = tenantId;
          delete payload.tenantId;
          ops.push({ kind: 'upsert', entity, id, item: payload });
        }
      }
    }
    for (const id of Object.keys(prevMap)) {
      if (!nextMap[id]) ops.push({ kind: 'delete', entity, id });
    }
  }
  return ops;
}
