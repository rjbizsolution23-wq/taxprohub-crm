import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setIsLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-amber-500/5 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none -z-10" />
        
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 mb-5 shadow-lg shadow-amber-500/10">
          <Mail className="h-8 w-8 text-black" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight font-serif mb-2">Check your email</h2>
        <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto mb-6">
          We've dispatched password reset instructions to <strong className="text-amber-400 font-bold">{email}</strong>
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-amber-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none -z-10" />

      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-xs font-bold uppercase tracking-wider"
      >
        <ArrowLeft className="h-4 w-4 text-[#D4AF37]" />
        Back to sign in
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 mb-5 shadow-lg shadow-amber-500/10">
          <Building2 className="h-8 w-8 text-black" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight font-serif">Forgot Password?</h2>
        <p className="text-[10px] text-[#D4AF37] font-mono tracking-[0.2em] uppercase font-bold mt-1">SECURE RESET GATE</p>
        <p className="text-slate-400 mt-2 text-xs">No worries, we'll send you secure reset instructions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Enter your email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-black/55 border border-amber-500/25 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] cursor-pointer"
        >
          {isLoading ? 'Sending...' : 'Send reset instructions'}
        </button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold bg-neutral-900/60 py-2.5 rounded-xl border border-white/5">
          <ShieldCheck className="h-4 w-4 text-amber-500" />
          <span>FIPS-compliant verification pathways active</span>
        </div>
      </div>
    </div>
  );
}

