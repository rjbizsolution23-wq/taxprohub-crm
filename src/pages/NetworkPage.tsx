/**
 * 🌐 NETWORK & RECRUITING CENTER — Service Bureau Downline Engine
 * The feature no incumbent has: sponsors recruit preparers, recruits recruit
 * more preparers, and every sponsor sees live earnings, override accrual,
 * compliance status, and leaderboards for their entire downline.
 */

import { useMemo, useState } from 'react';
import {
  Users, UserPlus, TrendingUp, DollarSign, Award, ChevronDown, ChevronRight,
  ShieldCheck, AlertTriangle, Link2, Copy, Search, Network, Crown,
  Target, CheckCircle2, Eye,
} from 'lucide-react';
import { useAppStore } from '../store';

// ── Types ────────────────────────────────────────────────────────────────────
interface NetworkMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  sponsorId: string | null;     // who recruited them
  tier: 'bureau_owner' | 'mentor' | 'preparer' | 'trainee';
  joinedAt: string;
  ptin: string;
  efinStatus: 'active' | 'pending' | 'own_efin' | 'suspended';
  complianceOk: boolean;
  season: {
    returnsFiled: number;
    grossFees: number;          // fees they billed clients
    netEarnings: number;        // what the member keeps
    overridePaidUp: number;     // override generated for their sponsor
    bankProducts: number;       // RT/advance count
    avgFee: number;
  };
  recruits: number;             // direct recruits count (denormalized)
}

// ── Seed network (3-level downline demo) ────────────────────────────────────
const NETWORK: NetworkMember[] = [
  { id: 'n1', name: 'Rick Jefferson', email: 'rick@rjbusinesssolutions.org', phone: '(877) 561-8001', sponsorId: null, tier: 'bureau_owner', joinedAt: '2023-11-01', ptin: 'P01234567', efinStatus: 'own_efin', complianceOk: true,
    season: { returnsFiled: 212, grossFees: 74200, netEarnings: 74200, overridePaidUp: 0, bankProducts: 148, avgFee: 350 }, recruits: 3 },
  { id: 'n2', name: 'Maria Gonzalez', email: 'maria.g@vtpro.tax', phone: '(505) 210-4478', sponsorId: 'n1', tier: 'mentor', joinedAt: '2024-12-08', ptin: 'P02345678', efinStatus: 'active', complianceOk: true,
    season: { returnsFiled: 168, grossFees: 52080, netEarnings: 36456, overridePaidUp: 4166, bankProducts: 121, avgFee: 310 }, recruits: 2 },
  { id: 'n3', name: 'DeShawn Carter', email: 'dcarter@vtpro.tax', phone: '(972) 355-8102', sponsorId: 'n1', tier: 'mentor', joinedAt: '2025-01-15', ptin: 'P03456789', efinStatus: 'active', complianceOk: true,
    season: { returnsFiled: 143, grossFees: 45760, netEarnings: 32032, overridePaidUp: 3660, bankProducts: 102, avgFee: 320 }, recruits: 2 },
  { id: 'n4', name: 'Alicia Brooks', email: 'abrooks@vtpro.tax', phone: '(404) 881-2290', sponsorId: 'n1', tier: 'preparer', joinedAt: '2025-11-20', ptin: 'P04567890', efinStatus: 'active', complianceOk: true,
    season: { returnsFiled: 96, grossFees: 27840, netEarnings: 19488, overridePaidUp: 2227, bankProducts: 71, avgFee: 290 }, recruits: 0 },
  { id: 'n5', name: 'James Whitfield', email: 'jwhitfield@vtpro.tax', phone: '(505) 664-1937', sponsorId: 'n2', tier: 'preparer', joinedAt: '2025-12-02', ptin: 'P05678901', efinStatus: 'active', complianceOk: true,
    season: { returnsFiled: 84, grossFees: 23520, netEarnings: 16464, overridePaidUp: 1882, bankProducts: 63, avgFee: 280 }, recruits: 0 },
  { id: 'n6', name: 'Sofia Ramirez', email: 'sramirez@vtpro.tax', phone: '(915) 227-6604', sponsorId: 'n2', tier: 'trainee', joinedAt: '2026-01-06', ptin: 'P06789012', efinStatus: 'pending', complianceOk: true,
    season: { returnsFiled: 31, grossFees: 8060, netEarnings: 5642, overridePaidUp: 645, bankProducts: 22, avgFee: 260 }, recruits: 0 },
  { id: 'n7', name: 'Marcus Lee', email: 'mlee@vtpro.tax', phone: '(214) 990-3321', sponsorId: 'n3', tier: 'preparer', joinedAt: '2025-12-18', ptin: 'P07890123', efinStatus: 'active', complianceOk: true,
    season: { returnsFiled: 77, grossFees: 21560, netEarnings: 15092, overridePaidUp: 1725, bankProducts: 55, avgFee: 280 }, recruits: 0 },
  { id: 'n8', name: 'Tanya Osei', email: 'tosei@vtpro.tax', phone: '(678) 512-7845', sponsorId: 'n3', tier: 'trainee', joinedAt: '2026-01-22', ptin: 'P08901234', efinStatus: 'pending', complianceOk: false,
    season: { returnsFiled: 18, grossFees: 4680, netEarnings: 3276, overridePaidUp: 374, bankProducts: 11, avgFee: 260 }, recruits: 0 },
];

const TIER_META: Record<NetworkMember['tier'], { label: string; cls: string; icon: typeof Crown }> = {
  bureau_owner: { label: 'Bureau Owner', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Crown },
  mentor:       { label: 'Mentor',       cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30', icon: Award },
  preparer:     { label: 'Preparer',     cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30', icon: Users },
  trainee:      { label: 'Trainee',      cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30', icon: Target },
};

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** All descendants of a member (full downline). */
function downlineOf(id: string, all: NetworkMember[]): NetworkMember[] {
  const direct = all.filter((m) => m.sponsorId === id);
  return direct.flatMap((d) => [d, ...downlineOf(d.id, all)]);
}

export default function NetworkPage() {
  const { addNotification } = useAppStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['n1', 'n2', 'n3']));
  const [selected, setSelected] = useState<NetworkMember>(NETWORK[0]);
  const [search, setSearch] = useState('');

  const toggle = (id: string) => setExpanded((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const totals = useMemo(() => NETWORK.reduce((a, m) => ({
    returns: a.returns + m.season.returnsFiled,
    gross: a.gross + m.season.grossFees,
    overrides: a.overrides + m.season.overridePaidUp,
    bank: a.bank + m.season.bankProducts,
  }), { returns: 0, gross: 0, overrides: 0, bank: 0 }), []);

  const selDownline = useMemo(() => downlineOf(selected.id, NETWORK), [selected]);
  const selDownlineEarnings = selDownline.reduce((s, m) => s + m.season.overridePaidUp, 0);

  const copyRecruitLink = () => {
    navigator.clipboard?.writeText(`https://join.taxprohubuniversity.com/r/${selected.id}?sponsor=${encodeURIComponent(selected.name)}`);
    addNotification({ id: `ntf-${Date.now()}`, title: 'Recruiting link copied', message: `Personal recruiting funnel link for ${selected.name} copied — new sign-ups auto-attach to their downline.`, type: 'success', read: false, createdAt: new Date() });
  };

  const renderTree = (sponsorId: string | null, depth = 0): React.ReactNode =>
    NETWORK.filter((m) => m.sponsorId === sponsorId &&
      (search === '' || m.name.toLowerCase().includes(search.toLowerCase())))
      .map((m) => {
        const kids = NETWORK.filter((k) => k.sponsorId === m.id);
        const meta = TIER_META[m.tier];
        const open = expanded.has(m.id);
        return (
          <div key={m.id}>
            <div
              onClick={() => setSelected(m)}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 mb-1.5 cursor-pointer transition
                ${selected.id === m.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}
              style={{ marginLeft: depth * 22 }}
            >
              {kids.length > 0 ? (
                <button onClick={(e) => { e.stopPropagation(); toggle(m.id); }} className="text-gray-400 hover:text-white">
                  {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : <span className="w-4" />}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-transparent border border-amber-500/30 grid place-items-center text-[11px] font-black text-amber-300">
                {m.name.split(' ').map((s) => s[0]).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{m.name}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${meta.cls}`}>{meta.label}</span>
                  {!m.complianceOk && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <div className="text-[11px] text-gray-500">{m.season.returnsFiled} returns · {money(m.season.grossFees)} gross · override to sponsor {money(m.season.overridePaidUp)}</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-emerald-400">{money(m.season.netEarnings)}</div>
                <div className="text-[10px] text-gray-500">net earnings</div>
              </div>
            </div>
            {open && renderTree(m.id, depth + 1)}
          </div>
        );
      });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-600/10 border border-violet-500/40 grid place-items-center">
            <Network className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Network & Recruiting Center</h1>
            <p className="text-sm text-gray-400">Your entire downline — recruits, their recruits, live earnings & override accrual. The engine no other tax platform has.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> PTIN/EFIN Compliance Monitored
          </span>
        </div>
      </div>

      {/* Network KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Network Members', value: String(NETWORK.length), sub: '3 levels deep' },
          { icon: TrendingUp, label: 'Network Returns Filed', value: totals.returns.toLocaleString(), sub: 'this season' },
          { icon: DollarSign, label: 'Network Gross Fees', value: money(totals.gross), sub: 'all members' },
          { icon: Award, label: 'Override Pool Accrued', value: money(totals.overrides), sub: 'paid up the chain' },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-4">
            <k.icon className="w-4 h-4 text-violet-300 mb-2" />
            <div className="text-xl font-black text-white">{k.value}</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wide">{k.label} · {k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Downline tree */}
        <div className="lg:col-span-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-white font-bold flex items-center gap-2"><Network className="w-4 h-4 text-violet-300" /> Downline Tree</h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find member…"
                className="pl-8 pr-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder-gray-600 focus:border-violet-500/50 outline-none w-44" />
            </div>
          </div>
          {renderTree(null)}
          <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-1.5">
            <Eye className="w-3 h-3" /> Click any member to inspect their earnings, downline, and recruiting link. Overrides accrue via /api/payouts/accrue.
          </div>
        </div>

        {/* Member detail */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-gradient-to-b from-violet-500/10 to-transparent border border-violet-500/25 backdrop-blur-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 grid place-items-center text-black font-black">
                {selected.name.split(' ').map((s) => s[0]).join('')}
              </div>
              <div>
                <div className="text-white font-bold">{selected.name}</div>
                <div className="text-xs text-gray-400">{selected.email} · PTIN {selected.ptin}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${TIER_META[selected.tier].cls}`}>{TIER_META[selected.tier].label}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                    selected.efinStatus === 'active' || selected.efinStatus === 'own_efin'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : selected.efinStatus === 'pending' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-red-500/15 text-red-300 border-red-500/30'}`}>
                    EFIN: {selected.efinStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { l: 'Returns Filed', v: String(selected.season.returnsFiled) },
                { l: 'Gross Fees', v: money(selected.season.grossFees) },
                { l: 'Net Earnings', v: money(selected.season.netEarnings), c: 'text-emerald-400' },
                { l: 'Avg Fee / Return', v: money(selected.season.avgFee) },
                { l: 'Bank Products', v: String(selected.season.bankProducts) },
                { l: 'Override → Sponsor', v: money(selected.season.overridePaidUp), c: 'text-violet-300' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl bg-black/30 border border-white/10 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">{s.l}</div>
                  <div className={`font-bold mt-0.5 ${s.c ?? 'text-white'}`}>{s.v}</div>
                </div>
              ))}
            </div>

            {selDownline.length > 0 && (
              <div className="mt-4 rounded-xl bg-black/30 border border-violet-500/20 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400"><span className="text-white font-bold">{selDownline.length}</span> members in {selected.name.split(' ')[0]}'s downline</div>
                  <div className="text-sm font-black text-violet-300">{money(selDownlineEarnings)} <span className="text-[10px] text-gray-500 font-normal">overrides earned</span></div>
                </div>
              </div>
            )}

            {!selected.complianceOk && (
              <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 flex-none mt-0.5" />
                Compliance hold: annual §7216 consent training incomplete. Returns transmit is paused until resolved.
              </div>
            )}

            <div className="mt-4 space-y-2">
              <button onClick={copyRecruitLink}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:brightness-110 transition flex items-center justify-center gap-2">
                <Link2 className="w-4 h-4" /> Copy {selected.name.split(' ')[0]}'s Recruiting Link
              </button>
              <div className="text-[10px] text-gray-500 text-center">New sign-ups through this link auto-attach to {selected.name.split(' ')[0]}'s downline with override tracking.</div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
            <h3 className="text-white font-bold flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-amber-400" /> Season Leaderboard</h3>
            <div className="space-y-2">
              {[...NETWORK].sort((a, b) => b.season.grossFees - a.season.grossFees).slice(0, 5).map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/10 px-3 py-2">
                  <span className={`w-6 h-6 rounded-lg grid place-items-center text-[11px] font-black
                    ${i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-slate-400 text-black' : i === 2 ? 'bg-amber-800 text-white' : 'bg-white/10 text-gray-400'}`}>{i + 1}</span>
                  <span className="text-sm text-white font-medium flex-1 truncate">{m.name}</span>
                  <span className="text-sm font-bold text-emerald-400">{money(m.season.grossFees)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiting pipeline CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/25 p-4 flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-amber-400 flex-none" />
            <div className="text-xs text-gray-300 leading-relaxed">
              <span className="text-white font-bold">Recruiting funnel is live:</span> the AI Campaign Architect can generate a preparer-recruitment funnel + drip sequence. New recruits complete onboarding (PTIN verify, §7216 training, W-9, direct deposit) automatically.
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
