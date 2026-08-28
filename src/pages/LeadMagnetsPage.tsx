import { useState } from 'react';
import {
  Magnet, Sparkles, Download, Copy, Eye, Calculator, FileText, BookOpen,
  Gift, TrendingUp, CheckCircle2, Zap, Palette, Send, BarChart3
} from 'lucide-react';
import { useAppStore } from '../store';

/* ────────────────────────────────────────────────────────────────
   LEAD MAGNETS STUDIO — premium, branded, funnel-wired lead magnets.
   Every asset auto-brands with the tenant's logo + colors and drops
   into a capture funnel with the matching drip sequence attached.
   ──────────────────────────────────────────────────────────────── */

type MagnetKind = 'calculator' | 'checklist' | 'guide' | 'quiz' | 'tool' | 'offer';

interface LeadMagnet {
  id: string;
  title: string;
  kind: MagnetKind;
  hook: string;
  contents: string[];
  funnel: string;
  drip: string;
  conv: string;
  leads30d: number;
  tone: string;
}

const KIND_META: Record<MagnetKind, { label: string; icon: typeof Magnet; cls: string }> = {
  calculator: { label: 'Interactive Calculator', icon: Calculator, cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  checklist: { label: 'Premium Checklist', icon: CheckCircle2, cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  guide: { label: 'Authority Guide', icon: BookOpen, cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  quiz: { label: 'Scored Quiz', icon: Sparkles, cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  tool: { label: 'Live Tool', icon: Zap, cls: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
  offer: { label: 'Irresistible Offer', icon: Gift, cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

const MAGNETS: LeadMagnet[] = [
  {
    id: 'lm1', kind: 'calculator', title: 'Maximum Refund Estimator (TY2025)',
    hook: '"See your refund in 60 seconds — before you file anywhere."',
    contents: ['TY2025 brackets, standard deduction & CTC/EITC tables built in', 'W-2 + 1099 + dependents inputs, instant federal estimate', 'Advance eligibility teaser: "You may pre-qualify for up to $7,000 today"', 'Capture gate after result: email + phone to save the estimate'],
    funnel: 'Refund Estimator Funnel (3 pages)', drip: 'New Lead → Booked Appointment (6 touches)', conv: '38–52% opt-in', leads30d: 412, tone: 'Urgency + curiosity',
  },
  {
    id: 'lm2', kind: 'checklist', title: 'The 47-Point Tax Document Checklist',
    hook: '"Missing one document costs the average filer $743. Miss nothing."',
    contents: ['Every form by situation: W-2, all 1099 variants, K-1, 1098, crypto, gig', 'Print-ready + interactive check-off version in the client portal', 'Branded cover with your logo, colors & booking link on every page', 'QR code straight to the secure document upload portal'],
    funnel: 'Document Checklist Squeeze', drip: 'Document Chase Sequence (5 touches)', conv: '44% opt-in', leads30d: 268, tone: 'Loss aversion',
  },
  {
    id: 'lm3', kind: 'guide', title: 'Self-Employed Tax Playbook: 21 Deductions the IRS Lets You Take',
    hook: '"1099 income? You are probably overpaying by $3,000+."',
    contents: ['Home office, mileage (70¢/mi TY2025), QBI §199A, SEP-IRA, health premiums', 'Real dollar examples at $45K / $85K / $150K profit levels', 'Quarterly estimate calendar with penalty math', 'CTA chapter: "What a pro catches that software misses"'],
    funnel: 'Self-Employed Authority Funnel', drip: 'Self-Employed Nurture (7 touches)', conv: '31% opt-in', leads30d: 189, tone: 'Authority + specificity',
  },
  {
    id: 'lm4', kind: 'quiz', title: '"Are You Leaving Money on the Table?" — 12-Question Refund Quiz',
    hook: 'Scored quiz → personalized result page → booked call.',
    contents: ['12 branching questions (dependents, filing status, credits, life events)', 'Score 0–100 with personalized "money left behind" estimate', 'Result page auto-brands and books straight into your calendar', 'Segment tags applied automatically for targeted drips'],
    funnel: 'Quiz Funnel (result-gated)', drip: 'Quiz Result Follow-Up (4 touches)', conv: '55% completion', leads30d: 337, tone: 'Gamified curiosity',
  },
  {
    id: 'lm5', kind: 'tool', title: 'Refund Advance Pre-Qualifier',
    hook: '"Find out in 2 minutes if you pre-qualify for up to $7,000 — no credit pull."',
    contents: ['Soft pre-qual: expected refund, filing history, ID readiness', 'Wired to Bank Products desk — pre-approvals appear in your pipeline', 'Instant SMS + email with appointment link on pre-qual', 'Compliance copy: advance terms, no-fee/APR disclosures per partner'],
    funnel: 'Advance Pre-Qual Funnel', drip: 'Advance Hot-Lead Sequence (3 touches, 48h)', conv: '61% opt-in', leads30d: 523, tone: 'Speed + money-now',
  },
  {
    id: 'lm6', kind: 'guide', title: 'IRS Letter Decoder: What Your Notice Really Means',
    hook: '"Got an IRS letter? Don\'t panic — decode it free."',
    contents: ['Plain-English breakdown of CP2000, CP14, LT11, 4883C + 12 more', 'Deadline table: what happens at 30/60/90 days of silence', 'When you can self-resolve vs. when representation saves thousands', 'Direct line CTA to your resolution desk'],
    funnel: 'Tax Resolution Funnel', drip: 'Resolution Urgency Sequence (5 touches)', conv: '47% opt-in', leads30d: 156, tone: 'Fear relief + authority',
  },
  {
    id: 'lm7', kind: 'checklist', title: 'New Business Owner First-Year Tax Survival Kit',
    hook: '"LLC? S-Corp? Your first-year mistakes are the most expensive."',
    contents: ['Entity comparison with real tax math at 5 profit levels', 'EIN, BOI, state registration & payroll setup checklist', 'S-Corp election deadline calculator (Form 2553)', 'Bookkeeping starter template (download after opt-in)'],
    funnel: 'Business Owner Funnel', drip: 'Entity Consult Sequence (6 touches)', conv: '36% opt-in', leads30d: 143, tone: 'New-venture excitement',
  },
  {
    id: 'lm8', kind: 'offer', title: '$50 Referral Reward Card + Bring-A-Friend Bundle',
    hook: '"Your refund. Their refund. $50 each. Everybody wins."',
    contents: ['Digitally-branded reward card with unique referral codes', 'Auto-tracked through the Referrals engine — no spreadsheets', 'Double-sided: both referrer and friend get the reward', 'Print + social + SMS share formats generated per client'],
    funnel: 'Referral Viral Loop', drip: 'Referral Activation (3 touches)', conv: '2.4 refs/client', leads30d: 208, tone: 'Reciprocity',
  },
  {
    id: 'lm9', kind: 'calculator', title: 'Credit Score Impact Simulator',
    hook: '"See what deleting those collections could do to your score."',
    contents: ['Simulates deletions, utilization pay-downs & new tradelines', 'Feeds the Credit Repair Center — enrollments in one click', 'Score-range disclaimer + educational framing (FCRA-safe copy)', 'Capture gate before full simulation detail'],
    funnel: 'Credit Repair Cross-Sell Funnel', drip: 'Credit Repair Enrollment (5 touches)', conv: '42% opt-in', leads30d: 261, tone: 'Hope + visualization',
  },
];

export default function LeadMagnetsPage() {
  const { addNotification, currentSubAccount, brandColors } = useAppStore();
  const [filter, setFilter] = useState<MagnetKind | 'all'>('all');
  const [selected, setSelected] = useState<LeadMagnet>(MAGNETS[0]);

  const brandName = currentSubAccount?.businessName || 'Tax Pro Hub University';
  const list = filter === 'all' ? MAGNETS : MAGNETS.filter((m) => m.kind === filter);
  const totalLeads = MAGNETS.reduce((s, m) => s + m.leads30d, 0);

  const deploy = (m: LeadMagnet) => addNotification({
    id: `ntf-${Date.now()}`,
    title: `🧲 "${m.title}" deployed`,
    message: `Branded for ${brandName}, published to ${m.funnel}, and "${m.drip}" drip attached to every opt-in. Share link copied.`,
    type: 'success', read: false, createdAt: new Date(),
  });

  const copyEmbed = (m: LeadMagnet) => {
    const code = `<iframe src="https://${(currentSubAccount?.domain || 'app.taxprohubuniversity.com')}/magnet/${m.id}" style="width:100%;min-height:640px;border:0;border-radius:16px" title="${m.title}"></iframe>`;
    navigator.clipboard?.writeText(code).catch(() => {});
    addNotification({ id: `ntf-${Date.now()}`, title: 'Embed code copied', message: `Drop the "${m.title}" iframe on any website — it inherits your brand colors automatically.`, type: 'success', read: false, createdAt: new Date() });
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-violet-600/30 border border-pink-500/30 flex items-center justify-center">
            <Magnet className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-serif">Lead Magnets Studio</h1>
            <p className="text-slate-400 mt-1 max-w-2xl">Agency-grade lead magnets — every one auto-brands with your logo & colors, publishes to a matching capture funnel, and fires its drip sequence on opt-in. No design work, no copywriting, no duct tape.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/30"><Palette className="w-3 h-3" /> Auto-branded: {brandName}</span>
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"><TrendingUp className="w-3 h-3" /> {totalLeads.toLocaleString()} leads captured · 30 days</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="w-3 h-3 rounded-full" style={{ background: brandColors.primary }} />
          <span className="w-3 h-3 rounded-full" style={{ background: brandColors.secondary }} />
          <span className="w-3 h-3 rounded-full" style={{ background: brandColors.accent }} />
          <span className="text-xs text-slate-400 ml-1">live brand palette</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filter === 'all' ? 'bg-pink-500/15 text-pink-300 border-pink-500/40' : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-white'}`}>All ({MAGNETS.length})</button>
        {(Object.keys(KIND_META) as MagnetKind[]).map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filter === k ? 'bg-pink-500/15 text-pink-300 border-pink-500/40' : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-white'}`}>{KIND_META[k].label}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Magnet grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((m) => {
            const meta = KIND_META[m.kind];
            return (
              <button key={m.id} onClick={() => setSelected(m)} className={`text-left p-5 rounded-2xl border transition-all ${selected.id === m.id ? 'bg-pink-500/5 border-pink-500/40 ring-1 ring-pink-500/20' : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${meta.cls}`}><meta.icon className="w-3 h-3" /> {meta.label}</span>
                  <span className="text-[10px] text-emerald-300 font-semibold">{m.conv}</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{m.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 italic">{m.hook}</p>
                <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {m.leads30d} leads/30d</span>
                  <span className="flex items-center gap-1"><Send className="w-3 h-3" /> {m.drip.split('(')[0].trim()}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 h-fit sticky top-6">
          <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${KIND_META[selected.kind].cls} mb-3`}>
            {KIND_META[selected.kind].label}
          </span>
          <h2 className="text-lg font-bold text-white leading-snug">{selected.title}</h2>
          <p className="text-sm text-slate-400 italic mt-1">{selected.hook}</p>

          <div className="mt-4 space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">What's inside</div>
            {selected.contents.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-300"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {c}</div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"><div className="text-slate-500 text-[10px] uppercase">Wired Funnel</div><div className="text-white font-semibold mt-0.5">{selected.funnel}</div></div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"><div className="text-slate-500 text-[10px] uppercase">Attached Drip</div><div className="text-white font-semibold mt-0.5">{selected.drip}</div></div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"><div className="text-slate-500 text-[10px] uppercase">Conversion</div><div className="text-emerald-300 font-semibold mt-0.5">{selected.conv}</div></div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"><div className="text-slate-500 text-[10px] uppercase">Copy Tone</div><div className="text-white font-semibold mt-0.5">{selected.tone}</div></div>
          </div>

          <div className="mt-5 space-y-2">
            <button onClick={() => deploy(selected)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90">
              <Zap className="w-4 h-4" /> Deploy Branded &amp; Go Live
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => copyEmbed(selected)} className="py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-pink-500/40 hover:text-pink-300"><Copy className="w-3.5 h-3.5" /> Copy Embed</button>
              <button onClick={() => addNotification({ id: `ntf-${Date.now()}`, title: 'Preview opened', message: `"${selected.title}" preview rendered with your live brand palette.`, type: 'success', read: false, createdAt: new Date() })} className="py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-pink-500/40 hover:text-pink-300"><Eye className="w-3.5 h-3.5" /> Preview</button>
            </div>
            <button onClick={() => addNotification({ id: `ntf-${Date.now()}`, title: 'PDF exported', message: `Print-ready branded PDF of "${selected.title}" generated for in-office and event use.`, type: 'success', read: false, createdAt: new Date() })} className="w-full py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-pink-500/40 hover:text-pink-300"><Download className="w-3.5 h-3.5" /> Export Print-Ready PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
