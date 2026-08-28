/**
 * Interactive Tutorial — the complete 72-step guided walkthrough.
 * Each step routes the user to the exact page/tab it describes, so the
 * tutorial IS the software tour: what you read is on screen behind it.
 */

export interface TutorialStep {
  id: number;
  chapter: string;
  title: string;
  route: string;            // where the app navigates for this step
  body: string;             // full explanation, written like a trainer speaking
  proTip?: string;          // elite operator tip
  action?: string;          // the "try it now" instruction
}

export interface TutorialChapter {
  name: string;
  icon: string;
  range: [number, number];
}

export const TUTORIAL_CHAPTERS: TutorialChapter[] = [
  { name: 'Welcome & Orientation', icon: '👋', range: [1, 5] },
  { name: 'Dashboard & Daily Flow', icon: '📊', range: [6, 10] },
  { name: 'Clients & CRM', icon: '👥', range: [11, 17] },
  { name: 'The Tax Module', icon: '🏛️', range: [18, 28] },
  { name: 'Document Intelligence & OCR', icon: '🧠', range: [29, 34] },
  { name: 'Campaigns & Drip Marketing', icon: '📣', range: [35, 40] },
  { name: 'Funnels & AI Builders', icon: '🚀', range: [41, 46] },
  { name: 'Automations & Workflows', icon: '⚙️', range: [47, 51] },
  { name: 'Video, Conversations & Calendar', icon: '🎥', range: [52, 55] },
  { name: 'Agency, Payouts & Sub-Accounts', icon: '🏢', range: [56, 60] },
  { name: 'Compliance, Admin & Go-Live', icon: '🛡️', range: [61, 64] },
  { name: 'Growth Engine & Market Domination', icon: '🏆', range: [65, 72] },
];

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ─── CHAPTER 1: WELCOME & ORIENTATION (1–5) ───
  {
    id: 1, chapter: 'Welcome & Orientation', title: 'Welcome to Tax Pro Hub University',
    route: '/dashboard',
    body: "You're inside an enterprise tax practice platform: CRM, tax intelligence, document OCR, drip marketing, funnels, automations, video consultations, and multi-location agency payouts — all in one system, all running on Cloudflare's edge network. This tutorial walks you through every module in 72 steps. Your progress saves automatically, so you can leave and come back anytime.",
    proTip: "You can reopen this tutorial anytime from the graduation-cap icon in the top bar, and jump to any chapter from the chapter list.",
  },
  {
    id: 2, chapter: 'Welcome & Orientation', title: 'The Navigation Sidebar',
    route: '/dashboard',
    body: "The left sidebar is your command center, organized into functional groups: CRM Core, Tax Practice, Credit Services, AI Suite, Analytics, Marketing, and Administration. Every single link opens a fully working page — click anything, you can't break it. Badges (like '142 active' or '● connected') show live status at a glance.",
    action: "Hover over the sidebar groups and notice how each section is color-coded by function.",
  },
  {
    id: 3, chapter: 'Welcome & Orientation', title: 'Global Search & Quick Actions',
    route: '/dashboard',
    body: "The top bar carries global search, quick-parse (jumps straight to the Document Parser), notifications, and your account menu. The account menu also holds shortcuts to Compliance and Audit Logs — the two pages you'll want during an IRS office visit or a bank product audit.",
  },
  {
    id: 4, chapter: 'Welcome & Orientation', title: 'Sub-Account Awareness',
    route: '/dashboard',
    body: "This platform is multi-tenant. Everything you create — contacts, campaigns, workflows, funnels — is scoped to the sub-account (location/organization) you're working in. Switch sub-accounts and the whole workspace re-filters. This is what lets you run a service bureau: each office you sign gets its own clean workspace under your master account.",
    proTip: "White-label per sub-account: each one carries its own logo, colors, and domain from Admin → Sub-Accounts.",
  },
  {
    id: 5, chapter: 'Welcome & Orientation', title: 'The Zero-Key Philosophy',
    route: '/dashboard',
    body: "Everything you'll see works immediately with no API keys: OCR runs on-device, the IRS intelligence engine computes locally, video uses your browser's camera. When you're ready for live SMS (Twilio), payments (Stripe), and multi-party video (Cloudflare Calls), you add secrets to the Cloudflare worker and those channels light up — no code changes. The /api/health endpoint tells you exactly what's connected.",
  },

  // ─── CHAPTER 2: DASHBOARD & DAILY FLOW (6–10) ───
  {
    id: 6, chapter: 'Dashboard & Daily Flow', title: 'Your Morning Screen',
    route: '/dashboard',
    body: "The dashboard is built for the first 90 seconds of your day: revenue pulse, active clients, returns in progress, refunds in transit, and the task list. Elite offices run stand-ups off this screen — every number links to the page where you act on it.",
    action: "Click any KPI card and notice it deep-links into the module that owns that number.",
  },
  {
    id: 7, chapter: 'Dashboard & Daily Flow', title: 'The Tasks Tab',
    route: '/dashboard?tab=tasks',
    body: "Switch to Tasks for the operational queue: document chases, signature requests, review approvals, callback promises. Tasks are generated automatically by the workflow engine (e.g., 'docs incomplete after 5 days' creates a chase task) and can be created manually.",
  },
  {
    id: 8, chapter: 'Dashboard & Daily Flow', title: 'Notifications Center',
    route: '/notifications',
    body: "Every system event lands here: drip sends, payout batches compiled, parse completions, IRS notice intakes, video session creations. Notifications are your audit trail in plain English — the formal, immutable version lives in Admin → Audit Logs.",
  },
  {
    id: 9, chapter: 'Dashboard & Daily Flow', title: 'Revenue at the Edge',
    route: '/analytics',
    body: "Analytics opens on the overview: revenue trend, lead velocity, conversion waterfall. This is real chart infrastructure (not screenshots) — it re-renders live as your store data changes.",
  },
  {
    id: 10, chapter: 'Dashboard & Daily Flow', title: 'The Daily Loop',
    route: '/dashboard',
    body: "The elite daily loop: (1) Dashboard KPIs → (2) Tasks → (3) Conversations for overnight replies → (4) Documents for overnight uploads (the parser has already classified them) → (5) Pipelines to move deals. Five screens, fifteen minutes, total command of the practice.",
    proTip: "The AI Agents fleet (AI → Agents) runs steps 3 and 4 for you and holds anything risky for approval.",
  },

  // ─── CHAPTER 3: CLIENTS & CRM (11–17) ───
  {
    id: 11, chapter: 'Clients & CRM', title: 'The Contact Database',
    route: '/contacts',
    body: "Every person your practice touches lives here: leads, prospects, active clients. Table view for working the list, filters by stage, instant search. Click any row to open the full client record with notes, activities, and documents.",
    action: "Try the search box — it filters as you type.",
  },
  {
    id: 12, chapter: 'Clients & CRM', title: 'The Status Board (Kanban)',
    route: '/contacts',
    body: "Switch to Status Board to see contacts as cards in Lead → Prospect → Customer columns. This is the visual heartbeat of client acquisition: drag mentality, stage-at-a-glance. Use it in team meetings to review the funnel top-down.",
  },
  {
    id: 13, chapter: 'Clients & CRM', title: 'CSV Import Wizard',
    route: '/contacts',
    body: "Migrating from another CRM or a spreadsheet? The 3-step CSV Import Wizard maps your columns (first name, last name, email, phone, company) to platform fields, previews the mapping, and imports with a progress bar. Thousands of records in minutes.",
  },
  {
    id: 14, chapter: 'Clients & CRM', title: 'Tag Architecture',
    route: '/contacts',
    body: "Tags drive segmentation: 's-corp', '1099-contractor', 'high-value', 'tax-prep'. Campaigns and workflows target by tag, so a clean tag taxonomy = surgical marketing. The Tag Management tab shows counts per tag and lets you prune.",
    proTip: "Standard elite taxonomy: entity type (s-corp/sole-prop/w2), value band (high-value/standard), lifecycle (lead/active/past), service line (tax/credit/bookkeeping).",
  },
  {
    id: 15, chapter: 'Clients & CRM', title: 'Referral Program Engine',
    route: '/contacts?tab=referrals',
    body: "Your clients are your best marketers. The Referral Program issues trackable codes, ranks partners on a leaderboard, and pays tiered rewards: Bronze $50/return up to Platinum with 5% revenue share. Enrolling a partner automatically starts the 5-touch Referral Champion drip.",
    action: "Click 'Generate Code + Start Referral Drip' with a test name to see the full enrollment flow fire.",
  },
  {
    id: 16, chapter: 'Clients & CRM', title: 'Credit Services Wing',
    route: '/contacts?tab=credit',
    body: "The Credit Clients tab runs your credit-repair service line: tri-bureau scores (start vs current), items disputed vs removed, dispute round, plan, and MRR. CROA compliance guardrails are printed right on the page — contract-first, no advance billing, no CPN schemes.",
  },
  {
    id: 17, chapter: 'Clients & CRM', title: 'Disputes & the Letter Arsenal',
    route: '/contacts?tab=letters',
    body: "Six complete, attorney-grade letter templates: FCRA §609 disclosure, §611 reinvestigation, Method of Verification demand, FDCPA debt validation, goodwill adjustment, and cease & desist. Full legal citations, merge tokens, certified-mail protocol. The Disputes board tracks every letter's 30-day FCRA clock with automatic escalation laddering.",
    proTip: "Letters dispatch physically through the Click2Mail integration in the Tax Module — no printer needed.",
  },

  // ─── CHAPTER 4: THE TAX MODULE (18–28) ───
  {
    id: 18, chapter: 'The Tax Module', title: 'Tax Clients Home',
    route: '/tax?tab=clients',
    body: "The Tax Module is the practice core. The Clients tab lists every tax client with filing status, return type, preparer assignment, and status. This is separate from the general CRM view — it's the preparer's working roster.",
  },
  {
    id: 19, chapter: 'The Tax Module', title: 'Client Documents Vault',
    route: '/tax?tab=documents',
    body: "Every client's W-2s, 1099s, receipts, and prior-year returns organized in one vault. Documents arriving through the parser are auto-filed to the right client. Encryption at rest, access logged — this satisfies IRS Pub 4557 record-keeping.",
  },
  {
    id: 20, chapter: 'The Tax Module', title: 'Click2Mail — Physical Mail',
    route: '/tax?tab=click2mail',
    body: "Send physical letters — engagement letters, document requests, IRS response copies — straight from the platform. Compose, pick recipients, and Click2Mail prints and mails. Certified mail options for anything with legal deadlines.",
  },
  {
    id: 21, chapter: 'The Tax Module', title: 'TaxSlayer Pro Sync',
    route: '/tax?tab=sync',
    body: "Two-way sync with TaxSlayer Pro: client demographics flow in, return statuses flow back. The connection indicator in the sidebar shows sync health. Drake, ProSeries, Lacerte, ATX, TaxAct, CrossLink and MyTaxPrepOffice connectors are staged in Settings → Integrations.",
  },
  {
    id: 22, chapter: 'The Tax Module', title: 'Refund Tracking & Timeline Predictor',
    route: '/tax?tab=refunds',
    body: "The Refunds tab tracks every client's refund in transit AND predicts arrival: enter filed date, e-file vs paper, direct deposit vs check, and EITC/ACTC status — the engine maps the IRS milestone timeline including the PATH Act hold (EITC/ACTC refunds legally cannot release before mid-February).",
    action: "Toggle the EITC switch in the timeline predictor and watch the dates shift for the PATH Act hold.",
  },
  {
    id: 23, chapter: 'The Tax Module', title: 'IRS Tools — The Notice Decoder',
    route: '/tax?tab=irs',
    body: "A client texts you a photo of an IRS letter — you paste the notice number here and get: what it means, the real deadline, the exact response playbook, and a word-for-word client script. Covers CP2000, CP12, 5071C, CP05, CP14, LT11, CP49, CP75. This is the feature that makes clients feel you have superpowers.",
    action: "Type 'CP2000' into the decoder and read the full playbook it returns.",
  },
  {
    id: 24, chapter: 'The Tax Module', title: 'Calculators — TY2025 Refund Estimator',
    route: '/tax?tab=calculators',
    body: "A live, line-by-line refund estimator built on the actual TY2025 numbers (Rev. Proc. 2024-40 + OBBBA): standard deduction $15,750/$31,500/$23,625, CTC $2,200 per child, EITC up to $8,046, full bracket math. Enter income, withholding, kids, filing status — see the refund compute in real time with every line item shown.",
  },
  {
    id: 25, chapter: 'The Tax Module', title: 'Penalty & Estimate Math',
    route: '/tax?tab=calculators',
    body: "Same tab, scroll down: failure-to-file/failure-to-pay penalty calculator (5%/0.5% monthly, $510 minimum, first-time abatement logic), quarterly estimated-tax scheduler with the 100%/110% safe harbor, and a paycheck withholding checkup. These answer the four questions clients ask most — instantly, with math you can show them.",
  },
  {
    id: 26, chapter: 'The Tax Module', title: 'Bank Products Desk',
    route: '/tax?tab=bank',
    body: "Refund advances, refund transfers, prepaid cards, and fee-advance products — presented with the §7216 consent guardrails baked in. The compliance box on this page is not decoration: using return information to market bank products without written consent is a criminal statute. The platform makes the compliant path the easy path.",
  },
  {
    id: 27, chapter: 'The Tax Module', title: 'Audit Shield',
    route: '/tax?tab=shield',
    body: "Audit protection as a product line plus the 8 real audit triggers (Schedule C losses year after year, round numbers, high charitable ratios, crypto, home office, EITC due diligence, cash businesses, mismatched 1099s) — each with why the IRS flags it and the defense documentation to keep on file.",
  },
  {
    id: 28, chapter: 'The Tax Module', title: 'Credentials Locker',
    route: '/tax?tab=credentials',
    body: "PTIN, EFIN, EA license, AFSP record, E&O policy, and your WISP — every credential a tax office must produce on demand, in one locker with renewal dates. When IRS stakeholder liaison or a bank product provider asks, you answer in seconds.",
  },

  // ─── CHAPTER 5: DOCUMENT INTELLIGENCE & OCR (29–34) ───
  {
    id: 29, chapter: 'Document Intelligence & OCR', title: 'The Document Intelligence Hub',
    route: '/documents',
    body: "Drop ANY document — W-2, any 1099 variant, 1098, K-1, receipts, bank statements, IRS notices, driver's licenses — and the on-device OCR engine reads it, classifies it against 17 schemas, extracts every field, and scores its own confidence. No API keys, no per-page fees, nothing leaves the browser.",
    action: "Upload any tax document (or a photo of one) and watch the three-stage pipeline run.",
  },
  {
    id: 30, chapter: 'Document Intelligence & OCR', title: 'The Three-Stage Pipeline',
    route: '/documents',
    body: "Stage 1 — OCR: image normalization, contrast enhancement, text extraction. Stage 2 — Classification: the document is matched to its schema (W-2 vs 1099-NEC vs 1098-T all look different to the engine). Stage 3 — Field extraction: boxes, EINs, wages, withholding pulled into structured data with per-field confidence scores.",
  },
  {
    id: 31, chapter: 'Document Intelligence & OCR', title: 'Auto-Fill the CRM',
    route: '/documents',
    body: "This is the moat: extracted data doesn't sit in a table — it auto-fills the client record. A W-2 upload populates employer, wages, and withholding on the client. A driver's license populates identity fields. The refund estimator can pre-load from parsed W-2s. Any tax agent — even a first-year — can process documents like a veteran.",
    proTip: "Low-confidence fields are flagged amber for human review. The agent approves, never re-types.",
  },
  {
    id: 32, chapter: 'Document Intelligence & OCR', title: 'Auto-Arrange & Smart Filing',
    route: '/documents',
    body: "Parsed documents are automatically arranged: matched to the right client by name/SSN-last-4 heuristics, filed into the correct folder (Income / Deductions / Identity / Notices / Prior Years), and named consistently (2025_W2_EmployerName.pdf). The chaos of tax-season inboxes becomes an organized vault with zero clerical work.",
  },
  {
    id: 33, chapter: 'Document Intelligence & OCR', title: 'The Parser Console (AI Wing)',
    route: '/ai?tab=parser',
    body: "The AI wing's Parser tab is mission control for document processing at volume: the three-stage console, all 17 schema definitions, and throughput stats. This is where a service bureau watches hundreds of documents flow during peak season.",
  },
  {
    id: 34, chapter: 'Document Intelligence & OCR', title: 'IRS Notice Intake Automation',
    route: '/workflows',
    body: "The 'IRS Notice Intake' recipe wires it all together: client uploads a notice photo → parser classifies it → the notice decoder generates the playbook → a task is created for the preparer with the response drafted → the client gets a calming SMS. A scary letter becomes a managed process in under a minute.",
  },

  // ─── CHAPTER 6: CAMPAIGNS & DRIP MARKETING (35–40) ───
  {
    id: 35, chapter: 'Campaigns & Drip Marketing', title: 'The Drip Library',
    route: '/campaigns',
    body: "Eight complete, professionally written drip sequences — 52 total touches — covering the entire client lifecycle: New Lead (8 touches/10 days), Onboarding, Tax Season Countdown, Refund Concierge, Reactivation, Referral Champion, Appointment Guard, and Year-Round Compliance. Every email is full multi-paragraph copy; every SMS is compliant with STOP language.",
    action: "Expand any sequence to read the complete copy of every touch — nothing is a stub.",
  },
  {
    id: 36, chapter: 'Campaigns & Drip Marketing', title: 'Anatomy of a Drip Step',
    route: '/campaigns',
    body: "Each step shows: the day it sends, the channel (email/SMS), the full body, the call-to-action, the EXIT CONDITION (stop if they reply / book / upload docs / purchase), and a strategy note explaining WHY that touch exists. You're not just getting campaigns — you're getting the playbook behind them.",
  },
  {
    id: 37, chapter: 'Campaigns & Drip Marketing', title: 'Merge Tokens & Personalization',
    route: '/campaigns',
    body: "Sequences use live merge tokens: {{firstName}}, {{businessName}}, {{portalLink}}, {{bookingLink}}, {{preparerName}}, {{refundEta}}. At send time each touch renders personally. The {{refundEta}} token is special — it pulls from the refund timeline predictor, so refund emails carry real dates.",
  },
  {
    id: 38, chapter: 'Campaigns & Drip Marketing', title: 'One-Click Install',
    route: '/campaigns',
    body: "Install any sequence into your active campaigns with one click — it lands scoped to your current sub-account, ready to enroll contacts. 'Install All' provisions the entire lifecycle in seconds: this is how you onboard a new service-bureau location to a full marketing stack in under a minute.",
    action: "Install one sequence, then check 'My Campaigns' to see it live with its full sequence attached.",
  },
  {
    id: 39, chapter: 'Campaigns & Drip Marketing', title: 'The Lifecycle Map',
    route: '/campaigns',
    body: "The lifecycle map at the top shows how sequences chain: New Lead converts → Onboarding takes over → Tax Season activates in January → filing triggers Refund Concierge → refund lands triggers Referral Champion → silence triggers Reactivation. No client ever falls into a gap.",
  },
  {
    id: 40, chapter: 'Campaigns & Drip Marketing', title: 'Compliance Built Into Copy',
    route: '/campaigns',
    body: "Every SMS carries opt-out language (TCPA), every email carries the unsubscribe + physical address block (CAN-SPAM), and sequences that touch return information respect §7216 consent gating. Marketing that can survive an audit is the only marketing an elite firm runs.",
  },

  // ─── CHAPTER 7: FUNNELS & AI BUILDERS (41–46) ───
  {
    id: 41, chapter: 'Funnels & AI Builders', title: 'The Funnel Genie',
    route: '/genie',
    body: "Describe your offer in one sentence — 'S-corp election campaign for realtors making $150k+' — and the Funnel Genie architects a complete multi-page funnel: hook, landing page copy, lead capture, thank-you sequence, and a paired campaign. Each generation is unique, scored against an 8-point quality gate.",
    action: "Type a niche offer and generate — watch it build the full funnel live.",
  },
  {
    id: 42, chapter: 'Funnels & AI Builders', title: 'Funnels Library',
    route: '/funnels',
    body: "Every generated or hand-built funnel lives here with its pages, conversion settings, and status. Funnels created by the Genie or the AI Campaign Architect appear instantly — the whole platform writes into one store, so there's never a sync step.",
  },
  {
    id: 43, chapter: 'Funnels & AI Builders', title: 'AI Campaign Architect',
    route: '/ai',
    body: "The flagship AI workspace: give it a campaign concept and it synthesizes the FULL asset stack in one build — funnel, lead form, automation workflow, email sequence, SMS sequence, and a blog post — all synchronized around your concept, all saved as real records you can edit.",
    action: "Use the pre-loaded prompt and hit build. Watch the compile log narrate each asset's creation.",
  },
  {
    id: 44, chapter: 'Funnels & AI Builders', title: 'The AI Agent Fleet',
    route: '/ai?tab=agents',
    body: "Six specialized agents run the practice around the clock: Intake (parses and files documents), Notice Resolution (decodes IRS letters, drafts responses), Lifecycle Drip (manages sequence enrollment/exits), Refund Watch (monitors timelines, adjusts client comms), Funnel Architect, and Payout Ledger. Each shows exactly what it's wired to and where its human-approval gates sit.",
    proTip: "Minimal human approval is the design: agents do the work, you approve the sensitive 5% — payouts, IRS responses, anything money or legal.",
  },
  {
    id: 45, chapter: 'Funnels & AI Builders', title: 'Refund Maximizer',
    route: '/ai?tab=refund',
    body: "The Refund Maximizer re-runs the TY2025 engine against optimization moves — traditional IRA contribution, HSA, missed Schedule C expenses, head-of-household status check — and shows the exact dollar delta of each move. This turns every return review into an advisory upsell backed by math.",
  },
  {
    id: 46, chapter: 'Funnels & AI Builders', title: 'Voice Mode',
    route: '/ai?tab=voice',
    body: "Ask tax questions out loud — Voice Mode listens (browser speech recognition), routes the question through the on-device IRS engine, and speaks the answer back. Deadlines, refund timing, standard deduction, CTC amounts, audit triggers. Great for preparers mid-appointment with hands on the keyboard.",
    action: "Click the mic and ask: 'When is the filing deadline?'",
  },

  // ─── CHAPTER 8: AUTOMATIONS & WORKFLOWS (47–51) ───
  {
    id: 47, chapter: 'Automations & Workflows', title: 'Master Automation Recipes',
    route: '/workflows',
    body: "Ten pre-wired recipes cover the entire practice: Speed-to-Lead (respond in under 60 seconds), Onboarding, Docs-Complete detection, Return-Filed → Refund Concierge + payout accrual, Referral Engine, Appointment Guard, Season Kickoff, Extension Guardian, IRS Notice Intake, and the Bi-Weekly Payout Cycle.",
  },
  {
    id: 48, chapter: 'Automations & Workflows', title: 'Recipes Install Their Drips',
    route: '/workflows',
    body: "Here's the wiring magic: installing a recipe ALSO installs every drip campaign it enrolls contacts into. Install 'Speed-to-Lead' and the New Lead sequence appears in Campaigns automatically. The wiring map on each recipe card shows the full chain: trigger → actions → drips → exit conditions.",
    action: "Expand a recipe's wiring map and trace the chain from trigger to final touch.",
  },
  {
    id: 49, chapter: 'Automations & Workflows', title: 'The 50-Template Catalog',
    route: '/workflows',
    body: "Below the master recipes sits a 50-template automation catalog organized by category — lead nurture, client service, internal ops, compliance. Each installs as a working workflow you can toggle on/off and customize.",
  },
  {
    id: 50, chapter: 'Automations & Workflows', title: 'Approval Gates',
    route: '/workflows',
    body: "Automations that touch money or legal exposure pause at approval gates: the payout cycle compiles the batch but waits for your one click; the notice-response agent drafts but never sends without sign-off. Full automation with a human veto at exactly the right moments.",
  },
  {
    id: 51, chapter: 'Automations & Workflows', title: 'Pipelines',
    route: '/pipelines',
    body: "Deal pipelines track revenue in motion: tax prep engagements, credit repair plans, advisory retainers. Stages, values, close probability. Workflows can move deals automatically — a signed engagement letter advances the deal, a filed return closes it.",
  },

  // ─── CHAPTER 9: VIDEO, CONVERSATIONS & CALENDAR (52–55) ───
  {
    id: 52, chapter: 'Video, Conversations & Calendar', title: 'Video Consultation Suite',
    route: '/video',
    body: "Full video consultations in the browser: camera + mic preview, live calls, screen sharing with picture-in-picture self-view, mute/camera toggles, call timer, invite links. Works RIGHT NOW with zero configuration for 1-on-1; adding Cloudflare Calls secrets upgrades it to multi-party SFU globally.",
    action: "Click 'Start Preview' to see your camera load — that's the zero-key path working.",
  },
  {
    id: 53, chapter: 'Video, Conversations & Calendar', title: 'The Consultation Protocol',
    route: '/video',
    body: "The 5-point consultation protocol on the right side keeps every call compliant with Pub 4557: verify identity, confirm consent for any recording, share screens not files, log the session, follow up in writing. The upcoming-appointments rail lets you jump into scheduled calls in one click.",
  },
  {
    id: 54, chapter: 'Video, Conversations & Calendar', title: 'Unified Conversations',
    route: '/conversations',
    body: "SMS threads, emails, and portal messages in one inbox, one thread per client. When Twilio keys are added, real two-way SMS flows through here. Reply from the same screen the drip engine sends from — clients experience one seamless conversation.",
  },
  {
    id: 55, chapter: 'Video, Conversations & Calendar', title: 'Calendar & Booking',
    route: '/calendar',
    body: "Appointment scheduling with day/week/month views. The Appointment Guard recipe wraps every booking in confirmations, reminders (48h, 24h, 2h), and a no-show rescue sequence that re-books lost appointments automatically.",
  },

  // ─── CHAPTER 10: AGENCY, PAYOUTS & SUB-ACCOUNTS (56–60) ───
  {
    id: 56, chapter: 'Agency, Payouts & Sub-Accounts', title: 'The Service Bureau Model',
    route: '/admin',
    body: "Admin → Sub-Accounts is where you become a platform, not a practice: provision independent workspaces for offices you sign, each with its own branding, domain, clients, and campaigns. You are the master account; they operate under you; the platform meters it all.",
    action: "Click 'Provision Sub-Account Node' to see the white-label setup form.",
  },
  {
    id: 57, chapter: 'Agency, Payouts & Sub-Accounts', title: 'Preparer Management',
    route: '/preparers',
    body: "Every preparer under your bureau: credentials, assigned clients, return volume, performance. This is the roster that feeds the payout engine — each preparer's filed returns accrue their revenue split automatically.",
  },
  {
    id: 58, chapter: 'Agency, Payouts & Sub-Accounts', title: 'The Payout Pipeline',
    route: '/analytics?tab=performance',
    body: "The three-stage payout pipeline: (1) every filed return accrues 30% to the preparer's ledger via the worker API, (2) the bi-weekly cycle compiles the batch and holds for your single approval, (3) approval fires Stripe Connect transfers to each preparer's bank. Money flows on rails; you touch it once per cycle.",
  },
  {
    id: 59, chapter: 'Agency, Payouts & Sub-Accounts', title: 'Sub-Account Scoreboard',
    route: '/analytics?tab=performance',
    body: "Compare every location head-to-head: returns filed, average fee, revenue, preparer count, lead conversion, refund advances, payouts owed, NPS. This is the P&L view a bureau owner runs monthly reviews from — weak locations show up immediately.",
  },
  {
    id: 60, chapter: 'Agency, Payouts & Sub-Accounts', title: 'White-Label & Reselling',
    route: '/admin',
    body: "Branding tab: your logo, your colors, their domain. API Pipelines tab: issue keys to sub-accounts for their own integrations. You can resell this platform under any brand — every pixel of the client-facing surface is skinnable per tenant.",
  },

  // ─── CHAPTER 11: COMPLIANCE, ADMIN & GO-LIVE (61–64) ───
  {
    id: 61, chapter: 'Compliance, Admin & Go-Live', title: 'The Audit Log',
    route: '/admin?tab=logs',
    body: "Append-only, categorized, searchable: every login, every client-record view, every payout approval, every automation action, every blocked intrusion attempt. Seven-year retention per Pub 4557. When anyone asks 'who touched this record and when' — the answer is one search away.",
  },
  {
    id: 62, chapter: 'Compliance, Admin & Go-Live', title: 'The Compliance Matrix',
    route: '/admin?tab=compliance',
    body: "Ten live controls mapped to their actual enforcement points: §7216 consent gating, WISP/Safeguards Rule status, TCPA SMS consent, CAN-SPAM footers, Form 8867 due-diligence blocking, CROA contract rules, role-based access. Each shows PASSING or ATTENTION with the system feature that enforces it. Compliance you can demonstrate, not just claim.",
  },
  {
    id: 63, chapter: 'Compliance, Admin & Go-Live', title: 'Integrations & Settings',
    route: '/settings?tab=integrations',
    body: "The integration wall: tax software connectors (TaxSlayer, Drake, ProSeries, Lacerte…), IRS services, payment rails, communication channels. Each card shows connection status and exactly what credential it needs. The Cloudflare worker's /api/health endpoint mirrors this server-side.",
  },
  {
    id: 64, chapter: 'Compliance, Admin & Go-Live', title: "You're Ready — Go Live",
    route: '/dashboard',
    body: "You now know every module: CRM, Tax Intelligence, Document OCR, Drips, Funnels, AI Agents, Video, Payouts, Compliance. Next steps: (1) import your clients via CSV, (2) install your drip campaigns and master recipes, (3) add Twilio/Stripe keys when ready for live channels, (4) provision your first sub-account. The Help Center (top bar) holds the full written manual and the client portal guide. Welcome to the elite tier. 🏆",
    proTip: "Re-run any chapter anytime. New team members should complete the full tutorial in their first week — it's the fastest complete training a tax office has ever had.",
  },

  // ─── CHAPTER 12: GROWTH ENGINE & MARKET DOMINATION (65–72) ───
  {
    id: 65, chapter: 'Growth Engine & Market Domination', title: 'Bank Products — Fund the Season',
    route: '/bank-products',
    body: "This desk runs the money side of storefront tax: refund transfers (client pays $0 upfront), same-day advances of $500–$7,000, and disbursement tracking across TPG, EPS, Refund Advantage and Republic Bank. Watch the status pipeline: IRS Pending → IRS Funded → Fees Deducted → Disbursed. The Pre-Approved Advance Desk at the bottom shows clients who pre-qualified through your lead magnet — banking info already captured and verified.",
    proTip: "The 'Bureau E-file Overrides' KPI is the CrossLink killer: every bank-product return filed in your downline accrues a per-return override to you automatically.",
    action: "Click through the status filter pills and open the Pre-Approved Advance Desk.",
  },
  {
    id: 66, chapter: 'Growth Engine & Market Domination', title: 'Recruiting Network — Your Downline, Live',
    route: '/network',
    body: "No other tax platform has this. The downline tree shows every mentor, preparer and trainee you or your recruits brought in — with live returns filed, gross fees, net earnings and override flow up the chain. Click any member to see their season card, EFIN status and compliance holds. The 'Copy Recruiting Link' button generates a personal signup link that auto-attaches new recruits to the right sponsor.",
    proTip: "Pair this with the AI Campaign Architect to run recruiting drips — 'Become a tax preparer, we train you' funnels feed straight into the tree.",
    action: "Expand the downline tree and click a member to open their earnings card.",
  },
  {
    id: 67, chapter: 'Growth Engine & Market Domination', title: 'Credit Repair — Recurring Revenue Between Seasons',
    route: '/credit-repair',
    body: "Turn-key credit repair as a service: CROA-compliant agreements pre-loaded, a built-in Metro 2® dispute engine with FCRA §609/§611 letter library, and one-click plugins for Credit Repair Cloud, DisputeFox and report feeds if you already use them. The roster tracks each client's score journey, deletions and monthly fee — that's $99–$199/mo recurring revenue in your off-season.",
    proTip: "The Credit Score Impact Simulator lead magnet cross-sells this to your existing tax clients automatically.",
    action: "Open the Dispute Tracker tab and hit 'AI Draft' on a letter template.",
  },
  {
    id: 68, chapter: 'Growth Engine & Market Domination', title: 'Lead Magnets Studio — Premium Capture Assets',
    route: '/lead-magnets',
    body: "Nine agency-grade lead magnets — refund estimators, checklists, quizzes, the Advance Pre-Qualifier, IRS letter decoder and more. Every one auto-brands with your logo and colors, deploys to a matching capture funnel, and fires its drip sequence on opt-in. The embed code drops any magnet onto any website you own.",
    proTip: "The 'Refund Advance Pre-Qualifier' converts at 61% and feeds pre-approvals directly into the Bank Products desk.",
    action: "Select a magnet, review its funnel + drip wiring, and click 'Deploy Branded & Go Live'.",
  },
  {
    id: 69, chapter: 'Growth Engine & Market Domination', title: 'Integrations Hub — Everything Connects',
    route: '/integrations',
    body: "One encrypted vault for every credential: IRS e-Services (transcripts, TIN matching, CAF), MeF A2A certificates, all four bank partners, Stripe, Twilio, SendGrid, OpenAI, QuickBooks, DocuSign, credit repair software, Meta and Google ads. Keys are AES-256 encrypted, used server-side only, and every use hits the audit log. Anything we don't have natively connects through Zapier with your API key.",
    proTip: "The green IRS spotlight card at the top confirms your e-Services key is live — that's transcript pulls without leaving the platform.",
    action: "Click 'Manage IRS Credentials' to see the secure key vault modal.",
  },
  {
    id: 70, chapter: 'Growth Engine & Market Domination', title: 'Migration Center — Switching Costs: Deleted',
    route: '/migration',
    body: "Anyone leaving Drake, ProSeries, Lacerte, UltraTax, TaxWise, CrossLink, TaxSlayer Pro, ATX, TaxDome, Canopy or GoHighLevel imports their book of business here in minutes. Pick the platform, follow its export steps, upload the CSV — fields auto-map, duplicates are skipped, SSNs are masked to last-4, and every contact lands tagged with its source.",
    proTip: "This is your #1 sales weapon: 'bring your data, we'll have you live today' kills the biggest objection to switching.",
  },
  {
    id: 71, chapter: 'Growth Engine & Market Domination', title: 'Self-Serve Onboarding — They Sign Up, We Build It',
    route: '/onboard',
    body: "This is what your prospects see: choose a plan ($199 / $399 / $899 per month), enter company info, upload a logo, pick brand colors with live preview, pay — and the provisioning engine builds their entire branded tenant in under 60 seconds: portal, pipelines, 8 drip sequences, bank desk, client portal, e-sign. All wearing their brand, on their own subdomain.",
    proTip: "Send demo prospects the public link (/#/signup-company) — the onboarding IS the closing pitch.",
  },
  {
    id: 72, chapter: 'Growth Engine & Market Domination', title: 'Tenant Studio — Your Master Admin Throne',
    route: '/tenant-studio',
    body: "And this is YOUR desk, platform owner. Close a deal on the phone, hit 'Build New Tenant', drop in their logo, company name and colors — their fully-branded platform is live before you hang up. Suspend, reactivate, re-brand or 'View As' any tenant. Two paths, one platform: they self-serve at /#/onboard, or you white-glove it here. This is how you take over the tax industry. 🏆",
    proTip: "'View As' impersonation shows you exactly what a tenant sees — perfect for support calls and demos.",
  },
];

export const TUTORIAL_STORAGE_KEY = 'vtp_tutorial_progress_v1';

export interface TutorialProgress {
  currentStep: number;
  completedSteps: number[];
  dismissed: boolean;
  completedAt?: string;
}

export function loadTutorialProgress(): TutorialProgress {
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { currentStep: 1, completedSteps: [], dismissed: false };
}

export function saveTutorialProgress(p: TutorialProgress) {
  try { localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
