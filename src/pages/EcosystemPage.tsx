import { useState, useEffect, useRef } from 'react';
import { 
  Layers, PhoneCall, ShieldCheck, Database, Smartphone, FileText, 
  CreditCard, BookOpen, Users, Cpu, Radio, Sparkles, Languages, 
  Settings, Award, Lock, HelpCircle, ArrowUpRight, CheckCircle, 
  AlertTriangle, Play, RefreshCw, Send, SlidersHorizontal, Image, 
  Video, Music, Check, UserCheck, Star, Activity, Plus, TrendingUp, Search, Globe
} from 'lucide-react';
import { useAppStore } from '../store';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ==========================================
// THE 40 MODULES DEF & MOCK SIMULATIONS
// ==========================================

export interface EcosystemModule {
  id: string;
  name: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5' | 'tier6';
  tierLabel: string;
  description: string;
  bulletPoints: string[];
  icon: any;
  interactiveSim: string; // ID of custom interactive modal/pane
}

const moduleList: EcosystemModule[] = [
  // TIER 1
  {
    id: 'mobile-apps',
    name: 'Native Mobile Apps (iOS + Android)',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'Fully native Expo React Native apps for both tax preparers and client document ingestion.',
    bulletPoints: [
      'Auto-edge-detecting camera scanner with instant W-2 OCR parsing.',
      'White-label builds compiled dynamically per sub-account (Expo EAS Build).',
      'Secure biometrics (Face ID/Fingerprint), offline sync, and push alerts.'
    ],
    icon: Smartphone,
    interactiveSim: 'sim-mobile-apps'
  },
  {
    id: 'client-portal',
    name: 'Secure Client Portal',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'Self-service dashboard secure node for client-side uploads, status tracking, and payments.',
    bulletPoints: [
      'Intake ➔ Under Review ➔ Filed ➔ Accepted visual return progress timeline.',
      'Bank-grade MFA login with interactive smart-form tax organizer branching.',
      'Prior-year comparisons, integrated DocuSign center, and bilingual toggle.'
    ],
    icon: ShieldCheck,
    interactiveSim: 'sim-client-portal'
  },
  {
    id: 'invoicing-ar',
    name: 'Invoicing & AR Automation',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'Bespoke billing engine with AR aging matrices, installment options, and dunning sequences.',
    bulletPoints: [
      'Split fees into customizable multi-month payment programs.',
      'Pay-by-link via automated SMS, email, and WhatsApp templates.',
      'State-by-state sales tax calcs, auto-debit accounts, and dunning automation.'
    ],
    icon: CreditCard,
    interactiveSim: 'sim-invoicing-ar'
  },
  {
    id: 'bookkeeping',
    name: 'Bookkeeping & Bank Feeds',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'Year-round transactional ledger with direct Plaid integrations and automated categorization.',
    bulletPoints: [
      'Plaid-connected bank reconciliation feed with cognitive AI rules.',
      'Generates automated P&L, Balance Sheets, and Cash Flow per tenant.',
      'Exports direct transaction digests straight into Schedule C tax preparation.'
    ],
    icon: Database,
    interactiveSim: 'sim-bookkeeping'
  },
  {
    id: 'lms',
    name: 'CE Learning Management System (LMS)',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'Double-sided educational hub to train preparers and sell tax courses to the public.',
    bulletPoints: [
      'CE credits tracking, interactive quizzes, and branded PDF certificates.',
      'Stripe course gate for creating automated off-season passive income.',
      'Built-in AI cognitive tutor answering student tax questions.'
    ],
    icon: BookOpen,
    interactiveSim: 'sim-lms'
  },
  {
    id: 'community',
    name: 'Community Forums & Groups',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'In-house forum engine for client engagement and public lead-generation.',
    bulletPoints: [
      'Private clients-only channels and open public tax strategy groups.',
      'Gamified status leaderboards, badges, and webinar AMA events.',
      'AI moderation filters to flags profanity or off-brand comments.'
    ],
    icon: Users,
    interactiveSim: 'sim-community'
  },
  {
    id: 'voip-callcenter',
    name: 'VoIP Call Center & IVR',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'Cloud VoIP with smart interactive voice response routing, recording, and whisper coaching.',
    bulletPoints: [
      'Smart IVR ("Press 1 for preparation...") with call queues and hold music.',
      'Cognitive call analysis scoring talk-ratio, sentiments, and objections.',
      'Local presence area-code caller-ID matching and power dialers.'
    ],
    icon: PhoneCall,
    interactiveSim: 'sim-voip-callcenter'
  },
  {
    id: 'proposal-builder',
    name: 'Proposal & Quote Builder',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'Collaborative client onboarding strategist that compiles templates, fee lists, and add-ons.',
    bulletPoints: [
      'Interactive pricing sheets with Audit Shield and refund advances.',
      'Collaborative editor, inline signatures, and client engagement counters.',
      'Automatically logs deals and invoices upon proposal acceptance.'
    ],
    icon: FileText,
    interactiveSim: 'sim-proposal-builder'
  },
  {
    id: 'engagement-letters',
    name: 'Engagement Letter Generator',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'Mandated IRS Circular 230 and state ethics rule compiler for professional services.',
    bulletPoints: [
      'Surgical templates for 1040, 1120-S, 1065, and audit representations.',
      'Auto-injects required disclosures and state-specific legal riders.',
      'Annual renewals automation, e-signatures, and secure WORM backups.'
    ],
    icon: FileText,
    interactiveSim: 'sim-engagement'
  },
  {
    id: 'multi-entity',
    name: 'Multi-Entity & Family Office',
    tier: 'tier1',
    tierLabel: 'Tier 1 — Missing Core Modules',
    description: 'High-net-worth client console tracking multiple LLCs, S-Corps, trusts, and dependents.',
    bulletPoints: [
      'Consolidates cross-entity transaction dashboards inside a single household.',
      'Trust administration loggers and estate planning indicators (Form 706/709).',
      'Charitable contributions tracker, partnership allocations, and multi-state.'
    ],
    icon: Layers,
    interactiveSim: 'sim-multi-entity'
  },

  // TIER 2
  {
    id: 'ai-memory',
    name: 'Proprietary AI Memory Layer',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Cognitive relationship graphs tracking years of interaction histories per household.',
    bulletPoints: [
      'Knowledge graph connecting past discussions, corporate setups, and letters.',
      'Recalls historical data ("Client was planning an S-Corp setup last spring").',
      'Deep semantic querying ("Show rental owners in NM who have not filed").'
    ],
    icon: Cpu,
    interactiveSim: 'sim-ai-memory'
  },
  {
    id: 'voice-agent',
    name: 'Cognitive Voice Agent',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Sub-second latency voice assistant answering, qualifying leads, and booking calendars.',
    bulletPoints: [
      'Automated inbound call router with pre-qualification smart scripts.',
      'Outbound lead re-engagement engine compliant with TCPA disclosure rules.',
      'Voice-cloning allows using your prep officer\'s voice with secure consent.'
    ],
    icon: PhoneCall,
    interactiveSim: 'sim-voice-agent'
  },
  {
    id: 'irs-watcher',
    name: 'IRS Real-Time Status Watcher',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Direct polling integrations with IRS MeF and e-services for instant client tracking.',
    bulletPoints: [
      'Polls visual return ACK logs from IRS database nodes every 15 mins.',
      'Retrieves "Where\'s My Refund" states and triggers client notifications.',
      'Early notices detection via direct CAF mailbox monitor integrations.'
    ],
    icon: Radio,
    interactiveSim: 'sim-irs-watcher'
  },
  {
    id: 'tax-optimization',
    name: 'Tax Optimization Engine',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Forward-looking scenario advisor tracking 300+ tax-savings playbook variables.',
    bulletPoints: [
      'Real-time tax liabilities modeling based on running bookkeeping.',
      'Triggers alerts ("Client turning 50, prompt IRA catch-up contributions").',
      'Calculates Roth conversion ladders and tax-loss harvesting targets.'
    ],
    icon: TrendingUp,
    interactiveSim: 'sim-tax-optimization'
  },
  {
    id: 'embedded-finance',
    name: 'Embedded Finance (BaaS)',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Integrated Stripe debit card issuance and client banking ledgers for your firm.',
    bulletPoints: [
      'Issue branded business debit cards (Stripe Issuing) with cash-back splits.',
      'Finance preparation costs or underwrite refund advance programs directly.',
      'Offers crypto USDC payment gateways for fast international client transfers.'
    ],
    icon: CreditCard,
    interactiveSim: 'sim-embedded-finance'
  },
  {
    id: 'multi-language',
    name: 'Multi-Language Translation Suite',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Translates all dashboards, documents, and communication logs on-the-fly.',
    bulletPoints: [
      'Fully-localized UI across 12+ standard corporate languages.',
      'Translation agents for all incoming chat, SMS, and email payloads.',
      'Specialized ITIN interfaces, expatriate forms, and foreign treaties.'
    ],
    icon: Languages,
    interactiveSim: 'sim-multi-language'
  },
  {
    id: 'agent-marketplace',
    name: 'AI Agent Marketplace',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Install specialized cognitive agents customized for specific industries.',
    bulletPoints: [
      'Download pre-built agents: California Real Estate, OnlyFans Creator Coach, etc.',
      'Submit custom-trained agents with shared usage revenue payout models.',
      'Connect custom MCP servers to feed live specialist APIs.'
    ],
    icon: Cpu,
    interactiveSim: 'sim-agent-marketplace'
  },
  {
    id: 'benchmarking',
    name: 'Practice Benchmarking Network',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Anonymized dataset comparing sub-account fee densities and retention scales.',
    bulletPoints: [
      'Benchmarks pricing profiles ("Your avg prep fee is $X, peer avg is $Y").',
      'Tracks employee speed metrics against national CPA agency cohorts.',
      'Turn anonymized data metrics into valuable standalone reports.'
    ],
    icon: Activity,
    interactiveSim: 'sim-benchmarking'
  },
  {
    id: 'gamification',
    name: 'Gamification & XP Streaks',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Engaging streaks and achievements system to motivate preparers and client intakes.',
    bulletPoints: [
      'Reward achievements (e.g. "100 Returns Filed", "First Audit Shield sold").',
      'Tracks visual streaks, leaderboards, and quarterly agency contests.',
      'Exportable public performance resumes for certified tax pros.'
    ],
    icon: Award,
    interactiveSim: 'sim-gamification'
  },
  {
    id: 'nocode-builder',
    name: 'No-Code Module Builder',
    tier: 'tier2',
    tierLabel: 'Tier 2 — Differentiation Layers',
    description: 'Drag-and-drop builder to craft completely custom CRM database tables.',
    bulletPoints: [
      'Define database object relationships and link views to layout nodes.',
      'Create customized forms and reporting charts without writing code.',
      'AI assistant helps build tables ("Build a crypto portfolio tracker").'
    ],
    icon: Settings,
    interactiveSim: 'sim-nocode-builder'
  },

  // TIER 3
  {
    id: 'security-cert',
    name: 'SOC 2 + FedRAMP Regulatory Path',
    tier: 'tier3',
    tierLabel: 'Tier 3 — Enterprise & Government',
    description: 'Real-time evidence tracking dashboard mapped to SOC 2 and IRS Pub 1075 standards.',
    bulletPoints: [
      'WORM-encrypted database nodes with BYOK key vault integrations.',
      'Auto-collected log traces for security auditor portal handoffs.',
      'Pre-audited compliance mapping to GLBA Safeguards and HIPAA BAA.'
    ],
    icon: Lock,
    interactiveSim: 'sim-security'
  },
  {
    id: 'accessibility',
    name: 'WCAG 2.1 AAA & Dyslexia Fonts',
    tier: 'tier3',
    tierLabel: 'Tier 3 — Enterprise & Government',
    description: 'Enforces complete Section 508 and high-contrast accessibility compliance.',
    bulletPoints: [
      'In-browser toggle switches to instantly load high-contrast and OpenDyslexic views.',
      'Full semantic tag trees and keyboard-only navigational controls.',
      'Screen-reader compatible layouts and plain-language accessibility translations.'
    ],
    icon: Users,
    interactiveSim: 'sim-accessibility'
  },
  {
    id: 'sso-scim',
    name: 'Enterprise SSO & SCIM',
    tier: 'tier3',
    tierLabel: 'Tier 3 — Enterprise & Government',
    description: 'SAML 2.0 active directory single-sign-on and employee auto-deprovisioning.',
    bulletPoints: [
      'Connects with Okta, Azure AD, and Google Workspace instantly.',
      'Just-in-time user creation and SCIM-based automatic offboarding.',
      'IP white-listing parameters and conditional device security checkups.'
    ],
    icon: Lock,
    interactiveSim: 'sim-sso'
  },
  {
    id: 'data-residency',
    name: 'Data Sovereignty & BYOK',
    tier: 'tier3',
    tierLabel: 'Tier 3 — Enterprise & Government',
    description: 'Region-locked cloud nodes compliant with GDPR and customer-managed HSM keys.',
    bulletPoints: [
      'Lock files into US, EU (GDPR), or CA region-locked R2 database buckets.',
      'Bring-Your-Own-Key (BYOK) encryption layers utilizing HashiCorp Vault.',
      'Isolated air-gapped server options for federal government clients.'
    ],
    icon: ShieldCheck,
    interactiveSim: 'sim-data-residency'
  },
  {
    id: 'audit-discovery',
    name: 'eDiscovery & Immutable WORM',
    tier: 'tier3',
    tierLabel: 'Tier 3 — Enterprise & Government',
    description: 'Litigation-hold capabilities enabling instant forensic metadata exporting.',
    bulletPoints: [
      'Enforces WORM-compliant 7-year storage for tax records and client chats.',
      'Single-click litigation lock freezes all log editing or removal.',
      'Forensic SHA-256 hash chaining maps entire custody transfers.'
    ],
    icon: FileText,
    interactiveSim: 'sim-discovery'
  },
  {
    id: 'bug-bounty',
    name: 'Continuous Pentesting & Bounty',
    tier: 'tier3',
    tierLabel: 'Tier 3 — Enterprise & Government',
    description: 'Active threat diagnostics tracking automated SAST pipelines and HackerOne programs.',
    bulletPoints: [
      'Daily automated static security testing baked into CI pipelines.',
      'Publishes vulnerability reports onto an open, transparent dashboard.',
      'Integration points for live monitoring of responsible disclosures.'
    ],
    icon: ShieldCheck,
    interactiveSim: 'sim-bug-bounty'
  },
  {
    id: 'multi-region',
    name: 'Active-Active Multi-Region Infra',
    tier: 'tier3',
    tierLabel: 'Tier 3 — Enterprise & Government',
    description: 'Three-region Cloudflare Worker failover structures boasting <15 min recovery times.',
    bulletPoints: [
      'Global, sub-millisecond edge routes utilizing Cloudflare Hyperdrive.',
      'Uptime meters integrated with public incident status pages.',
      'Automatic failover logs and live stress test simulation triggers.'
    ],
    icon: Radio,
    interactiveSim: 'sim-multiregion'
  },

  // TIER 4
  {
    id: 'app-store',
    name: 'OAuth Developer App Store',
    tier: 'tier4',
    tierLabel: 'Tier 4 — Growth & Reseller',
    description: 'Third-party app ecosystem enabling custom integrations and payouts.',
    bulletPoints: [
      'OAuth-based API scopes for custom external extensions.',
      'Integrate, review, and monetize third-party scripts at 70/30 splits.',
      'Comprehensive developer portal, Webhooks, and testing sandboxes.'
    ],
    icon: Settings,
    interactiveSim: 'sim-appstore'
  },
  {
    id: 'academy',
    name: 'CPA Reseller Academy',
    tier: 'tier4',
    tierLabel: 'Tier 4 — Growth & Reseller',
    description: 'Online certification portal training and empowering service-bureau resellers.',
    bulletPoints: [
      'Tracks Bronze, Silver, and Gold Partner certified milestones.',
      'Provides resellers with marketing decks, templates, and script cards.',
      'Joint lead sharing routing clients directly to elite partners.'
    ],
    icon: Award,
    interactiveSim: 'sim-academy'
  },
  {
    id: 'partner-portal',
    name: 'Partner Marketing Portal',
    tier: 'tier4',
    tierLabel: 'Tier 4 — Growth & Reseller',
    description: 'White-label collateral suite and shared marketing co-op fund allocations.',
    bulletPoints: [
      'Tracks partner analytics, referrals, and commission splits.',
      'Collaborative webinars scheduler and reseller contract boards.',
      'Integrates custom invoicing rules per service partner bureau.'
    ],
    icon: Globe,
    interactiveSim: 'sim-partner'
  },
  {
    id: 'affiliates',
    name: 'Affiliate Commission Engines',
    tier: 'tier4',
    tierLabel: 'Tier 4 — Growth & Reseller',
    description: 'Automated referral dashboard offering 30-40% recurring commissions.',
    bulletPoints: [
      'Tracks lead clicks, cookie conversions, and payouts automatically.',
      'Auto-generates private landing pages and tracked affiliate linkages.',
      'Stripe-connected direct wire, PayPal, or ACH payouts structures.'
    ],
    icon: CreditCard,
    interactiveSim: 'sim-affiliates'
  },

  // TIER 5
  {
    id: 'product-analytics',
    name: 'Self-Hosted Product Analytics',
    tier: 'tier5',
    tierLabel: 'Tier 5 — Operational Excellence',
    description: 'Privacy-first tracking dashboard monitoring page heatmaps and replays.',
    bulletPoints: [
      'In-browser cursor tracking, visual heatmaps, and session replays.',
      'Auto-aggregates retention grids and feature adoption logs.',
      'Allows creating target experiments and target user A/B cohorts.'
    ],
    icon: Activity,
    interactiveSim: 'sim-analytics'
  },
  {
    id: 'helpdesk',
    name: 'AI Support Ticketing & SLA',
    tier: 'tier5',
    tierLabel: 'Tier 5 — Operational Excellence',
    description: 'Complete ticketing desk with real-time response counters and SLA timers.',
    bulletPoints: [
      'Embedded video help centers and AI assistants resolving 70% of tickets.',
      'Automated routing queues tracking Tier 1, 2, and 3 engineering help.',
      'Presents CSAT scores and employee response timelines.'
    ],
    icon: HelpCircle,
    interactiveSim: 'sim-helpdesk'
  },
  {
    id: 'oncall',
    name: 'PagerDuty On-Call Incident Center',
    tier: 'tier5',
    tierLabel: 'Tier 5 — Operational Excellence',
    description: 'Critical incident alert coordinator tracking blameless post-mortem reports.',
    bulletPoints: [
      'Triggers automated SMS on-call alerts if page response latency drops.',
      'Collaborative Slack/Teams war room schedulers and status tools.',
      'Publishes public root-cause post-mortems and resolutions histories.'
    ],
    icon: AlertTriangle,
    interactiveSim: 'sim-oncall'
  },
  {
    id: 'experimentation',
    name: 'Vite A/B Experimentation Engine',
    tier: 'tier5',
    tierLabel: 'Tier 5 — Operational Excellence',
    description: 'Deploys UI variants, calculates significance scales, and auto-promotes winners.',
    bulletPoints: [
      'Auto-injects alternative button copy or layout formats onto endpoints.',
      'Measures client click-through rates with statistical confidence grids.',
      'Auto-promotes variant winners once target metrics are satisfied.'
    ],
    icon: RefreshCw,
    interactiveSim: 'sim-experiments'
  },
  {
    id: 'warehouse',
    name: 'BI Snowflake & dbt Data Pipelines',
    tier: 'tier5',
    tierLabel: 'Tier 5 — Operational Excellence',
    description: 'Syncs databases with corporate warehouses and embedded SQL connectors.',
    bulletPoints: [
      'Syncs records to Snowflake, BigQuery, or Redshift pools nightly.',
      'Provides custom SQL queries directly inside an interactive panel.',
      'Integrates reverse-ETL pipelines to feed leads back to CRM nodes.'
    ],
    icon: Database,
    interactiveSim: 'sim-warehouse'
  },

  // TIER 6
  {
    id: 'editorial',
    name: 'IRS News Editorial Hub',
    tier: 'tier6',
    tierLabel: 'Tier 6 — Ecosystem Content',
    description: 'Tax news compiler parsing federal feeds and generating automated newsletters.',
    bulletPoints: [
      'Scans IRS RSS feeds hourly and writes draft campaign tip articles.',
      'Built-in audio podcast hosting and transcription (Whisper index).',
      'Auto-publishes weekly newsletter campaign digests across lists.'
    ],
    icon: BookOpen,
    interactiveSim: 'sim-editorial'
  },
  {
    id: 'events',
    name: 'Native Webinars & AMAs',
    tier: 'tier6',
    tierLabel: 'Tier 6 — Ecosystem Content',
    description: 'WebRTC video hosting with live registration counters and lead links.',
    bulletPoints: [
      'Interactive video streaming requiring no external Zoom or Loom links.',
      'In-session CTA buttons prompting viewers to book prep appointments.',
      'Auto-records webinars and files assets directly into DAM folders.'
    ],
    icon: Video,
    interactiveSim: 'sim-events'
  },
  {
    id: 'partnerships',
    name: 'Strategic APIs Premium Tier',
    tier: 'tier6',
    tierLabel: 'Tier 6 — Ecosystem Content',
    description: 'Direct deep integrations with TaxSlayer, Stripe, and Plaid core systems.',
    bulletPoints: [
      'Synchronizes return files into TaxSlayer CPA servers dynamically.',
      'Direct Plaid verification of income streams and refund profiles.',
      'Co-branded badges signifying high-level elite platform partners.'
    ],
    icon: Award,
    interactiveSim: 'sim-partnerships'
  },
  {
    id: 'content-factory',
    name: 'TikTok Video Content Factory',
    tier: 'tier6',
    tierLabel: 'Tier 6 — Ecosystem Content',
    description: 'Repurposes written logs into automated talking-head AI video shorts.',
    bulletPoints: [
      'Generates scripts, schedules automated ElevenLabs vocal overdubs.',
      'Creates visual AI templates mapping hashtags to rideshare/small-business.',
      'Publishes directly to TikTok, IG Reels, and YouTube Shorts.'
    ],
    icon: Play,
    interactiveSim: 'sim-factory'
  }
];

export default function EcosystemPage() {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSimId, setActiveSimId] = useState<string | null>(null);

  // Filtered modules
  const filteredModules = moduleList.filter(mod => {
    const matchesTier = selectedTier === 'all' || mod.tier === selectedTier;
    const matchesQuery = searchQuery === '' || 
      mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.bulletPoints.some(bp => bp.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTier && matchesQuery;
  });

  // Simulator States
  // 1. Mobile App States
  const [phoneMode, setPhoneMode] = useState<'preparer' | 'client'>('client');
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrStep, setOcrStep] = useState(0);
  const [ocrResult, setOcrStepResult] = useState<any>(null);

  // 2. Client Portal States
  const [portalStep, setPortalStep] = useState<'login' | 'dashboard' | 'organizer'>('dashboard');
  const [mfaCode, setMfaCode] = useState('');
  const [timelineState, setTimelineState] = useState(1); // 0: Intake, 1: Under Review, 2: Filed, 3: Refund Accepted
  const [organizerAnswer, setOrganizerAnswer] = useState<string>('');

  // 3. Bookkeeping States
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categorizedCount, setCategorizedCount] = useState(0);
  const [transactions, setTransactions] = useState([
    { id: 1, desc: 'Chevron Fuel Tijeras', amt: -45.20, category: 'Uncategorized', date: 'May 24' },
    { id: 2, desc: 'Stripe Payout RJ Business', amt: 2850.00, category: 'Income', date: 'May 23' },
    { id: 3, desc: 'Office Depot Tax Folders', amt: -120.45, category: 'Uncategorized', date: 'May 22' },
    { id: 4, desc: 'Lyft In-App Fuel Bonus', amt: 67.00, category: 'Uncategorized', date: 'May 21' },
    { id: 5, desc: 'TurboTax Online Fee', amt: -89.00, category: 'Software Expense', date: 'May 20' }
  ]);

  // 4. Voice Agent States
  const [agentCalling, setAgentCalling] = useState(false);
  const [voiceDialogue, setVoiceDialogue] = useState<Array<{ role: 'client' | 'ai'; text: string; time: string }>>([]);
  const dialogScript: Array<{ role: 'client' | 'ai'; text: string }> = [
    { role: 'ai', text: "Hello! Thank you for calling Tax Pro Hub University. I'm your AI intake assistant. How can I help you optimize your taxes today?" },
    { role: 'client', text: "Hi! I drove about 15,000 miles for Lyft last year and wanted to know if I can write that off on my Schedule C?" },
    { role: 'ai', text: "Absolutely! For 2026, the IRS standard mileage rate is 67 cents. 15,000 miles translates to a $10,050 write-off directly off your business income. Would you like me to instantly text you our automated mileage tracker?" },
    { role: 'client', text: "Wow, yes please! That would save me a ton of hassle." },
    { role: 'ai', text: "Perfect! I've sent the link to your phone. I also have an open slot with CPA Loyce Sterling tomorrow at 2:00 PM MST to verify your other write-offs. Should I book that for you?" },
    { role: 'client', text: "Yes, 2:00 PM tomorrow works perfectly. Book it!" },
    { role: 'ai', text: "Excellent, you're booked! Your calendar confirmation and intake organizer forms have been sent. Have a wonderful day!" }
  ];

  // 5. Invoicing & AR States
  const [arPlan, setArPlan] = useState<'single' | 'installment'>('single');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(1200);
  const [installments, setInstallments] = useState<number>(3);

  // 6. Tax Optimization States
  const [scorpSalary, setScorpSalary] = useState(50000);
  const [bizRevenue, setBizRevenue] = useState(150000);
  const [retirementContrib, setRetirementContrib] = useState(10000);
  const [estimatedTaxes, setEstimatedTaxes] = useState(24500);

  // Recalculate Mock Tax Optimization
  useEffect(() => {
    // Basic tax optimization mock formulas
    const netIncome = bizRevenue - scorpSalary;
    const selfEmploymentSavings = netIncome * 0.153 * 0.4; // S-Corp savings approx
    const retirementSavings = retirementContrib * 0.22;
    const baseTax = (scorpSalary * 0.15) + (netIncome * 0.22);
    const optimized = baseTax - selfEmploymentSavings - retirementSavings;
    setEstimatedTaxes(optimized < 1200 ? 1200 : Math.round(optimized));
  }, [scorpSalary, bizRevenue, retirementContrib]);

  // Run Bookkeeping Auto-Categorization
  const handleRunBookkeepingAi = () => {
    setIsCategorizing(true);
    setCategorizedCount(0);
    setTimeout(() => {
      setTransactions(prev => prev.map(t => {
        if (t.desc.includes('Chevron')) return { ...t, category: 'Schedule C: Vehicle Gas' };
        if (t.desc.includes('Office Depot')) return { ...t, category: 'Schedule C: Office Supplies' };
        if (t.desc.includes('Lyft')) return { ...t, category: 'Business Income: Rideshare' };
        return t;
      }));
      setCategorizedCount(3);
      setIsCategorizing(false);
    }, 2500);
  };

  // Run Voice Agent Simulation
  const handleVoiceCallSim = () => {
    setAgentCalling(true);
    setVoiceDialogue([]);
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < dialogScript.length) {
        setVoiceDialogue(prev => [...prev, { ...dialogScript[index], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
        index++;
      } else {
        clearInterval(interval);
        setAgentCalling(false);
      }
    }, 3000);
  };

  // Run Mobile OCR Scanner Simulation
  const handleOcrSim = () => {
    setOcrScanning(true);
    setOcrStep(1);
    setOcrStepResult(null);

    setTimeout(() => {
      setOcrStep(2);
      setTimeout(() => {
        setOcrStep(3);
        setTimeout(() => {
          setOcrScanning(false);
          setOcrStepResult({
            form: 'Form W-2 (2026)',
            employer: 'RJ Business Solutions',
            ein: '84-2918472',
            wages: '$68,450.00',
            withholding: '$9,230.00',
            confidence: '99.8% Accuracy'
          });
        }, 1500);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#D4AF37] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              Enterprise Expansion Hub
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1 font-serif bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-amber-300 bg-clip-text text-transparent">
            Tax Pro Hub University Enterprise Ecosystem
          </h1>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-2xl">
            A comprehensive overview of our 40 premium core modules, regulatory moats, growth engines, and integration networks built for **{useAppStore.getState().currentSubAccount?.name || 'Tax Pro Hub University'}**. Click any card to launch an interactive simulation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[10px] font-mono text-[#D4AF37] font-black uppercase tracking-widest animate-pulse">
            ● 40 MODULES ENROLLED
          </span>
        </div>
      </div>

      {/* Filtering Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-neutral-950 p-4 rounded-2xl border border-white/5 shadow-inner">
        {/* Tier Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar scroll-smooth">
          {[
            { id: 'all', label: 'All Tiers' },
            { id: 'tier1', label: 'Tier 1 — Core Modules' },
            { id: 'tier2', label: 'Tier 2 — Moats' },
            { id: 'tier3', label: 'Tier 3 — Gov / Enterprise' },
            { id: 'tier4', label: 'Tier 4 — Reseller Growth' },
            { id: 'tier5', label: 'Tier 5 — Operations' },
            { id: 'tier6', label: 'Tier 6 — Ecosystem Content' }
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`px-3 py-2 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer border ${
                selectedTier === tier.id
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37] shadow-lg shadow-amber-500/5'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ecosystem modules..."
            className="w-full bg-neutral-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-[#D4AF37] placeholder-slate-500 font-sans"
          />
        </div>
      </div>

      {/* Grid of 40 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((mod) => {
          const IconComponent = mod.icon;
          return (
            <div 
              key={mod.id}
              onClick={() => setActiveSimId(mod.interactiveSim)}
              className="bg-neutral-950/40 border border-amber-500/10 hover:border-amber-500/30 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
              
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-2xl text-[#D4AF37] group-hover:scale-110 transition-transform">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-[9px] font-mono font-black uppercase text-slate-500 group-hover:text-amber-400/80 transition-colors">
                    {mod.tierLabel.split('—')[0].trim()}
                  </span>
                </div>

                {/* Card Content */}
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base tracking-tight font-sans group-hover:text-[#D4AF37] transition-colors">{mod.name}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{mod.description}</p>
                </div>

                {/* Mini Bullet points */}
                <ul className="space-y-1.5 pt-2">
                  {mod.bulletPoints.map((bp, i) => (
                    <li key={i} className="text-[11px] text-slate-500 flex items-start gap-2 leading-relaxed">
                      <span className="text-amber-500 text-xs shrink-0 mt-0.5">•</span>
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action trigger footer */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Interactive Showcase</span>
                <span className="text-[#D4AF37] font-black group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                  LAUNCH TEST ➔
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SIMULATIONS EXPANSION OVERLAY MODAL */}
      {activeSimId && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-[#D4AF37]/25 rounded-3xl shadow-2xl w-full max-w-4xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Close Button */}
            <button 
              onClick={() => setActiveSimId(null)} 
              className="absolute top-6 right-6 p-2 hover:bg-neutral-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer z-20"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* SIMULATOR: NATIVE MOBILE APPS */}
            {activeSimId === 'sim-mobile-apps' && (
              <div className="space-y-6 relative z-10">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-wider">Showcase Simulation</span>
                  <h2 className="text-2xl font-black text-white font-serif tracking-tight mt-1">📱 Expo Native Mobile Phone Frame</h2>
                  <p className="text-slate-400 text-xs mt-1">Launch double-sided iOS and Android white-label builds directly with offline caching and OCR capabilities.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center">
                  {/* Smartphone visual frame container */}
                  <div className="mx-auto w-72 h-[500px] bg-neutral-950 border-8 border-neutral-800 rounded-[40px] shadow-2xl shadow-amber-500/5 p-4 flex flex-col justify-between relative overflow-hidden">
                    {/* Ear Speaker Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-neutral-800 rounded-b-2xl z-20 flex items-center justify-center">
                      <span className="h-1.5 w-10 bg-neutral-700 rounded-full"></span>
                    </div>

                    {/* Smartphone Screen Layout */}
                    <div className="flex-1 mt-4 rounded-[28px] overflow-hidden bg-neutral-900 border border-white/5 flex flex-col justify-between p-4 relative">
                      
                      {/* Interactive Header */}
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[9px] font-black text-[#D4AF37] font-mono tracking-widest uppercase">Tax Pro Hub University Mobile</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="text-[8px] text-slate-500 font-mono">LTE</span>
                        </div>
                      </div>

                      {/* Screen content based on Active toggle mode */}
                      {phoneMode === 'client' ? (
                        <div className="flex-1 py-4 space-y-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center text-[10px] font-black text-amber-500">LS</div>
                              <div>
                                <p className="text-[10px] font-bold text-white">Client Portal App</p>
                                <p className="text-[7px] text-slate-500 font-mono">Welcome back, Loyce Sterling</p>
                              </div>
                            </div>

                            {/* Dashboard buttons */}
                            <div className="p-3 bg-neutral-950 rounded-xl border border-white/5 space-y-1">
                              <p className="text-[8px] text-slate-500 font-mono uppercase">2026 RETURN STATUS</p>
                              <div className="flex justify-between items-center pt-1">
                                <span className="text-[10px] font-bold text-white">Under Review</span>
                                <span className="text-[8px] text-amber-500 font-mono font-bold">Updated today</span>
                              </div>
                            </div>

                            {/* Camera upload box */}
                            <div className="border border-dashed border-amber-500/20 p-4 rounded-xl bg-amber-500/5 text-center space-y-2">
                              <p className="text-[9px] font-bold text-slate-300">W-2 Ingestion Camera Node</p>
                              <p className="text-[8px] text-slate-500">Snap clear picture of your tax docs for auto edge-detect and live AI OCR processing.</p>
                              <button 
                                onClick={handleOcrSim}
                                disabled={ocrScanning}
                                className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-black text-[9px] uppercase tracking-wider rounded-lg hover:scale-105 active:scale-95 transition cursor-pointer"
                              >
                                {ocrScanning ? 'SCANNING...' : '📷 Snap Document'}
                              </button>
                            </div>
                          </div>

                          {/* OCR result log inside screen */}
                          {ocrResult && (
                            <div className="p-2.5 bg-neutral-950 border border-[#D4AF37]/20 rounded-lg font-mono text-[8px] space-y-0.5 text-slate-300">
                              <p className="text-amber-500 font-black">✓ OCR DIGESTED:</p>
                              <p>Employer: {ocrResult.employer}</p>
                              <p>Wages: {ocrResult.wages}</p>
                              <p>Withholding: {ocrResult.withholding}</p>
                              <p className="text-emerald-400">Match: {ocrResult.confidence}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 py-4 space-y-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center font-bold text-[#D4AF37] text-[10px]">RJ</div>
                              <div>
                                <p className="text-[10px] font-bold text-white">Preparer App</p>
                                <p className="text-[7px] text-slate-500 font-mono">Officer: Rick Jefferson</p>
                              </div>
                            </div>

                            {/* Quick Stats list */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-neutral-950 border border-white/5 rounded-lg text-center">
                                <p className="text-[7px] text-slate-500 font-mono">MTD COMM.</p>
                                <p className="text-xs font-black text-white">$4,850</p>
                              </div>
                              <div className="p-2 bg-neutral-950 border border-white/5 rounded-lg text-center">
                                <p className="text-[7px] text-slate-500 font-mono">INTAKES DUE</p>
                                <p className="text-xs font-black text-amber-500">8 pending</p>
                              </div>
                            </div>

                            {/* Active client queue list */}
                            <div className="space-y-1.5">
                              <p className="text-[8px] text-slate-500 font-mono uppercase">ACTIVE PIPELINE CHECKS</p>
                              <div className="p-2 bg-neutral-950 rounded-lg flex justify-between items-center border border-white/5">
                                <span className="text-[9px] font-bold text-slate-300">Sarah Jenkins</span>
                                <span className="text-[7px] font-black font-mono bg-amber-500/10 text-amber-500 px-1 rounded uppercase">8879 Pending</span>
                              </div>
                              <div className="p-2 bg-neutral-950 rounded-lg flex justify-between items-center border border-white/5">
                                <span className="text-[9px] font-bold text-slate-300">Apex Widgets LLC</span>
                                <span className="text-[7px] font-black font-mono bg-green-500/10 text-green-400 px-1 rounded uppercase">ACK Filed</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[7px] text-amber-500 text-center font-mono">
                            OTA Updates: V2.1.2 Sync Complete
                          </div>
                        </div>
                      )}

                      {/* Screen Navigation tabs */}
                      <div className="flex gap-2 border-t border-white/5 pt-2 mt-2">
                        <button 
                          onClick={() => setPhoneMode('client')}
                          className={`flex-1 py-1 rounded text-[8px] font-mono font-bold uppercase transition ${phoneMode === 'client' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-neutral-950 text-slate-500'}`}
                        >
                          Client Portal
                        </button>
                        <button 
                          onClick={() => setPhoneMode('preparer')}
                          className={`flex-1 py-1 rounded text-[8px] font-mono font-bold uppercase transition ${phoneMode === 'preparer' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-neutral-950 text-slate-500'}`}
                        >
                          Preparer App
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Simulator details column */}
                  <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg font-sans">EAS Dynamically Packaged App Builds</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Leveraging **Expo SDK 52** and EAS Build pipelines, the system lets whitelabel service bureau resellers provision customized, standalone applications directly from their Admin dashboard.
                    </p>
                    <div className="p-4 bg-neutral-950 border border-white/5 rounded-2xl space-y-2">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-amber-500" />
                        Interactive OCR Document Pipeline Test
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Click the **Snap Document** button inside the simulated client portal app screen to observe a real-time responsive edge crop capture and cognitive document data retrieval loop.
                      </p>
                    </div>

                    {ocrScanning && (
                      <div className="p-4 bg-[#D4AF37]/5 border border-amber-500/10 rounded-xl font-mono text-xs space-y-1">
                        <p className="text-[#D4AF37] font-black animate-pulse flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          {ocrStep === 1 && '1. Detecting paper boundaries...'}
                          {ocrStep === 2 && '2. Running un-warping perspective matrices...'}
                          {ocrStep === 3 && '3. Parsing field characters via Gemini OCR engine...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR: CLIENT PORTAL */}
            {activeSimId === 'sim-client-portal' && (
              <div className="space-y-6 relative z-10">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-wider">Showcase Simulation</span>
                  <h2 className="text-2xl font-black text-white font-serif tracking-tight mt-1">🔐 Secure Client Portal Interface</h2>
                  <p className="text-slate-400 text-xs mt-1">The secure, independent, bilingual client portal node where tax filers upload prior returns and verify refund schedules.</p>
                </div>

                <div className="p-6 bg-neutral-950 border border-white/5 rounded-2xl space-y-4">
                  {/* Step Switcher Header */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
                      <span className="text-xs font-bold text-white font-mono uppercase">Node Name: client-node-a3f9.rjbusinesssolutions.org</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPortalStep('dashboard')}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg border transition ${portalStep === 'dashboard' ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-neutral-900 border-white/5 text-slate-400'}`}
                      >
                        Portal Home
                      </button>
                      <button 
                        onClick={() => setPortalStep('organizer')}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg border transition ${portalStep === 'organizer' ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-neutral-900 border-white/5 text-slate-400'}`}
                      >
                        Smart Organizer
                      </button>
                    </div>
                  </div>

                  {portalStep === 'dashboard' && (
                    <div className="space-y-6 py-4">
                      {/* Progress Timeline Tracker */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono text-slate-500 uppercase font-semibold">2026 E-FILE PROCESS PROGRESS TIMELINE</p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { step: 0, label: 'Intake Completed' },
                            { step: 1, label: 'Preparer Review' },
                            { step: 2, label: 'e-File Submitted' },
                            { step: 3, label: 'IRS Accepted (Refund)' }
                          ].map((t) => (
                            <button
                              key={t.step}
                              onClick={() => setTimelineState(t.step)}
                              className={`p-3 rounded-xl border text-left space-y-1 transition ${
                                timelineState >= t.step 
                                  ? 'bg-[#D4AF37]/10 border-amber-500/35 text-[#D4AF37]' 
                                  : 'bg-neutral-900 border-white/5 text-slate-500'
                              }`}
                            >
                              <p className="text-[9px] font-mono font-bold">STAGE 0{t.step + 1}</p>
                              <p className="text-[11px] font-bold tracking-tight">{t.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content panel */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-neutral-900/60 border border-white/5 rounded-xl space-y-3">
                          <h4 className="text-xs font-bold text-white font-mono uppercase">E-Sign Document Center</h4>
                          <p className="text-[11px] text-slate-400">Review and e-sign your completed tax return documents online instantly via secured tokenized link.</p>
                          <div className="p-3 bg-neutral-950 border border-white/5 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-200">Form 8879 - Refund Authorization</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Est. Refund: $4,280.00</p>
                            </div>
                            <button 
                              onClick={() => alert('Secure verification link issued. Check client phone for direct FaceID e-signing!')}
                              className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-black text-[9px] uppercase tracking-wider rounded-lg cursor-pointer"
                            >
                              Sign File
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-neutral-900/60 border border-white/5 rounded-xl space-y-3">
                          <h4 className="text-xs font-bold text-white font-mono uppercase">Secure Client Prior returns</h4>
                          <p className="text-[11px] text-slate-400">Download complete audited PDFs of prior filings at any time. Fully compliant with 7-year records retention laws.</p>
                          <div className="flex gap-2">
                            <span className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-900 text-slate-300 border border-white/5 text-[10px] font-mono rounded-lg cursor-pointer">
                              ⬇ Download 2024 Return (PDF)
                            </span>
                            <span className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-900 text-slate-300 border border-white/5 text-[10px] font-mono rounded-lg cursor-pointer">
                              ⬇ Download 2025 Return (PDF)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {portalStep === 'organizer' && (
                    <div className="space-y-4 py-4 max-w-xl mx-auto">
                      <div className="p-4 bg-neutral-900 border border-[#D4AF37]/15 rounded-xl space-y-3">
                        <span className="text-[8px] font-mono text-slate-400 uppercase">Interactive Form Branching Interview</span>
                        <h4 className="text-xs font-bold text-white">Question 4: Did you maintain a dedicated home office workspace for self-employment last year?</h4>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setOrganizerAnswer('yes')}
                            className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg border transition ${organizerAnswer === 'yes' ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-neutral-950 border-white/5 text-slate-400'}`}
                          >
                            Yes, I did
                          </button>
                          <button 
                            onClick={() => setOrganizerAnswer('no')}
                            className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg border transition ${organizerAnswer === 'no' ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-neutral-950 border-white/5 text-slate-400'}`}
                          >
                            No, I did not
                          </button>
                        </div>
                      </div>

                      {organizerAnswer === 'yes' && (
                        <div className="p-4 bg-neutral-950 border border-amber-500/10 rounded-xl space-y-3 animate-fade-in text-xs leading-relaxed">
                          <p className="text-[#D4AF37] font-bold font-mono text-[10px] uppercase">✓ AI DEDUCTIONS ROUTING ENROLLED:</p>
                          <p className="text-slate-300">You are eligible to claim the **Home Office Deduction (Simplified or Actual Method)**. Enter the square footage of your office workspace below to automatically compute your write-off values:</p>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              placeholder="e.g. 250 sq. ft." 
                              className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#D4AF37]"
                            />
                            <button className="px-3 py-2 bg-[#D4AF37] text-black font-black uppercase text-[10px] rounded-lg">Save Square Footage</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SIMULATOR: INVOICING & AR */}
            {activeSimId === 'sim-invoicing-ar' && (
              <div className="space-y-6 relative z-10">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-wider">Showcase Simulation</span>
                  <h2 className="text-2xl font-black text-white font-serif tracking-tight mt-1">💸 Invoicing & Accounts Receivable (AR)</h2>
                  <p className="text-slate-400 text-xs mt-1">Configure multi-month split payment installments, dunning auto-escalations, and examine AR aging reports.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AR Invoice Creator Configuration */}
                  <div className="p-5 bg-neutral-950 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">Generate Smart Invoice</h3>
                    
                    <div className="space-y-3 text-xs font-sans">
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[10px] font-mono uppercase">BASE TAX PREPARATION FEE ($)</label>
                        <input 
                          type="number" 
                          value={invoiceAmount} 
                          onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-slate-200 outline-none focus:border-[#D4AF37] font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 text-[10px] font-mono uppercase">PAYMENT PLAN TYPE</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setArPlan('single')}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-mono uppercase border font-bold ${
                              arPlan === 'single' ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-neutral-900 border-white/5 text-slate-400'
                            }`}
                          >
                            Single Payment (Due Net 30)
                          </button>
                          <button 
                            onClick={() => setArPlan('installment')}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-mono uppercase border font-bold ${
                              arPlan === 'installment' ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-neutral-900 border-white/5 text-slate-400'
                            }`}
                          >
                            Installment Program
                          </button>
                        </div>
                      </div>

                      {arPlan === 'installment' && (
                        <div className="p-3.5 bg-neutral-900/60 border border-white/5 rounded-xl space-y-2 animate-fade-in">
                          <label className="text-slate-400 text-[9px] font-mono uppercase block">INSTALLMENT COUNT (MONTHS)</label>
                          <div className="flex gap-2">
                            {[2, 3, 4].map((n) => (
                              <button
                                key={n}
                                onClick={() => setInstallments(n)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-mono border ${
                                  installments === n ? 'bg-amber-500/15 border-amber-500/35 text-amber-400' : 'bg-neutral-950 border-white/5 text-slate-500'
                                }`}
                              >
                                {n} Months
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-mono pt-1">
                            Schedule: {installments} equal monthly payments of <span className="text-green-400 font-bold">${Math.round(invoiceAmount / installments)}/mo</span>. Auto-debits on file.
                          </p>
                        </div>
                      )}

                      <button 
                        onClick={() => alert(`Invoice generated successfully! Secure pay-by-link generated: rjbusinesssolutions.org/pay-inv-${Date.now()}`)}
                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer"
                      >
                        ✓ Publish & Send SMS Link
                      </button>
                    </div>
                  </div>

                  {/* AR Aging Reports display */}
                  <div className="p-5 bg-neutral-950 border border-[#D4AF37]/15 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black font-mono uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">AR AGING MATRICES REPORT (30d)</h3>
                    
                    <div className="grid grid-cols-4 gap-2 text-center font-mono">
                      {[
                        { label: 'Current', val: '$14,250', col: 'text-emerald-400' },
                        { label: '30-59 Days', val: '$4,120', col: 'text-[#D4AF37]' },
                        { label: '60-89 Days', val: '$1,850', col: 'text-amber-500' },
                        { label: '90+ Days', val: '$670', col: 'text-rose-500' }
                      ].map((item, i) => (
                        <div key={i} className="p-2 bg-neutral-900/60 border border-white/5 rounded-xl">
                          <p className="text-slate-500 text-[8px] uppercase tracking-wider">{item.label}</p>
                          <p className={`text-xs font-black mt-1 ${item.col}`}>{item.val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Dunning escalator simulation logs */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">AUTOMATED DUNNING STATUS QUEUE</p>
                      <div className="p-3 bg-neutral-900 border border-white/5 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="font-bold text-slate-300">Sarah Jenkins (Invoice #1084)</span>
                          <span className="text-rose-400 font-mono font-bold bg-rose-500/10 px-1 rounded uppercase">Dunning Step 2</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">"Friendly reminder: your installment payment of $400 remains outstanding. Avoid automated late fees by payment: rjbiz..."</p>
                        <p className="text-[9px] text-slate-500 font-mono">Next Escalation: SMS + Call Agent trigger in 4 days.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR: BOOKKEEPING */}
            {activeSimId === 'sim-bookkeeping' && (
              <div className="space-y-6 relative z-10">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-wider">Showcase Simulation</span>
                  <h2 className="text-2xl font-black text-white font-serif tracking-tight mt-1">📊 Plaid-Connected Bookkeeping ledger</h2>
                  <p className="text-slate-400 text-xs mt-1">Simulate cognitive AI categorization rules over raw imported bank transactions, compiling data directly into P&L digests.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Ledger bank feed panel (7/12) */}
                  <div className="lg:col-span-7 p-5 bg-neutral-950 border border-white/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300">Raw Bank Transactions (Plaid)</h3>
                      <button
                        onClick={handleRunBookkeepingAi}
                        disabled={isCategorizing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] hover:bg-amber-500 disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        <Cpu className="h-3.5 w-3.5" />
                        {isCategorizing ? 'CATEGORIZING...' : 'AI Auto-Categorize'}
                      </button>
                    </div>

                    <div className="space-y-2 font-mono text-[10px]">
                      {transactions.map((t) => (
                        <div key={t.id} className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-slate-200">{t.desc}</p>
                            <p className="text-slate-500 text-[8px] mt-0.5">{t.date} · Plaid Sync</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${t.amt < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {t.amt < 0 ? '-' : '+'}${Math.abs(t.amt).toFixed(2)}
                            </p>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-wider ${
                              t.category === 'Uncategorized' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {t.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Profit Loss Summary output (5/12) */}
                  <div className="lg:col-span-5 p-5 bg-neutral-950 border border-[#D4AF37]/15 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black font-mono uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">COMPILING PROFIT & LOSS (MTD)</h3>
                    
                    <div className="p-4 bg-neutral-900 border border-white/5 rounded-xl space-y-3 text-xs leading-relaxed font-sans">
                      <div className="flex justify-between border-b border-white/5 pb-1 text-slate-400">
                        <span>Total Gross Revenue</span>
                        <span className="text-white font-bold font-mono">$2,917.00</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1 text-slate-400">
                        <span>Deductible Expenses</span>
                        <span className="text-white font-bold font-mono">$254.65</span>
                      </div>
                      <div className="flex justify-between pt-1 font-bold text-[#D4AF37]">
                        <span>Net Profit (Est.)</span>
                        <span className="font-mono">$2,662.35</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center space-y-2">
                      <p className="text-[10px] font-bold text-slate-300">Ready to File Schedule C Paket</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed font-sans">Bookkeeping closed! Export transaction summaries directly into your active tax preparation module with a single click.</p>
                      <button 
                        onClick={() => alert('Bookkeeping ledger closed and synced to Loyce Sterling\'s CPA filing suite!')}
                        className="px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] border border-amber-500/20 hover:bg-[#D4AF37]/20 text-[9px] font-mono font-bold uppercase rounded-lg cursor-pointer"
                      >
                        ✓ Generate Tax season Packet
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SIMULATOR: LMS */}
            {activeSimId === 'sim-lms' && (
              <div className="space-y-6 relative z-10">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-wider">Showcase Simulation</span>
                  <h2 className="text-2xl font-black text-white font-serif tracking-tight mt-1">🎓 Learning Management System (LMS)</h2>
                  <p className="text-slate-400 text-xs mt-1">Double-sided course workspace. Educate preparers for IRS AFSP continuing education or sell custom tax courses directly through Stripe paywalls.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LMS Preparer Course list */}
                  <div className="p-5 bg-neutral-950 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">Preparer Certification Modules</h3>
                    <div className="space-y-3 font-sans text-xs">
                      {[
                        { title: 'Circular 230 §10.27 Professional Ethics', duration: '2.5 hrs', xp: '150 XP', status: 'In Progress', pct: 60 },
                        { title: 'Schedule C Mileage & Deduction Logs', duration: '1 hr', xp: '80 XP', status: 'Completed', pct: 100 },
                        { title: 'Partnership 1065 Allocations Strategist', duration: '4 hrs', xp: '300 XP', status: 'Locked', pct: 0 }
                      ].map((course, idx) => (
                        <div key={idx} className="p-3 bg-neutral-900 border border-white/5 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold text-[#D4AF37] uppercase">{course.status}</span>
                            <span className="text-slate-500">{course.xp}</span>
                          </div>
                          <p className="font-bold text-white text-xs">{course.title}</p>
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 flex-1 bg-neutral-950 rounded-full overflow-hidden">
                              <div className="h-full bg-[#D4AF37]" style={{ width: `${course.pct}%` }}></div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">{course.pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Tutor within course */}
                  <div className="p-5 bg-neutral-950 border border-[#D4AF37]/15 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black font-mono uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">IRS CE Cognitive Tutor</h3>
                      <div className="p-3.5 bg-neutral-900 border border-white/5 rounded-xl mt-3 space-y-2 text-xs leading-relaxed">
                        <p className="font-mono text-[9px] text-slate-500 uppercase font-black">Student Query:</p>
                        <p className="text-slate-200">"Does Circular 230 let tax attorneys charge fees based on a percentage of refund values?"</p>
                        <p className="font-mono text-[9px] text-amber-400 uppercase font-black mt-2">🤖 AI Tutor Answer:</p>
                        <p className="text-slate-400">"Under Circular 230 §10.27, contingency fees based on a percentage of refunds are generally prohibited for tax preparation services, except in very specific circumstances like administrative audits or court proceedings. Charging percentage-of-refund fees on original returns is a direct violation."</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('Quiz generated! Complete the Circular 230 module to claim your CE credits.')}
                      className="w-full py-2.5 mt-4 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Take Ethics Quiz ➔
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR: VOIP CALL CENTER */}
            {activeSimId === 'sim-voip-callcenter' && (
              <div className="space-y-6 relative z-10">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-wider">Showcase Simulation</span>
                  <h2 className="text-2xl font-black text-white font-serif tracking-tight mt-1">📞 VoIP Call Center & AI Voice Agent</h2>
                  <p className="text-slate-400 text-xs mt-1">Full inbound IVR routing and voice qualification simulator with sub-second latency and live dialer stream transcriber.</p>
                </div>

                <div className="p-6 bg-neutral-950 border border-[#D4AF37]/25 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 bg-red-500 rounded-full animate-ping"></span>
                      <span className="text-xs font-mono font-black text-slate-200 uppercase">Live Dial Tunnel: active</span>
                    </div>
                    <button
                      onClick={handleVoiceCallSim}
                      disabled={agentCalling}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {agentCalling ? '📞 CALL ACTIVE...' : '📞 Simulate Inbound Call'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live transcription column */}
                    <div className="lg:col-span-2 p-4 bg-neutral-900 border border-white/5 rounded-xl space-y-3 min-h-[250px] flex flex-col justify-between">
                      <div className="space-y-3 h-64 overflow-y-auto pr-2">
                        {voiceDialogue.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-20">Click the button above to simulate an incoming customer call handled by our AI Voice Agent.</p>
                        ) : (
                          voiceDialogue.map((chat, i) => (
                            <div key={i} className={`p-3 rounded-xl text-xs space-y-1 leading-relaxed ${chat.role === 'client' ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/25 ml-4 text-slate-200' : 'bg-neutral-950 border border-white/5 mr-4 text-slate-300'}`}>
                              <div className="flex justify-between font-mono text-[8px] text-slate-500 uppercase font-black">
                                <span>{chat.role === 'client' ? 'User Customer' : '🤖 AI Voice Agent'}</span>
                                <span>{chat.time}</span>
                              </div>
                              <p>{chat.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Speech Analytics and actions */}
                    <div className="p-4 bg-neutral-900 border border-white/5 rounded-xl space-y-4">
                      <h4 className="text-xs font-bold text-white font-mono uppercase">Speech Analytics (Whisper)</h4>
                      <div className="space-y-3 text-[11px] leading-relaxed">
                        <div className="p-3 bg-neutral-950 border border-white/5 rounded-lg space-y-1">
                          <p className="text-[8px] font-mono text-slate-500 uppercase">Objection Handler</p>
                          <p className="font-bold text-slate-300">W-2 Ingestion Anxiety</p>
                          <p className="text-slate-500 text-[10px]">AI addressed privacy concerns using GLBA-grade vault guarantees.</p>
                        </div>

                        <div className="p-3 bg-neutral-950 border border-white/5 rounded-lg space-y-1">
                          <p className="text-[8px] font-mono text-slate-500 uppercase">Cognitive metrics</p>
                          <p className="text-slate-300">Talk Ratio: <span className="text-[#D4AF37] font-bold">42% AI / 58% Client</span></p>
                          <p className="text-slate-300">Uptime Latency: <span className="text-green-400 font-bold">340ms (Sub-second)</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR: TAX OPTIMIZATION ENGINE */}
            {activeSimId === 'sim-tax-optimization' && (
              <div className="space-y-6 relative z-10">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-wider">Showcase Simulation</span>
                  <h2 className="text-2xl font-black text-white font-serif tracking-tight mt-1">📈 Tax Optimization & Planning Engine</h2>
                  <p className="text-slate-400 text-xs mt-1">Configure S-Corp reasonable salaries, business revenues, and IRA contributions to witness real-time estimated savings calculations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Optimizer inputs column */}
                  <div className="p-5 bg-neutral-950 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">Tax Strategy Parameters</h3>
                    
                    <div className="space-y-4 text-xs font-sans">
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[10px] text-slate-400">
                          <span>TOTAL BUSINESS REVENUE</span>
                          <span>${bizRevenue.toLocaleString()}</span>
                        </div>
                        <input 
                          type="range" 
                          min="50000" 
                          max="300000" 
                          step="10000"
                          value={bizRevenue} 
                          onChange={(e) => setBizRevenue(Number(e.target.value))}
                          className="w-full accent-amber-500 bg-neutral-900 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[10px] text-slate-400">
                          <span>S-CORP REASONABLE SALARY</span>
                          <span>${scorpSalary.toLocaleString()}</span>
                        </div>
                        <input 
                          type="range" 
                          min="20000" 
                          max="150000" 
                          step="5000"
                          value={scorpSalary} 
                          onChange={(e) => setScorpSalary(Number(e.target.value))}
                          className="w-full accent-amber-500 bg-neutral-900 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[10px] text-slate-400">
                          <span>RETIREMENT (SEP-IRA / 401K)</span>
                          <span>${retirementContrib.toLocaleString()}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="30000" 
                          step="2000"
                          value={retirementContrib} 
                          onChange={(e) => setRetirementContrib(Number(e.target.value))}
                          className="w-full accent-amber-500 bg-neutral-900 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculations and strategy charts */}
                  <div className="p-5 bg-neutral-950 border border-[#D4AF37]/15 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black font-mono uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">OPTIMIZATION ANALYSIS REPORT</h3>
                    
                    <div className="p-4 bg-neutral-900 border border-white/5 rounded-xl text-center space-y-3">
                      <p className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">PROJECTED FEDERAL TAX LIABILITY</p>
                      <p className="text-3xl font-black text-white font-serif tracking-tight">${estimatedTaxes.toLocaleString()}</p>
                      
                      <div className="pt-2 flex justify-between text-xs font-mono border-t border-white/5 text-slate-400">
                        <span>S-Corp FICA Savings:</span>
                        <span className="text-green-400 font-bold">${Math.round((bizRevenue - scorpSalary) * 0.153 * 0.4).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono text-slate-400">
                        <span>Tax Bracket Savings:</span>
                        <span className="text-green-400 font-bold">${Math.round(retirementContrib * 0.22).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5 text-[10px] leading-relaxed text-slate-300">
                      <Sparkles className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <p>By restructuring as an **S-Corp** and setting a reasonable salary, your self-employed tax exposure declines significantly compared to a traditional LLC structure.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DEFAULT CAP-ALL SIMULATOR PREVIEW (For basic items) */}
            {!['sim-mobile-apps', 'sim-client-portal', 'sim-bookkeeping', 'sim-lms', 'sim-voip-callcenter', 'sim-tax-optimization', 'sim-invoicing-ar'].includes(activeSimId) && (
              <div className="space-y-6 relative z-10 text-center py-12">
                <Layers className="h-14 w-14 text-[#D4AF37]/20 mx-auto animate-bounce" />
                <h3 className="text-white font-black text-xl font-serif">Enterprise Node Provisioning Simulator</h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                  This core module is fully enrolled in the co-branded **RJ Business Solutions** suite under your active tenant parameters. 
                </p>
                <div className="p-4 bg-neutral-950 border border-white/5 rounded-2xl max-w-sm mx-auto font-mono text-[10px] text-[#D4AF37] tracking-widest uppercase">
                  ✓ Node verified & compliant
                </div>
                <button 
                  onClick={() => setActiveSimId(null)}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Return to Ecosystem
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
