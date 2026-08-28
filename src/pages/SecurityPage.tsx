/**
 * ═══════════════════════════════════════════════════════════════════════
 * SECURITY & PLAN CENTER
 * ═══════════════════════════════════════════════════════════════════════
 * TOTP enrolment (RFC 6238), live plan utilization against the tenant's tier,
 * and — for platform admins — a cross-tenant operator table with plan control.
 * Every number is read from /api/plan and /api/platform/overview.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck, KeyRound, Smartphone, Copy, CheckCircle2, AlertTriangle,
  Loader2, Gauge, Crown, Building2, RefreshCw, FileJson, Trash2, Download,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAppStore } from '../store';

interface Plan {
  key: string; label: string; priceMonthly: number; seats: number; contacts: number;
  emailsPerMonth: number; smsPerMonth: number; storageDocs: number; subAccounts: number; features: string[];
}
interface PlanStatus {
  ok: boolean; plan: Plan; catalog: Plan[]; period: string;
  usage: Record<string, number>; utilization: Record<string, number>;
}
interface PlatformRow {
  id: string; name: string; business_name: string; plan: string; planLabel: string;
  priceMonthly: number; status: string; created_at: string;
  usage: Record<string, number>; openFindings: number;
}

const METRICS: { key: string; label: string }[] = [
  { key: 'seats', label: 'Team seats' },
  { key: 'contacts', label: 'Clients' },
  { key: 'emailsPerMonth', label: 'Emails this month' },
  { key: 'smsPerMonth', label: 'SMS this month' },
  { key: 'storageDocs', label: 'Vault documents' },
];

export default function SecurityPage() {
  const { contacts } = useAppStore();
  const [dsar, setDsar] = useState<any[]>([]);
  const [dsarContact, setDsarContact] = useState('');
  const [dsarBusy, setDsarBusy] = useState('');
  const [plan, setPlan] = useState<PlanStatus | null>(null);
  const [platform, setPlatform] = useState<{ tenants: PlatformRow[]; totals: { tenants: number; mrr: number } } | null>(null);
  const [mfa, setMfa] = useState<{ enabled: boolean; backupCodesRemaining: number } | null>(null);
  const [enroll, setEnroll] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const [p, m, pf] = await Promise.all([
      apiFetch<PlanStatus>('/api/plan'),
      apiFetch<{ enabled: boolean; backupCodesRemaining: number }>('/api/auth/mfa'),
      apiFetch<{ tenants: PlatformRow[]; totals: { tenants: number; mrr: number } }>('/api/platform/overview'),
    ]);
    if (p.ok) setPlan(p.data as PlanStatus);
    else setErr((p.data as any)?.hint || 'Sign in against the live backend to see plan usage.');
    if (m.ok) setMfa(m.data as any);
    if (pf.ok) setPlatform(pf.data as any);
    else setPlatform(null);
  }, []);

  const loadDsar = useCallback(async () => {
    const res = await apiFetch<{ items: any[] }>('/api/privacy/requests');
    if (res.ok) setDsar(((res.data as any)?.items) || []);
  }, []);

  useEffect(() => { void load(); void loadDsar(); }, [load, loadDsar]);

  /* Data subject requests — export produces a hashed JSON bundle; erasure
     pseudonymizes identity while disclosing statutory retention. */
  const runDsar = async (kind: 'export' | 'erasure') => {
    if (!dsarContact) return;
    if (kind === 'erasure' && !confirm('Erase this contact’s personal data? Tax records required by IRC §6107 are retained and disclosed in the receipt.')) return;
    setDsarBusy(kind);
    const res = await apiFetch<{ recordCount: number; retainedNote?: string; status: string }>('/api/privacy/requests', {
      method: 'POST', body: JSON.stringify({ contactId: dsarContact, kind }),
    });
    const d: any = res.data || {};
    if (res.ok) setMsg(kind === 'export'
      ? `Export complete — ${d.recordCount} records, sha256 ${String(d.sha256).slice(0, 16)}…`
      : `Erasure ${d.status}. ${d.retainedNote || ''}`);
    else setErr(d.hint || d.error || 'Request failed.');
    setDsarBusy('');
    await loadDsar();
  };

  const downloadDsar = async (id: string) => {
    const token = localStorage.getItem('tph_session_token') || '';
    const res = await fetch(`/api/privacy/requests/${id}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dsar-${id.slice(0, 8)}.json`; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const startEnroll = async () => {
    setBusy(true); setErr(''); setMsg('');
    const res = await apiFetch<{ secret: string; otpauthUrl: string }>('/api/auth/mfa/setup', { method: 'POST' });
    if (res.ok) setEnroll(res.data as any);
    else setErr((res.data as any)?.hint || res.error || 'Could not start enrolment.');
    setBusy(false);
  };

  const confirmEnroll = async () => {
    setBusy(true); setErr('');
    const res = await apiFetch<{ backupCodes: string[] }>('/api/auth/mfa/confirm', {
      method: 'POST', body: JSON.stringify({ code }),
    });
    if (res.ok) {
      setBackupCodes((res.data as any)?.backupCodes || []);
      setEnroll(null); setCode('');
      setMsg('Two-factor authentication is on. Save your recovery codes.');
      await load();
    } else setErr((res.data as any)?.error === 'invalid_code' ? 'That code did not match — check your device clock and try the next one.' : 'Confirmation failed.');
    setBusy(false);
  };

  const disable = async () => {
    setBusy(true); setErr('');
    const res = await apiFetch('/api/auth/mfa/disable', { method: 'POST', body: JSON.stringify({ password }) });
    if (res.ok) { setMsg('Two-factor authentication disabled.'); setPassword(''); await load(); }
    else setErr('Password did not match.');
    setBusy(false);
  };

  const changePlan = async (tenantId: string, planKey: string) => {
    await apiFetch('/api/platform/plan', { method: 'POST', body: JSON.stringify({ tenantId, plan: planKey }) });
    await load();
  };

  const bar = (pct: number) => pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-6 pb-12">
      <div>
        <span className="text-[10px] font-black text-black bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
          Security & Plan
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-2.5">Account Security &amp; Entitlements</h1>
        <p className="text-slate-400 text-sm mt-1">TOTP second factor, live plan utilization, and platform operator controls.</p>
      </div>

      {msg && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">{msg}</div>}
      {err && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 font-mono">{err}</div>}

      {/* MFA */}
      <div className="bg-neutral-950/85 border border-[#D4AF37]/20 rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 grid place-items-center">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Two-factor authentication</h2>
              <p className="text-xs text-slate-400">
                Required by the FTC Safeguards Rule §314.4(c)(5) for anyone touching customer information.
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-black font-mono uppercase px-3 py-1.5 rounded-full border ${mfa?.enabled ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}`}>
            {mfa?.enabled ? 'Enabled' : 'Not enabled'}
          </span>
        </div>

        {!mfa?.enabled && !enroll && (
          <button onClick={startEnroll} disabled={busy}
            className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />} Set up authenticator
          </button>
        )}

        {enroll && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-300">1. Add this secret to Google Authenticator, Authy or 1Password:</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-sm font-mono text-[#D4AF37] break-all">{enroll.secret}</code>
                <button onClick={() => navigator.clipboard?.writeText(enroll.secret)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><Copy className="h-3.5 w-3.5" /></button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 break-all font-mono">{enroll.otpauthUrl}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" maxLength={6}
                className="w-40 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-mono tracking-widest outline-none focus:border-[#D4AF37]/50" />
              <button onClick={confirmEnroll} disabled={busy || code.length !== 6}
                className="px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider disabled:opacity-40 flex items-center gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Confirm and enable
              </button>
            </div>
          </div>
        )}

        {backupCodes.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-xs text-amber-200 font-semibold flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" /> One-time recovery codes — shown once</p>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {backupCodes.map((c) => <code key={c} className="text-xs font-mono text-white bg-black/40 rounded-lg px-2 py-1.5 text-center">{c}</code>)}
            </div>
          </div>
        )}

        {mfa?.enabled && (
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <span className="text-[11px] text-slate-400 font-mono">{mfa.backupCodesRemaining} recovery codes remaining</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password to disable"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs outline-none focus:border-[#D4AF37]/50" />
            <button onClick={disable} disabled={busy || !password}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-wider disabled:opacity-40">
              Disable 2FA
            </button>
          </div>
        )}
      </div>

      {/* Plan utilization */}
      <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Gauge className="h-4 w-4 text-[#D4AF37]" /> Plan utilization</h2>
          <div className="flex items-center gap-3">
            {plan && (
              <span className="text-[10px] font-black font-mono uppercase px-3 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                {plan.plan.label} · ${plan.plan.priceMonthly}/mo · {plan.period}
              </span>
            )}
            <button onClick={load} className="p-2 rounded-xl bg-neutral-900 border border-[#1f2937] text-slate-400 hover:text-[#D4AF37]"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {!plan ? (
          <p className="text-xs text-slate-500 font-mono mt-4">Plan data requires the live backend.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {METRICS.map((m) => {
              const used = plan.usage[m.key] ?? 0;
              const cap = (plan.plan as any)[m.key] ?? 0;
              const pct = plan.utilization[m.key] ?? 0;
              return (
                <div key={m.key}>
                  <div className="flex justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-slate-300">{m.label}</span>
                    <span className={pct >= 90 ? 'text-red-400' : 'text-slate-400'}>{used.toLocaleString()} / {cap.toLocaleString()} · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
                    <div className={`h-full ${bar(pct)} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {plan.catalog.map((p) => (
                <div key={p.key} className={`rounded-2xl border p-5 ${p.key === plan.plan.key ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-[#1f2937] bg-neutral-950'}`}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-black text-white">{p.label}</h3>
                    <span className="text-lg font-black text-[#D4AF37] font-mono">${p.priceMonthly}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-500 font-mono mt-3">
                    {p.seats} seats · {p.contacts.toLocaleString()} clients · {p.emailsPerMonth.toLocaleString()} emails/mo
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Privacy / DSAR */}
      <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileJson className="h-4 w-4 text-[#D4AF37]" /> Data subject requests</h2>
        <p className="text-xs text-slate-400 mt-1">
          Export produces a hash-sealed JSON bundle of everything linked to a client. Erasure pseudonymizes
          identity and purges marketing data while retaining records required by IRC §6107(b).
        </p>
        <div className="flex items-end gap-3 mt-4 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Client</span>
            <select value={dsarContact} onChange={(e) => setDsarContact(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none">
              <option value="">Select…</option>
              {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>)}
            </select>
          </div>
          <button onClick={() => runDsar('export')} disabled={!dsarContact || dsarBusy !== ''}
            className="px-4 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-black uppercase tracking-wider disabled:opacity-40 flex items-center gap-2">
            {dsarBusy === 'export' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Export data
          </button>
          <button onClick={() => runDsar('erasure')} disabled={!dsarContact || dsarBusy !== ''}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-black uppercase tracking-wider disabled:opacity-40 flex items-center gap-2">
            {dsarBusy === 'erasure' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Erase
          </button>
        </div>
        {dsar.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {dsar.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 text-[11px] font-mono border-b border-neutral-900 pb-1.5 last:border-0">
                <span className="text-slate-300">{new Date(r.created_at).toLocaleString()} · {r.kind} · {r.records_count} records</span>
                <span className="flex items-center gap-3">
                  <span className={r.status === 'complete' ? 'text-emerald-400' : 'text-amber-400'}>{r.status}</span>
                  <button onClick={() => downloadDsar(r.id)} className="text-[#D4AF37] hover:underline">download</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform operator view */}
      {platform && (
        <div className="bg-neutral-950/85 border border-amber-500/30 rounded-3xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Crown className="h-4 w-4 text-amber-400" /> Platform operator</h2>
            <span className="text-[10px] font-mono text-slate-400">
              {platform.totals.tenants} tenant{platform.totals.tenants === 1 ? '' : 's'} · ${platform.totals.mrr.toLocaleString()} MRR
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-slate-500 text-left border-b border-neutral-900">
                  <th className="py-2 pr-3">Tenant</th><th className="pr-3">Plan</th><th className="pr-3">Clients</th>
                  <th className="pr-3">Docs</th><th className="pr-3">Findings</th><th>Change plan</th>
                </tr>
              </thead>
              <tbody>
                {platform.tenants.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-900/60">
                    <td className="py-2 pr-3 text-white flex items-center gap-1.5"><Building2 className="h-3 w-3 text-slate-500" /> {t.business_name || t.name}</td>
                    <td className="pr-3 text-[#D4AF37]">{t.planLabel} (${t.priceMonthly})</td>
                    <td className="pr-3 text-slate-300">{t.usage.contacts}</td>
                    <td className="pr-3 text-slate-300">{t.usage.storageDocs}</td>
                    <td className={`pr-3 ${t.openFindings > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{t.openFindings}</td>
                    <td>
                      <select defaultValue={t.plan} onChange={(e) => changePlan(t.id, e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-slate-300">
                        <option value="starter">Starter</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
