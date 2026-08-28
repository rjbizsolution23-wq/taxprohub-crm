import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Building2, Tag, Calendar, Edit2, Trash2, Plus, ShieldCheck, 
  Eye, EyeOff, User, ClipboardList, Shield, DollarSign, Users, Award, FileText, 
  CheckSquare, Search, Send, Clock, AlertTriangle, ArrowRight, Upload, Sparkles, 
  Key, FileCheck, Check, MessageSquare, Download, CreditCard, ChevronRight, 
  HardDrive, PhoneCall, HelpCircle, Landmark, AlertCircle, FileSearch, Trash, 
  History, Activity, TrendingUp, TrendingDown, BookOpen, ShieldAlert
} from 'lucide-react';
import { useAppStore } from '../../store';

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contacts } = useAppStore();

  // Selected Tab State (1 to 15)
  const [activeTab, setActiveTab] = useState<number>(1);
  
  // Interactive UI States
  const [ssnRevealed, setSsnRevealed] = useState<boolean>(false);
  const [itinRevealed, setItinRevealed] = useState<boolean>(false);
  const [creditRoleGated, setCreditRoleGated] = useState<boolean>(true);
  const [permissiblePurposeSigned, setPermissiblePurposeSigned] = useState<boolean>(false);
  const [complianceLogs, setComplianceLogs] = useState<any[]>([
    { user: 'Loyce Sterling (Preparer)', accessed: 'Contact File Initialized', ip: '172.56.42.109', time: '5/26/2026, 12:46:00 AM', purpose: 'Lead Intake Verification' }
  ]);
  const [notes, setNotes] = useState<any[]>([
    { id: '1', author: 'Loyce Sterling', avatar: 'LS', content: 'Client is transitioning from Single to Married Filing Jointly for TY2025. Will need spouse Jane\'s W-2 and ID copy. High-value business owner under Schedule C.', date: 'May 25, 2026 04:30 PM', pinned: true, visibility: 'team', tags: ['filing-prep', 'mfs-to-mfj'] },
    { id: '2', author: 'Loyce Sterling', avatar: 'LS', content: 'Pre-screened for QBI deduction eligibility. Client maintains high capital expenditures. Advised Audit Shield upsell during next week\'s intake.', date: 'May 25, 2026 01:15 PM', pinned: false, visibility: 'team', tags: ['tax-planning'] }
  ]);
  const [newNoteText, setNewNoteNoteText] = useState('');
  const [dependents, setDependents] = useState<any[]>([
    { id: '1', name: 'John Smith III', ssn: '***-**-5678', dob: '2010-08-14', relation: 'Son', months: 12, disabled: false, student: true, income: '0', ageOut: false, collegeEligible: false },
    { id: '2', name: 'Emily Smith', ssn: '***-**-9012', dob: '2008-11-22', relation: 'Daughter', months: 12, disabled: false, student: true, income: '1,200', ageOut: true, collegeEligible: true }
  ]);
  const [tasks, setTasks] = useState<any[]>([
    { id: '1', title: 'Collect Spouse Jane\'s W-2 Statement', desc: 'Missing second employer statement', due: '2026-05-28', priority: 'high', status: 'in-progress' },
    { id: '2', title: 'Draft Form 8879 and Send via Verifyle', desc: 'Pre-filing e-authorization signature release', due: '2026-06-02', priority: 'urgent', status: 'todo' },
    { id: '3', title: 'Perform Schedule C Home Office Deduction review', desc: 'Validate square footage logs with client', due: '2026-06-05', priority: 'medium', status: 'todo' },
    { id: '4', title: 'Setup Stripe Retainer Plan for Quarterly Filing', desc: 'Year-round advisory retainer setup', due: '2026-05-27', priority: 'medium', status: 'done' }
  ]);
  const [timeline, setTimeline] = useState<any[]>([
    { id: '1', time: '5/26/2026 12:46 AM', type: 'system', text: 'Contact created via Website form submission', user: 'System Agent', subtext: 'UTM: facebook_ad_2026_q2_tax' },
    { id: '2', time: '5/26/2026 12:47 AM', type: 'email', text: 'Welcome automated email dispatched', user: 'Resend SMTP', subtext: 'Message ID: msg_8829471ab' },
    { id: '3', time: '5/26/2026 12:48 AM', type: 'workflow', text: 'Workflow "New Lead Tax Intake" triggered', user: 'Workflow Engine', subtext: 'Status: Completed' },
    { id: '4', time: '5/26/2026 09:15 AM', type: 'sms', text: 'SMS dispatched with booking link', user: 'Twilio Gateway', subtext: 'TCPA timestamp: 177962451000' },
    { id: '5', time: '5/27/2026 10:02 AM', type: 'document', text: 'Document uploaded: W-2_Smith_John_2025.pdf', user: 'Client Portal', subtext: 'OCR Status: Complete. Box 1: $84,200' },
    { id: '6', time: '5/27/2026 10:05 AM', type: 'system', text: 'Tax Profile updated with W-2 wages ($84,200)', user: 'AI Tax Extractor', subtext: 'Auto-fill accuracy: 99.8%' }
  ]);
  const [messages, setMessages] = useState<any[]>([
    { id: '1', channel: 'SMS', direction: 'in', sender: 'John Smith Jr.', text: 'Hey Loyce, I uploaded my primary W-2. Do you also need my mortgage statement (1098) before our session?', time: 'Today, 10:02 AM', status: 'read' },
    { id: '2', channel: 'SMS', direction: 'out', sender: 'Loyce Sterling', text: 'Hi John, yes absolutely! Uploading the 1098 helps maximize your itemized deductions. Looking forward to our call.', time: 'Today, 10:15 AM', status: 'delivered' }
  ]);
  const [smsInput, setSmsInput] = useState('');
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiDraftResponse, setAiDraftResponse] = useState('');
  const [cmdKOpen, setCmdKOpen] = useState(false);
  const [cmdKQuery, setCmdKQuery] = useState('');
  const [missingDocsModal, setMissingDocsModal] = useState(false);

  // Default contact details
  const contact = {
    id: id || '1',
    firstName: 'John',
    lastName: 'Smith Jr.',
    company: 'Smith Consulting LLC',
    spouse: 'Jane Smith',
    status: 'lead' as const,
    tier: 'Tier 2 (S-Corp Premium)',
    ty: 'TY2025',
    refund: '$4,820',
    ptin: 'P01234567',
    preparer: 'Loyce Sterling',
    lastContact: '2hr ago',
    nextAction: 'W-2 reminder scheduled 5/28 9:00 AM'
  };

  // Add notes logging helper
  const addTimelineEvent = (type: string, text: string, user: string, subtext?: string) => {
    const now = new Date().toLocaleString();
    setTimeline(prev => [
      { id: String(prev.length + 1), time: now, type, text, user, subtext: subtext || '' },
      ...prev
    ]);
  };

  // SSN / ITIN audit logger
  const handleRevealSSN = () => {
    if (!ssnRevealed) {
      const now = new Date();
      const logEntry = {
        user: 'Loyce Sterling (Preparer)',
        accessed: 'SSN_REVEAL',
        ip: '172.56.42.109',
        time: now.toLocaleString(),
        purpose: 'TaxSlayer software sync confirmation'
      };
      setComplianceLogs(prev => [logEntry, ...prev]);
      addTimelineEvent('security', 'Loyce Sterling viewed decrypted SSN (audited)', 'Security Shield', 'IP: 172.56.42.109');
    }
    setSsnRevealed(!ssnRevealed);
  };

  const handleRevealITIN = () => {
    if (!itinRevealed) {
      const now = new Date();
      const logEntry = {
        user: 'Loyce Sterling (Preparer)',
        accessed: 'ITIN_REVEAL',
        ip: '172.56.42.109',
        time: now.toLocaleString(),
        purpose: 'Intake audit check'
      };
      setComplianceLogs(prev => [logEntry, ...prev]);
      addTimelineEvent('security', 'Loyce Sterling viewed decrypted ITIN (audited)', 'Security Shield', 'IP: 172.56.42.109');
    }
    setItinRevealed(!itinRevealed);
  };

  // Trigger AI Response pre-draft
  const triggerAIDraft = () => {
    setAiDraftResponse("Dear John, \n\nI reviewed your current filing dashboard and noticed we are still missing your spouse's W-2 from employer 'Stripe Inc.'. Could you kindly upload this directly to your portal? Doing so will enable me to finalize your joint return draft and locks in your estimated $4,820 refund.\n\nBest regards,\nLoyce Sterling");
    setAiDraftOpen(true);
  };

  // Send message mock
  const handleSendMessage = () => {
    if (!smsInput.trim()) return;
    const msg = {
      id: String(messages.length + 1),
      channel: 'SMS',
      direction: 'out',
      sender: 'Loyce Sterling',
      text: smsInput,
      time: 'Just now',
      status: 'sent'
    };
    setMessages([...messages, msg]);
    addTimelineEvent('sms', `Sent SMS: "${smsInput.substring(0, 30)}..."`, 'Twilio Outbox');
    setSmsInput('');
  };

  // Add Dependent
  const addDependentRow = () => {
    const newDep = {
      id: String(dependents.length + 1),
      name: 'New Dependent',
      ssn: '***-**-xxxx',
      dob: '2026-01-01',
      relation: 'Qualifying Relative',
      months: 12,
      disabled: false,
      student: false,
      income: '0',
      ageOut: false,
      collegeEligible: false
    };
    setDependents([...dependents, newDep]);
    addTimelineEvent('system', 'Added new dependent row to file', 'CRM Editor');
  };

  // Command + K query search simulations
  const cmdKResults = cmdKQuery ? [
    { title: 'W-2_Smith_John_2025.pdf', type: 'Document', text: 'OCR verified. Taxable wages Box 1: $84,200.' },
    { title: 'Timeline Event: W-2 uploaded', type: 'Audit Trail', text: 'Client uploaded document from IP 185.34.2.19.' },
    { title: 'Loyce Rich Text Notes', type: 'Notes', text: 'Transition from Single to Married filing jointly.' }
  ].filter(item => item.title.toLowerCase().includes(cmdKQuery.toLowerCase()) || item.text.toLowerCase().includes(cmdKQuery.toLowerCase())) : [];

  // Listen to keydown for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdKOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6 pb-20 relative">
      
      {/* GLOBAL RECORD SEARCH MODAL (CMD + K) */}
      {cmdKOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#090d16] border border-[#D4AF37]/30 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative shadow-amber-500/5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <Search className="h-5 w-5 text-[#D4AF37]" />
              <input 
                type="text" 
                placeholder="Search note text, OCR docs, chat logs, timeline..." 
                value={cmdKQuery}
                onChange={(e) => setCmdKQuery(e.target.value)}
                className="w-full bg-transparent outline-none border-none text-white font-medium text-sm placeholder-slate-500"
                autoFocus
              />
              <button 
                onClick={() => setCmdKOpen(false)}
                className="px-2.5 py-1 bg-neutral-900 border border-white/5 text-[10px] font-mono text-slate-400 rounded-md uppercase"
              >
                ESC
              </button>
            </div>
            
            {cmdKQuery ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                <p className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider mb-2">Search results inside {contact.firstName}'s Dossier</p>
                {cmdKResults.length > 0 ? cmdKResults.map((r, i) => (
                  <div key={i} className="p-3 bg-neutral-950/60 border border-[#D4AF37]/10 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{r.title}</span>
                      <span className="text-[9px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] px-2 py-0.5 rounded-full">{r.type}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{r.text}</p>
                  </div>
                )) : (
                  <p className="text-slate-500 text-xs py-4 text-center">No matches found in the active dossier index.</p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Search className="h-8 w-8 text-[#D4AF37]/40 mx-auto mb-2" />
                <p className="text-slate-300 text-sm font-semibold">Type to search client file</p>
                <p className="text-slate-500 text-xs mt-1">Direct indexed search of OCR data, communications, timeline events, and notes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI RESPONSES PRE-DRAFTER DRAWER */}
      {aiDraftOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex justify-end">
          <div className="w-full max-w-lg bg-[#070b13] border-l border-[#D4AF37]/20 h-full p-8 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wider">AI Copilot Draft</h3>
                </div>
                <button 
                  onClick={() => setAiDraftOpen(false)}
                  className="p-1.5 bg-neutral-900 border border-white/5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Our AI tax-compliance coach generated this response based on outstanding file indicators (Spouse Jane W-2 and general status flags). Review or edit before sending.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Response Message Body</label>
                <textarea 
                  value={aiDraftResponse}
                  onChange={(e) => setAiDraftResponse(e.target.value)}
                  className="w-full h-80 bg-neutral-950/80 border border-[#D4AF37]/25 rounded-2xl p-4 text-xs font-sans text-slate-200 outline-none focus:border-[#D4AF37] leading-relaxed transition"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-6 border-t border-white/5">
              <button 
                onClick={() => setAiDraftOpen(false)}
                className="flex-1 py-3 bg-neutral-900 border border-white/5 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Discard
              </button>
              <button 
                onClick={() => {
                  setMessages(prev => [
                    ...prev, 
                    { id: String(messages.length + 1), channel: 'SMS', direction: 'out', sender: 'Loyce Sterling', text: aiDraftResponse, time: 'Just now', status: 'sent' }
                  ]);
                  addTimelineEvent('sms', 'Sent AI pre-drafted client reminder', 'AI Agent Outbox');
                  setAiDraftOpen(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-[#D4AF37] to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                Dispatch Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY IDENTITY HEADER */}
      <div className="sticky top-0 bg-[#030712]/90 backdrop-blur-xl border border-amber-500/10 rounded-3xl p-6 z-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl"></div>
        <div className="flex items-start sm:items-center gap-4">
          <button 
            onClick={() => navigate('/contacts')} 
            className="p-3 bg-neutral-900/60 border border-white/5 text-[#D4AF37] hover:border-[#D4AF37]/40 rounded-2xl transition cursor-pointer shrink-0 mt-1 sm:mt-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight font-serif">{contact.firstName} {contact.lastName}</h1>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] font-mono text-[10px] font-bold rounded-full uppercase tracking-wider">
                {contact.ty} Filed
              </span>
              <span className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                LIVE TAXSLAYER
              </span>
            </div>
            
            <p className="text-xs text-slate-400 font-medium">
              <span className="font-bold text-white">{contact.company}</span> · Spouse Link: <span className="text-[#D4AF37] hover:underline cursor-pointer">{contact.spouse}</span> · Lead Tier: <span className="text-amber-500">{contact.tier}</span>
            </p>
            
            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
              <span>PTIN: <span className="text-slate-300 font-bold">{contact.ptin}</span></span>
              <span>•</span>
              <span>Preparer: <span className="text-slate-300 font-bold">{contact.preparer}</span></span>
              <span>•</span>
              <span>Last Contact: <span className="text-slate-300 font-bold">{contact.lastContact}</span></span>
            </div>
          </div>
        </div>

        {/* Action bar and search quick buttons */}
        <div className="flex flex-col items-end gap-3 w-full md:w-auto shrink-0 border-t border-white/5 md:border-none pt-4 md:pt-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={() => triggerAIDraft()}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Draft
            </button>
            <button className="p-2 bg-neutral-900 border border-white/5 hover:border-[#D4AF37]/30 text-slate-300 hover:text-white rounded-xl transition cursor-pointer" title="Call Client">
              <PhoneCall className="h-4 w-4" />
            </button>
            <button className="p-2 bg-neutral-900 border border-white/5 hover:border-[#D4AF37]/30 text-slate-300 hover:text-white rounded-xl transition cursor-pointer" title="Email Client">
              <Mail className="h-4 w-4" />
            </button>
            <button className="p-2 bg-neutral-900 border border-white/5 hover:border-[#D4AF37]/30 text-slate-300 hover:text-white rounded-xl transition cursor-pointer" title="Book Consultation">
              <Calendar className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setCmdKOpen(true)}
              className="px-3.5 py-2 bg-neutral-950 border border-white/10 hover:border-[#D4AF37]/30 text-slate-400 hover:text-white text-[10px] font-mono rounded-xl transition cursor-pointer flex items-center gap-2"
              title="Global Search"
            >
              <Search className="h-3.5 w-3.5" />
              Search File <span className="bg-neutral-900 px-1 rounded text-[8px] text-[#D4AF37]">Ctrl+K</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 p-2 bg-amber-500/5 border border-amber-500/10 rounded-xl w-full justify-center sm:justify-start">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wide">
              Next Alert: <span className="text-amber-400 font-bold">{contact.nextAction}</span>
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* LEFT COMPONENT: TABS CONTAINER (3/4 space) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* TAB STRIP - HORIZONTAL SCROLLABLE */}
          <div className="flex items-center gap-1.5 p-1.5 bg-neutral-950 border border-white/5 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: 1, label: 'Overview', icon: <Activity className="h-3.5 w-3.5" /> },
              { id: 2, label: 'Personal', icon: <User className="h-3.5 w-3.5" /> },
              { id: 3, label: 'Tax Profile', icon: <ClipboardList className="h-3.5 w-3.5" /> },
              { id: 4, label: 'Dependents', icon: <Users className="h-3.5 w-3.5" /> },
              { id: 5, label: 'Income & Deduct', icon: <DollarSign className="h-3.5 w-3.5" /> },
              { id: 6, label: 'Documents', icon: <HardDrive className="h-3.5 w-3.5" /> },
              { id: 7, label: 'Returns', icon: <FileCheck className="h-3.5 w-3.5" /> },
              { id: 8, label: 'Banking', icon: <Landmark className="h-3.5 w-3.5" /> },
              { id: 9, label: 'Credit', icon: <Award className="h-3.5 w-3.5" /> },
              { id: 10, label: 'Communications', icon: <MessageSquare className="h-3.5 w-3.5" /> },
              { id: 11, label: 'Notes', icon: <FileText className="h-3.5 w-3.5" /> },
              { id: 12, label: 'Tasks', icon: <CheckSquare className="h-3.5 w-3.5" /> },
              { id: 13, label: 'Timeline', icon: <History className="h-3.5 w-3.5" /> },
              { id: 14, label: 'Billing', icon: <CreditCard className="h-3.5 w-3.5" /> },
              { id: 15, label: 'Compliance', icon: <ShieldCheck className="h-3.5 w-3.5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

          {/* ACTIVE TAB COMPONENT CONTAINER */}
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl min-h-[500px]">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 1 && (
              <div className="space-y-8">
                {/* Visual Header */}
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Taxpayer Overview Cockpit</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Performance tracking, filing steps, and automated intelligence indicators</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Refund/Liability Cards */}
                  <div className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl space-y-4">
                    <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest bg-green-500/5 border border-green-500/10 px-2.5 py-0.5 rounded-full">Current Refund (Est)</span>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-3xl font-black text-white font-serif">{contact.refund}</h3>
                      <div className="flex items-center text-green-400 text-xs font-bold font-mono">
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        +14.2%
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 space-y-1.5 font-mono">
                      <div className="flex justify-between"><span>TY2024 (MFJ):</span><span className="text-slate-300 font-bold">$4,220 Paid</span></div>
                      <div className="flex justify-between"><span>TY2023 (Single):</span><span className="text-slate-300 font-bold">$1,890 Paid</span></div>
                      <div className="flex justify-between"><span>TY2022 (Single):</span><span className="text-slate-300 font-bold">$1,450 Paid</span></div>
                    </div>
                  </div>

                  {/* Card 2: Document Completeness */}
                  <div className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest bg-amber-500/5 border border-amber-500/10 px-2.5 py-0.5 rounded-full">Intake Vault</span>
                      <h3 className="text-xl font-serif font-bold text-white mt-3">Docs Completeness</h3>
                      <p className="text-slate-400 text-xs mt-0.5">8 of 11 required files verified</p>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-xs font-bold font-mono">
                        <span className="text-slate-400">OCR Extracted:</span>
                        <span className="text-[#D4AF37]">72% Perfect</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                      <button 
                        onClick={() => setMissingDocsModal(true)}
                        className="text-[10px] text-amber-500 font-bold uppercase tracking-wider hover:underline block pt-2"
                      >
                        Request 3 Missing Documents →
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Lifetime metrics */}
                  <div className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest bg-blue-500/5 border border-blue-500/10 px-2.5 py-0.5 rounded-full">Client Value</span>
                      <h3 className="text-xl font-serif font-bold text-white mt-3">Customer LTV</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Total billing, referrers, and retention</p>
                    </div>
                    
                    <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 space-y-1.5 font-mono">
                      <div className="flex justify-between"><span>Total Paid Fees:</span><span className="text-slate-200 font-bold">$2,850</span></div>
                      <div className="flex justify-between"><span>Filing Cycles:</span><span className="text-slate-200 font-bold">4 Years</span></div>
                      <div className="flex justify-between"><span>Referrals Paid:</span><span className="text-[#D4AF37] font-bold">2 Clients</span></div>
                    </div>
                  </div>
                </div>

                {/* Filing Pipeline Progress Timeline */}
                <div className="p-6 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Visual Filing Pipeline Lifecycle</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
                    {[
                      { stage: 'Intake', state: 'done' },
                      { stage: 'Docs Collected', state: 'done' },
                      { stage: 'Drafted', state: 'active' },
                      { stage: 'Reviewed', state: 'pending' },
                      { stage: 'Signed', state: 'pending' },
                      { stage: 'E-Filed', state: 'pending' },
                      { stage: 'Accepted', state: 'pending' },
                      { stage: 'Paid Out', state: 'pending' }
                    ].map((step, index) => (
                      <div 
                        key={index} 
                        className={`p-3.5 border rounded-xl text-center space-y-1.5 relative ${
                          step.state === 'done' 
                            ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                            : step.state === 'active'
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37] animate-pulse'
                            : 'bg-neutral-950/40 border-white/5 text-slate-500'
                        }`}
                      >
                        <span className="block text-[10px] font-mono font-bold uppercase">Stage 0{index + 1}</span>
                        <span className="block text-xs font-black truncate">{step.stage}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Compliance Items & AI Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <h4 className="text-xs font-bold uppercase text-white font-mono">Open Action items</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5 text-xs">
                        <span className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[9px] font-bold mt-0.5 shrink-0">ACTION</span>
                        <div className="flex-1">
                          <p className="text-slate-200 font-semibold">Missing Form W-2 for spouse Jane Smith</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Required to trigger married filing jointly</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs">
                        <span className="p-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-bold mt-0.5 shrink-0">INTENT</span>
                        <div className="flex-1">
                          <p className="text-slate-200 font-semibold">Form 8879 pre-authorization pending signatures</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Sent via Verifyle envelope</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs">
                        <span className="p-1 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] font-mono text-[9px] font-bold mt-0.5 shrink-0">BILLING</span>
                        <div className="flex-1">
                          <p className="text-slate-200 font-semibold">Verify ACH connection for payment deduction</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Agreement on refund-fee retention option</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                        <h4 className="text-xs font-bold uppercase text-white font-mono">Tax AI Analytics & Insights</h4>
                      </div>
                      <span className="text-[9px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/25">Engine Level 4</span>
                    </div>
                    <div className="space-y-3 text-xs leading-relaxed">
                      <div className="p-3.5 bg-neutral-950/50 border border-[#D4AF37]/10 rounded-xl space-y-1">
                        <p className="font-bold text-[#D4AF37]">Schedule C QBI Optimization Found</p>
                        <p className="text-slate-400 text-xs">The S-Corp structure supports a qualified business income reduction. Estimated refund optimization: <span className="text-green-400 font-bold">+$1,420</span>.</p>
                      </div>
                      <div className="p-3.5 bg-neutral-950/50 border border-white/5 rounded-xl space-y-1">
                        <p className="font-bold text-slate-300">Audit Risk Matrix Check</p>
                        <p className="text-slate-400 text-xs">IRS pattern check score: <span className="text-green-400 font-bold">12 (Low Audit Risk)</span>. Deductions parameters look robust compared to multi-state peer groups.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PERSONAL */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Identity & Personal Record</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Secure, isolated primary household demographic data</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Block */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Identity Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><p className="text-slate-500 font-mono">Legal First Name</p><p className="text-white font-bold mt-1">John</p></div>
                      <div><p className="text-slate-500 font-mono">Legal Last Name</p><p className="text-white font-bold mt-1">Smith Jr.</p></div>
                      <div><p className="text-slate-500 font-mono">Date of Birth</p><p className="text-white font-bold mt-1">1984-06-18</p></div>
                      <div><p className="text-slate-500 font-mono">Citizenship Status</p><p className="text-white font-bold mt-1">US Citizen</p></div>
                      
                      {/* Masked SSN with Reveal Auditing Trigger */}
                      <div className="col-span-2 p-3 bg-neutral-950 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 font-mono text-[10px]">Social Security Number (Encrypted)</p>
                          <p className="text-sm font-mono font-black tracking-widest text-white mt-1">
                            {ssnRevealed ? '034-29-1234' : '***-**-1234'}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleRevealSSN()}
                          className="p-2 bg-neutral-900 hover:bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 rounded-xl transition cursor-pointer"
                          title="Reveal and Log Action"
                        >
                          {ssnRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Masked ITIN with Reveal Auditing Trigger */}
                      <div className="col-span-2 p-3 bg-neutral-950 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 font-mono text-[10px]">ITIN Number (Encrypted)</p>
                          <p className="text-sm font-mono font-black tracking-widest text-white mt-1">
                            {itinRevealed ? '9XX-84-4821' : '***-**-4821'}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleRevealITIN()}
                          className="p-2 bg-neutral-900 hover:bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 rounded-xl transition cursor-pointer"
                          title="Reveal and Log Action"
                        >
                          {itinRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contact channels */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Primary Contact Channels</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><p className="text-slate-500 font-mono">Mobile Phone</p><p className="text-white font-bold mt-1">(555) 123-4567</p></div>
                      <div><p className="text-slate-500 font-mono">Primary Email</p><p className="text-white font-bold mt-1">john.smith@example.com</p></div>
                      <div><p className="text-slate-500 font-mono">Preferred Channel</p><p className="text-[#D4AF37] font-bold mt-1">SMS Text</p></div>
                      <div><p className="text-slate-500 font-mono">Timezone</p><p className="text-white font-bold mt-1">Eastern (EST)</p></div>
                      <div><p className="text-slate-500 font-mono">Language Pref</p><p className="text-white font-bold mt-1">English (EN)</p></div>
                      <div><p className="text-slate-500 font-mono">TCPA Opt-In</p><p className="text-green-400 font-bold mt-1 font-mono">Verified (5/26/26)</p></div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Mailing & Residence Address</h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-slate-500 font-mono">Home Address</p>
                        <p className="text-white font-bold mt-1">1042 Birchwood Terrace, Suite 300, Boston, MA 02116</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-mono">Mailing Address</p>
                        <p className="text-slate-400 mt-1 italic">Same as primary residence</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div><p className="text-slate-500 font-mono">Date Moved In</p><p className="text-white font-bold mt-1">2021-04-12</p></div>
                        <div><p className="text-slate-500 font-mono">Prior Resident State</p><p className="text-white font-bold mt-1">New York (NY)</p></div>
                      </div>
                    </div>
                  </div>

                  {/* Demographics & Employment */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Filing Demographics & Employment</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><p className="text-slate-500 font-mono">Marital Status</p><p className="text-[#D4AF37] font-bold mt-1">MFJ (Married Jointly)</p></div>
                      <div><p className="text-slate-500 font-mono">Spouse Link</p><p className="text-white hover:underline cursor-pointer font-bold mt-1">{contact.spouse}</p></div>
                      <div><p className="text-slate-500 font-mono">Occupation</p><p className="text-white font-bold mt-1">S-Corp Managing Member</p></div>
                      <div><p className="text-slate-500 font-mono">Self Employed Y/N</p><p className="text-amber-500 font-bold mt-1">Yes (Schedule C)</p></div>
                      <div className="col-span-2"><p className="text-slate-500 font-mono">Attribution Campaign</p><p className="text-white font-mono text-[11px] mt-1 bg-neutral-950 p-2 rounded border border-white/5">facebook_ad_2026_q2_tax_services</p></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TAX PROFILE */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Tax Preparer Profile (IRS View)</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Authorizations, estimated ledgers, and compliance locks</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Preparer & Auth */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Preparer Authorizations</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center p-2.5 bg-neutral-950 rounded-xl border border-white/5">
                        <span className="font-mono text-slate-400 text-[11px]">Form 8821 (Tax Info Auth):</span>
                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 font-bold font-mono text-[10px] rounded">ON FILE</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-neutral-950 rounded-xl border border-white/5">
                        <span className="font-mono text-slate-400 text-[11px]">Form 2848 (Power of Attorney):</span>
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] font-bold font-mono text-[10px] rounded">PENDING RE-SIGN</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-neutral-950 rounded-xl border border-white/5">
                        <span className="font-mono text-slate-400 text-[11px]">E-File Consent Form 8879:</span>
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold font-mono text-[10px] rounded">UNSIGNED</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax situation Flags */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Tax Situation Flags & Triggers</h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { label: 'Self-Employed (Sch C)', active: true },
                        { label: 'Rental Property (Sch E)', active: false },
                        { label: 'Crypto/Digital Assets', active: true },
                        { label: 'Foreign Accounts (FBAR)', active: false },
                        { label: 'Child Tax Credit (CTC)', active: true },
                        { label: 'Solar Energy Credits', active: true },
                        { label: 'Quarterly Estimateds due', active: true }
                      ].map((flag, idx) => (
                        <span 
                          key={idx} 
                          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase border ${
                            flag.active 
                              ? 'bg-amber-500/10 border-amber-500/30 text-[#D4AF37]' 
                              : 'bg-neutral-950 border-white/5 text-slate-500'
                          }`}
                        >
                          {flag.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Quarterly Payments Ledger */}
                  <div className="col-span-1 md:col-span-2 p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Estimated Quarterly Payments Ledger</h3>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 font-mono uppercase text-[10px]">
                          <th className="py-2">Period</th>
                          <th className="py-2">Due Date</th>
                          <th className="py-2">Scheduled Amount</th>
                          <th className="py-2">Date Paid</th>
                          <th className="py-2">E-Confirmation ID</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        <tr>
                          <td className="py-3 font-bold text-white">Q1 - TY2025</td>
                          <td className="py-3 text-slate-300">April 15, 2025</td>
                          <td className="py-3 font-bold text-white">$1,500.00</td>
                          <td className="py-3 text-slate-300">2025-04-12</td>
                          <td className="py-3 text-slate-300">EFTPS-99281a</td>
                          <td className="py-3"><span className="text-green-400 font-bold bg-green-500/5 border border-green-500/20 px-2 py-0.5 rounded-md">VERIFIED</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-white">Q2 - TY2025</td>
                          <td className="py-3 text-slate-300">June 15, 2025</td>
                          <td className="py-3 font-bold text-white">$1,500.00</td>
                          <td className="py-3 text-slate-300">2025-06-14</td>
                          <td className="py-3 text-slate-300">EFTPS-021481</td>
                          <td className="py-3"><span className="text-green-400 font-bold bg-green-500/5 border border-green-500/20 px-2 py-0.5 rounded-md">VERIFIED</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-white">Q3 - TY2025</td>
                          <td className="py-3 text-slate-300">Sept 15, 2025</td>
                          <td className="py-3 font-bold text-white">$1,500.00</td>
                          <td className="py-3 text-slate-400">Not Paid</td>
                          <td className="py-3 text-slate-400">—</td>
                          <td className="py-3"><span className="text-red-400 font-bold bg-red-500/5 border border-red-500/20 px-2 py-0.5 rounded-md">OVERDUE</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DEPENDENTS */}
            {activeTab === 4 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Household Dependents Ledger</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Automated child credit auditing, age constraints, and custody agreements</p>
                  </div>
                  <button 
                    onClick={() => addDependentRow()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Dependent
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 font-mono uppercase text-[10px] py-2">
                          <th className="pb-3">Dependent Legal Name</th>
                          <th className="pb-3">Relationship</th>
                          <th className="pb-3">Date of Birth</th>
                          <th className="pb-3">Months in House</th>
                          <th className="pb-3">Student Status</th>
                          <th className="pb-3">Earned Income</th>
                          <th className="pb-3">Action Check</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {dependents.map((dep, idx) => (
                          <tr key={dep.id}>
                            <td className="py-4 font-bold text-white">{dep.name}</td>
                            <td className="py-4 text-slate-300">{dep.relation}</td>
                            <td className="py-4 text-slate-300">{dep.dob}</td>
                            <td className="py-4 text-slate-300">{dep.months} Months</td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dep.student ? 'bg-green-500/10 text-green-400 border border-green-500/25' : 'bg-neutral-900 text-slate-500'}`}>
                                {dep.student ? 'STUDENT' : 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 text-white font-bold">${dep.income}</td>
                            <td className="py-4">
                              {dep.ageOut ? (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] rounded text-[10px] font-bold" title="Ages out from CTC soon (17yr threshold)">
                                  CTC AGE-OUT ALERT
                                </span>
                              ) : (
                                <span className="text-green-400 font-bold text-[10px]">✓ CTC ACTIVE</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-slate-300">
                    <ShieldAlert className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Compliance Note on Dependents Care:</p>
                      <p className="mt-0.5">Under IRS Pub 503 rules, you must upload custody agreements or childcare provider statement receipts containing their corporate EIN to claim the Dependent Care Tax Credit safely.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: INCOME & DEDUCTIONS */}
            {activeTab === 5 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Income Ledger & Deduction Auditing</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Aggregated IRS reporting statements, tax credit checklists, and OCR values</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Ledger Form Income sources */}
                  <div className="xl:col-span-2 p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">Active Income Records</h3>
                    <div className="space-y-3 font-mono text-xs">
                      {[
                        { form: 'W-2', issuer: 'Smith Consulting LLC (EIN 04-2981a)', wages: '$84,200.00', fedWh: '$12,400.00', status: 'OCR_VERIFIED' },
                        { form: '1099-NEC', issuer: 'Acme Software Corp (EIN 88-12481)', wages: '$32,500.00', fedWh: '$0.00', status: 'OCR_VERIFIED' },
                        { form: '1099-INT', issuer: 'Chase Bank NA', wages: '$1,200.00', fedWh: '$0.00', status: 'OCR_VERIFIED' }
                      ].map((inc, i) => (
                        <div key={i} className="p-3.5 bg-neutral-950 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] font-bold rounded text-[10px]">{inc.form}</span>
                              <span className="text-white font-bold">{inc.issuer}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-[11px] text-slate-400">
                              <span>Wages Box 1: <span className="text-slate-200 font-bold">{inc.wages}</span></span>
                              <span>Federal Wh: <span className="text-slate-200 font-bold">{inc.fedWh}</span></span>
                            </div>
                          </div>
                          <span className="text-green-400 text-[10px] font-bold bg-green-500/5 border border-green-500/20 px-2.5 py-1 rounded-xl">✓ OCR COMPLETED</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deductions & Credits Checklist */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">Credits Checklist & Eligibility</h3>
                    <div className="space-y-3">
                      {[
                        { title: 'Home Office Deduction (Sch C)', verified: true },
                        { title: 'Qualifying Child Credit (CTC)', verified: true },
                        { title: 'HSA Deductible Contribution', verified: true },
                        { title: 'Traditional IRA Deduction', verified: false, action: 'Eligible for $6,500 catch-up' },
                        { title: 'EV Solar Energy Credit', verified: false, action: 'Form 5695 missing details' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs">
                          {item.verified ? (
                            <CheckSquare className="h-4.5 w-4.5 text-[#D4AF37] shrink-0" />
                          ) : (
                            <div className="h-4.5 w-4.5 rounded border border-[#D4AF37]/40 shrink-0 flex items-center justify-center text-[#D4AF37] text-[10px] font-bold font-mono">!</div>
                          )}
                          <div>
                            <p className={`font-semibold ${item.verified ? 'text-slate-200' : 'text-slate-400'}`}>{item.title}</p>
                            {item.action && <p className="text-[10px] font-mono text-[#D4AF37] mt-0.5">{item.action}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: DOCUMENTS */}
            {activeTab === 6 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Secure Cloud Storage R2 Vault</h2>
                    <p className="text-slate-400 text-xs mt-0.5">High-speed OCR file extractions, 7-year legally compliant file retention</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setMissingDocsModal(true)}
                      className="px-3.5 py-2 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37] uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                    >
                      Audit Required Files
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-lg shadow-amber-500/10">
                      <Upload className="h-4 w-4" />
                      Upload File
                    </button>
                  </div>
                </div>

                {/* Missing docs modal/alert inside tab */}
                {missingDocsModal && (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl relative flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold text-white">Missing File Alerts Found:</p>
                      <p className="text-slate-300 mt-1">Our AI scanned your active Tax Profile and flagged three required forms missing to file married jointly safely:</p>
                      <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-300 font-mono">
                        <li>Spouse Jane Smith's W-2 Statement (Employer: Stripe Inc.)</li>
                        <li>Childcare Provider EIN/Receipt statement (Emily childcare)</li>
                        <li>1098 Mortgage Statement (Birchwood Property)</li>
                      </ul>
                      <div className="flex items-center gap-4 pt-3">
                        <button 
                          onClick={() => {
                            setMessages(prev => [
                              ...prev,
                              { id: String(messages.length + 1), channel: 'SMS', direction: 'out', sender: 'Loyce Sterling', text: 'Hi John, I auto-audited your profile. We are missing: W-2 (Stripe), Mortgage 1098, and Childcare EIN details. Please upload these to your portal.', time: 'Just now', status: 'sent' }
                            ]);
                            addTimelineEvent('sms', 'Sent missing documents request to client', 'Notification Hub');
                            setMissingDocsModal(false);
                          }}
                          className="px-3 py-1 bg-amber-500 text-black font-mono font-black text-[10px] uppercase rounded-lg hover:bg-amber-600 transition"
                        >
                          Auto-Send Portal Requests Now
                        </button>
                        <button onClick={() => setMissingDocsModal(false)} className="text-slate-400 hover:text-slate-200">Dismiss Alert</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 font-mono text-xs">
                  {[
                    { name: 'W-2_Smith_John_2025.pdf', size: '154 kB', type: 'W-2 Statement', date: '5/27/2026 10:02 AM', status: 'verified', fields: { Employer: 'Smith Consulting LLC', Box1Wages: '$84,200', Box2Tax: '$12,400' } },
                    { name: '1099-NEC_Acme_Consulting.pdf', size: '280 kB', type: '1099-NEC Form', date: '5/27/2026 09:40 AM', status: 'verified', fields: { Issuer: 'Acme Software', Box1NonEmpComp: '$32,500' } },
                    { name: 'Drivers_License_John_Smith.jpg', size: '1.2 MB', type: 'Identity verification', date: '5/26/2026 12:48 AM', status: 'verified', fields: { LicenseNum: 'S9912048', Exp: '2029-06-18', DOB: '1984-06-18' } }
                  ].map((doc, idx) => (
                    <div key={idx} className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-white font-bold truncate pr-2">{doc.name}</p>
                          <p className="text-[10px] text-slate-500">{doc.size} · Uploaded {doc.date}</p>
                        </div>
                        <span className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-[9px] rounded-full shrink-0">VERIFIED</span>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded-xl border border-white/5 space-y-1 text-[11px]">
                        <p className="text-[#D4AF37] font-bold border-b border-white/5 pb-1 mb-1.5 uppercase text-[9px] tracking-wider">AI OCR Extracted Values</p>
                        {Object.entries(doc.fields).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-400">{key}:</span>
                            <span className="text-slate-200 font-bold">{val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] text-slate-500">Retention: 7 Years (2033)</span>
                        <div className="flex items-center gap-1.5">
                          <button className="p-1.5 bg-neutral-950 border border-white/5 hover:border-amber-500/30 text-slate-300 hover:text-white rounded-lg transition cursor-pointer">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 bg-neutral-950 border border-white/5 hover:border-red-500/30 text-slate-300 hover:text-red-400 rounded-lg transition cursor-pointer">
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: RETURNS HISTORY */}
            {activeTab === 7 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Tax Filing Ledger History</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Past year federal and state returns and e-file transaction logs</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 font-mono uppercase text-[10px] py-2">
                        <th className="pb-3">Tax Year</th>
                        <th className="pb-3">Filing Status</th>
                        <th className="pb-3">Federal AGI</th>
                        <th className="pb-3">Federal Refund/Owed</th>
                        <th className="pb-3">State Status</th>
                        <th className="pb-3">Submission ID</th>
                        <th className="pb-3">Filing Method</th>
                        <th className="pb-3">Full PDF Record</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {[
                        { yr: 'TY2024', status: 'MFJ Jointly', agi: '$112,400.00', fed: 'Refund $4,220.00', state: 'NM Refund $520.00', subId: 'SUB-99281a882', method: 'Direct Deposit' },
                        { yr: 'TY2023', status: 'Single Filing', agi: '$84,500.00', fed: 'Refund $1,890.00', state: 'NY Refund $120.00', subId: 'SUB-21481a021', method: 'Direct Deposit' },
                        { yr: 'TY2022', status: 'Single Filing', agi: '$76,200.00', fed: 'Refund $1,450.00', state: 'NY Refund $80.00', subId: 'SUB-77124f009', method: 'Direct Deposit' }
                      ].map((row, i) => (
                        <tr key={i}>
                          <td className="py-4 font-bold text-white">{row.yr}</td>
                          <td className="py-4 text-slate-300">{row.status}</td>
                          <td className="py-4 text-white font-bold">{row.agi}</td>
                          <td className="py-4 text-green-400 font-black">{row.fed}</td>
                          <td className="py-4 text-green-400 font-bold">{row.state}</td>
                          <td className="py-4 text-slate-400 font-mono text-[11px]">{row.subId}</td>
                          <td className="py-4 text-slate-300">{row.method}</td>
                          <td className="py-4">
                            <button className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 border border-white/5 hover:border-amber-500/20 text-slate-300 hover:text-[#D4AF37] rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px]">
                              <Download className="h-3 w-3" />
                              View PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 8: BANKING & REFUND ROUTING */}
            {activeTab === 8 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Refund Routing & Direct Deposit Banking</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Encrypted bank settlement parameters and advance loan options</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Encrypted Direct Deposit Bank Card */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37]">Primary Refund Bank Account</h3>
                      <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/25 text-green-400 rounded text-[9px] font-mono font-bold uppercase">✓ Plaid Verified</span>
                    </div>

                    <div className="p-4 bg-neutral-950 rounded-2xl border border-white/5 space-y-3 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank Institution:</span>
                        <span className="text-white font-bold">Chase Bank, N.A.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Routing Number (Encrypted):</span>
                        <span className="text-white font-bold">***0210***</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account Number (Encrypted):</span>
                        <span className="text-white font-bold">******4821</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account Type:</span>
                        <span className="text-white font-bold">Checking (Joint Account)</span>
                      </div>
                    </div>
                  </div>

                  {/* Refund Advance options */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">Refund Advance Option (RAL/RAC)</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-2">
                        Client is pre-approved for an EPS Refund Advance Loan up to <span className="text-[#D4AF37] font-bold">$2,500</span>. Fees are automatically deducted from their federal refund directly, with zero upfront out-of-pocket costs.
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl flex items-center justify-between text-xs font-mono mt-4">
                      <div>
                        <p className="font-bold text-white">EPS Refund Advance Program</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Agreement Signed: Not yet</p>
                      </div>
                      <button className="px-3 py-1.5 bg-[#D4AF37] hover:bg-amber-500 text-black font-black text-[10px] uppercase rounded-lg cursor-pointer transition-colors font-mono">
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: CREDIT */}
            {activeTab === 9 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Credit Bureau Dashboard (FCRA Gated)</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Permissible-purpose audit log gates, three-bureau credit repairs, and tradelines</p>
                </div>

                {creditRoleGated ? (
                  <div className="p-8 bg-neutral-900/60 border border-amber-500/25 rounded-3xl text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"></div>
                    <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-[#D4AF37]">
                      <Key className="h-8 w-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-lg font-bold text-white">FCRA Compliance Gated Access</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                        This tab holds credit history and repair data protected under the Credit Repair Organizations Act (CROA) and the FCRA. Viewing requires a logged permissible-purpose signature.
                      </p>
                    </div>

                    <div className="max-w-md mx-auto p-4 bg-neutral-950 border border-white/5 rounded-2xl text-left space-y-3 font-mono text-xs">
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox" 
                          id="permissiblePurposeCheck"
                          checked={permissiblePurposeSigned}
                          onChange={(e) => setPermissiblePurposeSigned(e.target.checked)}
                          className="accent-[#D4AF37] h-4 w-4"
                        />
                        <label htmlFor="permissiblePurposeCheck" className="text-slate-300 font-bold leading-normal">
                          Confirm signed credit authorization is on file.
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Checking this box logs your user account, timestamp, and IP address into the permanent access audit records for regulatory oversight.
                      </p>
                    </div>

                    <button 
                      disabled={!permissiblePurposeSigned}
                      onClick={() => {
                        setCreditRoleGated(false);
                        const now = new Date();
                        setComplianceLogs(prev => [
                          { user: 'Loyce Sterling (Preparer)', accessed: 'CREDIT_PULL', ip: '172.56.42.109', time: now.toLocaleString(), purpose: 'Financial health audit & credit repair pre-screening' },
                          ...prev
                        ]);
                        addTimelineEvent('security', 'Authorized Credit Bureau pull (logged permissible purpose)', 'FCRA Auditing Gated');
                      }}
                      className={`px-6 py-3 font-black text-xs uppercase tracking-wider rounded-xl transition-all font-mono ${
                        permissiblePurposeSigned 
                          ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black shadow-lg shadow-amber-500/10 cursor-pointer' 
                          : 'bg-neutral-800 text-slate-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      Audit & Reveal Credit Dossier
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active credit views */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                      {[
                        { bureau: 'TransUnion', score: '680', trend: 'up', color: 'text-green-400' },
                        { bureau: 'Equifax', score: '672', trend: 'up', color: 'text-green-400' },
                        { bureau: 'Experian', score: '685', trend: 'up', color: 'text-green-400' }
                      ].map((item, idx) => (
                        <div key={idx} className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl text-center space-y-2">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest">{item.bureau} Score</span>
                          <h3 className={`text-4xl font-black ${item.color} font-serif`}>{item.score}</h3>
                          <p className="text-[11px] text-slate-400 font-bold">Good · Soft-pull confirmed</p>
                        </div>
                      ))}
                    </div>

                    {/* Dispute items tracking */}
                    <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37]">Active Credit Repair Dispute Tracker</h3>
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-500 uppercase text-[10px]">
                            <th className="pb-2">Disputed Tradeline</th>
                            <th className="pb-2">Bureau(s)</th>
                            <th className="pb-2">Reason Code</th>
                            <th className="pb-2">Letter Sent Via</th>
                            <th className="pb-2">Sent Date</th>
                            <th className="pb-2">Outcome Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr>
                            <td className="py-3 font-bold text-white">Capital One Charge-off</td>
                            <td className="py-3 text-slate-300">Experian, Equifax</td>
                            <td className="py-3">101 (Not my account)</td>
                            <td className="py-3">Lob (Track #LOB99120)</td>
                            <td className="py-3">2026-05-18</td>
                            <td className="py-3"><span className="text-[#D4AF37] font-bold bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded">PENDING BUREAU RESPONSE</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 font-bold text-white">Medical Bill Collection</td>
                            <td className="py-3">TransUnion</td>
                            <td className="py-3">108 (HIPAA Non-compliant)</td>
                            <td className="py-3">Click2Mail (Track #C2M8812)</td>
                            <td className="py-3">2026-05-10</td>
                            <td className="py-3"><span className="text-green-400 font-bold bg-green-500/5 border border-green-500/20 px-2 py-0.5 rounded">✓ REMOVED / DELETED</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 10: COMMUNICATIONS */}
            {activeTab === 10 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Unified Communications Thread</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Compliant, single-threaded tax communications inbox</p>
                  </div>
                  <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest bg-green-500/5 border border-green-500/25 px-2.5 py-1 rounded-full">
                    ● SMS OUTBOX ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
                  {/* SMS / Chat dialogue area */}
                  <div className="xl:col-span-2 p-5 bg-neutral-900/40 border border-white/5 rounded-2xl flex flex-col justify-between h-[450px]">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                      {messages.map((msg, i) => (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col max-w-[80%] ${msg.direction === 'out' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            msg.direction === 'out' 
                              ? 'bg-gradient-to-r from-amber-500/10 to-[#D4AF37]/15 border border-[#D4AF37]/30 text-white rounded-br-none' 
                              : 'bg-neutral-950 border border-white/5 text-slate-200 rounded-bl-none'
                          }`}>
                            <p className="font-bold text-[10px] text-[#D4AF37] mb-1 font-mono">{msg.sender} · {msg.channel}</p>
                            <p className="whitespace-pre-line font-medium leading-relaxed">{msg.text}</p>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 mt-1">{msg.time} {msg.status && `· ${msg.status}`}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                      <input 
                        type="text" 
                        placeholder="Write responsive text message to John..."
                        value={smsInput}
                        onChange={(e) => setSmsInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-neutral-950 border border-white/5 hover:border-amber-500/15 focus:border-[#D4AF37]/40 outline-none p-3 text-xs font-sans text-white rounded-xl placeholder-slate-500 transition-colors"
                      />
                      <button 
                        onClick={() => handleSendMessage()}
                        className="p-3 bg-[#D4AF37] hover:bg-amber-500 text-black rounded-xl transition cursor-pointer shrink-0 shadow-lg shadow-amber-500/5"
                        title="Send Message"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* AI Composer panel side */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                        <h3 className="text-xs font-mono font-bold uppercase text-white">AI Compliance Responder</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                        Need to compile a quick request for outstanding forms or general follow-ups? Our AI compliance engine automatically builds fully on-brand, TCPA-compliant messaging drafts based on the active dossier timeline.
                      </p>
                    </div>

                    <button 
                      onClick={() => triggerAIDraft()}
                      className="w-full py-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-xs font-black text-[#D4AF37] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 font-mono"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate Compliance Draft
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 11: NOTES */}
            {activeTab === 11 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Taxpayer Notes & Audit Files</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Rich text annotations, team @mentions, and AI quick summaries</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/20 text-xs font-bold text-[#D4AF37] uppercase tracking-wider rounded-xl cursor-pointer transition-colors">
                    <Plus className="h-4 w-4" />
                    New Rich Note
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
                  {/* Left Column - Notes List */}
                  <div className="xl:col-span-2 space-y-4">
                    {/* Add note text form */}
                    <div className="p-4 bg-neutral-900/30 border border-white/5 rounded-2xl flex flex-col gap-3">
                      <textarea 
                        placeholder="Write a secure note (markdown supported, use @teammate to alert)..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteNoteText(e.target.value)}
                        className="w-full h-20 bg-neutral-950/80 border border-white/5 focus:border-[#D4AF37]/40 outline-none p-3 text-xs text-white rounded-xl placeholder-slate-500 transition-colors"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-mono">Visibility: Team (Preparers/Reviewers)</span>
                        <button 
                          onClick={() => {
                            if (!newNoteText.trim()) return;
                            const noteObj = {
                              id: String(notes.length + 1),
                              author: 'Loyce Sterling',
                              avatar: 'LS',
                              content: newNoteText,
                              date: 'Just now',
                              pinned: false,
                              visibility: 'team',
                              tags: ['general']
                            };
                            setNotes([noteObj, ...notes]);
                            addTimelineEvent('system', 'Created personal tax note (CRM file)', 'CRM Rich Text');
                            setNewNoteNoteText('');
                          }}
                          className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-all shadow-md"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl space-y-3 relative">
                          {note.pinned && <span className="absolute top-4 right-4 bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] text-[8px] font-mono font-bold px-2 py-0.5 rounded-full">PINNED</span>}
                          <div className="flex items-center gap-2.5 border-b border-white/5 pb-2">
                            <div className="w-7 h-7 rounded-lg bg-neutral-950 border border-white/10 flex items-center justify-center font-bold text-xs text-[#D4AF37]">
                              {note.avatar}
                            </div>
                            <div>
                              <p className="text-white text-xs font-bold">{note.author}</p>
                              <p className="text-[9px] text-slate-500 font-mono">{note.date}</p>
                            </div>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed font-medium">{note.content}</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {note.tags.map((t: string) => (
                              <span key={t} className="px-2 py-0.5 bg-neutral-950 border border-white/5 text-slate-400 font-mono text-[9px] rounded-md uppercase">#{t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - AI Note Digest Summary */}
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl flex flex-col justify-between h-fit space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                        <h3 className="text-xs font-mono font-bold uppercase text-white">AI Note Summary Engine</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                        Instantly summarize all notes to extract key tax situations, pending items, or status overrides since the last filing review.
                      </p>
                      
                      <div className="p-3 bg-neutral-950 border border-[#D4AF37]/10 rounded-xl space-y-2 text-xs font-sans leading-relaxed">
                        <p className="font-bold text-[#D4AF37] font-serif uppercase tracking-wider text-[9px]">Summary Overview</p>
                        <p className="text-slate-300">Client John Smith Jr. is completing a transition from Single to Married Jointly (MFJ) filing status for TY2025. Key planning actions focus on securing spouse Jane's outstanding W-2 statement and performing a Schedule C QBI audit check.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 12: TASKS */}
            {activeTab === 12 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Taxpayer Action Tasks</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Assigned work items, regulatory tax deadlines, and completion checklists</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/20 text-xs font-bold text-[#D4AF37] uppercase tracking-wider rounded-xl cursor-pointer transition-colors">
                    <Plus className="h-4 w-4" />
                    New Action Task
                  </button>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`p-4 bg-neutral-900/40 border rounded-2xl flex items-center justify-between gap-4 hover:border-amber-500/20 transition-all ${
                        task.status === 'done' ? 'opacity-50 border-white/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => {
                            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t));
                            addTimelineEvent('system', `Task status toggled: "${task.title}"`, 'Task Handler');
                          }}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition cursor-pointer shrink-0 mt-0.5 ${
                            task.status === 'done' 
                              ? 'bg-amber-500/10 border-[#D4AF37] text-[#D4AF37]' 
                              : 'border-white/20 hover:border-[#D4AF37]/50 text-transparent'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <div>
                          <p className={`font-bold text-white ${task.status === 'done' && 'line-through text-slate-500'}`}>{task.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-sans leading-normal">{task.desc}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">Due Date: <span className="text-slate-300 font-bold">{task.due}</span></p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        task.priority === 'urgent' 
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                          : task.priority === 'high'
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          : 'bg-neutral-950 border border-white/5 text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 13: TIMELINE */}
            {activeTab === 13 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Immutable 7-Year Audit Trail Timeline</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Comprehensive, legally binding timeline of all client portal interactions and modifications</p>
                </div>

                <div className="space-y-6 font-mono text-xs relative pl-4 border-l border-white/5 ml-2 pt-2">
                  {timeline.map((item, idx) => (
                    <div key={item.id} className="relative space-y-1">
                      {/* Node circle */}
                      <span className="absolute -left-[20px] top-1 h-2.5 w-2.5 rounded-full bg-neutral-950 border border-[#D4AF37] ring-4 ring-[#030712] z-10"></span>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-slate-500">{item.time}</span>
                        <span className="px-2 py-0.5 bg-neutral-900 border border-white/5 text-[#D4AF37] text-[8px] font-bold rounded uppercase">
                          {item.type}
                        </span>
                        <span className="text-slate-400">· Actioned by: <span className="text-slate-200 font-bold">{item.user}</span></span>
                      </div>
                      <p className="text-white font-bold text-xs">{item.text}</p>
                      {item.subtext && <p className="text-[10px] text-slate-500 italic font-sans">{item.subtext}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 14: BILLING */}
            {activeTab === 14 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">Filing Billing & Accounting Statement</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Corporate Stripe invoicing records, card setups, and active retainer subscriptions</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Lifetime Fees Billed</span>
                    <h3 className="text-3xl font-black text-white font-serif">$2,850.00</h3>
                    <p className="text-green-400 text-[10px] font-bold">100% Collected</p>
                  </div>
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Retainer Subscription</span>
                    <h3 className="text-3xl font-black text-[#D4AF37] font-serif">$125.00/mo</h3>
                    <p className="text-slate-400 text-[10px] font-bold">Quarterly Tax Review Plan</p>
                  </div>
                  <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Stripe Payment Method</span>
                    <h3 className="text-xl font-bold text-white mt-2 flex items-center justify-center gap-1.5">
                      <CreditCard className="h-5 w-5 text-[#D4AF37]" />
                      Visa ···· 4821
                    </h3>
                    <p className="text-slate-400 text-[10px] font-bold">Expires: 11/2028</p>
                  </div>
                </div>

                <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">Invoice Registry</h3>
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 uppercase text-[10px]">
                        <th className="pb-2">Invoice #</th>
                        <th className="pb-2">Issue Date</th>
                        <th className="pb-2">Filing Products</th>
                        <th className="pb-2">Total Amount</th>
                        <th className="pb-2">Stripe Status</th>
                        <th className="pb-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="py-3 font-bold text-white">INV-2025-0912</td>
                        <td className="py-3 text-slate-300">2025-05-12</td>
                        <td className="py-3 text-slate-300">Form 1040 & Schedule C Prep</td>
                        <td className="py-3 font-bold text-white">$450.00</td>
                        <td className="py-3"><span className="text-green-400 font-bold bg-green-500/5 border border-green-500/20 px-2 py-0.5 rounded">PAID via STRIPE</span></td>
                        <td className="py-3"><span className="text-slate-500 hover:text-white cursor-pointer hover:underline">View Stripe Invoice</span></td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-white">INV-2025-0401</td>
                        <td className="py-3 text-slate-300">2025-04-15</td>
                        <td className="py-3 text-slate-300">Q1 Quarterly Estimated Review</td>
                        <td className="py-3 font-bold text-white">$125.00</td>
                        <td className="py-3"><span className="text-green-400 font-bold bg-green-500/5 border border-green-500/20 px-2 py-0.5 rounded">PAID via ACH</span></td>
                        <td className="py-3"><span className="text-slate-500 hover:text-white cursor-pointer hover:underline">View Stripe Invoice</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 15: COMPLIANCE */}
            {activeTab === 15 && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider text-[#D4AF37]">GLBA Security & Regulatory Compliance</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Access compliance logs, legal hold configurations, and consumer rights registers</p>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
                </div>

                <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">Active Compliance Consents Held</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-3 bg-neutral-950 rounded-xl border border-white/5">
                      <p className="text-slate-500 text-[10px]">TCPA SMS CONSENT</p>
                      <p className="text-green-400 font-bold mt-1">✓ ACTIVE AGREED</p>
                      <p className="text-[10px] text-slate-500 mt-1">IP: 185.34.2.19</p>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded-xl border border-white/5">
                      <p className="text-slate-500 text-[10px]">CAN-SPAM OPT-IN</p>
                      <p className="text-green-400 font-bold mt-1">✓ ACTIVE AGREED</p>
                      <p className="text-[10px] text-slate-500 mt-1">2026-05-26 12:46 AM</p>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded-xl border border-white/5">
                      <p className="text-slate-500 text-[10px]">FCRA AUTHORIZATION</p>
                      <p className="text-green-400 font-bold mt-1">✓ ACTIVE AGREED</p>
                      <p className="text-[10px] text-slate-500 mt-1">Signed via Verifyle</p>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded-xl border border-white/5">
                      <p className="text-slate-500 text-[10px]">IRS Form 8879 SIGNED</p>
                      <p className="text-red-400 font-bold mt-1">✗ NOT SIGNED YET</p>
                      <p className="text-[10px] text-slate-500 mt-1">Filing Authorization</p>
                    </div>
                  </div>
                </div>

                {/* Audit reveal logs table */}
                <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">PII Data Access Registry (Access Audits)</h3>
                    <span className="text-[10px] font-mono text-[#D4AF37] uppercase bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">Immutable Log</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 uppercase text-[10px]">
                          <th className="pb-2">Reviewer/User</th>
                          <th className="pb-2">Accessed Field</th>
                          <th className="pb-2">IP Address</th>
                          <th className="pb-2">Timestamp</th>
                          <th className="pb-2">Purpose Justification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {complianceLogs.map((log, i) => (
                          <tr key={i}>
                            <td className="py-3 font-bold text-white">{log.user}</td>
                            <td className="py-3"><span className="text-[#D4AF37] font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">{log.accessed}</span></td>
                            <td className="py-3 text-slate-300">{log.ip}</td>
                            <td className="py-3 text-slate-300">{log.time}</td>
                            <td className="py-3 text-slate-300 font-sans">{log.purpose}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR COMPONENT: SMART WIDGETS (1/4 space) */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Tags Widget */}
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Client Smart Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {['lead', 'high-value', 's-corp', 'multi-state', 'crypto-active', 'has-dependents'].map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-neutral-900 border border-white/5 text-slate-300 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider">
                  {tag}
                </span>
              ))}
              <button className="px-2.5 py-1 border border-dashed border-amber-500/20 rounded-lg text-[10px] font-mono font-bold text-amber-500/60 hover:text-amber-400 hover:border-amber-500/40 transition-colors uppercase cursor-pointer">
                + Tag
              </button>
            </div>
          </div>

          {/* Connected Household Spouse, dependents, referrers */}
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Connected Contacts</h3>
            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between p-2.5 bg-neutral-900/50 border border-white/5 rounded-xl">
                <div>
                  <p className="font-bold text-white">Jane Smith</p>
                  <p className="text-[10px] text-slate-500 font-mono">Spouse (MFJ Link)</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-neutral-900/50 border border-white/5 rounded-xl">
                <div>
                  <p className="font-bold text-white">John Smith III</p>
                  <p className="text-[10px] text-slate-500 font-mono">Dependent (Son)</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-neutral-900/50 border border-white/5 rounded-xl">
                <div>
                  <p className="font-bold text-white">Emily Smith</p>
                  <p className="text-[10px] text-slate-500 font-mono">Dependent (Daughter)</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-neutral-900/50 border border-white/5 rounded-xl">
                <div>
                  <p className="font-bold text-white">Marcus Vance</p>
                  <p className="text-[10px] text-slate-500 font-mono">Referrer contact</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
              </div>
            </div>
          </div>

          {/* Custom profile fields */}
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-2">Custom Profile Fields</h3>
            <div className="space-y-3 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Bookkeeping client?</span>
                <span className="text-white font-bold">Yes (Retainer)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Annual Review call?</span>
                <span className="text-white font-bold">Scheduled 6/2</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>White-labeled host:</span>
                <span className="text-[#D4AF37] font-bold">Sub-Account A</span>
              </div>
            </div>
          </div>

          {/* Quick AI Advisor Assistant Widget */}
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">AI Year-Round Advisor</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              "We have compiled 8 files for Joint Filing. Ensure spouse Jane\'s Stripe W-2 is collected so we can optimize the Schedule C deduction before filing. Score risk is very low."
            </p>
            <div className="pt-2 font-mono text-[10px] text-[#D4AF37] flex items-center justify-between border-t border-white/5">
              <span>Auditing risk score:</span>
              <span className="font-bold">12 / 100 (Safe)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
