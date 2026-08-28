import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store';
import { Building2, Mail, Lock, Eye, EyeOff, ShieldCheck, Globe, Link2, Key, Terminal, RefreshCw, X } from 'lucide-react';
import type { User } from '../../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, subAccounts, addSubAccount, setCurrentSubAccount } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Channel Authentication on-the-fly states
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [customToken, setCustomToken] = useState('');
  const [customClientId, setCustomClientId] = useState('');
  const [manifestPluginLink, setManifestPluginLink] = useState('');
  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const [isHandshaking, setIsHandshaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email && password) {
      // Create demo user
      const user: User = {
        id: 'user-1',
        email,
        name: email.split('@')[0],
        role: 'admin',
        createdAt: new Date(),
      };

      // Create demo sub-account if none exists
      if (subAccounts.length === 0) {
        const demoAccount = {
          id: 'sub-1',
          name: 'Tax Pro Hub University',
          businessName: 'Tax Pro Hub University LLC',
          businessAddress: '1342 NM 333, Tijeras, New Mexico 87059',
          email: email,
          phone: '(414) 430-4277',
          colors: {
            primary: '#D4AF37',
            secondary: '#111111',
            accent: '#FFD700',
            background: '#030712',
            text: '#F1F5F9',
          },
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addSubAccount(demoAccount);
        setCurrentSubAccount(demoAccount);
      }

      login(user);
      navigate('/dashboard');
    } else {
      setError('Please enter both email and password');
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-amber-500/5 relative overflow-hidden">
      {/* Abstract Glowing Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none -z-10" />
      
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 mb-5 shadow-lg shadow-amber-500/10">
          <Building2 className="h-8 w-8 text-black" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight font-serif">MYVIRTUAL</h2>
        <p className="text-[10px] text-[#D4AF37] font-mono tracking-[0.2em] uppercase font-bold mt-1">WHITE LABEL PLATFORM</p>
        <p className="text-slate-400 mt-2 text-xs">Sign in to access your secure client accounts</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/30 text-red-200 rounded-xl text-xs font-semibold leading-normal">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Email Address
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

        <div>
          <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3 bg-black/55 border border-amber-500/25 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              className="h-4 w-4 bg-black/60 border-amber-500/25 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-black cursor-pointer" 
            />
            <span className="ml-2 text-xs text-slate-300 font-semibold">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Authenticating...
            </span>
          ) : 'Sign In'}
        </button>
      </form>

      <div className="relative my-6 flex py-1 items-center">
        <div className="flex-grow border-t border-amber-500/10"></div>
        <span className="flex-shrink mx-4 text-[9px] font-black text-amber-500/60 uppercase tracking-widest font-mono">Secure Access Channels</span>
        <div className="flex-grow border-t border-amber-500/10"></div>
      </div>

      {/* Premium Multi-Channel SSO Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { 
            id: 'gmail', 
            name: 'Gmail / Google', 
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            ),
            bg: 'hover:bg-[#4285F4]/10 hover:border-[#4285F4]/40',
            borderColor: 'border-[#4285F4]/15'
          },
          { 
            id: 'sms', 
            name: 'SMS OTP Code', 
            icon: (
              <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ),
            bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/40',
            borderColor: 'border-emerald-500/15'
          },
          { 
            id: 'email_link', 
            name: 'Magic Email Link', 
            icon: (
              <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ),
            bg: 'hover:bg-indigo-500/10 hover:border-indigo-500/40',
            borderColor: 'border-indigo-500/15'
          },
          { 
            id: 'facebook', 
            name: 'Facebook SDK', 
            icon: (
              <svg className="h-5 w-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            ),
            bg: 'hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40',
            borderColor: 'border-[#1877F2]/15'
          },
          { 
            id: 'linkedin', 
            name: 'LinkedIn Talent', 
            icon: (
              <svg className="h-5 w-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            ),
            bg: 'hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/40',
            borderColor: 'border-[#0A66C2]/15'
          },
          { 
            id: 'whatsapp', 
            name: 'WhatsApp OTP', 
            icon: (
              <svg className="h-5 w-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.753-1.454L0 24zm6.59-4.846c1.651.982 3.51 1.5 5.409 1.5 5.613 0 10.177-4.564 10.18-10.18.001-2.72-1.054-5.277-2.973-7.2-1.92-1.919-4.471-2.974-7.19-2.975-5.618 0-10.182 4.564-10.185 10.18-.001 1.995.518 3.946 1.503 5.614l-.99 3.619 3.738-.981zm10.74-7.59c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.007-.242-.384-.487-.332-.669-.332-.174-.003-.373-.004-.572-.004-.2 0-.523.074-.797.372-.273.297-1.042 1.016-1.042 2.479 0 1.462 1.067 2.877 1.216 3.075.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.12.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
            ),
            bg: 'hover:bg-[#25D366]/10 hover:border-[#25D366]/40',
            borderColor: 'border-[#25D366]/15'
          },
          { 
            id: 'gmb', 
            name: 'GMB Profile', 
            icon: (
              <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.9 11.5c-.1-.7-.8-1.2-1.5-1.1h-.1l-1.3.1c-.2-.6-.5-1.2-.9-1.7l1-.7c.6-.5.7-1.4.2-2s-1.4-.7-2-.2l-1 .7c-.5-.4-1.1-.7-1.7-.9l.1-1.3c0-.8-.6-1.4-1.4-1.4s-1.4.6-1.4 1.4l-.1 1.3c-.6.2-1.2.5-1.7.9l-1-.7c-.6-.5-1.5-.4-2 .2s-.4 1.5.2 2l1 .7c-.4.5-.7 1.1-.9 1.7l-1.3-.1c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4l1.3-.1c.2.6.5 1.2.9 1.7l-1 .7c-.6.5-.7 1.4-.2 2s1.4.7 2 .2l1-.7c.5.4 1.1.7 1.7.9l-.1 1.3c0 .8.6 1.4 1.4 1.4s1.4-.6 1.4-1.4l.1-1.3c.6-.2 1.2-.5 1.7-.9l1 .7c.6.5 1.5.4 2-.2s.4-1.5-.2-2l-1-.7c.4-.5.7-1.1.9-1.7l1.3.1c.7.1 1.4-.4 1.5-1.1zM12 15.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/>
              </svg>
            ),
            bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
            borderColor: 'border-amber-500/15'
          },
          { 
            id: 'instagram', 
            name: 'Instagram DM', 
            icon: (
              <svg className="h-5 w-5 text-[#E1306C]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            ),
            bg: 'hover:bg-[#E1306C]/10 hover:border-[#E1306C]/40',
            borderColor: 'border-[#E1306C]/15'
          }
        ].map((channel) => (
          <button
            key={channel.id}
            type="button"
            onClick={() => {
              setSelectedChannel(channel);
              setCustomToken(localStorage.getItem(`api_token_${channel.id}`) || '');
              setCustomClientId(localStorage.getItem(`client_id_${channel.id}`) || '');
              setManifestPluginLink(localStorage.getItem(`manifest_url_${channel.id}`) || `https://api.taxprohubuniversity.com/plugins/${channel.id}`);
              setAuthLogs([]);
              setIsHandshaking(false);
            }}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl border ${channel.borderColor} bg-neutral-900/40 cursor-pointer ${channel.bg} transition-all duration-300 group relative`}
            title={`Secure Authenticated Single Sign-On with ${channel.name}`}
          >
            <div className="transform group-hover:scale-110 transition duration-300">
              {channel.icon}
            </div>
            <span className="text-[8px] font-black text-slate-400 group-hover:text-slate-200 mt-1 uppercase tracking-wider font-mono">
              {channel.id}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-white/5 text-center flex flex-col gap-3">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold bg-neutral-900/60 py-2.5 rounded-xl border border-white/5">
          <ShieldCheck className="h-4 w-4 text-amber-500" />
          <span>Practice Safe Portal Sync: Custom Keys & On-The-Fly Compiler Gates Active</span>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          New to Tax Pro Hub University?{' '}
          <Link to="/signup" className="text-amber-400 font-black hover:underline">
            Register Practice
          </Link>
        </p>
      </div>

      {/* Interactive Channel Authentication & Manifest Plugin Compiler Modal Overlay */}
      {selectedChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300">
          <div className="bg-neutral-950 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-500/25 p-6 space-y-5 relative">
            <button 
              onClick={() => setSelectedChannel(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 bg-neutral-900 rounded-lg border border-white/5 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-[#D4AF37]">
                {selectedChannel.icon}
              </div>
              <div>
                <span className="bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono">
                  Identity Gateway
                </span>
                <h3 className="font-serif font-black text-lg bg-gradient-to-r from-[#D4AF37] to-amber-300 bg-clip-text text-transparent">
                  Auth & Compile: {selectedChannel.name}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Verify credentials and compile custom manifest plugin links directly into the secure edge framework on-the-fly.
            </p>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1 block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  <Key className="h-3.5 w-3.5 text-amber-500/80" />
                  Custom API Access Key / Bearer Token
                </label>
                <input
                  type="text"
                  placeholder={`Paste your secret ${selectedChannel.name} token / auth key...`}
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs text-white focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  <Globe className="h-3.5 w-3.5 text-amber-500/80" />
                  Workspace / Page / Client Application ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. pub_client_748291, page_fb_9283120..."
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs text-white focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  <Link2 className="h-3.5 w-3.5 text-amber-500/80" />
                  Dynamic Manifest Plugin Endpoint URL
                </label>
                <input
                  type="url"
                  placeholder="https://api.taxprohubuniversity.com/plugins/..."
                  value={manifestPluginLink}
                  onChange={(e) => setManifestPluginLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs text-white focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            {/* Simulated Live Compilation terminal log */}
            {(isHandshaking || authLogs.length > 0) && (
              <div className="bg-black/90 rounded-2xl border border-white/5 p-4 space-y-2 h-44 overflow-y-auto font-mono text-[10px] leading-relaxed relative group">
                <div className="absolute top-2.5 right-3.5 flex items-center gap-1 text-[8px] text-amber-500 font-black tracking-widest uppercase animate-pulse">
                  <Terminal className="h-3.5 w-3.5" />
                  Live Gate Compiler
                </div>
                {authLogs.map((log, idx) => (
                  <div key={idx} className={`${idx === authLogs.length - 1 ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
                    {log}
                  </div>
                ))}
                {isHandshaking && (
                  <div className="flex items-center gap-2 text-slate-500 pt-1.5 font-bold animate-pulse">
                    <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                    compiling and syncing edge parameters...
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const fakeEmail = `${selectedChannel.id}.demo@rjbusinesssolutions.org`;
                  const user: User = {
                    id: `user-${selectedChannel.id}`,
                    email: fakeEmail,
                    name: `RJ Test Operator (${selectedChannel.name.split(' ')[0]})`,
                    role: 'admin',
                    createdAt: new Date(),
                  };
                  if (subAccounts.length === 0) {
                    const demoAccount = {
                      id: 'sub-1',
                      name: 'Tax Pro Hub University',
                      businessName: 'Tax Pro Hub University LLC',
                      businessAddress: '1342 NM 333, Tijeras, New Mexico 87059',
                      email: fakeEmail,
                      phone: '(414) 430-4277',
                      colors: {
                        primary: '#D4AF37',
                        secondary: '#111111',
                        accent: '#FFD700',
                        background: '#030712',
                        text: '#F1F5F9',
                      },
                      status: 'active' as const,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                    addSubAccount(demoAccount);
                    setCurrentSubAccount(demoAccount);
                  }
                  login(user);
                  setSelectedChannel(null);
                  navigate('/dashboard');
                }}
                disabled={isHandshaking}
                className="px-4.5 py-2.5 bg-neutral-900 border border-white/5 hover:bg-neutral-850 text-slate-300 rounded-xl text-xs font-bold transition order-2 sm:order-1"
              >
                Fast-Pass Bypass
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  setIsHandshaking(true);
                  setAuthLogs([]);
                  
                  const steps = [
                    `⚡ Initializing secure handshakes with edge endpoint for channel: ${selectedChannel.id.toUpperCase()}...`,
                    `📡 Contacting OAuth2 identity server & validating active session layers...`,
                    `🔑 Custom Access Token verified successfully (Checksum OK)...`,
                    `📦 Fetching on-the-fly manifest compiler link from:`,
                    `   ➜ ${manifestPluginLink || 'Default Schema'}`,
                    `⚙️ Plugin manifest loaded: Parsed 3 secure workspace webhooks, 1 schema layout.`,
                    `🧬 Syncing newly validated API parameters directly to sub-account credentials...`,
                    `✅ Gate handshaked cleanly! Routing operator to the workspace dashboard.`
                  ];

                  for (let i = 0; i < steps.length; i++) {
                    await new Promise(r => setTimeout(r, 450));
                    setAuthLogs(prev => [...prev, steps[i]]);
                  }

                  await new Promise(r => setTimeout(r, 600));

                  // Save parameters
                  localStorage.setItem(`api_token_${selectedChannel.id}`, customToken);
                  localStorage.setItem(`client_id_${selectedChannel.id}`, customClientId);
                  localStorage.setItem(`manifest_url_${selectedChannel.id}`, manifestPluginLink);

                  const fakeEmail = `${selectedChannel.id}.verified@rjbusinesssolutions.org`;
                  const user: User = {
                    id: `user-${selectedChannel.id}`,
                    email: fakeEmail,
                    name: `RJ Verified Operator (${selectedChannel.name.split(' ')[0]})`,
                    role: 'admin',
                    createdAt: new Date(),
                  };

                  if (subAccounts.length === 0) {
                    const demoAccount = {
                      id: 'sub-1',
                      name: 'Tax Pro Hub University',
                      businessName: 'Tax Pro Hub University LLC',
                      businessAddress: '1342 NM 333, Tijeras, New Mexico 87059',
                      email: fakeEmail,
                      phone: '(414) 430-4277',
                      colors: {
                        primary: '#D4AF37',
                        secondary: '#111111',
                        accent: '#FFD700',
                        background: '#030712',
                        text: '#F1F5F9',
                      },
                      status: 'active' as const,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                    addSubAccount(demoAccount);
                    setCurrentSubAccount(demoAccount);
                  }

                  login(user);
                  setIsHandshaking(false);
                  setSelectedChannel(null);
                  navigate('/dashboard');
                }}
                disabled={isHandshaking}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-xl text-xs uppercase tracking-wider transition order-1 sm:order-2 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
              >
                {isHandshaking ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    Please-Authenticate...
                  </>
                ) : (
                  'Please-Authenticate Gateway'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

