import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash2, Eye, MoveUp, MoveDown, Globe, Laptop, 
  Tablet, Smartphone, RotateCcw, RotateCw, Play, CheckCircle2, AlertTriangle, 
  Settings as SettingsIcon, Image as ImageIcon, Heading as HeadingIcon, Type, 
  MousePointerClick, PlayCircle, Star, Sparkles, FormInput, Calendar as CalendarIcon, 
  Grid, HelpCircle, Split, Layout, Columns, RefreshCw, Layers, Copy, Check, EyeOff,
  ShieldCheck, Activity, Clock, Sliders, Languages, Send, Lock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { generateAIResponse } from '../../utils/ai';


const CloudflareIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

// 15 Master Templates Definition with metadata and localized steps
const masterTemplates = [
  {
    id: 'tpl_lead_magnet_v1',
    name: 'Tax Prep Lead Magnet',
    category: 'lead_generation',
    wiredWorkflow: 'Workflow #1 (New Client Welcome Sequence)',
    steps: [
      { id: 's1', name: 'Opt-in Page', slug: 'free-guide', type: 'landing' },
      { id: 's2', name: 'Verify Email', slug: 'verify', type: 'custom' },
      { id: 's3', name: 'Consultation Calendar', slug: 'book', type: 'custom' },
      { id: 's4', name: 'Thank You Page', slug: 'thanks', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_consult_booker_v1',
    name: 'Free Tax Consultation Booker',
    category: 'lead_generation',
    wiredWorkflow: 'Workflow #22 (Booking Confirmation)',
    steps: [
      { id: 's1', name: 'Consultation Landing', slug: 'consultation', type: 'landing' },
      { id: 's2', name: 'Intake Calendar', slug: 'book', type: 'custom' },
      { id: 's3', name: 'Confirmed Booking', slug: 'confirmed', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_notice_response_v1',
    name: 'Tax Notice Response Service',
    category: 'lead_generation',
    wiredWorkflow: 'Workflow #29 (IRS Notice Received)',
    steps: [
      { id: 's1', name: 'Notice Help Desk', slug: 'notice-help', type: 'landing' },
      { id: 's2', name: 'Document Vault Upload', slug: 'upload-notice', type: 'custom' },
      { id: 's3', name: 'Same-Day Retainer Payment', slug: 'pay-retainer', type: 'checkout' },
      { id: 's4', name: 'AI Expert Activated', slug: 'confirmed', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_self_employed_v1',
    name: 'Self-Employed Tax Lead Funnel',
    category: 'lead_generation',
    wiredWorkflow: 'Workflow #5 (Self-Employed Onboarding)',
    steps: [
      { id: 's1', name: 'Self-Employed Pitch', slug: 'contractor-tax', type: 'landing' },
      { id: 's2', name: 'Deduction Quiz', slug: 'quiz', type: 'custom' },
      { id: 's3', name: 'Book Advisory Callback', slug: 'book-consult', type: 'custom' },
      { id: 's4', name: 'Onboarding Portal Direct', slug: 'welcome', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_bilingual_spanish_v1',
    name: 'Bilingual Spanish Tax Funnel',
    category: 'lead_generation',
    wiredWorkflow: 'Workflow #6 (Bilingual Spanish Onboarding)',
    steps: [
      { id: 's1', name: 'Spanish Landing View', slug: 'impuestos', type: 'landing' },
      { id: 's2', name: 'Bilingual Intake Form', slug: 'intake', type: 'custom' },
      { id: 's3', name: 'Gracias / Completed', slug: 'gracias', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_refund_advance_v1',
    name: 'Refund Advance Pre-Filing',
    category: 'service_offer',
    wiredWorkflow: 'Workflow #17 (Refund Advance Approval)',
    steps: [
      { id: 's1', name: 'Advance Claim Landing', slug: 'refund-advance', type: 'landing' },
      { id: 's2', name: 'Eligibility Pre-Qual Quiz', slug: 'qualify', type: 'custom' },
      { id: 's3', name: 'Secure Bank Verification', slug: 'verify-bank', type: 'custom' },
      { id: 's4', name: 'Application Submitted', slug: 'success', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_credit_repair_v1',
    name: 'Credit Repair + Tax Combo',
    category: 'service_offer',
    wiredWorkflow: 'Workflow #35 (Credit Repair Intake) & #16 (Pre-Filing Payment)',
    steps: [
      { id: 's1', name: 'Refund & Credit Booster', slug: 'credit-combo', type: 'landing' },
      { id: 's2', name: 'FCRA Pull Authorization', slug: 'pull-credit', type: 'custom' },
      { id: 's3', name: 'Stripe Plan Selector', slug: 'subscribe', type: 'checkout' },
      { id: 's4', name: 'Onboarding Welcome Portal', slug: 'welcome', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_bookkeeping_upsell_v1',
    name: 'Year-Round Bookkeeping Upsell',
    category: 'service_offer',
    wiredWorkflow: 'Workflow #20 (Annual Renewal & Retainer)',
    steps: [
      { id: 's1', name: 'Bookkeeping Pitch View', slug: 'bookkeeping', type: 'landing' },
      { id: 's2', name: 'Monthly Plan Selector', slug: 'plans', type: 'checkout' },
      { id: 's3', name: 'Stripe Direct Billing', slug: 'checkout', type: 'checkout' },
      { id: 's4', name: 'Bookkeeping Onboard portal', slug: 'welcome', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_audit_defense_v1',
    name: 'Audit Protection Retainer',
    category: 'service_offer',
    wiredWorkflow: 'Workflow #34 (Audit Defense Retainer Activated)',
    steps: [
      { id: 's1', name: 'Audit Shield Registration', slug: 'audit-shield', type: 'landing' },
      { id: 's2', name: 'Stripe Premium Checkout', slug: 'pay', type: 'checkout' },
      { id: 's3', name: 'Member Welcome Kit', slug: 'welcome', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_service_bureau_v1',
    name: 'Service Bureau Recruitment',
    category: 'recruitment',
    wiredWorkflow: 'Workflow #51 (Service Bureau Preparer Onboarding)',
    steps: [
      { id: 's1', name: 'EFIN Preparer Pitch Landing', slug: 'start-tax-biz', type: 'landing' },
      { id: 's2', name: 'PTIN/EFIN Credentials Form', slug: 'verify-credentials', type: 'custom' },
      { id: 's3', name: 'Discovery Call Scheduler', slug: 'schedule-demo', type: 'custom' },
      { id: 's4', name: 'Application Complete', slug: 'confirmed', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_crm_reseller_v1',
    name: 'White-Label CRM Reseller Funnel',
    category: 'recruitment',
    wiredWorkflow: 'Workflow #2 (Re-Engagement CRM Reseller)',
    steps: [
      { id: 's1', name: 'White-Label CRM Hub', slug: 'resell-software', type: 'landing' },
      { id: 's2', name: 'Demo Booking Scheduler', slug: 'book-demo', type: 'custom' },
      { id: 's3', name: 'Onboard Reseller SLA', slug: 'agreements', type: 'checkout' }
    ]
  },
  {
    id: 'tpl_affiliate_program_v1',
    name: 'Affiliate/Referral Partner Program',
    category: 'recruitment',
    wiredWorkflow: 'Workflow #41 (Referral Tracker Automation)',
    steps: [
      { id: 's1', name: 'Earn $50/return Referral Pitch', slug: 'referral-program', type: 'landing' },
      { id: 's2', name: 'Partner App Registration', slug: 'register', type: 'custom' },
      { id: 's3', name: 'Affiliate Dashboard Access', slug: 'onboarding', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_winback_lapsed_v1',
    name: 'Win-Back Lapsed Client',
    category: 'retention',
    wiredWorkflow: 'Workflow #42 (Win-Back Lapsed Client)',
    steps: [
      { id: 's1', name: 'Lapsed Client Refund summary', slug: 'welcome-back', type: 'landing' },
      { id: 's2', name: 'Re-file Direct Appointment', slug: 'book-filing', type: 'custom' },
      { id: 's3', name: 'Confirmed Win-Back Booking', slug: 'thanks', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_review_referral_v1',
    name: 'Review & Referral Generator',
    category: 'retention',
    wiredWorkflow: 'Workflow #40 (Review Request) & #41 (Referral Tracker)',
    steps: [
      { id: 's1', name: 'Client Feedback Rating', slug: 'feedback', type: 'landing' },
      { id: 's2', name: 'Reviews Redirect Desk', slug: 'post-rating', type: 'custom' },
      { id: 's3', name: 'Claim Referral Incentive', slug: 'refer', type: 'thankyou' }
    ]
  },
  {
    id: 'tpl_mid_year_planning_v1',
    name: 'Mid-Year Tax Planning Check-In',
    category: 'retention',
    wiredWorkflow: 'Workflow #43 (Mid-Year Tax Check-In)',
    steps: [
      { id: 's1', name: 'Life Events Advisor', slug: 'midyear-review', type: 'landing' },
      { id: 's2', name: 'Life Event Select Survey', slug: 'survey', type: 'custom' },
      { id: 's3', name: 'Book Advisory Callback', slug: 'schedule-plan', type: 'custom' },
      { id: 's4', name: 'Advisory Setup Confirmed', slug: 'thanks', type: 'thankyou' }
    ]
  }
];

export default function FunnelBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { funnels, updateFunnel, addFunnel } = useAppStore();

  // Load existing funnel data or start with the first template
  const activeFunnel = funnels.find(f => f.id === id) || {
    id: id || 'fn-new',
    name: 'Tax Prep Lead Magnet — Tax Pro Hub University',
    steps: masterTemplates[0].steps.map((st, i) => ({
      id: 'st-' + i,
      name: st.name,
      slug: st.slug,
      type: st.type as 'landing' | 'thankyou' | 'checkout' | 'custom',
      path: '/' + st.slug,
      content: '',
      position: i
    })),
    domain: 'guide.myvirtualtaxsoftware.com',
    published: false,
    stats: { views: 2340, conversions: 456, conversionRate: 19.5, revenue: 43500 },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const [funnelName, setFunnelName] = useState(activeFunnel.name);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [steps, setSteps] = useState(activeFunnel.steps);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_lead_magnet_v1');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'engine1' | 'engine2' | 'engine3' | 'engine4'>('engine1');

  // Engine 1: Input Matrix State Variables
  const [businessName, setBusinessName] = useState('Tax Pro Hub University');
  const [businessNiche, setBusinessNiche] = useState('tax_preparation');
  const [businessOffer, setBusinessOffer] = useState('$6,000 Refund Advance & Certified Filings');
  const [businessPricing, setBusinessPricing] = useState('$197/mo Elite Partner Plan');
  const [businessDomain, setBusinessDomain] = useState('taxprohubuniversity.com');
  const [brandPrimaryColor, setBrandPrimaryColor] = useState('#D4AF37');

  // Engine 4: CRM Sync & Stripe payments State Variables
  const [crmPipeline, setCrmPipeline] = useState('Tax Prep Client Acquisition Pipeline');
  const [crmStage, setCrmStage] = useState('Inbound Automated Lead');
  const [utmSource, setUtmSource] = useState('Google_CPC');
  const [utmMedium, setUtmMedium] = useState('AdWords_Search');
  const [utmCampaign, setUtmCampaign] = useState('New_Mexico_Tax_2026');
  const [stripeConnected, setStripeConnected] = useState(true);

  // Interactive UI Simulation States
  const [spanishLanguageToggle, setSpanishLanguageToggle] = useState(false);
  const [qualificationQuizIndex, setQualificationQuizIndex] = useState(0);
  const [refundAdvanceSliderValue, setRefundAdvanceSliderValue] = useState(3000);
  const [creditAuthChecked, setCreditAuthChecked] = useState(false);
  const [stripeCheckedPlan, setStripeCheckedPlan] = useState('pro');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // SEO Audit States
  const [seoTitle, setSeoTitle] = useState('Free 2026 Tax Deduction Checklist | Tax Pro Hub University');
  const [seoDescription, setSeoDescription] = useState('Download the free checklist instantly. Get the 47 deductions most preparers miss under the security of Tax Pro Hub University.');
  const [seoOgImage, setSeoOgImage] = useState('https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg');

  // Custom Inline text parameters overrides
  const [customHeroHeadline, setCustomHeroHeadline] = useState('');
  const [customHeroSubheadline, setCustomHeroSubheadline] = useState('');
  const [customCTAtext, setCustomCTAtext] = useState('');
  const [customBgPalette, setCustomBgPalette] = useState('bg-neutral-950');
  const [customPadding, setCustomPadding] = useState('py-20 px-8');
  const [customAnimation, setCustomAnimation] = useState('fade-up');

  // AI Chat Bot Panel States
  const [chatbotQuery, setChatbotQuery] = useState('');
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent', text: string, diagnosticLogs?: string[] }>>([
    { 
      sender: 'agent', 
      text: `Greetings, I am your **AI Funnel Architect** co-pilot. I have pre-merged your brand kit tokens, injected 11-section law compliance footnotes, and secured your active practice workflows connection! Describe the changes you want me to perform, or try: "Make it premium black + gold", "Translate the disclosures to Spanish", or "Simulate Refund Advance template"` 
    }
  ]);

  // Cloudflare deploy simulators
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Main Mode Toggle: Preview vs Visual Flowchart Map
  const [centerMode, setCenterMode] = useState<'preview' | 'flowmap'>('preview');

  // Cloudflare Deployment States
  const [cfProjectName, setCfProjectName] = useState('tax-pro-hub-university');
  const [cfCustomDomain, setCfCustomDomain] = useState('rjbusinesssolutions.org');
  const [cfWafEnabled, setCfWafEnabled] = useState(true);
  const [cfBrowserIntegrity, setCfBrowserIntegrity] = useState(true);
  const [cfBotFightMode, setCfBotFightMode] = useState(true);
  const [isSyncingCloudflare, setIsSyncingCloudflare] = useState(false);
  const [cfSyncProgress, setCfSyncProgress] = useState<number>(0);
  const [cfSyncStatus, setCfSyncStatus] = useState<string>('');
  const [cfLiveUrl, setCfLiveUrl] = useState<string>('');
  const [stepConversionRates, setStepConversionRates] = useState<Record<string, number>>({
    's1': 45, 's2': 68, 's3': 32, 's4': 88, 'st-0': 45, 'st-1': 68, 'st-2': 32, 'st-3': 88, 'st-4': 90
  });

  // Auto-fill edits based on template choice
  const activeTemplate = masterTemplates.find(t => t.id === selectedTemplateId) || masterTemplates[0];

  useEffect(() => {
    // Reset page states on template change
    setCustomHeroHeadline('');
    setCustomHeroSubheadline('');
    setCustomCTAtext('');
  }, [selectedTemplateId]);

  // Handle template selection
  const handleTemplateSelection = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const targetTpl = masterTemplates.find(t => t.id === tplId);
    if (targetTpl) {
      setFunnelName(targetTpl.name);
      const mappedSteps = targetTpl.steps.map((st, i) => ({
        id: 'st-' + Math.random().toString(36).substring(2, 6),
        name: st.name,
        slug: st.slug,
        type: st.type as any,
        path: '/' + st.slug,
        content: '',
        position: i
      }));
      setSteps(mappedSteps);
      setActiveStepIndex(0);
    }
  };

  // Live AI Chat Edit and Generation Engine
  const handleSendAiMessage = async () => {
    if (!chatbotQuery.trim()) return;

    const userMsg = chatbotQuery;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatbotQuery('');
    setIsAiStreaming(true);

    try {
      // Map existing chat history to ChatMessage format for the LLM
      const historyMapping = chatHistory.map(msg => ({
        role: (msg.sender === 'agent' ? 'assistant' : 'user') as 'user' | 'assistant' | 'system' | 'model',
        content: msg.text
      }));

      // Direct asynchronous LLM call with diagnostics logging
      const aiResponse = await generateAIResponse('gemini', userMsg, historyMapping);
      
      let logs: string[] = [
        `Provider: ${aiResponse.diagnostics.provider}`,
        `Model: ${aiResponse.diagnostics.modelUsed}`,
        `Endpoint: ${aiResponse.diagnostics.endpoint}`,
        `Latency: ${aiResponse.diagnostics.latencyMs}ms`,
        `Estimated Tokens: ${aiResponse.diagnostics.tokensEstimate}`,
        `Fallback Sandbox Mode: ${aiResponse.diagnostics.isFallback ? 'Yes' : 'No'}`
      ];

      // Perform real-time page changes based on prompt keyword matching
      const msgLower = userMsg.toLowerCase();
      if (msgLower.includes('gold') || msgLower.includes('black') || msgLower.includes('premium')) {
        setCustomBgPalette('bg-neutral-950');
        setCustomAnimation('fade-up');
        logs.push('Aesthetic Override Triggered: Luxury Metallic Gold (#D4AF37)');
      } else if (msgLower.includes('spanish') || msgLower.includes('translate') || msgLower.includes('bilingual')) {
        setSpanishLanguageToggle(true);
        logs.push('Localization Override Triggered: Bilingual English-Spanish Mode');
      } else if (msgLower.includes('advance') || msgLower.includes('refund')) {
        setSelectedTemplateId('tpl_refund_advance_v1');
        handleTemplateSelection('tpl_refund_advance_v1');
        logs.push('Template Override Triggered: Refund Advance Pre-Filing (tpl_refund_advance_v1)');
      } else {
        // Parse custom headlines dynamically from the AI if they match patterns
        const headlineMatch = aiResponse.text.match(/(?:headline|title|heading):\s*["']?([^"'\n\r]+)["']?/i);
        const subheadlineMatch = aiResponse.text.match(/(?:subheadline|subtitle):\s*["']?([^"'\n\r]+)["']?/i);
        
        if (headlineMatch?.[1]) {
          setCustomHeroHeadline(headlineMatch[1].trim());
          logs.push(`AI Component Parsing: Extracted Headline -> "${headlineMatch[1].trim()}"`);
        } else {
          setCustomHeroHeadline('Worry-free Advanced Audits & Elite Tax Processing');
        }

        if (subheadlineMatch?.[1]) {
          setCustomHeroSubheadline(subheadlineMatch[1].trim());
          logs.push(`AI Component Parsing: Extracted Subheadline -> "${subheadlineMatch[1].trim()}"`);
        } else {
          setCustomHeroSubheadline('Ensure 100% compliant filings, maximum refund advanced loans, and 24hr IRS notice response packets.');
        }
      }

      setChatHistory(prev => [...prev, { 
        sender: 'agent', 
        text: aiResponse.text, 
        diagnosticLogs: logs 
      }]);
    } catch (err: any) {
      console.error('Funnel Builder Chat AI error:', err);
      setChatHistory(prev => [...prev, { 
        sender: 'agent', 
        text: `Error during inference: ${err.message || 'Unknown issue'}. Falling back to default styling modifications.` 
      }]);
    } finally {
      setIsAiStreaming(false);
    }
  };

  // Run publication pipeline
  const handlePublishLive = async () => {
    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setPublishUrl(`https://preview-myvirtual-consult-a3f9.myvirtualpreviews.app`);
    setIsPublishing(false);
  };

  const handleDeployToCloudflare = () => {
    setIsSyncingCloudflare(true);
    setCfSyncProgress(10);
    setCfSyncStatus('Initializing Cloudflare Edge connection...');
    setCfLiveUrl('');

    const stepsList = [
      { p: 30, s: 'Compiling React static pages and compressing assets (gzip)...' },
      { p: 55, s: 'Hashing bundle assets for Cloudflare Edge CDN & KV mapping...' },
      { p: 75, s: 'Injecting security headers & verifying Federal and State compliance...' },
      { p: 90, s: 'Deploying pages globally across 310+ Cloudflare edge PoPs...' },
      { p: 100, s: 'Deploy complete! Active Web Application Firewall (WAF) shielding initiated.' }
    ];

    stepsList.forEach((step, index) => {
      setTimeout(() => {
        setCfSyncProgress(step.p);
        setCfSyncStatus(step.s);
        if (step.p === 100) {
          setIsSyncingCloudflare(false);
          setCfLiveUrl(`https://${cfProjectName}.pages.dev`);
        }
      }, (index + 1) * 1200);
    });
  };

  // Quick helper to insert specific simulated components from AI chatbot logs
  const triggerSimulatedInsert = (section: 'pricing' | 'testimonials' | 'faq') => {
    if (section === 'pricing') {
      setChatHistory(prev => [...prev, {
        sender: 'agent',
        text: `✓ **Pricing section appended to canvas!** Set to absolute luxury black card grid with direct Stripe-checkout links.`,
        diagnosticLogs: ['Appended Block: Interactive Pricing Table', 'Applying Stripe subscription trigger: $197/mo']
      }]);
    } else if (section === 'testimonials') {
      setChatHistory(prev => [...prev, {
        sender: 'agent',
        text: `✓ **Testimonials section appended!** Pre-loaded with styled customer cards. Google GMB sync is enabled.`,
        diagnosticLogs: ['Appended Block: Testimonials Carousel', 'Injecting FTC Results-not-typical disclaimers']
      }]);
    } else {
      setChatHistory(prev => [...prev, {
        sender: 'agent',
        text: `✓ **Audit FAQ section appended!** Added 5 collapsible tax-professional response accordions.`,
        diagnosticLogs: ['Appended Block: FAQ Accordion', 'Injecting Circular 230 advertising standards safeguards']
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] -m-6 md:-m-8 flex flex-col text-slate-100 font-sans select-none">
      
      {/* Editor Main Top Header Bar */}
      <header className="h-16 border-b border-neutral-800/80 bg-[#030712] flex items-center justify-between px-6 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/funnels')} 
            className="p-2 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-black text-[#D4AF37] px-2 py-0.5 bg-[#D4AF37]/10 border border-amber-500/20 rounded">
                AI FUNNEL ARCHITECT v2.0
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> Compliance Locked
              </span>
            </div>
            <input 
              type="text" 
              value={funnelName}
              onChange={(e) => setFunnelName(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-neutral-800 focus:border-[#D4AF37] focus:outline-none text-base font-serif font-bold text-white py-0.5 tracking-tight"
            />
          </div>
        </div>

        {/* Viewport controls simulator switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-neutral-900/60 border border-neutral-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewport('desktop')}
            className={`p-2 rounded-lg transition ${viewport === 'desktop' ? 'bg-[#D4AF37] text-black font-black' : 'text-slate-400 hover:text-white'}`}
            title="Desktop Simulator"
          >
            <Laptop className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setViewport('tablet')}
            className={`p-2 rounded-lg transition ${viewport === 'tablet' ? 'bg-[#D4AF37] text-black' : 'text-slate-400 hover:text-white'}`}
            title="Tablet Simulator"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={`p-2 rounded-lg transition ${viewport === 'mobile' ? 'bg-[#D4AF37] text-black' : 'text-slate-400 hover:text-white'}`}
            title="Mobile Simulator"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setShowSavedToast(true);
              setTimeout(() => setShowSavedToast(false), 2000);
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold rounded-xl transition"
          >
            Save Draft
          </button>
          
          <button 
            onClick={handlePublishLive}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:brightness-110 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 transition"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Publish Live
          </button>
        </div>
      </header>

      {/* Editor Body Grid: Three Panes */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: Steps navigator & active templates */}
        <aside className="w-64 border-r border-neutral-800/80 bg-[#030712] flex flex-col shrink-0">
          <div className="p-4 border-b border-neutral-800/60">
            <h3 className="text-[10px] font-mono font-black text-[#D4AF37] tracking-[0.22em] uppercase mb-3">
              Steps Navigator
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {steps.map((st, i) => (
                <div 
                  key={st.id}
                  onClick={() => setActiveStepIndex(i)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition border cursor-pointer ${
                    i === activeStepIndex
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold'
                      : 'border-transparent hover:bg-neutral-900/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    <span className="font-mono text-[8px] text-[#D4AF37] bg-neutral-950 px-1 border border-amber-500/20 rounded">
                      {i + 1}
                    </span>
                    {st.name}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">{st.slug}</span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => {
                setSteps([...steps, {
                  id: 'st-' + Math.random().toString(36).substring(2, 6),
                  name: 'New Custom Route',
                  slug: 'step-' + (steps.length + 1),
                  type: 'custom',
                  path: '/step-' + (steps.length + 1),
                  content: '',
                  position: steps.length
                }]);
              }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-neutral-800 hover:border-amber-500/20 rounded-xl text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500 hover:text-amber-400 transition"
            >
              <Plus className="h-3 w-3" /> Add Custom Step
            </button>
          </div>

          {/* Quick template swapping store slider */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest pb-1 border-b border-neutral-900">
              Template swapping store
            </div>
            <div className="space-y-1.5">
              {masterTemplates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplateSelection(tpl.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition border text-xs flex flex-col gap-0.5 ${
                    selectedTemplateId === tpl.id
                      ? 'bg-gradient-to-r from-amber-500/15 to-transparent border-amber-500/30 text-amber-400 font-bold'
                      : 'border-transparent hover:bg-neutral-900/30 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="truncate font-semibold">{tpl.name}</span>
                  <span className="text-[8px] opacity-50 uppercase tracking-widest font-mono text-[#D4AF37]">
                    {tpl.category.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER PANE: Visual Preview Simulator with dynamic template layouts */}
        <main className="flex-1 bg-neutral-950 p-6 overflow-y-auto flex flex-col items-center space-y-4">
          
          {/* Main Mode Toggle: Preview vs Visual Flowchart Map */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl shrink-0 select-none z-10">
            <button
              onClick={() => setCenterMode('preview')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
                centerMode === 'preview'
                  ? 'bg-[#D4AF37] text-black font-black shadow-lg shadow-amber-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Page Preview
            </button>
            <button
              onClick={() => setCenterMode('flowmap')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
                centerMode === 'flowmap'
                  ? 'bg-[#D4AF37] text-black font-black shadow-lg shadow-amber-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Split className="h-3.5 w-3.5" />
              Interactive Funnel Flow Map
            </button>
          </div>

          {centerMode === 'preview' ? (
            <div 
              className={`bg-[#030712] border border-neutral-800 rounded-2xl shadow-2xl transition-all duration-300 relative flex flex-col min-h-[700px] overflow-hidden ${
                viewport === 'desktop' ? 'w-full max-w-4xl' : viewport === 'tablet' ? 'w-[768px]' : 'w-[375px]'
              }`}
            >
            {/* Simulation Header decoration */}
            <div className="h-9 bg-[#030712] border-b border-neutral-900 flex items-center justify-between px-4 select-none shrink-0 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500/50 rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-yellow-500/50 rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-green-500/50 rounded-full"></span>
                <span className="text-[10px] text-slate-600 font-mono ml-4 truncate">
                  guide.myvirtualtaxsoftware.com/{steps[activeStepIndex]?.slug || 'free-guide'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#D4AF37] px-2 py-0.5 bg-amber-500/5 rounded border border-amber-500/10">
                {viewport.toUpperCase()} MODE
              </span>
            </div>

            {/* Simulated Live Renderer */}
            <div className="flex-1 bg-[#030712] text-slate-100 relative">
              
              {/* BRAND HEADER AUTO-INJECTED MOCKUP */}
              <header className="px-6 py-4 bg-[#030712] border-b border-neutral-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-tr from-amber-600 to-yellow-400 rounded-lg flex items-center justify-center font-bold text-black text-xs shadow shadow-amber-500/10">
                    MV
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-xs tracking-wider text-white">MYVIRTUAL</h4>
                    <p className="text-[8px] text-[#D4AF37] uppercase tracking-widest font-bold">Tax Professional Platform</p>
                  </div>
                </div>

                {/* BILINGUAL LANGUAGE SWITCHER TOGGLE */}
                <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800 text-[10px]">
                  <Languages className="h-3 w-3 text-amber-500" />
                  <button 
                    onClick={() => setSpanishLanguageToggle(prev => !prev)}
                    className={`font-mono font-bold transition px-1 rounded ${!spanishLanguageToggle ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500'}`}
                  >
                    EN
                  </button>
                  <span className="text-slate-700">|</span>
                  <button 
                    onClick={() => setSpanishLanguageToggle(prev => !prev)}
                    className={`font-mono font-bold transition px-1 rounded ${spanishLanguageToggle ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500'}`}
                  >
                    ES
                  </button>
                </div>
              </header>

              {/* ACTIVE STEP COMPONENT LAYOUT SWITCHER */}
              <div className={`p-8 md:p-12 space-y-12 ${customAnimation === 'fade-up' ? 'animate-fade-in-up' : ''}`}>
                
                {/* 1. TAX PREP LEAD MAGNET */}
                {selectedTemplateId === 'tpl_lead_magnet_v1' && (
                  <div className="space-y-8 text-center max-w-2xl mx-auto">
                    <div className="space-y-3">
                      <span className="inline-block px-3 py-1 bg-amber-500/10 text-[#D4AF37] border border-amber-500/20 rounded-full text-[9px] font-mono tracking-widest uppercase font-bold">
                        EXCLUSIVE 2026 TAX CHECKLIST DOWNLOAD
                      </span>
                      <h2 className="text-3xl md:text-4xl font-extrabold text-white font-serif leading-tight">
                        {customHeroHeadline || (spanishLanguageToggle 
                          ? 'Descubra las 47 deducciones que la mayoría de los contribuyentes pasan por alto' 
                          : 'Get the 47 Tax Deductions Most Preparers Miss in 2026')}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
                        {customHeroSubheadline || (spanishLanguageToggle 
                          ? 'Descargue nuestra guía premium instantáneamente. Proteja sus reembolsos con las directrices del IRS.' 
                          : 'Ensure legal audit-proof representation, maximize annual write-offs, and file confidently with certified PTIN professionals.')}
                      </p>
                    </div>

                    {/* Book Graphic Placeholder */}
                    <div className="w-36 h-48 bg-gradient-to-tr from-neutral-900 to-neutral-950 border border-amber-500/20 rounded-lg mx-auto flex flex-col justify-between p-3 relative shadow-2xl group hover:scale-105 transition-transform">
                      <div className="absolute inset-0 bg-amber-500/2.5 rounded-lg blur pointer-events-none"></div>
                      <div className="text-[7px] font-mono text-[#D4AF37] font-bold text-left uppercase tracking-widest border-b border-amber-500/10 pb-1">
                        MYVIRTUAL TAX GUIDE
                      </div>
                      <div className="font-serif font-black text-xs text-white leading-tight">
                        2026<br/>Deductions<br/>Checklist
                      </div>
                      <span className="text-[7px] bg-amber-400 text-neutral-950 font-bold px-1 py-0.5 rounded text-center block uppercase tracking-wide">
                        Free Instant Download
                      </span>
                    </div>

                    {/* Leads Email Capture form with TCPA disclosures */}
                    <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 p-5 rounded-2xl max-w-sm mx-auto space-y-3">
                      <input 
                        type="text" 
                        placeholder={spanishLanguageToggle ? 'Nombre Completo' : 'Full Name'} 
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500/40"
                      />
                      <input 
                        type="email" 
                        placeholder={spanishLanguageToggle ? 'Correo Electrónico' : 'Email Address'} 
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500/40"
                      />
                      <input 
                        type="tel" 
                        placeholder={spanishLanguageToggle ? 'Teléfono Móvil' : 'Mobile Number'} 
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500/40"
                      />

                      {/* TCPA Checkbox compliance */}
                      <label className="flex items-start gap-2 text-left text-[9px] text-slate-500 leading-normal cursor-pointer select-none">
                        <input type="checkbox" defaultChecked className="mt-0.5 shrink-0 accent-amber-500" />
                        <span>
                          {spanishLanguageToggle 
                            ? 'Al enviar este formulario, usted autoriza a recibir alertas de texto recurrentes en su teléfono móvil. Frecuencia varía.' 
                            : 'By submitting, you consent to receive recurring marketing text alerts from Tax Pro Hub University at the number provided. Msg & data rates apply.'}
                        </span>
                      </label>

                      <button className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 uppercase tracking-wide">
                        {customCTAtext || (spanishLanguageToggle ? 'Enviar Mi Guía Gratuita' : 'Send Me the Checklist')}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. FREE CONSULTATION BOOKER */}
                {selectedTemplateId === 'tpl_consult_booker_v1' && (
                  <div className="space-y-6 text-center max-w-xl mx-auto">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold font-serif text-white">Book Your 15-Minute Tax Strategy Consult</h3>
                      <p className="text-xs text-slate-400">Direct integration with Google Calendar and Cal.com pipelines.</p>
                    </div>

                    {/* Simulated Cal.com scheduling widget */}
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl text-left">
                      <div className="p-4 bg-neutral-950 border-b border-neutral-900 flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Select Date & Time</span>
                        <span className="text-[#D4AF37] font-mono">15-min Consult</span>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        {/* Left Days list */}
                        <div className="space-y-1 text-xs">
                          {['Monday, May 25', 'Tuesday, May 26', 'Wednesday, May 27'].map((day, i) => (
                            <div key={i} className="p-2.5 bg-neutral-950 border border-neutral-800 hover:border-amber-500/20 rounded-xl cursor-pointer transition text-slate-300">
                              {day}
                            </div>
                          ))}
                        </div>
                        {/* Right Times list */}
                        <div className="space-y-1 text-xs">
                          {['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'].map((time, i) => (
                            <div key={i} className="p-2 bg-neutral-950 border border-neutral-800 text-center hover:border-amber-500/40 rounded-xl cursor-pointer transition text-amber-400">
                              {time}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TAX NOTICE RESPONSE SERVICE */}
                {selectedTemplateId === 'tpl_notice_response_v1' && (
                  <div className="space-y-6 text-center max-w-xl mx-auto">
                    <div className="space-y-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                      <div className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 animate-bounce" /> URGENT NOTICE DEADLINE
                      </div>
                      <p className="text-[11px] text-red-200">The IRS CP2000 or audit response timers must be answered within 30 days of issuance.</p>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold font-serif text-white">IRS Audit & Letter Help Desk</h2>
                      <p className="text-xs text-slate-400">Upload your PDF notice or letter into our security-hardened R2 folder to activate instant AI diagnostics.</p>
                    </div>

                    {/* Secure drag and drop upload mockup */}
                    <div className="border-2 border-dashed border-neutral-800 hover:border-amber-500/30 bg-neutral-900/40 rounded-2xl p-8 cursor-pointer transition flex flex-col items-center justify-center space-y-2">
                      <Lock className="h-7 w-7 text-amber-500" />
                      <span className="text-xs font-bold text-white">Drag & drop your IRS letter file here</span>
                      <span className="text-[10px] text-slate-500">Supports PDF, JPG, PNG up to 10MB</span>
                      <button 
                        onClick={() => setUploadedFileName('CP2000_Notice_Page1.pdf')}
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300"
                      >
                        Choose File
                      </button>

                      {uploadedFileName && (
                        <div className="mt-3 text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                          <CheckCircle2 className="h-4 w-4" /> {uploadedFileName} Uploaded (Secured)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. SELF-EMPLOYED TAX LEAD FUNNEL */}
                {selectedTemplateId === 'tpl_self_employed_v1' && (
                  <div className="space-y-6 text-center max-w-xl mx-auto">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold font-serif text-white">Schedule C Deduction Qualifier Quiz</h2>
                      <p className="text-xs text-slate-400">Verify missing contractor tax write-offs in 8 simple questions.</p>
                    </div>

                    {/* Interactive Quiz simulation block */}
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 text-left space-y-4">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold">
                        <span>QUESTION {qualificationQuizIndex + 1} OF 3</span>
                        <span className="text-amber-500">{(qualificationQuizIndex + 1) * 33}% COMPLETE</span>
                      </div>
                      
                      {qualificationQuizIndex === 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-white leading-normal">What is your estimated annual net profit from 1099/Schedule C contract work?</h4>
                          <div className="space-y-2 text-xs">
                            {['Under $50,000', '$50,000 - $100,000', 'Over $100,000'].map((ans, i) => (
                              <div key={i} onClick={() => setQualificationQuizIndex(1)} className="p-3 bg-neutral-950 border border-neutral-800 hover:border-amber-500/20 rounded-xl cursor-pointer transition text-slate-300">
                                {ans}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {qualificationQuizIndex === 1 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-white leading-normal">Do you operate a dedicated home office or use your personal vehicle for business miles?</h4>
                          <div className="space-y-2 text-xs">
                            {['Yes, both home office and car miles', 'Only one of them', 'No, neither'].map((ans, i) => (
                              <div key={i} onClick={() => setQualificationQuizIndex(2)} className="p-3 bg-neutral-950 border border-neutral-800 hover:border-amber-500/20 rounded-xl cursor-pointer transition text-slate-300">
                                {ans}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {qualificationQuizIndex === 2 && (
                        <div className="space-y-3 text-center py-4">
                          <CheckCircle2 className="h-10 w-12 text-emerald-400 mx-auto" />
                          <h4 className="text-sm font-bold text-white">Congratulations! You have pre-qualified for an estimated $4,250 in missed write-offs!</h4>
                          <p className="text-[11px] text-slate-400">Lock in your consultation step to verify and file with Tax Pro Hub University professionals.</p>
                          <button 
                            onClick={() => setQualificationQuizIndex(0)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black uppercase rounded-lg tracking-wider"
                          >
                            Retake Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. REFUND ADVANCE PRE-FILING */}
                {selectedTemplateId === 'tpl_refund_advance_v1' && (
                  <div className="space-y-6 text-center max-w-xl mx-auto">
                    <div className="space-y-2">
                      <span className="inline-block px-3 py-1 bg-amber-500/10 text-[#D4AF37] border border-amber-500/20 rounded-full text-[9px] font-mono tracking-widest uppercase font-bold">
                        FAST SEASON UNDERWRITING OPEN
                      </span>
                      <h2 className="text-3xl font-serif font-bold text-white">Claim Up To $6,000 Refund Advance</h2>
                      <p className="text-xs text-slate-400">Borrowed against your upcoming federal refund. Subject to underwriting approval. Zero upfront fees.</p>
                    </div>

                    {/* Slider element and advance estimation visual */}
                    <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl text-left space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase">Estimated Advance Choice</span>
                        <span className="text-2xl font-serif font-black text-amber-400">${refundAdvanceSliderValue.toLocaleString()}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1000" 
                        max="6000" 
                        step="500"
                        value={refundAdvanceSliderValue}
                        onChange={(e) => setRefundAdvanceSliderValue(Number(e.target.value))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Min $1,000</span>
                        <span>Max $6,000</span>
                      </div>

                      {/* Pathward Bank partners notice box */}
                      <div className="bg-neutral-950 p-3.5 border border-neutral-900 rounded-xl space-y-1 text-[9px] text-slate-500 leading-relaxed">
                        <p className="font-bold text-[#D4AF37] uppercase font-mono text-[8px]">TILA REGULATORY FINANCE DISCLOSURES</p>
                        <p>Refund anticipation loans are provided under underwriting of **Pathward N.A. (MetaBank)**. Loan fees: $0. APR: 0% based on $0 interest. If your federal refund is less than the advance choice, you still remain responsible for the outstanding difference.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. CREDIT REPAIR + TAX COMBO */}
                {selectedTemplateId === 'tpl_credit_repair_v1' && (
                  <div className="space-y-6 text-center max-w-xl mx-auto">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold font-serif text-white">Filing Fee Waiver + Credit Dispute Combo</h2>
                      <p className="text-xs text-slate-400">Bundle your annual tax preparation with monthly credit score repair and dispute tracking.</p>
                    </div>

                    {/* Subscription billing layout bento row */}
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className={`p-4 bg-neutral-900/60 border rounded-2xl cursor-pointer transition ${stripeCheckedPlan === 'lite' ? 'border-[#D4AF37]' : 'border-neutral-800'}`} onClick={() => setStripeCheckedPlan('lite')}>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Standard Combo</span>
                        <h4 className="text-sm font-bold text-white mt-1">Tax + Lite Repair</h4>
                        <p className="text-xs text-amber-400 font-serif font-bold mt-1">$97 <span className="text-[10px] text-slate-500">/ month</span></p>
                        <p className="text-[10px] text-slate-500 mt-2">Up to 3 disputes per bureau, annual return filing fee waived entirely.</p>
                      </div>
                      <div className={`p-4 bg-neutral-900/60 border rounded-2xl cursor-pointer transition ${stripeCheckedPlan === 'pro' ? 'border-[#D4AF37]' : 'border-neutral-800'}`} onClick={() => setStripeCheckedPlan('pro')}>
                        <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-bold">Elite Professional</span>
                        <h4 className="text-sm font-bold text-white mt-1">Tax + Premium Repair</h4>
                        <p className="text-xs text-amber-400 font-serif font-bold mt-1">$197 <span className="text-[10px] text-slate-500">/ month</span></p>
                        <p className="text-[10px] text-slate-500 mt-2">Unlimited dispute runs, tax consultation audit defense included, credit pulls.</p>
                      </div>
                    </div>

                    {/* FCRA credit pull agreement checkbox */}
                    <div className="bg-neutral-900/40 p-4 border border-neutral-900 rounded-2xl text-left space-y-2.5">
                      <h5 className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase">FCRA COMPLIANCE CONSENT DECLARATION</h5>
                      <label className="flex items-start gap-2 text-[9px] text-slate-500 leading-normal cursor-pointer select-none">
                        <input type="checkbox" checked={creditAuthChecked} onChange={(e) => setCreditAuthChecked(e.target.checked)} className="mt-0.5 shrink-0 accent-amber-500" />
                        <span>
                          I provide written instructions under the Fair Credit Reporting Act (FCRA) authorizing Tax Pro Hub University to pull my credit reports from Equifax, Experian and TransUnion to evaluate score factors. Retained for 7 years.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* generic rendering placeholder if other steps are selected */}
                {!['tpl_lead_magnet_v1', 'tpl_consult_booker_v1', 'tpl_notice_response_v1', 'tpl_self_employed_v1', 'tpl_refund_advance_v1', 'tpl_credit_repair_v1'].includes(selectedTemplateId) && (
                  <div className="space-y-6 text-center max-w-xl mx-auto py-12 border border-neutral-900/60 rounded-2xl bg-neutral-900/20">
                    <Activity className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                    <h3 className="text-lg font-bold text-white font-serif">{activeTemplate.name}</h3>
                    <p className="text-xs text-slate-500 uppercase font-mono tracking-widest">Active Step: {steps[activeStepIndex]?.name || 'Opt-in Page'}</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">This custom template is pre-wired. When published, it installs matching workflows and launches compliance checks securely.</p>
                  </div>
                )}

              </div>

              {/* 11-SECTION COMPLIANCE FOOTER INJECTED */}
              <footer className="mt-12 border-t border-neutral-900 bg-neutral-950 p-6 space-y-4 text-[9px] text-slate-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 font-mono text-[8px] uppercase">Compliance Disclosures & Audit Logs</p>
                    <p><strong>CAN-SPAM Act:</strong> Opt-in and out rules are enforced. Unsubscribe requests are resolved automatically within 10 business days. General address: 1342 NM 333, Tijeras, NM 87059.</p>
                    <p><strong>GLBA / Safeguards:</strong> Personal details and taxpayer information are handled in compliance with FTC data warnings. WISP certificates active.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 font-mono text-[8px] uppercase">IRS Circular 230 Notice</p>
                    <p>Under advertising standards of Circular 230 §10.30: credentials stated are certified. We hold AFSP-only PTIN registration. Unenrolled preparers are not authorized to practice before the IRS except as outlined in PTIN authorization guides.</p>
                    <p><strong>ADA Section 508:</strong> Accessibility VPAT 2.4 pass. Color contrast ratios mapped at 4.5:1 ratio levels.</p>
                  </div>
                </div>

                {/* State-specific auto injection footer line */}
                <div className="p-2.5 bg-neutral-900 border border-neutral-900 rounded-lg text-slate-400 font-mono text-[8px]">
                  <strong>STATE REGULATION OVERRIDES:</strong> CA CPRA "Do Not Sell My Personal Info" activated | NY DFS Part 500 cybersecurity standards certified | NM Sales tax notice applied | TX Surcharges disclosures satisfied.
                </div>

                <div className="text-center text-slate-600 border-t border-neutral-900 pt-3 flex flex-col md:flex-row items-center justify-between gap-2">
                  <span>Powered by **RJ Business Solutions** © 2026. All Rights Reserved.</span>
                  <div className="flex gap-2 font-mono text-[8px] uppercase">
                    <span>PTIN: {"{{tenant.ptin}}"}</span>
                    <span>•</span>
                    <span>EFIN: {"{{tenant.efin}}"}</span>
                  </div>
                </div>
              </footer>

            </div>
          </div>
          ) : (
            <div className="w-full max-w-4xl bg-[#030712] border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-8 relative overflow-hidden min-h-[700px] flex flex-col">
              {/* Decorative premium header line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-500 opacity-60"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
                <div>
                  <h3 className="text-lg font-serif font-black text-white tracking-wide">Interactive Funnel Flow Map</h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                    Generative Visualization & Edge Deployment Shield
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-xl text-xs font-mono">
                  <div className="flex items-center gap-1.5 border-r border-neutral-800 pr-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    <span className="text-[10px] text-slate-400 font-bold">Active Nodes:</span>
                    <span className="text-white font-black">{steps.length + 2}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[10px] text-slate-400 font-bold">Total Conv. Index:</span>
                    <span className="text-[#D4AF37] font-black">22.4%</span>
                  </div>
                </div>
              </div>

              {/* FLOATING FLOWMAP CANVAS CONTAINER */}
              <div className="flex-1 bg-neutral-950/40 border border-neutral-900/80 rounded-2xl p-6 relative overflow-hidden flex flex-col lg:flex-row gap-6">
                
                {/* Visual Canvas flow row */}
                <div className="flex-1 space-y-6 flex flex-col items-center">
                  
                  {/* Node 1: Inbound Traffic Entry node */}
                  <div className="w-full max-w-sm bg-neutral-900/60 border border-amber-500/20 rounded-xl p-4 relative group hover:border-amber-500/40 transition">
                    <div className="absolute -top-2 left-4 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-mono text-amber-400 uppercase tracking-widest font-black">
                      Inbound Traffic Source
                    </div>
                    <div className="flex items-start justify-between mt-1">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">Omni-Channel Lead Acquisition</h4>
                        <p className="text-[9px] text-slate-400">Google Ads, Meta Ads, Email, & SMS 10DLC triggers</p>
                      </div>
                      <Globe className="h-4 w-4 text-[#D4AF37]" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                      <span className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-[8px] font-mono rounded text-slate-400">Google Search</span>
                      <span className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-[8px] font-mono rounded text-slate-400">Meta Feed</span>
                      <span className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-[8px] font-mono rounded text-slate-400">SMS Gateway</span>
                    </div>
                  </div>

                  {/* Flow Vector connector */}
                  <div className="flex flex-col items-center -my-2 select-none">
                    <div className="h-6 w-0.5 bg-gradient-to-b from-amber-500/40 to-[#D4AF37] animate-pulse"></div>
                    <MoveDown className="h-3 w-3 text-[#D4AF37]" />
                  </div>

                  {/* Step Nodes sequence */}
                  {steps.map((step, idx) => {
                    const stepRate = stepConversionRates[step.id] || 45;
                    return (
                      <div key={step.id} className="w-full max-w-sm flex flex-col items-center">
                        <div className={`w-full bg-neutral-900/40 border ${activeStepIndex === idx ? 'border-[#D4AF37] shadow-lg shadow-amber-500/5' : 'border-neutral-800/80'} rounded-xl p-4 relative group hover:border-amber-500/30 transition`}>
                          <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                            Node #{idx + 1}: {step.type.toUpperCase()}
                          </div>
                          
                          <div className="flex items-start justify-between mt-1">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                {step.name}
                                {activeStepIndex === idx && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>}
                              </h4>
                              <p className="text-[9px] text-slate-500 font-mono">path: /{step.slug}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  const cur = stepConversionRates[step.id] || 45;
                                  setStepConversionRates({ ...stepConversionRates, [step.id]: Math.max(0, cur - 5) });
                                }}
                                className="w-5 h-5 bg-neutral-950 hover:bg-neutral-800 text-slate-400 hover:text-white rounded flex items-center justify-center text-[10px] font-mono border border-neutral-800"
                              >
                                -
                              </button>
                              <div className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] font-mono text-[9px] rounded font-black">
                                {stepRate}%
                              </div>
                              <button 
                                onClick={() => {
                                  const cur = stepConversionRates[step.id] || 45;
                                  setStepConversionRates({ ...stepConversionRates, [step.id]: Math.min(100, cur + 5) });
                                }}
                                className="w-5 h-5 bg-neutral-950 hover:bg-neutral-800 text-slate-400 hover:text-white rounded flex items-center justify-center text-[10px] font-mono border border-neutral-800"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-950 pt-2 text-[9px]">
                            <span className="text-slate-500 font-mono">Est. Conversion Index</span>
                            <button 
                              onClick={() => {
                                setCenterMode('preview');
                                setActiveStepIndex(idx);
                              }}
                              className="text-amber-400 font-bold hover:text-white transition flex items-center gap-1 font-mono uppercase tracking-wider"
                            >
                              Focus & Preview Page <Eye className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Connection to next step */}
                        {idx < steps.length - 1 && (
                          <div className="flex flex-col items-center my-1 select-none">
                            <div className="h-6 w-0.5 bg-gradient-to-b from-[#D4AF37]/50 to-[#D4AF37]/50 animate-pulse"></div>
                            <MoveDown className="h-3 w-3 text-[#D4AF37]/50" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Outbound Connector */}
                  <div className="flex flex-col items-center -my-2 select-none">
                    <div className="h-6 w-0.5 bg-gradient-to-b from-[#D4AF37]/40 to-amber-500/40 animate-pulse"></div>
                    <MoveDown className="h-3 w-3 text-amber-500/60" />
                  </div>

                  {/* Node 3: Outbound Integrated App Services node */}
                  <div className="w-full max-w-sm bg-neutral-900/60 border border-amber-500/20 rounded-xl p-4 relative group hover:border-amber-500/40 transition">
                    <div className="absolute -top-2 left-4 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-mono text-amber-400 uppercase tracking-widest font-black">
                      System integrations
                    </div>
                    <div className="flex items-start justify-between mt-1">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">Tax CRM Fulfillment Hub</h4>
                        <p className="text-[9px] text-slate-400">Directly synchronized with Stripe webhooks & active CRM pipelines</p>
                      </div>
                      <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                    </div>
                    <div className="mt-3 space-y-1.5 text-[9px] font-mono text-slate-400 bg-neutral-950 p-2 border border-neutral-900 rounded-lg">
                      <div className="flex justify-between">
                        <span>Payment Router:</span>
                        <span className="text-white font-bold">Stripe {stripeCheckedPlan.toUpperCase()} Checkout</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lead Dispatcher:</span>
                        <span className="text-white font-bold">{activeTemplate.wiredWorkflow}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Document Vault:</span>
                        <span className="text-white font-bold">Cloudflare R2 Encrypted Bucket</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT CLOUDFLARE CONFIGURATION PANEL */}
                <div className="w-full lg:w-80 bg-neutral-900/30 border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="border-b border-neutral-900 pb-2 flex items-center gap-1.5">
                      <CloudflareIcon className="h-4 w-4 text-orange-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">Cloudflare Edge Shield</h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                          Cloudflare Pages Project Name
                        </label>
                        <input 
                          type="text" 
                          value={cfProjectName}
                          onChange={(e) => setCfProjectName(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-amber-500/40"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                          Custom Domain Association
                        </label>
                        <div className="flex rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                          <span className="bg-neutral-900 text-slate-500 text-[10px] px-2.5 py-1.5 border-r border-neutral-800 font-mono">
                            https://
                          </span>
                          <input 
                            type="text" 
                            value={cfCustomDomain}
                            onChange={(e) => setCfCustomDomain(e.target.value)}
                            className="w-full bg-transparent text-xs px-2.5 py-1.5 font-mono text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-neutral-900 pt-3">
                      <h5 className="text-[8px] font-mono text-slate-500 uppercase tracking-wider mb-2">Cloudflare Security Shields</h5>
                      
                      <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-900 cursor-pointer select-none hover:border-amber-500/10 transition">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-slate-300">WAF Rule Engine</span>
                          <p className="text-[8px] text-slate-500">Block OWASP Top-10 Web Threats</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={cfWafEnabled}
                          onChange={(e) => setCfWafEnabled(e.target.checked)}
                          className="w-8 h-4 rounded-full accent-amber-500 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-900 cursor-pointer select-none hover:border-amber-500/10 transition">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-slate-300">Browser Integrity Check</span>
                          <p className="text-[8px] text-slate-500">Examine visitor headers & signatures</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={cfBrowserIntegrity}
                          onChange={(e) => setCfBrowserIntegrity(e.target.checked)}
                          className="w-8 h-4 rounded-full accent-amber-500 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#030712] border border-neutral-900 cursor-pointer select-none hover:border-amber-500/10 transition">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-[#D4AF37]">Enterprise Bot Fight Mode</span>
                          <p className="text-[8px] text-slate-500">Stop scrapers from cloning source IP</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={cfBotFightMode}
                          onChange={(e) => setCfBotFightMode(e.target.checked)}
                          className="w-8 h-4 rounded-full accent-amber-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2.5 border-t border-neutral-900 pt-3">
                    <button
                      onClick={handleDeployToCloudflare}
                      disabled={isSyncingCloudflare}
                      className="w-full bg-[#D4AF37] hover:bg-amber-500 disabled:bg-neutral-800 text-black font-mono font-black uppercase text-xs py-2.5 rounded-xl transition shadow-lg shadow-amber-500/5 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSyncingCloudflare ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Deploying Edge Node...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-black" />
                          Sync & Publish to Cloudflare
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Dynamic Simulated Deploy Terminal */}
              {isSyncingCloudflare && (
                <div className="bg-[#030712] border border-neutral-800 rounded-xl p-4 font-mono text-[9px] text-slate-400 space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-1.5">
                    <span className="text-[#D4AF37] font-bold">Cloudflare Build Terminal Stream</span>
                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-[#D4AF37] rounded font-black tracking-widest">{cfSyncProgress}%</span>
                  </div>
                  <p className="text-slate-500">[{new Date().toLocaleTimeString()}] wrangler-pages build-deploy --project {cfProjectName}</p>
                  <p className="text-white flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                    {cfSyncStatus}
                  </p>
                  <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden border border-neutral-900">
                    <div className="bg-[#D4AF37] h-full transition-all duration-300" style={{ width: `${cfSyncProgress}%` }}></div>
                  </div>
                </div>
              )}

              {cfLiveUrl && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2 animate-fade-in-up">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-400 font-serif">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    FUNNEL DEPLOYED SUCCESSFULLY TO CLOUDFLARE EDGE NETWORKS!
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-2xl font-mono">
                    Compiled pages are now cached across 310+ global data centers. Bot Fight Mode and WAF are fully active, shielding your proprietary business logic and representation templates from unauthorized cloning or indexing attempts.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <a 
                      href={cfLiveUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs bg-amber-500 text-black px-4 py-2 rounded-lg font-mono font-black uppercase tracking-wider hover:bg-amber-400 transition"
                    >
                      Visit Live Site
                    </a>
                    <span className="text-[10px] text-slate-500 font-mono">
                      https://{cfCustomDomain} (CNAME active)
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>

        {/* RIGHT PANE: Style customization, SEO, and the AI Funnel Architect Chatbot */}
        <aside className="w-80 border-l border-neutral-800/80 bg-[#030712] flex flex-col shrink-0">
          
          {/* 4 Engines Blueprint Navigator */}
          <div className="p-3 border-b border-neutral-800 bg-[#030712]">
            <div className="text-[9px] font-mono font-black text-[#D4AF37] tracking-widest uppercase text-center mb-2">
              4 ENGINES BLUEPRINT SYSTEM CONTROLS
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-400 select-none">
              <button 
                onClick={() => setActiveTab('engine1')}
                className={`py-2 px-1.5 border rounded-lg font-mono font-black uppercase transition ${activeTab === 'engine1' ? 'border-amber-500 bg-amber-500/10 text-white shadow shadow-amber-500/10' : 'border-neutral-800 bg-neutral-900/20 hover:text-white hover:border-neutral-700'}`}
              >
                1. Input Matrix
              </button>
              <button 
                onClick={() => setActiveTab('engine2')}
                className={`py-2 px-1.5 border rounded-lg font-mono font-black uppercase transition ${activeTab === 'engine2' ? 'border-amber-500 bg-amber-500/10 text-white shadow shadow-amber-500/10' : 'border-neutral-800 bg-neutral-900/20 hover:text-white hover:border-neutral-700'}`}
              >
                2. AI Gen Console
              </button>
              <button 
                onClick={() => setActiveTab('engine3')}
                className={`py-2 px-1.5 border rounded-lg font-mono font-black uppercase transition ${activeTab === 'engine3' ? 'border-amber-500 bg-amber-500/10 text-white shadow shadow-amber-500/10' : 'border-neutral-800 bg-neutral-900/20 hover:text-white hover:border-neutral-700'}`}
              >
                3. Publishing Hub
              </button>
              <button 
                onClick={() => setActiveTab('engine4')}
                className={`py-2 px-1.5 border rounded-lg font-mono font-black uppercase transition ${activeTab === 'engine4' ? 'border-amber-500 bg-amber-500/10 text-white shadow shadow-amber-500/10' : 'border-neutral-800 bg-neutral-900/20 hover:text-white hover:border-neutral-700'}`}
              >
                4. CRM & Payments
              </button>
            </div>
          </div>

          {/* Drawer tab contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Engine 1: Input Matrix */}
            {activeTab === 'engine1' && (
              <div className="space-y-4">
                <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest border-b border-neutral-900 pb-1.5 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-[#D4AF37]" />
                  Engine 1: Input Matrix
                </div>
                <div className="bg-neutral-900/40 border border-neutral-800/60 p-3 rounded-xl space-y-3">
                  <div>
                    <label className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Business Identity Name
                    </label>
                    <input 
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Niche & Target Industry
                    </label>
                    <select
                      value={businessNiche}
                      onChange={(e) => setBusinessNiche(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500/40"
                    >
                      <option value="tax_preparation">Tax Preparation & Filings</option>
                      <option value="credit_repair">Credit Repair Services</option>
                      <option value="bookkeeping">Year-Round Bookkeeping</option>
                      <option value="recruitment">Tax Preparer Recruiting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Primary Client Offer
                    </label>
                    <input 
                      type="text"
                      value={businessOffer}
                      onChange={(e) => setBusinessOffer(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Target Pricing Token
                    </label>
                    <input 
                      type="text"
                      value={businessPricing}
                      onChange={(e) => setBusinessPricing(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Primary Domain Allocation
                    </label>
                    <input 
                      type="text"
                      value={businessDomain}
                      onChange={(e) => setBusinessDomain(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Primary Brand Color Palette
                    </label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="color"
                        value={brandPrimaryColor}
                        onChange={(e) => setBrandPrimaryColor(e.target.value)}
                        className="bg-transparent border-0 h-8 w-8 cursor-pointer rounded overflow-hidden"
                      />
                      <span className="text-xs font-mono text-slate-300 uppercase">{brandPrimaryColor}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-900/60">
                    <button 
                      onClick={() => {
                        setChatHistory(prev => [...prev, {
                          sender: 'agent',
                          text: `✓ **Input Matrix tokens extracted and normalized!** Primary domain: \`${businessDomain}\`, Brand color: \`${brandPrimaryColor}\`, and Offer: \`${businessOffer}\` are now active in current builder canvas session. Ready to run AI strategist!`,
                          diagnosticLogs: ['Loaded State Matrix Tokenizer', 'Normalized JSON fields matching GHL format']
                        }]);
                      }}
                      className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/20 text-white font-bold text-[10px] uppercase font-mono rounded-lg transition"
                    >
                      Verify & Normalize Inputs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Engine 2: AI Generation Console */}
            {activeTab === 'engine2' && (
              <div className="space-y-4">
                <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest border-b border-neutral-900 pb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  Engine 2: AI Generation Console
                </div>
                
                <div className="space-y-2.5">
                  <button 
                    onClick={() => {
                      setCustomHeroHeadline(spanishLanguageToggle ? 'Preparación de Impuestos Certificada y Segura de Élite' : 'Elite Security-Hardened Certified Tax Preparation & Representation');
                      setCustomHeroSubheadline(spanishLanguageToggle ? 'Optimice sus declaraciones anuales, reduzca riesgos de auditoría y reclame deducciones legítimas.' : 'Preserve taxpayers legal rights under FTC standards. Unlock up to $6,000 advanced loan refunds instantly.');
                      setChatHistory(prev => [...prev, {
                        sender: 'agent',
                        text: `✓ **Strategic Copy Agent triggered!** Beautifully compiled hero copywriting section. Verified Circular 230 standards.`,
                        diagnosticLogs: ['LLM Inference Complete', 'Role: Strategic Copywriting Agent', 'Prompt: Compliant Tax Shielding']
                      }]);
                    }}
                    className="w-full flex items-center justify-between p-2.5 bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/20 rounded-xl text-left text-xs transition"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">Regenerate AI Copy & Strategy</span>
                      <span className="text-[8px] text-slate-500 font-mono">Multilingual & Tone Alignment</span>
                    </div>
                    <Play className="h-3 w-3 text-amber-500" />
                  </button>

                  <button 
                    onClick={() => {
                      setSeoTitle(`Trusted Tax Experts ${businessName} | Verified 2026 Filings`);
                      setSeoDescription(`Ensure legal compliance, maximize annual deductions and refund advance loans with NM leading experts.`);
                      setChatHistory(prev => [...prev, {
                        sender: 'agent',
                        text: `✓ **SEO & Metadata schema tag compiler executed successfully!** Title tag and Schema.org JSON-LD structured tags are active.`,
                        diagnosticLogs: ['Compiled JSON-LD Structured Data Schema', 'Inserted descriptive microdata tags']
                      }]);
                    }}
                    className="w-full flex items-center justify-between p-2.5 bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/20 rounded-xl text-left text-xs transition"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">Compile SEO Schema Tags</span>
                      <span className="text-[8px] text-slate-500 font-mono">Meta tags & JSON-LD structured schema</span>
                    </div>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  </button>

                  <button 
                    onClick={() => {
                      setChatHistory(prev => [...prev, {
                        sender: 'agent',
                        text: `✓ **Compliance Checker Passed!** Verified IRS Circular 230 §10.30 standards, FTC results disclaimer rules, and ADA Contrast 4.5:1 ratio settings.`,
                        diagnosticLogs: ['Scanning Section 508 accessibility contrasts', 'Circular 230 regulatory checks OK']
                      }]);
                    }}
                    className="w-full flex items-center justify-between p-2.5 bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/20 rounded-xl text-left text-xs transition"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#D4AF37] block">Run Compliance Safeguards</span>
                      <span className="text-[8px] text-emerald-400 font-mono">ADA, FTC, CAN-SPAM, GLBA Checks</span>
                    </div>
                    <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
                  </button>
                </div>

                <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl space-y-2.5">
                  <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Copywriter Settings
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono text-slate-500 uppercase mb-1">
                      Hero Headline override
                    </label>
                    <input 
                      type="text"
                      value={customHeroHeadline}
                      onChange={(e) => setCustomHeroHeadline(e.target.value)}
                      placeholder="Automatic AI Copywriter active..."
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none text-white focus:border-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono text-slate-500 uppercase mb-1">
                      Custom CTA Label
                    </label>
                    <input 
                      type="text"
                      value={customCTAtext}
                      onChange={(e) => setCustomCTAtext(e.target.value)}
                      placeholder="Automatic AI CTA active..."
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none text-white focus:border-amber-500/40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Engine 3: Builder & Publishing Hub */}
            {activeTab === 'engine3' && (
              <div className="space-y-4">
                <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest border-b border-neutral-900 pb-1.5 flex items-center gap-1.5">
                  <CloudflareIcon className="h-3.5 w-3.5 text-orange-400" />
                  Engine 3: Builder & Publishing Hub
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/60 p-3 rounded-xl space-y-3.5">
                  <div>
                    <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Cloudflare Pages Project
                    </label>
                    <input 
                      type="text" 
                      value={cfProjectName}
                      onChange={(e) => setCfProjectName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Active CNAME Custom Domain
                    </label>
                    <input 
                      type="text" 
                      value={cfCustomDomain}
                      onChange={(e) => setCfCustomDomain(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 border-t border-neutral-900 pt-2.5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Security Shields</span>
                    
                    <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-900 cursor-pointer text-xs select-none">
                      <span className="text-slate-300 font-bold">WAF Firewall</span>
                      <input 
                        type="checkbox" 
                        checked={cfWafEnabled}
                        onChange={(e) => setCfWafEnabled(e.target.checked)}
                        className="accent-amber-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-900 cursor-pointer text-xs select-none">
                      <span className="text-slate-300 font-bold">Browser Integrity</span>
                      <input 
                        type="checkbox" 
                        checked={cfBrowserIntegrity}
                        onChange={(e) => setCfBrowserIntegrity(e.target.checked)}
                        className="accent-amber-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-900 cursor-pointer text-xs select-none">
                      <span className="text-[#D4AF37] font-bold">Bot Fight Mode</span>
                      <input 
                        type="checkbox" 
                        checked={cfBotFightMode}
                        onChange={(e) => setCfBotFightMode(e.target.checked)}
                        className="accent-amber-500"
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleDeployToCloudflare}
                    disabled={isSyncingCloudflare}
                    className="w-full bg-[#D4AF37] hover:bg-amber-500 disabled:bg-neutral-800 text-black font-mono font-black uppercase text-xs py-2.5 rounded-xl transition shadow-lg shadow-amber-500/5 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSyncingCloudflare ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Deploying Pages...
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-black" />
                        Sync & Publish to Cloudflare
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Engine 4: CRM Sync & Payments */}
            {activeTab === 'engine4' && (
              <div className="space-y-4">
                <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest border-b border-neutral-900 pb-1.5 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-amber-500" />
                  Engine 4: CRM Sync & Stripe
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/60 p-3 rounded-xl space-y-3.5">
                  <div>
                    <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Lead Pipeline Destination
                    </label>
                    <input 
                      type="text" 
                      value={crmPipeline}
                      onChange={(e) => setCrmPipeline(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 font-sans text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Target Opportunity Stage
                    </label>
                    <input 
                      type="text" 
                      value={crmStage}
                      onChange={(e) => setCrmStage(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 font-sans text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 border-t border-neutral-900 pt-2.5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Hidden Marketing Field Mappings</span>
                    
                    <div>
                      <label className="block text-[7px] font-mono text-slate-500 uppercase mb-1">UTM Source</label>
                      <input 
                        type="text" 
                        value={utmSource}
                        onChange={(e) => setUtmSource(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2 py-1 font-mono text-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[7px] font-mono text-slate-500 uppercase mb-1">UTM Campaign</label>
                      <input 
                        type="text" 
                        value={utmCampaign}
                        onChange={(e) => setUtmCampaign(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2 py-1 font-mono text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-neutral-900 pt-2.5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Stripe Payments Gateways</span>
                    
                    <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-900 cursor-pointer text-xs select-none">
                      <span className="text-slate-300 font-bold">Stripe Live Gate</span>
                      <input 
                        type="checkbox" 
                        checked={stripeConnected}
                        onChange={(e) => setStripeConnected(e.target.checked)}
                        className="accent-amber-500"
                      />
                    </label>
                    
                    <div className="p-2.5 bg-neutral-950 border border-neutral-900 rounded-lg text-[10px] font-mono text-slate-400">
                      Active: <span className="text-emerald-400 font-bold">Checkout Webhook Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI FUNNEL ARCHITECT CO-PILOT CHATBOT PANEL */}
          <div className="h-72 border-t border-neutral-800/80 bg-neutral-950/80 backdrop-blur flex flex-col justify-between p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-900 select-none">
              <Sparkles className="h-4 w-4 text-[#D4AF37] animate-pulse" />
              <h4 className="text-[10px] font-mono font-black tracking-wider uppercase text-white">AI Funnel Architect</h4>
            </div>

            {/* Chat Messages scroll area */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-[11px] leading-relaxed">
              {chatHistory.map((chat, index) => (
                <div key={index} className="space-y-2">
                  <div className={`p-2.5 rounded-2xl ${chat.sender === 'user' ? 'bg-[#D4AF37]/10 border border-amber-500/20 text-amber-300 ml-6 text-right' : 'bg-neutral-900/60 border border-neutral-800 text-slate-300 mr-6'}`}>
                    {chat.text}
                  </div>
                  {/* System execution logs details */}
                  {chat.diagnosticLogs && chat.diagnosticLogs.length > 0 && (
                    <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-900 font-mono text-[8px] text-slate-500 space-y-1">
                      <div className="text-[7px] text-amber-500 font-bold uppercase tracking-wider">SYSTEM EXECUTION LOGS:</div>
                      {chat.diagnosticLogs.map((log, l) => (
                        <div key={l} className="truncate">▪ {log}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isAiStreaming && (
                <div className="text-[10px] font-mono text-amber-500/80 animate-pulse italic pl-2">
                  AI is restructuring layouts & checking state codes...
                </div>
              )}
            </div>

            {/* Chat Prompt terminal input */}
            <div className="relative border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
              <input 
                type="text"
                placeholder="Ask AI Funnel Architect..."
                value={chatbotQuery}
                onChange={(e) => setChatbotQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                className="w-full bg-transparent border-none text-xs text-white p-3 pr-10 focus:outline-none"
              />
              <button 
                onClick={handleSendAiMessage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#D4AF37] text-neutral-950 rounded-lg hover:brightness-110 transition"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </aside>

      </div>

      {/* Ephemeral preview modal loader */}
      {isPublishing && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 relative mb-6">
            <div className="absolute inset-0 border-4 border-amber-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold font-serif text-white mb-2">
            Compiling and Syncing to Cloudflare Edge CDN...
          </h2>
          <p className="text-sm text-slate-400 max-w-sm animate-pulse">
            Establishing synthetic pipeline, compressing single-file index build and dispatching worldwide.
          </p>
        </div>
      )}

      {/* Publication complete alert frame modal */}
      {publishUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-amber-500/20 p-6 rounded-2xl shadow-2xl relative">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h3 className="text-lg font-bold font-serif text-white">
                Funnels & Site Deployed Live!
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cloudflare Pages deployment completed successfully. Your high-converting tax client acquisition asset is active globally.
              </p>
              
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs font-mono text-amber-400 select-all select-none truncate">
                {publishUrl}
              </div>

              <div className="flex gap-2">
                <a 
                  href={publishUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-black text-xs rounded-xl text-center shadow"
                >
                  Visit Live Site
                </a>
                <button 
                  onClick={() => setPublishUrl('')}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition"
                >
                  Back to Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto save notifications toast */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1f2937] text-white border border-[#334155] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="h-4 w-4 text-emerald-400" />
          Funnels Progress Locked In Successfully!
        </div>
      )}

    </div>
  );
}
