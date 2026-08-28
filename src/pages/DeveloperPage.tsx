/**
 * 🔑 DEVELOPER HUB — Public API, Key Management & Webhooks
 * The reverse-integration play: instead of begging for competitors' APIs,
 * Tax Pro Hub University exposes its own. Partners, banks, and other software
 * integrate with US. Keys are scoped, rate-limited, and revocable.
 */

import { useState } from 'react';
import {
  KeyRound, Plus, Copy, Trash2, Eye, EyeOff, Webhook, Code2, ShieldCheck,
  Terminal, CheckCircle2, Zap, Globe, RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;      // shown; full key shown once
  fullKey?: string;    // only present right after creation
  scopes: string[];
  createdAt: string;
  lastUsed: string | null;
  requests30d: number;
  status: 'active' | 'revoked';
}

const ALL_SCOPES = [
  { id: 'contacts:read', label: 'Contacts — Read' },
  { id: 'contacts:write', label: 'Contacts — Write' },
  { id: 'deals:read', label: 'Deals/Pipeline — Read' },
  { id: 'deals:write', label: 'Deals/Pipeline — Write' },
  { id: 'documents:write', label: 'Documents — Upload' },
  { id: 'invoices:read', label: 'Invoices — Read' },
  { id: 'invoices:write', label: 'Invoices — Create' },
  { id: 'campaigns:trigger', label: 'Campaigns — Trigger' },
  { id: 'bank:read', label: 'Bank Products — Status' },
  { id: 'network:read', label: 'Network/Payouts — Read' },
  { id: 'webhooks:manage', label: 'Webhooks — Manage' },
];

const SEED_KEYS: ApiKey[] = [
  { id: 'k1', name: 'TaxSlayer Pro Bridge (production)', prefix: 'vtp_live_8f2a…c91d', scopes: ['contacts:read', 'contacts:write', 'deals:write', 'documents:write'], createdAt: '2026-01-12', lastUsed: '2 minutes ago', requests30d: 48211, status: 'active' },
  { id: 'k2', name: 'TPG Bank Product Status Poller', prefix: 'vtp_live_3b7e…a24f', scopes: ['bank:read', 'webhooks:manage'], createdAt: '2026-01-28', lastUsed: '14 minutes ago', requests30d: 21460, status: 'active' },
  { id: 'k3', name: 'Zapier Integration (marketing)', prefix: 'vtp_live_c04d…77b2', scopes: ['contacts:write', 'campaigns:trigger'], createdAt: '2026-02-14', lastUsed: '1 hour ago', requests30d: 9310, status: 'active' },
  { id: 'k4', name: 'Legacy staging key', prefix: 'vtp_test_91aa…03ce', scopes: ['contacts:read'], createdAt: '2025-12-01', lastUsed: null, requests30d: 0, status: 'revoked' },
];

const ENDPOINTS = [
  { method: 'GET',  path: '/api/v1/contacts', desc: 'List/search contacts (cursor-paginated)', scope: 'contacts:read' },
  { method: 'POST', path: '/api/v1/contacts', desc: 'Create or upsert a contact (email/SSN4 dedupe)', scope: 'contacts:write' },
  { method: 'GET',  path: '/api/v1/deals', desc: 'List pipeline deals with stage + value', scope: 'deals:read' },
  { method: 'POST', path: '/api/v1/deals', desc: 'Open a deal / move stage', scope: 'deals:write' },
  { method: 'POST', path: '/api/v1/documents', desc: 'Upload a document → triggers OCR + smart filing', scope: 'documents:write' },
  { method: 'GET',  path: '/api/v1/invoices/:id', desc: 'Invoice detail + payment status', scope: 'invoices:read' },
  { method: 'POST', path: '/api/v1/invoices', desc: 'Create invoice + Stripe pay link', scope: 'invoices:write' },
  { method: 'POST', path: '/api/v1/campaigns/:id/enroll', desc: 'Enroll a contact into a drip sequence', scope: 'campaigns:trigger' },
  { method: 'GET',  path: '/api/v1/bank/status/:returnId', desc: 'Refund transfer / advance disbursement status', scope: 'bank:read' },
  { method: 'GET',  path: '/api/v1/network/earnings', desc: 'Downline earnings + override ledger', scope: 'network:read' },
  { method: 'POST', path: '/api/v1/webhooks', desc: 'Register webhook endpoint', scope: 'webhooks:manage' },
];

const WEBHOOK_EVENTS = [
  'contact.created', 'contact.updated', 'deal.stage_changed', 'document.processed',
  'invoice.paid', 'campaign.reply_received', 'bank.disbursement_updated',
  'return.efile_accepted', 'network.recruit_joined', 'payout.accrued',
];

const CURL_EXAMPLE = `curl https://api.taxprohubuniversity.com/api/v1/contacts \\
  -H "Authorization: Bearer vtp_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Maria",
    "lastName": "Gonzalez",
    "email": "maria@example.com",
    "tags": ["w2-client"],
    "customFields": { "taxYear": "2025", "filingStatus": "HOH" }
  }'`;

export default function DeveloperPage() {
  const { addNotification } = useAppStore();
  const [keys, setKeys] = useState<ApiKey[]>(SEED_KEYS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState<Set<string>>(new Set(['contacts:read']));
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(true);

  const notify = (title: string, message: string) =>
    addNotification({ id: `ntf-${Date.now()}`, title, message, type: 'success', read: false, createdAt: new Date() });

  const genKey = () => {
    const rand = () => Math.random().toString(36).slice(2, 10);
    return `vtp_live_${rand()}${rand()}${rand()}${rand()}`;
  };

  const createKey = () => {
    if (!newName.trim() || newScopes.size === 0) return;
    const full = genKey();
    const k: ApiKey = {
      id: `k_${Date.now().toString(36)}`, name: newName.trim(),
      prefix: `${full.slice(0, 13)}…${full.slice(-4)}`, fullKey: full,
      scopes: [...newScopes], createdAt: new Date().toISOString().slice(0, 10),
      lastUsed: null, requests30d: 0, status: 'active',
    };
    setKeys((p) => [k, ...p]);
    setRevealedKey(k.id);
    setShowCreate(false); setNewName(''); setNewScopes(new Set(['contacts:read']));
    notify('API key created', `"${k.name}" issued. Copy the full key now — it is shown only once.`);
  };

  const revoke = (id: string) => {
    setKeys((p) => p.map((k) => (k.id === id ? { ...k, status: 'revoked' as const, fullKey: undefined } : k)));
    notify('Key revoked', 'The key stops authenticating within 60 seconds at the edge.');
  };

  const copyText = (t: string, what: string) => {
    navigator.clipboard?.writeText(t);
    notify('Copied', `${what} copied to clipboard.`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/30 to-blue-600/10 border border-sky-500/40 grid place-items-center">
            <Code2 className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Developer Hub</h1>
            <p className="text-sm text-gray-400">Public REST API — partners, banks, and other software integrate with <span className="text-white font-semibold">your</span> platform.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-center gap-1.5">
            <Globe className="w-3 h-3" /> Served from Cloudflare's edge — 300+ cities
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Scoped keys · rate limited · instant revoke
          </span>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2"><KeyRound className="w-4 h-4 text-sky-300" /> API Keys</h3>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 hover:brightness-110 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Key
          </button>
        </div>
        <div className="space-y-2.5">
          {keys.map((k) => (
            <div key={k.id} className={`rounded-xl border p-4 ${k.status === 'revoked' ? 'bg-black/20 border-white/5 opacity-50' : 'bg-black/30 border-white/10'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{k.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${k.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>{k.status.toUpperCase()}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {revealedKey === k.id && k.fullKey ? k.fullKey : k.prefix}
                    {k.fullKey && (
                      <button onClick={() => setRevealedKey(revealedKey === k.id ? null : k.id)} className="ml-2 text-sky-300 hover:text-sky-200">
                        {revealedKey === k.id ? <EyeOff className="w-3 h-3 inline" /> : <Eye className="w-3 h-3 inline" />}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {k.scopes.map((s) => <span key={s} className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[9px] font-mono">{s}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-[11px] text-gray-500">
                    <div><span className="text-white font-bold">{k.requests30d.toLocaleString()}</span> req / 30d</div>
                    <div>{k.lastUsed ? `Last used ${k.lastUsed}` : 'Never used'} · created {k.createdAt}</div>
                  </div>
                  {k.status === 'active' && (
                    <div className="flex gap-1.5">
                      {k.fullKey && (
                        <button onClick={() => copyText(k.fullKey!, 'Full API key')} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white" title="Copy full key">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => revoke(k.id)} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20" title="Revoke">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {k.fullKey && revealedKey === k.id && (
                <div className="mt-2 text-[10px] text-amber-300 flex items-center gap-1.5">
                  ⚠ Copy this key now — it is shown only once and stored hashed (SHA-256) at the edge.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Endpoint reference */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <h3 className="text-white font-bold flex items-center gap-2 mb-3"><Terminal className="w-4 h-4 text-sky-300" /> REST Endpoints (v1)</h3>
          <div className="space-y-1.5">
            {ENDPOINTS.map((e, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg bg-black/30 border border-white/5 px-3 py-2">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black w-11 text-center ${e.method === 'GET' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{e.method}</span>
                <code className="text-[11px] text-white font-mono flex-1 truncate">{e.path}</code>
                <span className="text-[10px] text-gray-500 hidden xl:block">{e.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-gray-500">
            Auth: <code className="text-sky-300">Authorization: Bearer vtp_live_…</code> · Rate limit: 120 req/min per key (429 + Retry-After) · Idempotency via <code className="text-sky-300">Idempotency-Key</code> header.
          </div>
        </div>

        {/* Webhooks + example */}
        <div className="space-y-5">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
            <h3 className="text-white font-bold flex items-center gap-2 mb-3"><Webhook className="w-4 h-4 text-violet-300" /> Webhook Events</h3>
            <div className="flex flex-wrap gap-1.5">
              {WEBHOOK_EVENTS.map((ev) => (
                <span key={ev} className="px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-mono">{ev}</span>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-gray-500">
              Deliveries are HMAC-SHA256 signed (<code className="text-violet-300">X-VTP-Signature</code>), retried with exponential backoff for 24h.
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Quick Start</h3>
              <button onClick={() => copyText(CURL_EXAMPLE, 'cURL example')} className="text-xs text-gray-400 hover:text-white flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
            </div>
            {showExample && (
              <pre className="rounded-xl bg-black/60 border border-white/10 p-4 text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre">{CURL_EXAMPLE}</pre>
            )}
            <button onClick={() => setShowExample(!showExample)} className="mt-2 text-[11px] text-gray-500 hover:text-white">{showExample ? 'Hide' : 'Show'} example</button>
          </div>

          {/* E-file rails disclosure */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/25 p-4 text-xs text-gray-300 leading-relaxed">
            <span className="text-white font-bold flex items-center gap-1.5 mb-1"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> E-file rails roadmap (honest disclosure)</span>
            Returns e-file today through the integrated <span className="text-amber-300 font-semibold">TaxSlayer Pro bridge</span>. Direct IRS MeF transmission (A2A) requires an ETIN + IRS e-file application + passing Assurance Testing System (ATS) per IRS Pub 1436 — our software-developer ATS track is in progress for the next season. All API contracts above are transmission-agnostic.
          </div>
        </div>
      </div>

      {/* Create key modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/15 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><KeyRound className="w-5 h-5 text-sky-300" /> Issue New API Key</h3>
            <label className="text-xs text-gray-400 block mb-1.5">Key name (who/what uses it)</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Republic Bank status poller"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:border-sky-500/50 outline-none mb-4" />
            <label className="text-xs text-gray-400 block mb-2">Scopes</label>
            <div className="grid grid-cols-2 gap-1.5 mb-5 max-h-48 overflow-y-auto">
              {ALL_SCOPES.map((s) => (
                <label key={s.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer text-[11px] transition
                  ${newScopes.has(s.id) ? 'bg-sky-500/15 border-sky-500/40 text-sky-200' : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5'}`}>
                  <input type="checkbox" className="accent-sky-500" checked={newScopes.has(s.id)}
                    onChange={() => setNewScopes((p) => { const n = new Set(p); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })} />
                  {s.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={createKey} disabled={!newName.trim() || newScopes.size === 0}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-bold text-sm disabled:opacity-40">
                Issue Key
              </button>
              <button onClick={() => setShowCreate(false)} className="px-5 py-3 rounded-xl bg-white/5 border border-white/15 text-gray-300 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
