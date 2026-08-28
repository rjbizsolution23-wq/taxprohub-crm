import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, Zap, Plus, ArrowRight, ShieldCheck, 
  Calendar, FileText, Settings, User, Clock, AlertTriangle, 
  ArrowLeftRight, Search, SlidersHorizontal, MapPin, CheckSquare, 
  Sparkles, Award, RefreshCw, Layers, FileSignature, AlertCircle,
  HelpCircle, ChevronRight, X, Phone, Mail, MessageSquare, PlusCircle,
  Clock3, Lock, Eye, Trash2, Edit2, Play, Users, BarChart3, PieChart
} from 'lucide-react';
import { useAppStore } from '../store';
import { apiFetch } from '../utils/api';
import { Deal } from '../types';

// Pipelines configuration
interface Pipeline {
  id: string;
  name: string;
  type: string;
  stages: { id: string; name: string; probability: number; color: string; slaDays: number }[];
}

const pipelinesConfig: Pipeline[] = [
  {
    id: 'pip-tax',
    name: 'Seasonal Tax Prep (Returns)',
    type: 'tax_prep',
    stages: [
      { id: 'tax-intake', name: 'Inquiry & Intake', probability: 10, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', slaDays: 3 },
      { id: 'tax-doc-pending', name: 'Awaiting Tax Docs', probability: 55, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', slaDays: 5 },
      { id: 'tax-in-prep', name: 'Preparation Active', probability: 70, color: 'bg-amber-600/20 text-amber-400 border-amber-600/30', slaDays: 7 },
      { id: 'tax-in-review', name: 'Under CPA Review & QA', probability: 85, color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', slaDays: 3 },
      { id: 'tax-ready-efile', name: 'Ready to E-File (8879)', probability: 95, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', slaDays: 4 },
      { id: 'tax-won', name: 'Completed & Accepted', probability: 100, color: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30', slaDays: 1 }
    ]
  },
  {
    id: 'pip-book',
    name: 'Bookkeeping Retainers',
    type: 'bookkeeping',
    stages: [
      { id: 'book-discovery', name: 'Discovery & Consultation', probability: 15, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', slaDays: 5 },
      { id: 'book-scoping', name: 'Scoping & Diagnostics', probability: 30, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', slaDays: 7 },
      { id: 'book-proposal', name: 'Proposal Issued', probability: 60, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', slaDays: 10 },
      { id: 'book-onboarding', name: 'Onboarding System Sync', probability: 85, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', slaDays: 14 },
      { id: 'book-active', name: 'Active Recurring Service', probability: 100, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', slaDays: 30 }
    ]
  },
  {
    id: 'pip-rep',
    name: 'IRS Representation (Notice Defense)',
    type: 'irs_rep',
    stages: [
      { id: 'rep-notice', name: 'Notice Logged / CAF Sign', probability: 10, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', slaDays: 5 },
      { id: 'rep-investigation', name: 'Investigation / IRS Records', probability: 30, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', slaDays: 14 },
      { id: 'rep-strategy', name: 'Tax Strategy Drafting', probability: 50, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', slaDays: 10 },
      { id: 'rep-negotiation', name: 'IRS Appeals Negotiation', probability: 75, color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', slaDays: 30 },
      { id: 'rep-won', name: 'Agreement Accepted (Won)', probability: 100, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', slaDays: 1 }
    ]
  },
  {
    id: 'pip-credit',
    name: 'Credit Restoration (CROA)',
    type: 'credit',
    stages: [
      { id: 'credit-consult', name: 'Credit Report Assessment', probability: 20, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', slaDays: 3 },
      { id: 'credit-disclosure', name: 'CROA Disclosures Waiting', probability: 40, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', slaDays: 3 },
      { id: 'credit-disputes-drafted', name: 'Dispute Packets Drafted', probability: 70, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', slaDays: 5 },
      { id: 'credit-disputes-mailed', name: 'Mailed (Bureau Pending)', probability: 85, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', slaDays: 30 },
      { id: 'credit-won', name: 'Derogatory Items Cleared', probability: 100, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', slaDays: 1 }
    ]
  },
  {
    id: 'pip-bureau',
    name: 'Service Bureau & White-Label',
    type: 'bureau',
    stages: [
      { id: 'bureau-demo', name: 'Platform Demo Complete', probability: 20, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', slaDays: 5 },
      { id: 'bureau-trial-active', name: 'Branded Sandbox Trial', probability: 45, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', slaDays: 10 },
      { id: 'bureau-signed', name: 'Partnership Agreement', probability: 80, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', slaDays: 7 },
      { id: 'bureau-live', name: 'Live Branded Setup', probability: 100, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', slaDays: 30 }
    ]
  }
];

export default function PipelinesPage() {
  const [activeTab, setActiveTab] = useState<'forecast' | 'tax' | 'book' | 'rep' | 'credit' | 'bureau' | 'recurring' | 'owner' | 'close' | 'map' | 'custom'>('tax');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  /* ── LIVE deal actions: invoice via Stripe, documents via the e-sign engine ── */
  const [dealAction, setDealAction] = useState<{ busy: string; message: string }>({ busy: '', message: '' });

  const createInvoiceForDeal = async (deal: any) => {
    setDealAction({ busy: 'invoice', message: '' });
    const res = await apiFetch<{ number: string; checkoutUrl: string; stripeError?: string }>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify({ dealId: deal.id, contactId: deal.contactId }),
    });
    const d: any = res.data || {};
    setDealAction({
      busy: '',
      message: res.ok
        ? `Invoice ${d.number} created${d.checkoutUrl ? ' — payment link emailed to the client.' : ` (draft: ${d.stripeError || 'no Stripe key'})`}`
        : (d.hint || d.error || 'Invoice failed — backend not configured.'),
    });
  };

  const sendForSignature = async (deal: any, docType: string) => {
    setDealAction({ busy: docType, message: '' });
    const res = await apiFetch<{ title: string; signerEmail: string; delivered: boolean }>('/api/esign/requests', {
      method: 'POST',
      body: JSON.stringify({ contactId: deal.contactId, dealId: deal.id, docType }),
    });
    const d: any = res.data || {};
    setDealAction({
      busy: '',
      message: res.ok
        ? `“${d.title}” sent to ${d.signerEmail}${d.delivered ? '' : ' (queued — email provider not configured)'}.`
        : (d.hint || d.error || 'Signature request failed.'),
    });
  };
  const [filterText, setFilterText] = useState('');
  const [filterOwner, setFilterOwner] = useState('All');
  const [filterTier, setFilterTier] = useState('All');

  const { deals, addDeal, moveDeal, updateDeal } = useAppStore();

  // Active Pipeline definition
  const activePipelineId = activeTab === 'tax' ? 'pip-tax' : 
                         activeTab === 'book' ? 'pip-book' : 
                         activeTab === 'rep' ? 'pip-rep' : 
                         activeTab === 'credit' ? 'pip-credit' : 
                         activeTab === 'bureau' ? 'pip-bureau' : 'pip-tax';

  const activePipeline = pipelinesConfig.find(p => p.id === activePipelineId) || pipelinesConfig[0];

  // Deal list operations
  const getStageDeals = (stageId: string) => {
    return deals.filter(deal => {
      const matchStage = deal.stageId === stageId;
      const matchSearch = filterText === '' || 
        deal.name.toLowerCase().includes(filterText.toLowerCase()) ||
        deal.contactName.toLowerCase().includes(filterText.toLowerCase()) ||
        (deal.ownerName || '').toLowerCase().includes(filterText.toLowerCase());
      const matchOwner = filterOwner === 'All' || deal.ownerName === filterOwner;
      const matchTier = filterTier === 'All' || 
        (filterTier === 'Complex' && deal.filingComplexity === 'Complex') ||
        (filterTier === 'Moderate' && deal.filingComplexity === 'Moderate') ||
        (filterTier === 'Simple' && deal.filingComplexity === 'Simple');

      return matchStage && matchSearch && matchOwner && matchTier;
    });
  };

  const getStageTotal = (stageId: string) => {
    return getStageDeals(stageId).reduce((sum, deal) => sum + deal.value, 0);
  };

  // Drag simulation handler (to easily move cards in prototype without heavy DnD boilerplate)
  const handleMoveStage = (dealId: string, direction: 'forward' | 'backward') => {
    const currentDeal = deals.find(d => d.id === dealId);
    if (!currentDeal) return;

    const pipelineStages = activePipeline.stages;
    const currentIndex = pipelineStages.findIndex(s => s.id === currentDeal.stageId);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;
    if (direction === 'forward' && currentIndex < pipelineStages.length - 1) {
      targetIndex++;
    } else if (direction === 'backward' && currentIndex > 0) {
      targetIndex--;
    }

    if (targetIndex !== currentIndex) {
      const targetStage = pipelineStages[targetIndex];
      updateDeal(dealId, {
        stageId: targetStage.id,
        probability: targetStage.probability,
        daysInStage: 0 // Reset timer
      });
    }
  };

  // Metric aggregates
  const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipelineForecast = deals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);
  const atRiskValue = deals.filter(d => d.daysInStage > d.slaDays).reduce((sum, d) => sum + d.value, 0);
  const atRiskCount = deals.filter(d => d.daysInStage > d.slaDays).length;

  const activeDeal = deals.find(d => d.id === selectedDealId);

  // Proposal version mock generator for detailed drawer
  const [proposalVersions, setProposalVersions] = useState([
    { version: 'v1.0', date: '2026-05-12', status: 'Signed', total: 1250, description: 'Standard Family Retainer + Business Filing Addendum' }
  ]);

  return (
    <div className="space-y-8 text-white min-h-screen bg-[#030712] p-1 select-none relative pb-16">
      {/* Absolute Radial glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* HEADER HERO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-black text-[#D4AF37] tracking-[0.2em] uppercase">
            <Zap className="h-4 w-4 animate-pulse text-[#D4AF37]" />
            RJ BUSINESS SOLUTIONS • REVENUE OS v2.0
          </div>
          <h1 className="text-3xl font-serif font-black tracking-tight mt-1.5 bg-gradient-to-r from-white via-[#F4E5B0] to-[#D4AF37] bg-clip-text text-transparent">
            Deal Pipelines & Firm Forecasting
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xl">
            Streamline tax returns, client cleanup retainers, CROA audit tracks, and multi-rep commission splits in high-fidelity luxury views.
          </p>
        </div>

        <button 
          onClick={() => {
            const name = prompt("Enter new deal name:");
            if (name) {
              const newDeal: Deal = {
                id: `deal-${Date.now()}`,
                name,
                contactName: 'New Prospect Client',
                value: 2500,
                probability: 10,
                stageId: activePipeline.stages[0].id,
                ownerId: 'usr-1',
                ownerName: 'Loyce Smith',
                tags: ['Intake'],
                createdAt: new Date().toISOString().split('T')[0],
                expectedCloseDate: '2026-07-15',
                source: 'Manual Creation',
                daysInStage: 0,
                slaDays: 5,
                aiScore: 65,
                aiRationale: ['Manually created lead with baseline criteria.'],
                aiNextAction: 'Establish initial discovery consultation.',
                commissionPlan: 'Standard Prep Plan (10%)',
                commissionSplits: [{ name: 'Loyce Smith', pct: 100 }]
              };
              addDeal(newDeal);
            }
          }}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 transition-all hover:shadow-amber-500/25 active:scale-95"
        >
          <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
          Create New Deal
        </button>
      </div>

      {/* STICKY HEADER COCKPIT */}
      <div className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-xl border border-amber-500/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-amber-500/10">
          <div>
            <div className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">💰 Pipeline Value</div>
            <div className="text-3xl font-serif font-black text-white mt-1.5 flex items-baseline gap-2">
              ${totalPipelineValue.toLocaleString()}
              <span className="text-xs font-mono font-bold text-emerald-400">↑ 24.2%</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">vs previous seasonal period</div>
          </div>

          <div className="border-l border-amber-500/10 md:pl-6">
            <div className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">🎯 Forecast (Weighted)</div>
            <div className="text-3xl font-serif font-black text-[#D4AF37] mt-1.5 flex items-baseline gap-2">
              ${weightedPipelineForecast.toLocaleString()}
              <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">73% Confidence</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">AI calculated monthly target</div>
          </div>

          <div className="border-l border-amber-500/10 md:pl-6">
            <div className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">📈 Velocity (30d)</div>
            <div className="text-3xl font-serif font-black text-emerald-400 mt-1.5 flex items-baseline gap-2">
              $4,210<span className="text-xs font-sans text-slate-400 font-bold">/day</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">12-day average sales lifecycle</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 pb-5 border-b border-amber-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
              <Award className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Won This Month</div>
              <p className="text-lg font-bold text-white mt-0.5">$82,400 <span className="text-xs font-mono text-slate-400 font-normal">(18 deals)</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-l border-amber-500/10 md:pl-6">
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-2xl">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Lost This Month</div>
              <p className="text-lg font-bold text-white mt-0.5">$12,100 <span className="text-xs font-mono text-slate-400 font-normal">(4 deals)</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-l border-amber-500/10 md:pl-6">
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-pulse">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">⏳ At Risk (&gt;SLA)</div>
              <p className="text-lg font-bold text-amber-400 mt-0.5">${atRiskValue.toLocaleString()} <span className="text-xs font-mono text-slate-400 font-normal">({atRiskCount} deals)</span></p>
            </div>
          </div>
        </div>

        {/* Micro ratios summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-6">
            <span>📊 Win Rate: <strong className="text-white">67%</strong></span>
            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
            <span>📞 Avg Touches to Close: <strong className="text-white">5.4</strong></span>
            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
            <span>💵 Average Contract Value: <strong className="text-white">$4,578</strong></span>
          </div>
          
          <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[#D4AF37]/5 px-3 py-1 rounded-full border border-amber-500/10">
            <ShieldCheck className="h-3.5 w-3.5" />
            FCRA & Circular 230 Compliant OS
          </div>
        </div>
      </div>

      {/* 11 PIPELINE LENS TAB STRIP */}
      <div className="flex gap-2 p-1 bg-neutral-950/60 border border-amber-500/10 rounded-2xl overflow-x-auto scrollbar-none sticky top-[240px] z-30 backdrop-blur-xl">
        {[
          { id: 'forecast', label: 'CFO Forecast', icon: BarChart3 },
          { id: 'tax', label: 'Tax Prep', icon: FlameIcon },
          { id: 'book', label: 'Bookkeeping', icon: Layers },
          { id: 'rep', label: 'IRS Rep Defense', icon: FileSignature },
          { id: 'credit', label: 'Credit Repair', icon: ShieldCheck },
          { id: 'bureau', label: 'Service Bureau', icon: Users },
          { id: 'recurring', label: 'MRR Table', icon: RefreshCw },
          { id: 'owner', label: 'By Rep', icon: User },
          { id: 'close', label: 'By Close Date', icon: Calendar },
          { id: 'map', label: 'Map View', icon: MapPin },
          { id: 'custom', label: 'Custom Fields', icon: Settings }
        ].map(tab => {
          const IconComponent = tab.icon || TrendingUp;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black shadow-lg shadow-amber-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* FILTER & ADVANCED QUERY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-950/40 border border-amber-500/10 p-5 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search deals, contacts, or reps..." 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-neutral-950/80 border border-amber-500/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] font-mono"
          />
        </div>

        <div>
          <select 
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="w-full bg-neutral-950/80 border border-amber-500/10 rounded-xl py-2.5 px-4 text-xs text-slate-300 focus:outline-none focus:border-[#D4AF37] font-mono"
          >
            <option value="All">Filter by Owner (All)</option>
            <option value="Loyce Smith">Loyce Smith (Account Manager)</option>
            <option value="Eugene Vance">Eugene Vance (Senior Partner)</option>
            <option value="Marcus Vance">Marcus Vance (Audit Director)</option>
          </select>
        </div>

        <div>
          <select 
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="w-full bg-neutral-950/80 border border-amber-500/10 rounded-xl py-2.5 px-4 text-xs text-slate-300 focus:outline-none focus:border-[#D4AF37] font-mono"
          >
            <option value="All">Filing Complexity (All)</option>
            <option value="Simple">Simple Form Returns</option>
            <option value="Moderate">Moderate Retainers</option>
            <option value="Complex">Complex Commercial Files</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-neutral-900 border border-amber-500/10 rounded-xl text-xs font-mono font-bold py-2.5 text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all flex items-center justify-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            More Filters
          </button>
          <button 
            onClick={() => {
              setFilterText('');
              setFilterOwner('All');
              setFilterTier('All');
            }}
            className="px-3 bg-neutral-900 border border-amber-500/10 rounded-xl text-xs font-mono font-bold hover:text-red-400 transition-all"
            title="Reset Filters"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ====================================
          LENS 1: CFO FORECAST DASHBOARD VIEW
          ==================================== */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Waterfall Scenario Chart */}
            <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 relative overflow-hidden lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-serif font-black text-sm tracking-wide text-white uppercase">Revenue Waterfall Forecasting</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Simulated projection model for tax-season MRR & pipeline expansion</p>
                </div>
                <div className="text-xs font-mono text-[#D4AF37] bg-[#D4AF37]/5 px-3 py-1 rounded border border-amber-500/10">
                  Target: +18.4% MRR
                </div>
              </div>

              {/* Waterfall Bars */}
              <div className="grid grid-cols-5 gap-4 h-48 items-end pt-4 pb-2 border-b border-amber-500/10">
                {[
                  { label: 'Starting MRR', val: 84000, color: 'bg-indigo-500/40 border-indigo-500/60' },
                  { label: 'New Won', val: 18500, color: 'bg-emerald-500/40 border-emerald-500/60' },
                  { label: 'Expansion', val: 6200, color: 'bg-teal-500/40 border-teal-500/60' },
                  { label: 'Churn Risk', val: -4100, color: 'bg-red-500/30 border-red-500/50' },
                  { label: 'Ending Proj', val: 104600, color: 'bg-gradient-to-t from-amber-600/40 to-[#D4AF37]/50 border-amber-500/60' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold mb-2 text-slate-300">
                      {item.val < 0 ? '-' : ''}${Math.abs(item.val).toLocaleString()}
                    </span>
                    <div 
                      className={`w-full ${item.color} rounded-t-xl border transition-all group-hover:brightness-125 duration-300`}
                      style={{ height: `${Math.min(100, Math.max(10, (Math.abs(item.val) / 110000) * 100))}%` }}
                    />
                    <span className="text-[9px] font-mono text-slate-500 mt-2 text-center leading-tight truncate w-full">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Coverage Ratio Gauge */}
            <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div>
                <h3 className="font-serif font-black text-sm tracking-wide text-white uppercase mb-1">Pipeline Coverage Ratio</h3>
                <p className="text-[10px] text-slate-400 font-mono">Open Pipeline vs Total Seasonal Quota ($100k)</p>
              </div>

              <div className="py-6 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center border-4 border-dashed border-emerald-500/20 rounded-full">
                  <div className="absolute inset-2 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin duration-3000 opacity-60" />
                  <div className="text-center z-10">
                    <p className="text-3xl font-serif font-black text-emerald-400">3.4x</p>
                    <p className="text-[9px] font-mono text-emerald-300 uppercase tracking-widest font-black mt-1">Healthy Range</p>
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] font-mono text-slate-400 border-t border-amber-500/10 pt-4">
                🟢 Green Zone: &gt;3.0x coverage ensures quota is secured with standard 30% pipeline win ratios.
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stage Conversion Funnel */}
            <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-black text-sm tracking-wide text-white uppercase mb-4">Stage Conversion Funnel</h3>
                <div className="space-y-3">
                  {[
                    { stage: 'Inake & Consultation', rate: 100, count: '48 Leads', color: 'bg-indigo-500' },
                    { stage: 'Engagement Proposal Sent', rate: 72, count: '34 proposal', color: 'bg-blue-500' },
                    { stage: 'Contract Executed & Paid', rate: 48, count: '23 Won', color: 'bg-purple-500' },
                    { stage: 'Completed & Accepted', rate: 38, count: '18 Accepted', color: 'bg-[#D4AF37]' }
                  ].map((row, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-300">
                        <span>{row.stage} ({row.count})</span>
                        <span>{row.rate}%</span>
                      </div>
                      <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-amber-500/5">
                        <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[9px] font-mono text-slate-500 mt-4 text-center">Avg transition: Intake to Won = 14 days</p>
            </div>

            {/* Best Case / Worst Case Scenario Simulator */}
            <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-black text-sm tracking-wide text-white uppercase mb-1">Scenario Forecasting</h3>
                <p className="text-[10px] text-slate-400 font-mono mb-4">Probability band analysis</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold">🌟 Best Case</span>
                    <span className="text-white">$310,400</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">All 85% probability deals close</div>
                </div>

                <div className="border-t border-amber-500/10 pt-3">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#D4AF37] font-bold">🤝 Commit</span>
                    <span className="text-white">$187,420</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">Weighted pipeline average</div>
                </div>

                <div className="border-t border-amber-500/10 pt-3">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-red-400 font-bold">⚠️ Worst Case</span>
                    <span className="text-white">$92,000</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">Only signed retainers execute</div>
                </div>
              </div>
            </div>

            {/* Aging Buckets */}
            <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-black text-sm tracking-wide text-white uppercase mb-1">SLA Aging Buckets</h3>
                <p className="text-[10px] text-slate-400 font-mono mb-4">Click to inspect delayed files</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '0-7 Days', count: 14, alert: false },
                  { label: '8-14 Days', count: 6, alert: false },
                  { label: '15-30 Days', count: 3, alert: true },
                  { label: '30+ Days stuck', count: 1, alert: true }
                ].map((bucket, idx) => (
                  <button 
                    key={idx} 
                    className="p-3 bg-neutral-900/60 border border-amber-500/5 hover:border-amber-500/20 rounded-2xl transition-all text-left flex flex-col justify-between"
                  >
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">{bucket.label}</span>
                    <span className={`text-xl font-serif font-black mt-1 ${bucket.alert ? 'text-amber-400' : 'text-white'}`}>{bucket.count}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ====================================
          LENS 7: RECURRING / MRR TABLE VIEW
          ==================================== */}
      {activeTab === 'recurring' && (
        <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-serif font-black text-base text-white">Retainer Subscription Health ledger</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">Bookkeeping recurring MRR contracts & annual license splits</p>
            </div>
            <div className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl">
              Active MRR: $34,850/mo
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-amber-500/10 text-slate-400 uppercase tracking-widest text-[10px]">
                  <th className="py-4 px-4">Client Name</th>
                  <th className="py-4 px-4">Service Plan</th>
                  <th className="py-4 px-4">Monthly Retainer (MRR)</th>
                  <th className="py-4 px-4">Annualized Val (ARR)</th>
                  <th className="py-4 px-4">Started</th>
                  <th className="py-4 px-4">Tenure</th>
                  <th className="py-4 px-4">Health Status</th>
                  <th className="py-4 px-4">Next Renewal</th>
                  <th className="py-4 px-4">Lead Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/5">
                {[
                  { name: 'Smith Consulting LLC', service: 'Full Bookkeeping + Tax Care', mrr: 850, arr: 10200, start: '2024-03', tenure: '26 mo', health: '🟢 Healthy', renew: 'Auto-Renew', owner: 'Loyce Smith' },
                  { name: 'Davis Dental Group LLC', service: 'CPA Advisor Suite', mrr: 1400, arr: 16800, start: '2023-11', tenure: '30 mo', health: '🟡 Slow Docs', renew: '2026-11-30', owner: 'Loyce Smith' },
                  { name: 'Apex Logistics Inc', service: 'Bookkeeping MRR', mrr: 1000, arr: 12000, start: '2025-05', tenure: '12 mo', health: '🟢 Healthy', renew: 'Auto-Renew', owner: 'Eugene Vance' },
                  { name: 'Golden Shield Financial', service: 'Service Bureau License', mrr: 2500, arr: 30000, start: '2026-05', tenure: '1 mo', health: '🔴 Churn Risk', renew: '2026-08-01', owner: 'Eugene Vance' }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-4 px-4 text-white font-bold">{row.name}</td>
                    <td className="py-4 px-4 text-[#D4AF37]">{row.service}</td>
                    <td className="py-4 px-4 text-white font-black">${row.mrr.toLocaleString()}/mo</td>
                    <td className="py-4 px-4 text-slate-400">${row.arr.toLocaleString()}</td>
                    <td className="py-4 px-4 text-slate-400">{row.start}</td>
                    <td className="py-4 px-4 text-slate-400">{row.tenure}</td>
                    <td className="py-4 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        row.health.startsWith('🟢') ? 'bg-emerald-500/10 text-emerald-400' :
                        row.health.startsWith('🟡') ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                      }`}>{row.health}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{row.renew}</td>
                    <td className="py-4 px-4 text-slate-300 font-bold">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================
          LENS 8: MAP VIEW (MULTI-STATE FIRM)
          ==================================== */}
      {activeTab === 'map' && (
        <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 shadow-2xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-neutral-900/60 border border-amber-500/5 rounded-2xl h-80 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Simulated premium vector map dots */}
            <div className="absolute top-12 left-16 w-3 h-3 bg-[#D4AF37] rounded-full animate-ping" />
            <div className="absolute top-12 left-16 w-3 h-3 bg-[#D4AF37] rounded-full" />
            <div className="absolute top-36 left-48 w-3 h-3 bg-[#D4AF37] rounded-full animate-ping" />
            <div className="absolute top-36 left-48 w-3 h-3 bg-[#D4AF37] rounded-full" />
            <div className="absolute top-24 right-24 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            <div className="absolute top-24 right-24 w-3 h-3 bg-amber-500 rounded-full" />

            <MapPin className="h-10 w-10 text-[#D4AF37] mb-2 animate-bounce" />
            <p className="text-xs font-mono font-black uppercase text-white tracking-widest">Multi-State Jurisdictional Map</p>
            <p className="text-[10px] text-slate-400 font-mono mt-1 text-center max-w-sm">Geographical deal mapping for CA, TX, FL, NM, and NY states with built-in preparer registration audits.</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif font-black text-sm uppercase text-white">State Volume Rankings</h3>
            <div className="space-y-3">
              {[
                { state: 'California (FTB filings)', deals: '12 active', value: '$45,800', compliance: 'CTEC Registered' },
                { state: 'Texas (Franchise Tax)', deals: '8 active', value: '$32,100', compliance: 'No Individual state tax' },
                { state: 'New York (NYS filings)', deals: '4 active', value: '$18,500', compliance: 'NY Registration Verified' },
                { state: 'New Mexico (NMTax)', deals: '3 active', value: '$11,250', compliance: 'Local physical nexus' }
              ].map((row, idx) => (
                <div key={idx} className="p-3.5 bg-neutral-900/60 border border-amber-500/5 rounded-xl flex justify-between items-center text-xs font-mono">
                  <div>
                    <p className="text-white font-black">{row.state}</p>
                    <p className="text-[9px] text-[#D4AF37] mt-0.5">{row.compliance}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black">{row.value}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{row.deals}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================
          LENS 9: OTHER PLACEHOLDER VIEWS
          ==================================== */}
      {(activeTab === 'owner' || activeTab === 'close' || activeTab === 'custom') && (
        <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <SlidersHorizontal className="h-10 w-10 text-[#D4AF37] mb-3 animate-pulse" />
          <h3 className="font-serif font-black text-lg text-white uppercase tracking-wider">Advanced Pivot Lens</h3>
          <p className="text-xs text-slate-400 font-mono mt-1 max-w-md">You are viewing a custom filtered layout lens. The active pipeline deals are currently re-grouped dynamic-pivot configurations in the database layer.</p>
          <button onClick={() => setActiveTab('tax')} className="mt-5 px-5 py-2.5 bg-neutral-900 border border-amber-500/20 text-[#D4AF37] font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-950 transition-all">
            Return to Kanban View
          </button>
        </div>
      )}

      {/* ====================================
          STANDARD KANBAN BOARD CONTROLLER
          ==================================== */}
      {['tax', 'book', 'rep', 'credit', 'bureau'].includes(activeTab) && (
        <div className="bg-neutral-950/40 border border-amber-500/10 rounded-3xl p-6 shadow-2xl relative">
          
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            {activePipeline.stages.map((stage) => {
              const stageDeals = getStageDeals(stage.id);
              return (
                <div key={stage.id} className="w-80 flex-shrink-0 flex flex-col max-h-[700px]">
                  
                  {/* Stage Column Header */}
                  <div className="bg-neutral-900/90 border border-amber-500/10 rounded-2xl p-4 mb-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-black text-white text-xs tracking-wide uppercase">{stage.name}</h3>
                      <div className="text-[9px] font-mono text-slate-500 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-amber-500/5">
                        SLA: {stage.slaDays}d
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs font-mono">
                      <span className="text-slate-400 font-bold">{stageDeals.length} deals</span>
                      <span className="font-extrabold text-[#D4AF37]">
                        ${getStageTotal(stage.id).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Stage Cards List */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent min-h-[400px]">
                    {stageDeals.map((deal) => {
                      const isOverSLA = deal.daysInStage > stage.slaDays;
                      return (
                        <div
                          key={deal.id}
                          className="bg-neutral-900/40 backdrop-blur-md border border-amber-500/5 hover:border-[#D4AF37]/30 rounded-2xl p-4 shadow-lg cursor-pointer hover:shadow-amber-500/5 transition-all duration-300 group relative"
                        >
                          {/* SLA Overdue Ribbon */}
                          {isOverSLA && (
                            <div className="absolute top-3 right-3 bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase animate-pulse">
                              stuck {deal.daysInStage}d
                            </div>
                          )}

                          {/* AI Likelihood Badge */}
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] font-mono font-bold bg-neutral-950 text-slate-400 px-2 py-0.5 rounded border border-amber-500/5">
                              {deal.source}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              deal.aiScore >= 80 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' :
                              deal.aiScore >= 50 ? 'bg-amber-500/10 text-amber-300 border-amber-500/25' :
                              'bg-red-500/10 text-red-300 border-red-500/25'
                            }`}>
                              🤖 AI: {deal.aiScore}%
                            </span>
                          </div>

                          <h4 
                            onClick={() => setSelectedDealId(deal.id)}
                            className="font-serif font-black text-xs text-slate-200 group-hover:text-amber-400 transition-colors tracking-wide leading-relaxed"
                          >
                            {deal.name}
                          </h4>

                          <p className="text-[10px] text-slate-400 font-mono mt-1">Client: <span className="text-white font-bold">{deal.contactName}</span></p>

                          {/* Flexible Specialized Context Fields on Card */}
                          {deal.filingComplexity && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] font-mono font-bold bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded border border-amber-500/15 uppercase">
                                {deal.filingComplexity} complexity
                              </span>
                              {deal.dependentsCount !== undefined && deal.dependentsCount > 0 && (
                                <span className="text-[9px] font-mono text-slate-500">
                                  👨‍👩‍👧 {deal.dependentsCount} Dependents
                                </span>
                              )}
                            </div>
                          )}

                          {deal.mrrAmount && (
                            <div className="text-[9px] font-mono text-[#D4AF37] font-bold mt-2 bg-[#D4AF37]/5 px-2 py-1 rounded">
                              💼 Retainer Plan: ${deal.mrrAmount}/mo | MRR
                            </div>
                          )}

                          {deal.irsNoticeType && (
                            <div className="text-[9px] font-mono text-red-400 font-bold mt-2 bg-red-500/5 px-2 py-1 rounded border border-red-500/10">
                              ⚠️ Notice: {deal.irsNoticeType}
                            </div>
                          )}

                          {deal.croaDisclosureSent && (
                            <div className="text-[9px] font-mono text-emerald-400 font-bold mt-2 flex items-center gap-1">
                              ✓ CROA Disclosure Locked
                            </div>
                          )}

                          {/* Quick details summation */}
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-sm font-serif font-black text-[#D4AF37]">
                              ${deal.value.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 bg-neutral-950 px-2 py-0.5 rounded border border-amber-500/5">
                              {deal.probability}% Win Prob
                            </span>
                          </div>

                          {/* Action Controls for Drag Simulation */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-500/5">
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => handleMoveStage(deal.id, 'backward')}
                                className="px-2 py-1 bg-neutral-950 border border-amber-500/10 hover:border-[#D4AF37] rounded-md text-[9px] text-slate-400 hover:text-white transition-all font-mono"
                                title="Move stage backward"
                              >
                                ◀ Left
                              </button>
                              <button 
                                onClick={() => handleMoveStage(deal.id, 'forward')}
                                className="px-2 py-1 bg-neutral-950 border border-amber-500/10 hover:border-[#D4AF37] rounded-md text-[9px] text-slate-400 hover:text-white transition-all font-mono"
                                title="Move stage forward"
                              >
                                Right ▶
                              </button>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">Owner: {deal.ownerName ? deal.ownerName.split(' ')[0] : 'Unassigned'}</span>
                          </div>

                        </div>
                      );
                    })}

                    {stageDeals.length === 0 && (
                      <div className="bg-neutral-950/20 rounded-2xl py-16 border-2 border-dashed border-amber-500/5 text-center flex flex-col items-center justify-center">
                        <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest">Stage Empty</p>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================
          DEAL DETAIL SLIDE-OUT DRAWER (11 TABS)
          ========================================= */}
      {selectedDealId && activeDeal && (
        <div className="fixed inset-y-0 right-0 w-full lg:w-[680px] bg-neutral-950 border-l border-amber-500/15 shadow-2xl z-50 flex flex-col animate-slide-in">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-amber-500/15 bg-neutral-900/90 flex justify-between items-start">
            <div className="space-y-1">
              <span className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-amber-500/20 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold">
                {activePipeline.stages.find(s => s.id === activeDeal.stageId)?.name || 'Proposal Stage'}
              </span>
              <h2 className="text-xl font-serif font-black text-white mt-2 leading-tight">
                {activeDeal.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Primary Contact: <span className="text-white font-bold">{activeDeal.contactName}</span> {activeDeal.spouseName && `& Spouse ${activeDeal.spouseName}`}
              </p>
            </div>
            
            <button 
              onClick={() => setSelectedDealId(null)}
              className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-amber-500/10 rounded-2xl text-slate-400 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* INTERNAL 11 DRAWER TABS SELECTOR */}
          <div className="flex gap-1 bg-neutral-900 px-4 py-2 border-b border-amber-500/10 overflow-x-auto scrollbar-none text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'contacts', label: 'Linked Contacts' },
              { id: 'activities', label: 'Activities' },
              { id: 'tasks', label: 'Checklists' },
              { id: 'docs', label: 'Documents Secure' },
              { id: 'quotes', label: 'Quotes & Proposals' },
              { id: 'billing', label: 'Invoices' },
              { id: 'ai', label: 'AI Brain Scoring' },
              { id: 'commission', label: 'Commissions' },
              { id: 'compete', label: 'Competitors' },
              { id: 'timeline', label: 'Timeline log' }
            ].map(drawerTab => {
              const isSelected = activeDeal.croaDisclosureSent ? (drawerTab.id === 'ai') : (drawerTab.id === 'overview'); // simulate internal routing or state simple
              return (
                <button 
                  key={drawerTab.id}
                  onClick={() => alert(`Navigated inside Drawer to: ${drawerTab.label}`)}
                  className="px-3 py-2 hover:text-[#D4AF37] transition-all whitespace-nowrap"
                >
                  {drawerTab.label}
                </button>
              );
            })}
          </div>

          {/* SCROLLABLE DRAWER CANVAS PANEL */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            
            {/* TAB 1 CONTENT SUMMARY: OVERVIEW PANEL */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900 border border-amber-500/10 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">Deal Value</span>
                  <p className="text-2xl font-serif font-black text-white mt-1">${activeDeal.value.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-neutral-900 border border-amber-500/10 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">Win Probability</span>
                  <p className="text-2xl font-serif font-black text-[#D4AF37] mt-1">{activeDeal.probability}%</p>
                </div>
              </div>

              {/* Tax Pricing Calculation Breakdown */}
              <div className="p-5 bg-neutral-900/60 border border-amber-500/10 rounded-2xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-amber-500/10">
                  <h4 className="font-serif font-black text-xs text-white uppercase tracking-wider">Revenue Fee Model Breakdown</h4>
                  <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-[#D4AF37] border border-amber-500/20 px-2 py-0.5 rounded">
                    Structure: {activeDeal.feeStructure || 'Flat Rate'}
                  </span>
                </div>

                {/* Circular 230 Warning Banner */}
                {activeDeal.feeStructure === 'percent_refund' && (
                  <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl flex gap-3 text-xs text-red-400 font-mono leading-relaxed">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div>
                      <strong>⚠️ Circular 230 §10.27 Compliance Notice:</strong> Fee calculated as % of refund is prohibited for original filings. Ensure this is for an amended return or private dispute defense.
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Tax Filing Preparation Rate:</span>
                    <span className="text-white font-bold">$750.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Schedule-C Business Addendum:</span>
                    <span className="text-white font-bold">$400.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Multi-State Allocations (x2 states):</span>
                    <span className="text-white font-bold">$100.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-amber-500/5 pt-2">
                    <span>Firm Discount Apply (Partner Override):</span>
                    <span className="text-red-400 font-bold">-$100.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>State Sales Tax (NM Gross Receipts 5.12%):</span>
                    <span className="text-white font-bold">$58.88</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-sm border-t border-amber-500/10 pt-3">
                    <span>Total Client Charge:</span>
                    <span className="text-[#D4AF37]">${activeDeal.value.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* CRM Interactive checklists */}
              <div className="bg-neutral-900/40 border border-amber-500/10 rounded-2xl p-5 space-y-4">
                <h4 className="font-serif font-black text-xs text-white uppercase tracking-wider">Required Stage-Advance checklist</h4>
                <div className="space-y-3">
                  {[
                    { text: 'Engagement letter signed & executed', done: true },
                    { text: 'Base retainer invoice generated via Stripe', done: true },
                    { text: 'W-2 / 1099 form tax organizers returned', done: false },
                    { text: 'Secure vault OCR folder verification passed', done: false }
                  ].map((chk, idx) => (
                    <label key={idx} className="flex items-center gap-3 text-xs font-mono text-slate-300 cursor-pointer hover:text-white select-none">
                      <input 
                        type="checkbox" 
                        defaultChecked={chk.done} 
                        className="h-4 w-4 bg-neutral-950 rounded border-amber-500/20 text-[#D4AF37] focus:ring-0 focus:ring-offset-0" 
                      />
                      <span className={chk.done ? 'line-through text-slate-500' : ''}>{chk.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Commission Splits tracking */}
              <div className="p-5 bg-neutral-900/60 border border-amber-500/10 rounded-2xl space-y-3 text-xs font-mono">
                <h4 className="font-serif font-black text-xs text-white uppercase tracking-wider">Agent Splits & Manager Overrides</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Primary Closer (Loyce Smith):</span>
                    <span className="text-white font-bold">70% Split ($875.00 base)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Assigned SDR (Eugene Vance):</span>
                    <span className="text-white font-bold">30% Split ($375.00 base)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-amber-500/5 pt-2">
                    <span>Practice Manager Override Bonus (10%):</span>
                    <span className="text-emerald-400 font-bold">+$125.00</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Clawback Protection:</span>
                    <span>30 days statutory risk lock</span>
                  </div>
                </div>
              </div>

              {/* AI Copilot Nightly Scoring Analysis */}
              <div className="p-5 bg-neutral-900 border border-amber-500/10 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 animate-pulse text-[#D4AF37]" />
                  🤖 AI Copilot Nightly Scoring Diagnostic
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center p-3 bg-neutral-950 border border-amber-500/10 rounded-xl col-span-1">
                    <p className="text-3xl font-serif font-black text-[#D4AF37]">{activeDeal.aiScore}</p>
                    <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1">Confidence rating</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs font-bold text-white">Next Best Suggested Action:</p>
                    <p className="text-[11px] text-emerald-300 font-mono italic">"{activeDeal.aiNextAction}"</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-amber-500/5 pt-3 text-[11px] text-slate-400 font-mono">
                  {activeDeal.aiRationale.map((rat, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <p>{rat}</p>
                    </div>
                  ))}
                </div>

                {activeDeal.aiStageSuggestion && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-xs font-mono text-amber-300">
                    💡 <strong>AI Smart Transition Trigger:</strong> {activeDeal.aiStageSuggestion}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* LIVE Deal Actions — invoice + e-signature run against the edge API */}
          <div className="px-6 pt-5 border-t border-amber-500/15 bg-neutral-900/60 space-y-3">
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => createInvoiceForDeal(activeDeal)}
                disabled={dealAction.busy !== ''}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider disabled:opacity-40"
              >
                {dealAction.busy === 'invoice' ? 'Creating…' : 'Create invoice'}
              </button>
              <button
                onClick={() => sendForSignature(activeDeal, 'engagement_letter')}
                disabled={dealAction.busy !== ''}
                className="px-4 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-black uppercase tracking-wider disabled:opacity-40"
              >
                {dealAction.busy === 'engagement_letter' ? 'Sending…' : 'Send engagement letter'}
              </button>
              <button
                onClick={() => sendForSignature(activeDeal, 'form_8879')}
                disabled={dealAction.busy !== ''}
                className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider disabled:opacity-40"
              >
                {dealAction.busy === 'form_8879' ? 'Sending…' : 'Send Form 8879'}
              </button>
              <button
                onClick={() => sendForSignature(activeDeal, 'consent_7216')}
                disabled={dealAction.busy !== ''}
                className="px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[11px] font-black uppercase tracking-wider disabled:opacity-40"
              >
                {dealAction.busy === 'consent_7216' ? 'Sending…' : '§7216 consent'}
              </button>
            </div>
            {dealAction.message && (
              <p className="text-[11px] font-mono text-amber-300 pb-1">{dealAction.message}</p>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-6 border-t border-amber-500/15 bg-neutral-900/90 flex gap-4">
            <button 
              onClick={() => alert('Deal locked into corporate ledger.')}
              className="flex-1 py-3 bg-neutral-950 border border-amber-500/15 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Lock Closed Won
            </button>

            <button 
              onClick={() => {
                alert('Tax returns metadata synced to partner API TaxSlayer Pro!');
              }}
              className="flex-1 py-3 bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4 stroke-[2.5]" />
              Push to TaxSlayer
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

// Flame icon simple helper
function FlameIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
