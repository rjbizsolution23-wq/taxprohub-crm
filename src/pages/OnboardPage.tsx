import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, Building2, Palette, CreditCard, CheckCircle2, Sparkles, Upload,
  ArrowRight, ArrowLeft, ShieldCheck, Crown, Zap
} from 'lucide-react';
import { useAppStore } from '../store';
import type { SubAccount } from '../types';

/* ────────────────────────────────────────────────────────────────
   SELF-SERVE ONBOARDING — a tax company signs up, picks a plan,
   pays, drops in their logo/colors/contact info, and the platform
   intelligently provisions their entire branded tenant on the spot.
   ──────────────────────────────────────────────────────────────── */

const PLANS = [
  { id: 'launch', name: 'Launch', price: 199, per: '/mo', tag: 'Solo & new offices', features: ['1 location tenant', 'Full CRM + pipelines + drips', 'Document OCR + smart filing', 'Bank products desk', 'Client portal + e-sign', 'Migration Center import'] },
  { id: 'growth', name: 'Growth', price: 399, per: '/mo', tag: 'Multi-preparer offices', popular: true, features: ['Everything in Launch', 'Up to 10 preparers + payouts', 'Recruiting network + downline', 'Credit repair service module', 'Lead Magnets Studio', 'API access + webhooks'] },
  { id: 'bureau', name: 'Service Bureau', price: 899, per: '/mo', tag: 'Bureaus & franchisors', features: ['Everything in Growth', 'Unlimited sub-tenants for your offices', 'Per-return override engine', 'White-label branding end-to-end', 'Master admin Tenant Studio', 'Priority migration concierge'] },
];

const PRESET_PALETTES = [
  { name: 'Gold Authority', primary: '#D4AF37', secondary: '#0F172A', accent: '#F59E0B' },
  { name: 'Trust Blue', primary: '#2563EB', secondary: '#0F172A', accent: '#38BDF8' },
  { name: 'Money Green', primary: '#059669', secondary: '#022C22', accent: '#34D399' },
  { name: 'Bold Crimson', primary: '#DC2626', secondary: '#1C1917', accent: '#F87171' },
  { name: 'Royal Purple', primary: '#7C3AED', secondary: '#1E1B4B', accent: '#A78BFA' },
];

export default function OnboardPage() {
  const navigate = useNavigate();
  const { addSubAccount, setCurrentSubAccount, addNotification } = useAppStore();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState(PLANS[1]);
  const [biz, setBiz] = useState({ businessName: '', ownerName: '', email: '', phone: '', address: '' });
  const [palette, setPalette] = useState(PRESET_PALETTES[0]);
  const [customPrimary, setCustomPrimary] = useState('');
  const [logoName, setLogoName] = useState('');
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' });
  const [provisioned, setProvisioned] = useState<SubAccount | null>(null);

  const steps = ['Choose Plan', 'Your Company', 'Brand It', 'Payment', 'Tenant Live'];
  const primary = customPrimary || palette.primary;

  const canNext = () => {
    if (step === 1) return biz.businessName.trim() && biz.email.trim() && biz.phone.trim();
    if (step === 3) return card.number.replace(/\s/g, '').length >= 15 && card.exp && card.cvc;
    return true;
  };

  const provision = () => {
    const tenant: SubAccount = {
      id: `sa-${Date.now()}`,
      name: biz.businessName,
      businessName: biz.businessName,
      businessAddress: biz.address || '—',
      email: biz.email,
      phone: biz.phone,
      logo: logoName || undefined,
      colors: { primary, secondary: palette.secondary, accent: palette.accent, background: '#0B1120', text: '#F8FAFC' },
      domain: `${biz.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.taxprohubuniversity.com`,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addSubAccount(tenant);
    setProvisioned(tenant);
    addNotification({
      id: `ntf-${Date.now()}`,
      title: `🚀 ${biz.businessName} is LIVE`,
      message: `Tenant provisioned on the ${plan.name} plan — branded portal, pipelines, drips, bank products & client portal all deployed at ${tenant.domain}.`,
      type: 'success', read: false, createdAt: new Date(),
    });
    setStep(4);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Intelligent tenant provisioning — live in under 3 minutes
        </div>
        <h1 className="text-3xl font-bold text-white font-serif">Launch Your Branded Tax Platform</h1>
        <p className="text-slate-400 mt-2 max-w-xl mx-auto">Pick a plan, pay, add your brand — and the platform builds your entire tenant automatically: branded portal, pipelines, drip campaigns, bank products desk, everything.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${i === step ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' : i < step ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800/40 text-slate-500 border-slate-700/50'}`}>
              {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full bg-current/20 text-[10px] flex items-center justify-center">{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      {/* STEP 0 — plan */}
      {step === 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <button key={p.id} onClick={() => setPlan(p)} className={`relative text-left p-6 rounded-2xl border transition-all ${plan.id === p.id ? 'bg-amber-500/5 border-amber-500/50 ring-1 ring-amber-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'}`}>
              {p.popular && <span className="absolute -top-2.5 left-6 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black">MOST POPULAR</span>}
              <div className="flex items-center gap-2">{p.id === 'bureau' ? <Crown className="w-5 h-5 text-amber-400" /> : <Rocket className="w-5 h-5 text-amber-400" />}<span className="text-lg font-bold text-white">{p.name}</span></div>
              <div className="mt-2"><span className="text-3xl font-bold text-white">${p.price}</span><span className="text-slate-500 text-sm">{p.per}</span></div>
              <div className="text-xs text-slate-500 mt-0.5">{p.tag}</div>
              <ul className="mt-4 space-y-1.5">
                {p.features.map((f) => <li key={f} className="flex items-start gap-2 text-xs text-slate-300"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {f}</li>)}
              </ul>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1 — company */}
      {step === 1 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Building2 className="w-4 h-4 text-amber-400" /> Tell us about your company</h2>
          {[
            { k: 'businessName', label: 'Company Name *', ph: 'Premier Tax Solutions LLC' },
            { k: 'ownerName', label: 'Owner Name', ph: 'Jane Rodriguez' },
            { k: 'email', label: 'Business Email *', ph: 'jane@premiertax.com' },
            { k: 'phone', label: 'Business Phone *', ph: '(555) 123-4567' },
            { k: 'address', label: 'Business Address', ph: '450 Main St, Suite 200, Atlanta, GA' },
          ].map((f) => (
            <div key={f.k}>
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{f.label}</label>
              <input value={(biz as any)[f.k]} onChange={(e) => setBiz((b) => ({ ...b, [f.k]: e.target.value }))} placeholder={f.ph}
                className="mt-1 w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50" />
            </div>
          ))}
          {biz.businessName && (
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-400">
              <span className="text-emerald-300 font-semibold">Your branded domain:</span> {biz.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.taxprohubuniversity.com <span className="text-slate-500">(custom domains supported after launch)</span>
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — brand */}
      {step === 2 && (
        <div className="grid md:grid-cols-[1fr_360px] gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Palette className="w-4 h-4 text-amber-400" /> Make it yours</h2>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Logo</label>
              <label className="mt-1 flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/50 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-slate-500" />
                <div className="text-xs"><span className="text-white font-semibold">{logoName || 'Upload your logo'}</span><div className="text-slate-500">PNG/SVG · auto-placed on portal, invoices, lead magnets, emails</div></div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoName(e.target.files?.[0]?.name || '')} />
              </label>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Brand palette</label>
              <div className="grid grid-cols-1 gap-2 mt-1">
                {PRESET_PALETTES.map((p) => (
                  <button key={p.name} onClick={() => { setPalette(p); setCustomPrimary(''); }} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${palette.name === p.name && !customPrimary ? 'bg-amber-500/5 border-amber-500/40' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`}>
                    <span className="text-xs font-semibold text-white">{p.name}</span>
                    <span className="flex gap-1.5">{[p.primary, p.secondary, p.accent].map((c) => <span key={c} className="w-5 h-5 rounded-full border border-white/10" style={{ background: c }} />)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Or exact brand color (hex)</label>
              <div className="flex items-center gap-2 mt-1">
                <input value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} placeholder="#D4AF37" className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50" />
                <span className="w-9 h-9 rounded-lg border border-white/10" style={{ background: primary }} />
              </div>
            </div>
          </div>
          {/* Live preview */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden h-fit">
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: palette.secondary }}>
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-black" style={{ background: primary }}>{(biz.businessName || 'PT').slice(0, 2).toUpperCase()}</span>
              <span className="text-xs font-bold text-white">{biz.businessName || 'Your Company'}</span>
            </div>
            <div className="p-4 bg-slate-950 space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Live portal preview</div>
              <div className="h-2.5 rounded-full w-3/4" style={{ background: primary }} />
              <div className="h-2 rounded-full bg-slate-800 w-full" />
              <div className="h-2 rounded-full bg-slate-800 w-5/6" />
              <button className="w-full py-2 rounded-lg text-xs font-bold text-black" style={{ background: primary }}>Book My Tax Appointment</button>
              <div className="flex gap-2">
                <div className="flex-1 h-12 rounded-lg border border-slate-800 flex items-center justify-center text-[10px]" style={{ color: palette.accent }}>Refund Tracker</div>
                <div className="flex-1 h-12 rounded-lg border border-slate-800 flex items-center justify-center text-[10px]" style={{ color: palette.accent }}>Upload Docs</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — payment */}
      {step === 3 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-400" /> Payment</h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div><div className="text-sm font-bold text-white">{plan.name} Plan</div><div className="text-xs text-slate-500">{plan.tag} · cancel anytime</div></div>
            <div className="text-right"><div className="text-2xl font-bold text-white">${plan.price}</div><div className="text-xs text-slate-500">per month</div></div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Card number</label>
            <input value={card.number} onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))} placeholder="4242 4242 4242 4242" className="mt-1 w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Expiry</label>
              <input value={card.exp} onChange={(e) => setCard((c) => ({ ...c, exp: e.target.value }))} placeholder="12/28" className="mt-1 w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50" /></div>
            <div><label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">CVC</label>
              <input value={card.cvc} onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value }))} placeholder="123" className="mt-1 w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50" /></div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400">Processed by Stripe. The instant payment clears, our provisioning engine builds your tenant: branded portal, pipelines, 8 drip sequences, bank products desk, client portal, e-sign — all wearing your brand.</p>
          </div>
        </div>
      )}

      {/* STEP 4 — live */}
      {step === 4 && provisioned && (
        <div className="max-w-xl mx-auto text-center bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white font-serif">{provisioned.businessName} is live! 🎉</h2>
          <p className="text-slate-400 text-sm mt-2">Your entire branded platform was provisioned automatically:</p>
          <div className="grid grid-cols-2 gap-2 mt-5 text-left">
            {['Branded client portal + e-sign', 'CRM, pipelines & calendars', '8 drip sequences pre-loaded', 'Bank products desk armed', 'Lead magnets auto-branded', 'Migration Center ready for your old data'].map((f) => (
              <div key={f} className="flex items-start gap-2 text-xs text-slate-300 p-2.5 rounded-lg bg-slate-800/40"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {f}</div>
            ))}
          </div>
          <div className="mt-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-amber-300 font-mono">{provisioned.domain}</div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setCurrentSubAccount(provisioned); navigate('/dashboard'); }} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90"><Zap className="w-4 h-4" /> Enter My Platform</button>
            <button onClick={() => navigate('/migration')} className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-sm hover:bg-slate-700">Import My Old Data</button>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      {step < 4 && (
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="px-5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-sm font-semibold flex items-center gap-2 disabled:opacity-30 hover:bg-slate-700/60"><ArrowLeft className="w-4 h-4" /> Back</button>
          <button onClick={() => (step === 3 ? provision() : setStep((s) => s + 1))} disabled={!canNext()} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm flex items-center gap-2 disabled:opacity-40 hover:opacity-90">
            {step === 3 ? <>Pay ${plan.price} &amp; Provision My Tenant <Rocket className="w-4 h-4" /></> : <>Continue <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      )}
    </div>
  );
}
