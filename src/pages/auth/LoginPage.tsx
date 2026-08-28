import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store';
import { Building2, Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import type { User } from '../../types';
import api from '../../lib/api';

const SUPABASE_CONFIGURED = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, subAccounts, addSubAccount, setCurrentSubAccount } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureSubAccount = (userEmail: string) => {
    if (subAccounts.length === 0) {
      const acct = {
        id: 'sub-1',
        name: 'Tax Pro Hub University',
        businessName: 'Tax Pro Hub University LLC',
        businessAddress: '1342 NM 333, Tijeras, New Mexico 87059',
        email: userEmail,
        phone: '(414) 430-4277',
        colors: { primary: '#D4AF37', secondary: '#111111', accent: '#FFD700', background: '#030712', text: '#F1F5F9' },
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addSubAccount(acct);
      setCurrentSubAccount(acct);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter both email and password'); return; }
    setIsLoading(true);
    setError('');

    try {
      if (SUPABASE_CONFIGURED) {
        // ── Real auth via server-side proxy ──────────────────────
        const data = await api.auth.login(email, password);
        const sbUser = data.user as any;
        const user: User = {
          id: sbUser?.id || 'user-1',
          email: sbUser?.email || email,
          name: sbUser?.user_metadata?.full_name || email.split('@')[0],
          role: sbUser?.user_metadata?.role || 'admin',
          createdAt: new Date(sbUser?.created_at || Date.now()),
        };
        // Store tokens for authenticated API calls
        if (data.access_token) {
          sessionStorage.setItem('tph_access_token', data.access_token);
          sessionStorage.setItem('tph_refresh_token', data.refresh_token || '');
        }
        ensureSubAccount(email);
        login(user);
        navigate('/dashboard');
        return;
      }

      // ── Demo mode ────────────────────────────────────────────
      await new Promise((resolve) => setTimeout(resolve, 700));
      const user: User = { id: 'demo-user-1', email, name: email.split('@')[0], role: 'admin', createdAt: new Date() };
      ensureSubAccount(email);
      login(user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-amber-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-2xl mb-4">
          <Building2 className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Tax Pro Hub University</h1>
        <p className="text-slate-400 text-sm">
          {SUPABASE_CONFIGURED ? 'Sign in to your account' : 'Demo Mode — any credentials work'}
        </p>
      </div>

      {!SUPABASE_CONFIGURED && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center">
          <ShieldCheck className="inline w-3.5 h-3.5 mr-1" />
          Running in demo mode. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY for real auth.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@taxprohub.com" required
              className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full pl-10 pr-12 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}
        <button type="submit" disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign In'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Need an account?{' '}
        <Link to="/register" className="text-amber-400 hover:text-amber-300 transition-colors">Get started free</Link>
      </p>
    </div>
  );
}
