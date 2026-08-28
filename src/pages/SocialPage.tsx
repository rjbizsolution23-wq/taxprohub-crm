import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { 
  Plus, Link as LinkIcon, CheckCircle, X, Award, Shield, Sparkles, Send,
  Calendar, MessageSquare, Megaphone, Library, Users, Eye, Edit2, 
  Trash2, Play, RefreshCw, BarChart3, AlertTriangle, FileText, Globe, 
  HelpCircle, Search, SlidersHorizontal, Image, Video, Music, Check,
  UserCheck, AlertCircle, TrendingUp, Inbox, Radio, Star, Settings, Lock, ThumbsUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ==========================================
// MOCK SCHEMAS & PRELOADED ASSETS FOR SOCIAL
// ==========================================

const preloadedStockImages = [
  { id: 'stock-1', title: 'Schedule C Audit Preparation', url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80', tags: ['Tax Season', 'SmallBiz'], used: 4 },
  { id: 'stock-2', title: 'Home Office Deduction Logs', url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80', tags: ['Education', 'Sch-C'], used: 8 },
  { id: 'stock-3', title: 'Corporate S-Corp Strategy Meeting', url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80', tags: ['B2B', 'Planning'], used: 12 },
  { id: 'stock-4', title: 'IRS Refund Hype Celebration', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80', tags: ['Refunds', 'Promo'], used: 15 }
];

const taxHashtagGroups = [
  { name: 'Self-Employed 1099', tags: ['#TaxTok', '#1099Life', '#ScheduleC', '#TaxTips', '#WriteOffs'] },
  { name: 'S-Corp Corporate', tags: ['#SmallBizTax', '#SCorp', '#TaxAttorney', '#RJBusinessSolutions', '#CorporateTax'] },
  { name: 'Tax Season Launch', tags: ['#TaxRefund', '#FileTaxes', '#IRS', '#TaxPlanning', '#TaxProHubUniversity'] }
];

const sampleSocialAccounts = [
  { id: '1', platform: 'facebook', accountName: 'Tax Pro Hub University', accountId: 'myvirtualtax', connected: true, lastSynced: 'Just now', logoText: 'FB' },
  { id: '2', platform: 'instagram', accountName: '@myvirtualtax_pro', accountId: 'myvirtualtax_pro', connected: true, lastSynced: '5m ago', logoText: 'IG' },
  { id: '3', platform: 'linkedin', accountName: 'Tax Pro Hub University (Practice)', accountId: 'myvirtual-tax', connected: true, lastSynced: '1h ago', logoText: 'LI' },
  { id: '4', platform: 'twitter', accountName: '@TaxProHubUniversity', accountId: 'myvirtualtax', connected: true, lastSynced: '2h ago', logoText: 'X' },
  { id: '5', platform: 'tiktok', accountName: '@myvirtualtax', accountId: 'myvirtualtax', connected: false, logoText: 'TT' },
  { id: '6', platform: 'google', accountName: 'GBP Albuquerque Office', accountId: 'myvirtual_gbp', connected: true, lastSynced: '1d ago', logoText: 'G' }
];

const initialQueue = [
  { id: 'q-1', time: '09:00 AM', platform: 'facebook', title: 'Why Rideshare Drivers Overpay $3,000/yr', type: 'Educational', status: 'scheduled' },
  { id: 'q-2', time: '11:15 AM', platform: 'instagram', title: 'Schedule C Tax Deductions Checklist Reel', type: 'Testimonial', status: 'needs_approval' },
  { id: 'q-3', time: '02:30 PM', platform: 'linkedin', title: 'S-Corp vs LLC tax planning guide', type: 'Promo', status: 'scheduled' },
  { id: 'q-4', time: '05:00 PM', platform: 'twitter', title: 'X-Thread: 10 hidden writeoffs for creators', type: 'Educational', status: 'scheduled' }
];

const inboxItems = [
  { id: 'msg-1', name: 'Alvarez Consults', text: 'Hey there! How much do you charge for S-Corp quarterly setup?', platform: 'facebook', time: '2m ago', score: 94, category: 'Lead' },
  { id: 'msg-2', name: '@thecryptodriver', text: 'Does your AI scanner parse crypto transactions from Uniswap?', platform: 'instagram', time: '14m ago', score: 87, category: 'Question' },
  { id: 'msg-3', name: 'Sarah Jenkins', text: 'Thank you for the fast document verification, uploaded everything!', platform: 'linkedin', time: '1h ago', score: 65, category: 'Support' }
];

const socialListeningPings = [
  { id: 'p-1', keyword: '#TaxTok', source: 'TikTok Creator Hub', text: 'Self-employed tax writeoffs searches up +340% this week.', sentiment: 'positive' },
  { id: 'p-2', keyword: 'Circular 230', source: 'IRS Policy Feed', text: 'IRS issues updated disclaimer rules for social media representations.', sentiment: 'neutral' },
  { id: 'p-3', keyword: 'Tax Prep Near Me', source: 'Google Local Map Trends', text: 'Local keyword intent in Tijeras, NM up 50% year-over-year.', sentiment: 'positive' }
];

export default function SocialPage() {
  const { currentSubAccount } = useAppStore();
  
  // 12-Module Social Suite Tab Selector
  const [activeTab, setActiveTab] = useState<'hub' | 'calendar' | 'composer' | 'ai' | 'library' | 'campaigns' | 'inbox' | 'listening' | 'reputation' | 'analytics' | 'accounts' | 'compliance'>('hub');
  
  // App-wide state integrations
  const [accountsList, setAccountsList] = useState(sampleSocialAccounts);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [postsQueue, setPostsQueue] = useState(initialQueue);
  const [messagesList, setMessagesList] = useState(inboxItems);
  const [composePlatforms, setComposePlatforms] = useState<string[]>(['facebook', 'instagram', 'linkedin']);
  
  // Composer Editor States
  const [composerCaption, setComposerCaption] = useState('Are you writing off your vehicle mileage correctly as a 1099 contractor? \n\nMany drivers miss out on thousands of dollars by failing to keep compliant logs. Our automated platform tracks this in real-time. \n\nClick the link to estimate your savings today! #1099Life #TaxTips #TaxProHubUniversity');
  const [composerFirstComment, setComposerFirstComment] = useState('Grab our free Schedule C Mileage spreadsheet here: rjbusinesssolutions.org/free-mileage');
  const [complianceScore, setComplianceScore] = useState(95);
  const [selectedStockImage, setSelectedStockImage] = useState(preloadedStockImages[0].url);
  const [hasCircular230Notice, setHasCircular230Notice] = useState(false);
  const [postType, setPostType] = useState<'feed' | 'reel' | 'story'>('feed');

  // AI Studio Agent Interactive States
  const [aiChatQuery, setAiChatQuery] = useState('Create a week of TikToks teaching tax tips for self-employed people. My audience is rideshare drivers and content creators.');
  const [aiChatLog, setAiChatLog] = useState<any[]>([
    { role: 'user', content: 'Create a week of TikToks teaching tax tips for self-employed people. My audience is rideshare drivers and content creators.' }
  ]);
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [agentProgress, setAgentProgress] = useState<string[]>([]);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [generatedVoiceoverText, setGeneratedVoiceoverText] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');

  // Auto-run a compliance score recalculation on caption change
  useEffect(() => {
    let score = 100;
    setHasCircular230Notice(false);

    // Rule 1: Guaranteed refunds detection
    if (/guarantee|guaranteed|100% refund/i.test(composerCaption)) {
      score -= 35;
    }
    // Rule 2: Circular 230 / specific dollar refund claims without disclaimer
    if (/\$[0-9]+|refund advance/i.test(composerCaption)) {
      score -= 15;
      setHasCircular230Notice(true);
    }
    // Rule 3: Missing FTC disclosures when using affiliate terms
    if (/affiliate|commission|refer/i.test(composerCaption) && !/#ad|#sponsored/i.test(composerCaption)) {
      score -= 20;
    }
    // Rule 4: Competitor bashing
    if (/turbotax|h&r block|taxslayer/i.test(composerCaption)) {
      score -= 10;
    }

    setComplianceScore(score < 0 ? 0 : score);
  }, [composerCaption]);

  // Handle mock AI post synthesis
  const handleAIScriptTrigger = () => {
    if (!aiChatQuery.trim()) return;
    
    setIsAgentWorking(true);
    setAgentProgress([]);
    
    // Simulate multi-step tool execution steps
    const steps = [
      'Pulled 12 IRS publications on Schedule C write-offs...',
      'Scanned top 50 #TaxTok videos (last 30 days)...',
      'Checked brand voice guidelines from CONTEXT.md...',
      'Fact-checked content directly from IRS.gov API...',
      'Compliance pre-screened scripts for Circular 230 and FTC rules...',
      'Completed! Script, voiceover, and image previews rendered below.'
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setAgentProgress(prev => [...prev, `✓ ${step}`]);
        if (idx === steps.length - 1) {
          setIsAgentWorking(false);
          setGeneratedScript(`🎬 TIKTOK SCRIPT: 1099 VEHICLE WRITE-OFFS (Day 1)
[HOOK]: Stop giving the IRS free money! 🚗 If you drove for Uber, Lyft, or DoorDash, you can write off 67 cents for EVERY SINGLE MILE.
[B-ROLL]: Show a close-up of hands on a steering wheel, overlaying tracking spreadsheet app.
[VOICEOVER]: The IRS standard mileage rate for 2026 is 67 cents. Drive 10,000 miles? That is a $6,700 write-off straight off your taxable income!
[CTA]: Want our free mileage log? Drop a comment "LOG" and our AI assistant will DM you the template instantly.`);
          
          setGeneratedVoiceoverText(`Drive 10,000 miles? That is a $6,700 write-off straight off your taxable income! Comment LOG below.`);
          setGeneratedImageUrl('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80');
          
          setAiChatLog(prev => [
            ...prev,
            { role: 'user', content: aiChatQuery },
            { role: 'agent', content: 'Drafted 7 video scripts with hooks, b-roll suggestions, and hashtags. Preview right →' }
          ]);
        }
      }, (idx + 1) * 1200);
    });
  };

  const getPlatformClass = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-600/20 text-blue-400 border border-blue-500/30';
      case 'instagram': return 'bg-pink-500/10 text-pink-400 border border-pink-500/30';
      case 'linkedin': return 'bg-blue-700/20 text-blue-400 border border-blue-600/30';
      case 'twitter': return 'bg-neutral-900 text-slate-300 border border-neutral-800';
      case 'tiktok': return 'bg-neutral-950 text-[#D4AF37] border border-amber-500/20';
      case 'google': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-20 relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#D4AF37] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              RJ Business Solutions Marketing OS
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1 font-serif">
            Social Hub <span className="text-sm font-sans font-normal text-slate-400">v2.0 — The AI Brain</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Manage, schedule, and compliance-scan compliance-aware AI social campaigns for **{currentSubAccount?.name || 'Tax Pro Hub University'}**
          </p>
        </div>
        
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl text-xs shadow-md transition-all self-start sm:self-auto active:scale-95 cursor-pointer uppercase tracking-wider"
        >
          <Plus className="h-4 w-4" />
          Connect Channel
        </button>
      </div>

      {/* 12-MODULE SOCIAL SUITE TAB STRIP */}
      <div className="flex items-center gap-1.5 p-1.5 bg-neutral-950 border border-white/5 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'hub', label: 'Hub', icon: <Radio className="h-3.5 w-3.5" /> },
          { id: 'calendar', label: 'Calendar', icon: <Calendar className="h-3.5 w-3.5" /> },
          { id: 'composer', label: 'Composer', icon: <Edit2 className="h-3.5 w-3.5" /> },
          { id: 'ai', label: 'AI Studio', icon: <Sparkles className="h-3.5 w-3.5" /> },
          { id: 'library', label: 'Library', icon: <Library className="h-3.5 w-3.5" /> },
          { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="h-3.5 w-3.5" /> },
          { id: 'inbox', label: 'Inbox', icon: <Inbox className="h-3.5 w-3.5" /> },
          { id: 'listening', label: 'Listening', icon: <MessageSquare className="h-3.5 w-3.5" /> },
          { id: 'reputation', label: 'Reputation', icon: <Star className="h-3.5 w-3.5" /> },
          { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { id: 'accounts', label: 'Accounts', icon: <LinkIcon className="h-3.5 w-3.5" /> },
          { id: 'compliance', label: 'Compliance', icon: <Shield className="h-3.5 w-3.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37] shadow-lg shadow-amber-500/5'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-neutral-900/40'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER MODULE VIEWS */}
      <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl min-h-[500px]">
        
        {/* MODULE 1: HUB (Mission Control) */}
        {activeTab === 'hub' && (
          <div className="space-y-8">
            <div className="border-b border-white/5 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Social Hub Cockpit</h2>
                <p className="text-slate-400 text-xs mt-0.5">Campaign performance and instant task dispatch across all platforms</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] uppercase font-black border border-emerald-500/25">Direct APIs Live</span>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { label: 'Scheduled (7d)', val: '14 posts', sub: 'On track' },
                { label: 'Published (30d)', val: '86 posts', sub: '+12% MoM' },
                { label: 'Total Reach', val: '45.2K', sub: '92.3% Organic' },
                { label: 'Engagement Rate', val: '5.84%', sub: 'High authority' },
                { label: 'CRM Leads', val: '142 leads', sub: '3.2% Conv' },
                { label: 'Attributed Rev', val: '$18,500', sub: 'Gold tier' }
              ].map((kpi, i) => (
                <div key={i} className="p-4 bg-neutral-900/50 border border-white/5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">{kpi.label}</span>
                  <div className="my-2">
                    <p className="text-lg font-black text-white font-serif">{kpi.val}</p>
                    <p className="text-[9px] text-[#D4AF37] font-mono tracking-wider mt-0.5">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Queue */}
              <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black font-mono text-white uppercase tracking-wider">Today's Queue</h3>
                  <span className="text-[10px] text-amber-500 font-mono">4 items</span>
                </div>
                <div className="space-y-3">
                  {postsQueue.map((post) => (
                    <div key={post.id} className="p-3 bg-neutral-950/60 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0 ${getPlatformClass(post.platform)}`}>
                          {post.platform.substring(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{post.title}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{post.time} · {post.type}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                        post.status === 'scheduled' ? 'bg-amber-500/10 text-[#D4AF37]' : 'bg-rose-500/10 text-rose-400 animate-pulse border border-rose-500/10'
                      }`}>
                        {post.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Listening Pings */}
              <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black font-mono text-white uppercase tracking-wider">Listening Pings</h3>
                  <span className="text-[10px] text-[#D4AF37] font-mono">Live feeds</span>
                </div>
                <div className="space-y-3">
                  {socialListeningPings.map((ping) => (
                    <div key={ping.id} className="p-3 bg-neutral-950/60 border border-white/5 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-amber-500">{ping.keyword}</span>
                        <span className="text-[8px] text-slate-500 font-mono">{ping.source}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{ping.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Campaign Suggestions */}
              <div className="p-5 bg-neutral-900/40 border border-[#D4AF37]/15 rounded-2xl space-y-4">
                <h3 className="text-xs font-black font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                  AI Campaign Suggester
                </h3>
                <div className="space-y-3">
                  <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-white">Tax deadline is in 14 days!</p>
                    <p className="text-[11px] text-slate-400">Generate a multi-channel countdown carousel focusing on extension filings and missing Schedule C documents?</p>
                    <button 
                      onClick={() => {
                        setComposerCaption('📅 ONLY 14 DAYS LEFT! \n\nSelf-employed workers and S-Corp owners are quickly running out of time to submit their joint extensions. Do not let missing documents hold you back from claiming write-offs. \n\nDM us "TAX" to sync directly with our CPA suite today. #TaxDeadline #TaxProHubUniversity');
                        setActiveTab('composer');
                      }}
                      className="text-[10px] bg-[#D4AF37] text-black font-black font-mono uppercase px-3 py-1.5 rounded-lg hover:bg-amber-500 transition-all cursor-pointer block text-center"
                    >
                      Draft Campaign Carousel
                    </button>
                  </div>
                  <div className="p-3.5 bg-neutral-950/60 border border-white/5 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-slate-300">Trending sound alert on TikTok</p>
                    <p className="text-[11px] text-slate-500">The "Corporate tax vs 1099 mileage" sound is trending up +340%. Draft a quick script reaction?</p>
                    <button 
                      onClick={() => {
                        setAiChatQuery('Write a quick TikTok script responding to the trending S-Corp vs LLC tax sound.');
                        setActiveTab('ai');
                      }}
                      className="text-[10px] text-amber-500 font-mono font-bold hover:underline"
                    >
                      Open AI Studio draft →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: CONTENT CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Interactive Content Calendar</h2>
                <p className="text-slate-400 text-xs mt-0.5">Visually track campaign posting density across networks and dates</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25 text-xs font-mono font-bold rounded-lg">Timezone: MST (New Mexico)</span>
              </div>
            </div>

            {/* Calendar Grid Representation */}
            <div className="p-6 bg-neutral-900/40 border border-white/5 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-sm text-slate-200">May 2026</h3>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-amber-500/10 text-[#D4AF37] border border-amber-500/25 text-[10px] font-mono rounded-lg">Month View</span>
                  <span className="px-2 py-1 bg-neutral-950 text-slate-400 text-[10px] font-mono rounded-lg cursor-pointer">Week View</span>
                </div>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono uppercase text-slate-500 pb-2 border-b border-white/5">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2 mt-2 h-96">
                {Array.from({ length: 31 }).map((_, idx) => {
                  const day = idx + 1;
                  const hasDeadline = day === 15; // IRS Deadline
                  const hasPost = [12, 14, 20, 26, 28].includes(day);
                  return (
                    <div key={idx} className={`p-2 bg-neutral-950/40 border rounded-xl flex flex-col justify-between relative ${hasDeadline ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-mono font-bold ${hasDeadline ? 'text-red-400' : 'text-slate-400'}`}>{day}</span>
                        {hasDeadline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="IRS Deadline: Quarterly Filing"></span>
                        )}
                      </div>

                      {hasPost && (
                        <div className="p-1 bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] rounded text-[8px] font-mono truncate">
                          [FB/IG] Sch-C Tips
                        </div>
                      )}
                      
                      {day === 15 && (
                        <div className="p-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[7px] font-mono truncate font-bold">
                          IRS DUE DATE
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3: COMPOSER (The Studio) */}
        {activeTab === 'composer' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Tax-Compliance Post Composer</h2>
              <p className="text-slate-400 text-xs mt-0.5">Author content with real-time pre-publish rules scanning and native platform truncation previews</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              
              {/* LEFT COLUMN: PLATFORMS + SETTINGS */}
              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 space-y-6">
                <div>
                  <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2 mb-4">Target Channels</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['facebook', 'instagram', 'linkedin', 'twitter'].map((plat) => {
                      const selected = composePlatforms.includes(plat);
                      return (
                        <button
                          key={plat}
                          onClick={() => {
                            if (selected) {
                              setComposePlatforms(composePlatforms.filter(p => p !== plat));
                            } else {
                              setComposePlatforms([...composePlatforms, plat]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-mono font-bold capitalize flex items-center justify-between transition-all ${
                            selected 
                              ? 'bg-amber-500/10 border-amber-500/40 text-[#D4AF37]' 
                              : 'bg-neutral-950/60 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{plat}</span>
                          {selected ? <Check className="h-3.5 w-3.5 text-[#D4AF37]" /> : <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full"></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2 mb-4">Post Type & Scope</h3>
                  <div className="flex gap-2">
                    {['feed', 'reel', 'story'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPostType(type as any)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-mono uppercase border font-bold ${
                          postType === type 
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' 
                            : 'bg-neutral-950/60 border-white/5 text-slate-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2 mb-4">First Comment Hack</h3>
                  <p className="text-[10px] text-slate-500 mb-2 font-medium">Automatically drop links in the first comment to bypass platform organic link penalties:</p>
                  <input
                    type="text"
                    value={composerFirstComment}
                    onChange={(e) => setComposerFirstComment(e.target.value)}
                    placeholder="Drop first comment here (e.g. download logs link)..."
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-xs text-slate-300 outline-none focus:border-[#D4AF37] font-sans"
                  />
                </div>
              </div>

              {/* CENTER COLUMN: EDITING WORKSPACE */}
              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 space-y-6">
                <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">Content Workspace</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>CAPTION TEXT</span>
                    <span>{composerCaption.length} characters</span>
                  </div>
                  <textarea
                    value={composerCaption}
                    onChange={(e) => setComposerCaption(e.target.value)}
                    className="w-full h-44 bg-neutral-950 border border-white/10 rounded-2xl p-4 text-xs font-sans text-slate-300 outline-none focus:border-[#D4AF37] leading-relaxed"
                    placeholder="Compose caption here..."
                  />
                </div>

                {/* Media Manager Attachments */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Selected Asset</span>
                  <div className="grid grid-cols-4 gap-2">
                    {preloadedStockImages.map((img) => (
                      <button 
                        key={img.id}
                        onClick={() => setSelectedStockImage(img.url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 ${selectedStockImage === img.url ? 'border-[#D4AF37]' : 'border-transparent'}`}
                      >
                        <img src={img.url} className="w-full h-full object-cover" alt="Stock choice" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hashtag Quick Groups */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">AI Hashtag Groups (Click to Append)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {taxHashtagGroups.map((grp, idx) => (
                      <button
                        key={idx}
                        onClick={() => setComposerCaption(prev => `${prev}\n${grp.tags.join(' ')}`)}
                        className="px-2.5 py-1 bg-neutral-950 border border-white/5 text-[10px] font-mono text-slate-400 rounded-lg hover:text-[#D4AF37] hover:border-amber-500/20 transition-all cursor-pointer"
                      >
                        + {grp.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: LIVE PREVIEW & COMPLIANCE HUD */}
              <div className="space-y-6">
                {/* Pre-Publish Scanner Stats */}
                <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300">Compliance Scanner</h3>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase ${
                      complianceScore >= 90 ? 'bg-green-500/10 text-green-400' :
                      complianceScore >= 70 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      Score: {complianceScore}/100
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-sans">
                    <div className="flex items-start gap-2 text-slate-300">
                      {complianceScore >= 90 ? (
                        <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold text-white">Pre-Publish Diagnostics</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {complianceScore === 100 && '✓ Zero regulatory vulnerabilities flagged. Content is ready to schedule.'}
                          {complianceScore < 100 && 'Review required: some claims may exceed guidelines or lack auto-disclaimer scripts.'}
                        </p>
                      </div>
                    </div>

                    {hasCircular230Notice && (
                      <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-1 mt-2">
                        <p className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">Circular 230 Alert</p>
                        <p className="text-[10px] text-slate-300 leading-relaxed font-sans">You mentioned specific refund or write-off parameters. Circular 230 guidelines require attaching standard disclaimers.</p>
                        <button
                          onClick={() => setComposerCaption(prev => `${prev}\n\n*RJ Business Solutions Circular 230 Disclosure: Under IRS guidelines, any tax advice contained in this communication is not intended to be used to avoid penalties.`)}
                          className="text-[9px] bg-amber-500/10 text-amber-500 font-mono font-bold hover:underline"
                        >
                          ✓ Auto-Inject Standard Disclaimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pixel-Perfect Native Preview */}
                <div className="p-5 bg-neutral-900/40 border border-[#D4AF37]/15 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">Pixel-Perfect Live Preview</h3>
                  <div className="p-4 bg-neutral-950 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-600 flex items-center justify-center font-bold text-black font-serif text-[10px]">
                        RJ
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Tax Pro Hub University</p>
                        <p className="text-[9px] text-slate-500 font-mono">Sponsored · #ad</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {composerCaption || 'Placeholder preview caption text...'}
                    </p>

                    {selectedStockImage && (
                      <div className="aspect-video rounded-xl overflow-hidden border border-white/5">
                        <img src={selectedStockImage} className="w-full h-full object-cover" alt="Preview selection" />
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => {
                      setPostsQueue(prev => [
                        { id: `q-${Date.now()}`, time: 'Just now', platform: 'facebook', title: composerCaption.substring(0, 30) + '...', type: 'Campaign', status: 'scheduled' },
                        ...prev
                      ]);
                      setComposerCaption('');
                      setActiveTab('hub');
                    }}
                    disabled={complianceScore < 70}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    ✓ Save & Approve Post
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODULE 4: AI STUDIO (The Content Factory) */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Marketing AI Copilot Studio</h2>
                <p className="text-slate-400 text-xs mt-0.5">Watch Claude and Gemini research IRS manuals, fetch trending sounds, and write templates live</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 text-xs font-mono font-bold rounded-lg animate-pulse">● Cognitive Agent Engaged</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: AGENT CONSOLE CHAT AREA (5/12 space) */}
              <div className="lg:col-span-5 bg-neutral-900/40 border border-white/5 rounded-3xl p-5 flex flex-col justify-between min-h-[500px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                    <span className="text-xs font-black font-mono uppercase text-white tracking-wider">AI Content Analyst</span>
                  </div>

                  <div className="space-y-3 h-80 overflow-y-auto pr-2">
                    {aiChatLog.map((log, i) => (
                      <div key={i} className={`p-3.5 rounded-2xl text-xs space-y-1 leading-relaxed ${log.role === 'user' ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-slate-200 ml-4' : 'bg-neutral-950 border border-white/5 text-slate-300 mr-4'}`}>
                        <p className="font-mono text-[9px] uppercase tracking-wider font-black text-slate-500">{log.role === 'user' ? 'You' : '🤖 Agent Claude'}</p>
                        <p className="whitespace-pre-wrap">{log.content}</p>
                      </div>
                    ))}

                    {isAgentWorking && (
                      <div className="p-4 bg-neutral-950 border border-[#D4AF37]/20 rounded-2xl space-y-2 mr-4">
                        <div className="flex items-center gap-2 text-xs font-bold font-mono text-white">
                          <RefreshCw className="h-4.5 w-4.5 text-[#D4AF37] animate-spin" />
                          <span>AI Agent is working...</span>
                        </div>
                        <div className="space-y-1.5 pt-2">
                          {agentProgress.map((step, idx) => (
                            <p key={idx} className="text-[10px] font-mono text-slate-400">{step}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    value={aiChatQuery}
                    onChange={(e) => setAiChatQuery(e.target.value)}
                    placeholder="Instruct social agent to research and build templates..."
                    className="flex-1 bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:border-[#D4AF37]"
                    onKeyDown={(e) => e.key === 'Enter' && handleAIScriptTrigger()}
                  />
                  <button
                    onClick={handleAIScriptTrigger}
                    className="p-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: SCREEN-SHARE STYLE LIVE WORKSPACE (7/12 space) */}
              <div className="lg:col-span-7 bg-neutral-900/40 border border-[#D4AF37]/15 rounded-3xl p-5 min-h-[500px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                    <span className="text-xs font-black font-mono uppercase text-[#D4AF37] tracking-wider">Live Workspace Monitor</span>
                    <span className="text-[9px] text-slate-500 font-mono">1099_reels_day1.mp4</span>
                  </div>

                  {generatedScript ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-neutral-950 border border-[#D4AF37]/10 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span className="text-[9px] font-mono text-slate-400 uppercase">Script Output Draft</span>
                          <span className="text-[9px] font-mono text-green-400 uppercase font-black">Passed Circ 230</span>
                        </div>
                        <p className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">{generatedScript}</p>
                      </div>

                      {/* Video Render / Voiceover Player */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-neutral-950 border border-white/5 rounded-2xl space-y-2">
                          <span className="text-[9px] font-mono text-slate-400 uppercase block">ElevenLabs Voiceover Gen</span>
                          <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                            <button className="p-2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black rounded-full shrink-0">
                              <Play className="h-4.5 w-4.5 fill-current" />
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="h-2 bg-neutral-950 rounded overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 w-3/4 animate-pulse"></div>
                              </div>
                              <p className="text-[8px] text-slate-500 font-mono mt-1 truncate">{generatedVoiceoverText}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-neutral-950 border border-white/5 rounded-2xl space-y-2">
                          <span className="text-[9px] font-mono text-slate-400 uppercase block">AI Thumbnail Image</span>
                          <div className="flex gap-3 items-center">
                            <img src={generatedImageUrl} className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/25" alt="Generated" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-white truncate">taxpayer_rideshare_67c.png</p>
                              <span className="text-[8px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded uppercase">Verified Legal Rights</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                      <Sparkles className="h-10 w-10 text-[#D4AF37]/20 animate-pulse" />
                      <p className="text-slate-400 text-sm font-semibold">Ready to manufacture content</p>
                      <p className="text-slate-500 text-xs max-w-sm">Provide a prompt on the left console, and watch the AI research IRS tax rules, build the script, and generate mock b-roll imagery in real-time.</p>
                    </div>
                  )}
                </div>

                {generatedScript && (
                  <div className="pt-4 border-t border-white/5 flex gap-3">
                    <button 
                      onClick={() => {
                        setGeneratedScript('');
                        setAiChatLog([{ role: 'user', content: aiChatQuery }]);
                      }}
                      className="flex-1 py-3 bg-neutral-900 border border-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase transition"
                    >
                      Regenerate
                    </button>
                    <button 
                      onClick={() => {
                        setComposerCaption(generatedScript);
                        setSelectedStockImage(generatedImageUrl);
                        setActiveTab('composer');
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl text-xs uppercase tracking-wider transition"
                    >
                      ✓ Export to Composer
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* MODULE 5: CONTENT LIBRARY */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Social Digital Asset Manager</h2>
              <p className="text-slate-400 text-xs mt-0.5">Asset storage, license records, and preloaded tax playbook b-roll bundles</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {preloadedStockImages.map((img) => (
                <div key={img.id} className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-md relative group">
                  <div className="aspect-video w-full relative">
                    <img src={img.url} className="w-full h-full object-cover" alt="Asset" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-neutral-950/80 backdrop-blur-sm text-[8px] font-mono text-[#D4AF37] rounded-md uppercase border border-amber-500/10">License: CC0</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-bold text-white truncate">{img.title}</h4>
                    <div className="flex flex-wrap gap-1">
                      {img.tags.map((t, i) => (
                        <span key={i} className="text-[8px] font-mono text-slate-400 bg-neutral-950 px-1.5 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono pt-1">
                      <span>Used: {img.used} times</span>
                      <button 
                        onClick={() => {
                          setSelectedStockImage(img.url);
                          setActiveTab('composer');
                        }}
                        className="text-amber-500 font-bold uppercase hover:underline"
                      >
                        Compose
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 6: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Multi-Platform Campaigns</h2>
                <p className="text-slate-400 text-xs mt-0.5">Coordinated pushes with linked lead capture funnels and automated UTM taggers</p>
              </div>
              <button className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                + Launch Campaign
              </button>
            </div>

            <div className="space-y-4">
              {[
                { name: '1099 Drivers Tax Authority Build', type: 'Lead Generation', posts: 14, reach: '18.4K', leads: 42, rev: '$5,250', status: 'active' },
                { name: 'S-Corp Quarterly Tax Planning Outreach', type: 'C-Suite Education', posts: 8, reach: '12.1K', leads: 28, rev: '$8,400', status: 'active' },
                { name: 'Pre-April 15 Refund Season Countdown', type: 'Seasonal Promotion', posts: 24, reach: '45.1K', leads: 72, rev: '$4,850', status: 'completed' }
              ].map((camp, idx) => (
                <div key={idx} className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{camp.name}</h3>
                      <span className={`px-2 py-0.5 rounded font-mono text-[8px] font-black uppercase ${
                        camp.status === 'active' ? 'bg-amber-500/10 text-[#D4AF37] border border-amber-500/15' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {camp.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{camp.type} · {camp.posts} posts drafted</p>
                  </div>

                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div className="text-center">
                      <p className="text-slate-500 text-[9px] uppercase font-semibold">Reach</p>
                      <p className="text-white font-bold mt-0.5">{camp.reach}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 text-[9px] uppercase font-semibold">Leads</p>
                      <p className="text-[#D4AF37] font-bold mt-0.5">{camp.leads}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 text-[9px] uppercase font-semibold">Revenue</p>
                      <p className="text-green-400 font-bold mt-0.5">{camp.rev}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 7: UNIFIED SOCIAL INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Unified Marketing Inbox</h2>
              <p className="text-slate-400 text-xs mt-0.5">DMs, comments, and mentions triaged with sentiment and lead opportunity scores</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1 space-y-3">
                <div className="px-4 py-2.5 bg-neutral-950 border border-white/5 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">All Platforms</span>
                  <span className="text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] px-2 py-0.5 rounded-full font-mono">3 unread</span>
                </div>

                <div className="space-y-2">
                  {messagesList.map((msg) => (
                    <div key={msg.id} className="p-3.5 bg-neutral-900/50 border border-white/5 rounded-2xl space-y-2 cursor-pointer hover:border-amber-500/25 transition">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{msg.name}</span>
                        <span className="text-[9px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] px-2 py-0.5 rounded-full">{msg.platform}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] font-medium leading-relaxed line-clamp-2">{msg.text}</p>
                      <div className="flex justify-between items-center text-[10px] font-mono pt-1">
                        <span className="text-slate-500">{msg.time}</span>
                        <span className="text-green-400 font-bold">AI Urgency: {msg.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Thread Workspace Pane */}
              <div className="lg:col-span-2 p-6 bg-neutral-900/30 border border-white/5 rounded-3xl min-h-[400px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-200">Active Thread: Alvarez Consults</h3>
                    </div>
                    <span className="text-[10px] font-mono text-amber-500 uppercase bg-amber-500/5 px-2.5 py-0.5 rounded border border-amber-500/10 font-bold">Lead Opportunity</span>
                  </div>

                  <div className="space-y-4 h-64 overflow-y-auto pr-2">
                    <div className="p-3.5 bg-neutral-950 border border-white/5 rounded-2xl max-w-md">
                      <p className="text-[10px] font-mono text-slate-500 uppercase font-black">Alvarez Consults (Facebook DM)</p>
                      <p className="text-slate-200 text-xs mt-1 leading-relaxed">Hey there! How much do you charge for S-Corp quarterly setup?</p>
                    </div>

                    <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-2xl max-w-md ml-auto">
                      <p className="text-[10px] font-mono text-[#D4AF37] uppercase font-black">AI Copilot Pre-Draft</p>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed">Hi! For S-Corp setups, we manage everything including the 2553 election filing, salary calculations, and quarterly returns starting at $150/mo. Drive with RJ Business Solutions to streamline this. Would you like to schedule a quick 15-minute intake call?</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type reply or click dispatch pre-draft..."
                    className="flex-1 bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:border-[#D4AF37]"
                  />
                  <button className="px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 8: SOCIAL LISTENING */}
        {activeTab === 'listening' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Real-Time Social Listening</h2>
              <p className="text-slate-400 text-xs mt-0.5">Monitor brand mentions, competitor moves, and tax policy changes automatically</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Brand Mentions', feed: ['"Loved Tax Pro Hub Universitys easy document intake, saved me 3h." - Twitter', '"Best tax attorney Albuquerque options? Try RJ Solutions." - Yelp'] },
                { title: 'Competitor Scapes', feed: ['H&R Block launches new self-employed scheduling portal.', 'TurboTax updates pricing thresholds for S-Corp business returns.'] },
                { title: 'IRS Policy Bulletins', feed: ['[IRS-PDF] Publication 535 business deductions updated for 2026.', '[NEWS] IRS announces aggressive auditing enforcement on home offices.'] }
              ].map((col, idx) => (
                <div key={col.title} className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">{col.title}</h3>
                  <div className="space-y-3">
                    {col.feed.map((text, i) => (
                      <div key={i} className="p-3 bg-neutral-950/60 border border-white/5 rounded-xl text-[11px] text-slate-300 leading-relaxed font-sans">
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 9: REPUTATION */}
        {activeTab === 'reputation' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Reputation & Review Hub</h2>
              <p className="text-slate-400 text-xs mt-0.5">Google Business Profile, FB, and Yelp reviews with automated AI response drafts</p>
            </div>

            <div className="space-y-4">
              {[
                { author: 'Marcus Vance', stars: '⭐⭐★★★', review: 'Excellent tax preparation service. My Schedule C mileage calculations were fully processed and verified within 48 hours. Strongly recommend.', reply: 'Hi Marcus, thank you so much! Maximizing write-offs while staying compliant is our priority.' },
                { author: 'Jane Smith', stars: '⭐⭐⭐⭐⭐', review: 'The AI document scanner was insanely fast. Pre-filled my entire S-Corp S-2553 form. Amazing tech.', reply: '' }
              ].map((rev, i) => (
                <div key={i} className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-white">{rev.author}</span>
                      <span className="ml-3 text-xs text-[#D4AF37] font-mono">{rev.stars}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Google Review</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">"{rev.review}"</p>
                  
                  {rev.reply ? (
                    <div className="p-3.5 bg-neutral-950 border border-white/5 rounded-xl space-y-1">
                      <p className="text-[9px] font-mono text-amber-500 uppercase font-bold">Your Published Reply</p>
                      <p className="text-xs text-slate-400 leading-relaxed">"{rev.reply}"</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setComposerCaption(`Dear Jane Smith, thank you so much for the review! We are thrilled our AI document parser was able to streamline your S-Corp filing. Looking forward to working with you year-round!`);
                        setActiveTab('composer');
                      }}
                      className="text-[10px] bg-amber-500/10 text-[#D4AF37] border border-amber-500/25 font-mono font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-[#D4AF37]/20 transition-all cursor-pointer"
                    >
                      Draft AI Review Response
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 10: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Social Performance Analytics</h2>
              <p className="text-slate-400 text-xs mt-0.5">Campaign conversion data, attributed leads, and referral metrics</p>
            </div>

            {/* Simulated Chart Container */}
            <div className="p-6 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
              <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-200">Social Attributed Revenue Trend (30d)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { day: 'May 1', value: 2400 },
                    { day: 'May 5', value: 4500 },
                    { day: 'May 10', value: 3900 },
                    { day: 'May 15', value: 7200 },
                    { day: 'May 20', value: 8900 },
                    { day: 'May 25', value: 12500 }
                  ]}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(212,175,55,0.2)' }} />
                    <Area type="monotone" dataKey="value" stroke="#D4AF37" fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 11: ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Connect & Authenticate Channels</h2>
              <p className="text-slate-400 text-xs mt-0.5">Manage OAuth credentials, system tokens, and API connections</p>
            </div>

            <div className="divide-y divide-neutral-900 bg-neutral-950/40 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
              {accountsList.map((account) => (
                <div key={account.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`${getPlatformClass(account.platform)} w-12 h-12 rounded-xl flex items-center justify-center shadow-md`}>
                      <span className="text-sm font-black font-mono">{account.logoText}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-sm font-sans">{account.accountName}</h3>
                        {account.connected ? (
                          <span className="flex items-center gap-1 text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            Active
                          </span>
                        ) : (
                          <span className="text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                            Disconnected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">@{account.accountId}</p>
                      {account.lastSynced && (
                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                          Last sync: {account.lastSynced}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {account.connected ? (
                      <button 
                        onClick={() => setAccountsList(accountsList.map(a => a.id === account.id ? { ...a, connected: false, lastSynced: '' } : a))}
                        className="px-3.5 py-2 text-xs bg-neutral-900 hover:bg-rose-500/10 text-rose-400 font-bold border border-rose-500/10 rounded-xl transition cursor-pointer"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => setAccountsList(accountsList.map(a => a.id === account.id ? { ...a, connected: true, lastSynced: 'Just now' } : a))}
                        className="px-4 py-2 text-xs bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl transition cursor-pointer"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 12: COMPLIANCE */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Regulatory Compliance Safeguards</h2>
              <p className="text-slate-400 text-xs mt-0.5">Manage automated disclaimers, IRS Circular 230 criteria, and CTEC state guidelines</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Compliance checklist settings */}
              <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">Pre-Publish Check Rules</h3>
                <div className="space-y-3 font-sans text-xs">
                  {[
                    { label: 'Check for Circular 230 earnings/refund claims', active: true, desc: 'Scans for unsubstantiated dollar amounts or refund assurances.' },
                    { label: 'CTEC State Advertising Rules (California)', active: true, desc: 'Mandates CTEC registration disclosure statements on marketing assets.' },
                    { label: 'FTC Testimonial Endorsement Disclosures', active: true, desc: 'Appends #ad / #sponsored to paid promotional boosts.' },
                    { label: 'Automatic PII Leakage Scanner', active: true, desc: 'Prevents accidentally including taxpayer names or tax records in images.' }
                  ].map((rule, idx) => (
                    <div key={idx} className="p-3 bg-neutral-950/60 border border-white/5 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{rule.label}</span>
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Audit log list */}
              <div className="p-5 bg-neutral-900/40 border border-[#D4AF37]/15 rounded-2xl space-y-4">
                <h3 className="text-xs font-black font-mono uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">7-Year Compliance Audit Logs</h3>
                <div className="space-y-3 font-mono text-[10px]">
                  {[
                    { date: '5/26/2026, 01:10 AM', user: 'Rick Jefferson', action: 'Approved mileage script after disclaimer injection.', details: 'Day 1 write-offs reel approved.' },
                    { date: '5/25/2026, 04:30 PM', user: 'System Parser', action: 'Scan approved: S-Corp checklist.', details: 'Zero diagnostic risks detected.' }
                  ].map((log, i) => (
                    <div key={i} className="p-3 bg-neutral-950/80 border border-white/5 rounded-xl space-y-1.5">
                      <div className="flex justify-between text-slate-500 text-[9px]">
                        <span>{log.date}</span>
                        <span className="text-amber-500 font-bold">{log.user}</span>
                      </div>
                      <p className="text-slate-300 font-bold">{log.action}</p>
                      <p className="text-slate-500 text-[9px]">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CONNECT ACCOUNTS MODAL */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-[#D4AF37]/25 rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-5 relative z-10">
              <h2 className="text-lg font-black text-white uppercase tracking-tight font-mono">Connect Social Channel</h2>
              <button 
                onClick={() => setShowConnectModal(false)} 
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-slate-400 text-xs mb-5 relative z-10 font-semibold leading-relaxed">Select a platform network to securely authenticate and sync marketing campaigns:</p>
            
            <div className="space-y-2 relative z-10">
              {['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'].map((platform) => (
                <button
                  key={platform}
                  onClick={() => {
                    setAccountsList(accountsList.map(a => a.platform === platform ? { ...a, connected: true, lastSynced: 'Just now' } : a));
                    setShowConnectModal(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-neutral-950/80 border border-neutral-800 hover:border-amber-500/30 rounded-xl text-left hover:bg-neutral-950 transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`${getPlatformClass(platform)} w-10 h-11 rounded-lg flex items-center justify-center`}>
                      <span className="text-xs font-black uppercase font-mono">{platform.substring(0, 2)}</span>
                    </div>
                    <span className="font-bold text-white capitalize text-xs tracking-tight">{platform}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-[#D4AF37] font-bold font-mono transition">CONNECT →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
