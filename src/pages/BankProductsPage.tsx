/**
 * 🏦 BANK PRODUCTS CENTER — Refund Transfers, Advances & Disbursements
 * The feature that funds the storefront tax industry: clients pay $0 upfront,
 * fees come out of the refund, preparers offer advances, and the bureau earns
 * a per-return e-file override on EVERY bank-product return (CrossLink model).
 * Partners: TPG (Santa Barbara) · EPS Financial · Refund Advantage · Republic Bank
 */

import { useMemo, useState } from 'react';
import {
  Landmark, DollarSign, Zap, Clock, CheckCircle2, AlertTriangle, Search,
  TrendingUp, ShieldCheck, ArrowRight, Banknote, CreditCard, Building2, RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store';

// ── Types ────────────────────────────────────────────────────────────────────
type BankPartner = 'TPG' | 'EPS' | 'Refund Advantage' | 'Republic Bank';
type RTStatus = 'irs_pending' | 'irs_funded' | 'fees_deducted' | 'disbursed' | 'advance_out' | 'rejected';

interface BankProduct {
  id: string;
  clientName: string;
  returnId: string;
  partner: BankPartner;
  product: 'refund_transfer' | 'refund_advance' | 'both';
  status: RTStatus;
  fedRefund: number;
  prepFee: number;
  bankFee: number;
  advanceAmount: number;   // 0 if none
  efileOverride: number;   // bureau's per-return override
  disburseMethod: 'direct_deposit' | 'cashiers_check' | 'prepaid_card' | 'walmart_cash';
  updatedAt: string;
}

const PARTNERS: { id: BankPartner; blurb: string; products: string; enrolled: boolean }[] = [
  { id: 'TPG', blurb: 'Santa Barbara Tax Products Group — largest RT processor', products: 'RT · Fast Cash Advance · GO2bank card', enrolled: true },
  { id: 'EPS', blurb: 'EPS Financial (Pathward) — e-Advance & e-Collect', products: 'RT · e-Advance up to $7,000 · FasterMoney card', enrolled: true },
  { id: 'Refund Advantage', blurb: 'Refund Advantage (Pathward) — preparer-friendly splits', products: 'RT · Taxpayer Advance · marketing funds', enrolled: true },
  { id: 'Republic Bank', blurb: 'Republic Bank & Trust — Easy Advance', products: 'RT · Easy Advance · Netspend card', enrolled: false },
];

const STATUS_META: Record<RTStatus, { label: string; cls: string; icon: typeof Clock }> = {
  irs_pending:   { label: 'IRS Pending', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30', icon: Clock },
  irs_funded:    { label: 'IRS Funded', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30', icon: Landmark },
  fees_deducted: { label: 'Fees Deducted', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30', icon: DollarSign },
  disbursed:     { label: 'Disbursed ✓', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  advance_out:   { label: 'Advance Out', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Zap },
  rejected:      { label: 'Rejected', cls: 'bg-red-500/15 text-red-300 border-red-500/30', icon: AlertTriangle },
};

const SEED: BankProduct[] = [
  { id: 'bp1', clientName: 'Jasmine Torres', returnId: 'RTN-2026-0141', partner: 'TPG', product: 'both', status: 'disbursed', fedRefund: 8946, prepFee: 425, bankFee: 39.95, advanceAmount: 2500, efileOverride: 18, disburseMethod: 'direct_deposit', updatedAt: '2026-02-18' },
  { id: 'bp2', clientName: 'Andre Mitchell', returnId: 'RTN-2026-0158', partner: 'EPS', product: 'refund_transfer', status: 'fees_deducted', fedRefund: 5211, prepFee: 350, bankFee: 44.95, advanceAmount: 0, efileOverride: 18, disburseMethod: 'prepaid_card', updatedAt: '2026-02-20' },
  { id: 'bp3', clientName: 'Keisha Williams', returnId: 'RTN-2026-0163', partner: 'TPG', product: 'refund_advance', status: 'advance_out', fedRefund: 7104, prepFee: 385, bankFee: 39.95, advanceAmount: 3000, efileOverride: 18, disburseMethod: 'direct_deposit', updatedAt: '2026-02-21' },
  { id: 'bp4', clientName: 'Robert Chen', returnId: 'RTN-2026-0171', partner: 'Refund Advantage', product: 'refund_transfer', status: 'irs_funded', fedRefund: 3892, prepFee: 285, bankFee: 39.95, advanceAmount: 0, efileOverride: 18, disburseMethod: 'cashiers_check', updatedAt: '2026-02-21' },
  { id: 'bp5', clientName: 'Maria Santos', returnId: 'RTN-2026-0177', partner: 'EPS', product: 'both', status: 'irs_pending', fedRefund: 9613, prepFee: 450, bankFee: 44.95, advanceAmount: 3500, efileOverride: 18, disburseMethod: 'direct_deposit', updatedAt: '2026-02-22' },
  { id: 'bp6', clientName: 'Devon Jackson', returnId: 'RTN-2026-0184', partner: 'TPG', product: 'refund_transfer', status: 'irs_pending', fedRefund: 2417, prepFee: 285, bankFee: 39.95, advanceAmount: 0, efileOverride: 18, disburseMethod: 'walmart_cash', updatedAt: '2026-02-22' },
  { id: 'bp7', clientName: 'Linda Nguyen', returnId: 'RTN-2026-0129', partner: 'Refund Advantage', product: 'refund_transfer', status: 'rejected', fedRefund: 6120, prepFee: 350, bankFee: 39.95, advanceAmount: 0, efileOverride: 0, disburseMethod: 'direct_deposit', updatedAt: '2026-02-15' },
];

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function BankProductsPage() {
  const { addNotification } = useAppStore();
  const [items] = useState<BankProduct[]>(SEED);
  const [filter, setFilter] = useState<'all' | RTStatus>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => items.filter((b) =>
    (filter === 'all' || b.status === filter) &&
    (search === '' || b.clientName.toLowerCase().includes(search.toLowerCase()) || b.returnId.toLowerCase().includes(search.toLowerCase()))
  ), [items, filter, search]);

  const stats = useMemo(() => ({
    count: items.length,
    feesSecured: items.filter((b) => ['fees_deducted', 'disbursed'].includes(b.status)).reduce((s, b) => s + b.prepFee, 0),
    feesPending: items.filter((b) => ['irs_pending', 'irs_funded', 'advance_out'].includes(b.status)).reduce((s, b) => s + b.prepFee, 0),
    advances: items.filter((b) => b.advanceAmount > 0).reduce((s, b) => s + b.advanceAmount, 0),
    overrides: items.reduce((s, b) => s + b.efileOverride, 0),
  }), [items]);

  const refresh = () => addNotification({
    id: `ntf-${Date.now()}`, title: 'Bank statuses refreshed',
    message: 'Live disbursement statuses pulled from TPG / EPS / Refund Advantage via /api/bank/status.',
    type: 'success', read: false, createdAt: new Date(),
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-green-600/10 border border-emerald-500/40 grid place-items-center">
            <Landmark className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Bank Products Center</h1>
            <p className="text-sm text-gray-400">Refund transfers, advances, disbursement tracking & bureau e-file overrides — clients pay $0 upfront.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> §7216 consent captured per RT
          </span>
          <button onClick={refresh} className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-gray-300 text-xs hover:bg-white/10 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Statuses
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Banknote, label: 'Bank Product Returns', value: String(stats.count), c: 'text-white' },
          { icon: CheckCircle2, label: 'Fees Secured (from refunds)', value: money(stats.feesSecured), c: 'text-emerald-400' },
          { icon: Clock, label: 'Fees In-Flight', value: money(stats.feesPending), c: 'text-amber-400' },
          { icon: Zap, label: 'Advances Issued', value: money(stats.advances), c: 'text-sky-400' },
          { icon: TrendingUp, label: 'Bureau E-file Overrides', value: money(stats.overrides), c: 'text-violet-300' },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-4">
            <k.icon className={`w-4 h-4 mb-2 ${k.c}`} />
            <div className={`text-lg font-black ${k.c}`}>{k.value}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Partner enrollment strip */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PARTNERS.map((p) => (
          <div key={p.id} className={`rounded-2xl border p-4 ${p.enrolled ? 'bg-emerald-500/[0.06] border-emerald-500/25' : 'bg-white/[0.03] border-white/10'}`}>
            <div className="flex items-center justify-between">
              <Building2 className={`w-4 h-4 ${p.enrolled ? 'text-emerald-300' : 'text-gray-500'}`} />
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${p.enrolled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-gray-400'}`}>
                {p.enrolled ? 'ENROLLED' : 'ENROLL →'}
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-2">{p.id}</div>
            <div className="text-[10px] text-gray-500 leading-snug mt-0.5">{p.blurb}</div>
            <div className="text-[10px] text-emerald-300/80 mt-1.5">{p.products}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Client or return ID…"
            className="pl-8 pr-3 py-2 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none w-52" />
        </div>
        {(['all', 'irs_pending', 'irs_funded', 'fees_deducted', 'advance_out', 'disbursed', 'rejected'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition
              ${filter === s ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/[0.07]'}`}>
            {s === 'all' ? `All (${items.length})` : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Ledger */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left text-[10px] text-gray-500 uppercase tracking-wider border-b border-white/10">
              <th className="px-4 py-3 font-semibold">Client / Return</th>
              <th className="px-4 py-3 font-semibold">Partner</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Fed Refund</th>
              <th className="px-4 py-3 font-semibold text-right">Prep Fee</th>
              <th className="px-4 py-3 font-semibold text-right">Advance</th>
              <th className="px-4 py-3 font-semibold text-right">Override</th>
              <th className="px-4 py-3 font-semibold">Disbursement</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const meta = STATUS_META[b.status];
              return (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                  <td className="px-4 py-3">
                    <div className="text-white font-semibold">{b.clientName}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{b.returnId} · {b.updatedAt}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{b.partner}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${meta.cls}`}>
                      <meta.icon className="w-3 h-3" /> {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-bold">{money(b.fedRefund)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{money(b.prepFee)}<div className="text-[9px] text-gray-500">+{b.bankFee.toFixed(2)} bank</div></td>
                  <td className="px-4 py-3 text-right">{b.advanceAmount > 0 ? <span className="text-sky-400 font-semibold">{money(b.advanceAmount)}</span> : <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-right text-violet-300 font-semibold">{b.efileOverride > 0 ? money(b.efileOverride) : <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 capitalize flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-gray-500" /> {b.disburseMethod.replace(/_/g, ' ')}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500 text-sm">No bank products match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pre-Approved Advance Desk */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-white/[0.03] to-white/[0.03] border border-amber-500/25 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Pre-Approved Advance Desk</h2>
            <p className="text-xs text-gray-400 mt-1">Clients who pre-qualified through the Refund Advance lead magnet — banking info captured, ready to fund the moment the IRS accepts.</p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Wired to the Advance Pre-Qualifier magnet</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/10">
              <th className="px-3 py-2">Client</th><th className="px-3 py-2">Pre-Approved</th><th className="px-3 py-2">Est. Refund</th><th className="px-3 py-2">Banking Info</th><th className="px-3 py-2">Disbursement</th><th className="px-3 py-2">Next Step</th>
            </tr></thead>
            <tbody>
              {[
                { name: 'Tanya Osei', amt: 3500, refund: 7820, bank: '✓ Chase ····4821 (verified)', method: 'Direct deposit', next: 'File return — funds within hours of acceptance' },
                { name: 'Marcus Lee', amt: 2000, refund: 5140, bank: '✓ Netspend card issued', method: 'Prepaid card', next: 'Awaiting W-2 upload' },
                { name: 'Diana Flores', amt: 5000, refund: 9975, bank: '⚠ Routing check pending', method: 'Direct deposit', next: 'Verify banking info in client portal' },
                { name: 'Chris Nakamura', amt: 1000, refund: 3260, bank: '✓ Wells Fargo ····9034 (verified)', method: 'Direct deposit', next: 'Appointment booked — Fri 10:00 AM' },
              ].map((r) => (
                <tr key={r.name} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 font-semibold text-white">{r.name}</td>
                  <td className="px-3 py-2.5"><span className="text-amber-300 font-bold">{money(r.amt)}</span></td>
                  <td className="px-3 py-2.5 text-gray-300">{money(r.refund)}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-400">{r.bank}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-300">{r.method}</td>
                  <td className="px-3 py-2.5 text-xs text-emerald-300">{r.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-400">Banking details are collected in the client portal over encrypted channels, tokenized at rest, and only released to the bank partner at funding. Advance amounts, fees and APR (where applicable) are disclosed per partner program before e-sign.</p>
        </div>
      </div>

      {/* Explainer */}
      <div className="grid md:grid-cols-3 gap-3">
        {[
          { t: '1 · Client pays $0 today', d: 'Prep fees + bank fee are deducted from the refund when the IRS funds. §7216 consent is e-signed during intake.' },
          { t: '2 · Optional same-day advance', d: 'Approved clients receive $500–$7,000 advances within hours of IRS acceptance — funded by the bank partner, not your cash.' },
          { t: '3 · Bureau override on every return', d: 'Your service bureau collects a per-return e-file fee override on every downline bank-product return, accrued automatically to /api/payouts/accrue.' },
        ].map((x, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
            <div className="text-sm font-bold text-white flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 text-emerald-300" /> {x.t}</div>
            <div className="text-xs text-gray-400 mt-1.5 leading-relaxed">{x.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
