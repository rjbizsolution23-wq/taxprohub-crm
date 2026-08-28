/**
 * AI WORKBENCHES — the specialist AI tabs: Agents fleet, Document Parser,
 * Year-Round Tax Agent, Refund Maximizer, and zero-key Voice Mode
 * (Web Speech API — recognition + synthesis run entirely in the browser).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, Bot, Mic, MicOff, Volume2, ScanLine, TrendingUp, Sparkles,
  ArrowRight, CheckCircle2, Activity, Zap, ShieldCheck, FileText,
  DollarSign, AlertTriangle, Play, Pause, MessageSquare, Calculator
} from 'lucide-react';
import { estimateRefund, FilingStatus, decodeNotice, RETIREMENT_LIMITS_2025, KEY_DEADLINES } from '../../utils/irsIntelligence';

const card = 'bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl shadow-xl';
const gold = 'text-[#D4AF37]';
const label = 'text-[10px] font-black text-slate-400 uppercase tracking-widest';

/* ═══════════════════ AI AGENTS FLEET ═══════════════════ */
const AGENTS = [
  { id: 'intake', name: 'Intake Agent', status: 'active', model: 'Document Intelligence (on-device)', jobs: 'Reads every uploaded document with OCR, classifies against 17 IRS form schemas, extracts client data, auto-fills the CRM, and flags anything blurry or missing.', wiredTo: ['/documents', 'Contacts', 'Deals'], runsToday: 34, approval: 'Autonomous — human reviews low-confidence fields only' },
  { id: 'notice', name: 'Notice Resolution Agent', status: 'active', model: 'IRS Intelligence engine (on-device)', jobs: 'Classifies incoming IRS letters (CP2000, 5071C, CP14…), drafts the client reassurance message, attaches the statutory playbook, and creates the priority preparer task with deadline.', wiredTo: ['/tax?tab=irs', 'Workflows → IRS Notice Intake', 'Conversations'], runsToday: 6, approval: 'Autonomous classification — preparer approves the IRS response before sending' },
  { id: 'drip', name: 'Lifecycle Drip Agent', status: 'active', model: 'Drip engine + exit-condition monitor', jobs: 'Enrolls contacts into the right sequence on trigger events, personalizes merge tokens, halts drips instantly on reply/booking/filing, and hands contacts between sequences at lifecycle stage changes.', wiredTo: ['/campaigns', '/workflows', 'Pipelines'], runsToday: 212, approval: 'Fully autonomous — sequences are pre-approved copy' },
  { id: 'refund', name: 'Refund Watch Agent', status: 'active', model: 'Timeline predictor + milestone notifier', jobs: 'Predicts each refund date from filing method + credits, sends milestone updates (accepted → approved → sent), and escalates to a preparer task at day 21 with no movement.', wiredTo: ['/tax?tab=refunds', 'Campaigns → Refund Concierge'], runsToday: 89, approval: 'Autonomous updates — escalations create human tasks' },
  { id: 'funnel', name: 'Funnel Architect Agent', status: 'active', model: 'LLM (4-stage pipeline + quality gate)', jobs: 'Generates unique multi-page funnels from a one-line prompt: strategy, per-page copy with narrative continuity, nurture campaign, and an 8-point quality gate that rejects thin output.', wiredTo: ['/genie', 'Funnels', 'Campaigns'], runsToday: 3, approval: 'Human deploys — agent generates and validates' },
  { id: 'payout', name: 'Payout Ledger Agent', status: 'standby', model: 'Rules engine + Stripe Connect', jobs: 'Accrues preparer commissions per filed return, bundles bi-weekly payout batches, and disburses on admin approval via Stripe Connect with itemized statements.', wiredTo: ['/preparers', 'Workflows → Payout Cycle', '/api/payouts/*'], runsToday: 0, approval: 'Human approval gate on every disbursement batch' },
];

export function AgentsTab() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-black text-white flex items-center gap-2"><Cpu className={`h-5 w-5 ${gold}`} /> Autonomous Agent Fleet</h3>
        <p className="text-xs text-slate-400 mt-1">Six specialist agents run the practice with minimal human approval — each one lists exactly what it does, what it's wired to, and where the human gate sits.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
          {AGENTS.map(a => (
            <div key={a.id} className="border border-neutral-800 rounded-2xl p-5 bg-neutral-900/30 hover:border-amber-500/25 transition">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${a.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-neutral-900 border-neutral-800'}`}>
                  <Bot className={`h-5 w-5 ${a.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{a.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{a.model}</p>
                </div>
                <span className={`ml-auto px-2.5 py-0.5 text-[9px] font-black font-mono uppercase rounded-lg ${a.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-neutral-900 text-slate-500 border border-neutral-800'}`}>{a.status}</span>
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">{a.jobs}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.wiredTo.map(w => (
                  <button key={w} onClick={() => w.startsWith('/') && !w.startsWith('/api') && navigate(w)} className="px-2.5 py-1 text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10 transition">{w}</button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">Runs today: <b className="text-white">{a.runsToday}</b></span>
                <span className="text-amber-400/80 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {a.approval}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ DOCUMENT PARSER TAB ═══════════════════ */
export function ParserTab() {
  const navigate = useNavigate();
  const SCHEMAS = ['W-2', '1099-NEC', '1099-MISC', '1099-INT', '1099-DIV', '1099-B', '1099-R', '1099-K', '1099-G', '1098', '1098-T', 'SSA-1099', 'K-1', '1040', '940/941', 'Driver License', 'Passport'];
  return (
    <div className="space-y-6">
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-black text-white flex items-center gap-2"><ScanLine className={`h-5 w-5 ${gold}`} /> Document Parser Console</h3>
        <p className="text-xs text-slate-400 mt-1">The parsing brain behind Document Intelligence: on-device OCR (Tesseract WASM + PDF.js text layer) feeding 17 deterministic IRS form schemas with box-by-box extraction, confidence scoring, and SSN masking. Zero API keys, zero data leaving the browser.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {[
            { t: 'Stage 1 — Capture', d: 'Drag-drop PDFs or phone photos. Born-digital PDFs skip OCR entirely via the text-layer fast path; scans get high-DPI rasterization first.', icon: FileText },
            { t: 'Stage 2 — Classify & Extract', d: 'Form detected against 17 schemas; every box extracted with a confidence score and an audit snippet showing exactly where the value came from.', icon: ScanLine },
            { t: 'Stage 3 — CRM Injection', d: 'Client, income, and withholding data auto-fills contacts and deals with dedupe (email → SSN last-4 → name). Circular 230 §10.22 validators flag inconsistencies.', icon: Zap },
          ].map((s, i) => (
            <div key={i} className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5">
              <s.icon className={`h-5 w-5 ${gold}`} />
              <p className="text-sm font-black text-white mt-2">{s.t}</p>
              <p className="text-xs text-slate-400 mt-1">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <p className={label}>17 supported schemas</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SCHEMAS.map(s => <span key={s} className="px-3 py-1.5 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/5 border border-amber-500/20 rounded-lg">{s}</span>)}
          </div>
        </div>
        <button onClick={() => navigate('/documents')} className="mt-5 px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-2xl text-xs flex items-center gap-2 active:scale-95 transition">
          Open Document Intelligence — parse a real document <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════ YEAR-ROUND TAX AGENT TAB ═══════════════════ */
export function YearRoundTab() {
  const [month, setMonth] = useState(new Date().getMonth());
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const PLAYBOOK: Record<number, { focus: string; actions: string[] }> = {
    0: { focus: 'Season launch', actions: ['Season Kickoff Blast fires (Jan 15) — all unfiled clients enter the Filing Push drip', 'Q4 estimated payment reminder (due Jan 15)', 'W-2/1099 watch: employers must issue by Jan 31', 'WISP annual review workflow triggers'] },
    1: { focus: 'Early-filer wave', actions: ['PATH Act refund release mid-Feb — Refund Watch Agent notifies EITC/ACTC clients', 'Corrected 1099 monitoring for brokerage clients', 'Speed-to-lead at maximum: ad spend peaks now'] },
    2: { focus: 'Business deadline + peak volume', actions: ['S-corp/partnership returns due Mar 16 — K-1 distribution to personal returns', 'Preparation queue SLA monitoring on preparer scorecards', 'Extension candidates identified and safe-harbor payments calculated'] },
    3: { focus: 'THE deadline', actions: ['April 15: individual filing + payment + Q1 estimate + IRA/HSA funding deadline', 'Form 4868 batch for extenders → Compliance Guardian drip enrolls', 'Post-deadline: Refund Concierge running for all filed clients'] },
    4: { focus: 'Post-season recovery', actions: ['Review-harvest wave (deposit-week asks firing)', 'Referral Engine at full volume', 'Amendment opportunities review: prior-year missed credits'] },
    5: { focus: 'Extension prep + Q2', actions: ['Q2 estimated payment SMS (due Jun 15)', 'Summer slot invitations to extended filers — quietest prep window of the year', 'Mid-year withholding checkups for clients with big refunds/bills'] },
    6: { focus: 'Mid-year strategy', actions: ['Mid-Year Tax Wellness check-in workflow', 'Entity conversion analysis window (S-corp elections for next year)', 'Bookkeeping catch-up offers to Schedule C clients'] },
    7: { focus: 'Quiet-season building', actions: ['Win-back sequences to dormant past clients', 'Content and funnel building for next season (Funnel Architect)', 'Staff CE hours: AFSP/AFTR course completion tracking'] },
    8: { focus: 'Q3 + extension runway', actions: ['Q3 estimated payment SMS (due Sep 15)', 'Extended business returns due Sep 15', 'September pre-deadline file reviews for all October filers'] },
    9: { focus: 'Extension deadline', actions: ['October 15: extended individual returns due — Guardian final-week escalations', 'Unclaimed-refund sweep: 3-year lookback expirations', 'Season postmortem: preparer scorecards + payout reconciliation'] },
    10: { focus: 'Next-season planning', actions: ['Nov 1: high-AGI tax-planning campaign fires', 'Year-end move window: harvest losses, bunch deductions, fund retirement', 'PTIN renewal window opens — credential tracker alerts'] },
    11: { focus: 'Year-end close', actions: ['Dec 31 hard deadlines: 401(k) contributions, charitable gifts, RMDs', 'AFSP/AFTR completion deadline for staff', 'Season capacity plan: preparer load board + fee advance programs'] },
  };
  const p = PLAYBOOK[month];
  return (
    <div className="space-y-6">
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-black text-white flex items-center gap-2"><Sparkles className={`h-5 w-5 ${gold}`} /> Year-Round Tax Agent — the practice never sleeps</h3>
        <p className="text-xs text-slate-400 mt-1">Twelve monthly playbooks keep every client compliant and every revenue window open. The workflows and drips on this platform execute each item automatically.</p>
        <div className="flex flex-wrap gap-1.5 mt-5">
          {MONTHS.map((m, i) => (
            <button key={m} onClick={() => setMonth(i)} className={`px-3.5 py-2 text-[11px] font-black rounded-xl border transition ${month === i ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37]' : 'bg-neutral-900/40 border-neutral-800 text-slate-400 hover:text-white'}`}>{m.slice(0, 3)}</button>
          ))}
        </div>
        <div className="mt-5 border border-amber-500/20 rounded-2xl p-6 bg-neutral-950/50">
          <p className="text-base font-black text-white">{MONTHS[month]} — <span className={gold}>{p.focus}</span></p>
          <ul className="mt-3 space-y-2.5">
            {p.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={`${card} p-6`}>
        <h3 className="text-sm font-black text-white flex items-center gap-2"><Activity className={`h-4 w-4 ${gold}`} /> Standing deadline radar</h3>
        <div className="mt-3 space-y-2">
          {KEY_DEADLINES.slice(0, 6).map(d => (
            <div key={d.date} className="flex items-center gap-3 text-xs px-4 py-2.5 bg-neutral-900/40 border border-neutral-800 rounded-xl">
              <span className={`font-mono font-black ${gold}`}>{new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="text-slate-300">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ REFUND MAXIMIZER TAB ═══════════════════ */
export function RefundMaximizerTab() {
  const [status, setStatus] = useState<FilingStatus>('single');
  const [wages, setWages] = useState(72000);
  const [withheld, setWithheld] = useState(9000);
  const [seProfit, setSeProfit] = useState(12000);
  const [kids, setKids] = useState(1);

  const base = useMemo(() => estimateRefund({ status, wages, federalWithheld: withheld, seNetProfit: seProfit, qualifyingChildrenUnder17: kids }), [status, wages, withheld, seProfit, kids]);

  const moves = useMemo(() => {
    const list: { name: string; delta: number; how: string }[] = [];
    const L = RETIREMENT_LIMITS_2025;
    if (seProfit > 0) {
      const withIra = estimateRefund({ status, wages: wages - L.ira, federalWithheld: withheld, seNetProfit: seProfit, qualifyingChildrenUnder17: kids });
      list.push({ name: `Max traditional IRA ($${L.ira.toLocaleString()})`, delta: withIra.refund - base.refund, how: 'Deductible up to the limit if not covered by a workplace plan (phaseouts apply if covered). Fundable until April 15.' });
      const halfSe = estimateRefund({ status, wages, federalWithheld: withheld, seNetProfit: Math.max(0, seProfit - 5000), qualifyingChildrenUnder17: kids });
      list.push({ name: 'Find $5,000 of missed business expenses', delta: halfSe.refund - base.refund, how: 'Mileage, home office, phone/internet %, software, supplies — the average Schedule C we review is missing $4–7k in legitimate expenses.' });
    } else {
      const withIra = estimateRefund({ status, wages: wages - L.ira, federalWithheld: withheld, qualifyingChildrenUnder17: kids });
      list.push({ name: `Max traditional IRA ($${L.ira.toLocaleString()})`, delta: withIra.refund - base.refund, how: 'Reduces AGI dollar-for-dollar. Fundable until April 15 for the prior year.' });
    }
    const withHsa = estimateRefund({ status, wages: wages - L.hsaSelf, federalWithheld: withheld, seNetProfit: seProfit, qualifyingChildrenUnder17: kids });
    list.push({ name: `Max HSA — self-only ($${L.hsaSelf.toLocaleString()})`, delta: withHsa.refund - base.refund, how: 'Requires a high-deductible health plan. Triple tax advantage: deductible in, grows tax-free, tax-free out for medical.' });
    if (status === 'single' && kids > 0) {
      const hoh = estimateRefund({ status: 'hoh', wages, federalWithheld: withheld, seNetProfit: seProfit, qualifyingChildrenUnder17: kids });
      list.push({ name: 'Filing status check: Head of Household', delta: hoh.refund - base.refund, how: 'If you paid >half the cost of keeping up a home for a qualifying child — bigger standard deduction AND wider brackets.' });
    }
    return list.filter(m => m.delta > 0).sort((a, b) => b.delta - a.delta);
  }, [base, status, wages, withheld, seProfit, kids]);

  const input = 'w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition font-mono';
  const money = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-black text-white flex items-center gap-2"><TrendingUp className={`h-5 w-5 ${gold}`} /> Refund Maximizer — quantified moves, real bracket math</h3>
        <p className="text-xs text-slate-400 mt-1">Enter the client's basics; the engine re-runs the full TY2025 computation for each optimization and shows the exact dollar impact. No hand-waving.</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          <div><p className={label}>Status</p>
            <select value={status} onChange={e => setStatus(e.target.value as FilingStatus)} className={input}>
              <option value="single">Single</option><option value="mfj">MFJ</option><option value="hoh">HoH</option><option value="mfs">MFS</option>
            </select></div>
          <div><p className={label}>W-2 wages</p><input type="number" value={wages || ''} onChange={e => setWages(Number(e.target.value) || 0)} className={input} /></div>
          <div><p className={label}>Withheld</p><input type="number" value={withheld || ''} onChange={e => setWithheld(Number(e.target.value) || 0)} className={input} /></div>
          <div><p className={label}>SE profit</p><input type="number" value={seProfit || ''} onChange={e => setSeProfit(Number(e.target.value) || 0)} className={input} /></div>
          <div><p className={label}>Kids &lt;17</p><input type="number" value={kids || ''} onChange={e => setKids(Number(e.target.value) || 0)} className={input} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className={`rounded-2xl p-5 border text-center ${base.refund >= 0 ? 'bg-neutral-900/50 border-neutral-800' : 'bg-red-500/5 border-red-500/25'}`}>
            <p className={label}>Baseline (as-is)</p>
            <p className={`text-3xl font-black font-mono mt-1 ${base.refund >= 0 ? 'text-white' : 'text-red-400'}`}>{base.refund >= 0 ? money(base.refund) : `−${money(base.refund)}`}</p>
          </div>
          <div className="rounded-2xl p-5 border border-emerald-500/25 bg-emerald-500/5 text-center">
            <p className={label}>With all moves applied (additive est.)</p>
            <p className="text-3xl font-black font-mono mt-1 text-emerald-400">{money(base.refund + moves.reduce((n, m) => n + m.delta, 0))}</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {moves.length === 0 && <p className="text-xs text-slate-500">No positive-impact moves at these inputs — this profile is already optimized against the standard levers.</p>}
          {moves.map((m, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center gap-3 border border-neutral-800 rounded-2xl p-5 bg-neutral-900/30">
              <div className="flex items-center gap-3 md:w-72 shrink-0">
                <DollarSign className="h-5 w-5 text-emerald-400 shrink-0" />
                <p className="text-sm font-black text-white">{m.name}</p>
              </div>
              <p className="text-xs text-slate-400 flex-1">{m.how}</p>
              <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-mono font-black text-sm shrink-0">+{money(m.delta)}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-4 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> Estimates use simplified phaseouts; combined-move totals are additive approximations. Final numbers come from the prepared return.</p>
      </div>
    </div>
  );
}

/* ═══════════════════ VOICE MODE TAB (zero-key Web Speech API) ═══════════════════ */
export function VoiceModeTab() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setTranscript(text);
      if (e.results[e.results.length - 1].isFinal) answer(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch { /* noop */ } window.speechSynthesis?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** On-device tax Q&A: notice codes, deadlines, quick refund math, common questions */
  const answer = (q: string) => {
    const lower = q.toLowerCase();
    let r = '';
    const notice = decodeNotice(q);
    if (notice) {
      r = `That's IRS notice ${notice.code} — ${notice.title}. ${notice.meaning} Deadline: ${notice.deadline}. First move: ${notice.playbook[0]}`;
    } else if (/deadline|due date|when.*(file|due)/.test(lower)) {
      r = 'Individual returns are due April 15, 2026. Extensions push filing to October 15, but payment is still due in April. Quarterly estimates land April 15, June 15, September 15, and January 15.';
    } else if (/refund.*(long|when|take)|when.*refund/.test(lower)) {
      r = 'E-filed returns with direct deposit typically pay within 21 days of IRS acceptance. EITC and Additional Child Tax Credit refunds are held until mid-February by the PATH Act. Paper returns add a month or more.';
    } else if (/standard deduction/.test(lower)) {
      r = 'For tax year 2025: fifteen thousand seven fifty for single filers, thirty-one thousand five hundred married filing jointly, and twenty-three thousand six twenty-five for head of household.';
    } else if (/extension/.test(lower)) {
      r = 'Form 4868 extends filing to October 15 — but not payment. Pay a safe-harbor amount in April to avoid the half-percent monthly failure-to-pay penalty and interest.';
    } else if (/child tax credit|ctc/.test(lower)) {
      r = 'The 2025 Child Tax Credit is twenty-two hundred dollars per qualifying child under 17, with up to seventeen hundred refundable. It phases out above 200 thousand AGI single, 400 thousand joint.';
    } else if (/audit/.test(lower)) {
      r = 'Biggest real-world audit triggers: unreported 1099 income, repeated Schedule C losses, EITC with self-employment income, and 100 percent business vehicle use. Check the Audit Shield tab for the full radar and defenses.';
    } else if (/quarterly|estimated/.test(lower)) {
      r = 'Safe harbor: pay 100 percent of last year\'s tax — 110 percent if AGI topped 150 thousand — or 90 percent of this year\'s, whichever is less, in four equal installments.';
    } else {
      r = 'I heard: "' + q + '". I can answer instantly about IRS notices, deadlines, refund timing, the standard deduction, extensions, the child tax credit, audits, and estimated payments — or open the AI Assistant chat for full LLM-powered answers on anything else.';
    }
    setReply(r);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(r);
      u.rate = 1.02; u.onend = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    }
  };

  const toggle = () => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); setListening(false); }
    else { setTranscript(''); setReply(''); recRef.current.start(); setListening(true); }
  };

  return (
    <div className="space-y-6">
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-black text-white flex items-center gap-2"><Mic className={`h-5 w-5 ${gold}`} /> Voice Mode — hands-free tax answers, zero API keys</h3>
        <p className="text-xs text-slate-400 mt-1">Speech recognition and synthesis run natively in the browser (Web Speech API). Ask about notices, deadlines, credits, refund timing — it answers out loud from the on-device IRS Intelligence engine.</p>
        {!supported && (
          <div className="mt-4 flex items-start gap-2 text-xs text-amber-300 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> This browser doesn't expose SpeechRecognition (Chrome/Edge/Safari support it). Text answers below still work — type into the AI Assistant chat instead.
          </div>
        )}
        <div className="flex flex-col items-center py-10">
          <button onClick={toggle} disabled={!supported}
            className={`h-28 w-28 rounded-full flex items-center justify-center border-4 transition-all active:scale-95 ${listening ? 'bg-red-500/15 border-red-500/60 shadow-2xl shadow-red-500/20 animate-pulse' : 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500/70 shadow-xl'}`}>
            {listening ? <MicOff className="h-12 w-12 text-red-400" /> : <Mic className={`h-12 w-12 ${gold}`} />}
          </button>
          <p className="text-xs font-mono text-slate-500 mt-4">{listening ? 'Listening… speak your question' : 'Tap to speak'}</p>
        </div>
        {transcript && (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl px-5 py-4">
            <p className={label}>You said</p>
            <p className="text-sm text-white mt-1">{transcript}</p>
          </div>
        )}
        {reply && (
          <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl px-5 py-4">
            <p className={`${label} flex items-center gap-2`}><Volume2 className={`h-3.5 w-3.5 ${speaking ? 'animate-pulse text-emerald-400' : ''}`} /> Answer {speaking && '· speaking'}</p>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed">{reply}</p>
          </div>
        )}
        <div className="mt-6">
          <p className={label}>Try asking</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {['What is notice CP2000?', 'When are refunds paid?', 'What\'s the standard deduction?', 'How do extensions work?', 'What triggers an audit?', 'Explain the child tax credit'].map(q => (
              <button key={q} onClick={() => { setTranscript(q); answer(q); }} className="px-3.5 py-2 text-[11px] font-bold text-slate-300 bg-neutral-900/50 border border-neutral-800 hover:border-amber-500/30 rounded-xl transition">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
