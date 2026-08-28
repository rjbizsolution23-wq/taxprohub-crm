/**
 * ═══════════════════════════════════════════════════════════════════════
 * PAYOUT RUNS — batched preparer commissions via Stripe Connect
 * ═══════════════════════════════════════════════════════════════════════
 * Builds a run from every pending commission in D1, one line per preparer,
 * then executes real Stripe Connect transfers. Everything shown is read back
 * from /api/payouts/runs — failures surface with the provider's own error.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Banknote, Play, Plus, RefreshCw, Link2, CheckCircle2, XCircle,
  Loader2, AlertTriangle, Users,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAppStore } from '../store';

interface RunItem {
  id: string; preparer_id: string; preparer_name: string; amount_cents: number;
  status: string; stripe_transfer_id: string | null; error: string | null; paid_at: string | null;
}
interface Run {
  id: string; period: string; status: string; total_cents: number; paid_cents: number;
  item_count: number; created_at: string; executed_at: string | null; items: RunItem[];
}
interface Account { preparer_id: string; stripe_account_id: string; method: string; status: string }

const money = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function PayoutRunsPage() {
  const { preparers } = useAppStore();
  const [runs, setRuns] = useState<Run[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [acctDraft, setAcctDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await apiFetch<{ runs: Run[]; accounts: Account[]; stripeConfigured: boolean }>('/api/payouts/runs');
    if (res.ok && res.data) {
      const d = res.data as any;
      setRuns(d.runs || []); setAccounts(d.accounts || []); setStripeConfigured(!!d.stripeConfigured); setErr('');
    } else setErr((res.data as any)?.hint || 'Payout runs need the live D1 backend.');
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createRun = async () => {
    setBusy('create'); setMsg(''); setErr('');
    const res = await apiFetch<{ runId: string; totalCents: number; items: number }>('/api/payouts/runs', { method: 'POST', body: '{}' });
    const d: any = res.data || {};
    if (res.ok) setMsg(`Run created — ${d.items} preparer${d.items === 1 ? '' : 's'}, ${money(d.totalCents)} queued.`);
    else setErr(d.hint || d.error || 'Could not create a run.');
    setBusy(''); await load();
  };

  const execute = async (id: string) => {
    setBusy(id); setMsg(''); setErr('');
    const res = await apiFetch<{ paid: number; failed: number; paidCents: number }>(`/api/payouts/runs/${id}/execute`, { method: 'POST' });
    const d: any = res.data || {};
    if (res.ok) setMsg(`Executed — ${d.paid} paid (${money(d.paidCents || 0)}), ${d.failed} failed or skipped.`);
    else setErr(d.error || 'Execution failed.');
    setBusy(''); await load();
  };

  const linkAccount = async (preparerId: string) => {
    const acct = (acctDraft[preparerId] || '').trim();
    if (!acct) return;
    setBusy(preparerId);
    const res = await apiFetch(`/api/preparers/${preparerId}/payment-account`, {
      method: 'POST', body: JSON.stringify({ stripeAccountId: acct }),
    });
    if (res.ok) { setMsg('Connected account linked.'); setAcctDraft((p) => ({ ...p, [preparerId]: '' })); }
    else setErr((res.data as any)?.error || 'Could not link that account id.');
    setBusy(''); await load();
  };

  const acctFor = (id: string) => accounts.find((a) => a.preparer_id === id);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-black bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
            Payout Runs
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-2.5">Commission Disbursement</h1>
          <p className="text-slate-400 text-sm mt-1">
            Batches every pending commission into one run, then transfers via Stripe Connect.
            {!stripeConfigured && <span className="text-amber-400"> Stripe key not configured — transfers will report as failed until it is set.</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2.5 bg-neutral-950 border border-[#1f2937] rounded-xl text-slate-400 hover:text-[#D4AF37]"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={createRun} disabled={busy !== ''}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center gap-2">
            {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} New run
          </button>
        </div>
      </div>

      {msg && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">{msg}</div>}
      {err && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 font-mono">{err}</div>}

      {/* Connected accounts */}
      <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Link2 className="h-4 w-4 text-[#D4AF37]" /> Connected payout accounts</h2>
        {preparers.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono">No preparers on file yet.</p>
        ) : (
          <div className="space-y-2">
            {preparers.map((p: any) => {
              const acct = acctFor(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-neutral-900 last:border-0 flex-wrap">
                  <span className="text-sm text-white flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-500" /> {p.firstName} {p.lastName}
                  </span>
                  {acct ? (
                    <span className="text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {acct.stripe_account_id}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input value={acctDraft[p.id] || ''} onChange={(e) => setAcctDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                        placeholder="acct_1A2b3C…"
                        className="w-48 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-mono outline-none focus:border-[#D4AF37]/50" />
                      <button onClick={() => linkAccount(p.id)} disabled={busy === p.id}
                        className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[10px] font-black uppercase tracking-wider disabled:opacity-40">
                        Link
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Runs */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Banknote className="h-4 w-4 text-[#D4AF37]" /> Runs</h2>
        {runs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1f2937] p-10 text-center">
            <p className="text-sm text-slate-400">No payout runs yet.</p>
            <p className="text-xs text-slate-600 mt-1">Accrue commissions on closed deals, then create a run.</p>
          </div>
        ) : runs.map((run) => (
          <div key={run.id} className="bg-neutral-950/85 border border-[#1f2937] rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white font-mono">{run.period}</h3>
                  <span className={`text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded-lg border ${
                    run.status === 'complete' ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                    : run.status === 'failed' ? 'border-red-500/30 text-red-300 bg-red-500/10'
                    : 'border-amber-500/30 text-amber-300 bg-amber-500/10'}`}>{run.status}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-1">
                  {run.item_count} preparer{run.item_count === 1 ? '' : 's'} · total {money(run.total_cents)} · paid {money(run.paid_cents)}
                  {run.executed_at ? ` · executed ${new Date(run.executed_at).toLocaleString()}` : ''}
                </p>
              </div>
              {run.status !== 'complete' && (
                <button onClick={() => execute(run.id)} disabled={busy !== ''}
                  className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider disabled:opacity-40 flex items-center gap-2">
                  {busy === run.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Execute
                </button>
              )}
            </div>

            <div className="mt-4 space-y-1.5">
              {run.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-3 text-[11px] font-mono border-b border-neutral-900/60 pb-1.5 last:border-0">
                  <span className="text-slate-300">{it.preparer_name}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-white">{money(it.amount_cents)}</span>
                    {it.status === 'paid' ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {it.stripe_transfer_id || 'paid'}</span>
                    ) : it.status === 'pending' ? (
                      <span className="text-slate-500">pending</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 max-w-[280px] truncate" title={it.error || ''}>
                        {it.status === 'skipped' ? <AlertTriangle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {it.error || it.status}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
