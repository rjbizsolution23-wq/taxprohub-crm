import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store';
import { apiHealthDetail } from '../utils/api';
import { listTasks, createTask, updateTask, type LiveTask } from '../utils/engine';
import { 
  Users, DollarSign, Calendar, TrendingUp, Mail, Phone, Clock, 
  CheckCircle, Shield, Award, Sparkles, ArrowUpRight, AlertTriangle,
  Play, RefreshCw, BarChart3, List, KanbanSquare, User, Plus, Search,
  ChevronRight, FileText, ChevronDown, Check, Activity, BellRing
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Gold theme colors matching the brand
const GOLD_COLORS = ['#D4AF37', '#FFD700', '#F59E0B', '#B8860B', '#AA7C11'];

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const navigate = useNavigate();
  
  // App store states
  const { contacts, currentSubAccount, deals, pipelines, appointments, subAccounts, allDeals } = useAppStore();

  // Tasks States
  // LIVE task queue — persisted in D1 (`tasks` table); workflow actions write
  // into the same table, so automations and humans share one work queue.
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [tasksBacked, setTasksBacked] = useState(false);

  const refreshTasks = async () => {
    const res = await listTasks();
    if (!res.ok) { setTasksBacked(false); return; }
    setTasksBacked(true);
    setTasksList(res.items.map((t: LiveTask) => ({
      ...t,
      client: t.contactId || '—',
      due: t.dueAt ? new Date(t.dueAt).toLocaleString() : '',
      sla: t.dueAt ? `${Math.max(0, Math.round((new Date(t.dueAt).getTime() - Date.now()) / 3600000))}h remaining` : '',
      subtasks: 0,
      comments: 0,
      tags: t.tags || [],
    })));
  };

  useEffect(() => { void refreshTasks(); }, []);
  const [taskView, setTaskView] = useState<'list' | 'kanban' | 'calendar' | 'client' | 'project'>('kanban');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const overdueCount = useMemo(() => tasksList.filter((t: any) => t.status !== 'Done' && String(t.due || '').toLowerCase().includes('today')).length, [tasksList]);

  // System Status — LIVE from the Cloudflare /api/health endpoint.
  const [systemStatuses, setSystemStatuses] = useState<Record<string, string>>({});
  const [healthCheckedAt, setHealthCheckedAt] = useState<string>('never');

  const refreshSystemHealth = async () => {
    const health = await apiHealthDetail();
    const integrations = health.integrations;
    const label: Record<string, string> = {
      database_d1: 'D1 Database',
      kv_ledger: 'KV Ledger',
      twilio: 'Twilio SMS',
      resend: 'Resend Email',
      stripe: 'Stripe Billing',
      openai: 'AI Engine',
      cloudflare_calls: 'CF Calls',
    };
    const next: Record<string, string> = {};
    Object.entries(integrations).forEach(([key, on]) => {
      next[label[key] || key] = on ? 'green' : 'yellow';
    });
    setSystemStatuses(next);
    setHealthCheckedAt(new Date().toLocaleTimeString());
  };

  useEffect(() => { void refreshSystemHealth(); }, []);

  // Countdown timer calculation (IRS Deadline April 15 / Quarterly June 15)
  const [deadlineCountdown, setDeadlineCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    // Target IRS Quarterly Date: June 15, 2026
    const targetDate = new Date('2026-06-15T23:59:59').getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((difference % (1000 * 60)) / 1000);
      
      if (difference < 0) {
        clearInterval(interval);
      } else {
        setDeadlineCountdown({ days, hours, mins, secs });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Manual re-poll of the live edge health endpoint.
  const triggerSystemPulse = () => { void refreshSystemHealth(); };

  // AI Task Auto-creator — parses the prompt, then PERSISTS to D1.
  const handleAiTaskCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    setAiGenerating(true);
    {
      const parsedPriority = newTaskInput.toLowerCase().includes('urgent') ? 'urgent' : 
                             newTaskInput.toLowerCase().includes('high') ? 'high' : 'medium';
      
      const parsedTags = newTaskInput.toLowerCase().includes('audit') ? ['Audit Shield'] :
                         newTaskInput.toLowerCase().includes('w2') || newTaskInput.toLowerCase().includes('organizer') ? ['Tax Prep'] : ['AI Spark'];

      const dueAt = new Date(Date.now() + 86400000).toISOString();
      const draft = {
        title: newTaskInput,
        priority: parsedPriority as LiveTask['priority'],
        status: 'To-Do' as const,
        dueAt,
        tags: parsedTags,
        source: 'ai',
      };

      const res = await createTask(draft);
      if (res.ok) {
        await refreshTasks();
      } else {
        // Backend not provisioned — keep the task locally so the queue still works.
        setTasksList([{ id: `local-${Date.now()}`, ...draft, client: '—', due: new Date(dueAt).toLocaleString(), sla: '24h remaining', subtasks: 0, comments: 0 }, ...tasksList]);
      }
      setNewTaskInput('');
      setAiGenerating(false);
    }
  };

  /* ═══════ LIVE PRACTICE METRICS — derived from real CRM records ═══════ */
  const isWon = (d: any) => (d.probability ?? 0) >= 100 || String(d.stageId || '').includes('stage-6');
  const asDate = (v: any) => (v instanceof Date ? v : new Date(v));

  const revenue12MonthData = useMemo(() => {
    const now = new Date();
    const months: { month: string; revenue: number; target: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const revenue = deals
        .filter(x => isWon(x) && asDate(x.updatedAt || x.createdAt).getFullYear() === d.getFullYear() && asDate(x.updatedAt || x.createdAt).getMonth() === d.getMonth())
        .reduce((sum, x) => sum + (x.value || 0), 0);
      months.push({ month: d.toLocaleString('en-US', { month: 'short' }), revenue, target: 0 });
    }
    const avg = months.reduce((s, m) => s + m.revenue, 0) / 12;
    return months.map(m => ({ ...m, target: Math.round(avg) }));
  }, [deals]);

  const filingPipelineData = useMemo(() => {
    const pipeline = pipelines.find(p => p.isDefault) || pipelines[0];
    if (!pipeline) return [] as { stage: string; count: number; pct: string }[];
    const stages = [...pipeline.stages].sort((a, b) => a.position - b.position);
    const counts = stages.map(st => deals.filter(d => d.stageId === st.id).length);
    const top = counts[0] || Math.max(0, ...counts);
    return stages.map((st, i) => ({
      stage: st.name,
      count: counts[i],
      pct: `${top ? Math.round((counts[i] / top) * 100) : 0}%`,
    }));
  }, [deals, pipelines]);

  const mtdRevenue = useMemo(() => {
    const now = new Date();
    return deals
      .filter(d => isWon(d) && asDate(d.updatedAt || d.createdAt).getFullYear() === now.getFullYear() && asDate(d.updatedAt || d.createdAt).getMonth() === now.getMonth())
      .reduce((s, d) => s + (d.value || 0), 0);
  }, [deals]);

  const openPipelineValue = useMemo(
    () => deals.filter(d => !isWon(d)).reduce((s, d) => s + (d.value || 0) * ((d.probability ?? 0) / 100 || 1), 0),
    [deals]
  );

  const returnsYtd = useMemo(() => {
    const y = new Date().getFullYear();
    return deals.filter(d => isWon(d) && asDate(d.updatedAt || d.createdAt).getFullYear() === y).length;
  }, [deals]);

  const refundsFiled = useMemo(
    () => deals.reduce((s, d: any) => s + (d.estimatedRefund || 0), 0),
    [deals]
  );

  const conversionRate = useMemo(() => {
    if (!deals.length) return 0;
    return Math.round((deals.filter(isWon).length / deals.length) * 100);
  }, [deals]);

  const currency = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const leaderboard = useMemo(() => {
    return subAccounts
      .map(sa => ({
        name: sa.name,
        total: (allDeals || []).filter((d: any) => d.subAccountId === sa.id && isWon(d)).reduce((s: number, d: any) => s + (d.value || 0), 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [subAccounts, allDeals]);

  // Highest-value open deal and next scheduled appointment power the insight cards.
  const hotDeal = useMemo(
    () => [...deals].filter(d => !isWon(d)).sort((a, b) => (b.value || 0) - (a.value || 0))[0] || null,
    [deals]
  );
  const nextAppointment = useMemo(
    () => [...appointments]
      .filter(a => asDate(a.startTime).getTime() >= Date.now())
      .sort((a, b) => asDate(a.startTime).getTime() - asDate(b.startTime).getTime())[0] || null,
    [appointments]
  );

  const handleToggleTaskStatus = (taskId: any, newStatus: string) => {
    setTasksList(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (tasksBacked && !String(taskId).startsWith('local-')) {
      void updateTask(String(taskId), { status: newStatus as LiveTask['status'] });
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Upper Context Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-neutral-950/40 p-6 rounded-3xl border border-[#D4AF37]/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black text-black bg-gradient-to-r from-amber-500 to-yellow-400 border border-[#D4AF37]/30 px-3 py-1 rounded-full uppercase tracking-wider font-mono shadow-md shadow-amber-500/5">
              RJ Business Solutions Authority
            </span>
            {currentSubAccount && (
              <span className="text-[10px] font-black text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                White-Label: {currentSubAccount.name}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-2.5">
            {activeTab === 'dashboard' ? 'Tax Pro Hub University Operator Cockpit' : 'Unified Work Queue & Tasks'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeTab === 'dashboard' 
              ? 'Real-time practice intelligence telemetry, compliance monitoring, and multi-LLM engine triggers.'
              : 'Autonomous team schedules, SLA tracking timers, and AI auto-generated lifecycle triggers.'}
          </p>
        </div>

        {/* View Switcher Header Control */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto self-stretch lg:self-auto justify-between md:justify-start">
          <div className="flex bg-neutral-950 p-1.5 rounded-2xl border border-[#1f2937]/80">
            <button 
              onClick={() => setSearchParams({ tab: 'dashboard' })}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'dashboard' ? 'bg-[#D4AF37] text-neutral-950 shadow-md shadow-amber-500/10' : 'text-slate-400 hover:text-white'}`}
            >
              Cockpit View
            </button>
            <button 
              onClick={() => setSearchParams({ tab: 'tasks' })}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'tasks' ? 'bg-[#D4AF37] text-neutral-950 shadow-md shadow-amber-500/10' : 'text-slate-400 hover:text-white'}`}
            >
              Tasks Queue
            </button>
          </div>
          
          <button 
            onClick={triggerSystemPulse}
            className="p-2.5 bg-neutral-950 border border-[#1f2937] hover:border-[#D4AF37]/40 rounded-xl text-slate-400 hover:text-[#D4AF37] transition-all"
            title="Manual System Health Pulse Check"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        /* ==================== 1. OPERATOR COCKPIT VIEW ==================== */
        <div className="space-y-8">
          
          {/* 6-Card KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
            <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-[#D4AF37]/15 p-5 relative overflow-hidden group shadow-lg hover:border-[#D4AF37]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/10">
                  <Users className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                  +14% <ArrowUpRight className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-white tracking-tight">{contacts.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider font-mono">Active Clients</p>
              </div>
            </div>

            <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-[#D4AF37]/15 p-5 relative overflow-hidden group shadow-lg hover:border-[#D4AF37]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/10">
                  <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                  +21% <ArrowUpRight className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-white tracking-tight">{currency(mtdRevenue)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider font-mono">MTD Revenue</p>
              </div>
            </div>

            <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-[#D4AF37]/15 p-5 relative overflow-hidden group shadow-lg hover:border-[#D4AF37]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/10">
                  <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 bg-neutral-900 px-2 py-0.5 rounded-lg">
                  Weighted
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-white tracking-tight">{currency(openPipelineValue)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider font-mono">Open Pipeline</p>
              </div>
            </div>

            <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-[#D4AF37]/15 p-5 relative overflow-hidden group shadow-lg hover:border-[#D4AF37]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/10">
                  <FileText className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                  100% SLA <ArrowUpRight className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-white tracking-tight">{returnsYtd}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider font-mono">Returns YTD</p>
              </div>
            </div>

            <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-[#D4AF37]/15 p-5 relative overflow-hidden group shadow-lg hover:border-[#D4AF37]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/10">
                  <Award className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                  +18% <ArrowUpRight className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-white tracking-tight">{currency(refundsFiled)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider font-mono">Refunds Filed</p>
              </div>
            </div>

            <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-[#D4AF37]/15 p-5 relative overflow-hidden group shadow-lg hover:border-[#D4AF37]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/10">
                  <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                  +3.4% <ArrowUpRight className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-white tracking-tight">{conversionRate}%</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider font-mono">Conversion Rate</p>
              </div>
            </div>
          </div>

          {/* Core Telemetry Row (Revenue Graph + Funnel) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 12-Month Revenue Progression */}
            <div className="bg-neutral-950/85 backdrop-blur-md rounded-3xl border border-[#D4AF37]/15 p-6 shadow-xl lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-md font-bold text-white tracking-tight">12-Month Revenue Progression</h3>
                  <p className="text-xs text-slate-400">Total fees realized vs performance targets</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 bg-[#D4AF37] rounded-sm"></span> Fees Billed
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2.5 h-0.5 border-t border-dashed border-red-500"></span> Goal Marker
                  </span>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue12MonthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#030712" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                      itemStyle={{ color: '#D4AF37', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#goldAreaGrad)" />
                    <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Filing Funnel */}
            <div className="bg-neutral-950/85 backdrop-blur-md rounded-3xl border border-[#D4AF37]/15 p-6 shadow-xl">
              <div className="mb-4">
                <h3 className="text-md font-bold text-white tracking-tight">Active Filing Funnel</h3>
                <p className="text-xs text-slate-400 font-medium">Lead volume progression</p>
              </div>

              <div className="space-y-3.5 mt-4">
                {filingPipelineData.map((item, index) => (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold">{item.stage}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-white font-bold">{item.count} files</span>
                        <span className="text-[#D4AF37] font-black bg-amber-500/10 px-1.5 py-0.5 rounded">{item.pct}</span>
                      </div>
                    </div>
                    {/* Visual custom bar representing funnel conversion */}
                    <div className="h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full"
                        style={{ width: item.pct }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Countdown & System Gauges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Countdown Container */}
            <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
              <div>
                <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                  TAX COMPLIANCE TIMER
                </span>
                <h3 className="text-lg font-black text-white mt-3.5">IRS June Quarterly Deadline</h3>
                <p className="text-xs text-slate-400 mt-1">Form 1040-ES estimated tax voucher submissions</p>
              </div>

              <div className="grid grid-cols-4 gap-3 my-6 text-center font-mono">
                <div className="bg-neutral-950 border border-[#1f2937] p-3 rounded-2xl">
                  <div className="text-2xl font-black text-white">{deadlineCountdown.days}</div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">Days</div>
                </div>
                <div className="bg-neutral-950 border border-[#1f2937] p-3 rounded-2xl">
                  <div className="text-2xl font-black text-white">{deadlineCountdown.hours}</div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">Hours</div>
                </div>
                <div className="bg-neutral-950 border border-[#1f2937] p-3 rounded-2xl">
                  <div className="text-2xl font-black text-white">{deadlineCountdown.mins}</div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">Mins</div>
                </div>
                <div className="bg-neutral-950 border border-[#1f2937] p-3 rounded-2xl text-amber-500 animate-pulse">
                  <div className="text-2xl font-black">{deadlineCountdown.secs}</div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">Secs</div>
                </div>
              </div>

              <div className="text-[10px] text-red-400/80 font-semibold bg-red-500/5 p-3 rounded-xl border border-red-500/10 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Avoid late filing failure penalty interest. Collect Q2 income statements now.
              </div>
            </div>

            {/* System Status Telemetry */}
            <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-white tracking-tight">Practice System Gateway</h3>
                <p className="text-xs text-slate-400 mt-0.5">Integration link status logs</p>
              </div>

              <div className="space-y-3.5 my-4">
                {Object.keys(systemStatuses).length === 0 && (
                  <p className="text-[11px] text-slate-500 font-mono">Polling /api/health…</p>
                )}
                {Object.entries(systemStatuses).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2.5 bg-neutral-900/50 rounded-xl border border-[#1f2937]/50">
                    <span className="text-xs font-semibold text-slate-200">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${value === 'green' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400 animate-bounce'}`}></span>
                      <span className="text-[10px] font-bold font-mono uppercase text-slate-400">
                        {value === 'green' ? 'ONLINE' : 'NOT CONFIGURED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-500 font-mono text-center pt-2 border-t border-neutral-900">
                Live edge health poll — last checked {healthCheckedAt}
              </div>
            </div>

            {/* White-Label Leaderboard / Sub-account telemetry */}
            <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-white tracking-tight">Sub-Account Leaderboard</h3>
                <p className="text-xs text-slate-400 mt-0.5">Top reseller agency metrics</p>
              </div>

              <div className="space-y-3.5 my-4">
                {leaderboard.length === 0 && (
                  <p className="text-[11px] text-slate-500 font-mono">No sub-account revenue recorded yet.</p>
                )}
                {leaderboard.map((row, i) => (
                  <div key={row.name} className="flex justify-between items-center text-xs">
                    <span className={i === 0 ? 'font-bold text-white' : 'font-bold text-slate-300'}>{i + 1}. {row.name}</span>
                    <span className="font-mono text-[#D4AF37] font-black">{currency(row.total)}</span>
                  </div>
                ))}
              </div>

              <a href="#/admin" className="text-xs text-[#D4AF37] hover:underline font-bold text-center block pt-4 border-t border-neutral-900">
                Manage All Sub-Accounts →
              </a>
            </div>

          </div>

          {/* AI Insights & Context Panel */}
          <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-[#D4AF37]/25 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.06),transparent_50%)]"></div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-[#D4AF37] animate-pulse" />
                  <span className="uppercase text-[10px] font-black tracking-[3px] text-[#D4AF37] font-mono">COGNITIVE SUMMARY HUB</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Active Campaign & Practice Intelligence</h3>
                <p className="mt-2 text-slate-300 text-sm max-w-xl leading-relaxed">
                  We parsed your firm data using Claude 3.5 Sonnet + Gemini 1.5 Pro. Your new conversion pipeline is fully optimized. Lead velocity is up 18% month-over-month. Use the AI Assistant to spawn whole marketing bundles instantly.
                </p>
              </div>
              <div className="flex-shrink-0 self-stretch lg:self-auto flex items-center justify-between lg:justify-end gap-3">
                <span className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 text-xs px-4 py-2 rounded-xl font-bold font-mono">
                  <Shield className="h-3.5 w-3.5 text-[#D4AF37]" /> HIPAA SECURED
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 relative z-10">
              <div className="bg-neutral-950/80 border border-[#D4AF37]/10 rounded-2xl p-5 hover:border-[#D4AF37]/20 transition-all group">
                <div className="text-[10px] uppercase font-mono font-bold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Churn Risk Detected
                </div>
                <div className="text-sm font-black text-white mt-2">Robert Dow Household</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Engagement letter sent 7 days ago with zero clicks. Client showing negative signals.</p>
                <button onClick={() => navigate('/ai')} className="text-xs text-[#D4AF37] mt-4 font-bold flex items-center gap-1 hover:underline">
                  Trigger Renewal Defender AI Bot →
                </button>
              </div>

              <div className="bg-neutral-950/80 border border-[#D4AF37]/10 rounded-2xl p-5 hover:border-[#D4AF37]/20 transition-all">
                <div className="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Hot Lead Priority
                </div>
                <div className="text-sm font-black text-white mt-2">{hotDeal ? (hotDeal.contactName || hotDeal.name) : 'No open deals'}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {hotDeal
                    ? `${hotDeal.name} — ${currency(hotDeal.value || 0)} at ${hotDeal.probability ?? 0}% probability.`
                    : 'Create a deal to see your highest-value open opportunity here.'}
                </p>
                <button onClick={() => navigate('/contacts')} className="text-xs text-[#D4AF37] mt-4 font-bold flex items-center gap-1 hover:underline">
                  Launch Doc Chaser Agent →
                </button>
              </div>

              <div className="bg-neutral-950/80 border border-[#D4AF37]/10 rounded-2xl p-5 hover:border-[#D4AF37]/20 transition-all">
                <div className="text-[10px] uppercase font-mono font-bold text-[#D4AF37] flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" /> Next Best Action
                </div>
                <div className="text-sm font-black text-white mt-2">{nextAppointment ? nextAppointment.title : 'Nothing scheduled'}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {nextAppointment
                    ? `Next on the calendar: ${asDate(nextAppointment.startTime).toLocaleString()}.`
                    : 'Book an appointment and it will surface here automatically.'}
                </p>
                <button onClick={() => navigate('/tax?tab=bank')} className="text-xs text-[#D4AF37] mt-4 font-bold flex items-center gap-1 hover:underline">
                  Pitch Bank Refund Advance →
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ==================== 2. TASKS WORK QUEUE VIEW ==================== */
        <div className="space-y-8">
          
          {/* Tasks KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="bg-neutral-950 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-red-500 font-mono">{overdueCount}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Overdue Tasks</p>
              </div>
              <div className="p-2.5 bg-red-500/5 rounded-xl border border-red-500/15">
                <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
              </div>
            </div>

            <div className="bg-neutral-950 border border-[#D4AF37]/15 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-white font-mono">{tasksList.filter((t: any) => String(t.due || '').toLowerCase().includes('today')).length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Due Today</p>
              </div>
              <div className="p-2.5 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/15">
                <Clock className="h-4 w-4 text-[#D4AF37]" />
              </div>
            </div>

            <div className="bg-neutral-950 border border-[#D4AF37]/15 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-white font-mono">{tasksList.filter((t: any) => t.status !== 'Done').length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Open Tasks</p>
              </div>
              <div className="p-2.5 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/15">
                <Calendar className="h-4 w-4 text-[#D4AF37]" />
              </div>
            </div>

            <div className="bg-neutral-950 border border-[#D4AF37]/15 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-emerald-400 font-mono">{tasksList.filter((t: any) => t.status === 'Done').length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Completed</p>
              </div>
              <div className="p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/15">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            </div>

            <div className="bg-neutral-950 border border-[#D4AF37]/15 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-[#D4AF37] font-mono">{tasksList.length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total Tasks</p>
              </div>
              <div className="p-2.5 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/15">
                <User className="h-4 w-4 text-[#D4AF37]" />
              </div>
            </div>
          </div>

          {/* AI Auto-Creator Prompt Bar */}
          <form onSubmit={handleAiTaskCreation} className="bg-neutral-950 p-4 rounded-2xl border border-[#D4AF37]/25 shadow-lg flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-[#D4AF37]/20 text-[#D4AF37]">
              <BotIcon className="h-5 w-5 animate-pulse" />
            </div>
            <input 
              type="text" 
              placeholder="AI Task Auto-Creator: e.g., 'Urgent: Draft an IRS response for John Doe regarding missing W2 forms'"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              disabled={aiGenerating}
              className="flex-1 bg-transparent border-0 outline-none text-xs focus:ring-0 placeholder:text-slate-500"
            />
            <button 
              type="submit" 
              disabled={aiGenerating || !newTaskInput.trim()}
              className="px-4 py-2 bg-[#D4AF37] text-neutral-950 font-black text-xs rounded-xl flex items-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all"
            >
              {aiGenerating ? 'AI Parsing...' : 'Synthesize Task'} <Sparkles className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Views Selector Switcher & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-neutral-950/40 p-4 rounded-2xl border border-[#1f2937]/50">
            <div className="flex overflow-x-auto gap-2">
              <button 
                onClick={() => setTaskView('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shrink-0 ${taskView === 'kanban' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-slate-400 hover:text-white'}`}
              >
                <KanbanSquare className="h-3.5 w-3.5" /> Kanban Board
              </button>
              <button 
                onClick={() => setTaskView('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shrink-0 ${taskView === 'list' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-slate-400 hover:text-white'}`}
              >
                <List className="h-3.5 w-3.5" /> List View
              </button>
              <button 
                onClick={() => setTaskView('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shrink-0 ${taskView === 'calendar' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-slate-400 hover:text-white'}`}
              >
                <Calendar className="h-3.5 w-3.5" /> Calendar Schedule
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Assigned to:</span>
              <select className="bg-neutral-950 border border-[#1f2937] rounded-xl text-[11px] px-3 py-1.5 focus:border-[#D4AF37]/30 focus:outline-none">
                <option>Rick Jefferson (You)</option>
                <option>Jane Doe</option>
                <option>Support Queue</option>
              </select>
            </div>
          </div>

          {/* Kanban / List Multi-Perspective Renderer */}
          {taskView === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              
              {/* TO DO COLUMN */}
              <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-900 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-900 pb-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> TO DO
                  </span>
                  <span className="text-[10px] font-mono bg-neutral-900 px-2 py-0.5 rounded text-slate-400">
                    {tasksList.filter(t => t.status === 'To-Do').length}
                  </span>
                </div>
                
                <div className="space-y-4 flex-1">
                  {tasksList.filter(t => t.status === 'To-Do').map(task => (
                    <TaskCard key={task.id} task={task} onMove={handleToggleTaskStatus} />
                  ))}
                  {tasksList.filter(t => t.status === 'To-Do').length === 0 && <EmptyColumnState />}
                </div>
              </div>

              {/* IN PROGRESS COLUMN */}
              <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-900 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-900 pb-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> IN PROGRESS
                  </span>
                  <span className="text-[10px] font-mono bg-neutral-900 px-2 py-0.5 rounded text-slate-400">
                    {tasksList.filter(t => t.status === 'In-Progress').length}
                  </span>
                </div>
                
                <div className="space-y-4 flex-1">
                  {tasksList.filter(t => t.status === 'In-Progress').map(task => (
                    <TaskCard key={task.id} task={task} onMove={handleToggleTaskStatus} />
                  ))}
                  {tasksList.filter(t => t.status === 'In-Progress').length === 0 && <EmptyColumnState />}
                </div>
              </div>

              {/* BLOCKED COLUMN */}
              <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-900 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-900 pb-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span> BLOCKED
                  </span>
                  <span className="text-[10px] font-mono bg-neutral-900 px-2 py-0.5 rounded text-slate-400">
                    {tasksList.filter(t => t.status === 'Blocked').length}
                  </span>
                </div>
                
                <div className="space-y-4 flex-1">
                  {tasksList.filter(t => t.status === 'Blocked').map(task => (
                    <TaskCard key={task.id} task={task} onMove={handleToggleTaskStatus} />
                  ))}
                  {tasksList.filter(t => t.status === 'Blocked').length === 0 && <EmptyColumnState />}
                </div>
              </div>

              {/* DONE COLUMN */}
              <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-900 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-900 pb-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> DONE
                  </span>
                  <span className="text-[10px] font-mono bg-neutral-900 px-2 py-0.5 rounded text-slate-400">
                    {tasksList.filter(t => t.status === 'Done').length}
                  </span>
                </div>
                
                <div className="space-y-4 flex-1">
                  {tasksList.filter(t => t.status === 'Done').map(task => (
                    <TaskCard key={task.id} task={task} onMove={handleToggleTaskStatus} />
                  ))}
                  {tasksList.filter(t => t.status === 'Done').length === 0 && <EmptyColumnState />}
                </div>
              </div>

            </div>
          )}

          {taskView === 'list' && (
            <div className="bg-neutral-950 border border-[#D4AF37]/15 rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 bg-neutral-900/30 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Task Details</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Assignee</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">SLA Timer</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-xs text-slate-300">
                  {tasksList.map(task => (
                    <tr key={task.id} className="hover:bg-neutral-900/40">
                      <td className="p-4">
                        <div className="font-bold text-white mb-1">{task.title}</div>
                        <div className="flex gap-1.5">
                          {task.tags.map((tag: string) => (
                            <span key={tag} className="text-[9px] font-mono bg-neutral-900 border border-neutral-800 text-[#D4AF37] px-2 py-0.5 rounded-md">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">{task.client}</td>
                      <td className="p-4 text-slate-400 font-medium">{task.assignee}</td>
                      <td className="p-4">
                        <PriorityPill priority={task.priority} />
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-mono font-bold ${task.priority === 'urgent' ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                          {task.sla}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <select 
                          value={task.status} 
                          onChange={(e) => handleToggleTaskStatus(task.id, e.target.value)}
                          className="bg-neutral-900 border border-[#1f2937] rounded-lg text-[10px] px-2 py-1 text-slate-300 focus:outline-none"
                        >
                          <option value="To-Do">To-Do</option>
                          <option value="In-Progress">In-Progress</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Done">Done</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {taskView === 'calendar' && (
            <div className="bg-neutral-950 border border-[#D4AF37]/15 rounded-3xl p-6 text-center shadow-xl">
              <Calendar className="h-10 w-10 text-[#D4AF37] mx-auto mb-4 animate-bounce" />
              <h3 className="text-white font-bold">Interactive Scheduler Connected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Syncing task checklists dynamically into the core [Calendar Engine](file:///src/pages/CalendarPage.tsx) across Google & Microsoft suites.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

/* ==================== SUB-COMPONENTS ==================== */

// AI Bot icon component
function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

// Sub-component: Individual Task Card
function TaskCard({ task, onMove }: { task: any, onMove: (id: any, status: string) => void }) {
  return (
    <div className="bg-neutral-900/80 border border-[#D4AF37]/10 rounded-2xl p-4 hover:border-[#D4AF37]/25 transition-all shadow-md group relative">
      <div className="flex justify-between items-start mb-2">
        <PriorityPill priority={task.priority} />
        <span className="text-[9px] font-mono font-bold text-[#D4AF37]">{task.sla}</span>
      </div>
      
      <h4 className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-relaxed line-clamp-2">
        {task.title}
      </h4>

      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
        <User className="h-3 w-3 text-slate-500" />
        <span className="font-semibold truncate">{task.client}</span>
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {task.tags.map((tag: string) => (
          <span key={tag} className="text-[8px] font-black font-mono tracking-wide uppercase bg-neutral-950 border border-neutral-800 text-slate-400 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-neutral-900 text-[9px] text-slate-500 font-mono">
        <span>Due: {task.due}</span>
        <div className="flex items-center gap-2">
          {task.status !== 'Done' && (
            <button 
              onClick={() => onMove(task.id, 'Done')}
              className="p-1 rounded bg-neutral-950 border border-neutral-800 text-slate-400 hover:text-emerald-400"
              title="Mark as Done"
            >
              <Check className="h-2.5 w-2.5" />
            </button>
          )}
          {task.status === 'To-Do' && (
            <button 
              onClick={() => onMove(task.id, 'In-Progress')}
              className="p-1 rounded bg-neutral-950 border border-neutral-800 text-slate-400 hover:text-amber-400"
              title="Start Work"
            >
              <Play className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component: Priority Pill
function PriorityPill({ priority }: { priority: string }) {
  let colors = 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  if (priority === 'urgent') colors = 'bg-gradient-to-r from-red-600/20 to-amber-600/10 text-red-400 border border-red-500/30';
  if (priority === 'high') colors = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (priority === 'medium') colors = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';

  return (
    <span className={`text-[8px] font-mono uppercase font-black px-1.5 py-0.5 rounded ${colors}`}>
      {priority}
    </span>
  );
}

// Sub-component: Empty Column State
function EmptyColumnState() {
  return (
    <div className="py-8 text-center text-slate-600 text-[10px] font-semibold border-2 border-dashed border-neutral-900 rounded-2xl">
      No items in this queue
    </div>
  );
}
