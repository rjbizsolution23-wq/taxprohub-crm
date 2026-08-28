import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, User, Calendar, Edit2, Trash2, Award } from 'lucide-react';

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const deal = {
    id: id || '1',
    title: 'Tax Consultation - ABC Corp',
    value: 5000,
    probability: 75,
    stage: 'Proposal',
    contact: 'John Smith',
    expectedClose: new Date(),
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/10 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/pipelines')} 
            className="p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-amber-500/20 rounded-2xl text-[#D4AF37] hover:text-amber-400 transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-amber-300 bg-clip-text text-transparent font-serif">
              {deal.title}
            </h1>
            <p className="text-slate-400 font-mono text-xs uppercase tracking-wider mt-1">
              Active Stage: <span className="text-[#D4AF37] font-bold">{deal.stage}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert('Deal delete request sent to corporate audit.')}
            className="p-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 rounded-2xl text-red-400 hover:text-red-300 transition-all"
            title="Delete Deal"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button 
            onClick={() => alert('Edit deal workflow initiated.')}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/10 transition-all active:scale-95"
          >
            <Edit2 className="h-4 w-4" />
            Edit Deal Structure
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Deal Value */}
        <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent group-hover:via-amber-500/40 transition-all duration-500"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/5 rounded-xl border border-amber-500/15">
              <DollarSign className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest">Expected Deal Value</span>
          </div>
          <p className="text-3xl font-black text-white font-serif">${deal.value.toLocaleString()}</p>
        </div>

        {/* Contact */}
        <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent group-hover:via-amber-500/40 transition-all duration-500"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/5 rounded-xl border border-amber-500/15">
              <User className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest">Primary Contact</span>
          </div>
          <p className="text-xl font-bold text-white">{deal.contact}</p>
          <p className="text-xs text-slate-500 font-mono mt-1">Authorized Representative</p>
        </div>

        {/* Expected Close */}
        <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent group-hover:via-amber-500/40 transition-all duration-500"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/5 rounded-xl border border-amber-500/15">
              <Calendar className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest">Expected Close</span>
          </div>
          <p className="text-xl font-bold text-white">{new Date(deal.expectedClose).toLocaleDateString()}</p>
          <p className="text-xs text-slate-500 font-mono mt-1">Target Closing Window</p>
        </div>
      </div>

      {/* Progress Canvas */}
      <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-sm font-mono font-black text-slate-300 uppercase tracking-widest">Confidence Probability</h2>
          </div>
          <span className="text-lg font-black text-amber-400 font-mono">{deal.probability}%</span>
        </div>
        
        <div className="relative h-4 bg-neutral-900 border border-amber-500/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 rounded-full transition-all duration-500" 
            style={{ width: `${deal.probability}%` }} 
          />
        </div>
        
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
          <span>0% (Lead Prospect)</span>
          <span>50% (Active Negotiation)</span>
          <span>100% (Filing Completed)</span>
        </div>
      </div>
    </div>
  );
}

