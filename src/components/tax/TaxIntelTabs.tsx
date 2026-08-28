/**
 * TAX INTELLIGENCE TABS — IRS Tools, Calculators, Bank Products,
 * Audit Shield, Credentials. Fully functional, zero-key, driven by
 * the on-device IRS Intelligence engine.
 */
import { useMemo, useState } from 'react';
import {
  Search, ShieldCheck, AlertTriangle, Calculator, CreditCard, Award,
  TrendingUp, Clock, CheckCircle2, FileText, DollarSign, Landmark,
  ArrowRight, Scale, CalendarClock, Percent, BadgeCheck, Phone
} from 'lucide-react';
import {
  IRS_NOTICES, decodeNotice, NoticePlaybook, estimateRefund, RefundInput, FilingStatus,
  predictRefundTimeline, computePenalties, buildEstimateSchedule, withholdingCheckup,
  KEY_DEADLINES, STANDARD_DEDUCTION_2025, BRACKETS_2025,
} from '../../utils/irsIntelligence';

const card = 'bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl shadow-xl';
const label = 'text-[10px] font-black text-slate-400 uppercase tracking-widest';
const input = 'w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition font-mono';
const gold = 'text-[#D4AF37]';
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

/* ═══════════════════ IRS TOOLS TAB ═══════════════════ */
export function IRSToolsTab() {
  const [noticeQuery, setNoticeQuery] = useState('');
  const [decoded, setDecoded] = useState<NoticePlaybook | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleDecode = () => {
    const r = decodeNotice(noticeQuery);
    setDecoded(r); setNotFound(!r && noticeQuery.trim().length > 0);
  };

  return (
    <div className="space-y-6">
      {/* Notice decoder */}
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-black text-white flex items-center gap-2"><Search className={`h-5 w-5 ${gold}`} /> IRS Notice Decoder</h3>
        <p className="text-xs text-slate-400 mt-1">Type any IRS notice code (CP2000, 5071C, CP14, LT11…) — get the plain-English meaning, the statutory deadline, the resolution playbook, and the exact script to calm the client down.</p>
        <div className="flex gap-2 mt-4">
          <input value={noticeQuery} onChange={e => setNoticeQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDecode()} placeholder="e.g. CP2000 or 'client got letter 5071C'" className={input} />
          <button onClick={handleDecode} className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl text-xs shrink-0 active:scale-95">Decode</button>
        </div>
        {notFound && <p className="text-xs text-rose-400 mt-3 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Code not in the playbook library — check the notice's upper-right corner for the CP/LT number, or browse the library below.</p>}
        {decoded && (
          <div className="mt-5 border border-amber-500/25 rounded-2xl overflow-hidden">
            <div className={`px-5 py-4 flex flex-wrap items-center gap-3 ${decoded.severity === 'urgent' ? 'bg-red-500/10' : decoded.severity === 'action' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
              <span className="text-xl font-black font-mono text-white">{decoded.code}</span>
              <span className="text-sm font-bold text-slate-200">{decoded.title}</span>
              <span className={`px-2.5 py-0.5 text-[9px] font-black font-mono uppercase rounded-lg border ${decoded.severity === 'urgent' ? 'text-red-400 border-red-500/40 bg-red-500/10' : decoded.severity === 'action' ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'}`}>{decoded.severity}</span>
            </div>
            <div className="p-5 space-y-4 bg-neutral-950/60">
              <div><p className={label}>What it means</p><p className="text-sm text-slate-300 mt-1">{decoded.meaning}</p></div>
              <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                <Clock className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <div><p className="text-[10px] font-black text-red-400 uppercase">Deadline</p><p className="text-xs text-slate-300 mt-0.5">{decoded.deadline}</p></div>
              </div>
              <div>
                <p className={label}>Resolution playbook</p>
                <ol className="mt-2 space-y-2">{decoded.playbook.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300"><span className="h-5 w-5 shrink-0 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#D4AF37] text-[9px] font-black flex items-center justify-center">{i + 1}</span>{p}</li>
                ))}</ol>
              </div>
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3">
                <p className="text-[10px] font-black text-cyan-400 uppercase flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Say this to the client</p>
                <p className="text-xs text-slate-300 mt-1.5 italic">"{decoded.clientScript}"</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notice library */}
      <div className={`${card} p-6`}>
        <h3 className="text-sm font-black text-white flex items-center gap-2"><FileText className={`h-4 w-4 ${gold}`} /> Full Notice Playbook Library ({IRS_NOTICES.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {IRS_NOTICES.map(n => (
            <button key={n.code} onClick={() => { setDecoded(n); setNoticeQuery(n.code); setNotFound(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-left p-4 bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/30 rounded-2xl transition group">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-white text-sm group-hover:text-[#D4AF37]">{n.code}</span>
                <span className={`px-2 py-0.5 text-[8px] font-black font-mono uppercase rounded ${n.severity === 'urgent' ? 'text-red-400 bg-red-500/10' : n.severity === 'action' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>{n.severity}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{n.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Deadlines */}
      <div className={`${card} p-6`}>
        <h3 className="text-sm font-black text-white flex items-center gap-2"><CalendarClock className={`h-4 w-4 ${gold}`} /> Filing-Season Deadline Board (TY2025 → filed 2026)</h3>
        <div className="mt-4 space-y-2">
          {KEY_DEADLINES.map(d => {
            const past = new Date(d.date) < new Date();
            return (
              <div key={d.date} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${past ? 'border-neutral-800 bg-neutral-900/30 opacity-60' : 'border-amber-500/15 bg-amber-500/5'}`}>
                <span className={`font-mono text-xs font-black ${past ? 'text-slate-500 line-through' : gold}`}>{new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-xs text-slate-300">{d.label}</span>
                {past && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ CALCULATORS TAB ═══════════════════ */
export function CalculatorsTab() {
  // Refund estimator state
  const [status, setStatus] = useState<FilingStatus>('single');
  const [wages, setWages] = useState(65000);
  const [withheld, setWithheld] = useState(7800);
  const [seProfit, setSeProfit] = useState(0);
  const [kids, setKids] = useState(0);
  const [eitc, setEitc] = useState(false);
  const [itemized, setItemized] = useState(0);

  const result = useMemo(() => estimateRefund({
    status, wages, federalWithheld: withheld, seNetProfit: seProfit,
    qualifyingChildrenUnder17: kids, eitcEligible: eitc, itemizedDeductions: itemized,
  } as RefundInput), [status, wages, withheld, seProfit, kids, eitc, itemized]);

  // Penalty calculator
  const [balDue, setBalDue] = useState(5000);
  const [monthsLate, setMonthsLate] = useState(3);
  const [filedUnpaid, setFiledUnpaid] = useState(false);
  const penalties = useMemo(() => computePenalties(balDue, monthsLate, filedUnpaid), [balDue, monthsLate, filedUnpaid]);

  // Estimates
  const [priorTax, setPriorTax] = useState(12000);
  const [expectedTax, setExpectedTax] = useState(15000);
  const [highAgi, setHighAgi] = useState(false);
  const schedule = useMemo(() => buildEstimateSchedule(priorTax, expectedTax, highAgi), [priorTax, expectedTax, highAgi]);

  // Withholding
  const [whWages, setWhWages] = useState(85000);
  const [whCurrent, setWhCurrent] = useState(11000);
  const [whStatus, setWhStatus] = useState<FilingStatus>('mfj');
  const [whKids, setWhKids] = useState(2);
  const checkup = useMemo(() => withholdingCheckup(whWages, whCurrent, whStatus, whKids), [whWages, whCurrent, whStatus, whKids]);

  const statusSel = (v: FilingStatus, set: (s: FilingStatus) => void) => (
    <select value={v} onChange={e => set(e.target.value as FilingStatus)} className={input}>
      <option value="single">Single</option><option value="mfj">Married Filing Jointly</option>
      <option value="mfs">Married Filing Separately</option><option value="hoh">Head of Household</option>
      <option value="qss">Qualifying Surviving Spouse</option>
    </select>
  );
  const num = (v: number, set: (n: number) => void, placeholder = '') => (
    <input type="number" value={v || ''} placeholder={placeholder} onChange={e => set(Number(e.target.value) || 0)} className={input} />
  );

  return (
    <div className="space-y-6">
      {/* Refund estimator */}
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-black text-white flex items-center gap-2"><Calculator className={`h-5 w-5 ${gold}`} /> Federal Refund Estimator — TY2025 Engine</h3>
        <p className="text-xs text-slate-400 mt-1">Real 2025 brackets, standard deductions, CTC ($2,200/child), EITC, QBI and SE tax — computed live, on-device, no API.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5">
          <div className="space-y-3 lg:col-span-1">
            <div><p className={label}>Filing status</p>{statusSel(status, setStatus)}</div>
            <div><p className={label}>W-2 wages</p>{num(wages, setWages)}</div>
            <div><p className={label}>Federal tax withheld (W-2 Box 2)</p>{num(withheld, setWithheld)}</div>
            <div><p className={label}>Self-employment net profit</p>{num(seProfit, setSeProfit, '0')}</div>
            <div><p className={label}>Qualifying children under 17</p>{num(kids, setKids, '0')}</div>
            <div><p className={label}>Itemized deductions (0 = use standard)</p>{num(itemized, setItemized, '0')}</div>
            <button onClick={() => setEitc(!eitc)} className={`w-full py-2.5 rounded-xl text-xs font-black border transition ${eitc ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-slate-400'}`}>
              {eitc ? '✓ EITC eligible' : 'Check EITC eligibility'}
            </button>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className={`rounded-2xl p-6 border text-center ${result.refund >= 0 ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-red-500/5 border-red-500/25'}`}>
              <p className={label}>{result.refund >= 0 ? 'Estimated federal refund' : 'Estimated balance due'}</p>
              <p className={`text-5xl font-black font-mono mt-2 ${result.refund >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(Math.abs(result.refund))}</p>
              <div className="flex justify-center gap-6 mt-3 text-[11px] font-mono text-slate-400">
                <span>Effective rate: <b className="text-white">{(result.effectiveRate * 100).toFixed(1)}%</b></span>
                <span>Marginal bracket: <b className="text-white">{(result.marginalRate * 100).toFixed(0)}%</b></span>
              </div>
              {result.pathActHold && <p className="text-[10px] text-amber-400 mt-2 font-mono">⚠ PATH Act: EITC/ACTC refunds held until mid-February by federal law</p>}
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-4">
              <p className={label}>Line-by-line computation</p>
              <div className="mt-2 divide-y divide-neutral-800/70">
                {result.lines.map((l, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-400">{l.label}{l.note && <span className="text-slate-600 ml-2">({l.note})</span>}</span>
                    <span className={`font-mono font-bold ${l.amount < 0 ? 'text-emerald-400' : 'text-white'}`}>{l.amount < 0 ? `−${money(Math.abs(l.amount))}` : money(l.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Penalty calculator */}
        <div className={`${card} p-6`}>
          <h3 className="text-sm font-black text-white flex items-center gap-2"><Scale className={`h-4 w-4 ${gold}`} /> Penalty & Interest Calculator</h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div><p className={label}>Balance due</p>{num(balDue, setBalDue)}</div>
            <div><p className={label}>Months late</p>{num(monthsLate, setMonthsLate)}</div>
          </div>
          <button onClick={() => setFiledUnpaid(!filedUnpaid)} className={`w-full mt-3 py-2 rounded-xl text-xs font-black border transition ${filedUnpaid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-slate-400'}`}>
            {filedUnpaid ? '✓ Return WAS filed (unpaid only)' : 'Return NOT filed (worst case)'}
          </button>
          <div className="mt-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between"><span className="text-slate-400">Failure-to-file penalty</span><span className="text-red-400 font-black">{money(penalties.failureToFile)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Failure-to-pay penalty</span><span className="text-amber-400 font-black">{money(penalties.failureToPay)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Interest (compounding)</span><span className="text-amber-400 font-black">{money(penalties.interest)}</span></div>
            <div className="flex justify-between pt-2 border-t border-neutral-800"><span className="text-white font-black">Total cost of waiting</span><span className="text-red-400 font-black text-base">{money(penalties.total)}</span></div>
          </div>
          <ul className="mt-3 space-y-1.5">{penalties.explanation.map((e, i) => <li key={i} className="text-[10px] text-slate-500 flex gap-1.5"><span className="text-[#D4AF37]">•</span>{e}</li>)}</ul>
        </div>

        {/* Estimated payments */}
        <div className={`${card} p-6`}>
          <h3 className="text-sm font-black text-white flex items-center gap-2"><Landmark className={`h-4 w-4 ${gold}`} /> Quarterly Estimate Scheduler (Safe Harbor)</h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div><p className={label}>Prior-year total tax</p>{num(priorTax, setPriorTax)}</div>
            <div><p className={label}>Expected current-year tax</p>{num(expectedTax, setExpectedTax)}</div>
          </div>
          <button onClick={() => setHighAgi(!highAgi)} className={`w-full mt-3 py-2 rounded-xl text-xs font-black border transition ${highAgi ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-neutral-900 border-neutral-800 text-slate-400'}`}>
            {highAgi ? '✓ AGI over $150k (110% safe harbor)' : 'AGI under $150k (100% safe harbor)'}
          </button>
          <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
            <p className="text-[10px] font-black text-emerald-400 uppercase">Safe harbor basis</p>
            <p className="text-xs text-slate-300 mt-1">{schedule.safeHarborBasis}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {schedule.quarterly.map(q => (
              <div key={q.label} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-3 text-center">
                <p className="text-[10px] font-black text-slate-500">{q.label} · due {q.due}</p>
                <p className="text-lg font-black font-mono text-white mt-1">{money(q.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Withholding checkup */}
      <div className={`${card} p-6`}>
        <h3 className="text-sm font-black text-white flex items-center gap-2"><Percent className={`h-4 w-4 ${gold}`} /> Paycheck Withholding Checkup</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div><p className={label}>Annual wages</p>{num(whWages, setWhWages)}</div>
          <div><p className={label}>Projected annual withholding</p>{num(whCurrent, setWhCurrent)}</div>
          <div><p className={label}>Filing status</p>{statusSel(whStatus, setWhStatus)}</div>
          <div><p className={label}>Kids under 17</p>{num(whKids, setWhKids)}</div>
        </div>
        <div className={`mt-4 rounded-xl px-5 py-4 border ${Math.abs(checkup.projectedGap) < 500 ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-amber-500/5 border-amber-500/25'}`}>
          <div className="flex flex-wrap gap-6 text-xs font-mono mb-2">
            <span className="text-slate-400">Projected liability: <b className="text-white">{money(checkup.projectedTax)}</b></span>
            <span className="text-slate-400">Gap: <b className={checkup.projectedGap >= 0 ? 'text-emerald-400' : 'text-red-400'}>{checkup.projectedGap >= 0 ? '+' : '−'}{money(Math.abs(checkup.projectedGap))}</b></span>
          </div>
          <p className="text-xs text-slate-300">{checkup.recommendation}</p>
        </div>
      </div>

      {/* Bracket reference */}
      <div className={`${card} p-6`}>
        <h3 className="text-sm font-black text-white flex items-center gap-2"><TrendingUp className={`h-4 w-4 ${gold}`} /> 2025 Bracket & Deduction Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <p className={label}>Standard deductions (TY2025)</p>
            <div className="mt-2 space-y-1.5 text-xs font-mono">
              {Object.entries(STANDARD_DEDUCTION_2025).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-slate-400 uppercase">{k}</span><span className="text-white font-bold">{money(v)}</span></div>
              ))}
            </div>
          </div>
          <div>
            <p className={label}>Single-filer brackets</p>
            <div className="mt-2 space-y-1.5 text-xs font-mono">
              {BRACKETS_2025.single.map((b, i) => (
                <div key={i} className="flex justify-between"><span className={gold}>{(b.rate * 100).toFixed(0)}%</span><span className="text-slate-400">{b.upTo === Infinity ? 'over $626,350' : `up to ${money(b.upTo)}`}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ BANK PRODUCTS TAB ═══════════════════ */
const BANK_PRODUCTS = [
  { id: 'ra', name: 'Refund Advance', partner: 'Refund Advantage / EPS', range: '$250 – $7,000', cost: '0% APR options available (no-cost advances up to $1,500; fee-based tiers above)', timing: 'Approval in minutes at filing; funds same-day to prepaid card or 1–2 days ACH', bestFor: 'Clients who need money before the IRS pays — advance is repaid automatically from the refund', requirements: ['E-filed return through our office', 'Expected federal refund ≥ advance amount + fees', 'ID verification at signing', 'Bank product enrollment (RT) attached'] },
  { id: 'rt', name: 'Refund Transfer (RT)', partner: 'Santa Barbara TPG / Refund Advantage', range: 'Full refund amount', cost: '~$39.95 bank fee (one-time, from refund)', timing: 'Refund flows: IRS → bank → client, minus fees — client pays $0 out of pocket at filing', bestFor: 'Clients who can\'t or won\'t pay prep fees upfront — our fee comes out of the refund automatically', requirements: ['E-file with direct deposit', 'Government ID', 'Completed bank application at signing'] },
  { id: 'card', name: 'Prepaid Disbursement Card', partner: 'FasterMoney / Green Dot network', range: 'Any refund amount', cost: 'Card is free; standard reload/ATM network fees apply after', timing: 'Instant availability the moment the bank releases funds', bestFor: 'Unbanked clients — roughly 5% of filers have no account for direct deposit', requirements: ['Bank product enrollment', 'ID verification', 'Card activation at pickup or by mail'] },
  { id: 'advance-biz', name: 'Preparer Fee Advance', partner: 'EPS / TPG office programs', range: 'Up to 80% of expected season fees', cost: 'Program-dependent holdback', timing: 'Pre-season and in-season advances on fees receivable', bestFor: 'The PRACTICE — smooths cash flow so you can staff up in December before revenue arrives', requirements: ['Prior-season funding history', 'Office enrollment agreement', 'Projected volume documentation'] },
];

export function BankProductsTab() {
  const [selected, setSelected] = useState(BANK_PRODUCTS[0]);
  return (
    <div className="space-y-6">
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-black text-white flex items-center gap-2"><CreditCard className={`h-5 w-5 ${gold}`} /> Bank Products Suite</h3>
        <p className="text-xs text-slate-400 mt-1">Refund advances, refund transfers, and disbursement options — how clients get paid faster and how the practice collects fees with zero out-of-pocket friction.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {BANK_PRODUCTS.map(p => (
            <button key={p.id} onClick={() => setSelected(p)} className={`p-4 rounded-2xl border text-left transition ${selected.id === p.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-neutral-900/40 border-neutral-800 hover:border-amber-500/25'}`}>
              <DollarSign className={`h-5 w-5 ${selected.id === p.id ? gold : 'text-slate-500'}`} />
              <p className={`text-xs font-black mt-2 ${selected.id === p.id ? 'text-white' : 'text-slate-300'}`}>{p.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{p.range}</p>
            </button>
          ))}
        </div>
        <div className="mt-5 border border-amber-500/20 rounded-2xl p-6 bg-neutral-950/50 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-base font-black text-white">{selected.name}</h4>
            <span className="text-[10px] font-mono text-slate-500">Partner: {selected.partner}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-neutral-900/50 rounded-xl p-4"><p className={label}>Amount range</p><p className="text-slate-200 font-bold mt-1">{selected.range}</p></div>
            <div className="bg-neutral-900/50 rounded-xl p-4"><p className={label}>Cost structure</p><p className="text-slate-200 mt-1">{selected.cost}</p></div>
            <div className="bg-neutral-900/50 rounded-xl p-4"><p className={label}>Funding timing</p><p className="text-slate-200 mt-1">{selected.timing}</p></div>
          </div>
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3">
            <p className="text-[10px] font-black text-cyan-400 uppercase">Best for</p>
            <p className="text-xs text-slate-300 mt-1">{selected.bestFor}</p>
          </div>
          <div>
            <p className={label}>Enrollment requirements</p>
            <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {selected.requirements.map((r, i) => <li key={i} className="flex items-center gap-2 text-xs text-slate-300"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />{r}</li>)}
            </ul>
          </div>
        </div>
      </div>
      <div className={`${card} p-6`}>
        <h3 className="text-sm font-black text-white flex items-center gap-2"><ShieldCheck className={`h-4 w-4 ${gold}`} /> Compliance Guardrails (non-negotiable)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs text-slate-300">
          {[
            'Advance/RT fees must be disclosed in writing BEFORE the client signs Form 8879 — surprise fees are the #1 source of bank-product complaints and state AG actions.',
            'Never condition preparation on buying a bank product. It is always optional and the client can direct-deposit for free.',
            'IRC §7216 consent is required before using return data for the bank application — collect the signed consent inside the portal flow.',
            'Advances are loans: quote the APR-equivalent for fee-based tiers, and never call a fee-based advance "free money."',
          ].map((t, i) => <div key={i} className="flex items-start gap-2 bg-neutral-900/40 border border-neutral-800 rounded-xl px-4 py-3"><AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />{t}</div>)}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ AUDIT SHIELD TAB ═══════════════════ */
const AUDIT_TRIGGERS = [
  { flag: 'Schedule C losses year after year', risk: 'high', why: 'Repeated losses invite hobby-loss (§183) scrutiny — the IRS presumes profit motive if profitable 3 of 5 years.', defense: 'Business plan on file, separate bank account, time logs, and marketing evidence of profit intent.' },
  { flag: 'Round numbers everywhere', risk: 'medium', why: '$5,000 of "supplies" and $2,000 of "travel" read as estimates, not records.', defense: 'Enter actual totals from receipts/exports — real numbers are rarely round.' },
  { flag: 'Very high charitable deductions vs. income', risk: 'medium', why: 'Donations far above the norm for the AGI band get DIF-score attention.', defense: 'Contemporaneous receipts; appraisals + Form 8283 for non-cash over $5,000.' },
  { flag: '100% business-use vehicle', risk: 'high', why: 'Claiming zero personal use of the only household vehicle is rarely credible.', defense: 'Mileage log with dates, destinations, business purpose — apps or calendar reconstruction.' },
  { flag: 'Unreported 1099/W-2 income', risk: 'high', why: 'Automated underreporter matching (CP2000) catches nearly every mismatch — this is the most common "audit" of all.', defense: 'Our Document Intelligence cross-checks every source form against the return before filing.' },
  { flag: 'Large home office', risk: 'low', why: 'Post-2013 simplified method reduced abuse; legitimate claims are routine.', defense: 'Exclusive-use photos, square-footage math on file, simplified method when marginal.' },
  { flag: 'EITC with self-employment income', risk: 'high', why: 'SE income that lands exactly at the EITC sweet spot is a known fraud pattern — preparers face §6695(g) due-diligence penalties.', defense: 'Form 8867 completed honestly, income substantiation collected (ledgers, deposits), records retained 3 years.' },
  { flag: 'Crypto activity without reporting', risk: 'high', why: 'The digital-asset question is on page 1 of the 1040; exchanges now issue 1099-DA. Silent inconsistency is willful.', defense: 'Full 8949/Schedule D from exchange exports; answer the digital-asset question accurately, always.' },
];

export function AuditShieldTab() {
  const [protection, setProtection] = useState(true);
  return (
    <div className="space-y-6">
      <div className={`${card} p-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2"><ShieldCheck className={`h-5 w-5 ${gold}`} /> Audit Shield — Protection Plan & Risk Radar</h3>
            <p className="text-xs text-slate-400 mt-1">Every return we file is scored against the 8 highest-frequency audit triggers before transmission. Protection plan covers full representation if the IRS ever comes calling.</p>
          </div>
          <button onClick={() => setProtection(!protection)} className={`px-5 py-3 rounded-2xl text-xs font-black border transition shrink-0 ${protection ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-slate-400'}`}>
            {protection ? '✓ Protection Plan: ACTIVE on new returns' : 'Protection Plan: OFF'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {[
            { t: 'Pre-Filing Risk Scan', d: 'DIF-style trigger check runs on every return before e-file — flags anything in the table below with the fix.', icon: Search },
            { t: 'Full Representation', d: 'If audited: an EA/CPA responds, attends, and negotiates. Client never faces the IRS alone. POA (Form 2848) filed day one.', icon: Scale },
            { t: 'Notice Concierge', d: 'Every IRS letter routed through the Notice Decoder + same-day client reassurance (see IRS Tools tab + automation recipe).', icon: FileText },
          ].map((x, i) => (
            <div key={i} className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5">
              <x.icon className={`h-5 w-5 ${gold}`} />
              <p className="text-sm font-black text-white mt-2">{x.t}</p>
              <p className="text-xs text-slate-400 mt-1">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={`${card} p-6`}>
        <h3 className="text-sm font-black text-white">Audit Trigger Radar — the 8 patterns that actually get returns pulled</h3>
        <div className="mt-4 space-y-3">
          {AUDIT_TRIGGERS.map((t, i) => (
            <div key={i} className="border border-neutral-800 rounded-2xl p-5 bg-neutral-900/30">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 text-[9px] font-black font-mono uppercase rounded-lg ${t.risk === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/25' : t.risk === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'}`}>{t.risk} risk</span>
                <p className="text-sm font-bold text-white">{t.flag}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                <div className="bg-neutral-950/50 rounded-xl px-4 py-3"><p className="text-[9px] font-black text-slate-500 uppercase">Why it flags</p><p className="text-slate-300 mt-1">{t.why}</p></div>
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3"><p className="text-[9px] font-black text-emerald-400 uppercase">Our defense protocol</p><p className="text-slate-300 mt-1">{t.defense}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ CREDENTIALS TAB ═══════════════════ */
export function CredentialsTab() {
  const CREDS = [
    { name: 'PTIN — Preparer Tax Identification Number', status: 'current', number: 'P01234567', expires: 'Dec 31, 2026', note: 'Required for EVERY person who prepares returns for compensation. Renews annually Oct–Dec at irs.gov/ptin ($19.75). Preparing for pay without a PTIN = $50/return penalty (§6695(c)).', renewal: 'Annual renewal window opens mid-October' },
    { name: 'EFIN — Electronic Filing Identification Number', status: 'current', number: '123456', expires: 'No expiration (subject to suitability)', note: 'One per firm, issued after IRS e-file application + fingerprinting + suitability check (45-day process — apply in summer, never in December). Must e-file if preparing 11+ returns/year. NEVER share or rent an EFIN — that\'s how firms get shut down.', renewal: 'Update within 30 days of any office/officer change' },
    { name: 'EA — Enrolled Agent (staff: 2 active)', status: 'current', number: 'On file per preparer', expires: 'Rolling 3-year cycle', note: 'Unlimited IRS representation rights (audits, collections, appeals — all 50 states). Requires SEE exam (3 parts) or 5 years IRS experience, plus 72 hours CE per 3-year cycle (min 16/yr incl. 2 ethics).', renewal: 'CE tracked per-preparer on the Preparers page scorecards' },
    { name: 'AFSP — Annual Filing Season Program', status: 'action', number: '3 preparers enrolled', expires: 'Annually', note: 'For non-credentialed staff: 18 hours CE (incl. 6-hr AFTR course) earns limited representation rights for returns they prepared + directory listing. Deadline: Dec 31 each year.', renewal: '2 staff still need AFTR completion before Dec 31' },
    { name: 'IRS WISP — Written Information Security Plan', status: 'current', number: 'v3.2 on file', expires: 'Annual review required', note: 'Mandatory under FTC Safeguards Rule + IRS Pub 4557 for ALL preparers. Ours covers: encryption at rest/in transit, MFA on every system, incident response, vendor management, and the annual staff training log.', renewal: 'Auto-reminder workflow fires January 1 (see Workflows → compliance)' },
    { name: 'E&O — Errors & Omissions Insurance', status: 'current', number: '$1M / $2M aggregate', expires: 'Jul 1, 2027', note: 'Covers preparation errors, missed elections, and audit-triggered damages. Bank products and representation work both require active coverage.', renewal: '90-day renewal reminder wired to Notifications' },
  ];
  return (
    <div className="space-y-6">
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-black text-white flex items-center gap-2"><Award className={`h-5 w-5 ${gold}`} /> Practice Credentials & Compliance Locker</h3>
        <p className="text-xs text-slate-400 mt-1">Every license, number, and mandate that keeps this practice legally allowed to prepare, e-file, represent, and hold client data — with live renewal tracking.</p>
        <div className="mt-5 space-y-4">
          {CREDS.map((c, i) => (
            <div key={i} className={`border rounded-2xl p-5 ${c.status === 'action' ? 'border-amber-500/30 bg-amber-500/5' : 'border-neutral-800 bg-neutral-900/30'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <BadgeCheck className={`h-5 w-5 ${c.status === 'action' ? 'text-amber-400' : 'text-emerald-400'}`} />
                <p className="text-sm font-black text-white">{c.name}</p>
                <span className={`px-2.5 py-0.5 text-[9px] font-black font-mono uppercase rounded-lg ${c.status === 'action' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'}`}>{c.status === 'action' ? 'action needed' : 'current'}</span>
                <span className="ml-auto text-[10px] font-mono text-slate-500">{c.number} · {c.expires}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{c.note}</p>
              <p className="text-[10px] font-mono text-[#D4AF37] mt-2 flex items-center gap-1.5"><ArrowRight className="h-3 w-3" /> {c.renewal}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ REFUND TIMELINE WIDGET (used in refunds tab) ═══════════════════ */
export function RefundTimelineWidget() {
  const [filed, setFiled] = useState('2026-02-02');
  const [method, setMethod] = useState<'efile' | 'paper'>('efile');
  const [deposit, setDeposit] = useState<'direct' | 'check'>('direct');
  const [path, setPath] = useState(false);
  const milestones = useMemo(() => predictRefundTimeline({ filedDate: new Date(filed + 'T12:00:00'), method, deposit, hasEitcOrActc: path }), [filed, method, deposit, path]);
  return (
    <div className={`${card} p-6`}>
      <h3 className="text-sm font-black text-white flex items-center gap-2"><Clock className={`h-4 w-4 ${gold}`} /> Refund Timeline Predictor — tell the client the date, not "soon"</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div><p className={label}>Filing date</p><input type="date" value={filed} onChange={e => setFiled(e.target.value)} className={input} /></div>
        <div><p className={label}>Method</p><select value={method} onChange={e => setMethod(e.target.value as any)} className={input}><option value="efile">E-file</option><option value="paper">Paper mail</option></select></div>
        <div><p className={label}>Refund delivery</p><select value={deposit} onChange={e => setDeposit(e.target.value as any)} className={input}><option value="direct">Direct deposit</option><option value="check">Paper check</option></select></div>
        <div className="flex items-end"><button onClick={() => setPath(!path)} className={`w-full py-2.5 rounded-xl text-xs font-black border transition ${path ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-neutral-900 border-neutral-800 text-slate-400'}`}>{path ? '✓ EITC/ACTC claimed' : 'EITC/ACTC?'}</button></div>
      </div>
      <div className="mt-5 space-y-0">
        {milestones.map((m, i) => (
          <div key={i} className="relative pl-10 pb-5 last:pb-0">
            {i < milestones.length - 1 && <div className="absolute left-[13px] top-7 bottom-0 w-px bg-neutral-800" />}
            <div className={`absolute left-0 top-0.5 h-7 w-7 rounded-full border flex items-center justify-center ${m.status === 'done' ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400' : m.status === 'active' ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 animate-pulse' : 'bg-neutral-900 border-neutral-800 text-slate-600'}`}>
              {m.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-sm font-black text-white">{m.label}</p>
              <p className={`text-[11px] font-mono font-bold ${m.status === 'done' ? 'text-emerald-400' : gold}`}>{m.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">{m.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
