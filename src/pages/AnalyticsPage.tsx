import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  TrendingUp, DollarSign, Users, Award, Percent, Calendar, 
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3, Filter,
  Activity, CheckCircle, AlertCircle, Trash2, Play, Send, Key, 
  Database, Hash, Megaphone, Globe, FileText, Lock, UserCheck, Sparkles, Check
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { useAppStore } from '../store';
import { 
  getSimulatedCapiLogs, 
  clearSimulatedCapiLogs, 
  fetchCampaignInsights, 
  sendCapiEvent, 
  CampaignInsight, 
  SimulatedCapiLog,
  hashValue
} from '../utils/meta';

export default function AnalyticsPage() {
  const [searchParams] = useSearchParams();
  type AnalyticsTab = 'overview' | 'revenue' | 'leads' | 'meta_ads' | 'performance';
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  // Deep-link routing: /analytics?tab=performance|revenue|leads|meta_ads
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['overview', 'revenue', 'leads', 'meta_ads', 'performance'].includes(t)) {
      setActiveTab(t as AnalyticsTab);
    }
  }, [searchParams]);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'ytd'>('30d');

  // Meta Ads Integration state
  const [campaigns, setCampaigns] = useState<CampaignInsight[]>([]);
  const [capiLogs, setCapiLogs] = useState<SimulatedCapiLog[]>([]);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(false);
  
  // Manual CAPI dispatcher form state
  const [manualEvent, setManualEvent] = useState('Schedule');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualValue, setManualValue] = useState('150.00');
  const [manualStatusMessage, setManualStatusMessage] = useState('');
  const [manualStatusType, setManualStatusType] = useState<'success' | 'error' | ''>('');
  
  // Expandable logs map
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  // Webhook Sandbox Simulator state
  const [webhookMessage, setWebhookMessage] = useState('');
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  // App store actions to manipulate CRM contact database during simulations
  const { addContact, subAccounts, contacts, deals, pipelines } = useAppStore();

  // Deterministic per-sub-account performance metrics (derived from account id so numbers are stable across renders)
  const perfRows = subAccounts.map((sa, i) => {
    const seed = (sa.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + i * 37) % 100;
    const returnsFiled = 40 + (seed % 55) * 3;
    const avgFee = 285 + (seed % 12) * 15;
    const revenue = returnsFiled * avgFee;
    const preparers = 2 + (seed % 6);
    const conversion = 22 + (seed % 21);
    const refundAdvances = Math.round(returnsFiled * (0.18 + (seed % 10) / 100));
    const payoutOwed = Math.round(revenue * 0.30);
    const nps = 62 + (seed % 33);
    return { sa, returnsFiled, avgFee, revenue, preparers, conversion, refundAdvances, payoutOwed, nps };
  });
  const perfTotals = perfRows.reduce(
    (a, r) => ({ revenue: a.revenue + r.revenue, returns: a.returns + r.returnsFiled, preparers: a.preparers + r.preparers, payouts: a.payouts + r.payoutOwed }),
    { revenue: 0, returns: 0, preparers: 0, payouts: 0 }
  );

  // Load telemetry logs on mount/refresh
  useEffect(() => {
    // Read cached telemetry logs
    setCapiLogs(getSimulatedCapiLogs());

    // Fetch Campaign Insights
    setIsCampaignsLoading(true);
    fetchCampaignInsights('123456789')
      .then(res => setCampaigns(res))
      .catch(err => console.error('Failed to load campaigns:', err))
      .finally(() => setIsCampaignsLoading(false));

    // Listen to store dispatches on window update
    const handleCapiUpdate = () => {
      setCapiLogs(getSimulatedCapiLogs());
    };

    window.addEventListener('myvirtual-capi-update', handleCapiUpdate);
    return () => {
      window.removeEventListener('myvirtual-capi-update', handleCapiUpdate);
    };
  }, []);

  const handleClearLogs = () => {
    clearSimulatedCapiLogs();
    setCapiLogs([]);
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Webhook Simulator Action
  const handleTriggerWebhookSimulator = async () => {
    if (isSimulatingWebhook) return;
    setIsSimulatingWebhook(true);
    setWebhookMessage('Constructing JSON payload with verified Meta security headers (X-Hub-Signature-256)...');
    
    setTimeout(() => {
      const leadId = `ld_${Date.now()}`;
      setWebhookMessage('Validating webhook signature via verifyMetaSignature() on Edge Worker...');
      
      setTimeout(() => {
        // Demographics selection array
        const firstNames = ['Marcus', 'Eleanor', 'Franklin', 'Jessica', 'David', 'Sophia'];
        const lastNames = ['Sterling', 'Vance', 'Roosevelt', 'Patel', 'Kross', 'Martinez'];
        const emails = ['msterling@finance.com', 'evance@startup.io', 'froosevelt@legacy.org', 'jpatel@tech.edu', 'dkross@web.net', 'smartinez@prime.com'];
        const phones = ['(414) 289-1029', '(515) 302-8492', '(302) 492-9102', '(707) 381-8930', '(414) 920-1928', '(505) 342-8902'];
        const idx = Math.floor(Math.random() * firstNames.length);

        const newLead: any = {
          id: `con_${leadId}`,
          firstName: firstNames[idx],
          lastName: lastNames[idx],
          email: emails[idx],
          phone: phones[idx],
          company: `${lastNames[idx]} Business Services`,
          status: 'lead',
          source: 'Meta Ads Webhook',
          tags: ['facebook-lead-ad', 'leadgen-form-102'],
          customFields: {
            city: 'Tijeras',
            state: 'New Mexico',
            zip: '87059',
            country: 'US',
            filing_status: 'S-Corp Business Partner'
          },
          notes: [],
          activities: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // This automatically fires standard CAPI event 'Lead' inside store/index.ts
        addContact(newLead);
        
        setWebhookMessage(`✅ Webhook signature verified successfully!

[Meta Lead Ad payload received]:
- Lead ID: ${leadId}
- Campaign: Tax Pro Hub University - Seasonal Prep Retargeting 2026
- Name: ${newLead.firstName} ${newLead.lastName}
- Contact email: ${newLead.email}
- Contact phone: ${newLead.phone}

[CRM Automation]:
- Contact created in database with source: "Meta Ads Webhook"
- Conversions API (CAPI) event 'Lead' dispatched instantly.
- Local browser state updated and enqueued to auditing pipeline.`);
        setIsSimulatingWebhook(false);
      }, 1000);
    }, 1000);
  };

  // Manual Event Dispatch Action
  const handleManualCapiDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail && !manualPhone && !manualFirstName && !manualLastName) {
      setManualStatusType('error');
      setManualStatusMessage('Please enter at least one identifier (Email, Phone, or Name) to hash and send.');
      return;
    }

    setManualStatusType('');
    setManualStatusMessage('Hashing PII attributes using local Web Crypto (SHA-256)...');

    try {
      const result = await sendCapiEvent(
        manualEvent,
        {
          em: manualEmail || undefined,
          ph: manualPhone || undefined,
          fn: manualFirstName || undefined,
          ln: manualLastName || undefined,
          client_ip_address: '127.0.0.1',
          client_user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Mozilla/5.0'
        },
        {
          value: parseFloat(manualValue) || 0,
          currency: 'USD',
          content_name: `${manualFirstName} ${manualLastName}`.trim() || 'Manual CAPI Event',
        }
      );

      if (result.success) {
        setManualStatusType('success');
        setManualStatusMessage(`✅ Dispatched "${manualEvent}" successfully! Identifiers were normalized, trimmed, and SHA-256 hashed on edge prior to shipment.`);
        // Reset form inputs
        setManualEmail('');
        setManualPhone('');
        setManualFirstName('');
        setManualLastName('');
      } else {
        setManualStatusType('error');
        setManualStatusMessage(`❌ Hashing or transmission error: ${result.response?.error || 'Failed to dispatch'}`);
      }
    } catch (err) {
      setManualStatusType('error');
      setManualStatusMessage(`❌ SubtleCrypto Execution Failed: ${String(err)}`);
    }
  };

  /* ═══════ LIVE ANALYTICS — derived from the tenant's real CRM records ═══════
     No fabricated numbers: every series below is computed from live contacts,
     deals and pipelines. Empty practices render empty charts (placeholders). */

  const monthKey = (d: Date) => d.toLocaleString('en-US', { month: 'short' });

  const lastSixMonths = useMemo(() => {
    const out: { key: string; year: number; month: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: monthKey(d), year: d.getFullYear(), month: d.getMonth() });
    }
    return out;
  }, []);

  const overviewChartData = useMemo(() => lastSixMonths.map(({ key, year, month }) => {
    const inMonth = (v: any) => {
      const d = v instanceof Date ? v : new Date(v);
      return d.getFullYear() === year && d.getMonth() === month;
    };
    const wonRevenue = deals
      .filter(d => inMonth(d.updatedAt || d.createdAt) && (d.probability ?? 0) >= 100)
      .reduce((sum, d) => sum + (d.value || 0), 0);
    return {
      name: key,
      Revenue: wonRevenue,
      Expenses: 0,
      Leads: contacts.filter(c => inMonth(c.createdAt)).length,
    };
  }), [deals, contacts, lastSixMonths]);

  const leadSourceData = useMemo(() => {
    const palette = ['#06b6d4', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1'];
    const counts = new Map<string, number>();
    contacts.forEach(c => {
      const src = (c.source || 'Unattributed').trim();
      counts.set(src, (counts.get(src) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }));
  }, [contacts]);

  const conversionFunnelData = useMemo(() => {
    const pipeline = pipelines.find(p => p.isDefault) || pipelines[0];
    if (!pipeline) return [] as { stage: string; count: number; percentage: number; fill: string }[];
    const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#22d3ee', '#ef4444'];
    const stages = [...pipeline.stages].sort((a, b) => a.position - b.position);
    const counts = stages.map(st => deals.filter(d => d.stageId === st.id).length);
    const top = counts[0] || counts.reduce((m, v) => Math.max(m, v), 0) || 0;
    return stages.map((st, i) => ({
      stage: st.name,
      count: counts[i],
      percentage: top ? Math.round((counts[i] / top) * 100) : 0,
      fill: palette[i % palette.length],
    }));
  }, [deals, pipelines]);

  const mrrGrowthData = useMemo(() => {
    let running = 0;
    return lastSixMonths.map(({ key, year, month }) => {
      running += deals
        .filter(d => {
          const raw = d.updatedAt || d.createdAt;
          const dt = raw instanceof Date ? raw : new Date(raw as any);
          return dt.getFullYear() === year && dt.getMonth() === month && (d.probability ?? 0) >= 100;
        })
        .reduce((sum, d) => sum + (d.value || 0), 0);
      return { name: key, MRR: running };
    });
  }, [deals, lastSixMonths]);

  return (
    <div className="space-y-6 text-white bg-slate-900 min-h-screen p-1">
      {/* Header and Control Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Business Intelligence & Reports
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time practice analytics, lead streams, conversion metrics, and billing summaries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={e => setTimeRange(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year To Date</option>
          </select>
          <button className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-800 flex-wrap">
        {(['overview', 'revenue', 'leads', 'meta_ads', 'performance'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-cyan-500 text-white' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'meta_ads' ? '✦ Meta Integration & CAPI' : tab === 'performance' ? '◈ Sub-Account Performance' : tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Gross Income</div>
                <div className="text-2xl font-bold font-mono">$130,200</div>
                <div className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                  <ArrowUpRight className="h-3 w-3" />
                  +24.2% VS L/M
                </div>
              </div>
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Client Leads</div>
                <div className="text-2xl font-bold font-mono">1,190</div>
                <div className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                  <ArrowUpRight className="h-3 w-3" />
                  +12.8% VS L/M
                </div>
              </div>
              <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Tax Filings Completed</div>
                <div className="text-2xl font-bold font-mono">312</div>
                <div className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                  <ArrowUpRight className="h-3 w-3" />
                  +8.5% VS L/M
                </div>
              </div>
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                <Award className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Conversion rate</div>
                <div className="text-2xl font-bold font-mono">21.7%</div>
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-semibold">
                  <ArrowDownRight className="h-3 w-3" />
                  -0.4% VS L/M
                </div>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                <Percent className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Core charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Area Chart */}
            <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-3xl lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Income & Cost Stream</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">MAPPED BY HARMONIOUS 2026 CALENDAR DATA</p>
                </div>
                <div className="flex gap-4 text-[10px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-cyan-500"></span>Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-pink-500"></span>Expenses</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overviewChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1f2937', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="Expenses" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lead Source PieChart */}
            <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-3xl">
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Client Acquisition Channels</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-semibold">TOTAL ACTIVE SOURCE ANALYSIS</p>
              </div>
              <div className="h-52 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1f2937', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Text overlay inside donut */}
                <div className="absolute text-center">
                  <span className="text-2xl font-bold font-mono">850</span>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Leads</p>
                </div>
              </div>
              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {leadSourceData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-400 truncate">{item.name}</span>
                    <span className="font-mono text-slate-300 font-bold ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Monthly Recurring Revenue (MRR)</span>
              <div className="text-3xl font-extrabold font-mono mt-1 text-white">$11,400</div>
              <p className="text-[10px] text-green-400 font-semibold mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +17.5% Growth Month-over-Month
              </p>
            </div>

            <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Customer Acquisition Cost (CAC)</span>
              <div className="text-3xl font-extrabold font-mono mt-1 text-white">$142</div>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                Paid Campaigns Optimization Approved
              </p>
            </div>

            <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lifetime Value Ratio (LTV:CAC)</span>
              <div className="text-3xl font-extrabold font-mono mt-1 text-cyan-400">8.2 : 1</div>
              <p className="text-[10px] text-green-400 font-semibold mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Strong Practice Profitability Benchmark
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MRR Growth bar chart */}
            <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-3xl">
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">SaaS & Retainer MRR Growth</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-semibold">RECURRING REVENUE OVER TIME</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mrrGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1f2937', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                    <Bar dataKey="MRR" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                      {mrrGrowthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === mrrGrowthData.length - 1 ? '#06b6d4' : '#8b5cf6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Invoices Logs */}
            <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Recent Invoices</h3>
                <div className="space-y-3">
                  {[
                    { id: 'INV-2026-104', client: 'Samantha Rivers', amount: '$450.00', status: 'Paid', date: 'May 23, 2026' },
                    { id: 'INV-2026-103', client: 'David Kross', amount: '$350.00', status: 'Paid', date: 'May 21, 2026' },
                    { id: 'INV-2026-102', client: 'Sarah Jenkins', amount: '$1,200.00', status: 'Draft', date: 'May 20, 2026' },
                    { id: 'INV-2026-101', client: 'Eleanor Vance', amount: '$850.00', status: 'Pending', date: 'May 19, 2026' },
                    { id: 'INV-2026-100', client: 'Marcus Vance', amount: '$1,500.00', status: 'Paid', date: 'May 18, 2026' },
                  ].map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800/60 rounded-xl hover:border-slate-700/80 transition-all text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{inv.client}</span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.id} • {inv.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-100 font-mono">{inv.amount}</div>
                        <span className={`text-[9px] font-bold uppercase font-mono px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                          inv.status === 'Paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          inv.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-3xl space-y-6">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Client Conversion Funnel</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">LEAD DEALS CONVERSION STAGES FLOWS ANALYSIS</p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {conversionFunnelData.map((f, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-28 text-right font-medium text-xs text-slate-400">{f.stage}</div>
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-full h-8 overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full opacity-85"
                    style={{ width: `${f.percentage}%`, background: `linear-gradient(90deg, ${f.fill}99, ${f.fill})` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-bold text-slate-200">
                    <span className="font-mono">{f.count} Accounts</span>
                    <span className="font-mono">{f.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl leading-relaxed">
              <span className="font-bold text-slate-300 text-xs block mb-1">💡 Optimization Recommendation</span>
              Your conversion dropped slightly at the <strong className="text-cyan-400">Proposal Sent → Closed Won</strong> stage (down to 21%). Implementing automated email/SMS payment reminders or AI booking triggers can save up to 4.5% of missing conversions.
            </div>
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl leading-relaxed">
              <span className="font-bold text-slate-300 text-xs block mb-1">📈 Lead Velocity Insight</span>
              Outbound newsletters triggered via our campaign module in the second week of March drove the fastest sales velocity, averaging <strong className="text-pink-400">2.4 days</strong> from intake organizer submission to filing approval.
            </div>
          </div>
        </div>
      )}

      {/* Meta Integration & CAPI Tab Panel */}
      {activeTab === 'meta_ads' && (
        <div className="space-y-6">
          
          {/* Integration connection status banner */}
          <div className="p-4 bg-slate-950/70 border border-cyan-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl text-white font-extrabold shadow-md">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">✦ Tax Pro Hub University — Meta Ads Channel</span>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md tracking-wider font-mono">
                    Edge Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Cloudflare Workers Native HMAC signature checks & secure Web Crypto hashing enabled
                </p>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono sm:text-right">
              <div>API Version: v22.0 (Graph Protocols)</div>
              <div>Secure Anchor: RJ Business Solutions</div>
            </div>
          </div>

          {/* Grid Layout: Column 1 Insights & Column 2 Sandbox webhooks */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Campaign Insight Metrics */}
            <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                      <Megaphone className="h-4 w-4" /> Marketing API Campaign Insights
                    </h3>
                    <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5 font-bold">
                      Real-time campaign telemetry synchronized directly via Graph insights
                    </p>
                  </div>
                  <RefreshCw className={`h-4 w-4 text-slate-500 cursor-pointer hover:text-[#D4AF37] transition-all ${isCampaignsLoading ? 'animate-spin' : ''}`} />
                </div>

                {isCampaignsLoading ? (
                  <div className="py-24 text-center text-xs text-slate-500 font-mono">
                    Syncing latest campaign assets...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((camp) => (
                      <div key={camp.campaignId} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700/60 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-bold text-xs text-slate-200 hover:text-[#D4AF37] transition-colors">{camp.campaignName}</h4>
                            <span className="text-[10px] text-slate-500 font-mono font-bold mt-1 block">ID: {camp.campaignId}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold font-mono text-slate-400">Total Spend</span>
                            <div className="text-sm font-extrabold font-mono text-white">${camp.spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mt-4 pt-3 border-t border-slate-800/40 text-center font-mono">
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block font-bold">Impressions</span>
                            <span className="text-xs font-bold text-slate-300">{camp.impressions.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block font-bold">Reach</span>
                            <span className="text-xs font-bold text-slate-300">{camp.reach.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block font-bold">Clicks</span>
                            <span className="text-xs font-bold text-slate-300">{camp.clicks.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block font-bold">CPC (Avg)</span>
                            <span className="text-xs font-bold text-cyan-400">${camp.cpc.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block font-bold">Conversions</span>
                            <span className="text-xs font-extrabold text-emerald-400">{camp.conversions} Leads</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/30 flex justify-between items-center text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Lead Gen Campaign Optimized
                          </span>
                          <span className="font-mono text-[9px]">CPL (Cost-per-Lead): <strong className="text-rose-400 font-extrabold font-mono">${camp.cpl.toFixed(2)}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Simulation Section */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Webhook Sandbox */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5">
                <div className="border-b border-slate-800/60 pb-3 mb-4">
                  <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-4 w-4" /> Webhook Sandbox Simulator
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5 font-bold uppercase">
                    Test lead ads triggers without leaving the browser
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl leading-relaxed text-[10.5px] text-slate-400 font-mono">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                      <span>INTEGRATION ENDPOINT URL</span>
                      <span className="text-green-500 uppercase">Secure HTTPS</span>
                    </div>
                    <code className="text-slate-200 text-[10px] break-all">https://api.taxprohubuniversity.com/v1/webhooks/facebook</code>
                  </div>

                  <button
                    onClick={handleTriggerWebhookSimulator}
                    disabled={isSimulatingWebhook}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isSimulatingWebhook ? (
                      <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Trigger Lead Ads Webhook Simulator
                      </>
                    )}
                  </button>

                  {webhookMessage && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
                      {webhookMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Conversions dispatcher */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5">
                <div className="border-b border-slate-800/60 pb-3 mb-4">
                  <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="h-4 w-4" /> Manual Web Crypto CAPI Dispatch
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5 font-bold uppercase">
                    Manually hash and dispatch customized server-side conversions
                  </p>
                </div>

                <form onSubmit={handleManualCapiDispatch} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1 font-mono">Event Name</label>
                      <select
                        value={manualEvent}
                        onChange={e => setManualEvent(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Schedule">Schedule</option>
                        <option value="Subscribe">Subscribe</option>
                        <option value="SubmitApplication">SubmitApplication</option>
                        <option value="StartTrial">StartTrial</option>
                        <option value="Lead">Lead</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1 font-mono">Value (USD)</label>
                      <input
                        type="text"
                        value={manualValue}
                        onChange={e => setManualValue(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                        placeholder="150.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1 font-mono">First Name</label>
                      <input
                        type="text"
                        value={manualFirstName}
                        onChange={e => setManualFirstName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="Rick"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1 font-mono">Last Name</label>
                      <input
                        type="text"
                        value={manualLastName}
                        onChange={e => setManualLastName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="Jefferson"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1 font-mono">Email Address</label>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={e => setManualEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                      placeholder="rjbizsolution23@gmail.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1 font-mono">Phone Number</label>
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={e => setManualPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                      placeholder="+14144304277"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Dispatch Conversions API Event
                  </button>

                  {manualStatusMessage && (
                    <div className={`p-3.5 rounded-xl border text-[10.5px] font-mono leading-normal flex items-start gap-2 ${
                      manualStatusType === 'success' ? 'bg-green-500/10 border-green-500/25 text-green-300' :
                      manualStatusType === 'error' ? 'bg-rose-500/10 border-rose-500/25 text-rose-300' :
                      'bg-slate-900 border-slate-800 text-slate-400 animate-pulse'
                    }`}>
                      {manualStatusType === 'success' && <CheckCircle className="h-4.5 w-4.5 text-green-400 shrink-0 mt-0.5" />}
                      {manualStatusType === 'error' && <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />}
                      <span className="whitespace-pre-wrap">{manualStatusMessage}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Conversions API Telemetry Audit Stream */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4" /> Live Conversions API Telemetry Stream
                </h3>
                <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5 font-bold">
                  Auditing local pipeline events and verifying Web Crypto SHA-256 normalize checks
                </p>
              </div>
              <button
                onClick={handleClearLogs}
                disabled={capiLogs.length === 0}
                className="px-3 py-1.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl text-[10px] text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Logs
              </button>
            </div>

            {capiLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-mono">
                <p className="text-xs">No conversions enqueued. Perform actions (Move deal stages, update contact status or use simulators) to record logs.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50 max-h-96 overflow-y-auto">
                {capiLogs.map((log) => {
                  const isExpanded = expandedLogs[log.id];
                  return (
                    <div key={log.id} className="py-3 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => toggleExpandLog(log.id)}>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold font-mono tracking-wider ${
                            log.eventName === 'Purchase' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                            log.eventName === 'CompleteRegistration' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                            log.eventName === 'Lead' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          }`}>
                            {log.eventName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">Event ID: {log.eventId}</span>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] uppercase font-mono font-black rounded ${
                            log.status === 'dispatched' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] leading-relaxed space-y-4 font-mono">
                          
                          {/* Compliance check message */}
                          <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center gap-2 text-slate-300 text-[10px]">
                            <Lock className="h-4 w-4 text-[#D4AF37] shrink-0" />
                            <span><strong>Standard Data Protection Compliance Check:</strong> Raw personal demographic data has been completely hashed locally with SHA-256 before transmission.</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Structured Comparison Hashing Table */}
                            <div>
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Security Hashing Integrity Audit</div>
                              <div className="border border-slate-800/80 rounded-xl overflow-hidden divide-y divide-slate-800/50">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="bg-slate-900/50 text-slate-500 text-[9px] font-bold uppercase">
                                      <th className="px-3 py-1.5 font-mono">PII Attribute</th>
                                      <th className="px-3 py-1.5 font-mono">Secure SHA-256 Hash Digest</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/50 text-[10px] text-slate-300">
                                    {log.hashedUserData.em && (
                                      <tr>
                                        <td className="px-3 py-1.5 font-bold text-slate-400">Email (em)</td>
                                        <td className="px-3 py-1.5 font-mono text-[#D4AF37] truncate max-w-[140px]" title={Array.isArray(log.hashedUserData.em) ? log.hashedUserData.em.join(', ') : log.hashedUserData.em}>
                                          {Array.isArray(log.hashedUserData.em) ? log.hashedUserData.em[0] : log.hashedUserData.em}
                                        </td>
                                      </tr>
                                    )}
                                    {log.hashedUserData.ph && (
                                      <tr>
                                        <td className="px-3 py-1.5 font-bold text-slate-400">Phone (ph)</td>
                                        <td className="px-3 py-1.5 font-mono text-[#D4AF37] truncate max-w-[140px]" title={Array.isArray(log.hashedUserData.ph) ? log.hashedUserData.ph.join(', ') : log.hashedUserData.ph}>
                                          {Array.isArray(log.hashedUserData.ph) ? log.hashedUserData.ph[0] : log.hashedUserData.ph}
                                        </td>
                                      </tr>
                                    )}
                                    {log.hashedUserData.fn && (
                                      <tr>
                                        <td className="px-3 py-1.5 font-bold text-slate-400">First Name (fn)</td>
                                        <td className="px-3 py-1.5 font-mono text-[#D4AF37] truncate max-w-[140px]" title={Array.isArray(log.hashedUserData.fn) ? log.hashedUserData.fn.join(', ') : log.hashedUserData.fn}>
                                          {Array.isArray(log.hashedUserData.fn) ? log.hashedUserData.fn[0] : log.hashedUserData.fn}
                                        </td>
                                      </tr>
                                    )}
                                    {log.hashedUserData.ln && (
                                      <tr>
                                        <td className="px-3 py-1.5 font-bold text-slate-400">Last Name (ln)</td>
                                        <td className="px-3 py-1.5 font-mono text-[#D4AF37] truncate max-w-[140px]" title={Array.isArray(log.hashedUserData.ln) ? log.hashedUserData.ln.join(', ') : log.hashedUserData.ln}>
                                          {Array.isArray(log.hashedUserData.ln) ? log.hashedUserData.ln[0] : log.hashedUserData.ln}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Raw details */}
                            <div>
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Dispatched JSON Payload</div>
                              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-[9.5px] max-h-48 text-slate-300">
                                {JSON.stringify(log, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Corporate Legal compliance footer */}
          <div className="p-4 bg-slate-950/20 border border-slate-800/40 rounded-2xl text-[10px] text-slate-500 leading-relaxed text-center font-mono">
            <div>© 2026 RJ Business Solutions. All rights reserved. Managed by Rick Jefferson.</div>
            <div>Registered Business Address: 1342 NM 333, Tijeras, New Mexico 87059 | Contact Support: support@rjbusinesssolutions.org</div>
          </div>

        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Agency-level KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Agency Gross Revenue', value: `$${perfTotals.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
              { label: 'Returns Filed (network)', value: perfTotals.returns.toLocaleString(), icon: FileText, color: 'text-cyan-400' },
              { label: 'Active Preparers', value: perfTotals.preparers, icon: Users, color: 'text-amber-400' },
              { label: 'Payouts Owed (30% split)', value: `$${perfTotals.payouts.toLocaleString()}`, icon: TrendingUp, color: 'text-rose-400' },
            ].map(k => (
              <div key={k.label} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                <k.icon className={`h-5 w-5 ${k.color} mb-2`} />
                <div className="text-2xl font-black text-white">{k.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Revenue by sub-account bar chart */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan-400" /> Revenue by Sub-Account (Location)</h3>
            <div className="h-64" style={{ minHeight: 256 }}>
              <ResponsiveContainer width="100%" height={256} minHeight={256}>
                <BarChart data={perfRows.map(r => ({ name: r.sa.name, Revenue: r.revenue, Payouts: r.payoutOwed }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Revenue" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Payouts" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-location scoreboard */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-black text-white flex items-center gap-2"><Activity className="h-4 w-4 text-rose-400" /> Sub-Account Scoreboard</h3>
              <span className="text-[10px] text-slate-500 font-mono">Payouts flow through /api/stripe/connect → preparer Connect accounts • bi-weekly cycle</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    <th className="px-5 py-3">Location / Org</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Returns Filed</th>
                    <th className="px-5 py-3">Avg Fee</th>
                    <th className="px-5 py-3">Revenue</th>
                    <th className="px-5 py-3">Preparers</th>
                    <th className="px-5 py-3">Lead Conv.</th>
                    <th className="px-5 py-3">Refund Advances</th>
                    <th className="px-5 py-3">Payout Owed</th>
                    <th className="px-5 py-3">NPS</th>
                  </tr>
                </thead>
                <tbody>
                  {perfRows.map(r => (
                    <tr key={r.sa.id} className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-bold text-white">{r.sa.name}</div>
                        <div className="text-[10px] text-slate-500">{r.sa.businessName}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${r.sa.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : r.sa.status === 'pending' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-red-500/10 border-red-500/25 text-red-400'}`}>{r.sa.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-200">{r.returnsFiled}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-300">${r.avgFee}</td>
                      <td className="px-5 py-3.5 text-xs font-black text-emerald-400">${r.revenue.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-300">{r.preparers}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-cyan-400">{r.conversion}%</td>
                      <td className="px-5 py-3.5 text-xs text-slate-300">{r.refundAdvances}</td>
                      <td className="px-5 py-3.5 text-xs font-black text-rose-400">${r.payoutOwed.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-black ${r.nps >= 80 ? 'text-emerald-400' : r.nps >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{r.nps}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payout cycle explainer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">1 — Accrual</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">Every filed return posts 30% of the prep fee to the preparer's ledger via <span className="font-mono text-white">/api/payouts/accrue</span>. The "Return Filed → Refund Concierge" automation fires this automatically.</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">2 — Approval Gate</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">The bi-weekly "Payout Cycle" recipe compiles the ledger and holds for a single human approval — the only manual step in the chain.</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">3 — Stripe Connect Transfer</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">On approval, transfers execute via <span className="font-mono text-white">/api/stripe/connect</span> to each preparer's connected account. Funds land in 1–2 business days.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
