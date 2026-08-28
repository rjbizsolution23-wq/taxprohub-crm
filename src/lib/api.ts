/**
 * Centralised API client — all server calls go through /api/* (Cloudflare Pages Functions).
 * No credentials are ever stored or sent from the browser.
 */

const BASE = '/api';

async function req<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as any;
    throw new Error(err?.error || err?.message || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Health ──────────────────────────────────────────────────────
export const api = {
  health: () => req<{ ok: boolean; integrations: Record<string, boolean> }>('GET', '/health'),

  // ── Auth ──────────────────────────────────────────────────────
  auth: {
    login: (email: string, password: string) =>
      req<{ ok: boolean; access_token: string; refresh_token: string; user: unknown }>(
        'POST', '/auth/login', { email, password }
      ),
    logout: (token: string) => req('POST', '/auth/logout', {}, token),
    refresh: (refresh_token: string) =>
      req<{ ok: boolean; access_token: string; refresh_token: string }>(
        'POST', '/auth/refresh', { refresh_token }
      ),
  },

  // ── SMS ───────────────────────────────────────────────────────
  sms: {
    send: (to: string, body: string) =>
      req<{ ok: boolean; sid?: string; error?: string; configured?: boolean }>(
        'POST', '/sms/send', { to, body }
      ),
  },

  // ── Email ─────────────────────────────────────────────────────
  email: {
    send: (to: string, subject: string, html: string) =>
      req('POST', '/email/send', { to, subject, html }),
  },

  // ── Contacts ──────────────────────────────────────────────────
  contacts: {
    list: (cursor?: string, limit = 50) =>
      req<{ ok: boolean; contacts: unknown[]; cursor?: string }>(
        'GET', `/contacts?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`
      ),
    create: (data: Record<string, unknown>) =>
      req<{ ok: boolean; contact: unknown }>('POST', '/contacts', data),
    update: (id: string, data: Record<string, unknown>) =>
      req<{ ok: boolean; contact: unknown }>('PUT', `/contacts/${id}`, data),
    delete: (id: string) => req('DELETE', `/contacts/${id}`, {}),
  },

  // ── Campaigns ─────────────────────────────────────────────────
  campaigns: {
    execute: (campaignId: string, contactIds: string[], messageType: 'sms' | 'email', message: string, subject?: string) =>
      req<{ ok: boolean; sent: number; failed: number; results: unknown[] }>(
        'POST', '/campaigns/execute', { campaignId, contactIds, messageType, message, subject }
      ),
  },

  // ── Workflows ─────────────────────────────────────────────────
  workflows: {
    trigger: (workflowId: string, contactId: string, trigger: string, data?: Record<string, unknown>) =>
      req('POST', '/workflows/trigger', { workflowId, contactId, trigger, data }),
  },

  // ── Stripe ────────────────────────────────────────────────────
  stripe: {
    checkout: (amountCents: number, description: string, successUrl: string, cancelUrl: string, customerEmail?: string) =>
      req<{ ok: boolean; url: string; sessionId: string }>(
        'POST', '/stripe/checkout', { amountCents, description, successUrl, cancelUrl, customerEmail }
      ),
    subscribe: (plan: 'starter' | 'growth' | 'enterprise', customerEmail: string, successUrl: string, cancelUrl: string) =>
      req<{ ok: boolean; url: string }>(
        'POST', '/stripe/subscribe', { plan, customerEmail, successUrl, cancelUrl }
      ),
    portal: (customerId: string, returnUrl: string) =>
      req<{ ok: boolean; url: string }>('POST', '/stripe/portal', { customerId, returnUrl }),
  },

  // ── Video ─────────────────────────────────────────────────────
  video: {
    newSession: () =>
      req<{ ok: boolean; sessionId: string; appId: string }>('POST', '/video/session', {}),
  },

  // ── LLM ───────────────────────────────────────────────────────
  llm: {
    chat: (messages: Array<{ role: string; content: string }>, model?: string) =>
      req<{ choices: Array<{ message: { content: string } }> }>(
        'POST', '/llm/chat', { messages, model }
      ),
  },

  // ── Payouts ───────────────────────────────────────────────────
  payouts: {
    accrue: (preparerId: string, dealId: string, amountCents: number, note?: string) =>
      req('POST', '/payouts/accrue', { preparerId, dealId, amountCents, note }),
    list: () => req<{ ok: boolean; payouts: unknown[] }>('GET', '/payouts/list'),
    approve: (payoutId: string, connectedAccountId: string) =>
      req('POST', '/payouts/approve', { payoutId, connectedAccountId }),
  },

  // ── Referrals ─────────────────────────────────────────────────
  referrals: {
    create: (contactId: string, baseUrl?: string) =>
      req<{ ok: boolean; code: string; link: string }>('POST', '/referrals/link', { contactId, baseUrl }),
    lookup: (code: string) => req('GET', `/referrals/${code}`),
  },

  // ── GHL ───────────────────────────────────────────────────────
  ghl: {
    sync: (contact: { firstName?: string; lastName?: string; email?: string; phone?: string; company?: string; tags?: string[] }) =>
      req('POST', '/ghl/sync', contact),
  },

  // ── API Keys ──────────────────────────────────────────────────
  keys: {
    list: () => req<{ ok: boolean; keys: unknown[] }>('GET', '/keys'),
    create: (name: string, scopes: string[]) =>
      req<{ ok: boolean; key: string; keyHash: string }>('POST', '/keys', { name, scopes }),
    revoke: (keyHash: string) => req('DELETE', '/keys', { keyHash }),
  },
};

export default api;
