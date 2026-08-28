import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, ChevronDown, ChevronRight, GraduationCap, Users,
  FileText, LifeBuoy, Shield, Zap, Phone, Mail, MessageSquare,
  ArrowRight, CheckCircle2, Sparkles, Building2, Video, DollarSign
} from 'lucide-react';

/* ============================================================
   HELP CENTER — full in-app documentation manual
   Two audiences: (1) Preparers/Staff  (2) Clients (portal guide)
   ============================================================ */

interface Article {
  id: string;
  section: string;
  title: string;
  audience: 'staff' | 'client';
  body: string[];          // paragraphs
  steps?: string[];        // numbered how-to
  route?: string;          // deep link into the app
  routeLabel?: string;
}

const ARTICLES: Article[] = [
  // ───────── GETTING STARTED (STAFF) ─────────
  {
    id: 'gs-1', section: 'Getting Started', audience: 'staff',
    title: 'Your first 30 minutes in Tax Pro Hub University',
    body: [
      "Tax Pro Hub University is a complete tax practice operating system: CRM, document OCR, IRS intelligence, drip marketing, AI funnel building, video consultations, and multi-location payouts — all running on Cloudflare's global edge network.",
      "The fastest way to learn the platform is the 64-step Interactive Tutorial (🎓 icon, top bar). It navigates the app for you while explaining each module — most operators finish in about 25 minutes and retain far more than reading docs.",
    ],
    steps: [
      "Click the 🎓 Tutorial button in the top bar and complete Chapter 1 (Welcome & Orientation).",
      "Import your client list: Contacts → CSV Import Wizard (3 steps, field mapping included).",
      "Install your marketing: Campaigns → Drip Library → 'Install All' provisions the full lifecycle.",
      "Install your automations: Workflows → Master Recipes → install Speed-to-Lead and Onboarding first.",
      "Verify your credentials: Tax → Credentials — enter PTIN, EFIN, E&O policy, and WISP review date.",
    ],
    route: '/dashboard', routeLabel: 'Open Dashboard',
  },
  {
    id: 'gs-2', section: 'Getting Started', audience: 'staff',
    title: 'Understanding sub-accounts (multi-location / service bureau)',
    body: [
      "Everything you create is scoped to the sub-account you're working in. A sub-account is an independent workspace — its own contacts, campaigns, workflows, funnels, and branding — living under your master account.",
      "This is the service-bureau architecture: sign a new tax office, provision them a sub-account in Admin, and they get a clean white-labeled workspace while you retain master visibility, compliance oversight, and the payout rails.",
    ],
    steps: [
      "Go to Admin → Sub-Accounts.",
      "Click 'Provision Sub-Account Node'.",
      "Enter the office's name, business info, and brand colors.",
      "The new workspace is live immediately — switch into it from the tenant menu in the top bar.",
    ],
    route: '/admin', routeLabel: 'Open Admin',
  },
  {
    id: 'gs-3', section: 'Getting Started', audience: 'staff',
    title: 'The zero-key model: what works now vs. what needs API keys',
    body: [
      "Works immediately with NO configuration: document OCR and parsing, the TY2025 refund estimator and all calculators, the IRS notice decoder, drip campaign building, funnel generation, 1-on-1 video (browser camera), voice mode, and every CRM function.",
      "Needs a key added to the Cloudflare worker: live SMS sending (Twilio), payment collection and preparer payouts (Stripe), multi-party video rooms (Cloudflare Calls), and transactional email (Resend). Add each with `wrangler pages secret put KEY_NAME` — no code changes, the channel activates instantly.",
      "Check integration status anytime: the /api/health endpoint returns a live board of what's connected and exactly which secret each disconnected channel needs.",
    ],
    route: '/settings?tab=integrations', routeLabel: 'View Integrations',
  },

  // ───────── DAILY OPERATIONS (STAFF) ─────────
  {
    id: 'ops-1', section: 'Daily Operations', audience: 'staff',
    title: 'The elite daily loop (15 minutes to full command)',
    body: [
      "Top offices run the same five-screen loop every morning. The AI agent fleet has already worked overnight — parsed uploads, classified notices, advanced drips — so your loop is review-and-approve, not grind.",
    ],
    steps: [
      "Dashboard — scan KPIs: revenue pulse, returns in progress, refunds in transit.",
      "Dashboard → Tasks — the operational queue: chases, reviews, callbacks.",
      "Conversations — respond to overnight client replies (drips auto-exit when clients reply).",
      "Documents — review overnight uploads; the parser has classified and filed them, you approve low-confidence fields.",
      "Pipelines — move deals; a signed engagement advances automatically if the workflow is on.",
    ],
    route: '/dashboard', routeLabel: 'Start the Loop',
  },
  {
    id: 'ops-2', section: 'Daily Operations', audience: 'staff',
    title: 'Processing documents: OCR, auto-classification, auto-filing',
    body: [
      "Drop any document into Document Intelligence — W-2, any 1099 variant, 1098, K-1, receipts, bank statements, IRS notices, driver's licenses. The engine runs three stages on-device: OCR extraction → schema classification (17 schemas) → field extraction with per-field confidence.",
      "Extracted data auto-fills the client record. Low-confidence fields are flagged amber for one-click human review — the agent approves, never re-types. Documents are auto-arranged: matched to the client, filed to the correct folder (Income / Deductions / Identity / Notices / Prior Years), and consistently named.",
      "Nothing leaves the browser during parsing. No per-page OCR fees, no third-party document API, no data processor agreements needed for the parse step.",
    ],
    route: '/documents', routeLabel: 'Open Document Intelligence',
  },
  {
    id: 'ops-3', section: 'Daily Operations', audience: 'staff',
    title: 'Handling an IRS notice in under 2 minutes',
    body: [
      "A client sends a photo of an IRS letter. Here's the elite response flow:",
    ],
    steps: [
      "Open Tax → IRS Tools.",
      "Type the notice number (e.g., CP2000) into the decoder.",
      "Read the returned playbook: what it means, the REAL deadline, response steps, and a word-for-word client script.",
      "Call or message the client using the script — calm, specific, deadline-aware.",
      "If the 'IRS Notice Intake' recipe is installed, the upload alone triggers this: parse → decode → task created → client receives a calming SMS automatically.",
    ],
    route: '/tax?tab=irs', routeLabel: 'Open Notice Decoder',
  },
  {
    id: 'ops-4', section: 'Daily Operations', audience: 'staff',
    title: 'Running a refund estimate live with a client',
    body: [
      "The TY2025 estimator computes line-by-line in real time — perfect for running on screen (or screen-shared in a video call) while the client watches. It uses the actual Rev. Proc. 2024-40 + OBBBA numbers: standard deduction $15,750/$31,500/$23,625, CTC $2,200 per child ($1,700 refundable), EITC up to $8,046.",
      "Pair it with the Refund Maximizer (AI → Refund Maximizer) to show the exact dollar impact of an IRA contribution, HSA, missed Schedule C expenses, or a head-of-household status check — every advisory upsell backed by visible math.",
    ],
    route: '/tax?tab=calculators', routeLabel: 'Open Calculators',
  },
  {
    id: 'ops-5', section: 'Daily Operations', audience: 'staff',
    title: 'Video consultations: setup and protocol',
    body: [
      "The Video Suite works instantly for 1-on-1: camera preview, live call, screen share with picture-in-picture, mute/camera toggles, invite links. Multi-party rooms activate when Cloudflare Calls secrets are added to the worker.",
      "Follow the 5-point consultation protocol shown on the page (IRS Pub 4557 aligned): verify identity, confirm consent before any recording, share screens rather than sending files, log the session, follow up in writing.",
    ],
    route: '/video', routeLabel: 'Open Video Suite',
  },

  // ───────── MARKETING & GROWTH (STAFF) ─────────
  {
    id: 'mkt-1', section: 'Marketing & Growth', audience: 'staff',
    title: 'Installing and understanding drip campaigns',
    body: [
      "The Drip Library ships 8 complete sequences — 52 professionally written touches covering the full client lifecycle. Every email is complete multi-paragraph copy; every SMS carries compliant STOP language. Each step shows its send day, channel, full body, call-to-action, exit condition, and a strategy note explaining why the touch exists.",
      "Sequences chain across the lifecycle: New Lead → Onboarding → Tax Season → Refund Concierge → Referral Champion, with Reactivation catching anyone who goes quiet. Exit conditions stop sequences automatically the moment a client replies, books, uploads docs, or purchases — no client ever gets a 'just checking in' after they already answered.",
    ],
    steps: [
      "Open Campaigns → Drip Library.",
      "Expand a sequence and read every touch (nothing is hidden or stubbed).",
      "Click 'Install' — it lands in My Campaigns scoped to your sub-account.",
      "Or click 'Install All' to provision the complete lifecycle in one action.",
    ],
    route: '/campaigns', routeLabel: 'Open Drip Library',
  },
  {
    id: 'mkt-2', section: 'Marketing & Growth', audience: 'staff',
    title: 'Master automation recipes: the wiring behind the practice',
    body: [
      "Ten pre-wired recipes automate the practice end-to-end: Speed-to-Lead (sub-60-second response), Onboarding, Docs-Complete detection, Return-Filed → Refund Concierge + payout accrual, Referral Engine, Appointment Guard, Season Kickoff, Extension Guardian, IRS Notice Intake, and the Bi-Weekly Payout Cycle.",
      "Installing a recipe ALSO installs every drip campaign it enrolls contacts into — the wiring map on each card shows the full chain from trigger to final touch. Recipes that move money or answer the IRS pause at human approval gates.",
    ],
    route: '/workflows', routeLabel: 'Open Master Recipes',
  },
  {
    id: 'mkt-3', section: 'Marketing & Growth', audience: 'staff',
    title: 'Generating funnels with the AI builders',
    body: [
      "Two AI builders create marketing assets as real, editable records:",
      "Funnel Genie (/genie): describe an offer in one sentence and it architects a complete multi-page funnel — hook, landing copy, capture, thank-you — plus a paired campaign, quality-gated on 8 points.",
      "AI Campaign Architect (/ai): give it a concept and it synthesizes the FULL stack in one build — funnel, lead form, workflow, email sequence, SMS sequence, and a blog post, all synchronized and saved to their respective modules instantly.",
    ],
    route: '/genie', routeLabel: 'Open Funnel Genie',
  },
  {
    id: 'mkt-4', section: 'Marketing & Growth', audience: 'staff',
    title: 'The referral program: turning clients into a sales force',
    body: [
      "Enroll a client as a referral partner and the platform issues a trackable code, starts the 5-touch Referral Champion drip, and places them on the leaderboard. Rewards tier automatically: Bronze $50/filed return → Silver adds a season bonus → Gold adds a free personal return → Platinum adds 5% revenue share and ambassador status.",
      "Payouts accrue through the same ledger as preparer payouts and settle via Stripe Connect on your approval.",
    ],
    route: '/contacts?tab=referrals', routeLabel: 'Open Referral Program',
  },

  // ───────── AGENCY & PAYOUTS (STAFF) ─────────
  {
    id: 'agy-1', section: 'Agency & Payouts', audience: 'staff',
    title: 'How preparer payouts flow (accrual → approval → transfer)',
    body: [
      "Stage 1 — Accrual: every filed return posts the preparer's split (default 30%) to their ledger via the worker API. The Return-Filed recipe fires this automatically.",
      "Stage 2 — Approval Gate: the Bi-Weekly Payout Cycle compiles the batch and holds for a single human approval — the only manual step.",
      "Stage 3 — Transfer: approval executes Stripe Connect transfers to each preparer's connected bank account. Funds land in 1–2 business days.",
      "Monitor everything on Analytics → Sub-Account Performance: payouts owed per location, revenue per preparer, and the full agency scoreboard.",
    ],
    route: '/analytics?tab=performance', routeLabel: 'Open Payout Dashboard',
  },
  {
    id: 'agy-2', section: 'Agency & Payouts', audience: 'staff',
    title: 'Reselling the platform: white-label playbook',
    body: [
      "You can sell this platform to other tax offices under your brand. Each office gets a sub-account: their logo, their colors, optionally their domain — every client-facing pixel is theirs, while the infrastructure, compliance rails, and payout engine remain yours.",
    ],
    steps: [
      "Provision the office a sub-account (Admin → Sub-Accounts).",
      "Set their branding in the Branding tab.",
      "Issue them an API key (API Pipelines tab) if they need external integrations.",
      "Install their marketing stack: switch into their sub-account, then Campaigns → Install All + Workflows → install recipes.",
      "Train their team: have every preparer complete the 64-step tutorial in week one.",
    ],
    route: '/admin', routeLabel: 'Open Admin',
  },

  // ───────── COMPLIANCE (STAFF) ─────────
  {
    id: 'cmp-1', section: 'Compliance & Security', audience: 'staff',
    title: 'The compliance posture: what is enforced and where',
    body: [
      "The Compliance tab (Admin → Compliance) maps ten live controls to their actual enforcement points — §7216 consent gating before bank-product marketing, WISP/Safeguards Rule status, TCPA SMS consent + STOP language, CAN-SPAM footers, Form 8867 due-diligence blocking before e-file, CROA contract rules for credit repair, and role-based access.",
      "The Audit Log (Admin → Audit Logs) is append-only and categorized: every login, record view, payout approval, automation action, and blocked intrusion, retained 7 years per Pub 4557. When anyone asks 'who touched this record and when,' the answer is one search away.",
    ],
    route: '/admin?tab=compliance', routeLabel: 'Open Compliance',
  },
  {
    id: 'cmp-2', section: 'Compliance & Security', audience: 'staff',
    title: 'Credential management: PTIN, EFIN, WISP, E&O',
    body: [
      "Tax → Credentials is the locker for everything a tax office must produce on demand: PTIN, EFIN, EA license, AFSP record, E&O policy, and your Written Information Security Plan with its review date. Keep renewal dates current — the compliance matrix reads from this locker.",
    ],
    route: '/tax?tab=credentials', routeLabel: 'Open Credentials',
  },

  // ───────── CLIENT PORTAL GUIDE (CLIENT-FACING) ─────────
  {
    id: 'cp-1', section: 'Client Portal Guide', audience: 'client',
    title: 'Welcome to your client portal',
    body: [
      "Your tax office uses Tax Pro Hub University to serve you faster and more securely. Through your portal link (sent by your preparer via email or text), you can upload documents, message your preparer, book appointments, join video calls, track your refund, and pay invoices — all from your phone or computer.",
      "Everything you upload is encrypted, and only your tax office can see it. You never need to email tax documents again — email is the least secure way to send them.",
    ],
  },
  {
    id: 'cp-2', section: 'Client Portal Guide', audience: 'client',
    title: 'How to upload your tax documents',
    body: [
      "Uploading takes under a minute per document, straight from your phone camera or your files.",
    ],
    steps: [
      "Open your portal link and tap 'Upload Documents'.",
      "Take a photo of the document OR choose a file (PDF, JPG, PNG all work).",
      "Make sure all four corners are visible and text is readable — flat surface, good light.",
      "Tap upload. The system reads the document automatically and files it for your preparer.",
      "You'll see a checklist of what's still needed — upload until the list is green.",
    ],
  },
  {
    id: 'cp-3', section: 'Client Portal Guide', audience: 'client',
    title: 'Which documents do I need to send?',
    body: [
      "Typical checklist (your preparer may customize yours): W-2 from each job · 1099-NEC/1099-K if you did contract or gig work · 1099-INT/1099-DIV for bank interest or investments · 1098 mortgage interest · 1098-T tuition · SSA-1099 for Social Security · a photo ID · last year's return if you're a new client · and for dependents: dates of birth and Social Security numbers.",
      "Self-employed? Also send a summary of business income and expenses — or upload receipts/bank statements and the system will help organize them.",
    ],
  },
  {
    id: 'cp-4', section: 'Client Portal Guide', audience: 'client',
    title: 'Tracking your refund',
    body: [
      "After your return is filed, your portal shows a refund timeline with real milestones: return accepted → processing → refund approved → refund sent. E-filed returns with direct deposit typically arrive within 21 days.",
      "Claiming the Earned Income Tax Credit or Additional Child Tax Credit? Federal law (the PATH Act) requires the IRS to hold those refunds until mid-February — your timeline accounts for this automatically, so the date you see is realistic, not optimistic.",
    ],
  },
  {
    id: 'cp-5', section: 'Client Portal Guide', audience: 'client',
    title: 'I got a letter from the IRS — what do I do?',
    body: [
      "Don't panic, and don't ignore it. Most IRS letters are routine — a question, a small adjustment, or an identity check.",
    ],
    steps: [
      "Take a clear photo of ALL pages of the letter (front and back).",
      "Upload it through your portal or text it to your preparer.",
      "Your tax office's system identifies the notice type instantly and knows the exact deadline and response.",
      "Your preparer will contact you with the plan — usually the same day.",
      "Never call the number on a letter you're unsure about without checking with your preparer first — IRS impersonation scams are common.",
    ],
  },
  {
    id: 'cp-6', section: 'Client Portal Guide', audience: 'client',
    title: 'Booking appointments and video calls',
    body: [
      "Use the booking link in your portal (or in any message from your office) to pick a time that works for you. You'll get a confirmation immediately, plus reminders before your appointment.",
      "For video appointments, just tap the meeting link at your appointment time — it opens in your browser, no app download needed. Your preparer can share their screen to walk you through your return line by line.",
    ],
  },
  {
    id: 'cp-7', section: 'Client Portal Guide', audience: 'client',
    title: 'Paying your invoice',
    body: [
      "Invoices arrive through your portal with a secure card payment link (powered by Stripe). You can also ask your preparer about having fees deducted from your refund instead of paying up front — if your office offers refund-transfer products, they'll walk you through the disclosure and consent forms first.",
    ],
  },
  {
    id: 'cp-8', section: 'Client Portal Guide', audience: 'client',
    title: 'Your privacy and security',
    body: [
      "Your tax office operates under IRS Publication 4557 safeguards and the FTC Safeguards Rule: your data is encrypted in transit and at rest, access is logged, and federal law (IRC §7216) prohibits your return information from being used for anything beyond preparing your return without your explicit written consent.",
      "You control your communication preferences: reply STOP to any text to opt out of texts, or use the unsubscribe link in any email — service messages about your active return will still reach you.",
    ],
  },
];

const SECTIONS = ['Getting Started', 'Daily Operations', 'Marketing & Growth', 'Agency & Payouts', 'Compliance & Security', 'Client Portal Guide'];

const SECTION_ICONS: Record<string, typeof BookOpen> = {
  'Getting Started': GraduationCap,
  'Daily Operations': Zap,
  'Marketing & Growth': Sparkles,
  'Agency & Payouts': Building2,
  'Compliance & Security': Shield,
  'Client Portal Guide': Users,
};

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [audience, setAudience] = useState<'all' | 'staff' | 'client'>('all');
  const [expanded, setExpanded] = useState<string | null>('gs-1');

  const filtered = useMemo(() => {
    return ARTICLES.filter(a => {
      if (audience !== 'all' && a.audience !== audience) return false;
      if (!query.trim()) return true;
      const hay = `${a.title} ${a.section} ${a.body.join(' ')} ${(a.steps || []).join(' ')}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });
  }, [query, audience]);

  const bySection = useMemo(() => {
    const map: Record<string, Article[]> = {};
    for (const s of SECTIONS) map[s] = filtered.filter(a => a.section === s);
    return map;
  }, [filtered]);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-b from-neutral-950 to-neutral-900 p-8 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.12),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-[#D4AF37]" />
            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-mono">Support & Documentation</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white font-serif mt-2">Help Center</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
            The complete operating manual — for your team and for your clients. Every article links straight
            into the live module it documents. For hands-on learning, the 🎓 Interactive Tutorial walks you
            through all 64 steps of the platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search the manual — 'refund', 'IRS notice', 'payout', 'upload'..."
                className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15"
              />
            </div>
            <div className="flex gap-2">
              {([['all', 'All Docs'], ['staff', 'Team Manual'], ['client', 'Client Guide']] as const).map(([k, label]) => (
                <button key={k} onClick={() => setAudience(k)}
                  className={`px-4 py-3 rounded-2xl text-xs font-black transition-all border ${audience === k ? 'bg-amber-500/15 border-amber-500/40 text-[#D4AF37]' : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Interactive Tutorial', desc: '64 guided steps', icon: GraduationCap, action: () => navigate('/dashboard'), color: 'text-[#D4AF37]' },
          { label: 'Document Parser', desc: 'Upload & auto-file', icon: FileText, action: () => navigate('/documents'), color: 'text-emerald-400' },
          { label: 'IRS Notice Decoder', desc: 'Instant playbooks', icon: Shield, action: () => navigate('/tax?tab=irs'), color: 'text-orange-400' },
          { label: 'Video Suite', desc: 'Consult in browser', icon: Video, action: () => navigate('/video'), color: 'text-red-400' },
        ].map(q => (
          <button key={q.label} onClick={q.action}
            className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 text-left hover:border-amber-500/35 transition-all group">
            <q.icon className={`h-5 w-5 ${q.color} mb-2`} />
            <div className="text-xs font-black text-white group-hover:text-[#D4AF37] transition-colors">{q.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{q.desc}</div>
          </button>
        ))}
      </div>

      {/* Article sections */}
      {SECTIONS.map(section => {
        const arts = bySection[section];
        if (!arts || arts.length === 0) return null;
        const Icon = SECTION_ICONS[section] || BookOpen;
        return (
          <div key={section}>
            <h2 className="text-sm font-black text-white flex items-center gap-2 mb-4">
              <Icon className="h-4 w-4 text-[#D4AF37]" /> {section}
              {section === 'Client Portal Guide' && (
                <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/25 rounded-lg text-[9px] font-black text-teal-300 uppercase tracking-wider">Share with clients</span>
              )}
              <span className="text-[10px] text-slate-600 font-mono font-normal">({arts.length} articles)</span>
            </h2>
            <div className="space-y-3">
              {arts.map(a => {
                const isOpen = expanded === a.id;
                return (
                  <div key={a.id} className={`rounded-2xl border transition-all overflow-hidden ${isOpen ? 'bg-neutral-950/90 border-amber-500/30 shadow-xl' : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'}`}>
                    <button onClick={() => setExpanded(isOpen ? null : a.id)} className="w-full flex items-center justify-between gap-3 p-5 text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center border ${a.audience === 'client' ? 'bg-teal-500/10 border-teal-500/25' : 'bg-amber-500/10 border-amber-500/25'}`}>
                          {a.audience === 'client' ? <Users className="h-3.5 w-3.5 text-teal-300" /> : <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" />}
                        </span>
                        <span className="text-sm font-bold text-white truncate">{a.title}</span>
                      </div>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-[#D4AF37] shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 -mt-1">
                        <div className="pl-10 space-y-3">
                          {a.body.map((p, i) => (
                            <p key={i} className="text-[13px] text-slate-300 leading-relaxed">{p}</p>
                          ))}
                          {a.steps && (
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 space-y-2.5">
                              <div className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Step by step</div>
                              {a.steps.map((s, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                  <span className="shrink-0 h-5 w-5 rounded-md bg-amber-500/15 border border-amber-500/25 text-[#D4AF37] text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                                  <p className="text-[12px] text-slate-300 leading-relaxed">{s}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {a.route && (
                            <button onClick={() => navigate(a.route!)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl text-xs active:scale-95 transition-all">
                              {a.routeLabel || 'Open in App'} <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Support contact */}
      <div className="bg-neutral-950/80 border border-amber-500/20 rounded-3xl p-8">
        <h2 className="text-lg font-black text-white font-serif flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-[#D4AF37]" /> Still need help?
        </h2>
        <p className="text-slate-400 text-sm mt-2 max-w-xl">
          Enterprise support is included with every service-bureau license. Reach the RJ Business Solutions
          support desk through any channel below.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { icon: Mail, label: 'Email Support', value: 'support@rjbusinesssolutions.org', note: 'Response within 4 business hours' },
            { icon: Phone, label: 'Priority Line', value: '(877) 561-8001', note: 'Mon–Sat 8am–8pm MST · extended in season' },
            { icon: MessageSquare, label: 'In-App Conversations', value: 'Message the support desk', note: 'Fastest during tax season' },
          ].map(c => (
            <div key={c.label} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
              <c.icon className="h-5 w-5 text-[#D4AF37] mb-2" />
              <div className="text-xs font-black text-white">{c.label}</div>
              <div className="text-sm text-[#D4AF37] font-bold mt-1">{c.value}</div>
              <div className="text-[10px] text-slate-500 mt-1">{c.note}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-6 text-[10px] text-slate-500 font-mono">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Documentation version 2.0 · Updated August 2026 · Covers TY2025 filing season
          <span className="text-slate-700">•</span>
          <DollarSign className="h-3 w-3 text-emerald-500" /> Reseller licensing: sales@rjbusinesssolutions.org
        </div>
      </div>
    </div>
  );
}
