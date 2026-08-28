import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store';
import { Building2, Mail, Lock, User, Phone, Shield, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiBootstrap, apiSignup, clearToken, setToken } from '../../utils/api';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login, addSubAccount, setCurrentSubAccount, hydrateBackend, setBackendMode } = useAppStore();
  
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);
    setError('');

    // ── 1) Real Cloudflare/D1 signup first (provisions tenant + pipeline) ──
    const backendRes = await apiSignup({ fullName, businessName, email, phone, password });
    if (backendRes.ok && backendRes.data?.token) {
      setToken(backendRes.data.token);
      const boot = await apiBootstrap();
      if (boot.ok && boot.data) {
        setBackendMode(true);
        hydrateBackend(boot.data);
        navigate('/dashboard');
        return;
      }
      setError('Account created, but data sync failed. Please sign in.');
      return;
    }
    if (backendRes.status && backendRes.status >= 400 && backendRes.status < 500) {
      setError(backendRes.error === 'An account with this email already exists. Try signing in instead.'
        ? 'An account with this email already exists. Try signing in instead.'
        : (backendRes.error || 'Registration failed. Please try again.'));
      return;
    }

    // ── 2) Backend not configured / unreachable → Demo Mode ──
    clearToken();
    setBackendMode(false);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const user = {
        id: `user-${Date.now()}`,
        email,
        name: fullName,
        role: 'admin' as const,
        createdAt: new Date(),
      };

      const newAccount = {
        id: `sub-${Date.now()}`,
        name: businessName,
        businessName: businessName,
        businessAddress: '1342 NM 333, Tijeras, New Mexico 87059', // Default to RJ Business Solutions area
        email: email,
        phone: phone,
        colors: {
          primary: '#D4AF37',
          secondary: '#111111',
          accent: '#FFD700',
          background: '#030712',
          text: '#f1f5f9',
        },
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addSubAccount(newAccount);
      setCurrentSubAccount(newAccount);
      login(user);

      // Redirect directly to the dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-amber-500/5 relative overflow-hidden">
      {/* Abstract Glowing Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 mb-5 shadow-lg shadow-amber-500/10">
          <Building2 className="h-8 w-8 text-black" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight font-serif">Create Your Account</h2>
        <p className="text-[10px] text-[#D4AF37] font-mono tracking-[0.2em] uppercase font-bold mt-1">PARTNER REGISTRATION GATE</p>
        <p className="text-slate-400 mt-2 text-xs">Start your 14-day free trial on the white label platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 rounded-xl text-xs font-semibold leading-normal">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-black/55 border border-amber-500/25 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500"
              placeholder="Rick Jefferson"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Tax Practice / Business Name
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-black/55 border border-amber-500/25 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500"
              placeholder="RJ Business Solutions"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-black/55 border border-amber-500/25 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500"
              placeholder="support@rjbusinesssolutions.org"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-black/55 border border-amber-500/25 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500"
              placeholder="+1 (414) 430-4277"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-black/55 border border-amber-500/25 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500"
              placeholder="••••••••••••"
              required
            />
          </div>
        </div>

        <div className="flex items-start pt-1">
          <input
            id="agree-terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="h-4 w-4 bg-black/60 border-amber-500/25 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-black cursor-pointer mt-1"
          />
          <label htmlFor="agree-terms" className="ml-2 text-xs text-slate-400 font-semibold leading-relaxed cursor-pointer select-none">
            I agree to the <span className="text-amber-400 hover:underline">Terms of Service</span> and{' '}
            <span className="text-amber-400 hover:underline">Privacy Policy</span>. I verify that RJ Business Solutions legal disclosures apply.
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 mt-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          {isLoading ? 'Creating practice...' : 'Get Started Now'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/5 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Already have a tax agency account?{' '}
          <Link to="/login" className="text-amber-400 font-black hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

