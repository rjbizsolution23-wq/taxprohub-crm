/**
 * ═══════════════════════════════════════════════════════════════════════
 * WHITE-LABEL STUDIO — child practices + custom domains
 * ═══════════════════════════════════════════════════════════════════════
 * Provisions real child tenants (their own D1 rows, pipeline, plan ceiling and
 * 24-agent compliance roster) and claims branded hostnames with live DNS
 * verification. Every figure comes from /api/subaccounts and /api/domains.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Building2, Globe, Plus, RefreshCw, CheckCircle2, AlertTriangle,
  Loader2, Copy, ShieldCheck, Users, FileText,
} from 'lucide-react';
import { apiFetch } from '../utils/api';

interface SubAccount {
  id: string; name: string; businessName: string; plan: string; status: string;
  revenueSharePct: number; createdAt: string;
  usage: Record<string, number>; openFindings: number;
  domains: { hostname: string; kind: string; status: string; is_primary: number }[];
}
interface DomainRow {
  id: string; tenant_id: string; hostname: string; kind: string;
  status: string; verify_token: string; verified_at: string | null;
}

export default function WhiteLabelPage() {
  const [subs, setSubs] = useState<SubAccount[]>([]);
  const [limit, setLimit] = useState(0);
  const [planKey, setPlanKey] = useState('');
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [dns, setDns] = useState<{ hostname: string; records: any[] } | null>(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', businessName: '', email: '', revenueSharePct: '0' });
  const [host, setHost] = useState('');

  const load = useCallback(async () => {
    const [s, d] = await Promise.all([
      apiFetch<{ items: SubAccount[]; limit: number; plan: string }>('/api/subaccounts'),
      apiFetch<{ items: DomainRow[] }>('/api/domains'),
    ]);
    if (s.ok && s.data) { const x = s.data as any; setSubs(x.items || []); setLimit(x.limit || 0); setPlanKey(x.plan || ''); setErr(''); }
    else setErr((s.data as any)?.hint || 'White-label controls require the live D1 backend.');
    if (d.ok && d.data) setDomains(((d.data as any).items) || []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createSub = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('sub'); setMsg(''); setErr('');
    const res = await apiFetch('/api/subaccounts', {
      method: 'POST',
      body: JSON.stringify({ ...form, revenueSharePct: Number(form.revenueSharePct) || 0 }),
    });
    const d: any = res.data || {};
    if (res.ok) { setMsg(`“${form.name}” provisioned with its own pipeline and ${d.complianceAgents} compliance agents.`); setForm({ name: '', businessName: '', email: '', revenueSharePct: '0' }); }
    else setErr(d.hint || d.error || 'Could not create the sub-account.');
    setBusy(''); await load();
  };

  const claimDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('domain'); setMsg(''); setErr('');
    const res = await apiFetch<{ hostname: string; dns: any[] }>('/api/domains', {
      method: 'POST', body: JSON.stringify({ hostname: host, kind: 'portal' }),
    });
    const d: any = res.data || {};
    if (res.ok) { setDns({ hostname: d.hostname, records: d.dns || [] }); setHost(''); setMsg('Domain claimed — add the DNS records below, then verify.'); }
    else setErr(d.error === 'hostname_already_claimed' ? 'That hostname is already claimed.' : (d.error || 'Could not claim that hostname.'));
    setBusy(''); await load();
  };

  const verify = async (hostname: string) => {
    setBusy(hostname); setMsg(''); setErr('');
    const res = await apiFetch<{ status: string; observed: string[] }>('/api/domains/verify', {
      method: 'POST', body: JSON.stringify({ hostname }),
    });
    const d: any = res.data || {};
    if (d.ok) setMsg(`${hostname} verified and active.`);
    else setErr(`${hostname} not verified yet. Expected TXT ${d.expected || ''}${(d.observed || []).length ? `, saw ${(d.observed || []).join(', ')}` : ' (no TXT record found)'}.`);
    setBusy(''); await load();
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <span className="text-[10px] font-black text-black bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
          White-Label Studio
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-2.5">Child Practices &amp; Custom Domains</h1>
        <p className="text-slate-400 text-sm mt-1">
          Each sub-account is a fully isolated tenant — own data, own plan ceiling, own compliance roster.
          {planKey && <span className="text-[#D4AF37]"> {subs.length}/{limit} used on {planKey}.</span>}
        </p>
      </div>

      {msg && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">{msg}</div>}
      {err && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 font-mono">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Provision */}
        <form onSubmit={createSub} className="bg-neutral-950/85 border border-[#D4AF37]/20 rounded-3xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Building2 className="h-4 w-4 text-[#D4AF37]" /> Provision a sub-account</h2>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Practice name"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50" />
          <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Legal business name"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50" />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Owner email (optional)"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50" />
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Revenue share %</span>
            <input type="number" min={0} max={100} value={form.revenueSharePct} onChange={(e) => setForm({ ...form, revenueSharePct: e.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50" />
          </label>
          <button type="submit" disabled={busy !== ''}
            className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 py-2.5 text-xs font-black text-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">
            {busy === 'sub' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create practice
          </button>
        </form>

        {/* Domains */}
        <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Globe className="h-4 w-4 text-[#D4AF37]" /> Custom domains</h2>
          <form onSubmit={claimDomain} className="flex gap-2">
            <input required value={host} onChange={(e) => setHost(e.target.value)} placeholder="portal.yourfirm.com"
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-mono outline-none focus:border-[#D4AF37]/50" />
            <button type="submit" disabled={busy !== ''}
              className="px-4 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-black uppercase tracking-wider disabled:opacity-40">
              {busy === 'domain' ? '…' : 'Claim'}
            </button>
          </form>

          {dns && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3 space-y-2">
              <p className="text-[11px] text-slate-300">Add these records for <span className="font-mono text-[#D4AF37]">{dns.hostname}</span>:</p>
              {dns.records.map((r, i) => (
                <div key={i} className="text-[10px] font-mono text-slate-400 flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0">{r.type}</span>
                  <span className="break-all">{r.name} → {r.value}</span>
                  <button onClick={() => navigator.clipboard?.writeText(r.value)} className="text-slate-500 hover:text-white shrink-0"><Copy className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            {domains.length === 0 ? (
              <p className="text-[11px] text-slate-500 font-mono">No domains claimed yet.</p>
            ) : domains.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 text-[11px] font-mono border-b border-neutral-900 pb-1.5 last:border-0">
                <span className="text-slate-300 truncate">{d.hostname} <span className="text-slate-600">· {d.kind}</span></span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={d.status === 'active' ? 'text-emerald-400' : d.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>{d.status}</span>
                  {d.status !== 'active' && (
                    <button onClick={() => verify(d.hostname)} disabled={busy !== ''} className="text-[#D4AF37] hover:underline disabled:opacity-40">
                      {busy === d.hostname ? 'checking…' : 'verify'}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Verification performs a live DNS-over-HTTPS lookup of the TXT record. Also add the hostname as a
            Custom Domain on the Cloudflare Pages project so TLS is issued.
          </p>
        </div>
      </div>

      {/* Sub-account roster */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-[#D4AF37]" /> Practices</h2>
        {subs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1f2937] p-10 text-center">
            <p className="text-sm text-slate-400">No white-label practices yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {subs.map((s) => (
              <div key={s.id} className="bg-neutral-950/80 border border-[#1f2937] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{s.businessName || s.name}</h3>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{s.id} · {s.plan} · {s.revenueSharePct}% share</p>
                  </div>
                  <span className={`text-[9px] font-black font-mono uppercase px-2 py-1 rounded-lg border shrink-0 ${s.openFindings > 0 ? 'border-amber-500/30 text-amber-300 bg-amber-500/10' : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'}`}>
                    {s.openFindings > 0 ? `${s.openFindings} findings` : 'clear'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div><div className="text-sm font-black text-white font-mono">{s.usage?.contacts ?? 0}</div><div className="text-[9px] uppercase text-slate-500 font-mono">clients</div></div>
                  <div><div className="text-sm font-black text-white font-mono">{s.usage?.storageDocs ?? 0}</div><div className="text-[9px] uppercase text-slate-500 font-mono">docs</div></div>
                  <div><div className="text-sm font-black text-white font-mono">{s.usage?.seats ?? 0}</div><div className="text-[9px] uppercase text-slate-500 font-mono">seats</div></div>
                </div>
                {s.domains.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-900 space-y-1">
                    {s.domains.map((d) => (
                      <div key={d.hostname} className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                        {d.status === 'active' ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <AlertTriangle className="h-3 w-3 text-amber-400" />}
                        {d.hostname}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-600">
                  <ShieldCheck className="h-3 w-3" /> 24 agents
                  <FileText className="h-3 w-3 ml-2" /> own vault
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
