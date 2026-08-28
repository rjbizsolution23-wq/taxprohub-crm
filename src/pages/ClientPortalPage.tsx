/**
 * ═══════════════════════════════════════════════════════════════════════
 * CLIENT PORTAL — passwordless, tenant-scoped, live D1 + R2
 * ═══════════════════════════════════════════════════════════════════════
 * Clients enter their email, receive a one-time magic link (30 min TTL),
 * and land in a read-only view of their engagements, appointments and secure
 * documents — plus a drop zone that writes straight into the firm's R2 vault.
 *
 * No mock content: every panel renders what the API returns, or an empty state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, Mail, LogIn, Upload, FileText, Download, CalendarDays,
  Briefcase, Loader2, CheckCircle2, AlertTriangle, LogOut, Receipt, PenLine, ExternalLink,
} from 'lucide-react';
import { humanSize } from '../utils/vault';

const PORTAL_TOKEN_KEY = 'tph_portal_token';

interface PortalFile {
  id: string; name: string; folder: string; docType: string;
  size: number; createdAt: string;
}
interface PortalInvoice {
  id: string; number: string; description: string; amount_cents: number;
  status: string; due_at: string | null; checkout_url: string | null; paid_at: string | null;
}
interface PortalSignature {
  id: string; title: string; doc_type: string; status: string;
  expires_at: string; signed_at: string | null;
}
interface PortalData {
  invoices: PortalInvoice[];
  signatures: PortalSignature[];
  contact: { id: string; firstName: string; lastName: string; email: string; phone: string; status: string };
  practice: { name: string; email: string; phone: string };
  deals: { id: string; name: string; stage_id: string; value: number; updated_at: string }[];
  appointments: { id: string; title: string; start_time: string; status: string; location: string }[];
  files: PortalFile[];
}

const getToken = () => { try { return localStorage.getItem(PORTAL_TOKEN_KEY) || ''; } catch { return ''; } };
const setToken = (t: string) => { try { localStorage.setItem(PORTAL_TOKEN_KEY, t); } catch { /* ignore */ } };
const dropToken = () => { try { localStorage.removeItem(PORTAL_TOKEN_KEY); } catch { /* ignore */ } };

export default function ClientPortalPage() {
  const [params, setParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<'signin' | 'sent' | 'loading' | 'ready'>('signin');
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const authFetch = useCallback((path: string, init: RequestInit = {}) => {
    const token = getToken();
    return fetch(path, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: 'same-origin',
    });
  }, []);

  const loadPortal = useCallback(async () => {
    if (!getToken()) { setPhase('signin'); return; }
    setPhase('loading');
    try {
      const res = await authFetch('/api/portal/me');
      const body = await res.json();
      if (!res.ok || body?.ok === false) { dropToken(); setPhase('signin'); return; }
      setData(body as PortalData);
      setPhase('ready');
    } catch {
      setError('Portal unreachable. Try again in a moment.');
      setPhase('signin');
    }
  }, [authFetch]);

  // Exchange a magic-link token for a portal session on first load.
  useEffect(() => {
    const linkToken = params.get('token');
    if (!linkToken) { void loadPortal(); return; }
    (async () => {
      setPhase('loading');
      try {
        const res = await fetch('/api/portal/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: linkToken }),
        });
        const body = await res.json();
        if (body?.ok && body.token) {
          setToken(body.token);
          params.delete('token');
          setParams(params, { replace: true });
          await loadPortal();
        } else {
          setError(body?.error === 'invalid_or_expired_link'
            ? 'That link has expired or was already used. Request a new one below.'
            : 'Could not verify that link.');
          setPhase('signin');
        }
      } catch {
        setError('Could not reach the portal service.');
        setPhase('signin');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/portal/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await res.json();
      if (body?.ok) setPhase('sent');
      else setError(body?.hint || body?.error || 'Portal is not configured yet.');
    } catch {
      setError('Portal unreachable.');
    }
    setBusy(false);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      await authFetch('/api/portal/files', { method: 'POST', body: form });
    }
    await loadPortal();
    setBusy(false);
  };

  const download = async (f: PortalFile) => {
    const res = await authFetch(`/api/portal/files/${f.id}/download`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const signOut = () => { dropToken(); setData(null); setPhase('signin'); };

  /* ── Sign-in / magic link ─────────────────────────────────────────── */
  if (phase !== 'ready') {
    return (
      <div className="min-h-screen bg-[#030712] text-white grid place-items-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-[#D4AF37]/20 bg-neutral-950/80 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-600/10 border border-amber-500/40 grid place-items-center">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Secure Client Portal</h1>
              <p className="text-xs text-gray-400">Passwordless access to your documents and filings</p>
            </div>
          </div>

          {phase === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-gray-300 py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying your secure link…
            </div>
          )}

          {phase === 'sent' && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 flex gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>If <strong>{email}</strong> is on file, a one-time sign-in link is on its way. It expires in 30 minutes.</span>
            </div>
          )}

          {phase === 'signin' && (
            <form onSubmit={requestLink} className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-mono">Email on file</span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-gray-600"
                  />
                </div>
              </label>
              <button
                type="submit" disabled={busy}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-sm font-black text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Email me a secure link
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <p className="mt-6 text-[11px] text-gray-600 leading-relaxed">
            Links are single-use and expire in 30 minutes. Sessions last 12 hours. Documents are stored
            encrypted at rest in Cloudflare R2 and are only visible to you and your preparer.
          </p>
        </div>
      </div>
    );
  }

  /* ── Authenticated portal ─────────────────────────────────────────── */
  const d = data!;
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <header className="border-b border-white/10 bg-neutral-950/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#D4AF37] font-mono">{d.practice.name}</div>
            <h1 className="text-xl font-bold">Welcome, {d.contact.firstName}</h1>
          </div>
          <button onClick={signOut} className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Upload */}
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void upload(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className="rounded-3xl border-2 border-dashed border-white/15 hover:border-amber-500/50 bg-white/[0.02] p-8 text-center cursor-pointer transition-all"
        >
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          {busy ? <Loader2 className="w-7 h-7 mx-auto text-amber-400 animate-spin" /> : <Upload className="w-7 h-7 mx-auto text-amber-400" />}
          <div className="mt-3 font-semibold">Upload your tax documents</div>
          <div className="text-xs text-gray-500 mt-1">W-2s, 1099s, prior-year returns, IRS notices — up to 50 MB each</div>
        </section>

        {/* Documents */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-amber-400" /> Your documents</h2>
          {d.files.length === 0 ? (
            <p className="text-xs text-gray-500">Nothing uploaded yet.</p>
          ) : (
            <div className="divide-y divide-white/5 rounded-2xl border border-white/10 overflow-hidden">
              {d.files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.03]">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{f.name}</div>
                    <div className="text-[11px] text-gray-500">{f.folder} · {humanSize(f.size)} · {new Date(f.createdAt).toLocaleString()}</div>
                  </div>
                  <button onClick={() => download(f)} className="p-2 rounded-xl hover:bg-white/10 text-gray-300"><Download className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Signature requests */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><PenLine className="w-4 h-4 text-amber-400" /> Documents to sign</h2>
          {(d.signatures || []).length === 0 ? (
            <p className="text-xs text-gray-500">Nothing awaiting your signature.</p>
          ) : (
            <div className="space-y-2">
              {(d.signatures || []).map((sg) => (
                <div key={sg.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{sg.title}</div>
                    <div className="text-[11px] text-gray-500">
                      {sg.status === 'signed'
                        ? `Signed ${sg.signed_at ? new Date(sg.signed_at).toLocaleDateString() : ''}`
                        : `Expires ${new Date(sg.expires_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-lg border ${sg.status === 'signed' ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' : 'border-amber-500/30 text-amber-300 bg-amber-500/10'}`}>
                    {sg.status}
                  </span>
                </div>
              ))}
              <p className="text-[10px] text-gray-600 pt-2">Signing links are emailed to you individually for security.</p>
            </div>
          )}
        </section>

        {/* Invoices */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Receipt className="w-4 h-4 text-amber-400" /> Invoices</h2>
          {(d.invoices || []).length === 0 ? (
            <p className="text-xs text-gray-500">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {(d.invoices || []).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{inv.number} · {inv.description}</div>
                    <div className="text-[11px] text-gray-500">
                      ${(inv.amount_cents / 100).toFixed(2)}
                      {inv.paid_at ? ` · paid ${new Date(inv.paid_at).toLocaleDateString()}` : inv.due_at ? ` · due ${new Date(inv.due_at).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  {inv.status === 'paid' ? (
                    <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-lg border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">paid</span>
                  ) : inv.checkout_url ? (
                    <a href={inv.checkout_url} target="_blank" rel="noreferrer"
                      className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black flex items-center gap-1">
                      Pay <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-lg border border-slate-600 text-slate-400">{inv.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Engagements */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Briefcase className="w-4 h-4 text-amber-400" /> Engagements</h2>
            {d.deals.length === 0 ? (
              <p className="text-xs text-gray-500">No active engagements on file.</p>
            ) : d.deals.map((deal) => (
              <div key={deal.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-sm">{deal.name}</span>
                <span className="text-xs font-mono text-[#D4AF37]">${Number(deal.value || 0).toLocaleString()}</span>
              </div>
            ))}
          </section>

          {/* Appointments */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><CalendarDays className="w-4 h-4 text-amber-400" /> Appointments</h2>
            {d.appointments.length === 0 ? (
              <p className="text-xs text-gray-500">Nothing scheduled.</p>
            ) : d.appointments.map((ap) => (
              <div key={ap.id} className="py-2 border-b border-white/5 last:border-0">
                <div className="text-sm">{ap.title}</div>
                <div className="text-[11px] text-gray-500">{new Date(ap.start_time).toLocaleString()} · {ap.status}{ap.location ? ` · ${ap.location}` : ''}</div>
              </div>
            ))}
          </section>
        </div>

        <p className="text-center text-[11px] text-gray-600 pb-8">
          Questions? Contact {d.practice.name} at {d.practice.email || d.practice.phone || 'your preparer'}.
        </p>
      </main>
    </div>
  );
}
