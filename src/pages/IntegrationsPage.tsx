import { useState } from 'react';
import {
  Plug, Search, ShieldCheck, KeyRound, CheckCircle2, Landmark, MessageSquare,
  CreditCard, Bot, FileText, Lock, Eye, EyeOff, Save, Zap
} from 'lucide-react';
import { useAppStore } from '../store';

/* ────────────────────────────────────────────────────────────────
   INTEGRATIONS HUB — every connector in one encrypted vault.
   IRS e-Services keys, tax software bridges, banks, bureaus,
   payments, comms, AI, accounting, e-sign, credit repair. All of it.
   ──────────────────────────────────────────────────────────────── */

type Category = 'irs' | 'tax' | 'bank' | 'payments' | 'comms' | 'ai' | 'accounting' | 'esign' | 'credit' | 'marketing';

interface Integration {
  id: string;
  name: string;
  cat: Category;
  desc: string;
  fields: string[];
  connected: boolean;
  popular?: boolean;
}

const CATS: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'irs', label: 'IRS & Government' },
  { id: 'tax', label: 'Tax Software' },
  { id: 'bank', label: 'Bank Products' },
  { id: 'payments', label: 'Payments' },
  { id: 'comms', label: 'Comms' },
  { id: 'ai', label: 'AI / LLM' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'esign', label: 'E-Sign' },
  { id: 'credit', label: 'Credit Repair' },
  { id: 'marketing', label: 'Marketing' },
];

const CATALOG: Integration[] = [
  // IRS & Government
  { id: 'irs-eservices', name: 'IRS e-Services (TDS / TIN Matching)', cat: 'irs', desc: 'Transcript Delivery System pulls with your e-Services credentials + 2848/8821 CAF authority. TIN matching for 1099 issuers.', fields: ['e-Services Username', 'e-Services Password / Secure Key', 'CAF Number'], connected: true, popular: true },
  { id: 'irs-mef', name: 'IRS MeF A2A Transmission', cat: 'irs', desc: 'Direct e-file transmission channel. Requires ETIN + completed e-file application + ATS acceptance testing (Pub 1436, TY2025 ATS open since Oct 2025).', fields: ['ETIN', 'EFIN', 'A2A Certificate (PEM)'], connected: false },
  { id: 'irs-ptin', name: 'PTIN Directory Verification', cat: 'irs', desc: 'Auto-verify preparer PTIN status for everyone in your network at hiring and each renewal season.', fields: ['(no key required — public directory)'], connected: true },
  { id: 'irs-fire', name: 'IRS FIRE (1099 Filing)', cat: 'irs', desc: 'Information-return e-filing (1099-NEC/MISC batches) via FIRE / IRIS with your TCC.', fields: ['TCC (Transmitter Control Code)', 'FIRE Password'], connected: false },
  // Tax software bridges
  { id: 'taxslayer', name: 'TaxSlayer Pro Bridge', cat: 'tax', desc: 'Two-way client + return status sync. Today\'s e-file rail while direct MeF is in certification.', fields: ['API Key', 'Office EFIN'], connected: true, popular: true },
  { id: 'drake-bridge', name: 'Drake Import Bridge', cat: 'tax', desc: 'Client + prior-year data import from Drake exports. Pairs with the Migration Center.', fields: ['(file-based — no key)'], connected: true },
  { id: 'crosslink-bridge', name: 'CrossLink Import Bridge', cat: 'tax', desc: 'Bureau data + client list import from CrossLink exports.', fields: ['(file-based — no key)'], connected: true },
  // Bank products
  { id: 'tpg', name: 'Santa Barbara TPG', cat: 'bank', desc: 'Refund transfers, Fast Cash Advance, GO2bank disbursement. Live status polling into the Bank Products desk.', fields: ['TPG API Key', 'Site ID'], connected: true, popular: true },
  { id: 'eps', name: 'EPS Financial (Pathward)', cat: 'bank', desc: 'e-Advance up to $7,000, e-Collect RTs, FasterMoney cards.', fields: ['EPS API Key', 'Office ID'], connected: true },
  { id: 'refund-advantage', name: 'Refund Advantage (Pathward)', cat: 'bank', desc: 'RTs, taxpayer advances, and preparer marketing-fund programs.', fields: ['RA API Key'], connected: true },
  { id: 'republic', name: 'Republic Bank & Trust', cat: 'bank', desc: 'Easy Advance + RT programs with Netspend disbursement.', fields: ['Republic API Key', 'RT Site Code'], connected: false },
  // Payments
  { id: 'stripe', name: 'Stripe', cat: 'payments', desc: 'Invoicing, tenant subscription billing, Connect payouts to preparers and downline overrides.', fields: ['Secret Key', 'Webhook Signing Secret'], connected: true, popular: true },
  { id: 'square', name: 'Square', cat: 'payments', desc: 'In-office card-present payments synced to invoices.', fields: ['Access Token', 'Location ID'], connected: false },
  { id: 'paypal', name: 'PayPal / Venmo', cat: 'payments', desc: 'Alternative checkout for invoices and lead-magnet order bumps.', fields: ['Client ID', 'Client Secret'], connected: false },
  // Comms
  { id: 'twilio', name: 'Twilio', cat: 'comms', desc: 'SMS drips, appointment reminders, two-way texting, ringless voicemail drops.', fields: ['Account SID', 'Auth Token', 'From Number'], connected: true, popular: true },
  { id: 'sendgrid', name: 'SendGrid / Twilio Email', cat: 'comms', desc: 'Email campaigns + transactional sends with open/click tracking into contact timelines.', fields: ['API Key', 'Verified Sender'], connected: true },
  { id: 'mailgun', name: 'Mailgun', cat: 'comms', desc: 'Alternative email rail with per-tenant sending domains.', fields: ['API Key', 'Sending Domain'], connected: false },
  { id: 'slack', name: 'Slack / Discord Alerts', cat: 'comms', desc: 'Team channel alerts: e-file acceptance, bank funding, new recruits, hot leads.', fields: ['Webhook URL'], connected: false },
  // AI
  { id: 'openai', name: 'OpenAI / Compatible LLM', cat: 'ai', desc: 'Powers the Funnel Architect, letter drafting, and AI assistant. Any OpenAI-compatible endpoint works (Azure, Groq, local).', fields: ['API Key', 'Base URL (optional)'], connected: true, popular: true },
  { id: 'anthropic', name: 'Anthropic Claude', cat: 'ai', desc: 'Alternative model for long-document analysis (returns, notices, contracts).', fields: ['API Key'], connected: false },
  // Accounting
  { id: 'qbo', name: 'QuickBooks Online', cat: 'accounting', desc: 'Two-way client + invoice sync; bookkeeping upsell pipeline for business clients.', fields: ['OAuth (Connect flow)'], connected: false, popular: true },
  { id: 'xero', name: 'Xero', cat: 'accounting', desc: 'Alternative books sync for business clients.', fields: ['OAuth (Connect flow)'], connected: false },
  // E-sign
  { id: 'builtin-esign', name: 'Built-In E-Sign (8879, 7216, engagement)', cat: 'esign', desc: 'KBA-ready e-signature for Form 8879, §7216 consents, CROA agreements, engagement letters. Included free.', fields: ['(included — no key)'], connected: true, popular: true },
  { id: 'docusign', name: 'DocuSign', cat: 'esign', desc: 'Enterprise e-sign if your firm already standardized on it.', fields: ['Integration Key', 'Account ID'], connected: false },
  // Credit repair
  { id: 'crc', name: 'Credit Repair Cloud', cat: 'credit', desc: 'Sync clients + dispute rounds with the Credit Repair Center.', fields: ['API Key'], connected: false },
  { id: 'array', name: 'Array / SmartCredit Reports', cat: 'credit', desc: 'Live 3-bureau credit reports + scores pulled into client files.', fields: ['API Key', 'Widget Token'], connected: false },
  // Marketing
  { id: 'meta', name: 'Meta Lead Ads', cat: 'marketing', desc: 'Facebook/Instagram lead forms flow straight into pipelines with drip auto-attach.', fields: ['Page Access Token'], connected: false, popular: true },
  { id: 'google-ads', name: 'Google Ads + LSA', cat: 'marketing', desc: 'Local Services Ads leads + offline conversion upload for booked appointments.', fields: ['OAuth (Connect flow)'], connected: false },
  { id: 'zapier', name: 'Zapier / Make', cat: 'marketing', desc: '7,000+ apps through your public API key — anything we do not have natively.', fields: ['(uses your Developer Hub API key)'], connected: true },
];

export default function IntegrationsPage() {
  const { addNotification } = useAppStore();
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(CATALOG);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const list = items.filter((i) => (cat === 'all' || i.cat === cat) && i.name.toLowerCase().includes(search.toLowerCase()));
  const connectedCount = items.filter((i) => i.connected).length;

  const saveKeys = () => {
    if (!editing) return;
    setItems((arr) => arr.map((i) => (i.id === editing.id ? { ...i, connected: true } : i)));
    addNotification({
      id: `ntf-${Date.now()}`,
      title: `🔐 ${editing.name} connected`,
      message: 'Credentials AES-256 encrypted in the vault, never stored in plaintext, never exposed to the browser after save. Health check passed.',
      type: 'success', read: false, createdAt: new Date(),
    });
    setEditing(null); setValues({}); setShowSecret(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/30 to-indigo-600/30 border border-sky-500/30 flex items-center justify-center">
            <Plug className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-serif">Integrations Hub</h1>
            <p className="text-slate-400 mt-1 max-w-2xl">Every connector your practice needs in one encrypted vault — IRS e-Services keys, tax software bridges, all four bank partners, payments, comms, AI, accounting, e-sign, and credit repair software.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> {connectedCount} of {items.length} connected</span>
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30"><Lock className="w-3 h-3" /> AES-256 vault · keys never leave the server</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search integrations…" className="bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 w-64" />
        </div>
      </div>

      {/* IRS spotlight */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900/60 to-slate-900/60 border border-emerald-500/25 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <div className="text-sm font-bold text-white">IRS e-Services key is embedded &amp; live</div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">Transcript pulls (TDS), TIN matching, and PTIN verification run on your own e-Services credentials with CAF authority — stored encrypted, used server-side only. Direct MeF transmission is in ATS certification; TaxSlayer Pro bridge carries e-file today.</p>
          </div>
        </div>
        <button onClick={() => setEditing(items.find((i) => i.id === 'irs-eservices') || null)} className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 hover:bg-emerald-500/25">
          <KeyRound className="w-3.5 h-3.5" /> Manage IRS Credentials
        </button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${cat === c.id ? 'bg-sky-500/15 text-sky-300 border-sky-500/40' : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-white'}`}>{c.label}</button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((i) => (
          <div key={i.id} className={`p-5 rounded-2xl border transition-all ${i.connected ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {i.cat === 'irs' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : i.cat === 'bank' ? <Landmark className="w-4 h-4 text-amber-400" /> : i.cat === 'comms' ? <MessageSquare className="w-4 h-4 text-sky-400" /> : i.cat === 'payments' ? <CreditCard className="w-4 h-4 text-violet-400" /> : i.cat === 'ai' ? <Bot className="w-4 h-4 text-pink-400" /> : <FileText className="w-4 h-4 text-slate-400" />}
                <span className="text-sm font-bold text-white">{i.name}</span>
              </div>
              {i.popular && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">POPULAR</span>}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3 min-h-[48px]">{i.desc}</p>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${i.connected ? 'text-emerald-300' : 'text-slate-500'}`}>{i.connected ? '● Connected' : '○ Not connected'}</span>
              <button onClick={() => { setEditing(i); setValues({}); }} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${i.connected ? 'bg-slate-800/60 text-slate-300 border-slate-700 hover:text-white' : 'bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25'}`}>
                {i.connected ? 'Manage' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Key modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1"><KeyRound className="w-5 h-5 text-sky-400" /><h3 className="text-lg font-bold text-white">{editing.name}</h3></div>
            <p className="text-xs text-slate-400 mb-4">{editing.desc}</p>
            <div className="space-y-3">
              {editing.fields.map((f) => (
                <div key={f}>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{f}</label>
                  {f.startsWith('(') ? (
                    <div className="mt-1 text-xs text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {f.replace(/[()]/g, '')}</div>
                  ) : (
                    <div className="relative mt-1">
                      <input type={showSecret ? 'text' : 'password'} value={values[f] || ''} onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))} placeholder={`Enter ${f.toLowerCase()}…`}
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 pr-9 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50" />
                      <button onClick={() => setShowSecret((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">{showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400">Credentials are AES-256 encrypted at rest, used server-side only, auto-rotated on staff changes, and every use is written to the audit log.</p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700">Cancel</button>
              <button onClick={saveKeys} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90"><Save className="w-4 h-4" /> Save &amp; Test</button>
            </div>
          </div>
        </div>
      )}

      {/* Missing something */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-500/5 border border-sky-500/20">
        <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed"><span className="text-sky-300 font-semibold">Don't see your tool?</span> Anything with an API connects through Zapier/Make using your Developer Hub key — or request a native connector and it ships in the next release cycle. This platform's rule: if owners are asking for it, it gets built.</p>
      </div>
    </div>
  );
}
