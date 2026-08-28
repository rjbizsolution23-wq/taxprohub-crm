import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  Plus, Globe, BarChart3, Eye, Copy, Trash2, Sparkles, ShieldCheck, 
  ArrowRight, Search, Laptop, CheckCircle2, DollarSign, RefreshCw, FileText
} from 'lucide-react';
import AIPromptBar from '../components/layout/AIPromptBar';

// The 15 pre-built templates fully detailed with steps, workflows, conversion levels, and compliance structures
const preBuiltTemplates = [
  // 1. LEAD GENERATION
  {
    id: 'tpl_lead_magnet_v1',
    name: 'Tax Prep Lead Magnet',
    category: 'lead_generation',
    description: 'Capture high-intent email + phone leads with a free "2026 Tax Deduction Checklist" download.',
    wiredWorkflow: 'Workflow #1 (New Client Welcome Sequence)',
    workflowId: 'wf_template_1_new_client_welcome',
    steps: [
      { id: 's1', name: 'Opt-in Page', path: '/free-guide', type: 'landing' },
      { id: 's2', name: 'Verify Email', path: '/verify', type: 'custom' },
      { id: 's3', name: 'Consultation Calendar', path: '/book', type: 'custom' },
      { id: 's4', name: 'Thank You', path: '/thanks', type: 'thankyou' }
    ],
    conversionLever: '"47 Deductions Most Taxpayers Miss" Lead Magnet',
    complianceInjected: ['CAN-SPAM Opt-In Language', 'TCPA SMS Consent', 'Privacy Link in Footer', 'Circular 230 Disclosures']
  },
  {
    id: 'tpl_consult_booker_v1',
    name: 'Free Tax Consultation Booker',
    category: 'lead_generation',
    description: 'Direct calendar booking with pre-qualification intake questions for premium tax advisory clients.',
    wiredWorkflow: 'Workflow #22 (Booking Confirmation) & #23 (No-Show Recovery)',
    workflowId: 'wf_template_22_booking',
    steps: [
      { id: 's1', name: 'Consultation Landing', path: '/consultation', type: 'landing' },
      { id: 's2', name: 'Intake Calendar', path: '/book', type: 'custom' },
      { id: 's3', name: 'Confirmed Booking', path: '/confirmed', type: 'thankyou' }
    ],
    conversionLever: '"30-Min Strategy Call" Calendar Integration',
    complianceInjected: ['Circular 230 §10.30 Credentials', 'GLBA Privacy Disclosures']
  },
  {
    id: 'tpl_notice_response_v1',
    name: 'Tax Notice Response Service',
    category: 'lead_generation',
    description: 'Emergency client capture for IRS audits or CP2000 letters with secure file upload vault.',
    wiredWorkflow: 'Workflow #29 (IRS Notice Received Trigger)',
    workflowId: 'wf_template_29_notice',
    steps: [
      { id: 's1', name: 'Audit / Notice Help Desk', path: '/notice-help', type: 'landing' },
      { id: 's2', name: 'R2 Document Vault Upload', path: '/upload-notice', type: 'custom' },
      { id: 's3', name: 'Stripe Immediate Triage Retainer', path: '/pay-retainer', type: 'checkout' },
      { id: 's4', name: 'AI Diagnostics Activated', path: '/confirmed', type: 'thankyou' }
    ],
    conversionLever: '24-hour IRS Notice Response Triage Timer',
    complianceInjected: ['Circular 230 §10.30 Out-of-Relationships Disclaimer', 'No Outcome Guarantees']
  },
  {
    id: 'tpl_self_employed_v1',
    name: 'Self-Employed Tax Lead Funnel',
    category: 'lead_generation',
    description: 'Capture Schedule C & 1099 filers needing year-round support with deduction estimation quiz.',
    wiredWorkflow: 'Workflow #5 (Self-Employed Onboarding Pipeline)',
    workflowId: 'wf_template_5_self_employed',
    steps: [
      { id: 's1', name: 'Self-Employed Landing', path: '/contractor-tax', type: 'landing' },
      { id: 's2', name: 'Deduction Quiz (8 Questions)', path: '/quiz', type: 'custom' },
      { id: 's3', name: 'Book Analysis Call', path: '/book-consult', type: 'custom' },
      { id: 's4', name: 'Intake Confirmed', path: '/welcome', type: 'thankyou' }
    ],
    conversionLever: 'Interactive Deduction Quiz & Estimate Calculator',
    complianceInjected: ['FTC Truthfulness Substantiated Claims', 'GLBA Client Privacy Data Protection']
  },
  {
    id: 'tpl_bilingual_spanish_v1',
    name: 'Bilingual Spanish Tax Funnel',
    category: 'lead_generation',
    description: 'Target Spanish-speaking tax filers with fully bilingual landing views, toggles and localized copy.',
    wiredWorkflow: 'Workflow #6 (Bilingual Spanish Onboarding Flow)',
    workflowId: 'wf_template_6_bilingual',
    steps: [
      { id: 's1', name: 'Spanish Landing (Hablamos Español)', path: '/impuestos', type: 'landing' },
      { id: 's2', name: 'Bilingual Intake Form', path: '/intake', type: 'custom' },
      { id: 's3', name: 'Thank You / Schedule Callback', path: '/gracias', type: 'thankyou' }
    ],
    conversionLever: 'Spanish-Language Toggle & Latin Trust Badges',
    complianceInjected: ['Verbatim Spanish Compliance Footer Disclaimers', 'TCPA Consent in Spanish']
  },

  // 2. SERVICE OFFER
  {
    id: 'tpl_refund_advance_v1',
    name: 'Refund Advance Pre-Filing',
    category: 'service_offer',
    description: 'Urgency-driven landing page promoting up to $6,000 instant refund advance loans via Pathward Bank N.A.',
    wiredWorkflow: 'Workflow #17 (Refund Advance Underwriting Trigger)',
    workflowId: 'wf_template_17_refund_advance',
    steps: [
      { id: 's1', name: 'Claim up to $6k Advance', path: '/refund-advance', type: 'landing' },
      { id: 's2', name: 'Eligibility Pre-Qual Check', path: '/qualify', type: 'custom' },
      { id: 's3', name: 'Secure Bank Account Verification', path: '/verify-bank', type: 'custom' },
      { id: 's4', name: 'Submit Application', path: '/success', type: 'thankyou' }
    ],
    conversionLever: 'Urgency Timer & Up to $6,000 Advance Counter',
    complianceInjected: ['Truth in Lending Act (TILA) APR Box', 'Pathward N.A. Bank Partner Disclosures', 'Refund Deductibility Notices']
  },
  {
    id: 'tpl_credit_repair_v1',
    name: 'Credit Repair + Tax Combo',
    category: 'service_offer',
    description: 'Sell a recurring monthly credit dispute + annual tax filing bundle subscription with credit pull.',
    wiredWorkflow: 'Workflow #35 (Credit Repair Intake) & #16 (Pre-Filing Payment)',
    workflowId: 'wf_template_35_credit',
    steps: [
      { id: 's1', name: 'Maximize Refunds & Credit Score', path: '/credit-combo', type: 'landing' },
      { id: 's2', name: 'FCRA Written Credit Pull Consent', path: '/pull-credit', type: 'custom' },
      { id: 's3', name: 'Stripe Plan Selector ($197/mo)', path: '/subscribe', type: 'checkout' },
      { id: 's4', name: 'Onboarding Welcome Portal', path: '/welcome', type: 'thankyou' }
    ],
    conversionLever: 'Filing Fee Waiver + Credit Pull Authentication',
    complianceInjected: ['CROA Written Pre-Contract Disclosures', '5-Day Cooler-off Refund Policy', 'FCRA Permissible Purpose Text']
  },
  {
    id: 'tpl_bookkeeping_upsell_v1',
    name: 'Year-Round Bookkeeping Upsell',
    category: 'service_offer',
    description: 'Upsell past tax clients into year-round recurring monthly bookkeeping & accounting packages.',
    wiredWorkflow: 'Workflow #20 (Annual Renewal & Retainer Pipeline)',
    workflowId: 'wf_template_20_bookkeeping',
    steps: [
      { id: 's1', name: 'Bookkeeping Pitch', path: '/bookkeeping', type: 'landing' },
      { id: 's2', name: 'Lite / Pro / CFO Plan Selection', path: '/plans', type: 'checkout' },
      { id: 's3', name: 'Secure Stripe Checkout', path: '/checkout', type: 'checkout' },
      { id: 's4', name: 'Setup Portal & Integration', path: '/welcome', type: 'thankyou' }
    ],
    conversionLever: 'Filing Fee Credit + Year-End Scramble Savings Calculator',
    complianceInjected: ['FTC Truth in Pricing', 'Confidential Taxpayer Data Section 7216 Consents']
  },
  {
    id: 'tpl_audit_defense_v1',
    name: 'Audit Protection Retainer',
    category: 'service_offer',
    description: 'Secure post-filing audit defense memberships to filed clients for hands-off IRS representative security.',
    wiredWorkflow: 'Workflow #34 (Audit Defense Retainer Activated)',
    workflowId: 'wf_template_34_audit_defense',
    steps: [
      { id: 's1', name: 'Audit Shield Registration', path: '/audit-shield', type: 'landing' },
      { id: 's2', name: 'Stripe Secure Filing Premium ($49/yr)', path: '/pay', type: 'checkout' },
      { id: 's3', name: 'Member Welcome Kit', path: '/welcome', type: 'thankyou' }
    ],
    conversionLever: '"Sleep Soundly" Complete Protection Badges',
    complianceInjected: ['Circular 230 Scope-of-Representation Limit', 'This is Not Insurance Disclosures']
  },

  // 3. RECRUITMENT
  {
    id: 'tpl_service_bureau_v1',
    name: 'Service Bureau Recruitment',
    category: 'recruitment',
    description: 'Recruit independent preparers to your service bureau offering white-label setups & software.',
    wiredWorkflow: 'Workflow #51 (Service Bureau Preparer Onboarding)',
    workflowId: 'wf_template_51_service_bureau',
    steps: [
      { id: 's1', name: 'Start Your Own Tax Firm', path: '/start-tax-biz', type: 'landing' },
      { id: 's2', name: 'EFIN/PTIN Verification App', path: '/verify-credentials', type: 'custom' },
      { id: 's3', name: 'Discovery Demo Calendar', path: '/schedule-demo', type: 'custom' },
      { id: 's4', name: 'Application Submitted', path: '/confirmed', type: 'thankyou' }
    ],
    conversionLever: 'Revenue Generator Sliding Returns Calculator',
    complianceInjected: ['FTC Business Opportunity Rule Disclaimers', 'EFIN/PTIN Verification Standards']
  },
  {
    id: 'tpl_crm_reseller_v1',
    name: 'White-Label CRM Reseller Funnel',
    category: 'recruitment',
    description: 'Sign up digital agency and tax software resellers with white-label CRM subscriptions.',
    wiredWorkflow: 'Workflow #2 (Re-Engagement Pipeline Trigger)',
    workflowId: 'wf_template_2_reengagement',
    steps: [
      { id: 's1', name: 'Your Own CRM Agency', path: '/resell-software', type: 'landing' },
      { id: 's2', name: 'Demo Booking Form', path: '/book-demo', type: 'custom' },
      { id: 's3', name: 'Agreement Signing', path: '/agreements', type: 'checkout' }
    ],
    conversionLever: 'White-Label Branding Feature Highlight Bento',
    complianceInjected: ['FTC Earnings Disclosures', '1099-NEC Issuance Warning']
  },
  {
    id: 'tpl_affiliate_program_v1',
    name: 'Affiliate/Referral Partner Program',
    category: 'recruitment',
    description: 'Sign up client promoters, community networks, or influencers to earn commissions on filings.',
    wiredWorkflow: 'Workflow #41 (Referral Reward Tracker Automation)',
    workflowId: 'wf_template_41_referrals',
    steps: [
      { id: 's1', name: 'Refer & Earn $50/return', path: '/referral-program', type: 'landing' },
      { id: 's2', name: 'Partner Application Form', path: '/register', type: 'custom' },
      { id: 's3', name: 'Affiliate Dashboard Access', path: '/onboarding', type: 'thankyou' }
    ],
    conversionLever: 'Earn $50/return Commission Dashboard Visuals',
    complianceInjected: ['FTC Endorsement Guide Disclosure Requirements', 'W-9 Submission Disclosures']
  },

  // 4. RETENTION / RE-ENGAGEMENT
  {
    id: 'tpl_winback_lapsed_v1',
    name: 'Win-Back Lapsed Client',
    category: 'retention',
    description: 'Re-activate client filers who have not completed filing within the last 18+ months.',
    wiredWorkflow: 'Workflow #42 (Win-Back Lapsed Client Auto-Mailer)',
    workflowId: 'wf_template_42_winback',
    steps: [
      { id: 's1', name: 'Personalized Refund Summary', path: '/welcome-back', type: 'landing' },
      { id: 's2', name: 'Schedule Direct Filing Call', path: '/book-filing', type: 'custom' },
      { id: 's3', name: 'Calendar Booked', path: '/thanks', type: 'thankyou' }
    ],
    conversionLever: 'Last Year Refund Recap & Loyal Discounts',
    complianceInjected: ['Unsubscribe/Opt-out Enforcement Sync', 'Privacy Act Safe-keeping Logs']
  },
  {
    id: 'tpl_review_referral_v1',
    name: 'Review & Referral Generator',
    category: 'retention',
    description: 'Post-filing follow up workflow redirecting 4-5 stars to Google GMB, and low feedback privately.',
    wiredWorkflow: 'Workflow #40 (Post-Filing Review Request) & #41 (Referral Tracker)',
    workflowId: 'wf_template_40_reviews',
    steps: [
      { id: 's1', name: 'Rate Your Filing Experience', path: '/feedback', type: 'landing' },
      { id: 's2', name: 'Google / Yelp Redirection', path: '/post-rating', type: 'custom' },
      { id: 's3', name: 'Send Referral Offer', path: '/refer', type: 'thankyou' }
    ],
    conversionLever: '$25 Next-Year Credit Referral Incentive',
    complianceInjected: ['FTC Anti-Incentivized Fake Reviews Check', 'Organic Client Sentiment Segregation']
  },
  {
    id: 'tpl_mid_year_planning_v1',
    name: 'Mid-Year Tax Planning Check-In',
    category: 'retention',
    description: 'Capture critical life event planning revenue (new child, marriage, LLC creation) before tax season.',
    wiredWorkflow: 'Workflow #43 (Mid-Year Tax Check-In Engine)',
    workflowId: 'wf_template_43_mid_year',
    steps: [
      { id: 's1', name: 'Life Event Review', path: '/midyear-review', type: 'landing' },
      { id: 's2', name: 'Life Event Select Survey', path: '/survey', type: 'custom' },
      { id: 's3', name: 'Book Advisory Callback', path: '/schedule-plan', type: 'custom' },
      { id: 's4', name: 'Advisory Confirmed', path: '/thanks', type: 'thankyou' }
    ],
    conversionLever: 'Interactive Life Event Checklists (Marriage/Home/LLC)',
    complianceInjected: ['Confidential Taxpayer Data Consent Forms', 'IRS Section 7216 Safe-practices']
  }
];

export default function FunnelsPage() {
  const navigate = useNavigate();
  const { funnels, addFunnel, deleteFunnel } = useAppStore();
  
  const [activeCategory, setActiveTabCategory] = useState<'all' | 'lead_generation' | 'service_offer' | 'recruitment' | 'retention'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [installSuccessToast, setInstallSuccessToast] = useState<string | null>(null);

  // Filter templates based on tab category and search term
  const filteredTemplates = preBuiltTemplates.filter(tpl => {
    const matchesCategory = activeCategory === 'all' || tpl.category === activeCategory;
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tpl.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate global aggregate statistics
  const totalViews = funnels.reduce((sum, f) => sum + (f.stats?.views || 0), 1250 + 2340);
  const totalConversions = funnels.reduce((sum, f) => sum + (f.stats?.conversions || 0), 87 + 456);
  const totalRevenue = funnels.reduce((sum, f) => sum + (f.stats?.revenue || 0), 43500);
  const avgConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

  // Install a master template into the user state
  const handleInstallTemplate = (tpl: typeof preBuiltTemplates[0]) => {
    const newInstalledFunnel = {
      id: 'fn-' + Math.random().toString(36).substring(2, 6),
      name: tpl.name,
      steps: tpl.steps.map((st, i) => ({
        id: 'st-' + Math.random().toString(36).substring(2, 6),
        name: st.name,
        type: st.type as 'landing' | 'thankyou' | 'checkout' | 'custom',
        path: st.path,
        content: '',
        position: i
      })),
      domain: `${tpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.myvirtualtaxsoftware.com`,
      published: false,
      stats: {
        views: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    addFunnel(newInstalledFunnel);
    setInstallSuccessToast(tpl.name);
    setTimeout(() => {
      setInstallSuccessToast(null);
    }, 4000);
  };

  return (
    <div className="space-y-8 min-h-screen bg-[#030712] text-slate-100 -m-6 md:-m-8 p-6 md:p-8">
      {/* Rebranded Luxury Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-serif font-black tracking-wider text-[#D4AF37] text-lg">MYVIRTUAL</span>
            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-amber-500/80 font-bold">TAX PROFESSIONAL PLATFORM</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">Funnels & Site Builder</h1>
          <p className="text-slate-400 text-sm mt-1">Deploy high-converting, compliance-locked pages completely wired to active practice automations.</p>
        </div>
        <button
          onClick={() => navigate('/funnels/new')}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:brightness-110 text-neutral-950 font-black text-sm rounded-xl transition shadow-lg shadow-amber-500/10"
        >
          <Plus className="h-4.5 w-4.5" />
          Create From Scratch
        </button>
      </div>

      {/* AI Prompt-to-Build Widget */}
      <AIPromptBar 
        moduleName="compliant funnels & pages" 
        placeholder="Prompt the AI to build a marketing funnel (e.g. S-Corp tax resolution funnel with secure document upload steps)..."
      />

      {/* Aggregate Metrics Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'Total Live Assets', val: funnels.length + 2, icon: Globe, color: 'text-amber-500 bg-amber-500/5 border-amber-500/10' },
          { title: 'Aggregate Traffic Views', val: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-400 bg-blue-500/5 border-blue-500/10' },
          { title: 'Funnels Conversion Rate', val: `${avgConversionRate.toFixed(1)}%`, icon: BarChart3, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
          { title: 'Contract-Acreed Revenue', val: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-yellow-400 bg-yellow-500/5 border-yellow-500/10' },
        ].map((stat, i) => (
          <div key={i} className="relative group bg-neutral-900/40 backdrop-blur-md border border-neutral-800/80 p-5 rounded-2xl transition hover:border-amber-500/20">
            {/* Ambient Gold Mesh Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/2.5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/5 transition"></div>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border ${stat.color.split(' ')[1]} ${stat.color.split(' ')[2]}`}>
                <stat.icon className={`h-5.5 w-5.5 ${stat.color.split(' ')[0]}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-serif">{stat.val}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">{stat.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 15 MASTER COMPLIANCE-LOCKED TEMPLATES EXPLORER */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-neutral-900 pt-8">
          <div>
            <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#D4AF37] animate-pulse" />
              15 Master Tax Funnel Templates
            </h2>
            <p className="text-xs text-slate-500">Every template ships pre-wired to companion automations with 11-section legal disclaimers.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search compliance templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/60 border border-neutral-800 text-xs text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-amber-500/40"
            />
          </div>
        </div>

        {/* Categories Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-900 pb-4">
          {[
            { id: 'all', name: 'All 15 Templates' },
            { id: 'lead_generation', name: 'Lead Generation (5)' },
            { id: 'service_offer', name: 'Service Offers (4)' },
            { id: 'recruitment', name: 'Recruitment (3)' },
            { id: 'retention', name: 'Retention & Win-Back (3)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabCategory(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                activeCategory === tab.id
                  ? 'bg-[#D4AF37]/10 border-amber-500/30 text-[#D4AF37]'
                  : 'bg-neutral-900/30 border-transparent text-slate-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Templates Grid slider */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map(tpl => (
            <div key={tpl.id} className="group bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-amber-500/30 transition flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-amber-400 border border-amber-500/20 bg-amber-500/5 rounded-full uppercase tracking-wider">
                    {tpl.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> SECURE DISCLOSURES
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition font-serif">{tpl.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{tpl.description}</p>
                </div>

                {/* Automation Indicator */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-900 space-y-1.5">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 text-amber-500 animate-spin-slow" /> Wires Direct To Workflow:
                  </div>
                  <p className="text-xs font-bold text-[#D4AF37] font-mono truncate">{tpl.wiredWorkflow}</p>
                </div>

                {/* Conversion and Compliance metrics summary */}
                <div className="space-y-2 text-[11px] pt-1">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-[#D4AF37]">✦</span> 
                    <span>Lever: <strong>{tpl.conversionLever}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tpl.complianceInjected.map((law, j) => (
                      <span key={j} className="px-1.5 py-0.5 bg-neutral-950 text-slate-500 border border-neutral-900 rounded text-[9px]">
                        {law}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Install trigger footer */}
              <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between">
                <div className="text-[10px] text-slate-500">
                  {tpl.steps.length} Custom Steps
                </div>
                <button
                  onClick={() => handleInstallTemplate(tpl)}
                  className="flex items-center gap-1 px-3.5 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-neutral-950 text-xs font-black rounded-lg transition"
                >
                  Install Template <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE CHANNELS / PUBLISHED ASSETS SECTION */}
      <div className="border-t border-neutral-900 pt-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-amber-500" />
            Active Funnel & Site Implementations
          </h2>
          <p className="text-xs text-slate-500">Manage and edit your active online filing assets and domain route maps.</p>
        </div>

        {/* Existing Funnels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Static Sample 1 */}
          <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden hover:border-amber-500/20 transition flex flex-col justify-between">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg font-serif">Tax Prep Lead Magnet — Tax Pro Hub University</h3>
                  <a href="https://guide.myvirtualtaxsoftware.com" target="_blank" rel="noreferrer" className="text-xs text-amber-500 hover:underline flex items-center gap-1.5 mt-0.5 font-mono">
                    <Laptop className="h-3.5 w-3.5 text-slate-500" /> guide.myvirtualtaxsoftware.com
                  </a>
                </div>
                <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                  Published
                </span>
              </div>

              {/* Step flow */}
              <div className="flex items-center gap-1 bg-neutral-950 p-2.5 rounded-xl border border-neutral-900 overflow-x-auto">
                {['/free-guide', '/verify', '/book', '/thanks'].map((st, i) => (
                  <div key={i} className="flex items-center shrink-0">
                    <span className="px-2 py-1 text-[10px] bg-neutral-900 border border-neutral-800 text-slate-300 font-mono rounded">
                      {st}
                    </span>
                    {i < 3 && <span className="mx-1 text-slate-700">→</span>}
                  </div>
                ))}
              </div>

              {/* Conversion Statistics */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-neutral-900">
                <div>
                  <p className="text-lg font-bold text-white font-serif">2,340</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Views</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white font-serif">456</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Leads</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white font-serif">19.5%</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Rate</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white font-serif">$43,500</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Revenue</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4.5 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <FileText className="h-4 w-4 text-amber-500" /> Wired to Workflow #1
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/funnels/new')} className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-white font-bold rounded-lg transition">
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Installed templates loop */}
          {funnels.map(funnel => (
            <div key={funnel.id} className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden hover:border-amber-500/20 transition flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg font-serif">{funnel.name}</h3>
                    <div className="text-xs text-amber-500/80 mt-0.5 font-mono">
                      {funnel.domain}
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[9px] font-mono font-bold rounded-full uppercase tracking-wider border ${
                    funnel.published 
                      ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' 
                      : 'text-amber-400 bg-amber-500/5 border-amber-500/20'
                  }`}>
                    {funnel.published ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Step flow */}
                <div className="flex items-center gap-1 bg-neutral-950 p-2.5 rounded-xl border border-neutral-900 overflow-x-auto">
                  {funnel.steps.map((st, i) => (
                    <div key={i} className="flex items-center shrink-0">
                      <span className="px-2 py-1 text-[10px] bg-neutral-900 border border-neutral-800 text-slate-300 font-mono rounded">
                        {st.path}
                      </span>
                      {i < funnel.steps.length - 1 && <span className="mx-1 text-slate-700">→</span>}
                    </div>
                  ))}
                </div>

                {/* Conversion Statistics */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-neutral-900">
                  <div>
                    <p className="text-lg font-bold text-white font-serif">{funnel.stats?.views || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Views</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white font-serif">{funnel.stats?.conversions || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Leads</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white font-serif">{funnel.stats?.conversionRate || 0}%</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white font-serif">${funnel.stats?.revenue || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Revenue</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4.5 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between text-xs">
                <button 
                  onClick={() => deleteFunnel(funnel.id)}
                  className="p-2 bg-neutral-900/60 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition"
                  title="Remove Asset"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/funnels/${funnel.id}`)}
                    className="px-4 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-neutral-950 text-xs font-black rounded-lg transition"
                  >
                    Edit Asset
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LUXURY COMPLIANCE VERIFICATION BANNER */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-1.5 text-[#D4AF37] font-serif font-extrabold text-sm tracking-wide">
            <ShieldCheck className="h-4.5 w-4.5 animate-pulse" /> TAX LAW COMPLIANCE ASSURANCE • 2026 GENERAL AUDIT SAFEGUARDED
          </div>
          <h3 className="text-lg font-bold text-white font-serif leading-tight">All published assets undergo active real-time automated security parses</h3>
          <p className="text-xs text-slate-400 max-w-xl">Every generated step automatically locks CAN-SPAM subject titles, TCPA autodialer checkbox scripts, IRS Circular 230 §10.30 credentials lines, GLBA security audits, and state-specific credit repair CROA and refund-advance loan disclosures.</p>
        </div>
        <div className="flex gap-4 items-center shrink-0 z-10">
          <span className="text-[10px] font-mono text-emerald-400 font-bold px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-full uppercase tracking-wider">
            ✓ FedRAMP Aligned
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-full uppercase tracking-wider">
            ✓ ADA WCAG 2.1 Pass
          </span>
        </div>
      </div>

      {/* Gold Success Toast */}
      {installSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-amber-500/30 text-white px-5 py-4.5 rounded-2xl shadow-2xl flex items-start gap-3 animate-fade-in-up">
          <CheckCircle2 className="h-5.5 w-5.5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-amber-400 font-mono tracking-wider">Template Loaded Successfully!</h4>
            <p className="text-[11px] text-slate-300">Installed <strong>{installSuccessToast}</strong> into draft assets.</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
              ⚡ Wired Workflows Activated
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
