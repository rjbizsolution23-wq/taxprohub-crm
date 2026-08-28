/**
 * ═══════════════════════════════════════════════════════════════════════
 * SECURE DOCUMENT VAULT CLIENT — Cloudflare R2 (binding DOCS) via /api/v1/files
 * ═══════════════════════════════════════════════════════════════════════
 * Binary content is streamed straight to the edge Worker, which writes it to
 * R2 and indexes the metadata in D1 (tenant-scoped). Nothing is fabricated:
 * when the vault isn't provisioned the API answers 501 `not_configured` and
 * the UI shows the setup hint instead of pretending an upload succeeded.
 */
import { getToken } from './api';

export interface VaultFile {
  id: string;
  subAccountId: string;
  contactId: string | null;
  dealId: string | null;
  name: string;
  folder: string;
  docType: string;
  taxYear: string | null;
  contentType: string;
  size: number;
  sha256: string | null;
  uploadedBy: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string | null;
  downloadUrl: string;
}

export interface VaultResult<T> {
  ok: boolean;
  status: number;
  configured: boolean;
  data?: T;
  error?: string;
  hint?: string;
}

async function vaultFetch<T>(path: string, init: RequestInit = {}): Promise<VaultResult<T>> {
  try {
    const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(path, { ...init, headers, credentials: 'same-origin' });
    let data: any = null;
    try { data = await res.json(); } catch { data = null; }
    return {
      ok: res.ok && data?.ok !== false,
      status: res.status,
      configured: data?.configured !== false,
      data: data as T,
      error: data?.error,
      hint: data?.hint,
    };
  } catch (err) {
    return { ok: false, status: 0, configured: false, error: String(err) };
  }
}

/** List the tenant's stored documents (optionally scoped to one client). */
export async function listVaultFiles(opts: { contactId?: string; q?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.contactId) params.set('contactId', opts.contactId);
  if (opts.q) params.set('q', opts.q);
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  const res = await vaultFetch<{ items: VaultFile[] }>(`/api/v1/files${qs ? `?${qs}` : ''}`);
  return { ...res, items: res.data?.items || [] };
}

/** Upload a file to the R2 vault. Metadata rides along as form fields. */
export async function uploadVaultFile(
  file: File,
  meta: { contactId?: string; dealId?: string; folder?: string; docType?: string; taxYear?: string } = {},
) {
  const form = new FormData();
  form.append('file', file);
  Object.entries(meta).forEach(([k, v]) => { if (v) form.append(k, String(v)); });
  // NOTE: no Content-Type header — the browser sets the multipart boundary.
  const res = await vaultFetch<{ item: VaultFile }>('/api/v1/files', { method: 'POST', body: form });
  return { ...res, item: res.data?.item };
}

/** Permanently remove a document from R2 + the D1 index. */
export const deleteVaultFile = (id: string) =>
  vaultFetch<{ deleted: string }>(`/api/v1/files/${id}`, { method: 'DELETE' });

/** Authenticated download URL — the Worker streams the object from R2. */
export const vaultDownloadUrl = (id: string) => `/api/v1/files/${id}/download`;

/** Fetch a document as a Blob (adds the bearer token the <a> tag can't send). */
export async function downloadVaultFile(id: string, name: string) {
  const token = getToken();
  const res = await fetch(vaultDownloadUrl(id), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const humanSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};
