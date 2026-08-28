import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { scheduleCampaign } from '../utils/engine';
import { useAppStore } from '../store';
import {
  Plus, Mail, MessageSquare, Send, BarChart3, Clock, CheckCircle, PauseCircle,
  Layers, ChevronDown, ChevronRight, Download, Target, Users, CalendarClock,
  Zap, ArrowRight, GitBranch, Sparkles, ShieldCheck
} from 'lucide-react';
import AIPromptBar from '../components/layout/AIPromptBar';
import { DRIP_LIBRARY, DripTemplate, installDripTemplate } from '../utils/dripLibrary';
import { Campaign, DripStep } from '../types';

const CATEGORY_META: Record<DripTemplate['category'], { label: string; color: string }> = {
  acquisition: { label: 'Acquisition', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  onboarding: { label: 'Onboarding', color: 'text-blue-400 bg-blue-500/10 border-blue-500/25' },
  tax_season: { label: 'Tax Season', color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
  post_filing: { label: 'Post-Filing', color: 'text-purple-400 bg-purple-500/10 border-purple-500/25' },
  reactivation: { label: 'Win-Back', color: 'text-rose-400 bg-rose-500/10 border-rose-500/25' },
  referral: { label: 'Referral', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25' },
  compliance: { label: 'Compliance', color: 'text-red-400 bg-red-500/10 border-red-500/25' },
  appointments: { label: 'Appointments', color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/25' },
};

function StepCard({ step, isLast }: { step: DripStep; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const isEmail = step.channel === 'email';
  return (
    <div className="relative pl-10">
      {/* Timeline spine */}
      {!isLast && <div className="absolute left-[15px] top-9 bottom-0 w-px bg-gradient-to-b from-amber-500/40 to-neutral-800" />}
      <div className={`absolute left-0 top-1.5 h-8 w-8 rounded-full border flex items-center justify-center ${isEmail ? 'bg-amber-500/10 border-amber-500/40 text-[#D4AF37]' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'}`}>
        {isEmail ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
      </div>
      <div className="mb-4 bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden hover:border-amber-500/25 transition-colors">
        <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black font-mono text-neutral-950 bg-[#D4AF37] px-2 py-0.5 rounded-md uppercase">
                Day {step.day}{step.sendAt ? ` · ${step.sendAt}` : ''}
              </span>
              <span className={`text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded-md border ${isEmail ? 'text-amber-400 border-amber-500/25 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'}`}>
                {step.channel}
              </span>
              {step.exitOn && step.exitOn !== 'none' && (
                <span className="text-[9px] font-mono text-slate-500 uppercase">exits on: {step.exitOn}</span>
              )}
            </div>
            <p className="text-sm font-bold text-white mt-1 truncate">
              {isEmail ? step.subject : `SMS · ${step.body.slice(0, 70)}…`}
            </p>
            {isEmail && step.preheader && <p className="text-[11px] text-slate-500 truncate">{step.preheader}</p>}
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
        </button>
        {open && (
          <div className="px-4 pb-4 space-y-3 border-t border-neutral-800/70 pt-3">
            {step.strategyNote && (
              <div className="flex items-start gap-2 text-[11px] text-cyan-300/90 bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><b className="font-black">Strategy:</b> {step.strategyNote}</span>
              </div>
            )}
            <pre className="whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-sans bg-neutral-950/70 border border-neutral-800 rounded-lg p-4">{step.body}</pre>
            {step.cta && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono">CTA:</span>
                <span className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-lg text-[11px]">{step.cta.label}</span>
                <span className="text-slate-600 font-mono text-[10px]">{step.cta.href}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DripTemplateCard({ tpl, installed, onInstall }: { tpl: DripTemplate; installed: boolean; onInstall: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const emails = tpl.steps.filter(s => s.channel === 'email').length;
  const sms = tpl.steps.filter(s => s.channel === 'sms').length;
  const meta = CATEGORY_META[tpl.category];
  const totalWords = tpl.steps.reduce((n, s) => n + s.body.split(/\s+/).length, 0);
  return (
    <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 overflow-hidden shadow-xl">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 text-[9px] font-black font-mono uppercase rounded-lg border ${meta.color}`}>{meta.label}</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">{tpl.durationDays} days · {tpl.steps.length} touches · {emails} emails · {sms} SMS · {totalWords.toLocaleString()} words of copy</span>
            </div>
            <h3 className="text-lg font-black text-white mt-2">{tpl.name}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{tpl.description}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-400"><Target className="h-3.5 w-3.5 text-[#D4AF37]" /> <b className="text-slate-300">Goal:</b> {tpl.goal}</span>
              <span className="flex items-center gap-1.5 text-slate-400"><Users className="h-3.5 w-3.5 text-[#D4AF37]" /> <b className="text-slate-300">Audience:</b> {tpl.audience}</span>
              <span className="flex items-center gap-1.5 text-slate-400"><Zap className="h-3.5 w-3.5 text-[#D4AF37]" /> <b className="text-slate-300">Auto-trigger:</b> {tpl.recommendedTrigger}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-2.5 text-xs font-black rounded-xl border border-neutral-800 bg-neutral-900/40 text-slate-300 hover:text-white hover:border-amber-500/30 transition-all flex items-center gap-1.5"
            >
              <GitBranch className="h-3.5 w-3.5" /> {expanded ? 'Hide' : 'View'} Full Sequence
            </button>
            <button
              onClick={onInstall}
              disabled={installed}
              className={`px-4 py-2.5 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${installed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 cursor-default' : 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black shadow-md'}`}
            >
              {installed ? <><CheckCircle className="h-3.5 w-3.5" /> Installed</> : <><Download className="h-3.5 w-3.5" /> Install Campaign</>}
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-neutral-900 bg-neutral-950/40 px-6 py-6">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-mono mb-4">Complete sequence — every message, in order</p>
          {tpl.steps.map((s, i) => <StepCard key={s.id} step={s} isLast={i === tpl.steps.length - 1} />)}
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { campaigns, addCampaign, addNotification, currentSubAccount } = useAppStore();
  const view = (searchParams.get('view') as 'active' | 'library') || (campaigns.length === 0 ? 'library' : 'active');
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  const [sendState, setSendState] = useState<Record<string, string>>({});

  /** Queue a real send through the edge engine (D1 → cron tick → provider). */
  const dispatchCampaign = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSendState((p) => ({ ...p, [id]: 'sending' }));
    const res = await scheduleCampaign(id);
    const data: any = res.data || {};
    setSendState((p) => ({
      ...p,
      [id]: res.ok
        ? `queued ${data.recipients ?? ''} recipient${data.recipients === 1 ? '' : 's'}`
        : (data.hint || data.error || 'backend not configured'),
    }));
  };


  const installedTemplateIds = useMemo(() => new Set(campaigns.map(c => c.sourceTemplateId).filter(Boolean)), [campaigns]);
  const filteredCampaigns = filter === 'all' ? campaigns : campaigns.filter((c) => c.status === filter);
  const filteredLibrary = catFilter === 'all' ? DRIP_LIBRARY : DRIP_LIBRARY.filter(t => t.category === catFilter);

  const handleInstall = (tpl: DripTemplate) => {
    const campaign = installDripTemplate(tpl, currentSubAccount?.id);
    addCampaign(campaign as Campaign);
    addNotification({
      id: `n-${Date.now()}`,
      title: 'Drip campaign installed',
      message: `"${tpl.name}" — ${tpl.steps.length} touches over ${tpl.durationDays} days is now in your campaigns as a draft. Activate it or wire it to its trigger in Workflows.`,
      type: 'success',
      read: false,
      createdAt: new Date(),
    });
    setSearchParams({ view: 'active' });
  };

  const installAll = () => {
    let n = 0;
    DRIP_LIBRARY.forEach(tpl => {
      if (!installedTemplateIds.has(tpl.id)) { handleInstall(tpl); n++; }
    });
    if (n === 0) setSearchParams({ view: 'active' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-neutral-900 text-slate-400 border border-neutral-800';
      case 'scheduled': return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'sending': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      case 'completed': return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      case 'paused': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25';
      default: return 'bg-neutral-900 text-slate-400 border border-neutral-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return <Send className="h-3.5 w-3.5 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'paused': return <PauseCircle className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const totalSteps = DRIP_LIBRARY.reduce((n, t) => n + t.steps.length, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-[#D4AF37] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            RJ Business Solutions outreach
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">Campaigns & Drip Sequences</h1>
          <p className="text-slate-400 text-sm mt-1">
            {DRIP_LIBRARY.length} complete tax-industry drip sequences · {totalSteps} fully-written touches · every email and SMS ready to send
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={installAll} className="flex items-center gap-1.5 px-4 py-2.5 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-[#D4AF37] font-black rounded-xl text-xs transition-all active:scale-95">
            <Layers className="h-4 w-4" /> Install All {DRIP_LIBRARY.length}
          </button>
          <button onClick={() => navigate('/campaigns/new')} className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl text-xs shadow-md transition-all active:scale-95">
            <Plus className="h-4.5 w-4.5" /> New Campaign
          </button>
        </div>
      </div>

      <AIPromptBar
        moduleName="outreach campaigns"
        placeholder="Prompt the AI to write and configure an outreach campaign (e.g. S-Corp Q2 tax filing reminders for business owners)..."
      />

      {/* View switcher */}
      <div className="flex gap-2">
        {([
          { id: 'library', label: `Drip Library (${DRIP_LIBRARY.length})`, icon: Layers },
          { id: 'active', label: `My Campaigns (${campaigns.length})`, icon: Send },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setSearchParams({ view: t.id })}
            className={`px-5 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-2 ${view === t.id ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37] shadow-md' : 'bg-neutral-900/40 border-neutral-800 text-slate-400 hover:text-white'}`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {view === 'library' && (
        <>
          {/* Lifecycle map */}
          <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 p-6 shadow-xl">
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> The client lifecycle — every stage covered, every hand-off wired
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              {['New Lead → Booked Call', 'Onboarding & Docs', 'Season Filing Push', 'Refund Concierge', 'Referral Engine'].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-300">{s}</span>
                  {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-600" />}
                </span>
              ))}
              <span className="text-slate-500 font-mono text-[10px] ml-2">+ Appointment Guard, Win-Back & Compliance Guardian running in parallel</span>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCatFilter('all')} className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${catFilter === 'all' ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37]' : 'bg-neutral-900/40 border-neutral-800 text-slate-400 hover:text-white'}`}>All</button>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <button key={k} onClick={() => setCatFilter(k)} className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${catFilter === k ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37]' : 'bg-neutral-900/40 border-neutral-800 text-slate-400 hover:text-white'}`}>{v.label}</button>
            ))}
          </div>

          <div className="space-y-5">
            {filteredLibrary.map(tpl => (
              <DripTemplateCard key={tpl.id} tpl={tpl} installed={installedTemplateIds.has(tpl.id)} onInstall={() => handleInstall(tpl)} />
            ))}
          </div>
        </>
      )}

      {view === 'active' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Active Sequences', count: campaigns.filter((c) => !!c.sequence).length, icon: GitBranch, color: 'text-amber-400 bg-amber-500/10 border-amber-500/10' },
              { label: 'Total Touches Loaded', count: campaigns.reduce((n, c) => n + (c.sequence?.length || 1), 0), icon: CalendarClock, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' },
              { label: 'Total Recipients', count: campaigns.reduce((sum, c) => sum + c.recipientCount, 0), icon: Mail, color: 'text-blue-500/10 text-blue-400 bg-blue-500/10 border-blue-500/10' },
              { label: 'Total Opens', count: campaigns.reduce((sum, c) => sum + c.openedCount, 0), icon: BarChart3, color: 'text-purple-400 bg-purple-500/10 border-purple-500/10' },
            ].map((stat, i) => (
              <div key={i} className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 p-5 flex items-center gap-4 shadow-md">
                <div className={`p-3 rounded-xl ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-black text-white tracking-tight">{stat.count}</p>
                  <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'draft', 'scheduled', 'sending', 'completed'].map((status) => (
              <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${filter === status ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37] shadow-md' : 'bg-neutral-900/40 border-neutral-800 text-slate-400 hover:text-white'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 overflow-hidden shadow-xl">
            <div className="divide-y divide-neutral-900">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} onClick={() => navigate(`/campaigns/${campaign.id}`)} className="p-6 hover:bg-amber-500/5 cursor-pointer transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/25">
                        {campaign.sequence ? <GitBranch className="h-4.5 w-4.5 text-[#D4AF37]" /> : campaign.type === 'sms' ? <MessageSquare className="h-4.5 w-4.5 text-[#D4AF37]" /> : <Mail className="h-4.5 w-4.5 text-[#D4AF37]" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-bold text-white text-base hover:text-[#D4AF37] transition-colors">{campaign.name}</h3>
                          <span className={`px-2.5 py-0.5 text-[9px] font-black font-mono uppercase rounded-lg flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)} {campaign.status}
                          </span>
                          {campaign.sequence && (
                            <span className="px-2.5 py-0.5 text-[9px] font-black font-mono uppercase rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                              {campaign.sequence.length}-step drip
                            </span>
                          )}
                        </div>
                        {campaign.goal && <p className="text-xs text-slate-400 mt-1.5">Goal: <span className="text-slate-300 font-semibold">{campaign.goal}</span></p>}
                        {!campaign.goal && campaign.subject && <p className="text-xs text-slate-400 mt-1.5">Subject: <span className="text-slate-300 font-semibold">{campaign.subject}</span></p>}
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
                          <span className="font-mono text-slate-300 font-semibold">{campaign.recipientCount} recipients</span>
                          {campaign.sequence && <><span className="text-neutral-800">•</span><span className="font-mono text-amber-400 font-semibold">{campaign.sequence.filter(s => s.channel === 'email').length} emails · {campaign.sequence.filter(s => s.channel === 'sms').length} SMS</span></>}
                          {campaign.sentCount > 0 && <><span className="text-neutral-800">•</span><span className="font-mono text-emerald-400 font-semibold">{campaign.openedCount} opens</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right text-xs text-slate-400 font-mono self-end md:self-center space-y-2">
                      <button
                        onClick={(e) => dispatchCampaign(e, campaign.id)}
                        disabled={sendState[campaign.id] === 'sending'}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
                        title="Materialize recipients in D1 and deliver on the next engine tick"
                      >
                        {sendState[campaign.id] === 'sending' ? 'Queueing…' : 'Send now'}
                      </button>
                      {sendState[campaign.id] && sendState[campaign.id] !== 'sending' && (
                        <p className="text-[10px] text-amber-400 max-w-[220px] truncate">{sendState[campaign.id]}</p>
                      )}
                      <p>Created: {new Date(campaign.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                      {campaign.audience && <p className="text-slate-500 max-w-[240px] truncate">{campaign.audience}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredCampaigns.length === 0 && (
              <div className="text-center py-16 space-y-4">
                <Mail className="h-10 w-10 text-slate-500 mx-auto" />
                <p className="text-slate-400 text-xs">No campaigns yet — install ready-to-send sequences from the Drip Library.</p>
                <button onClick={() => setSearchParams({ view: 'library' })} className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl text-xs">Open Drip Library</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
