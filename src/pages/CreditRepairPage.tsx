import { useState } from 'react';
import {
  ShieldCheck, Sparkles, TrendingUp, Users, DollarSign, FileText, CheckCircle2,
  ArrowRight, Zap, Scale, Plug, Rocket, AlertTriangle, Clock, Send, Search
} from 'lucide-react';
import { useAppStore } from '../store';

/* ────────────────────────────────────────────────────────────────
   CREDIT REPAIR CENTER — turn-key add-on service for tax offices.
   Easy signup → easy setup → plug in any dispute software (or use
   the built-in engine) → start selling the service same day.
   ──────────────────────────────────────────────────────────────── */

type DisputeStatus = 'draft' | 'sent' | 'investigating' | 'deleted' | 'verified' | 'escalated';

interface CreditClient {
  id: string;
  name: string;
  email: string;
  startScore: number;
  currentScore: number;
  bureausDisputed: string[];
  itemsRemoved: number;
  itemsPending: number;
  monthlyFee: number;
  enrolledAt: string;
  round: number;
}

interface DisputeItem {
  id: string;
  client: string;
  bureau: 'Equifax' | 'Experian' | 'TransUnion';
  item: string;
  basis: string;
  status: DisputeStatus;
  sentAt?: string;
  dueBy?: string;
}

const SOFTWARE_PLUGINS = [
  { id: 'builtin', name: 'Built-In Dispute Engine', desc: 'Metro 2® compliance-based disputes, FCRA §609/§611 letter library, bureau tracking — included free, nothing else to buy.', tag: 'INCLUDED', tagCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', connected: true },
  { id: 'crc', name: 'Credit Repair Cloud', desc: 'Industry-standard CRO software. Sync clients + dispute status via API key.', tag: 'API SYNC', tagCls: 'bg-sky-500/15 text-sky-300 border-sky-500/30', connected: false },
  { id: 'disputefox', name: 'DisputeFox', desc: 'AI dispute automation. Webhook sync for letter status + score updates.', tag: 'WEBHOOK', tagCls: 'bg-violet-500/15 text-violet-300 border-violet-500/30', connected: false },
  { id: 'cdm', name: 'Client Dispute Manager', desc: 'Full-service dispute workflow. CSV + API bridge supported.', tag: 'API SYNC', tagCls: 'bg-sky-500/15 text-sky-300 border-sky-500/30', connected: false },
  { id: 'array', name: 'Array / SmartCredit', desc: 'Live 3-bureau reports + scores pulled directly into client files.', tag: 'REPORT FEED', tagCls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', connected: false },
];

const LETTER_TEMPLATES = [
  { name: 'FCRA §609 Information Request', use: 'Round 1 — demand method of verification for each negative item' },
  { name: 'FCRA §611 Reinvestigation Demand', use: 'Round 2 — dispute accuracy, 30-day investigation clock' },
  { name: 'Metro 2® Compliance Challenge', use: 'Data-field level challenge (DOFD, account status, balance conflicts)' },
  { name: 'Debt Validation (FDCPA §809)', use: 'Collections — force collector to validate or delete' },
  { name: 'Goodwill Deletion Request', use: 'Paid accounts with isolated late payments' },
  { name: 'Identity Theft Block (FCRA §605B)', use: 'Fraudulent accounts with FTC report attached' },
  { name: 'CFPB Complaint Escalation', use: 'Round 3+ — regulator pressure when bureaus stall' },
];

const SEED_CLIENTS: CreditClient[] = [
  { id: 'cc1', name: 'Jasmine Torres', email: 'jasmine.t@gmail.com', startScore: 512, currentScore: 601, bureausDisputed: ['Equifax', 'Experian', 'TransUnion'], itemsRemoved: 6, itemsPending: 3, monthlyFee: 99, enrolledAt: '2026-04-02', round: 3 },
  { id: 'cc2', name: 'Andre Mitchell', email: 'a.mitchell@outlook.com', startScore: 548, currentScore: 622, bureausDisputed: ['Equifax', 'TransUnion'], itemsRemoved: 4, itemsPending: 2, monthlyFee: 99, enrolledAt: '2026-05-11', round: 2 },
  { id: 'cc3', name: 'Keisha Williams', email: 'keisha.w@yahoo.com', startScore: 489, currentScore: 543, bureausDisputed: ['Experian'], itemsRemoved: 2, itemsPending: 5, monthlyFee: 149, enrolledAt: '2026-06-20', round: 2 },
  { id: 'cc4', name: 'Robert Chen', email: 'rchen88@gmail.com', startScore: 577, currentScore: 649, bureausDisputed: ['Equifax', 'Experian', 'TransUnion'], itemsRemoved: 7, itemsPending: 1, monthlyFee: 99, enrolledAt: '2026-03-15', round: 4 },
  { id: 'cc5', name: 'Maria Santos', email: 'msantos@icloud.com', startScore: 601, currentScore: 668, bureausDisputed: ['TransUnion'], itemsRemoved: 3, itemsPending: 0, monthlyFee: 99, enrolledAt: '2026-02-28', round: 5 },
];

const SEED_DISPUTES: DisputeItem[] = [
  { id: 'd1', client: 'Jasmine Torres', bureau: 'Equifax', item: 'Midland Credit — $1,842 collection', basis: 'Metro 2® — DOFD conflict across bureaus', status: 'investigating', sentAt: '2026-08-03', dueBy: '2026-09-02' },
  { id: 'd2', client: 'Jasmine Torres', bureau: 'Experian', item: 'Capital One — 30-day late (Mar 2024)', basis: 'FCRA §611 — inaccurate reporting', status: 'deleted', sentAt: '2026-07-01' },
  { id: 'd3', client: 'Andre Mitchell', bureau: 'TransUnion', item: 'Portfolio Recovery — $967 collection', basis: 'FDCPA §809 — validation demanded', status: 'sent', sentAt: '2026-08-14', dueBy: '2026-09-13' },
  { id: 'd4', client: 'Keisha Williams', bureau: 'Experian', item: 'Repo deficiency — Santander $4,210', basis: 'FCRA §609 — method of verification', status: 'escalated', sentAt: '2026-06-25' },
  { id: 'd5', client: 'Robert Chen', bureau: 'Equifax', item: 'Medical collection — $312', basis: 'NCRA policy — paid medical under $500', status: 'deleted', sentAt: '2026-07-18' },
  { id: 'd6', client: 'Maria Santos', bureau: 'TransUnion', item: 'Charge-off — Synchrony $1,105', basis: 'Metro 2® — status/balance conflict', status: 'verified', sentAt: '2026-06-02' },
];

const STATUS_CLS: Record<DisputeStatus, string> = {
  draft: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  sent: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  investigating: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  deleted: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  verified: 'bg-red-500/15 text-red-300 border-red-500/30',
  escalated: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
};

export default function CreditRepairPage() {
  const { addNotification } = useAppStore();
  const [serviceActive, setServiceActive] = useState(true);
  const [setupStep, setSetupStep] = useState(0);
  const [plugins, setPlugins] = useState(SOFTWARE_PLUGINS);
  const [tab, setTab] = useState<'clients' | 'disputes' | 'letters'>('clients');
  const [search, setSearch] = useState('');

  const mrr = SEED_CLIENTS.reduce((s, c) => s + c.monthlyFee, 0);
  const removed = SEED_CLIENTS.reduce((s, c) => s + c.itemsRemoved, 0);
  const avgGain = Math.round(SEED_CLIENTS.reduce((s, c) => s + (c.currentScore - c.startScore), 0) / SEED_CLIENTS.length);

  const togglePlugin = (id: string) => {
    setPlugins((p) => p.map((pl) => (pl.id === id ? { ...pl, connected: !pl.connected } : pl)));
    const pl = plugins.find((p) => p.id === id);
    addNotification({
      id: `ntf-${Date.now()}`,
      title: pl?.connected ? 'Integration disconnected' : 'Integration connected',
      message: `${pl?.name} ${pl?.connected ? 'disconnected' : 'linked — client + dispute sync active'}. Manage keys in Integrations Hub.`,
      type: 'success', read: false, createdAt: new Date(),
    });
  };

  const activate = () => {
    setServiceActive(true);
    addNotification({
      id: `ntf-${Date.now()}`,
      title: '🎉 Credit Repair service is LIVE',
      message: 'CROA-compliant agreements loaded, dispute engine armed, client portal add-on enabled. Start enrolling clients from any contact record.',
      type: 'success', read: false, createdAt: new Date(),
    });
  };

  const filteredClients = SEED_CLIENTS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-serif">Credit Repair Center</h1>
            <p className="text-slate-400 mt-1 max-w-2xl">Turn-key credit repair as a service — enroll tax clients in minutes, run disputes with the built-in engine or plug in any CRO software, and stack recurring revenue between tax seasons.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"><Scale className="w-3 h-3" /> CROA + FCRA Compliant Workflow</span>
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30"><Sparkles className="w-3 h-3" /> AI Letter Generation</span>
            </div>
          </div>
        </div>
        {!serviceActive && (
          <button onClick={activate} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90">
            <Rocket className="w-4 h-4" /> Activate Service
          </button>
        )}
      </div>

      {/* 3-step easy setup */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Easy Setup — offer credit repair in 3 steps</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: 1, t: 'Sign the service agreement', d: 'CROA-compliant client agreements, disclosures, and cancellation notices are pre-loaded and e-sign ready. Pick your pricing: $99–$199/mo or pay-per-deletion.', icon: FileText },
            { n: 2, t: 'Plug in your software (or use ours)', d: 'Use the built-in Metro 2® dispute engine free — or connect Credit Repair Cloud, DisputeFox, Client Dispute Manager, or a report feed below. Any software, one click.', icon: Plug },
            { n: 3, t: 'Enroll clients & go live', d: 'One-click enrollment from any contact record. Client portal add-on shows score progress. AI drafts every dispute letter for review.', icon: Rocket },
          ].map((s) => (
            <button key={s.n} onClick={() => setSetupStep(s.n - 1)} className={`text-left p-4 rounded-xl border transition-all ${setupStep === s.n - 1 ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center">{s.n}</span>
                <s.icon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">{s.t}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{s.d}</p>
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Enrolled Clients', value: String(SEED_CLIENTS.length), icon: Users, cls: 'text-sky-400' },
          { label: 'Monthly Recurring', value: `$${mrr.toLocaleString()}`, icon: DollarSign, cls: 'text-emerald-400' },
          { label: 'Items Deleted', value: String(removed), icon: CheckCircle2, cls: 'text-emerald-400' },
          { label: 'Avg Score Gain', value: `+${avgGain} pts`, icon: TrendingUp, cls: 'text-amber-400' },
          { label: 'Active Disputes', value: String(SEED_DISPUTES.filter((d) => ['sent', 'investigating', 'escalated'].includes(d.status)).length), icon: Clock, cls: 'text-violet-400' },
        ].map((k) => (
          <div key={k.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <k.icon className={`w-5 h-5 ${k.cls} mb-2`} />
            <div className="text-2xl font-bold text-white">{k.value}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Software plugins */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2"><Plug className="w-4 h-4 text-sky-400" /> Software Plugins — connect anything</h2>
        <p className="text-xs text-slate-500 mb-4">Bring the dispute software you already use, or run everything on the built-in engine. Keys are stored in the encrypted Integrations Hub vault.</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {plugins.map((p) => (
            <div key={p.id} className={`p-4 rounded-xl border ${p.connected ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-white">{p.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${p.tagCls}`}>{p.tag}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{p.desc}</p>
              <button onClick={() => p.id !== 'builtin' && togglePlugin(p.id)} disabled={p.id === 'builtin'}
                className={`w-full text-xs font-semibold py-2 rounded-lg border transition-colors ${p.connected ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-700/40 text-slate-300 border-slate-600/50 hover:border-sky-500/40 hover:text-sky-300'}`}>
                {p.id === 'builtin' ? '✓ Always On' : p.connected ? '✓ Connected — click to disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs: clients / disputes / letters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4">
          <div className="flex">
            {([['clients', 'Client Roster'], ['disputes', 'Dispute Tracker'], ['letters', 'Letter Library']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === id ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400 hover:text-white'}`}>{label}</button>
            ))}
          </div>
          {tab === 'clients' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find client…" className="bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-44" />
            </div>
          )}
        </div>

        {tab === 'clients' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-4 py-3">Client</th><th className="px-4 py-3">Score Journey</th><th className="px-4 py-3">Bureaus</th><th className="px-4 py-3">Deleted</th><th className="px-4 py-3">Pending</th><th className="px-4 py-3">Round</th><th className="px-4 py-3">Monthly</th>
              </tr></thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3"><div className="font-semibold text-white">{c.name}</div><div className="text-xs text-slate-500">{c.email}</div></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-slate-400">{c.startScore}</span><ArrowRight className="w-3 h-3 text-slate-600" /><span className="text-emerald-300 font-bold">{c.currentScore}</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">+{c.currentScore - c.startScore}</span></div></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{c.bureausDisputed.map((b) => b.slice(0, 2).toUpperCase()).join(' · ')}</td>
                    <td className="px-4 py-3 text-emerald-300 font-semibold">{c.itemsRemoved}</td>
                    <td className="px-4 py-3 text-amber-300">{c.itemsPending}</td>
                    <td className="px-4 py-3 text-slate-300">R{c.round}</td>
                    <td className="px-4 py-3 text-white font-semibold">${c.monthlyFee}/mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'disputes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-4 py-3">Client</th><th className="px-4 py-3">Bureau</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Legal Basis</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">30-Day Clock</th>
              </tr></thead>
              <tbody>
                {SEED_DISPUTES.map((d) => (
                  <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-semibold text-white">{d.client}</td>
                    <td className="px-4 py-3 text-slate-300">{d.bureau}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[220px]">{d.item}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[220px]">{d.basis}</td>
                    <td className="px-4 py-3"><span className={`text-[11px] px-2 py-1 rounded-full border ${STATUS_CLS[d.status]}`}>{d.status.toUpperCase()}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{d.dueBy ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" /> due {d.dueBy}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'letters' && (
          <div className="p-4 grid md:grid-cols-2 gap-3">
            {LETTER_TEMPLATES.map((l) => (
              <div key={l.name} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400" /> {l.name}</div>
                  <p className="text-xs text-slate-400 mt-1">{l.use}</p>
                </div>
                <button onClick={() => addNotification({ id: `ntf-${Date.now()}`, title: 'AI letter drafted', message: `"${l.name}" generated with client + item merge fields. Review before certified-mail send.`, type: 'success', read: false, createdAt: new Date() })}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1.5">
                  <Send className="w-3 h-3" /> AI Draft
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compliance footer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed"><span className="text-amber-300 font-semibold">Compliance built in:</span> CROA prohibits charging before services are performed — the billing engine enforces work-first invoicing. State CSO bond/registration requirements are surfaced per client state. §7216 consent is captured before any tax data is used for credit repair marketing.</p>
      </div>
    </div>
  );
}
