import { useState } from 'react';
import {
  UserPlus, Copy, Check, DollarSign, TrendingUp, Award, Shield,
  AlertTriangle, FileText, Clock, CheckCircle2, Send, Scale,
  CreditCard, ArrowUpRight, Gift, Link2, Mail
} from 'lucide-react';
import { useAppStore } from '../../store';

/* ============================================================
   REFERRALS TAB — full referral program engine
   ============================================================ */

interface Referrer {
  id: string;
  name: string;
  email: string;
  code: string;
  referred: number;
  converted: number;
  earned: number;
  pending: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

const SEED_REFERRERS: Referrer[] = [
  { id: 'r1', name: 'Sarah Jenkins', email: 'sjenkins@gmail.com', code: 'SARAH-TAX25', referred: 14, converted: 9, earned: 450, pending: 100, tier: 'Gold' },
  { id: 'r2', name: 'Michael Brown', email: 'mbrown@startup.io', code: 'MIKE-SCORP', referred: 8, converted: 5, earned: 250, pending: 50, tier: 'Silver' },
  { id: 'r3', name: 'Emily Davis', email: 'emily.davis@consulting.com', code: 'EMILY-1099', referred: 22, converted: 16, earned: 800, pending: 150, tier: 'Platinum' },
  { id: 'r4', name: 'Robert Wilson', email: 'rwilson@finance.com', code: 'RWILSON-VIP', referred: 4, converted: 2, earned: 100, pending: 0, tier: 'Bronze' },
];

const TIER_RULES = [
  { tier: 'Bronze', range: '1–4 conversions', reward: '$50 / filed return', perk: 'Referral dashboard access', color: 'text-amber-700 bg-amber-900/20 border-amber-800/40' },
  { tier: 'Silver', range: '5–9 conversions', reward: '$50 + $25 season bonus', perk: 'Priority appointment slots', color: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
  { tier: 'Gold', range: '10–15 conversions', reward: '$50 + free personal return', perk: 'Free 1040 prep for themselves', color: 'text-[#D4AF37] bg-amber-500/10 border-amber-500/30' },
  { tier: 'Platinum', range: '16+ conversions', reward: '$50 + rev-share 5%', perk: 'Ambassador status + rev share', color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' },
];

export function ReferralsTab() {
  const { addNotification } = useAppStore();
  const [referrers, setReferrers] = useState<Referrer[]>(SEED_REFERRERS);
  const [copied, setCopied] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const totals = referrers.reduce(
    (a, r) => ({ referred: a.referred + r.referred, converted: a.converted + r.converted, earned: a.earned + r.earned, pending: a.pending + r.pending }),
    { referred: 0, converted: 0, earned: 0, pending: 0 }
  );

  const copyLink = (code: string) => {
    const url = `https://rjbizsolutions.tax/r/${code}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const enroll = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const code = `${newName.split(' ')[0].toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setReferrers(prev => [{ id: `r-${Date.now()}`, name: newName.trim(), email: newEmail.trim(), code, referred: 0, converted: 0, earned: 0, pending: 0, tier: 'Bronze' }, ...prev]);
    addNotification({
      id: `notif-${Date.now()}`, title: 'Referral Partner Enrolled',
      message: `${newName.trim()} enrolled with code ${code}. Welcome drip "Referral Engine" starts now.`,
      type: 'success', read: false, createdAt: new Date(),
    });
    setNewName(''); setNewEmail('');
  };

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals', value: totals.referred, icon: UserPlus, color: 'text-teal-400' },
          { label: 'Converted to Clients', value: totals.converted, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Rewards Paid', value: `$${totals.earned.toLocaleString()}`, icon: DollarSign, color: 'text-[#D4AF37]' },
          { label: 'Rewards Pending', value: `$${totals.pending.toLocaleString()}`, icon: Clock, color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
            <k.icon className={`h-5 w-5 ${k.color} mb-2`} />
            <div className="text-2xl font-black text-white">{k.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Leaderboard */}
        <div className="xl:col-span-2 bg-neutral-950/80 border border-amber-500/15 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-neutral-900 flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2"><Award className="h-4 w-4 text-[#D4AF37]" /> Referral Partner Leaderboard</h3>
            <span className="text-[10px] text-slate-500 font-mono">Payouts accrue via /api/payouts/accrue → Stripe Connect</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-950 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
                  <th className="px-5 py-3">Partner</th>
                  <th className="px-5 py-3">Code / Link</th>
                  <th className="px-5 py-3">Referred</th>
                  <th className="px-5 py-3">Converted</th>
                  <th className="px-5 py-3">Earned</th>
                  <th className="px-5 py-3">Tier</th>
                </tr>
              </thead>
              <tbody>
                {referrers.map(r => {
                  const tierRule = TIER_RULES.find(t => t.tier === r.tier)!;
                  return (
                    <tr key={r.id} className="border-b border-neutral-900/60 hover:bg-neutral-900/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-bold text-white">{r.name}</div>
                        <div className="text-[10px] text-slate-500">{r.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => copyLink(r.code)} className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[10px] font-mono text-teal-300 hover:border-teal-500/40 transition-all">
                          {copied === r.code ? <Check className="h-3 w-3 text-emerald-400" /> : <Link2 className="h-3 w-3" />}
                          {r.code}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-300">{r.referred}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-emerald-400">{r.converted}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#D4AF37]">${r.earned}{r.pending > 0 && <span className="text-amber-500/70 font-semibold"> (+${r.pending} pending)</span>}</td>
                      <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black ${tierRule.color}`}>{r.tier}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enroll + tiers */}
        <div className="space-y-6">
          <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4"><Gift className="h-4 w-4 text-teal-400" /> Enroll New Partner</h3>
            <div className="space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Partner full name" className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/30" />
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="partner@email.com" type="email" className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/30" />
              <button onClick={enroll} className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-500 text-black font-black rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5">
                <UserPlus className="h-4 w-4" /> Generate Code + Start Referral Drip
              </button>
              <p className="text-[10px] text-slate-500 leading-relaxed">Enrolling installs the partner into the <span className="text-teal-400 font-bold">Referral Champion drip</span> (5 touches / 30 days) and issues a trackable link routed through <span className="font-mono">/api/referrals/link</span>.</p>
            </div>
          </div>

          <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4"><Award className="h-4 w-4 text-[#D4AF37]" /> Reward Tiers</h3>
            <div className="space-y-2.5">
              {TIER_RULES.map(t => (
                <div key={t.tier} className={`rounded-xl border p-3 ${t.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{t.tier}</span>
                    <span className="text-[10px] font-mono opacity-80">{t.range}</span>
                  </div>
                  <div className="text-[10px] mt-1 opacity-90">{t.reward} • {t.perk}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CREDIT CLIENTS TAB — credit repair client roster
   ============================================================ */

interface CreditClient {
  id: string;
  name: string;
  startScore: { eq: number; ex: number; tu: number };
  currentScore: { eq: number; ex: number; tu: number };
  itemsDisputed: number;
  itemsRemoved: number;
  round: number;
  plan: string;
  monthly: number;
  status: 'active' | 'paused' | 'graduated';
}

const CREDIT_CLIENTS: CreditClient[] = [
  { id: 'c1', name: 'John Smith', startScore: { eq: 542, ex: 555, tu: 548 }, currentScore: { eq: 611, ex: 624, tu: 618 }, itemsDisputed: 12, itemsRemoved: 7, round: 3, plan: 'Aggressive Sweep', monthly: 149, status: 'active' },
  { id: 'c2', name: 'Emily Davis', startScore: { eq: 588, ex: 592, tu: 585 }, currentScore: { eq: 651, ex: 660, tu: 655 }, itemsDisputed: 8, itemsRemoved: 6, round: 4, plan: 'Standard Repair', monthly: 99, status: 'active' },
  { id: 'c3', name: 'Robert Wilson', startScore: { eq: 610, ex: 605, tu: 612 }, currentScore: { eq: 702, ex: 698, tu: 705 }, itemsDisputed: 5, itemsRemoved: 5, round: 5, plan: 'Standard Repair', monthly: 99, status: 'graduated' },
  { id: 'c4', name: 'Maria Gonzalez', startScore: { eq: 501, ex: 512, tu: 498 }, currentScore: { eq: 543, ex: 559, tu: 540 }, itemsDisputed: 15, itemsRemoved: 3, round: 2, plan: 'Aggressive Sweep', monthly: 149, status: 'active' },
];

export function CreditClientsTab() {
  const avg = (s: { eq: number; ex: number; tu: number }) => Math.round((s.eq + s.ex + s.tu) / 3);
  const mrr = CREDIT_CLIENTS.filter(c => c.status === 'active').reduce((a, c) => a + c.monthly, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Credit Clients', value: CREDIT_CLIENTS.filter(c => c.status === 'active').length, icon: CreditCard, color: 'text-sky-400' },
          { label: 'Credit Repair MRR', value: `$${mrr}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Items Removed (all-time)', value: CREDIT_CLIENTS.reduce((a, c) => a + c.itemsRemoved, 0), icon: CheckCircle2, color: 'text-[#D4AF37]' },
          { label: 'Avg Score Lift', value: `+${Math.round(CREDIT_CLIENTS.reduce((a, c) => a + (avg(c.currentScore) - avg(c.startScore)), 0) / CREDIT_CLIENTS.length)} pts`, icon: ArrowUpRight, color: 'text-teal-400' },
        ].map(k => (
          <div key={k.label} className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
            <k.icon className={`h-5 w-5 ${k.color} mb-2`} />
            <div className="text-2xl font-black text-white">{k.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-neutral-900 flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2"><CreditCard className="h-4 w-4 text-sky-400" /> Credit Repair Roster</h3>
          <span className="text-[10px] text-slate-500">Cross-sell: every credit client gets a free tax review at score milestones</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-900 bg-neutral-950 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">EQ / EX / TU</th>
                <th className="px-5 py-3">Lift</th>
                <th className="px-5 py-3">Disputed → Removed</th>
                <th className="px-5 py-3">Round</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {CREDIT_CLIENTS.map(c => {
                const lift = avg(c.currentScore) - avg(c.startScore);
                return (
                  <tr key={c.id} className="border-b border-neutral-900/60 hover:bg-neutral-900/30 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-bold text-white">{c.name}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-300">{c.currentScore.eq} / {c.currentScore.ex} / {c.currentScore.tu}<div className="text-[9px] text-slate-600">was {c.startScore.eq} / {c.startScore.ex} / {c.startScore.tu}</div></td>
                    <td className="px-5 py-3.5"><span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-[10px] font-black">+{lift} pts</span></td>
                    <td className="px-5 py-3.5 text-xs text-slate-300 font-semibold">{c.itemsDisputed} → <span className="text-[#D4AF37]">{c.itemsRemoved} removed</span></td>
                    <td className="px-5 py-3.5 text-xs font-bold text-sky-400">R{c.round}</td>
                    <td className="px-5 py-3.5 text-[10px] text-slate-400">{c.plan} · ${c.monthly}/mo</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black ${
                        c.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        : c.status === 'graduated' ? 'bg-amber-500/10 border-amber-500/25 text-[#D4AF37]'
                        : 'bg-slate-500/10 border-slate-500/25 text-slate-400'
                      }`}>{c.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-neutral-950/80 border border-sky-500/20 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3"><Shield className="h-4 w-4 text-sky-400" /> CROA Compliance Guardrails (Credit Repair Organizations Act)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400 leading-relaxed">
          <div className="bg-neutral-900/40 rounded-xl p-3 border border-neutral-800">• Written contract required before any service — 3-day right to cancel disclosed in every agreement.</div>
          <div className="bg-neutral-900/40 rounded-xl p-3 border border-neutral-800">• No charging before services are performed — billing is monthly in arrears, enforced by the Stripe billing cycle.</div>
          <div className="bg-neutral-900/40 rounded-xl p-3 border border-neutral-800">• Never advise clients to misrepresent information or create a new credit identity (CPN warning is built into onboarding).</div>
          <div className="bg-neutral-900/40 rounded-xl p-3 border border-neutral-800">• "Consumer Credit File Rights" disclosure auto-attached to every new credit client via the Onboarding drip.</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DISPUTES TAB — FCRA dispute board with 30-day clocks
   ============================================================ */

interface Dispute {
  id: string;
  client: string;
  item: string;
  bureau: 'Equifax' | 'Experian' | 'TransUnion';
  basis: string;
  round: number;
  sent: string;
  deadline: string;
  daysLeft: number;
  stage: 'drafted' | 'mailed' | 'investigating' | 'responded' | 'removed' | 'verified';
}

const DISPUTES: Dispute[] = [
  { id: 'd1', client: 'John Smith', item: 'Midland Credit — Collection $1,240', bureau: 'Equifax', basis: 'Not mine / no validation (FDCPA §809)', round: 3, sent: '2026-08-04', deadline: '2026-09-03', daysLeft: 12, stage: 'investigating' },
  { id: 'd2', client: 'John Smith', item: 'Capital One — 30-day late Mar 2025', bureau: 'TransUnion', basis: 'Inaccurate — paid on time (bank proof)', round: 3, sent: '2026-08-04', deadline: '2026-09-03', daysLeft: 12, stage: 'investigating' },
  { id: 'd3', client: 'Emily Davis', item: 'LVNV Funding — Collection $860', bureau: 'Experian', basis: 'Re-aged debt (FCRA §605 obsolete)', round: 4, sent: '2026-07-22', deadline: '2026-08-21', daysLeft: 0, stage: 'responded' },
  { id: 'd4', client: 'Maria Gonzalez', item: 'Hard inquiry — unknown auto lender', bureau: 'Equifax', basis: 'Unauthorized inquiry (FCRA §604 permissible purpose)', round: 2, sent: '2026-08-11', deadline: '2026-09-10', daysLeft: 19, stage: 'mailed' },
  { id: 'd5', client: 'Maria Gonzalez', item: 'Portfolio Recovery — Collection $2,105', bureau: 'TransUnion', basis: 'Request Method of Verification (§611(a)(7))', round: 2, sent: '', deadline: '', daysLeft: -1, stage: 'drafted' },
  { id: 'd6', client: 'Emily Davis', item: 'Charge-off — Synchrony $430', bureau: 'Experian', basis: 'Balance reported after charge-off inaccurate', round: 3, sent: '2026-06-30', deadline: '2026-07-30', daysLeft: -22, stage: 'removed' },
  { id: 'd7', client: 'Robert Wilson', item: 'Medical collection $290', bureau: 'Equifax', basis: 'Paid medical <$500 (NCRA policy — must delete)', round: 1, sent: '2026-05-12', deadline: '2026-06-11', daysLeft: -71, stage: 'removed' },
  { id: 'd8', client: 'John Smith', item: 'Old address / name variant', bureau: 'Experian', basis: 'Personal info cleanup before Round 4', round: 3, sent: '2026-08-04', deadline: '2026-09-03', daysLeft: 12, stage: 'verified' },
];

const STAGE_META: Record<Dispute['stage'], { label: string; color: string }> = {
  drafted: { label: 'Drafted', color: 'bg-slate-500/10 border-slate-500/30 text-slate-300' },
  mailed: { label: 'Mailed (Certified)', color: 'bg-sky-500/10 border-sky-500/30 text-sky-300' },
  investigating: { label: 'Bureau Investigating', color: 'bg-amber-500/10 border-amber-500/30 text-[#D4AF37]' },
  responded: { label: 'Response Received', color: 'bg-purple-500/10 border-purple-500/30 text-purple-300' },
  removed: { label: 'REMOVED ✓', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  verified: { label: 'Verified (escalate)', color: 'bg-red-500/10 border-red-500/30 text-red-400' },
};

export function DisputesTab() {
  const [filter, setFilter] = useState<'all' | Dispute['stage']>('all');
  const shown = filter === 'all' ? DISPUTES : DISPUTES.filter(d => d.stage === filter);
  const inFlight = DISPUTES.filter(d => ['mailed', 'investigating', 'responded'].includes(d.stage)).length;
  const overdue = DISPUTES.filter(d => d.stage === 'investigating' && d.daysLeft <= 0).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Disputes In Flight', value: inFlight, icon: Send, color: 'text-sky-400' },
          { label: 'Removed This Year', value: DISPUTES.filter(d => d.stage === 'removed').length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: '30-Day Clock Expired', value: overdue, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Escalations Needed', value: DISPUTES.filter(d => d.stage === 'verified').length, icon: Scale, color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
            <k.icon className={`h-5 w-5 ${k.color} mb-2`} />
            <div className="text-2xl font-black text-white">{k.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'drafted', 'mailed', 'investigating', 'responded', 'removed', 'verified'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${filter === s ? 'bg-amber-500/10 border-amber-500/30 text-[#D4AF37]' : 'border-neutral-800 text-slate-400 hover:text-white'}`}>
            {s === 'all' ? 'All Disputes' : STAGE_META[s].label}
          </button>
        ))}
      </div>

      <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-900 bg-neutral-950 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
                <th className="px-5 py-3">Client / Item</th>
                <th className="px-5 py-3">Bureau</th>
                <th className="px-5 py-3">Legal Basis</th>
                <th className="px-5 py-3">Round</th>
                <th className="px-5 py-3">FCRA 30-Day Clock</th>
                <th className="px-5 py-3">Stage</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(d => (
                <tr key={d.id} className="border-b border-neutral-900/60 hover:bg-neutral-900/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-xs font-bold text-white">{d.client}</div>
                    <div className="text-[10px] text-slate-500">{d.item}</div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-300">{d.bureau}</td>
                  <td className="px-5 py-3.5 text-[10px] text-slate-400 max-w-[220px]">{d.basis}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-sky-400">R{d.round}</td>
                  <td className="px-5 py-3.5">
                    {d.stage === 'drafted' ? (
                      <span className="text-[10px] text-slate-500">Not yet mailed</span>
                    ) : d.daysLeft > 0 && ['mailed', 'investigating'].includes(d.stage) ? (
                      <span className={`text-[10px] font-black ${d.daysLeft <= 7 ? 'text-red-400' : 'text-amber-400'}`}>{d.daysLeft} days left → {d.deadline}</span>
                    ) : ['mailed', 'investigating'].includes(d.stage) ? (
                      <span className="text-[10px] font-black text-red-400">EXPIRED — demand deletion (§611(a)(1))</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Closed {d.deadline || '—'}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black ${STAGE_META[d.stage].color}`}>{STAGE_META[d.stage].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3"><Scale className="h-4 w-4 text-[#D4AF37]" /> Round Escalation Ladder (automated by "IRS Notice Intake" style workflow logic)</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-[10px] text-slate-400">
          {[
            { r: 'Round 1', t: 'Initial §611 dispute to each bureau (certified mail, return receipt)' },
            { r: 'Round 2', t: 'Method of Verification demand §611(a)(7) + furnisher direct dispute §623' },
            { r: 'Round 3', t: 'FCRA §609 file disclosure request + procedural failure notice' },
            { r: 'Round 4', t: 'CFPB complaint + state AG complaint; notice of intent to litigate' },
            { r: 'Round 5', t: 'Attorney referral — statutory damages $100–$1,000 per willful violation §616' },
          ].map(x => (
            <div key={x.r} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-3">
              <div className="font-black text-sky-400 mb-1">{x.r}</div>{x.t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DISPUTE LETTERS TAB — real, complete letter templates
   ============================================================ */

interface LetterTemplate {
  id: string;
  name: string;
  law: string;
  use: string;
  body: string;
}

const LETTERS: LetterTemplate[] = [
  {
    id: 'l609',
    name: 'FCRA §609 File Disclosure Request',
    law: '15 U.S.C. §1681g',
    use: 'Forces the bureau to disclose everything in the file and the sources — foundation for procedural challenges.',
    body: `{{today}}

{{clientName}}
{{clientAddress}}
SSN (last 4): {{ssnLast4}}   DOB: {{dob}}

{{bureauName}}
{{bureauAddress}}

RE: Request for File Disclosure Pursuant to FCRA §609 (15 U.S.C. §1681g)

To Whom It May Concern:

This is a formal request under Section 609 of the Fair Credit Reporting Act for the complete disclosure of my consumer file. I am requesting the following, in writing, within the statutory timeframe:

1. All information in my consumer file at the time of this request, including the sources of that information (§1681g(a)(1)–(2)).
2. The name of every person or entity that procured my report in the past two years for employment purposes, and the past one year for any other purpose (§1681g(a)(3)).
3. A record of all inquiries, both hard and soft, associated with my file.
4. Verifiable documentation bearing my signature for the following item(s), which I do not recognize as accurately mine:

   • {{itemDescription}} — Account #: {{accountNumber}}

Please note: a printout from a furnisher's electronic system (e-OSCAR "verified" response) does not constitute the original documentation I am requesting. If you cannot produce the requested disclosure and source documentation, the item(s) must be deleted pursuant to §611(a)(5)(A).

I am enclosing a copy of my government-issued ID and a utility bill as proof of identity and address. Please respond in writing to the address above.

Sincerely,

{{clientName}}
Enclosures: ID, proof of address`,
  },
  {
    id: 'l611',
    name: 'FCRA §611 Reinvestigation Dispute',
    law: '15 U.S.C. §1681i',
    use: 'The core Round-1 dispute. Starts the 30-day investigation clock. Send certified mail, return receipt.',
    body: `{{today}}

{{clientName}}
{{clientAddress}}
SSN (last 4): {{ssnLast4}}   DOB: {{dob}}

{{bureauName}}
{{bureauAddress}}

RE: Formal Dispute of Inaccurate Information — FCRA §611 (15 U.S.C. §1681i)

To Whom It May Concern:

I am exercising my right under Section 611 of the Fair Credit Reporting Act to dispute the following item(s) appearing on my credit report, which are inaccurate and/or unverifiable:

Item: {{itemDescription}}
Furnisher: {{furnisherName}}
Account #: {{accountNumber}}
Reason: {{disputeReason}}

You are required by law to conduct a reasonable reinvestigation of this dispute, free of charge, within 30 days of receipt (§1681i(a)(1)(A)), and to forward all relevant information I have provided to the furnisher within 5 business days (§1681i(a)(2)).

If the item cannot be verified as accurate and complete, it must be promptly DELETED from my file (§1681i(a)(5)(A)), and you must send me an updated copy of my report reflecting the correction at no charge.

Please also provide, upon completion, a description of the procedure used to determine the accuracy of the information, including the business name, address, and telephone number of any furnisher contacted, as is my right under §611(a)(7).

This is not a frivolous dispute. Supporting documentation is enclosed. I expect written results of your reinvestigation.

Sincerely,

{{clientName}}
Enclosures: ID, proof of address, supporting documentation
Sent via USPS Certified Mail #: {{certifiedNumber}}`,
  },
  {
    id: 'lmov',
    name: 'Method of Verification Demand',
    law: 'FCRA §611(a)(7)',
    use: 'Round-2 follow-up when a bureau claims an item was "verified" — forces them to show HOW.',
    body: `{{today}}

{{clientName}}
{{clientAddress}}

{{bureauName}}
{{bureauAddress}}

RE: Demand for Method of Verification — FCRA §611(a)(7) | Prior dispute confirmation #: {{disputeConfirmation}}

To Whom It May Concern:

On {{priorDisputeDate}}, I disputed the following item, and your agency responded that it was "verified as accurate":

Item: {{itemDescription}} — Account #: {{accountNumber}}

Pursuant to FCRA §611(a)(7), I hereby demand a description of the procedure used to determine the accuracy and completeness of the disputed information, including:

1. The business name, address, and telephone number of every furnisher contacted;
2. The name of the individual at the furnisher who verified the account;
3. Copies of any documents obtained or reviewed in the course of the reinvestigation;
4. Confirmation of whether verification was performed solely through the automated e-OSCAR system.

A mere electronic confirmation code from e-OSCAR does not constitute a "reasonable reinvestigation" under Cushman v. Trans Union Corp., 115 F.3d 220 (3d Cir. 1997). If you are unable to provide the method of verification within 15 days, I demand immediate deletion of the item and an updated report.

Failure to comply will result in complaints filed with the CFPB and my State Attorney General, and I reserve all rights to pursue statutory damages under §616–§617 for willful or negligent noncompliance.

Sincerely,

{{clientName}}`,
  },
  {
    id: 'ldv',
    name: 'Debt Validation Letter (Collector)',
    law: 'FDCPA §809 (15 U.S.C. §1692g)',
    use: 'Send to a collection agency within 30 days of first contact — collection must pause until validated.',
    body: `{{today}}

{{clientName}}
{{clientAddress}}

{{collectorName}}
{{collectorAddress}}

RE: Validation Demand — Account #: {{accountNumber}} | Alleged amount: {{allegedAmount}}

To Whom It May Concern:

This letter is sent pursuant to the Fair Debt Collection Practices Act, 15 U.S.C. §1692g, in response to your communication dated {{contactDate}}. This is NOT a refusal to pay, but a notice that your claim is DISPUTED and validation is demanded.

Provide the following:

1. The name and address of the original creditor;
2. A complete accounting of the alleged debt: principal, interest, fees, and how each was calculated;
3. A copy of the original signed agreement or instrument creating the obligation;
4. Proof that you own the debt or are authorized to collect it (chain of assignment);
5. Proof the debt is within the applicable statute of limitations in my state;
6. Your license to collect in my state, if required, with license number.

Under §1692g(b), you must CEASE all collection activity until validation is mailed to me. Reporting this debt to any credit bureau while it remains unvalidated — or failing to mark it "disputed" — violates both the FDCPA (§1692e(8)) and the FCRA.

All telephone contact is inconvenient; communicate in writing only.

Sincerely,

{{clientName}}
Sent via USPS Certified Mail #: {{certifiedNumber}}`,
  },
  {
    id: 'lgw',
    name: 'Goodwill Adjustment Letter',
    law: 'Discretionary (no statute)',
    use: 'For legitimate late payments on otherwise good accounts — asks the creditor to remove as a courtesy.',
    body: `{{today}}

{{clientName}}
{{clientAddress}}

{{creditorName}} — Executive Customer Relations
{{creditorAddress}}

RE: Goodwill Request — Account #: {{accountNumber}}

Dear {{creditorName}} team:

I have been a customer since {{customerSince}}, and I value the relationship. I am writing about the {{lateCount}} late payment(s) reported for {{lateDates}}.

At that time, {{hardshipExplanation}}. Since then, I have made {{onTimeStreak}} consecutive on-time payments and have brought the account fully current, which I hope demonstrates that the late payment was an isolated event and not a reflection of how I manage my obligations.

I am respectfully requesting a goodwill adjustment: removal of the late-payment notation(s) from my credit reports with Equifax, Experian, and TransUnion. This notation is significantly impacting my ability to {{goal}}.

I understand this is a courtesy and not an obligation. I would be sincerely grateful for your consideration, and I intend to remain a loyal, on-time customer for years to come.

Thank you for your time and consideration.

Respectfully,

{{clientName}}
{{clientPhone}}`,
  },
  {
    id: 'lcd',
    name: 'Cease & Desist (Collector Harassment)',
    law: 'FDCPA §805(c) (15 U.S.C. §1692c(c))',
    use: 'Stops all collector contact. Use strategically — usually only for time-barred or harassing collectors.',
    body: `{{today}}

{{clientName}}
{{clientAddress}}

{{collectorName}}
{{collectorAddress}}

RE: CEASE AND DESIST — Account #: {{accountNumber}}

To Whom It May Concern:

Pursuant to my rights under 15 U.S.C. §1692c(c) of the Fair Debt Collection Practices Act, you are hereby notified to CEASE AND DESIST all communication with me, my family, and my employer regarding the above-referenced account, through any medium including telephone, text message, email, and social media.

Under the statute, upon receipt of this notice you may contact me only to:
(1) advise that your efforts are being terminated;
(2) notify me that you may invoke specified remedies which you ordinarily invoke; or
(3) notify me that you intend to invoke a specified remedy.

Any further contact outside these narrow exceptions is a violation of federal law carrying statutory damages of up to $1,000 per action (§1692k), plus attorney's fees. A log of all prior contact — including {{violationSummary}} — is being maintained and will be provided to the CFPB, the FTC, and my State Attorney General if violations continue.

Govern yourselves accordingly.

{{clientName}}
Sent via USPS Certified Mail #: {{certifiedNumber}}`,
  },
];

export function DisputeLettersTab() {
  const [selected, setSelected] = useState<LetterTemplate>(LETTERS[1]);
  const [copied, setCopied] = useState(false);

  const copyBody = () => {
    navigator.clipboard?.writeText(selected.body).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      <div className="space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><FileText className="h-4 w-4 text-purple-400" /> Letter Arsenal ({LETTERS.length})</h3>
        {LETTERS.map(l => (
          <button key={l.id} onClick={() => setSelected(l)}
            className={`w-full text-left rounded-2xl border p-4 transition-all ${selected.id === l.id ? 'bg-purple-500/10 border-purple-500/30' : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'}`}>
            <div className="text-xs font-black text-white">{l.name}</div>
            <div className="text-[10px] font-mono text-purple-300 mt-0.5">{l.law}</div>
            <div className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{l.use}</div>
          </button>
        ))}
        <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-4 text-[10px] text-slate-400 leading-relaxed">
          <div className="font-black text-[#D4AF37] mb-1.5 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Mailing Protocol</div>
          Always USPS Certified Mail + Return Receipt. Merge tokens ({'{{clientName}}'}, {'{{accountNumber}}'}…) auto-fill from the client record. Letters can be dispatched physically via the <span className="text-white font-bold">Click2Mail integration</span> in the Tax Module.
        </div>
      </div>

      <div className="xl:col-span-2 bg-neutral-950/80 border border-purple-500/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-neutral-900 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-black text-white">{selected.name}</h3>
            <p className="text-[10px] font-mono text-purple-300">{selected.law}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyBody} className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-black text-slate-300 hover:text-white flex items-center gap-1.5 transition-all">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy Letter'}
            </button>
            <button onClick={copyBody} className="px-3 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-xl text-[10px] font-black text-white flex items-center gap-1.5 active:scale-95 transition-all">
              <Mail className="h-3.5 w-3.5" /> Send via Click2Mail
            </button>
          </div>
        </div>
        <pre className="p-6 text-[11px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[640px] overflow-y-auto">{selected.body}</pre>
      </div>
    </div>
  );
}
