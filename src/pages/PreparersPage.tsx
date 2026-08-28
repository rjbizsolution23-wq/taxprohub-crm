import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Plus, DollarSign, Award, CheckCircle2, Clock, 
  AlertTriangle, Filter, Trash2, Edit, ArrowUpRight, ShieldAlert,
  Coins, Sparkles, Building2, Eye, Calendar, BookOpen, Calculator
} from 'lucide-react';
import { useAppStore } from '../store';
import { Preparer, Payout } from '../types';

export default function PreparersPage() {
  const navigate = useNavigate();
  const { preparers, payouts, addPreparer, updatePreparer, deletePreparer, addPayout, updatePayout, deletePayout } = useAppStore();

  // Tabs: 'directory' | 'ledger' | 'simulator' | 'credentials'
  const [activeTab, setActiveTab] = useState<'directory' | 'ledger' | 'simulator' | 'credentials'>('directory');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [structureFilter, setStructureFilter] = useState<string>('all');

  // Drawer / Modal States
  const [showAddPrepDrawer, setShowAddAddPrepDrawer] = useState(false);
  const [showLogPayoutModal, setShowLogPayoutModal] = useState(false);

  // New Preparer Form State
  const [newPrep, setNewPrep] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'junior_preparer' as Preparer['role'],
    ptin: '',
    credentials: [] as string[],
    newCredentialInput: '',
    payStructure: 'percentage' as 'percentage' | 'flat',
    payoutRate: 30, // Default 30%
    ceCredits: 0,
    circular230Status: 'verified' as Preparer['circular230Status']
  });

  // New Payout Form State
  const [newPayout, setNewPayout] = useState({
    preparerId: '',
    baseAmount: 1000,
    method: 'direct_deposit' as Payout['method'],
    description: '',
    notes: ''
  });

  // Commission Simulator State
  const [simScenario, setSimScenario] = useState({
    projectedReturns: 100,
    avgTaxPrepFee: 450,
    selectedPrepId: 'prep-1',
    rateOverride: 40
  });

  // ----------------------------------------------------
  // STATS & CALCULATIONS (KPI Cockpit)
  // ----------------------------------------------------
  const kpis = useMemo(() => {
    const totalPayoutsThisMonth = payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayoutsCount = payouts.filter(p => p.status === 'pending').length;
    const totalPendingAmount = payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const activePreparers = preparers.filter(p => p.status === 'active').length;
    const activeRatio = preparers.length > 0 ? (activePreparers / preparers.length) * 100 : 0;

    // CE Compliance rate (preparers with >= 15 credits)
    const compliantCount = preparers.filter(p => p.ceCredits >= 15).length;
    const ceComplianceRate = preparers.length > 0 ? (compliantCount / preparers.length) * 100 : 0;

    return {
      mtdPayouts: totalPayoutsThisMonth,
      pendingCount: pendingPayoutsCount,
      pendingAmount: totalPendingAmount,
      activeRatio: activeRatio,
      ceCompliance: ceComplianceRate,
    };
  }, [preparers, payouts]);

  // Filtered Preparers
  const filteredPreparers = useMemo(() => {
    return preparers.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                            p.ptin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.credentials.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRole = roleFilter === 'all' || p.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesStructure = structureFilter === 'all' || p.payStructure === structureFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesStructure;
    });
  }, [preparers, searchQuery, roleFilter, statusFilter, structureFilter]);

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  const handleCreatePreparer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrep.firstName || !newPrep.lastName || !newPrep.email || !newPrep.ptin) {
      alert('Please fill out all required fields.');
      return;
    }

    const preparer: Preparer = {
      id: `prep_${Date.now()}`,
      firstName: newPrep.firstName,
      lastName: newPrep.lastName,
      email: newPrep.email,
      phone: newPrep.phone,
      role: newPrep.role,
      status: 'active',
      ptin: newPrep.ptin,
      credentials: newPrep.credentials,
      payStructure: newPrep.payStructure,
      payoutRate: Number(newPrep.payoutRate),
      assignedClientIds: [],
      assignedDealIds: [],
      payoutLedger: [],
      ceCredits: Number(newPrep.ceCredits) || 0,
      circular230Status: newPrep.circular230Status,
      performance: {
        completedReturns: 0,
        activeFiles: 0,
        averageRefundValue: 0,
        satisfactionScore: 5.0,
        slaComplianceRate: 100,
        revenueGenerated: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    addPreparer(preparer);
    setShowAddAddPrepDrawer(false);
    
    // Reset form
    setNewPrep({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'junior_preparer',
      ptin: '',
      credentials: [],
      newCredentialInput: '',
      payStructure: 'percentage',
      payoutRate: 30,
      ceCredits: 0,
      circular230Status: 'verified'
    });
  };

  const handleAddCredential = () => {
    if (newPrep.newCredentialInput && !newPrep.credentials.includes(newPrep.newCredentialInput)) {
      setNewPrep({
        ...newPrep,
        credentials: [...newPrep.credentials, newPrep.newCredentialInput],
        newCredentialInput: ''
      });
    }
  };

  const handleRemoveCredential = (indexToRemove: number) => {
    setNewPrep({
      ...newPrep,
      credentials: newPrep.credentials.filter((_, idx) => idx !== indexToRemove)
    });
  };

  const handleLogPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayout.preparerId || !newPayout.baseAmount) {
      alert('Please choose a preparer and enter a base fee amount.');
      return;
    }

    const prep = preparers.find(p => p.id === newPayout.preparerId);
    if (!prep) return;

    const baseAmount = Number(newPayout.baseAmount);
    let amount = 0;
    if (prep.payStructure === 'percentage') {
      amount = Math.round(baseAmount * (prep.payoutRate / 100));
    } else {
      amount = prep.payoutRate;
    }

    const payout: Payout = {
      id: `pay_${Date.now()}`,
      preparerId: prep.id,
      preparerName: `${prep.firstName} ${prep.lastName}`,
      amount,
      baseAmount,
      commissionAmount: amount,
      method: newPayout.method,
      status: 'pending', // Pending initially as requested
      referenceNumber: `ACH-PEND-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentDate: new Date(),
      description: newPayout.description || `Payout log - Return Fee $${baseAmount}`,
      notes: newPayout.notes
    };

    addPayout(payout);
    
    // Also append to preparer's ledger & performance record
    updatePreparer(prep.id, {
      payoutLedger: [...(prep.payoutLedger || []), payout],
      performance: {
        ...prep.performance,
        completedReturns: prep.performance.completedReturns + 1,
        revenueGenerated: prep.performance.revenueGenerated + baseAmount
      }
    });

    setShowLogPayoutModal(false);
    // Reset payout form
    setNewPayout({
      preparerId: '',
      baseAmount: 1000,
      method: 'direct_deposit',
      description: '',
      notes: ''
    });
  };

  const handleApproveACH = (payoutId: string) => {
    const payout = payouts.find(p => p.id === payoutId);
    if (!payout) return;

    // Simulate ACH payout execution
    const updated: Partial<Payout> = {
      status: 'completed',
      referenceNumber: `ACH-CLR-${Math.floor(10000000 + Math.random() * 90000000)}`,
      paymentDate: new Date()
    };

    updatePayout(payoutId, updated);
  };

  // Commission Scenario Engine calculation
  const simResults = useMemo(() => {
    const prep = preparers.find(p => p.id === simScenario.selectedPrepId);
    if (!prep) return null;

    const totalRevenue = simScenario.projectedReturns * simScenario.avgTaxPrepFee;
    let prepPayout = 0;
    
    const rate = simScenario.rateOverride;
    if (prep.payStructure === 'percentage') {
      prepPayout = totalRevenue * (rate / 100);
    } else {
      prepPayout = simScenario.projectedReturns * rate;
    }

    const firmRetention = totalRevenue - prepPayout;

    return {
      totalRevenue,
      prepPayout,
      firmRetention,
      structure: prep.payStructure,
      rate
    };
  }, [preparers, simScenario]);

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-[#D4AF37]" />
            Preparers & Firm Payouts
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track preparer compensation ledgers, credentials, CE requirements, and automate ACH payout compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowLogPayoutModal(true)}
            className="px-4 py-2 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#D4AF37] font-semibold text-xs rounded-xl flex items-center gap-2 bg-[#D4AF37]/5 transition-all duration-300"
          >
            <DollarSign className="h-4 w-4" />
            Log Custom Payout
          </button>
          <button 
            onClick={() => setShowAddAddPrepDrawer(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 hover:opacity-90 shadow-lg shadow-amber-500/10 transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Add New Preparer
          </button>
        </div>
      </div>

      {/* STICKY KPI COCKPIT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800/80 rounded-2xl p-5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">MTD Payouts (Cleared)</span>
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">${kpis.mtdPayouts.toLocaleString()}</span>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">▲ Automated ACH Processed</div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800/80 rounded-2xl p-5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Pending Reviews</span>
            <div className="p-1.5 bg-amber-500/10 border border-[#D4AF37]/20 text-[#D4AF37] rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">{kpis.pendingCount} Pending</span>
            <div className="text-[10px] text-[#D4AF37] font-mono mt-1">Total value: ${kpis.pendingAmount.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800/80 rounded-2xl p-5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">CE Compliance Rate</span>
            <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">{kpis.ceCompliance.toFixed(1)}%</span>
            <div className="text-[10px] text-blue-400 font-mono mt-1">Min. 15 CE hours threshold met</div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800/80 rounded-2xl p-5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Active Staff Ratio</span>
            <div className="p-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">{kpis.activeRatio.toFixed(1)}%</span>
            <div className="text-[10px] text-sky-400 font-mono mt-1">Staff active and taking clients</div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center border-b border-neutral-800/80 gap-6">
        <button 
          onClick={() => setActiveTab('directory')}
          className={`pb-3 text-sm font-semibold transition-all duration-300 relative ${
            activeTab === 'directory' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
          }`}
        >
          Preparer Directory
          {activeTab === 'directory' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37]"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 text-sm font-semibold transition-all duration-300 relative ${
            activeTab === 'ledger' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
          }`}
        >
          Payouts Ledger
          {activeTab === 'ledger' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37]"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 text-sm font-semibold transition-all duration-300 relative ${
            activeTab === 'simulator' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
          }`}
        >
          Scenario & Rates Simulator
          {activeTab === 'simulator' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37]"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('credentials')}
          className={`pb-3 text-sm font-semibold transition-all duration-300 relative ${
            activeTab === 'credentials' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
          }`}
        >
          CE Credits & PTINs
          {activeTab === 'credentials' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37]"></span>}
        </button>
      </div>

      {/* ----------------------------------------------------
          TAB 1: PREPARER DIRECTORY
          ---------------------------------------------------- */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="flex flex-col lg:flex-row items-center gap-4 bg-neutral-950/60 border border-neutral-800/60 p-4 rounded-2xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by name, PTIN, or credentials..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800/80 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D4AF37]/50 text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-neutral-900 border border-neutral-800/80 px-3.5 py-2.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#D4AF37]/50"
              >
                <option value="all">All Roles</option>
                <option value="senior_preparer">Senior EA</option>
                <option value="junior_preparer">Junior Preparer</option>
                <option value="tax_attorney">Tax Attorney</option>
                <option value="bookkeeper">Bookkeeper</option>
                <option value="manager">Manager/CPA</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-neutral-900 border border-neutral-800/80 px-3.5 py-2.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#D4AF37]/50"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Pay structure filter */}
              <select
                value={structureFilter}
                onChange={e => setStructureFilter(e.target.value)}
                className="bg-neutral-900 border border-neutral-800/80 px-3.5 py-2.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#D4AF37]/50"
              >
                <option value="all">All Pay Structures</option>
                <option value="percentage">Percentage Split</option>
                <option value="flat">Flat Return Fee</option>
              </select>
            </div>
          </div>

          {/* PREPARERS CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPreparers.map((prep) => {
              const totalCommissions = (prep.payoutLedger || [])
                .reduce((sum, p) => sum + p.amount, 0);

              // Circular 230 Warning Flag:
              // Warning if pay structure is percentage and rate is high, 
              // or just a nice compliance notice as requested.
              const showCircular230Notice = prep.payStructure === 'percentage' && prep.payoutRate >= 45;

              return (
                <div 
                  key={prep.id}
                  className="bg-[#0b0f19] border border-neutral-800/60 rounded-2xl p-5 hover:border-[#D4AF37]/40 transition-all duration-300 flex flex-col justify-between group relative shadow-lg"
                >
                  <div>
                    {/* Top profile Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {prep.avatar ? (
                          <img 
                            src={prep.avatar} 
                            alt={prep.firstName} 
                            className="w-12 h-12 rounded-xl object-cover border border-amber-500/20"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-black text-lg">
                            {prep.firstName[0]}{prep.lastName[0]}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-sm text-white group-hover:text-[#D4AF37] transition-colors">
                            {prep.firstName} {prep.lastName}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 capitalize bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800/60 inline-block mt-1">
                            {prep.role.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                        prep.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {prep.status}
                      </span>
                    </div>

                    {/* Metadata specs */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 my-4 pt-3 border-t border-neutral-900/60 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">PTIN Code</span>
                        <span className="font-mono text-white font-semibold">{prep.ptin}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Credentials</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {prep.credentials.map((cred) => (
                            <span key={cred} className="bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#D4AF37]/20">
                              {cred}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pay Structure</span>
                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                          <Coins className="h-3 w-3 text-amber-500" />
                          {prep.payStructure === 'percentage' 
                            ? `${prep.payoutRate}% Split` 
                            : `$${prep.payoutRate} Flat/Ret`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Payouts</span>
                        <span className="text-white font-mono font-bold text-xs">${totalCommissions.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Circular 230 Warning Badge */}
                    {showCircular230Notice && (
                      <div className="bg-amber-500/10 border border-[#D4AF37]/20 rounded-xl p-2.5 flex items-start gap-2 mb-4 text-[10px] text-amber-400">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#D4AF37]" />
                        <div>
                          <span className="font-bold">Circular 230 §10.27 Compliance Notice</span>
                          <p className="text-slate-400 mt-0.5">
                            Verify that this percentage split does not include a contingency based on refund size.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action block footer */}
                  <div className="flex items-center gap-2 pt-3 border-t border-neutral-900/60 mt-auto">
                    <button 
                      onClick={() => navigate(`/preparers/${prep.id}`)}
                      className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
                      View Profile
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this preparer? This cannot be undone.')) {
                          deletePreparer(prep.id);
                        }
                      }}
                      className="p-2 bg-neutral-900 hover:bg-rose-500/10 border border-neutral-800 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                      title="Remove Staff Member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: UNIFIED PAYOUTS LEDGER & ACH
          ---------------------------------------------------- */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-900/60 pb-4 mb-4">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#D4AF37]" />
                  Payout Processing ledger (Simulated ACH)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm earnings calculations and click "Process ACH" to simulate direct deposit settlement.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                    <th className="py-3 px-4">Preparer</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Ref return / Deal value</th>
                    <th className="py-3 px-4">Earned Commission</th>
                    <th className="py-3 px-4">Log Date</th>
                    <th className="py-3 px-4">ACH Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/60">
                  {payouts.map((p) => {
                    const prep = preparers.find(pr => pr.id === p.preparerId);
                    return (
                      <tr key={p.id} className="hover:bg-neutral-900/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {p.preparerName || `${prep?.firstName} ${prep?.lastName}`}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {p.description}
                          {p.referenceNumber && (
                            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                              Ref: {p.referenceNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          ${p.baseAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-[#D4AF37] font-mono font-bold">
                          ${p.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider inline-block ${
                            p.status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.status === 'pending' && (
                              <button 
                                onClick={() => handleApproveACH(p.id)}
                                className="px-2.5 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-[#D4AF37] hover:text-white hover:bg-[#D4AF37]/20 font-bold rounded-lg text-[10px] transition-all"
                              >
                                Process ACH
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                if (confirm('Delete this payout log?')) {
                                  deletePayout(p.id);
                                }
                              }}
                              className="p-1 bg-neutral-900 border border-neutral-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: COMMISSION SCENARIO SIMULATOR
          ---------------------------------------------------- */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Slider parameters */}
            <div className="lg:col-span-1 bg-neutral-950/60 border border-neutral-800/60 rounded-2xl p-5 space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="h-4.5 w-4.5 text-[#D4AF37]" />
                Interactive Pricing Cockpit
              </h3>
              <p className="text-xs text-slate-400">
                Adjust projected returns, billing rates, and staff split models to instantly visualize margin compliance.
              </p>

              {/* Choose Preparer */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">Select Staff Profile</label>
                <select
                  value={simScenario.selectedPrepId}
                  onChange={e => {
                    const id = e.target.value;
                    const prep = preparers.find(p => p.id === id);
                    setSimScenario({
                      ...simScenario,
                      selectedPrepId: id,
                      rateOverride: prep?.payoutRate || 30
                    });
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800/80 px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#D4AF37]/50"
                >
                  {preparers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.payStructure === 'percentage' ? `${p.payoutRate}% split` : `$${p.payoutRate} flat`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Projected Returns Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Volume (Returns)</span>
                  <span className="text-white font-mono">{simScenario.projectedReturns}</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="500" 
                  step="5"
                  value={simScenario.projectedReturns}
                  onChange={e => setSimScenario({ ...simScenario, projectedReturns: Number(e.target.value) })}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
              </div>

              {/* Avg Prep Fee slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Avg. Tax Prep Fee ($)</span>
                  <span className="text-white font-mono">${simScenario.avgTaxPrepFee}</span>
                </div>
                <input 
                  type="range" 
                  min="150" 
                  max="1500" 
                  step="25"
                  value={simScenario.avgTaxPrepFee}
                  onChange={e => setSimScenario({ ...simScenario, avgTaxPrepFee: Number(e.target.value) })}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
              </div>

              {/* Rate Override slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Override Split Rate</span>
                  <span className="text-white font-mono">
                    {simResults?.structure === 'percentage' ? `${simScenario.rateOverride}%` : `$${simScenario.rateOverride}`}
                  </span>
                </div>
                <input 
                  type="range" 
                  min={simResults?.structure === 'percentage' ? "10" : "50"} 
                  max={simResults?.structure === 'percentage' ? "80" : "500"} 
                  step="1"
                  value={simScenario.rateOverride}
                  onChange={e => setSimScenario({ ...simScenario, rateOverride: Number(e.target.value) })}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
              </div>
            </div>

            {/* Results visualization */}
            {simResults && (
              <div className="lg:col-span-2 bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
                <div>
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                    Margin Performance & Profit Projections
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Visual model based on simulated settings. Check your firm retention versus payroll payouts.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Gross Practice Revenue</span>
                      <span className="text-xl font-bold font-mono text-white mt-1.5 block">${simResults.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-4 rounded-xl">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Staff Commissions Payout</span>
                      <span className="text-xl font-bold font-mono text-[#D4AF37] mt-1.5 block">${simResults.prepPayout.toLocaleString()}</span>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Net Firm Retention (Margin)</span>
                      <span className="text-xl font-bold font-mono text-emerald-400 mt-1.5 block">${simResults.firmRetention.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Circular 230 Warning Banner in Simulator */}
                  {simResults.structure === 'percentage' && simResults.rate >= 50 && (
                    <div className="bg-amber-500/10 border border-[#D4AF37]/30 rounded-xl p-3 flex items-start gap-2.5 mt-6 text-xs text-amber-300">
                      <ShieldAlert className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Circular 230 §10.27 Precaution Checklist</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Higher percentage-based payouts (50%+) are common for contractors/attorneys but are subjected to strict IRS scrutiny. Please make sure that this fee structure is flat-based per return or has a verified base amount unrelated to tax liability results.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-neutral-800/80 mt-6 text-xs text-slate-500 flex justify-between items-center">
                  <span>Simulated date: June 5, 2026</span>
                  <span>Calculations compliant with IRS Pub 4557 Guidelines</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 4: CREDENTIALS & PTIN SCHEDULES
          ---------------------------------------------------- */}
      {activeTab === 'credentials' && (
        <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-2xl p-5 space-y-6">
          <div>
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#D4AF37]" />
              Staff Continuing Education (CE) & PTIN Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Firms must ensure preparers maintain current credentials and fulfill continuing education hours annually.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {preparers.map(prep => {
              const complianceRatio = Math.min((prep.ceCredits / 15) * 100, 100);
              const isCompliant = prep.ceCredits >= 15;

              return (
                <div key={prep.id} className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center font-bold text-[#D4AF37]">
                        {prep.firstName[0]}{prep.lastName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{prep.firstName} {prep.lastName}</h4>
                        <span className="text-[10px] font-mono text-slate-400">PTIN: {prep.ptin}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                      isCompliant 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400 animate-pulse'
                    }`}>
                      {isCompliant ? 'Compliant' : 'CE Deficit'}
                    </span>
                  </div>

                  {/* CE credits bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Annual CE hours completed</span>
                      <span className="text-white font-bold">{prep.ceCredits} / 15 hours</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompliant ? 'bg-emerald-400' : 'bg-[#D4AF37]'
                        }`} 
                        style={{ width: `${complianceRatio}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Document/Credential Badge flags */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-950 text-[10px]">
                    <span className="text-slate-500">Circular 230:</span>
                    <span className="text-slate-300 font-semibold">{prep.circular230Status.toUpperCase()}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500">PTIN Exp:</span>
                    <span className="text-[#D4AF37] font-semibold">12/31/2026</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          DRAWER: ADD PREPARER (Practice Owner Triggered)
          ---------------------------------------------------- */}
      {showAddPrepDrawer && (
        <div className="fixed inset-y-0 right-0 z-55 w-full max-w-md bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col p-6 animate-slide-in font-sans">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-5">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#D4AF37]" />
              Register Staff Member
            </h3>
            <button 
              onClick={() => setShowAddAddPrepDrawer(false)}
              className="text-slate-400 hover:text-white font-mono text-xs p-1"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreatePreparer} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">First Name *</label>
                <input 
                  type="text" 
                  value={newPrep.firstName}
                  onChange={e => setNewPrep({ ...newPrep, firstName: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Last Name *</label>
                <input 
                  type="text" 
                  value={newPrep.lastName}
                  onChange={e => setNewPrep({ ...newPrep, lastName: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Email Address *</label>
              <input 
                type="email" 
                value={newPrep.email}
                onChange={e => setNewPrep({ ...newPrep, email: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Phone Number</label>
              <input 
                type="text" 
                placeholder="(505) 555-0100"
                value={newPrep.phone}
                onChange={e => setNewPrep({ ...newPrep, phone: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Staff Role</label>
                <select
                  value={newPrep.role}
                  onChange={e => setNewPrep({ ...newPrep, role: e.target.value as any })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="senior_preparer">Senior EA</option>
                  <option value="junior_preparer">Junior Preparer</option>
                  <option value="tax_attorney">Tax Attorney</option>
                  <option value="bookkeeper">Bookkeeper</option>
                  <option value="manager">Manager/CPA</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">PTIN Code *</label>
                <input 
                  type="text" 
                  placeholder="P01234567"
                  value={newPrep.ptin}
                  onChange={e => setNewPrep({ ...newPrep, ptin: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                  required
                />
              </div>
            </div>

            <div className="border-t border-neutral-900 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Compensation Model</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="comp_model" 
                      checked={newPrep.payStructure === 'percentage'}
                      onChange={() => setNewPrep({ ...newPrep, payStructure: 'percentage', payoutRate: 30 })}
                      className="accent-[#D4AF37]"
                    />
                    Percentage Split
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="comp_model" 
                      checked={newPrep.payStructure === 'flat'}
                      onChange={() => setNewPrep({ ...newPrep, payStructure: 'flat', payoutRate: 150 })}
                      className="accent-[#D4AF37]"
                    />
                    Flat Return Fee
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  {newPrep.payStructure === 'percentage' ? 'Payout Percentage (%)' : 'Flat rate payout per Return ($)'}
                </label>
                <input 
                  type="number" 
                  value={newPrep.payoutRate}
                  onChange={e => setNewPrep({ ...newPrep, payoutRate: Number(e.target.value) })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                  min="0"
                />
              </div>
            </div>

            {/* Credentials array inputs */}
            <div className="border-t border-neutral-900 pt-4 space-y-2">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">Designations & Credentials</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. EA, CPA, AFSP"
                  value={newPrep.newCredentialInput}
                  onChange={e => setNewPrep({ ...newPrep, newCredentialInput: e.target.value })}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
                <button 
                  type="button"
                  onClick={handleAddCredential}
                  className="px-3 bg-neutral-900 hover:bg-neutral-800 text-[#D4AF37] border border-[#D4AF37]/20 rounded-xl text-xs"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {newPrep.credentials.map((cred, idx) => (
                  <span key={cred} className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    {cred}
                    <button type="button" onClick={() => handleRemoveCredential(idx)} className="text-slate-400 hover:text-white ml-1">✕</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-900 pt-4 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Completed CE hours</label>
                <input 
                  type="number" 
                  value={newPrep.ceCredits}
                  onChange={e => setNewPrep({ ...newPrep, ceCredits: Number(e.target.value) })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                  min="0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Circular 230 status</label>
                <select
                  value={newPrep.circular230Status}
                  onChange={e => setNewPrep({ ...newPrep, circular230Status: e.target.value as any })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                >
                  <option value="verified">Verified</option>
                  <option value="pending">Pending Review</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-lg hover:opacity-95 transition-all mt-6"
            >
              Create Staff Profile
            </button>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: LOG PAYOUT
          ---------------------------------------------------- */}
      {showLogPayoutModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#D4AF37]" />
                Log custom payout commission
              </h3>
              <button 
                onClick={() => setShowLogPayoutModal(false)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleLogPayout} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">Select Preparer</label>
                <select
                  value={newPayout.preparerId}
                  onChange={e => setNewPayout({ ...newPayout, preparerId: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Staff member --</option>
                  {preparers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.payStructure === 'percentage' ? `${p.payoutRate}% split` : `$${p.payoutRate} flat`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">Total Tax Preparation Fee ($)</label>
                <input 
                  type="number" 
                  value={newPayout.baseAmount}
                  onChange={e => setNewPayout({ ...newPayout, baseAmount: Number(e.target.value) })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">Settlement Method</label>
                <select
                  value={newPayout.method}
                  onChange={e => setNewPayout({ ...newPayout, method: e.target.value as any })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                >
                  <option value="direct_deposit">Direct Deposit (ACH)</option>
                  <option value="stripe">Stripe Connect</option>
                  <option value="check">Physical Check</option>
                  <option value="wire">Bank Wire</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Schedule C preparation, 1040 form"
                  value={newPayout.description}
                  onChange={e => setNewPayout({ ...newPayout, description: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">Private Internal Notes</label>
                <textarea 
                  placeholder="Compliance audits, special agreement references..."
                  value={newPayout.notes}
                  onChange={e => setNewPayout({ ...newPayout, notes: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white h-20"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-lg hover:opacity-95 transition-all mt-4"
              >
                Log & Generate Pending Payout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
