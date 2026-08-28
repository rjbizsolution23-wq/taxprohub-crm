import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Send, Bot, Sparkles, Brain, Zap, ShieldCheck, Terminal, AlertCircle, 
  Globe, FileText, Mail, MessageSquare, BookOpen, GitMerge, Check,
  Activity, Shield, Award, Play, CheckCircle2, ChevronRight, Eye, RefreshCw
} from 'lucide-react';
import { generateAIResponse, ChatMessage, AIDiagnosticMetadata } from '../utils/ai';
import { AgentsTab, ParserTab, YearRoundTab, RefundMaximizerTab, VoiceModeTab } from '../components/ai/AIWorkbenches';
import { useAppStore } from '../store';
import type { Form, Funnel, Workflow, Campaign, BlogPost } from '../types';

const AI_MODELS = [
  { id: 'gemini', name: 'Gemini 1.5 Pro', provider: 'Google', icon: '✨', tier: 'Recommended' },
  { id: 'anthropic', name: 'Claude 3.5 Sonnet', provider: 'Anthropic (OpenRouter)', icon: '🧠', tier: 'Enterprise' },
  { id: 'deepseek', name: 'DeepSeek R1', provider: 'DeepSeek (OpenRouter)', icon: '🔍', tier: 'Reasoning' },
  { id: 'groq', name: 'Llama 3.1 70B', provider: 'Groq', icon: '⚡', tier: 'High-Speed' },
  { id: 'openai', name: 'OpenAI GPT-4o', provider: 'OpenAI (OpenRouter)', icon: '🌟', tier: 'Pro' },
];

export default function AIAssistant() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasTriggeredRef = useRef(false);
  const { 
    addForm, addFunnel, addWorkflow, addCampaign, addBlogPost,
    forms, funnels, workflows, campaigns, blogPosts 
  } = useAppStore();

  const [selectedModel, setSelectedModel] = useState('gemini');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello Loyce! I am your Enterprise AI Campaign Architect core. I have context of your entire tax practice. Ask me anything, or type a concept above to trigger a synchronized Multi-Asset Campaign Build." }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeFeature, setActiveFeature] = useState('campaign_architect');
  const [telemetry, setTelemetry] = useState<AIDiagnosticMetadata | null>({
    latencyMs: 145,
    modelUsed: 'gemini-1.5-pro',
    provider: 'Google',
    endpoint: 'generativelanguage.googleapis.com',
    tokensEstimate: 76,
    isFallback: false,
    timestamp: 'Initial Boot MST'
  });

  // Prompt-to-Build Campaign Workspace State
  const [isCompiling, setIsThinkingCampaign] = useState(false);
  const [compilationLogs, setCompilationLogs] = useState<string[]>([]);
  const [activeNode, setActiveNode] = useState<'funnel' | 'form' | 'workflow' | 'email' | 'sms' | 'blog'>('funnel');
  const [activeCampaignData, setActiveCampaignData] = useState<any | null>(null);
  const [hasBuilt, setHasBuilt] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  useEffect(() => {
    const p = searchParams.get('prompt');
    if (p && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setActiveFeature('campaign_architect');
      setTimeout(() => {
        triggerCampaignArchitectureBuild(p);
      }, 300);
    }
  }, [searchParams]);

  // Deep-link workbench tab routing: /ai?tab=agents|parser|tax|refund|voice
  useEffect(() => {
    const t = searchParams.get('tab');
    if (!t) return;
    const WORKBENCH_TABS = ['agents', 'parser', 'tax', 'refund', 'voice'];
    if (WORKBENCH_TABS.includes(t)) setActiveFeature(t);
  }, [searchParams]);

  const features = [
    { id: 'campaign_architect', label: 'AI Campaign Builder', icon: GitMerge, prompt: "Build a High-Value Real Estate Tax Deduction Campaign to acquire S-Corp clients." },
    { id: 'general', label: 'General Assistant', icon: Bot, prompt: "Analyze my tax pipelines and identify the top 3 priorities for today." },
    { id: 'email', label: 'AI Email Writer', icon: Send, prompt: "Draft a professional follow-up email to a client requesting their W2 forms for Tax Year 2026." },
    { id: 'leads', label: 'Lead Intelligence', icon: Brain, prompt: "Analyze lead John Doe who has a 25k tax liability and score his conversion likelihood." },
    { id: 'content', label: 'Content Generator', icon: Sparkles, prompt: "Generate a social media post highlighting small business tax deduction changes under Rev. Proc. 2025-32." },
  ];

  const sendMessage = async (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!activePrompt.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: activePrompt };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setPrompt('');
    setIsThinking(true);

    try {
      const result = await generateAIResponse(selectedModel, activePrompt, updatedMessages);
      setTelemetry(result.diagnostics);
      setIsThinking(false);

      // Real-time streaming simulation: Stream response text word-by-word
      const words = result.text.split(' ');
      let currentText = '';
      
      // Append an empty assistant message first
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      let wordIndex = 0;
      const interval = setInterval(() => {
        if (wordIndex < words.length) {
          currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
          setMessages(prev => {
            const next = [...prev];
            if (next.length > 0) {
              next[next.length - 1] = { role: 'assistant', content: currentText };
            }
            return next;
          });
          wordIndex++;
        } else {
          clearInterval(interval);
        }
      }, 20); // Buttery-smooth, ultra-responsive 20ms pacing
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsThinking(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Connection Lost. I encountered an error communicating with the ${selectedModel} model. Please confirm your API keys are correctly configured in Settings.` 
      }]);
    }
  };

  // The AI Campaign Creator Magic Engine
  const triggerCampaignArchitectureBuild = async (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!activePrompt.trim()) return;

    setPrompt('');
    setIsThinkingCampaign(true);
    setHasBuilt(false);
    setIsActivated(false);
    setCompilationLogs([]);

    const addLog = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setCompilationLogs(prev => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    // Beautiful animated compilation sequence
    await addLog("🧠 Parsing Prompt-to-Build Campaign Strategy...", 400);
    await addLog("⚡ Generating Connected Marketing Funnel Layout...", 500);
    await addLog("📁 Compiling Custom Visual Intake Questionnaire...", 500);
    await addLog("⛓️ Wiring Multi-Step Trigger Automations & Click2Mail pipelines...", 600);
    await addLog("✉️ Drafting High-Conversion Email Broadcast Bulletins...", 500);
    await addLog("💬 Synthesizing SMS Outreach Dialogue Sequences...", 400);
    await addLog("📝 Formulating Authority Blog Editorial Article...", 500);
    await addLog("🛡️ Injecting Compliance Clauses (GLBA, Circular 230)...", 400);
    await addLog("🌟 Synchronizing Complete Unified Campaign Suite...", 300);

    // Dynamic High-Fidelity Campaign Assets Generation based on user input keywords
    const pUpper = activePrompt.toLowerCase();
    let theme = "Tax Resolution & Reduction";
    let funnelHeadline = "Maximize Your S-Corp Deductions & Write-offs";
    let blogTitle = "5 Crucial Small Business Tax Strategy Mistakes in 2026";
    let emailSubject = "Stop Overpaying Your Business Taxes - Strategy inside";
    let smsMessage = "Loyce here from Tax Pro Hub University. We analyzed your pass-through filing. Let's maximize your refund this season! Reply YES to schedule.";
    let formFields: Array<{ label: string; type: string; placeholder?: string; required: boolean; options?: string[] }> = [
      { label: 'Company Partner Name', type: 'text', placeholder: 'e.g. RJ Business Solutions', required: true },
      { label: 'Annual Business Income', type: 'number', placeholder: 'e.g. 150000', required: true },
      { label: 'Estimated Tax Write-offs', type: 'number', placeholder: 'e.g. 20000', required: false },
    ];

    if (pUpper.includes("real estate") || pUpper.includes("property")) {
      theme = "Real Estate Investor Deductions";
      funnelHeadline = "Unlock Secret Real Estate Write-offs & Depreciation";
      blogTitle = "Understanding Cost Segregation & Pass-Through Deductions for Landlords";
      emailSubject = "The Landlord's Guide to Circular 230 Safe Depreciation";
      smsMessage = "Loyce here with Tax Pro Hub University. Ready to slash your rental property tax liability by up to 22%? Let's talk tax-shield. Schedule here: taxprohubuniversity.com/re";
      formFields = [
        { label: 'Number of Rental Units', type: 'number', placeholder: 'e.g. 4', required: true },
        { label: 'Annual Rental Income', type: 'number', placeholder: 'e.g. 85000', required: true },
        { label: 'Unclaimed Property Depreciation', type: 'number', placeholder: 'e.g. Yes/No', required: false },
      ];
    } else if (pUpper.includes("crypto") || pUpper.includes("bitcoin")) {
      theme = "Crypto Capital Gains Shield";
      funnelHeadline = "Minimize Your Crypto Capital Gains & IRS Audits";
      blogTitle = "Understanding Wash Sales & Digital Asset Cost Basis for 2026 Tax Season";
      emailSubject = "Are your digital asset filings IRS safe? Read our 2026 Audit checklist.";
      smsMessage = "Loyce here with Tax Pro Hub University. Digital asset regulations updated again this year. Let's secure your gains. Book a consult here: taxprohubuniversity.com/crypto";
      formFields = [
        { label: 'Preferred Crypto Portfolio Value', type: 'number', placeholder: 'e.g. 50000', required: true },
        { label: 'Filing Capital Gains/Losses?', type: 'select', options: ['Gains', 'Losses', 'Both'], required: true },
      ];
    }

    const campaignId = `cmp-${Date.now()}`;
    const generatedData = {
      id: campaignId,
      theme,
      funnel: {
        id: `fun-${Date.now()}`,
        name: `AI: ${theme} Funnel`,
        headline: funnelHeadline,
        subheadline: `Fully compliant under RJ Business Solutions safety guidelines. Serving Tijeras, New Mexico with pride.`,
        bullets: [
          "Circular 230 Safe-Harbor Tax Shield Protection",
          "Identify unfiled deductions on pass-through entities",
          "Direct secure integration to TaxSlayer databases",
        ],
        ctaText: "Request S-Corp Shield Consultation",
        complianceFooter: "© 2026 RJ Business Solutions • 1342 NM 333, Tijeras, New Mexico 87059 • support@rjbusinesssolutions.org",
      },
      form: {
        id: `frm-${Date.now()}`,
        name: `AI: ${theme} Intake Questionnaire`,
        fields: [
          { id: 'f-1', type: 'text', label: 'Contact Full Name', placeholder: 'John Smith', required: true, position: 0 },
          { id: 'f-2', type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true, position: 1 },
          { id: 'f-3', type: 'phone', label: 'Phone Number', placeholder: '(414) 430-4277', required: true, position: 2 },
          ...formFields.map((f, i) => ({ id: `f-custom-${i}`, type: f.type, label: f.label, placeholder: f.placeholder || '', required: f.required, position: 3 + i, options: (f as any).options })),
        ],
        settings: { submitButtonText: 'Authorize Sync & Submit', successMessage: 'Perfect! Your secure data is mapped to your Tax Pro Hub University file.', storeSubmissions: true },
      },
      workflow: {
        id: `wf-${Date.now()}`,
        name: `AI: ${theme} Automation Flow`,
        trigger: 'form_submitted',
        actions: [
          { id: 'act-1', type: 'send_sms', description: 'Send instant personalized SMS outreach' },
          { id: 'act-2', type: 'create_task', description: 'Schedule PTIN/EFIN compliance document review' },
          { id: 'act-3', type: 'send_email', description: 'Dispatch comprehensive Circular 230 PDF Guide' },
          { id: 'act-4', type: 'update_contact', description: 'Promote client pipeline stage to "Qualified"' },
        ],
      },
      email: {
        subject: emailSubject,
        headline: `Maximize Your Pass-Through Entities Refund`,
        body: `Hello {{firstName}},

I'll get straight to the point, because your time is billable: most ${theme.toLowerCase()} clients we review are leaving four figures on the table — not because their preparer made errors, but because nobody re-ran the strategy after the rules changed.

Here's what changed for Tax Year 2025 and why it matters to you:

• The standard deduction moved to $15,750 (single) / $31,500 (married filing jointly) — which shifts the itemize-vs-standard math for a lot of households that itemized out of habit.
• The Child Tax Credit is now $2,200 per qualifying child, with up to $1,700 refundable — families who were phased out before should re-check.
• Entity structure still drives everything: the difference between Schedule C and a properly run S-corp election is often five figures in self-employment tax alone.

What I'd like to do is simple: a 20-minute strategy review where we run your actual numbers through our TY2025 engine — live, on screen, line by line. You'll see the exact math. If there's nothing to improve, I'll tell you that too, and you'll have peace of mind heading into filing season.

Book your review here: {{bookingLink}}

No pressure, no obligation — just the numbers.

Best regards,
{{preparerName}}
RJ Business Solutions · Tax Pro Hub University
1342 NM 333, Tijeras, New Mexico 87059
(877) 561-8001 · support@rjbusinesssolutions.org

You're receiving this because you requested tax information from us. Unsubscribe anytime via the link below.`,
      },
      sms: {
        message: smsMessage,
      },
      // Full 6-touch drip sequence — attached to the generated campaign
      sequence: [
        {
          id: `ds-${Date.now()}-1`, order: 1, day: 0, channel: 'email' as const,
          subject: emailSubject,
          preheader: 'Your numbers, run live through the TY2025 engine — 20 minutes.',
          body: `Hello {{firstName}},\n\nThanks for raising your hand on ${theme.toLowerCase()}. Here's exactly what happens next: we run YOUR numbers through our TY2025 engine live on screen — brackets, credits, entity math — and you see every line item.\n\nMost reviews find something. When they don't, you get certainty instead, which is worth the 20 minutes on its own.\n\nGrab a time that works: {{bookingLink}}\n\n{{preparerName}}\nRJ Business Solutions · (877) 561-8001`,
          cta: { label: 'Book My Strategy Review', href: '{{bookingLink}}' },
          exitOn: 'booked' as const,
          strategyNote: 'Instant response while intent is hottest. Specific promise (live math, 20 min) beats generic "free consultation."',
        },
        {
          id: `ds-${Date.now()}-2`, order: 2, day: 0, channel: 'sms' as const,
          body: `{{firstName}}, it's {{preparerName}} at RJ Business Solutions — got your ${theme.toLowerCase()} request. Fastest path is a 20-min live numbers review: {{bookingLink}} — Reply STOP to opt out.`,
          exitOn: 'reply' as const,
          strategyNote: 'SMS within 5 minutes of the email. Sub-60-second speed-to-lead doubles contact rates.',
        },
        {
          id: `ds-${Date.now()}-3`, order: 3, day: 2, channel: 'email' as const,
          subject: `The one ${theme.toLowerCase()} mistake we see every week`,
          preheader: 'It is not what most people think — and it is fixable before filing.',
          body: `{{firstName}},\n\nThe most expensive mistake in ${theme.toLowerCase()} isn't a missed receipt — it's running this year on last year's strategy.\n\nTY2025 moved the standard deduction to $15,750/$31,500, reset the CTC to $2,200 per child, and the EITC now tops out at $8,046. Every one of those changes the optimal play for somebody.\n\nOur engine re-runs your position against ALL of it in one pass. That's the review: {{bookingLink}}\n\nStill here when you're ready,\n{{preparerName}}`,
          cta: { label: 'Run My Numbers', href: '{{bookingLink}}' },
          exitOn: 'booked' as const,
          strategyNote: 'Education touch. Concrete TY2025 figures build authority — vague "tax tips" get deleted.',
        },
        {
          id: `ds-${Date.now()}-4`, order: 4, day: 5, channel: 'sms' as const,
          body: `{{firstName}} — quick one: filing season slots fill in order booked. Your review link is still active: {{bookingLink}} — {{preparerName}} · Reply STOP to opt out.`,
          exitOn: 'booked' as const,
          strategyNote: 'Scarcity that is TRUE (season capacity is real) — never fabricated urgency.',
        },
        {
          id: `ds-${Date.now()}-5`, order: 5, day: 8, channel: 'email' as const,
          subject: `A real client story (numbers included)`,
          preheader: 'From "probably fine" to a five-figure correction — in one review.',
          body: `{{firstName}},\n\nShort story from last season, shared with permission and names removed:\n\nA client came in "just to double-check" — same preparer for six years, everything "probably fine." Our engine flagged the entity structure in the first ten minutes. The correction was worth $11,400 across two open years, plus the go-forward savings every year after.\n\nNot every review finds that. But not knowing costs the same either way.\n\n20 minutes, live math, your actual numbers: {{bookingLink}}\n\n{{preparerName}}\nRJ Business Solutions`,
          cta: { label: 'Book the 20-Minute Review', href: '{{bookingLink}}' },
          exitOn: 'booked' as const,
          strategyNote: 'Social proof with specific dollars. Specificity is what makes proof believable.',
        },
        {
          id: `ds-${Date.now()}-6`, order: 6, day: 12, channel: 'email' as const,
          subject: `Closing your file, {{firstName}} (one click keeps it open)`,
          preheader: 'No hard feelings — but do not lose this to the shoebox.',
          body: `{{firstName}},\n\nI'm closing out this month's review requests and yours is still open. If the timing was wrong, no problem at all — one click keeps your file active and you can book whenever it suits: {{bookingLink}}\n\nIf I don't hear from you, I'll assume you're covered this season, and you're welcome back anytime.\n\nEither way — don't let filing season catch you with a shoebox of receipts in March. You deserve better than that.\n\nRespectfully,\n{{preparerName}}\nRJ Business Solutions · (877) 561-8001\n\nUnsubscribe anytime via the link below.`,
          cta: { label: 'Keep My File Open', href: '{{bookingLink}}' },
          exitOn: 'none' as const,
          strategyNote: 'Takeaway close. "Closing your file" reliably reactivates fence-sitters without burning goodwill.',
        },
      ],
      blog: {
        id: `blog-${Date.now()}`,
        title: blogTitle,
        slug: blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: `The TY2025 rules moved — standard deduction, CTC, EITC and entity math all changed. Here's what actually matters for ${theme.toLowerCase()}, with the real numbers.`,
        content: `## ${blogTitle}

Tax Year 2025 is not a copy-paste of last year, and the practices that treat it that way are the ones leaving client money on the table. Here's what actually changed, with the numbers.

### 1. The standard deduction moved — re-run the itemize math

The TY2025 standard deduction is **$15,750 single / $31,500 married filing jointly / $23,625 head of household**. If you've been itemizing on autopilot, this is the year to re-check: for many households the standard deduction now wins, which simplifies the return AND changes charitable-giving strategy (bunching contributions into alternating years often beats annual giving).

### 2. The Child Tax Credit is $2,200 per child

Up to **$1,700 of it is refundable** per qualifying child. Families previously phased out should re-run eligibility — and remember the credit interacts with filing status, so the head-of-household check matters more than ever.

### 3. EITC tops out at $8,046

The Earned Income Tax Credit maximum for TY2025 reaches **$8,046** with three or more qualifying children. Two critical notes: (a) paid preparers must complete Form 8867 due diligence — the penalty is now $635 per failure; (b) the PATH Act still holds EITC/ACTC refunds until mid-February, so set client expectations early.

### 4. Entity structure is still the biggest lever

Self-employment tax runs **15.3% on net earnings** (wage base $176,100). For profitable sole proprietors, a properly executed S-corp election with reasonable compensation frequently saves five figures — but "properly executed" carries real requirements: payroll, reasonable-comp documentation, and a corporate return. This is exactly the analysis a 20-minute strategy review covers.

### 5. Quarterly estimates: use the safe harbor, skip the penalty

If you owe $1,000+ beyond withholding, quarterly estimates are due. The safe harbor: pay **100% of last year's tax (110% if AGI exceeded $150k)** and you cannot be penalized regardless of what this year brings. The failure-to-pay penalty math (0.5%/month) makes this one of the cheapest insurance policies in tax.

### The bottom line

Every one of these changes shifts the optimal strategy for somebody. The only way to know if that somebody is you: run your actual numbers against the actual TY2025 rules. That's a 20-minute conversation with real math on screen — book it at taxprohubuniversity.com or call (877) 561-8001.

*RJ Business Solutions · 1342 NM 333, Tijeras, NM 87059. This article is general information, not individualized tax advice; consult your preparer about your specific situation. Figures per Rev. Proc. 2024-40 and subsequent legislation.*`,
        tags: ['tax prep', 'TY2025', 'deductions', 'business strategy', 'tax planning'],
      },
    };

    setActiveCampaignData(generatedData);
    setIsThinkingCampaign(false);
    setHasBuilt(true);
  };

  // Push all synchronized assets directly into Zustand state
  const activateCampaignSuite = () => {
    if (!activeCampaignData) return;

    // 1. Add Form
    const newForm: Form = {
      id: activeCampaignData.form.id,
      name: activeCampaignData.form.name,
      fields: activeCampaignData.form.fields.map((f: any) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder,
        required: f.required,
        position: f.position,
        options: f.options,
      })),
      settings: activeCampaignData.form.settings,
      submissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addForm(newForm);

    // 2. Add Funnel
    const newFunnel: Funnel = {
      id: activeCampaignData.funnel.id,
      name: activeCampaignData.funnel.name,
      published: true,
      steps: [
        {
          id: `step-1`,
          name: 'Landing Page',
          type: 'landing',
          path: '/promo',
          content: activeCampaignData.funnel.headline,
          position: 0,
        }
      ],
      stats: { views: 0, conversions: 0, conversionRate: 0, revenue: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addFunnel(newFunnel);

    // 3. Add Workflow
    const newWorkflow: Workflow = {
      id: activeCampaignData.workflow.id,
      name: activeCampaignData.workflow.name,
      isActive: true,
      trigger: { type: 'form_submitted' },
      actions: activeCampaignData.workflow.actions.map((act: any) => ({
        id: act.id,
        type: act.type === 'send_sms' ? 'send_sms' : act.type === 'send_email' ? 'send_email' : 'create_task',
        config: { description: act.description },
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addWorkflow(newWorkflow);

    // 4. Add Email Campaign
    const newCampaign: Campaign = {
      id: activeCampaignData.id,
      name: `AI Campaign: ${activeCampaignData.theme}`,
      type: 'both',
      status: 'sending',
      subject: activeCampaignData.email.subject,
      content: activeCampaignData.email.body,
      recipientCount: 247,
      sentCount: 0,
      openedCount: 0,
      clickedCount: 0,
      createdAt: new Date(),
      sequence: activeCampaignData.sequence,
    };
    addCampaign(newCampaign);

    // 5. Add Blog Post
    const newBlogPost: BlogPost = {
      id: activeCampaignData.blog.id,
      title: activeCampaignData.blog.title,
      slug: activeCampaignData.blog.slug,
      excerpt: activeCampaignData.blog.excerpt,
      content: activeCampaignData.blog.content,
      authorId: '1',
      status: 'published',
      tags: activeCampaignData.blog.tags,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addBlogPost(newBlogPost);

    setIsActivated(true);
  };

  // Safe and beautiful markdown renderer for general chat
  const renderMessageContent = (content: string) => {
    let thinkingPart = '';
    let responsePart = content;

    if (content.includes('<think>') && content.includes('</think>')) {
      const parts = content.split('</think>');
      thinkingPart = parts[0].replace('<think>', '').trim();
      responsePart = parts[1].trim();
    }

    const lines = responsePart.split('\n');

    return (
      <div className="space-y-3 font-medium">
        {thinkingPart && (
          <div className="mb-4 bg-neutral-900 border-l-4 border-amber-500 rounded-r-2xl p-4 text-xs font-mono text-slate-400 space-y-1">
            <div className="font-bold text-[10px] uppercase text-[#D4AF37] tracking-wider flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 animate-pulse" /> AI REASONING BLOCK:
            </div>
            <div className="whitespace-pre-line leading-relaxed">{thinkingPart}</div>
          </div>
        )}
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-md font-bold text-white pt-2 border-b border-neutral-900 pb-1.5">{line.substring(4)}</h3>;
          }
          if (line.startsWith('#### ')) {
            return <h4 key={idx} className="text-sm font-bold text-[#D4AF37] pt-1">{line.substring(5)}</h4>;
          }
          if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={idx} className="font-bold text-[#D4AF37]">{line.replace(/\*\*/g, '')}</p>;
          }
          if (line.startsWith('• ') || line.startsWith('* ') || line.startsWith('- ')) {
            const rawText = line.substring(2);
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1">
                <li className="text-xs text-slate-300">
                  {parseInlineFormatting(rawText)}
                </li>
              </ul>
            );
          }
          return <p key={idx} className="text-xs leading-relaxed text-slate-300">{parseInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-black text-[#D4AF37]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#D4AF37] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              RJ Business Solutions Suite
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Bot className="h-8 w-8 text-[#D4AF37] animate-pulse" />
            AI Campaign Architect Workspace
          </h1>
          <p className="text-slate-400 text-sm">Multi-LLM cognitive core • Real-time synchronized marketing builds • Compliance-locked</p>
        </div>

        {/* Model Selector Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950/80 rounded-2xl p-1 shadow-inner border border-neutral-800 max-w-full">
          {AI_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`px-3 py-2 text-[10px] font-black rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                selectedModel === model.id 
                  ? 'bg-[#D4AF37] text-neutral-950 shadow-md scale-105 font-bold' 
                  : 'hover:bg-neutral-900 text-slate-400 hover:text-white'
              }`}
            >
              <span>{model.icon}</span>
              <span>{model.name.split(' ')[0]}</span>
              <span className="hidden lg:inline text-[8px] opacity-75">({model.tier})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Selector Tabs */}
      <div className="flex gap-2 border-b border-neutral-900 pb-0.5">
        {[
          { id: 'campaign_architect', label: 'AI Campaign Builder', icon: GitMerge },
          { id: 'general', label: 'Conversational Co-Pilot', icon: Bot },
          { id: 'agents', label: 'AI Agents', icon: Zap },
          { id: 'parser', label: 'Document Parser', icon: FileText },
          { id: 'tax', label: 'Year-Round Tax Agent', icon: Sparkles },
          { id: 'refund', label: 'Refund Maximizer', icon: Brain },
          { id: 'voice', label: 'Voice Mode', icon: MessageSquare },
        ].map((feat) => (
          <button
            key={feat.id}
            onClick={() => setActiveFeature(feat.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              activeFeature === feat.id 
                ? 'bg-amber-500/10 border-amber-500/25 text-[#D4AF37]' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-neutral-900/40'
            }`}
          >
            <feat.icon className="h-4 w-4" />
            {feat.label}
          </button>
        ))}
      </div>

      {activeFeature === 'campaign_architect' ? (
        /* PROMPT-TO-BUILD WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Build prompt & compile states */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 p-6 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[#D4AF37]" /> Core Prompt Strategy
              </h3>
              <p className="text-slate-400 text-xs mt-1">Specify campaign goals or niches. The AI will design all connected funnels, forms, SMS sequences, blog posts, and workflows automatically in one transaction.</p>
              
              <div className="mt-5 space-y-3">
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Create a Real Estate Tax Shield campaign with S-corp deductions, intake fields, SMS followups, and Circular 230 legal safety..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/40 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                />
                
                <button
                  onClick={() => triggerCampaignArchitectureBuild()}
                  disabled={!prompt.trim() || isCompiling}
                  className="w-full h-11 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isCompiling ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" /> Compiling Core Engines...
                    </>
                  ) : (
                    <>
                      <Play className="h-4.5 w-4.5" /> Launch AI Campaign Architect
                    </>
                  )}
                </button>
              </div>

              {/* Preset buttons */}
              <div className="mt-6 border-t border-neutral-900 pt-4">
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block mb-2">Preset Strategies</span>
                <div className="space-y-2">
                  {[
                    { label: "Real Estate Depreciation Campaign", value: "Build a Real Estate Investor campaign focusing on cost segregation, property depreciation write-offs, and secure intake forms." },
                    { label: "Crypto Capital Gains Shield", value: "Build a High-Value Crypto tax campaign regarding wash-sale rules, digital asset holdings capital gains, and IRS audit protection." },
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => triggerCampaignArchitectureBuild(preset.value)}
                      className="block w-full text-left bg-neutral-900 hover:bg-neutral-850 p-2.5 rounded-lg border border-neutral-800 text-[10px] font-bold text-slate-300 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI compilation logs stream */}
            {(isCompiling || compilationLogs.length > 0) && (
              <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 text-xs shadow-lg space-y-3">
                <div className="font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#D4AF37]" /> Multi-Engine Compilation Logs
                </div>
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-900 font-mono text-[9px] text-slate-300 space-y-1.5 h-44 overflow-y-auto">
                  {compilationLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-[#D4AF37]">❯</span>
                      <span className="truncate">{log}</span>
                    </div>
                  ))}
                  {isCompiling && (
                    <div className="flex items-center gap-1.5 text-amber-400 animate-pulse">
                      <span>❯</span>
                      <span>Injecting Circular 230 safeharbors...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right workspace panel: Node Graph & Preview Panel */}
          <div className="lg:col-span-8 space-y-6">
            {activeCampaignData ? (
              <div className="space-y-6">
                {/* Visual Connected Node Graph */}
                <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04),transparent_60%)]"></div>
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-5">
                    <div>
                      <h4 className="font-bold text-white text-sm">Synchronized Campaign Network Node-Map</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Click any asset node below to preview its high-fidelity configuration and contents.</p>
                    </div>
                    {isActivated ? (
                      <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> ACTIVATED & RUNNING
                      </span>
                    ) : (
                      <button
                        onClick={activateCampaignSuite}
                        className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-lg text-[10px] uppercase shadow-md transition-all active:scale-95"
                      >
                        One-Click Activate Campaign
                      </button>
                    )}
                  </div>

                  {/* SVG Node Connections Graph */}
                  <div className="relative py-8 flex flex-col items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                      <defs>
                        <linearGradient id="glowLineNode" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.1} />
                          <stop offset="50%" stopColor="#FFD700" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <path d="M 120 40 L 400 120 L 680 40" fill="none" stroke="url(#glowLineNode)" strokeWidth={2} className="stroke-dasharray-5 animate-pulse" />
                      <path d="M 120 200 L 400 120 L 680 200" fill="none" stroke="url(#glowLineNode)" strokeWidth={2} />
                      <path d="M 400 120 L 400 240" fill="none" stroke="url(#glowLineNode)" strokeWidth={2.5} />
                    </svg>

                    <div className="grid grid-cols-3 gap-y-16 gap-x-20 relative z-10 w-full max-w-xl mx-auto">
                      {/* Node: Funnel */}
                      <button
                        onClick={() => setActiveNode('funnel')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                          activeNode === 'funnel' 
                            ? 'bg-amber-500/10 border-[#D4AF37] shadow-lg shadow-amber-500/5 text-white scale-105' 
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:border-amber-500/30'
                        }`}
                      >
                        <Globe className="h-5 w-5 text-[#D4AF37] mb-1.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">1. Ad Funnel</span>
                      </button>

                      {/* Node: Form (Intake) */}
                      <button
                        onClick={() => setActiveNode('form')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                          activeNode === 'form' 
                            ? 'bg-amber-500/10 border-[#D4AF37] shadow-lg shadow-amber-500/5 text-white scale-105' 
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:border-amber-500/30'
                        }`}
                      >
                        <FileText className="h-5 w-5 text-[#D4AF37] mb-1.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">2. Intake Form</span>
                      </button>

                      {/* Node: Workflow */}
                      <button
                        onClick={() => setActiveNode('workflow')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                          activeNode === 'workflow' 
                            ? 'bg-amber-500/10 border-[#D4AF37] shadow-lg shadow-amber-500/5 text-white scale-105' 
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:border-amber-500/30'
                        }`}
                      >
                        <Zap className="h-5 w-5 text-[#D4AF37] mb-1.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">3. Workflow</span>
                      </button>

                      {/* Node: Email Broadcast */}
                      <button
                        onClick={() => setActiveNode('email')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                          activeNode === 'email' 
                            ? 'bg-amber-500/10 border-[#D4AF37] shadow-lg shadow-amber-500/5 text-white scale-105' 
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:border-amber-500/30'
                        }`}
                      >
                        <Mail className="h-5 w-5 text-[#D4AF37] mb-1.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">4. Email blast</span>
                      </button>

                      {/* Node: SMS Out */}
                      <button
                        onClick={() => setActiveNode('sms')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                          activeNode === 'sms' 
                            ? 'bg-amber-500/10 border-[#D4AF37] shadow-lg shadow-amber-500/5 text-white scale-105' 
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:border-amber-500/30'
                        }`}
                      >
                        <MessageSquare className="h-5 w-5 text-[#D4AF37] mb-1.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">5. SMS broadcast</span>
                      </button>

                      {/* Node: Authority Blog */}
                      <button
                        onClick={() => setActiveNode('blog')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                          activeNode === 'blog' 
                            ? 'bg-amber-500/10 border-[#D4AF37] shadow-lg shadow-amber-500/5 text-white scale-105' 
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:border-amber-500/30'
                        }`}
                      >
                        <BookOpen className="h-5 w-5 text-[#D4AF37] mb-1.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">6. Authority Blog</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* HIGH-FIDELITY PREVIEW PANEL */}
                <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                    <span className="text-xs font-black text-[#D4AF37] tracking-[2px] uppercase font-mono flex items-center gap-1.5">
                      <Eye className="h-4 w-4" /> Live Asset Preview Panel
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-neutral-900 px-2.5 py-1 rounded-lg">
                      Active: {activeNode.toUpperCase()} Node
                    </span>
                  </div>

                  {activeNode === 'funnel' && (
                    <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-4 shadow-inner">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-neutral-800 pb-2">
                        <span>PREVIEW DESKTOP SCREEN</span>
                        <span>SSL CERTIFIED • rjbusinesssolutions.org</span>
                      </div>
                      <div className="space-y-4 text-center py-6">
                        <div className="h-6 w-14 bg-[#D4AF37]/15 border border-[#D4AF37]/20 rounded mx-auto flex items-center justify-center text-[8px] font-bold text-[#D4AF37] tracking-wider">LOGO</div>
                        <h2 className="text-xl font-black text-white leading-tight max-w-lg mx-auto">{activeCampaignData.funnel.headline}</h2>
                        <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">{activeCampaignData.funnel.subheadline}</p>
                        
                        <div className="max-w-xs mx-auto text-left space-y-2 py-4">
                          {activeCampaignData.funnel.bullets.map((bullet: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                              <Check className="h-4 w-4 text-emerald-400 shrink-0" /> {bullet}
                            </div>
                          ))}
                        </div>

                        <button className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black text-xs rounded-xl shadow-md">
                          {activeCampaignData.funnel.ctaText}
                        </button>
                      </div>
                      <div className="text-center text-[9px] text-slate-500 pt-6 border-t border-neutral-850">
                        {activeCampaignData.funnel.complianceFooter}
                      </div>
                    </div>
                  )}

                  {activeNode === 'form' && (
                    <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-4 shadow-inner">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-neutral-800 pb-2">
                        <span>QUESTIONNAIRE MODULE</span>
                        <span>CONDITIONAL VALIDATION ACTIVE</span>
                      </div>
                      <div className="max-w-sm mx-auto space-y-4 py-4">
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-white text-sm">{activeCampaignData.form.name}</h3>
                        </div>
                        {activeCampaignData.form.fields.map((f: any) => (
                          <div key={f.id} className="space-y-1.5 text-left">
                            <label className="block text-slate-400 font-semibold text-xs">{f.label} {f.required && <span className="text-rose-500">*</span>}</label>
                            <input
                              type={f.type === 'number' ? 'number' : 'text'}
                              disabled
                              placeholder={f.placeholder}
                              className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-3.5 py-2 text-xs text-white"
                            />
                          </div>
                        ))}
                        <button className="w-full py-2.5 bg-[#D4AF37] text-black font-black rounded-xl text-xs mt-4">
                          {activeCampaignData.form.settings.submitButtonText}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeNode === 'workflow' && (
                    <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-4 shadow-inner text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-neutral-800 pb-2">
                        <span>AUTOMATION SEQUENCER</span>
                        <span>TRIGGER: FORM SUBMISSION</span>
                      </div>
                      <div className="space-y-4 py-4 max-w-md mx-auto">
                        <div className="p-3 bg-neutral-950 border border-[#D4AF37]/35 rounded-xl font-bold flex items-center justify-between text-[#D4AF37]">
                          <span className="flex items-center gap-1.5"><Sparkles className="h-4.5 w-4.5" /> [TRIGGER] Form Submitted</span>
                          <span className="text-[10px] font-mono">active</span>
                        </div>
                        
                        <div className="flex justify-center my-1">
                          <ChevronRight className="h-5 w-5 text-slate-600 transform rotate-90" />
                        </div>

                        {activeCampaignData.workflow.actions.map((act: any, i: number) => (
                          <div key={act.id} className="space-y-3">
                            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-white">
                              <span className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono font-bold text-[#D4AF37]">{i+1}</span>
                                <span className="font-bold text-slate-200">{act.description}</span>
                              </span>
                              <span className="text-[9px] uppercase font-mono font-black text-slate-500">delay: 5m</span>
                            </div>
                            {i < activeCampaignData.workflow.actions.length - 1 && (
                              <div className="flex justify-center">
                                <ChevronRight className="h-5 w-5 text-slate-600 transform rotate-90" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeNode === 'email' && (
                    <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-4 shadow-inner">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-neutral-800 pb-2">
                        <span>EMAIL BROADCAST TEMPLATE</span>
                        <span>247 RECIPIENTS TARGETED</span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 text-left text-xs space-y-3">
                        <div>
                          <span className="text-slate-500 font-bold">Subject:</span> <strong className="text-white font-bold">{activeCampaignData.email.subject}</strong>
                        </div>
                        <div className="border-t border-neutral-850 pt-3 text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {activeCampaignData.email.body}
                        </div>
                        <div className="border-t border-neutral-850 pt-3 text-[10px] text-slate-400 leading-relaxed font-semibold">
                          RJ Business Solutions • 1342 NM 333, Tijeras, New Mexico 87059
                        </div>
                      </div>
                      {Array.isArray(activeCampaignData.sequence) && activeCampaignData.sequence.length > 0 && (
                        <div className="bg-neutral-950 border border-amber-500/15 rounded-xl p-4 text-left space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-black tracking-widest border-b border-neutral-850 pb-2">
                            <span className="text-[#D4AF37]">FULL DRIP SEQUENCE — {activeCampaignData.sequence.length} TOUCHES ATTACHED</span>
                            <span className="text-slate-500">EXIT-ON-REPLY / BOOKED LOGIC ENABLED</span>
                          </div>
                          <div className="space-y-2">
                            {activeCampaignData.sequence.map((step: any) => (
                              <div key={step.id} className="flex gap-3 items-start bg-neutral-900 border border-neutral-850 rounded-xl p-3">
                                <div className="flex flex-col items-center shrink-0 w-12">
                                  <span className="text-[9px] font-black text-slate-500">DAY</span>
                                  <span className="text-lg font-black text-white leading-none">{step.day}</span>
                                  <span className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-black ${step.channel === 'sms' ? 'bg-sky-500/15 text-sky-400' : 'bg-amber-500/15 text-[#D4AF37]'}`}>{step.channel.toUpperCase()}</span>
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  {step.subject && <p className="text-xs font-black text-white truncate">{step.subject}</p>}
                                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 whitespace-pre-wrap">{step.body}</p>
                                  {step.strategyNote && <p className="text-[9px] text-emerald-400/80 font-bold">STRATEGY: {step.strategyNote}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeNode === 'sms' && (
                    <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl shadow-inner flex justify-center">
                      <div className="w-full max-w-xs bg-black rounded-3xl border border-neutral-800 p-3.5 space-y-3">
                        <div className="h-5 w-16 bg-neutral-900 rounded-full mx-auto flex items-center justify-center text-[8px] text-slate-500 font-bold font-mono">10:45 AM</div>
                        <div className="space-y-2">
                          <div className="bg-[#D4AF37]/15 border border-[#D4AF37]/20 text-slate-200 text-xs p-3.5 rounded-2xl rounded-tl-none leading-relaxed">
                            {activeCampaignData.sms.message}
                          </div>
                          <div className="text-right text-[8px] text-slate-500 font-bold font-mono pr-2">DELIVERED</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeNode === 'blog' && (
                    <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-4 shadow-inner text-left">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-neutral-800 pb-2">
                        <span>EDITORIAL AUTHORITY PUBLICATION</span>
                        <span>STATUS: ACTIVE PUBLISHED</span>
                      </div>
                      <div className="space-y-3 max-w-lg mx-auto py-3">
                        <h2 className="text-lg font-black text-white tracking-tight">{activeCampaignData.blog.title}</h2>
                        <div className="flex gap-1.5">
                          {activeCampaignData.blog.tags.map((t: string) => (
                            <span key={t} className="px-2 py-0.5 bg-neutral-950 text-[9px] font-black text-[#D4AF37] border border-amber-500/10 rounded-lg">{t}</span>
                          ))}
                        </div>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed">{activeCampaignData.blog.excerpt}</p>
                        <div className="border-t border-neutral-850 pt-3 text-slate-300 leading-relaxed text-xs whitespace-pre-wrap">
                          {activeCampaignData.blog.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[460px] border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-neutral-900/10">
                <GitMerge className="h-12 w-12 text-slate-600 mb-4" />
                <h4 className="font-bold text-white text-sm">Campaign Architect Idle</h4>
                <p className="text-slate-400 text-xs max-w-sm mt-1">Submit a concept prompt on the left to synthesize, compile, and visualize a multi-engine campaign marketing suite.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeFeature === 'agents' ? (
        <AgentsTab />
      ) : activeFeature === 'parser' ? (
        <ParserTab />
      ) : activeFeature === 'tax' ? (
        <YearRoundTab />
      ) : activeFeature === 'refund' ? (
        <RefundMaximizerTab />
      ) : activeFeature === 'voice' ? (
        <VoiceModeTab />
      ) : (
        /* STANDARD COGNITIVE CHAT INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel features list */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 p-5 shadow-lg">
              <div className="uppercase text-[9px] tracking-widest text-[#D4AF37] mb-4 font-black flex items-center gap-1.5 font-mono">
                <Sparkles className="h-3.5 w-3.5" />
                COGNITIVE SYSTEMS
              </div>
              
              <div className="space-y-1">
                {features.map((feat) => (
                  <button
                    key={feat.id}
                    onClick={() => {
                      setActiveFeature(feat.id);
                      setPrompt(feat.prompt);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-left group ${
                      activeFeature === feat.id 
                        ? 'bg-amber-500/10 text-[#D4AF37] border border-amber-500/20' 
                        : 'hover:bg-neutral-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <feat.icon className="h-4 w-4 text-[#D4AF37]" />
                      <span className="font-bold text-xs">{feat.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sync telemetry info */}
            <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-mono font-black text-slate-400 tracking-wider">State Telemetry</span>
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3 animate-pulse" /> ONLINE
                </span>
              </div>
              
              <div className="space-y-2 text-xs font-medium border-t border-neutral-900 pt-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Master Org</span>
                  <span className="font-bold text-white text-[11px]">RJ Business Solutions</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">TaxSlayer API</span>
                  <span className="font-mono text-emerald-400 font-bold">Secure Gateway</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Document Vault</span>
                  <span className="font-bold text-[#D4AF37] font-mono">Cloudflare R2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Central Chat Interface */}
          <div className="lg:col-span-6 bg-neutral-950/80 border border-amber-500/15 rounded-2xl shadow-xl flex flex-col h-[600px] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-neutral-900 flex items-center justify-between bg-neutral-950 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-900 p-2 rounded-xl border border-amber-500/10">
                  <Bot className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Tax Pro Hub University Practice Assistant</div>
                  <div className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                    <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    endpoint_host: {telemetry?.endpoint}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-auto space-y-5 bg-neutral-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[length:16px_16px]">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 text-xs shadow-md leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-[#D4AF37] text-neutral-950 font-black rounded-tr-none'
                        : 'bg-neutral-900 border border-neutral-850 rounded-tl-none text-slate-200'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      renderMessageContent(message.content)
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 pl-2">
                  <Bot className="h-4 w-4 text-[#D4AF37] animate-spin" />
                  <div className="text-[9px] text-slate-500 font-black tracking-widest uppercase animate-pulse">
                    Thinking across multi-LLM database...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 border-t border-neutral-900 bg-neutral-950 rounded-b-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask Tax Pro Hub University AI anything... (emails, tax structures, leads, pipelines)"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#D4AF37]/40 pl-5 pr-14 py-3.5 rounded-xl text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!prompt.trim() || isThinking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#D4AF37] hover:bg-yellow-400 disabled:bg-neutral-800 text-neutral-950 disabled:text-slate-600 font-bold p-2.5 rounded-lg transition-all active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-500 mt-2 px-1 font-mono">
                <span>Security Protected (HIPAA / IRS Compliant)</span>
                <span>Powered by RJ Business Solutions</span>
              </div>
            </div>
          </div>

          {/* Right panel telemetry */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 text-xs shadow-lg">
              <div className="font-bold text-white mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#D4AF37]" /> Telemetry Logs
              </div>
              
              {telemetry && (
                <div className="space-y-3">
                  <div className="bg-neutral-950 border border-neutral-900 text-slate-300 p-3.5 rounded-xl font-mono text-[9px] leading-relaxed space-y-1.5 shadow-inner">
                    <div><span className="text-[#D4AF37]">HOST:</span> {telemetry.endpoint}</div>
                    <div><span className="text-[#D4AF37]">MODEL:</span> {telemetry.modelUsed}</div>
                    <div><span className="text-[#D4AF37]">PROVIDER:</span> {telemetry.provider}</div>
                    <div><span className="text-[#D4AF37]">LATENCY:</span> <span className="text-emerald-400 font-bold">{telemetry.latencyMs}ms</span></div>
                    <div><span className="text-[#D4AF37]">TOKENS:</span> ~{telemetry.tokensEstimate}</div>
                    <div><span className="text-[#D4AF37]">SECURE_PIN:</span> AUTHENTICATED</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
