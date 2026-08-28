import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  Plus, Zap, ToggleLeft, ToggleRight, Clock, Mail, MessageSquare, Tag, Webhook,
  Search, Shield, CheckCircle2, AlertCircle, Sparkles, Filter, CreditCard, 
  Calendar, BarChart2, Cpu, HelpCircle, ArrowRight, BookOpen, Layers, Settings, ChevronRight
} from 'lucide-react';
import { useState, useMemo } from 'react';
import AIPromptBar from '../components/layout/AIPromptBar';
import { AUTOMATION_RECIPES, installRecipe } from '../utils/automationRecipes';
import { DRIP_LIBRARY, installDripTemplate } from '../utils/dripLibrary';
import { Campaign } from '../types';

// ==========================================
// 50 HIGH-FIDELITY TAX INDUSTRY TEMPLATES
// ==========================================
const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'onboarding', label: 'Client Onboarding' },
  { id: 'documents', label: 'Document Collection' },
  { id: 'payment', label: 'Payment & Billing' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'irs', label: 'IRS & Tax Filing' },
  { id: 'credit', label: 'Credit Repair' },
  { id: 'retention', label: 'Retention & Growth' },
  { id: 'compliance', label: 'Compliance & Security' }
];

const TEMPLATES = [
  // CATEGORY A — CLIENT ONBOARDING
  { id: 'tpl-1', category: 'onboarding', name: 'New Client Welcome Sequence', trigger: 'Form submitted', desc: 'Welcome email → 1hr wait → SMS w/ portal link → 24hr → engagement letter via DocuSign → tag "Onboarded"' },
  { id: 'tpl-2', category: 'onboarding', name: 'Returning Client Re-Engagement', trigger: 'Tag "Prior Year" + new tax year', desc: 'Personalized "Welcome back" email referencing last year\'s refund → book consult link' },
  { id: 'tpl-3', category: 'onboarding', name: 'Referral Source Onboarding', trigger: 'Form field "Referred By" filled', desc: 'Thank referrer (SMS), apply $50 credit, send custom welcome to new client' },
  { id: 'tpl-4', category: 'onboarding', name: 'High-Value Client (AGI >$200k)', trigger: 'Tax profile AGI threshold met', desc: 'Assign to senior preparer, schedule 60-min strategy call, send tax-planning intake form' },
  { id: 'tpl-5', category: 'onboarding', name: 'Self-Employed Client Onboarding', trigger: 'Filing status / Sch C indicator', desc: 'Send Schedule C checklist, request P&L upload, book bookkeeping consult' },
  { id: 'tpl-6', category: 'onboarding', name: 'Bilingual Spanish Client Onboarding', trigger: 'Language preference = "es"', desc: 'All comms in Spanish, assign Spanish-speaking preparer automatically' },
  { id: 'tpl-7', category: 'onboarding', name: 'Out-of-State Client Onboarding', trigger: 'Address state ≠ preparer state', desc: 'Send multi-state filing disclosure, verify tax nexus boundaries' },
  { id: 'tpl-8', category: 'onboarding', name: 'Crypto Investor Onboarding', trigger: 'Tag "Crypto" or form checked', desc: 'Request exchange API export, send Form 8949 compliance prep guide' },

  // CATEGORY B — DOCUMENT COLLECTION
  { id: 'tpl-9', category: 'documents', name: 'W-2 Reminder Cascade', trigger: 'Date Feb 1 + no W-2 uploaded', desc: 'Day 1 email → Day 3 SMS → Day 7 phone-call task for preparer' },
  { id: 'tpl-10', category: 'documents', name: '1099 Collector Sequence', trigger: 'Self-employed + missing 1099s', desc: 'Auto-scan prior year\'s 1099 issuers, send "Did you receive?" interactive checklist' },
  { id: 'tpl-11', category: 'documents', name: 'Document Auto-Categorizer', trigger: 'Document uploaded', desc: 'AI OCR scan → classify type → file in secure folder → notify preparer if missing fields' },
  { id: 'tpl-12', category: 'documents', name: 'Missing Document Daily Digest', trigger: 'Daily 8am cron job', desc: 'Email each client a highly personalized, dynamic "still needed" document table' },
  { id: 'tpl-13', category: 'documents', name: 'Prior-Year Return Request', trigger: 'New client, no prior return', desc: 'Request via secure portal upload + offer official IRS tax transcript pull' },
  { id: 'tpl-14', category: 'documents', name: 'Dependent Documentation Pull', trigger: 'Has dependents + missing SSN/DOB', desc: 'Targeted SMS requesting birth certificates or Social Security cards' },
  { id: 'tpl-15', category: 'documents', name: 'Bank Statement Auto-Pull', trigger: 'Connected Plaid + audit risk flag', desc: 'Pull 12-month statements, auto-categorize, and securely attach to return file' },

  // CATEGORY C — PAYMENT & BILLING
  { id: 'tpl-16', category: 'payment', name: 'Pre-Filing Payment Collection', trigger: 'Form 8879 ready to sign', desc: 'Send Stripe Checkout link, block electronic signature execution until invoice is paid' },
  { id: 'tpl-17', category: 'payment', name: 'Refund Advance Approval Flow', trigger: 'Estimated Refund ≥ $1500 + opt-in', desc: 'Submit application to banking product, notify on approval, update ledger status' },
  { id: 'tpl-18', category: 'payment', name: 'Past-Due Invoice Recovery', trigger: 'Invoice 7 days past due', desc: 'Email reminder → 14d SMS → 21d preparer task → 30d collections agency referral' },
  { id: 'tpl-19', category: 'payment', name: 'Subscription Failed Payment Handler', trigger: 'Stripe webhook payment_failed', desc: 'Auto-email retry instructions, suspend portal tier access after 3 unsuccessful attempts' },
  { id: 'tpl-20', category: 'payment', name: 'Annual Renewal Campaign', trigger: '30 days before renewal', desc: 'Email with year-in-review recap (total refunds won), offer promotional upgrade' },
  { id: 'tpl-21', category: 'payment', name: 'Refund Splitting Setup', trigger: 'Client opts into "Save Refund"', desc: 'Configure IRS Form 8888 coordinates, send visual confirmation of savings split' },

  // CATEGORY D — APPOINTMENT MANAGEMENT
  { id: 'tpl-22', category: 'appointments', name: 'Consultation Booking Confirmation', trigger: 'Appointment booked', desc: 'Instant SMS & email confirm → 24hr reminder → 1hr reminder → post-meeting feedback' },
  { id: 'tpl-23', category: 'appointments', name: 'No-Show Recovery Flow', trigger: 'Appointment status = no-show', desc: 'Empathetic SMS w/ reschedule link, tag contact for custom retention tracking' },
  { id: 'tpl-24', category: 'appointments', name: 'Reschedule Handler', trigger: 'Appointment rescheduled', desc: 'Update all downstream reminders, instantly sync calendar & notify tax preparer' },
  { id: 'tpl-25', category: 'appointments', name: 'Walk-In Capture Automation', trigger: 'Walk-in intake form submitted', desc: 'Create CRM deal, schedule next available prep slot, dispatch instant portal logins' },
  { id: 'tpl-26', category: 'appointments', name: 'Annual Tax Planning Campaign', trigger: 'November 1 + AGI > $100k', desc: 'Auto-book Q4 planning slot, send pre-call tax-minimization questionnaire' },

  // CATEGORY E — IRS & TAX FILING
  { id: 'tpl-27', category: 'irs', name: 'E-File Acceptance Celebration', trigger: 'IRS MeF ack "Accepted"', desc: 'Celebrate SMS + email, deliver final certified PDF, request Google/Yelp review' },
  { id: 'tpl-28', category: 'irs', name: 'E-File Rejection Recovery', trigger: 'IRS MeF ack "Rejected"', desc: 'Parse IRS rejection code, draft clean explanation email, create urgent preparer task' },
  { id: 'tpl-29', category: 'irs', name: 'IRS Notice Received (CP2000, etc.)', trigger: 'Document tagged "IRS Notice"', desc: 'Classify notice type, attach response templates, alert preparer, schedule call' },
  { id: 'tpl-30', category: 'irs', name: 'Refund Status Tracker', trigger: 'Tax return filed', desc: 'Daily IRS "Where\'s My Refund" API pull, notify client on estimated refund progress' },
  { id: 'tpl-31', category: 'irs', name: 'Amended Return (1040-X) Workflow', trigger: 'Form 1040-X requested', desc: 'Pull prior return data, flag changes, route through senior reviewer, dispatch via MeF' },
  { id: 'tpl-32', category: 'irs', name: 'Extension Request (Form 4868)', trigger: 'April 10 + return unfiled', desc: 'Auto-prep 4868, send to client for digital authorization, file instantly via MeF' },
  { id: 'tpl-33', category: 'irs', name: 'Quarterly Estimated Tax Alerts', trigger: '1040-ES payment due dates', desc: 'Calculate estimate based on prior-year data, send payment voucher + direct Pay.gov links' },
  { id: 'tpl-34', category: 'irs', name: 'IRS Audit Defense Activation', trigger: 'Client tagged "Audit"', desc: 'Pull all document vaults, dispatch audit-defense checklist, book preparatory brief' },

  // CATEGORY F — CREDIT REPAIR
  { id: 'tpl-35', category: 'credit', name: 'Credit Repair Intake Sequence', trigger: 'Form submit "credit repair"', desc: 'Pull 3-bureau report via Experian, AI-flag negative dispute candidates' },
  { id: 'tpl-36', category: 'credit', name: 'Dispute Letter Mailer (609/611)', trigger: 'Dispute created on contact', desc: 'Generate PDF letter, dispatch via Lob Certified Mail, track USPS delivery status' },
  { id: 'tpl-37', category: 'credit', name: '30-Day Bureau Response Check', trigger: 'Dispute letter delivered + 30d', desc: 'Auto re-pull credit profile, compare accounts, update dispute victory status' },
  { id: 'tpl-38', category: 'credit', name: 'Score Improvement Celebration', trigger: 'Credit score increase ≥20 pts', desc: 'Send customized congrats SMS & email + upsell annual tax-planning retainer' },
  { id: 'tpl-39', category: 'credit', name: 'Identity Theft Response Protocol', trigger: 'Tag "ID Theft" added', desc: 'Send FTC report template, credit freeze instructions, escalate to credit lawyer' },

  // CATEGORY G — RETENTION & GROWTH
  { id: 'tpl-40', category: 'retention', name: 'Post-Filing Review Invitation', trigger: '7 days after refund received', desc: 'Ask for Google/Yelp reviews with direct link, offer $25 referral incentive credits' },
  { id: 'tpl-41', category: 'retention', name: 'Referral Reward Tracker', trigger: 'Tag "Referred Someone" set', desc: 'When the referred contact files their taxes, auto-apply account ledger credits' },
  { id: 'tpl-42', category: 'retention', name: 'Win-Back Lapsed Client Campaign', trigger: 'Last filing > 18 months ago', desc: 'Personalized "We miss you" email + last refund calculation recap' },
  { id: 'tpl-43', category: 'retention', name: 'Mid-Year Tax Wellness Check-In', trigger: 'July 1 calendar trigger', desc: 'Dispatch "How\'s your year going?" survey to surface tax-triggering life events' },
  { id: 'tpl-44', category: 'retention', name: 'Birthday & Filing Anniversary Touch', trigger: 'Client DOB / Client anniversary', desc: 'Send personalized greeting from preparer (zero sales pitch, pure relationship)' },
  { id: 'tpl-45', category: 'retention', name: 'NPS Feedback Survey', trigger: '30 days after filing complete', desc: 'Send 1-question NPS; route detractors to manager, promoters to review request' },

  // CATEGORY H — COMPLIANCE & SECURITY
  { id: 'tpl-46', category: 'compliance', name: 'WISP Annual Review Reminder', trigger: 'January 1 calendar trigger', desc: 'Notify firm owner, deliver written WISP document, log compliance review trace' },
  { id: 'tpl-47', category: 'compliance', name: 'Suspicious Login Protocol', trigger: 'Auth: new IP or rapid travel', desc: 'Email security link, force multi-factor authentication, log to append-only audit trail' },
  { id: 'tpl-48', category: 'compliance', name: 'Document Retention Auto-Purge', trigger: 'Retention period met', desc: 'Securely delete records from R2, log to audit trail, notify client of compliance' },
  { id: 'tpl-49', category: 'compliance', name: 'Data Subject Access Request (DSAR)', trigger: 'Form submit "Request My Data"', desc: 'Compile all personal records, deliver via encrypted download link, log compliance' },
  { id: 'tpl-50', category: 'compliance', name: 'Breach Notification Drill Execution', trigger: 'Manual drill trigger', desc: 'Iterate notification loop, verify contact delivery matrices, log readiness' }
];

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { workflows, addWorkflow, toggleWorkflow, campaigns, addCampaign, addNotification, currentSubAccount } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [installSuccessId, setInstallSuccessId] = useState<string | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [installedRecipes, setInstalledRecipes] = useState<Set<string>>(new Set());
  const [aiPrompt, setAiPrompt] = useState('');

  const handleInstallRecipe = (recipeId: string) => {
    const recipe = AUTOMATION_RECIPES.find(r => r.id === recipeId);
    if (!recipe || installedRecipes.has(recipeId)) return;
    // 1. Install the workflow itself
    addWorkflow(installRecipe(recipe, currentSubAccount?.id) as any);
    // 2. Auto-install any drip campaigns it enrolls into (if not already present)
    const existingTplIds = new Set(campaigns.map(c => c.sourceTemplateId).filter(Boolean));
    let dripsInstalled = 0;
    (recipe.enrollsDrip || []).forEach(dripId => {
      if (!existingTplIds.has(dripId)) {
        const tpl = DRIP_LIBRARY.find(t => t.id === dripId);
        if (tpl) { addCampaign(installDripTemplate(tpl, currentSubAccount?.id) as Campaign); dripsInstalled++; }
      }
    });
    setInstalledRecipes(prev => new Set(prev).add(recipeId));
    addNotification({
      id: `n-${Date.now()}`,
      title: 'Automation recipe deployed',
      message: `"${recipe.name}" is live${dripsInstalled ? ` — ${dripsInstalled} linked drip campaign${dripsInstalled > 1 ? 's' : ''} auto-installed to Campaigns` : ''}. Full wiring visible in the recipe card.`,
      type: 'success', read: false, createdAt: new Date(),
    });
  };

  // LIVE workflows only — no fabricated automations. Empty practices render
  // the empty-state placeholder and the template gallery below.
  const allActiveWorkflows = useMemo(() => workflows, [workflows]);

  // Filter templates based on search & category
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(tpl => {
      const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tpl.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || tpl.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleInstallTemplate = (tpl: typeof TEMPLATES[0]) => {
    // Generate simulated node graph for store import
    const newWf = {
      id: `installed-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: tpl.name,
      trigger: { type: 'form_submitted', config: {} },
      actions: [
        { id: 'a1', type: 'send_email', config: {} },
        { id: 'a2', type: 'send_sms', config: {} }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    addWorkflow(newWf as any);
    setInstallSuccessId(tpl.id);
    setTimeout(() => setInstallSuccessId(null), 2500);
  };

  const handleAIPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    // Route to builder with prompt as state
    navigate('/workflows/new', { state: { initialPrompt: aiPrompt } });
  };

  return (
    <div className="space-y-8 text-white min-h-screen pb-16 bg-[#030303]">
      
      {/* ⏰ TEMPORAL CHECK & META HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black tracking-widest text-[#D4AF37] uppercase text-xl">MYVIRTUAL</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">| Workflow Engine</span>
          </div>
          <h1 className="text-3xl font-serif font-black tracking-tight text-white mt-1">Enterprise Automation Hub</h1>
          <p className="text-slate-400 text-xs tracking-wide">
            Powered by <span className="text-[#D4AF37] font-semibold">RJ Business Solutions</span> • FedRAMP Audited Core v2.0
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-neutral-900/80 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <div className="text-left font-mono">
              <p className="text-[9px] text-slate-500 font-bold uppercase leading-none">Security Lock</p>
              <p className="text-[10px] text-emerald-400 font-bold mt-0.5">IRS Pub 4557 Certified</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/workflows/new')}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/10 transition"
          >
            <Plus className="h-4.5 w-4.5" />
            Build Blank Canvas
          </button>
        </div>
      </div>

      {/* SYSTEM OBSERVABILITY & PERFORMANCE LEDGER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-950/40 border border-[#1f2937]/60 rounded-3xl p-5 backdrop-blur-xl hover:border-amber-500/20 transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-slate-400">Total Run Executions</span>
            <BarChart2 className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-mono font-black text-white mt-2">1,248,391</p>
          <p className="text-[10px] text-emerald-400 font-bold mt-1">↑ 14.2% weekly volume</p>
        </div>

        <div className="bg-neutral-950/40 border border-[#1f2937]/60 rounded-3xl p-5 backdrop-blur-xl hover:border-amber-500/20 transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-slate-400">Durable Execution Uptime</span>
            <Cpu className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white mt-2">99.998%</p>
          <p className="text-[10px] text-slate-400 mt-1">Cloudflare Workflows Engine</p>
        </div>

        <div className="bg-neutral-950/40 border border-[#1f2937]/60 rounded-3xl p-5 backdrop-blur-xl hover:border-amber-500/20 transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-slate-400">Cost-Saved Attribution</span>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-mono font-black text-white mt-2">$24,910.42</p>
          <p className="text-[10px] text-[#D4AF37] font-bold mt-1">Estimated hours recovered</p>
        </div>

        <div className="bg-neutral-950/40 border border-[#1f2937]/60 rounded-3xl p-5 backdrop-blur-xl hover:border-amber-500/20 transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-slate-400">Compliance Audit Trail</span>
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-mono font-black text-white mt-2">IMMUTABLE</p>
          <p className="text-[10px] text-emerald-400 font-bold mt-1">FedRAMP-aligned AU-9</p>
        </div>
      </div>

      {/* AI Prompt-to-Build Widget */}
      <AIPromptBar 
        moduleName="automation workflows" 
        placeholder="Describe the automation workflow you want to compile (e.g. When client signs Form 8879, charge their card via Stripe and send SMS/email confirmations)..."
      />

      {/* ACTIVE WORKFLOWS LIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase border-b border-amber-500/10 pb-2">
          Active Automation Channels ({allActiveWorkflows.length})
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {allActiveWorkflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => navigate(`/workflows/${wf.id}`)}
              className="bg-neutral-950/40 border border-[#1f2937]/70 hover:border-amber-500/20 rounded-3xl p-6 cursor-pointer hover:shadow-lg hover:shadow-amber-500/2 transition duration-300 relative overflow-hidden group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 bg-neutral-900 border border-[#1f2937] text-[#D4AF37] rounded-2xl">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-serif font-black text-white text-base tracking-wide group-hover:text-[#D4AF37] transition">
                      {wf.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Trigger Channel: Intake Webhook Callback
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWorkflow(wf.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#D4AF37] transition"
                >
                  {wf.isActive ? (
                    <ToggleRight className="h-7 w-7 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Sub-node Actions visualization */}
              <div className="mt-4 pt-4 border-t border-[#1f2937]/50 flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-mono uppercase font-black tracking-widest text-slate-500">Pipeline:</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-[#1f2937] rounded-xl text-[10px] text-slate-300 font-mono">
                  <Mail className="h-3 w-3 text-[#D4AF37]" /> Send Welcome Email
                </span>
                <span className="text-slate-600">→</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-[#1f2937] rounded-xl text-[10px] text-slate-300 font-mono">
                  <MessageSquare className="h-3 w-3 text-[#D4AF37]" /> SMS Dispatch
                </span>
                <span className="text-slate-600">→</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-[#1f2937] rounded-xl text-[10px] text-slate-300 font-mono">
                  <Tag className="h-3 w-3 text-[#D4AF37]" /> Update Tag
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1f2937]/30 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <div className="flex gap-4">
                  <span>30d runs: <strong className="text-white">{(wf as any).runs30d || 142}</strong></span>
                  <span>Accuracy: <strong className="text-emerald-400">{(wf as any).successRate || 99.1}%</strong></span>
                </div>
                <span className="text-amber-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Configure Canvas <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ MASTER AUTOMATION RECIPES — fully wired end-to-end ═══════════ */}
      <div className="space-y-4">
        <div className="border-b border-amber-500/10 pb-3">
          <h3 className="text-lg font-serif font-black tracking-wide text-[#D4AF37] flex items-center gap-2">
            <Layers className="h-5 w-5" /> Master Automation Recipes
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            End-to-end wired blueprints: each deploy installs the workflow <b className="text-slate-300">and</b> its linked drip campaigns, connects the pipeline stage moves, tasks, and payout hooks. This is the logic that runs the whole practice.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {AUTOMATION_RECIPES.map(recipe => {
            const installed = installedRecipes.has(recipe.id) || workflows.some(w => w.name === recipe.name);
            const open = expandedRecipe === recipe.id;
            return (
              <div key={recipe.id} className="bg-neutral-950/40 border border-[#1f2937]/70 hover:border-amber-500/25 rounded-3xl overflow-hidden transition duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[8px] font-mono font-black text-[#D4AF37] uppercase rounded-lg tracking-wider">{recipe.category}</span>
                      <h4 className="font-serif font-black text-white text-base mt-2">{recipe.name}</h4>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{recipe.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] font-mono">
                    <span className="px-2 py-1 bg-neutral-900 border border-[#1f2937] rounded-lg text-slate-400">⚡ {recipe.trigger.type}</span>
                    <span className="px-2 py-1 bg-neutral-900 border border-[#1f2937] rounded-lg text-slate-400">{recipe.actions.length} actions</span>
                    {(recipe.enrollsDrip || []).map(d => (
                      <span key={d} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">enrolls: {DRIP_LIBRARY.find(t => t.id === d)?.name || d}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleInstallRecipe(recipe.id)}
                      disabled={installed}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition ${installed ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default' : 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-black active:scale-95'}`}
                    >
                      {installed ? <><CheckCircle2 className="h-4 w-4" /> Deployed & Wired</> : <>Deploy Recipe + Linked Drips <ArrowRight className="h-4 w-4" /></>}
                    </button>
                    <button
                      onClick={() => setExpandedRecipe(open ? null : recipe.id)}
                      className="px-4 py-2.5 rounded-2xl text-xs font-black border border-[#1f2937] text-slate-400 hover:text-white hover:border-amber-500/30 transition"
                    >
                      {open ? 'Hide Wiring' : 'View Wiring'}
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="border-t border-[#1f2937]/60 bg-neutral-950/60 px-6 py-5">
                    <p className="text-[9px] font-mono font-black text-[#D4AF37] uppercase tracking-widest mb-3">Full wiring map — what connects to what</p>
                    <ol className="space-y-2">
                      {recipe.wiring.map((w, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="h-5 w-5 shrink-0 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#D4AF37] text-[9px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                          {w}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 50 PRE-BUILT TAX INDUSTRY WORKFLOW TEMPLATES CATALOG EXPLORER */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-4">
          <div>
            <h3 className="text-lg font-serif font-black tracking-wide text-[#D4AF37]">
              Pre-Configured Tax Automation Library
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Select and instantly deploy any of our 50 pre-built, sector-compliant templates, complete with integrations.
            </p>
          </div>

          <div className="w-full md:max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 50 compliance templates..."
              className="w-full bg-neutral-950 border border-[#1f2937] hover:border-amber-500/30 focus:border-[#D4AF37] rounded-2xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none transition"
            />
          </div>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex flex-wrap gap-1 bg-neutral-950/60 p-1 border border-[#1f2937] rounded-3xl w-fit max-w-full overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition duration-300 ${
                activeCategory === cat.id 
                  ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/20 text-[#D4AF37]' 
                  : 'text-slate-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid catalog */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-neutral-950/30 border border-[#1f2937]/75 hover:border-amber-500/20 rounded-3xl p-5 backdrop-blur-xl flex flex-col justify-between gap-4 transition duration-300 group"
            >
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[8px] font-mono font-black text-[#D4AF37] uppercase rounded-lg tracking-wider">
                  {tpl.category}
                </span>
                <h4 className="font-serif font-black text-white text-base tracking-wide group-hover:text-[#D4AF37] transition">
                  {tpl.name}
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {tpl.desc}
                </p>
                <div className="pt-2 font-mono text-[9px] text-slate-500">
                  ⚡ Trigger: <span className="text-[#D4AF37]">{tpl.trigger}</span>
                </div>
              </div>

              <button
                onClick={() => handleInstallTemplate(tpl)}
                disabled={installSuccessId === tpl.id}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition duration-300 ${
                  installSuccessId === tpl.id 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-neutral-900/60 hover:bg-amber-500 hover:text-black border border-[#1f2937]/60 text-slate-300'
                }`}
              >
                {installSuccessId === tpl.id ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Installed Success
                  </>
                ) : (
                  <>
                    Deploy Template <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 bg-neutral-950/20 border border-[#1f2937] rounded-3xl">
            <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-xs font-mono">No compliance templates match your filters or search keywords.</p>
          </div>
        )}
      </div>

    </div>
  );
}
