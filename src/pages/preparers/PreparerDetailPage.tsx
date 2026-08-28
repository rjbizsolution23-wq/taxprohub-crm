import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Award, ShieldCheck, DollarSign, Calendar, Mail, 
  Phone, Briefcase, ChevronRight, TrendingUp, CheckCircle2, Clock, 
  Trash2, Plus, ShieldAlert, KeyRound, Eye, EyeOff
} from 'lucide-react';
import { useAppStore } from '../../store';
import { Payout } from '../../types';

export default function PreparerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { preparers, payouts, updatePreparer, addPayout, deletePayout } = useAppStore();

  const [maskBankDetails, setMaskBankDetails] = useState(true);
  const [showLogPayoutModal, setShowLogPayoutModal] = useState(false);

  // New Payout Form State for this specific preparer
  const [newPayout, setNewPayout] = useState({
    baseAmount: 1200,
    method: 'direct_deposit' as Payout['method'],
    description: '',
    notes: ''
  });

  // Find current preparer
  const prep = useMemo(() => {
    return preparers.find(p => p.id === id);
  }, [preparers, id]);

  // Filter global payouts belonging specifically to this preparer
  const prepPayouts = useMemo(() => {
    return payouts.filter(p => p.preparerId === id);
  }, [payouts, id]);

  // Specific KPI Calculations
  const stats = useMemo(() => {
    if (!prep) return null;

    const cleared = prepPayouts.filter(p => p.status === 'completed');
    const pending = prepPayouts.filter(p => p.status === 'pending');

    const totalClearedAmount = cleared.reduce((sum, p) => sum + p.amount, 0);
    const totalPendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);

    return {
      clearedCount: cleared.length,
      pendingCount: pending.length,
      clearedSum: totalClearedAmount,
      pendingSum: totalPendingAmount
    };
  }, [prep, prepPayouts]);

  if (!prep) {
    return (
      <div className="space-y-4 text-center py-20 font-sans">
        <ShieldAlert className="h-12 w-12 text-[#D4AF37] mx-auto animate-pulse" />
        <h2 className="text-xl font-bold text-white font-serif">Staff member profile not found</h2>
        <p className="text-slate-400 text-sm">The ID you requested could not be resolved in the database.</p>
        <button 
          onClick={() => navigate('/preparers')}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-extrabold text-xs rounded-xl"
        >
          Return to directory
        </button>
      </div>
    );
  }

  const handleCreatePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayout.baseAmount) {
      alert('Please fill out the base fee amount.');
      return;
    }

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
      status: 'pending',
      referenceNumber: `ACH-PEND-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentDate: new Date(),
      description: newPayout.description || `Custom Direct payout commission`,
      notes: newPayout.notes
    };

    addPayout(payout);

    // Update preparer's performance metric as well
    updatePreparer(prep.id, {
      payoutLedger: [...(prep.payoutLedger || []), payout],
      performance: {
        ...prep.performance,
        completedReturns: prep.performance.completedReturns + 1,
        revenueGenerated: prep.performance.revenueGenerated + baseAmount
      }
    });

    setShowLogPayoutModal(false);
    // Reset Form
    setNewPayout({
      baseAmount: 1200,
      method: 'direct_deposit',
      description: '',
      notes: ''
    });
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Return Navigation */}
      <div>
        <button 
          onClick={() => navigate('/preparers')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#D4AF37] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff directory
        </button>
      </div>

      {/* Profile Cover Card Header */}
      <div className="bg-gradient-to-b from-[#0b0f19] to-neutral-950 border border-neutral-800/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center gap-5">
          {prep.avatar ? (
            <img 
              src={prep.avatar} 
              alt={prep.firstName} 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#D4AF37]/20 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-black text-3xl font-serif">
              {prep.firstName[0]}{prep.lastName[0]}
            </div>
          )}

          <div className="text-center md:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white font-serif">{prep.firstName} {prep.lastName}</h1>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                prep.status === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {prep.status}
              </span>
            </div>
            
            <p className="text-xs font-semibold text-[#D4AF37] tracking-wider uppercase font-mono">
              {prep.role.replace('_', ' ')}
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {prep.email}</span>
              {prep.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {prep.phone}</span>}
              <span className="flex items-center gap-1 font-mono"><Briefcase className="h-3.5 w-3.5" /> PTIN: {prep.ptin}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center justify-center md:items-end gap-3.5">
          <button 
            onClick={() => setShowLogPayoutModal(true)}
            className="px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/25 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Custom Payout
          </button>
        </div>
      </div>

      {/* Grid: Details, KPIs, Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Performance Metrics & Secure Bank Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* SECURE DIRECT DEPOSIT BANK DETAILS */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-[#D4AF37]" />
              Secure direct deposit details
            </h3>
            
            <div className="space-y-3.5 bg-neutral-900/60 border border-neutral-800/60 rounded-xl p-4 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Bank Name</span>
                <span className="text-white font-semibold">Wells Fargo Bank</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Routing Number</span>
                <span className="text-white font-bold">
                  {maskBankDetails ? '•••••0210' : '121000248'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Account Number</span>
                <span className="text-white font-bold">
                  {maskBankDetails ? '••••••••4819' : '9928174819'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Account Type</span>
                <span className="text-white">Business Checking</span>
              </div>

              <div className="pt-2 border-t border-neutral-950 mt-1 flex justify-center">
                <button 
                  onClick={() => setMaskBankDetails(!maskBankDetails)}
                  className="text-[10px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  {maskBankDetails ? (
                    <>
                      <Eye className="h-3 w-3" />
                      Decrypt bank details
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Encrypt bank details
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 flex items-start gap-1.5 bg-neutral-900/40 p-2.5 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span>
                Direct Deposit credentials are encrypted with AES-256 standard and comply with GLBA security guidelines.
              </span>
            </div>
          </div>

          {/* CE CREDIT PROGRESS CHECKLIST */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-[#D4AF37]" />
              Continuing Education hours
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">CE Credits Logged</span>
                <span className="text-white">{prep.ceCredits} / 15 Hours</span>
              </div>
              <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    prep.ceCredits >= 15 ? 'bg-emerald-400' : 'bg-[#D4AF37]'
                  }`}
                  style={{ width: `${Math.min((prep.ceCredits / 15) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800/40 text-xs">
              <span className="text-slate-500">Circular 230:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {prep.circular230Status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: KPI values & Payout Ledger logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STATS OVERVIEW CARDS */}
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Total Earnings Settled</span>
                <span className="text-xl font-bold font-mono text-white mt-1.5 block">${stats.clearedSum.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 mt-1 block">From {stats.clearedCount} completed payouts</span>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Pending Review (Hold)</span>
                <span className="text-xl font-bold font-mono text-[#D4AF37] mt-1.5 block">${stats.pendingSum.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 mt-1 block">Across {stats.pendingCount} pending logs</span>
              </div>
            </div>
          )}

          {/* LEDGER LIST TABLE */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-[#D4AF37]" />
              Preparer specific compensation logs
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Ref Return Fee</th>
                    <th className="py-2.5 px-3">Earned split</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">ACH Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/60">
                  {prepPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        No payouts logged for this preparer.
                      </td>
                    </tr>
                  ) : (
                    prepPayouts.map(p => (
                      <tr key={p.id} className="hover:bg-neutral-900/30 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-200">
                          {p.description}
                          {p.referenceNumber && (
                            <span className="block text-[9px] text-slate-500 font-mono">Ref: {p.referenceNumber}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono">${p.baseAmount.toLocaleString()}</td>
                        <td className="py-3 px-3 text-[#D4AF37] font-bold font-mono">${p.amount.toLocaleString()}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                            p.status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button 
                            onClick={() => {
                              if (confirm('Delete this payout log?')) {
                                deletePayout(p.id);
                              }
                            }}
                            className="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD PAYOUT */}
      {showLogPayoutModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#D4AF37]" />
                Log custom payout for {prep.firstName}
              </h3>
              <button 
                onClick={() => setShowLogPayoutModal(false)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreatePayout} className="space-y-4">
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
                <div className="text-[9px] text-slate-500 font-mono mt-1">
                  Commission logic: {prep.payStructure === 'percentage' 
                    ? `Will calculate ${prep.payoutRate}% split automatically` 
                    : `Will log $${prep.payoutRate} flat return fee`}
                </div>
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
                  placeholder="e.g. Form 1040 Scheduling - Custom Split"
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
