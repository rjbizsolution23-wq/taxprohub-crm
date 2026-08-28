/**
 * ═══════════════════════════════════════════════════════════════════════
 * E-FILE & BANK PRODUCTS
 * ═══════════════════════════════════════════════════════════════════════
 * The real MeF lifecycle (draft → ready → transmitted → accepted/rejected →
 * perfected) with the published IRS reject-code meanings, plus refund
 * advance / refund transfer tracking with the disclosure gate enforced.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Send, RefreshCw, Plus, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Banknote, FileCheck2, Clock, ShieldAlert,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAppStore } from '../store';

interface Efile {
  id: string; return_type: string; tax_year: string; jurisdiction: string; status: string;
  efin: string; submission_id: string | null; ack_code: string | null;
  reject_codes: string[]; rejectDetail: { code: string; meaning?: string; fix?: string }[];
  perfection_deadline: string | null; transmitted_at: string | null; acked_at: string | null;
  refund_cents: number; contact_id: string | null;
}
interface BankProduct {
  id: string; product_type: string; bank: string; status: string;
  requested_cents: number; approved_cents: number; prep_fee_cents: number;
  bank_fee_cents: number; net_to_client_cents: number;
  disclosure_signed_id: string | null; contact_id: string | null; funded_at: string | null;
}

const money = (c: number) => `$${((c || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const STATUS_STYLE: Record<string, string> = {
  accepted: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  funded: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  settled: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  rejected: 'border-red-500/30 text-red-300 bg-red-500/10',
  denied: 'border-red-500/30 text-red-300 bg-red-500/10',
  transmitted: 'border-sky-500/30 text-sky-300 bg-sky-500/10',
  ready: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
  draft: 'border-slate-500/30 text-slate-300 bg-slate-500/10',
};

export default function EfilePage() {
  const { contacts, deals } = useAppStore();
  const [efiles, setEfiles] = useState<Efile[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [bank, setBank] = useState<BankProduct[]>([]);
  const [bankTotals, setBankTotals] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [draft, setDraft] = useState({ contactId: '', dealId: '', returnType: '1040', taxYear: String(new Date().getFullYear() - 1) });
  const [ackDraft, setAckDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [e, b] = await Promise.all([
      apiFetch<{ items: Efile[]; counts: Record<string, number>; providerConfigured: boolean }>('/api/efile/submissions'),
      apiFetch<{ items: BankProduct[]; totals: Record<string, number> }>('/api/bank/products'),
    ]);
    if (e.ok && e.data) { const d = e.data as any; setEfiles(d.items || []); setCounts(d.counts || {}); setProviderConfigured(!!d.providerConfigured); setErr(''); }
    else setErr((e.data as any)?.hint || 'E-file tracking requires the live D1 backend.');
    if (b.ok && b.data) { const d = b.data as any; setBank(d.items || []); setBankTotals(d.totals || {}); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = async (label: string, fn: () => Promise<any>) => {
    setBusy(label); setMsg(''); setErr('');
    const res = await fn();
    const d: any = res.data || {};
    if (res.ok || d.ok) setMsg(d.hint || `${label} complete.`);
    else setErr(d.hint || d.error || `${label} failed.`);
    setBusy(''); await load();
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    return act('Create submission', () => apiFetch('/api/efile/submissions', { method: 'POST', body: JSON.stringify(draft) }));
  };

  const transmit = (id: string) => act('Transmit', () => apiFetch(`/api/efile/submissions/${id}/transmit`, { method: 'POST' }));

  const ack = (id: string, status: 'accepted' | 'rejected') => act(`Record ${status}`, () => apiFetch(`/api/efile/submissions/${id}/ack`, {
    method: 'POST',
    body: JSON.stringify({ status, rejectCodes: (ackDraft[id] || '').split(',').map((c) => c.trim()).filter(Boolean) }),
  }));

  const fund = (id: string, approvedCents: number) => act('Fund bank product', () => apiFetch(`/api/bank/products/${id}`, {
    method: 'PUT', body: JSON.stringify({ status: 'funded', approvedCents }),
  }));

  return (
    <div className="space-y-6 pb-12">
      <div>
        <span className="text-[10px] font-black text-black bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
          E-File &amp; Bank Products
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-2.5">Filing Lifecycle Control</h1>
        <p className="text-slate-400 text-sm mt-1">
          MeF status tracking with published IRS reject-code guidance.
          {providerConfigured
            ? <span className="text-emerald-400"> Provider connected — transmissions go out from here.</span>
            : <span className="text-amber-400"> Manual mode: transmit in your provider software, then record the acknowledgement here. Nothing is ever marked accepted on its own.</span>}
        </p>
      </div>

      {msg && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">{msg}</div>}
      {err && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 font-mono">{err}</div>}

      {/* Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['draft', 'ready', 'transmitted', 'accepted', 'rejected'].map((k) => (
          <div key={k} className={`rounded-2xl border p-4 ${STATUS_STYLE[k] || 'border-[#1f2937]'}`}>
            <div className="text-2xl font-black font-mono">{counts[k] || 0}</div>
            <div className="text-[10px] uppercase tracking-wider font-mono mt-1">{k}</div>
          </div>
        ))}
      </div>

      {/* New submission */}
      <form onSubmit={create} className="bg-neutral-950/85 border border-[#D4AF37]/20 rounded-3xl p-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Client</span>
          <select value={draft.contactId} onChange={(e) => setDraft({ ...draft, contactId: e.target.value })}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none">
            <option value="">Select…</option>
            {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Engagement</span>
          <select value={draft.dealId} onChange={(e) => setDraft({ ...draft, dealId: e.target.value })}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none">
            <option value="">None</option>
            {deals.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="w-32">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Return</span>
          <select value={draft.returnType} onChange={(e) => setDraft({ ...draft, returnType: e.target.value })}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none">
            {['1040', '1065', '1120', '1120S', '941'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="w-28">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Tax year</span>
          <input value={draft.taxYear} onChange={(e) => setDraft({ ...draft, taxYear: e.target.value })}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-mono outline-none" />
        </div>
        <button type="submit" disabled={busy !== ''}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center gap-2">
          {busy === 'Create submission' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add return
        </button>
        <button type="button" onClick={load} className="p-2.5 bg-neutral-900 border border-[#1f2937] rounded-xl text-slate-400 hover:text-[#D4AF37]"><RefreshCw className="h-4 w-4" /></button>
      </form>

      {/* Submissions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-[#D4AF37]" /> Submissions</h2>
        {efiles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1f2937] p-10 text-center text-sm text-slate-400">No returns tracked yet.</div>
        ) : efiles.map((f) => {
          const overdue = f.perfection_deadline && new Date(f.perfection_deadline) < new Date();
          return (
            <div key={f.id} className={`bg-neutral-950/85 border rounded-2xl p-5 ${overdue ? 'border-red-500/40' : 'border-[#1f2937]'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-white font-mono">{f.return_type} · TY{f.tax_year}</span>
                    <span className={`text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded-lg border ${STATUS_STYLE[f.status] || ''}`}>{f.status}</span>
                    {f.efin && <span className="text-[10px] font-mono text-slate-500">EFIN {f.efin}</span>}
                    {f.submission_id && <span className="text-[10px] font-mono text-slate-500">#{f.submission_id}</span>}
                  </div>
                  {f.refund_cents > 0 && <p className="text-[11px] text-emerald-300 font-mono mt-1">refund {money(f.refund_cents)}</p>}
                  {f.perfection_deadline && f.status === 'rejected' && (
                    <p className={`text-[11px] font-mono mt-1 flex items-center gap-1.5 ${overdue ? 'text-red-400' : 'text-amber-400'}`}>
                      <Clock className="h-3 w-3" /> perfection deadline {new Date(f.perfection_deadline).toLocaleDateString()}{overdue ? ' — PASSED' : ''}
                    </p>
                  )}
                  {(f.rejectDetail || []).map((r) => (
                    <div key={r.code} className="mt-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                      <p className="text-[11px] font-mono text-red-300">{r.code}</p>
                      {r.meaning && <p className="text-[11px] text-slate-300 mt-1">{r.meaning}</p>}
                      {r.fix && <p className="text-[11px] text-emerald-300/80 mt-1"><strong>Fix:</strong> {r.fix}</p>}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {(f.status === 'draft' || f.status === 'ready') && (
                    <button onClick={() => transmit(f.id)} disabled={busy !== ''}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[10px] font-black uppercase tracking-wider disabled:opacity-40 flex items-center gap-1">
                      <Send className="h-3 w-3" /> Transmit
                    </button>
                  )}
                  {f.status !== 'accepted' && (
                    <>
                      <input value={ackDraft[f.id] || ''} onChange={(e) => setAckDraft({ ...ackDraft, [f.id]: e.target.value })}
                        placeholder="reject codes, comma-sep"
                        className="w-52 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-mono outline-none" />
                      <div className="flex gap-2">
                        <button onClick={() => ack(f.id, 'accepted')} disabled={busy !== ''}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase disabled:opacity-40 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Accepted
                        </button>
                        <button onClick={() => ack(f.id, 'rejected')} disabled={busy !== ''}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-black uppercase disabled:opacity-40 flex items-center justify-center gap-1">
                          <XCircle className="h-3 w-3" /> Rejected
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bank products */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Banknote className="h-4 w-4 text-[#D4AF37]" /> Bank products</h2>
          <span className="text-[11px] font-mono text-slate-400">
            funded {money(bankTotals.fundedCents || 0)} · prep fees {money(bankTotals.prepFeesCents || 0)}
            {bankTotals.missingDisclosures > 0 && <span className="text-red-400"> · {bankTotals.missingDisclosures} missing disclosure</span>}
          </span>
        </div>
        {bank.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1f2937] p-8 text-center text-sm text-slate-400">
            No refund advance or refund transfer applications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {bank.map((b) => (
              <div key={b.id} className="bg-neutral-950/80 border border-[#1f2937] rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white font-semibold">{b.product_type.replace(/_/g, ' ')}</span>
                    <span className={`text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded-lg border ${STATUS_STYLE[b.status] || 'border-slate-600 text-slate-300'}`}>{b.status}</span>
                    {b.bank && <span className="text-[10px] font-mono text-slate-500">{b.bank}</span>}
                    {!b.disclosure_signed_id && (
                      <span className="text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded-lg border border-red-500/30 text-red-300 bg-red-500/10 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> no disclosure
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    requested {money(b.requested_cents)} · approved {money(b.approved_cents)} · fees {money(b.prep_fee_cents + b.bank_fee_cents)} · net {money(b.net_to_client_cents)}
                  </p>
                </div>
                {b.status === 'applied' || b.status === 'approved' ? (
                  <button onClick={() => fund(b.id, b.approved_cents || b.requested_cents)} disabled={busy !== ''}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider disabled:opacity-40">
                    Mark funded
                  </button>
                ) : b.funded_at ? (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {new Date(b.funded_at).toLocaleDateString()}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-600 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3" /> Funding is blocked until a signed bank product disclosure exists for the client.
        </p>
      </div>
    </div>
  );
}
