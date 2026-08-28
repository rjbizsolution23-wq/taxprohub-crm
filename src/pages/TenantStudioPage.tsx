import { useState } from 'react';
import {
  Crown, Building2, Plus, Palette, Upload, CheckCircle2, Globe, Users,
  Pause, Play, Rocket, Search, Sparkles, DollarSign
} from 'lucide-react';
import { useAppStore } from '../store';
import type { SubAccount } from '../types';

/* ────────────────────────────────────────────────────────────────
   TENANT STUDIO — the master-admin no-code interface.
   You (platform owner) take a client's logo, name & colors and
   spin up their fully-branded tenant in one screen. Manage,
   suspend, re-brand and impersonate every tenant from here.
   ──────────────────────────────────────────────────────────────── */

const PALETTES = [
  { name: 'Gold Authority', primary: '#D4AF37', secondary: '#0F172A', accent: '#F59E0B' },
  { name: 'Trust Blue', primary: '#2563EB', secondary: '#0F172A', accent: '#38BDF8' },
  { name: 'Money Green', primary: '#059669', secondary: '#022C22', accent: '#34D399' },
  { name: 'Bold Crimson', primary: '#DC2626', secondary: '#1C1917', accent: '#F87171' },
  { name: 'Royal Purple', primary: '#7C3AED', secondary: '#1E1B4B', accent: '#A78BFA' },
  { name: 'Slate Executive', primary: '#64748B', secondary: '#0F172A', accent: '#94A3B8' },
];

const PLAN_OPTIONS = ['Launch — $199/mo', 'Growth — $399/mo', 'Service Bureau — $899/mo'];

export default function TenantStudioPage() {
  const { subAccounts, addSubAccount, updateSubAccount, setCurrentSubAccount, addNotification } = useAppStore();
  const [showBuilder, setShowBuilder] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ businessName: '', email: '', phone: '', address: '', plan: PLAN_OPTIONS[1] });
  const [palette, setPalette] = useState(PALETTES[0]);
  const [customHex, setCustomHex] = useState('');
  const [logoName, setLogoName] = useState('');

  const primary = customHex || palette.primary;
  const list = subAccounts.filter((s) => s.businessName.toLowerCase().includes(search.toLowerCase()));
  const activeCount = subAccounts.filter((s) => s.status === 'active').length;

  const buildTenant = () => {
    if (!form.businessName.trim() || !form.email.trim()) return;
    const tenant: SubAccount = {
      id: `sa-${Date.now()}`,
      name: form.businessName,
      businessName: form.businessName,
      businessAddress: form.address || '—',
      email: form.email,
      phone: form.phone || '—',
      logo: logoName || undefined,
      colors: { primary, secondary: palette.secondary, accent: palette.accent, background: '#0B1120', text: '#F8FAFC' },
      domain: `${form.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.taxprohubuniversity.com`,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addSubAccount(tenant);
    addNotification({
      id: `ntf-${Date.now()}`,
      title: `🏢 Tenant built: ${form.businessName}`,
      message: `Provisioned by master admin on ${form.plan.split('—')[0].trim()} — branded portal, pipelines, drips & bank desk deployed at ${tenant.domain}. Welcome email with login sent to ${form.email}.`,
      type: 'success', read: false, createdAt: new Date(),
    });
    setShowBuilder(false);
    setForm({ businessName: '', email: '', phone: '', address: '', plan: PLAN_OPTIONS[1] });
    setLogoName(''); setCustomHex('');
  };

  const toggleStatus = (t: SubAccount) => {
    const next = t.status === 'active' ? 'suspended' : 'active';
    updateSubAccount(t.id, { status: next } as Partial<SubAccount>);
    addNotification({
      id: `ntf-${Date.now()}`,
      title: next === 'active' ? `▶ ${t.businessName} reactivated` : `⏸ ${t.businessName} suspended`,
      message: next === 'active' ? 'Tenant portal, logins and automations are live again.' : 'Tenant portal shows a maintenance page; automations paused; data retained.',
      type: 'success', read: false, createdAt: new Date(),
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-600/30 border border-amber-500/30 flex items-center justify-center">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-serif">Tenant Studio <span className="text-xs align-middle ml-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">MASTER ADMIN</span></h1>
            <p className="text-slate-400 mt-1 max-w-2xl">Your no-code tenant builder. Land a client on a call? Drop in their logo, company name and colors — their entire branded platform is live before you hang up. Manage every tenant from this desk.</p>
          </div>
        </div>
        <button onClick={() => setShowBuilder(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm flex items-center gap-2 hover:opacity-90">
          <Plus className="w-4 h-4" /> Build New Tenant
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tenants', value: String(subAccounts.length), icon: Building2, cls: 'text-sky-400' },
          { label: 'Active', value: String(activeCount), icon: CheckCircle2, cls: 'text-emerald-400' },
          { label: 'Est. Platform MRR', value: `$${(activeCount * 399).toLocaleString()}`, icon: DollarSign, cls: 'text-amber-400' },
          { label: 'Provisioning Time', value: '< 60 sec', icon: Rocket, cls: 'text-violet-400' },
        ].map((k) => (
          <div key={k.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <k.icon className={`w-5 h-5 ${k.cls} mb-2`} />
            <div className="text-2xl font-bold text-white">{k.value}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tenant list */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Building2 className="w-4 h-4 text-amber-400" /> All Tenants</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find tenant…" className="bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 w-48" />
          </div>
        </div>
        <div className="divide-y divide-slate-800/60">
          {list.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-800/20">
              <div className="flex items-center gap-3 min-w-[260px]">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-black shrink-0" style={{ background: t.colors?.primary || '#D4AF37' }}>
                  {t.businessName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">{t.businessName}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${t.status === 'active' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : t.status === 'suspended' ? 'bg-red-500/15 text-red-300 border-red-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>{t.status.toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1"><Globe className="w-3 h-3" /> {t.domain || '—'} · {t.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {t.colors && [t.colors.primary, t.colors.secondary, t.colors.accent].map((c, i) => <span key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />)}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setCurrentSubAccount(t); addNotification({ id: `ntf-${Date.now()}`, title: `Now viewing as ${t.businessName}`, message: 'Master admin impersonation active — you see exactly what this tenant sees, with their brand applied.', type: 'success', read: false, createdAt: new Date() }); }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 flex items-center gap-1.5"><Users className="w-3 h-3" /> View As</button>
                <button onClick={() => toggleStatus(t)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${t.status === 'active' ? 'bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500/20' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'}`}>
                  {t.status === 'active' ? <><Pause className="w-3 h-3" /> Suspend</> : <><Play className="w-3 h-3" /> Activate</>}
                </button>
              </div>
            </div>
          ))}
          {list.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-500">No tenants match "{search}"</div>}
        </div>
      </div>

      {/* Two paths explainer */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-sm font-bold text-white flex items-center gap-2 mb-1.5"><Rocket className="w-4 h-4 text-emerald-400" /> Path 1 — They sign themselves up</div>
          <p className="text-xs text-slate-400 leading-relaxed">Send prospects to the self-serve onboarding at <span className="text-amber-300 font-mono">/#/onboard</span>. They pick a plan, pay, upload their logo & colors — the provisioning engine builds their tenant automatically and it appears in this list.</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-sm font-bold text-white flex items-center gap-2 mb-1.5"><Crown className="w-4 h-4 text-amber-400" /> Path 2 — You build it for them</div>
          <p className="text-xs text-slate-400 leading-relaxed">Close a deal on the phone? Hit <span className="text-amber-300 font-semibold">Build New Tenant</span>, drop in their logo, name and colors, and hand them a live branded platform on the spot. No code, no waiting, no dev team.</p>
        </div>
      </div>

      {/* Builder modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowBuilder(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1"><Sparkles className="w-5 h-5 text-amber-400" /><h3 className="text-lg font-bold text-white">Build New Tenant</h3></div>
            <p className="text-xs text-slate-400 mb-5">Fill in the client's brand — everything else provisions automatically.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {[
                  { k: 'businessName', label: 'Company Name *', ph: 'Rapid Refund Tax Group' },
                  { k: 'email', label: 'Owner Email *', ph: 'owner@rapidrefund.com' },
                  { k: 'phone', label: 'Phone', ph: '(555) 987-6543' },
                  { k: 'address', label: 'Address', ph: '12 Commerce Way, Houston, TX' },
                ].map((f) => (
                  <div key={f.k}>
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{f.label}</label>
                    <input value={(form as any)[f.k]} onChange={(e) => setForm((v) => ({ ...v, [f.k]: e.target.value }))} placeholder={f.ph}
                      className="mt-1 w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50" />
                  </div>
                ))}
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Plan</label>
                  <select value={form.plan} onChange={(e) => setForm((v) => ({ ...v, plan: e.target.value }))} className="mt-1 w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
                    {PLAN_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Logo</label>
                  <label className="mt-1 flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/50 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-white font-semibold truncate">{logoName || 'Upload client logo'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoName(e.target.files?.[0]?.name || '')} />
                  </label>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1"><Palette className="w-3 h-3" /> Brand palette</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {PALETTES.map((p) => (
                      <button key={p.name} onClick={() => { setPalette(p); setCustomHex(''); }} className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-[11px] font-semibold transition-all ${palette.name === p.name && !customHex ? 'bg-amber-500/10 border-amber-500/40 text-white' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-white'}`}>
                        {p.name.split(' ')[0]}
                        <span className="flex gap-1">{[p.primary, p.accent].map((c) => <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input value={customHex} onChange={(e) => setCustomHex(e.target.value)} placeholder="Exact hex #1A73E8" className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50" />
                    <span className="w-7 h-7 rounded-lg border border-white/10" style={{ background: primary }} />
                  </div>
                </div>
                {/* Mini preview */}
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-3 py-2 flex items-center gap-2" style={{ background: palette.secondary }}>
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold text-black" style={{ background: primary }}>{(form.businessName || 'RR').slice(0, 2).toUpperCase()}</span>
                    <span className="text-[10px] font-bold text-white">{form.businessName || 'Client Company'}</span>
                  </div>
                  <div className="p-3 bg-slate-950 space-y-2">
                    <div className="h-1.5 rounded-full w-2/3" style={{ background: primary }} />
                    <div className="h-1.5 rounded-full bg-slate-800 w-full" />
                    <div className="w-full py-1.5 rounded text-[9px] font-bold text-black text-center" style={{ background: primary }}>Book Appointment</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowBuilder(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700">Cancel</button>
              <button onClick={buildTenant} disabled={!form.businessName.trim() || !form.email.trim()} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90">
                <Rocket className="w-4 h-4" /> Provision Tenant Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
