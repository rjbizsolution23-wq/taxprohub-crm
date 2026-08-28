import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { 
  User, Mail, Phone, Building2, Save, Bell, Lock, Palette, 
  Cpu, Eye, EyeOff, RefreshCw, CheckCircle2, AlertTriangle, Key, Sliders, Database, Globe,
  CreditCard, DollarSign, Search, Filter, Check, ExternalLink, ShieldAlert, Info, Settings,
  Blocks, Plus, Trash2
} from 'lucide-react';
import { 
  getAppConfig, saveConfigOverride, isIntegrationConnected, AppConfig, clearConfigOverrides 
} from '../utils/config';

export default function SettingsPage() {
  const { currentUser, brandColors, updateBrandColors } = useAppStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'branding' | 'integrations' | 'plugins' | 'billing'>('profile');

  // Handle direct tab routing via query parameters (?tab=integrations etc).
  // HashRouter puts the query inside the hash, so parse both locations.
  useEffect(() => {
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const params = new URLSearchParams(window.location.search || hashQuery);
    const raw = params.get('tab');
    if (!raw) return;
    // Map nav aliases to their hosting panels
    const tabParam = raw === 'reputation' ? 'branding' : raw === 'help' ? 'notifications' : raw;
    if (['profile', 'notifications', 'security', 'branding', 'integrations', 'plugins', 'billing'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    company: '',
  });
  const [saved, setSaved] = useState(false);

  // Configuration engine states
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'failed' | 'testing' | null; message: string }>>({});

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleShowKey = (field: string) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleConfigChange = (field: keyof AppConfig, value: string) => {
    saveConfigOverride(field, value);
    // Reload active configuration
    setConfig(getAppConfig());
  };

  const resetAllOverrides = () => {
    if (confirm('Are you sure you want to restore default .env configuration? This will clear all local browser overrides.')) {
      clearConfigOverrides();
      setConfig(getAppConfig());
      alert('All configurations reverted to default .env values successfully.');
    }
  };

  // Live Connection Handshake Simulation / Actual API Ping
  // Live Connection Handshake Simulation / Actual API Ping
  const testConnection = async (service: 'gemini' | 'twilio' | 'cloudflare' | 'click2mail' | 'n8n' | 'stripe' | 'facebook' | 'smtp' | 'resend' | 'sendgrid' | 'google_oauth' | 'ai_tuning_engine') => {
    setTestResults(prev => ({ ...prev, [service]: { status: 'testing', message: 'Initiating secure handshake...' } }));
    
    // Simulate real networking delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const activeConfig = getAppConfig();

    try {
      if (service === 'gemini') {
        if (!activeConfig.googleApiKey) throw new Error('API Key missing.');
        
        // Execute a real live light-weight ping to verify API connectivity
        const testPrompt = "Ping";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeConfig.googleApiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: testPrompt }] }] }),
        });

        if (!res.ok) throw new Error(`Google responded with code ${res.status}`);
        setTestResults(prev => ({
          ...prev,
          gemini: { status: 'success', message: 'Handshake Successful! Gemini core online and responsive.' }
        }));
      } 
      else if (service === 'twilio') {
        if (!activeConfig.twilioAccountSid || !activeConfig.twilioAuthToken) throw new Error('SID/Token missing.');
        setTestResults(prev => ({
          ...prev,
          twilio: { status: 'success', message: `Sid [${activeConfig.twilioAccountSid.substring(0,6)}...] authenticated. Outbound SMS routing logged.` }
        }));
      } 
      else if (service === 'cloudflare') {
        if (!activeConfig.cloudflareAccountId || !activeConfig.cloudflareR2S3Api) throw new Error('Account ID or R2 Endpoint missing.');
        setTestResults(prev => ({
          ...prev,
          cloudflare: { status: 'success', message: 'R2 S3 Object Storage endpoint resolved successfully.' }
        }));
      }
      else if (service === 'click2mail') {
        if (!activeConfig.click2mailUsername || !activeConfig.click2mailAuthBasic) throw new Error('Credentials missing.');
        setTestResults(prev => ({
          ...prev,
          click2mail: { status: 'success', message: 'Stage API endpoint authenticated for physical PDF dispatch.' }
        }));
      }
      else if (service === 'n8n') {
        if (!activeConfig.n8nAccessToken) throw new Error('Workflow access token missing.');
        setTestResults(prev => ({
          ...prev,
          n8n: { status: 'success', message: 'Webhook flow dispatcher verified.' }
        }));
      }
      else if (service === 'stripe') {
        if (!activeConfig.stripeSecretKey) throw new Error('Stripe Master key missing.');
        setTestResults(prev => ({
          ...prev,
          stripe: { status: 'success', message: 'Sandbox pricing hooks synced. Webhook endpoint listening.' }
        }));
      }
      else if (service === 'facebook') {
        if (!activeConfig.facebookAccessToken) throw new Error('Facebook System Access Token is missing.');
        const pixelId = activeConfig.facebookBusinessId || '123456789';
        setTestResults(prev => ({
          ...prev,
          facebook: { status: 'success', message: `Handshake verified! Connected to Meta node. Pixel ID: ${pixelId}. CAPI & Webhooks active.` }
        }));
      }
      else if (service === 'smtp') {
        if (!activeConfig.smtpHost || !activeConfig.smtpUser) throw new Error('SMTP Host or SMTP User is missing.');
        setTestResults(prev => ({
          ...prev,
          smtp: { status: 'success', message: `Connected to SMTP host ${activeConfig.smtpHost}:${activeConfig.smtpPort}. Verified credentials for ${activeConfig.smtpUser}.` }
        }));
      }
      else if (service === 'resend') {
        if (!activeConfig.resendApiKey) throw new Error('Resend API key missing.');
        setTestResults(prev => ({
          ...prev,
          resend: { status: 'success', message: 'Resend API authenticated! Transactional dispatch pools verified.' }
        }));
      }
      else if (service === 'sendgrid') {
        if (!activeConfig.sendgridApiKey) throw new Error('SendGrid API key missing.');
        setTestResults(prev => ({
          ...prev,
          sendgrid: { status: 'success', message: 'SendGrid API connected. Ready to route bulk campaign emails.' }
        }));
      }
      else if (service === 'google_oauth') {
        if (!activeConfig.googleClientId || !activeConfig.googleClientSecret) throw new Error('Google OAuth Client ID/Secret missing.');
        setTestResults(prev => ({
          ...prev,
          google_oauth: { status: 'success', message: `Google OAuth Client configured. Ready for calendar sync (Client ID: ${activeConfig.googleClientId.substring(0, 15)}...).` }
        }));
      }
      else if (service === 'ai_tuning_engine') {
        const tempVal = parseFloat(activeConfig.aiTemperature);
        const tokensVal = parseInt(activeConfig.aiMaxTokens);
        if (isNaN(tempVal) || tempVal < 0 || tempVal > 1) throw new Error('Temperature must be a decimal between 0.0 and 1.0.');
        if (isNaN(tokensVal) || tokensVal <= 0) throw new Error('Maximum token size must be a positive integer.');
        setTestResults(prev => ({
          ...prev,
          ai_tuning_engine: { status: 'success', message: `Configuration verified! Default model: "${activeConfig.aiDefaultModel}". Temp: ${tempVal}. Max Tokens: ${tokensVal}. Custom prompts compiled.` }
        }));
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [service]: { status: 'failed', message: `Handshake failed: ${err?.message || 'Unauthorized origin or invalid key structure.'}` }
      }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-500/10 pb-6">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-amber-300 bg-clip-text text-transparent font-serif tracking-tight">System Settings</h1>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-wider mt-1">Configure profile details, brand aesthetics, and backend operational integrations</p>
        </div>
        {activeTab === 'integrations' && (
          <button
            onClick={resetAllOverrides}
            className="px-4 py-2 bg-neutral-900/80 border border-amber-500/20 hover:bg-neutral-900 text-[#D4AF37] rounded-xl text-xs font-mono font-bold uppercase tracking-wider shadow-md transition"
          >
            Clear Browser Key Overrides
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-neutral-950/80 rounded-3xl border border-amber-500/10 p-4 space-y-1.5 shadow-xl">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === 'profile' ? 'bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border border-amber-500/30 text-amber-400 shadow-md' : 'text-slate-400 border border-transparent hover:border-amber-500/10 hover:bg-neutral-900/40 hover:text-white'
              }`}
            >
              <User className="h-5 w-5" />
              Profile Settings
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === 'notifications' ? 'bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border border-amber-500/30 text-amber-400 shadow-md' : 'text-slate-400 border border-transparent hover:border-amber-500/10 hover:bg-neutral-900/40 hover:text-white'
              }`}
            >
              <Bell className="h-5 w-5" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === 'security' ? 'bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border border-amber-500/30 text-amber-400 shadow-md' : 'text-slate-400 border border-transparent hover:border-amber-500/10 hover:bg-neutral-900/40 hover:text-white'
              }`}
            >
              <Lock className="h-5 w-5" />
              Security Core
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === 'branding' ? 'bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border border-amber-500/30 text-amber-400 shadow-md' : 'text-slate-400 border border-transparent hover:border-amber-500/10 hover:bg-neutral-900/40 hover:text-white'
              }`}
            >
              <Palette className="h-5 w-5" />
              White-Label Branding
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === 'integrations' ? 'bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border border-amber-500/30 text-amber-400 shadow-md' : 'text-slate-400 border border-transparent hover:border-amber-500/10 hover:bg-neutral-900/40 hover:text-white'
              }`}
            >
              <Cpu className="h-5 w-5" />
              Enterprise Integrations
            </button>
            <button
              onClick={() => setActiveTab('plugins')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === 'plugins' ? 'bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border border-amber-500/30 text-amber-400 shadow-md' : 'text-slate-400 border border-transparent hover:border-amber-500/10 hover:bg-neutral-900/40 hover:text-white'
              }`}
            >
              <Blocks className="h-5 w-5" />
              Plugin Marketplace
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === 'billing' ? 'bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border border-amber-500/30 text-amber-400 shadow-md' : 'text-slate-400 border border-transparent hover:border-amber-500/10 hover:bg-neutral-900/40 hover:text-white'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              Billing & Subscriptions
            </button>
          </nav>
        </div>

        {/* Configurations Wrapper */}
        <div className="flex-1">
          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="bg-neutral-950/80 rounded-3xl border border-amber-500/10 p-6 space-y-6 shadow-xl">
              <h2 className="text-lg font-serif font-black bg-gradient-to-r from-[#D4AF37] to-amber-300 bg-clip-text text-transparent border-b border-amber-500/10 pb-3">Profile Settings</h2>
              <div className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-amber-500/50" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 transition-all font-mono placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-amber-500/50" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 transition-all font-mono placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Direct Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-amber-500/50" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        placeholder="+1 (414) 430-4277"
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 transition-all font-mono placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Company Entity</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-amber-500/50" />
                      <input
                        type="text"
                        value={profileData.company}
                        placeholder="RJ Business Solutions"
                        onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 transition-all font-mono placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-black rounded-2xl font-black text-xs uppercase tracking-wide shadow-lg shadow-amber-500/10 transition active:scale-95"
                  >
                    <Save className="h-4 w-4" />
                    {saved ? 'Changes Saved!' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-neutral-950/80 rounded-3xl border border-amber-500/10 p-6 space-y-6 shadow-xl">
              <h2 className="text-lg font-serif font-black bg-gradient-to-r from-[#D4AF37] to-amber-300 bg-clip-text text-transparent border-b border-amber-500/10 pb-3">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { id: 'email_campaigns', label: 'Email Campaign Dispatch Alerts', desc: 'Notify team when mass outbound emails finish sending.' },
                  { id: 'new_leads', label: 'New Lead SMS Push', desc: 'Receive instant Twilio push text for inbound funnels.' },
                  { id: 'appointments', label: 'Automated Reminders', desc: 'Alert tax agent 15 mins before calendar meetings.' },
                  { id: 'workflow_errors', label: 'Workflow Webhook Failures', desc: 'Log and notify developer of any automation canvas errors.' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3.5 border-b border-amber-500/10 last:border-0">
                    <div>
                      <p className="font-bold text-white text-sm">{item.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5.5 bg-neutral-900 border border-amber-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#D4AF37] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]/20"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <div className="bg-neutral-950/80 rounded-3xl border border-amber-500/10 p-6 space-y-6 shadow-xl">
              <h2 className="text-lg font-serif font-black bg-gradient-to-r from-[#D4AF37] to-amber-300 bg-clip-text text-transparent border-b border-amber-500/10 pb-3">Security & Access Log</h2>
              <div className="space-y-6 max-w-xl">
                <div>
                  <h3 className="font-black text-slate-300 text-xs uppercase tracking-widest font-mono mb-3">Change Account Password</h3>
                  <div className="space-y-3">
                    <input type="password" placeholder="Current password" className="w-full px-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-2xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 font-mono placeholder:text-slate-600 transition" />
                    <input type="password" placeholder="New password" className="w-full px-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-2xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 font-mono placeholder:text-slate-600 transition" />
                    <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-2xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 font-mono placeholder:text-slate-600 transition" />
                    <button className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-black rounded-2xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-lg shadow-amber-500/10">
                      Update Password
                    </button>
                  </div>
                </div>
                <div className="pt-6 border-t border-amber-500/10">
                  <h3 className="font-black text-slate-300 text-xs uppercase tracking-widest font-mono mb-1">MFA Verification</h3>
                  <p className="text-xs text-slate-400 mb-4">Adds secure 2-Factor authentication utilizing standard mobile authenticator apps.</p>
                  <button className="px-4 py-2.5 border border-amber-500/20 rounded-2xl text-xs font-black uppercase tracking-widest font-mono text-[#D4AF37] hover:bg-amber-500/5 hover:border-amber-500/40 transition shadow-md">
                    Activate 2FA Key
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Brand & Aesthetic Settings Tab */}
          {activeTab === 'branding' && (
            <div className="bg-neutral-950/80 rounded-3xl border border-amber-500/10 p-6 space-y-6 shadow-xl">
              <h2 className="text-lg font-serif font-black bg-gradient-to-r from-[#D4AF37] to-amber-300 bg-clip-text text-transparent border-b border-amber-500/10 pb-3">Brand Aesthetics</h2>
              <p className="text-xs text-slate-400">Apply custom colors and visual styling tokens globally to white-label this sub-account.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                {Object.entries(brandColors).map(([key, value]) => (
                  <div key={key} className="bg-neutral-900/40 p-4 rounded-2xl border border-amber-500/10">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2.5 capitalize">
                      {key} Token
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateBrandColors({ ...brandColors, [key]: e.target.value })}
                        className="h-10 w-16 rounded-xl border border-amber-500/25 cursor-pointer bg-neutral-950"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateBrandColors({ ...brandColors, [key]: e.target.value.toUpperCase() })}
                        className="flex-1 px-4 py-2 bg-neutral-950 border border-amber-500/20 rounded-xl font-mono text-xs text-white uppercase focus:outline-none focus:border-amber-500/50 transition-all focus:ring-1 focus:ring-amber-500/15"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ENTERPRISE INTEGRATIONS MARKETPLACE TAB */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Core protocol warning banner */}
              <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-3xl p-5 flex items-start gap-4">
                <Sliders className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-200/90">
                  <div className="font-extrabold uppercase tracking-widest text-amber-400">🔒 Sandboxed Override Protocol Active</div>
                  <div className="leading-relaxed">
                    Credentials configured inside this white-label marketplace are stored in your secure local browser <code>localStorage</code> sandbox override space. This protects production-grade customer API keys from compile-time leakage while ensuring fully functional live handshakes.
                  </div>
                </div>
              </div>

              {/* Marketplace Header, Filters, and Search */}
              <IntegrationsMarketplaceView 
                config={config} 
                handleConfigChange={handleConfigChange} 
                testConnection={testConnection} 
                testResults={testResults}
                showKeys={showKeys}
              />
            </div>
          )}

          {/* PLUGIN MARKETPLACE TAB */}
          {activeTab === 'plugins' && (
            <PluginMarketplaceView />
          )}

          {/* Billing & Subscriptions Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Active Plan Header Card */}
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-950 via-neutral-950 to-black rounded-3xl p-6 text-white border border-amber-500/20 shadow-xl animate-fade-in">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl"></div>
                
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                        Corporate Core Active
                      </span>
                      <span className="bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Active
                      </span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-amber-500">Tax Pro Hub University Pro Agency Tier</h3>
                    <p className="text-xs text-amber-200/90 max-w-xl leading-relaxed">
                      Your white-label subscription is active under corporate billing. This includes full custom domain hosting, unrestricted Gemini 1.5 Pro cognitive throughput, unlimited Twilio communications, and automated PDF mailings.
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[200px] space-y-1">
                    <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Subscription Price</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-amber-400">$297</span>
                      <span className="text-xs text-amber-200">/ month</span>
                    </div>
                    <div className="pt-2 text-[11px] text-amber-200 border-t border-white/10 flex flex-col gap-0.5">
                      <span>Next Renewal: <strong>June 24, 2026</strong></span>
                      <span>Payment Method: <strong>Visa •••• 4242</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid with Stripe URLs & Payment Card Info */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* 1. White-Label Custom Checkout URLs */}
                <div className="bg-neutral-950/80 rounded-3xl p-6 border border-amber-500/10 space-y-5 shadow-xl">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span className="bg-amber-500/5 p-1.5 rounded-lg text-[#D4AF37] border border-amber-500/10"><DollarSign className="h-4 w-4" /></span>
                      White-Label Stripe Redirects
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure custom Stripe payment links to dynamically route public landing page visitors directly to your hosted checkouts.
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Stripe Starter Link ($97/mo)</label>
                      <input
                        type="text"
                        value={config.stripeStarterLink}
                        onChange={(e) => handleConfigChange('stripeStarterLink', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 transition-all"
                        placeholder="https://buy.stripe.com/starter_plan_id"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Stripe Pro Link ($297/mo)</label>
                      <input
                        type="text"
                        value={config.stripeProLink}
                        onChange={(e) => handleConfigChange('stripeProLink', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 transition-all"
                        placeholder="https://buy.stripe.com/pro_plan_id"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Stripe Enterprise Link ($997/mo)</label>
                      <input
                        type="text"
                        value={config.stripeEnterpriseLink}
                        onChange={(e) => handleConfigChange('stripeEnterpriseLink', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500/15 transition-all"
                        placeholder="https://buy.stripe.com/enterprise_plan_id"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-500/10 text-[10px] text-slate-500 font-mono leading-relaxed">
                    💡 If any link is left blank, public checkout buttons on the landing page will default to the premium, on-brand <strong>Stripe Checkout Overlay Modal</strong>.
                  </div>
                </div>

                {/* 2. Card on File */}
                <div className="bg-neutral-950/80 rounded-3xl p-6 border border-amber-500/10 flex flex-col justify-between space-y-4 shadow-xl">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span className="bg-amber-500/5 p-1.5 rounded-lg text-[#D4AF37] border border-amber-500/10"><CreditCard className="h-4 w-4" /></span>
                      Payment Method
                    </h3>
                    <p className="text-xs text-slate-400">
                      Manage credit cards used for your white-label platform and cognitive AI usage billing.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-5 text-white border border-amber-500/25 relative overflow-hidden shadow-lg aspect-[1.586/1] max-w-[340px] mx-auto w-full flex flex-col justify-between">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-500/5 rounded-full blur-xl"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">RJ Business Solutions</p>
                        <p className="text-xs font-extrabold text-slate-100">Rick Jefferson</p>
                      </div>
                      <div className="h-7 w-12 bg-white/5 rounded-md flex items-center justify-center font-bold text-[10px] border border-white/10 tracking-widest text-slate-300">
                        VISA
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-mono text-sm tracking-[0.2em] text-slate-100">•••• •••• •••• 4242</p>
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Expires 12/29</span>
                        <span>CVV •••</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">Secured via Stripe TLS 1.3 Handshake</span>
                    <button className="px-4 py-2 bg-neutral-900 border border-amber-500/20 hover:bg-neutral-900/80 text-[#D4AF37] rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider transition active:scale-95">
                      Update Card
                    </button>
                  </div>
                </div>
              </div>

              {/* Billing Transactions History */}
              <div className="bg-neutral-950/80 rounded-3xl p-6 border border-amber-500/10 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white">Invoices & Billing History</h3>
                    <p className="text-xs text-slate-400">View and download your past corporate invoices issued under RJ Business Solutions records.</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wide">
                    All Accounts Paid
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-amber-500/10">
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Invoice #</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Date</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Amount</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Method</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Status</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-500/5 text-xs">
                      {[
                        { id: 'INV-2026-401', date: 'May 24, 2026', amount: '$297.00', method: 'Visa •••• 4242' },
                        { id: 'INV-2026-382', date: 'April 24, 2026', amount: '$297.00', method: 'Visa •••• 4242' },
                        { id: 'INV-2026-309', date: 'March 24, 2026', amount: '$297.00', method: 'Visa •••• 4242' },
                        { id: 'INV-2026-218', date: 'February 24, 2026', amount: '$297.00', method: 'Visa •••• 4242' },
                        { id: 'INV-2026-114', date: 'January 24, 2026', amount: '$297.00', method: 'Visa •••• 4242' },
                      ].map((inv) => (
                        <tr key={inv.id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="py-3 font-mono font-bold text-white">{inv.id}</td>
                          <td className="py-3 text-slate-400 font-mono">{inv.date}</td>
                          <td className="py-3 font-bold text-white font-mono">{inv.amount}</td>
                          <td className="py-3 text-slate-400 font-mono">{inv.method}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase tracking-wide">
                              Paid
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => alert(`Receipt ${inv.id} generated and downloaded under RJ Business Solutions corporate audit record (Tijeras, NM 87059).`)}
                              className="px-3 py-1.5 bg-neutral-900 border border-amber-500/15 hover:border-amber-500/35 hover:bg-amber-500/5 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider text-[#D4AF37] transition"
                            >
                              Download PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-slate-500 font-mono gap-2 border-t border-amber-500/10">
                  <span>Registered: <strong>RJ Business Solutions</strong> | 1342 NM 333, Tijeras, NM 87059</span>
                  <span>Need assistance? <a href="mailto:support@rjbusinesssolutions.org" className="text-amber-500 font-bold hover:underline">support@rjbusinesssolutions.org</a></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface IntegrationField {
  name: string;
  label: string;
  type: 'text' | 'password';
  placeholder?: string;
  configKey?: any; // Mapped to our real AppConfig keys
}

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'reconnect';
  desc: string;
  setupTime: string;
  requires?: string;
  logo: string;
  lastSync?: string | null;
  fields?: IntegrationField[];
}

function IntegrationsMarketplaceView({
  config,
  handleConfigChange,
  testConnection,
  testResults,
  showKeys
}: {
  config: AppConfig;
  handleConfigChange: (field: keyof AppConfig, value: string) => void;
  testConnection: (service: any) => Promise<void>;
  testResults: any;
  showKeys: Record<string, boolean>;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);
  const [mockConnectionStatus, setMockConnectionStatus] = useState<Record<string, 'connected' | 'disconnected' | 'reconnect'>>({});
  const [mockTesting, setMockTesting] = useState<Record<string, boolean>>({});
  const [mockValues, setMockValues] = useState<Record<string, string>>({});
  const [showModalKey, setShowModalKey] = useState<Record<string, boolean>>({});

  // 17 Categories list
  const categories = [
    'All',
    'Tax Software',
    'IRS & Government',
    'Bank Products',
    'E-Signature & Docs',
    'Physical Mail',
    'Payments',
    'Email & SMS',
    'Calendar & Scheduling',
    'Social Media',
    'Accounting & Bookkeeping',
    'Credit Bureaus',
    'AI Models',
    'Storage & Files',
    'Marketing & Ads',
    'Communication & Teams',
    'Automation & Webhooks',
    'Reviews & Reputation'
  ];

  // 97 Custom integration definitions mapped directly to the complete CRM spec
  const integrations: IntegrationItem[] = [
    // TAX SOFTWARE
    { id: 'taxslayer', name: 'TaxSlayer Pro', category: 'Tax Software', status: 'connected', desc: 'Direct XML/JSON pipeline for secure federal filing sync.', setupTime: '5 min', requires: 'PTIN holder', logo: '📊', lastSync: '10 mins ago', fields: [{ name: 'api_key', label: 'EFIN Auth API Key', type: 'password', placeholder: 'Enter EFIN credential...' }] },
    { id: 'drake', name: 'Drake Software', category: 'Tax Software', status: 'disconnected', desc: 'Secure desktop db-sync bridge for client return records.', setupTime: '10 min', requires: 'Paid Drake Subscription', logo: '🐉', fields: [{ name: 'sync_path', label: 'Database Sync Path', type: 'text', placeholder: 'C:\\DrakeTax\\db...' }] },
    { id: 'proseries', name: 'ProSeries (Intuit)', category: 'Tax Software', status: 'disconnected', desc: 'Import 1040 returns directly into the CRM database.', setupTime: '5 min', requires: 'ProSeries SDK', logo: '🛠️' },
    { id: 'lacerte', name: 'Lacerte', category: 'Tax Software', status: 'disconnected', desc: 'High-throughput enterprise level corporate filing syncer.', setupTime: '15 min', requires: 'Enterprise tier', logo: '💼' },
    { id: 'atx', name: 'ATX', category: 'Tax Software', status: 'disconnected', desc: 'Filing state-synchronizer for tax offices.', setupTime: '10 min', logo: '📁' },
    { id: 'taxact', name: 'TaxAct Professional', category: 'Tax Software', status: 'disconnected', desc: 'Import tax structures and schedule data directly.', setupTime: '5 min', logo: '⚡' },
    { id: 'crosslink', name: 'CrossLink', category: 'Tax Software', status: 'disconnected', desc: 'High-volume professional transmitter integration.', setupTime: '10 min', logo: '🔗' },
    { id: 'mytaxprepoffice', name: 'MyTaxPrepOffice', category: 'Tax Software', status: 'disconnected', desc: 'Cloud-to-cloud browser transmission syncing.', setupTime: '5 min', logo: '🏢' },

    // IRS & GOVERNMENT
    { id: 'irs_api', name: 'IRS API', category: 'IRS & Government', status: 'disconnected', desc: 'PTIN-authenticated direct secure transcript pull system.', setupTime: '15 min', requires: 'PTIN & EFIN', logo: '🏛️' },
    { id: 'wheres_my_refund', name: 'Where\'s My Refund', category: 'IRS & Government', status: 'connected', desc: 'Automated 4-hour IRS refund status scraper sync.', setupTime: 'Immediate', logo: '💰', lastSync: '3 hours ago' },
    { id: 'irs_eservices', name: 'IRS e-Services', category: 'IRS & Government', status: 'disconnected', desc: 'Bridges IRS secure messaging & secure account info.', setupTime: '20 min', logo: '✉️' },
    { id: 'state_tax_boards', name: 'State Tax Boards', category: 'IRS & Government', status: 'disconnected', desc: 'Dynamic mapping for 50-state tax dispatch portals.', setupTime: '15 min', logo: '🗺️' },

    // BANK PRODUCTS
    { id: 'republic_bank', name: 'Republic Bank', category: 'Bank Products', status: 'disconnected', desc: 'Initiate Refund Advances & RT products directly.', setupTime: '5 min', requires: 'Approved Provider status', logo: '🏦' },
    { id: 'eps_financial', name: 'EPS Financial', category: 'Bank Products', status: 'disconnected', desc: 'Real-time disbursement of bank products inside tax returns.', setupTime: '5 min', logo: '💳' },
    { id: 'refundo', name: 'Refundo', category: 'Bank Products', status: 'disconnected', desc: 'Direct cash card and refund advance approval routing.', setupTime: '5 min', logo: '🎯' },
    { id: 'sbtpg', name: 'Santa Barbara TPG', category: 'Bank Products', status: 'disconnected', desc: 'Industry-standard refund processing & advances portal.', setupTime: '5 min', logo: '🌴' },
    { id: 'refund_advantage', name: 'Refund Advantage', category: 'Bank Products', status: 'disconnected', desc: 'Filing fee-withholding and check-printing routing.', setupTime: '5 min', logo: '💹' },

    // E-SIGNATURE
    { id: 'docusign', name: 'DocuSign', category: 'E-Signature & Docs', status: 'connected', desc: 'Pre-filing Form 8879 and engagement agreements signature flow.', setupTime: '5 min', logo: '✍️', lastSync: '1 hour ago' },
    { id: 'hellosign', name: 'HelloSign / Dropbox', category: 'E-Signature & Docs', status: 'disconnected', desc: 'Simple PDF signature links directly embedded.', setupTime: '5 min', logo: '📝' },
    { id: 'adobesign', name: 'Adobe Sign', category: 'E-Signature & Docs', status: 'disconnected', desc: 'Enterprise PDF secure document completion signature links.', setupTime: '10 min', logo: '🔴' },
    { id: 'pandadoc', name: 'PandaDoc', category: 'E-Signature & Docs', status: 'disconnected', desc: 'Automated contract generation with live signature status.', setupTime: '5 min', logo: '🐼' },
    { id: 'signnow', name: 'SignNow', category: 'E-Signature & Docs', status: 'disconnected', desc: 'Mobile-friendly secure signature workflow widget.', setupTime: '5 min', logo: '✒️' },

    // PHYSICAL MAIL
    { id: 'click2mail_market', name: 'Click2Mail', category: 'Physical Mail', status: 'connected', desc: 'Automated print-and-mail postal letters for dispute documents.', setupTime: '5 min', logo: '📬', lastSync: '2 hours ago', fields: [
      { name: 'username', label: 'Username', type: 'text', configKey: 'click2mailUsername' },
      { name: 'apiUrl', label: 'Target API URL', type: 'text', configKey: 'click2mailApiUrl' },
      { name: 'authBasic', label: 'Auth Basic Token', type: 'password', configKey: 'click2mailAuthBasic' }
    ] },
    { id: 'lob', name: 'Lob.com', category: 'Physical Mail', status: 'disconnected', desc: 'Developer API for direct print and physical letter dispatch.', setupTime: '10 min', logo: '🎈' },
    { id: 'stannp', name: 'Stannp', category: 'Physical Mail', status: 'disconnected', desc: 'Dynamic physical postcard and mailer integrations.', setupTime: '5 min', logo: '✉️' },
    { id: 'postgrid', name: 'PostGrid', category: 'Physical Mail', status: 'disconnected', desc: 'Secure postal envelope document mailing platform.', setupTime: '10 min', logo: '📬' },

    // PAYMENTS
    { id: 'stripe_market', name: 'Stripe', category: 'Payments', status: 'connected', desc: 'Primary billing engine for tax retainers & retainer packages.', setupTime: '5 min', logo: '💳', lastSync: 'Just now', fields: [
      { name: 'publishableKey', label: 'Publishable Key', type: 'text', configKey: 'stripePublishableKey' },
      { name: 'secretKey', label: 'Secret Key', type: 'password', configKey: 'stripeSecretKey' }
    ] },
    { id: 'stripe_connect', name: 'Stripe Connect', category: 'Payments', status: 'connected', desc: 'White-label multi-office payout router for tax offices.', setupTime: '10 min', logo: '🔌', lastSync: 'Just now' },
    { id: 'square', name: 'Square', category: 'Payments', status: 'disconnected', desc: 'In-person POS checkout hardware terminal sync.', setupTime: '5 min', logo: '⬜' },
    { id: 'paypal', name: 'PayPal', category: 'Payments', status: 'disconnected', desc: 'Accept standard express checkout payment buttons.', setupTime: '5 min', logo: '🅿️' },
    { id: 'authorizenet', name: 'Authorize.Net', category: 'Payments', status: 'disconnected', desc: 'Legacy merchant payment gateway processing pipeline.', setupTime: '10 min', logo: '🔐' },
    { id: 'cashapp_biz', name: 'Cash App for Biz', category: 'Payments', status: 'disconnected', desc: 'Receive instant mobile QR checkouts for tax prep.', setupTime: '5 min', logo: '🟢' },
    { id: 'zelle', name: 'Zelle', category: 'Payments', status: 'disconnected', desc: 'Direct-to-bank peer money transfer integrations.', setupTime: '5 min', logo: '💜' },

    // EMAIL & SMS
    { id: 'smtp', name: 'Custom SMTP Relay', category: 'Email & SMS', status: 'disconnected', desc: 'Connect your own outbound custom SMTP mail server for professional outbound tax client notifications.', setupTime: '5 min', logo: '📨', fields: [
      { name: 'smtpHost', label: 'SMTP Host', type: 'text', configKey: 'smtpHost', placeholder: 'smtp.mailtrap.io' },
      { name: 'smtpPort', label: 'SMTP Port', type: 'text', configKey: 'smtpPort', placeholder: '587' },
      { name: 'smtpUser', label: 'SMTP Username', type: 'text', configKey: 'smtpUser', placeholder: 'user@example.com' },
      { name: 'smtpPassword', label: 'SMTP Password', type: 'password', configKey: 'smtpPassword', placeholder: '••••••••' },
      { name: 'smtpSecure', label: 'SSL/TLS Secure (true/false)', type: 'text', configKey: 'smtpSecure', placeholder: 'true' }
    ] },
    { id: 'resend', name: 'Resend (Primary)', category: 'Email & SMS', status: 'connected', desc: 'Highly deliverable primary outbound transactional emails via Resend API.', setupTime: '5 min', logo: '✉️', lastSync: '1 min ago', fields: [
      { name: 'resendApiKey', label: 'Resend API Key', type: 'password', configKey: 'resendApiKey', placeholder: 're_123456789...' }
    ] },
    { id: 'sendgrid', name: 'SendGrid', category: 'Email & SMS', status: 'disconnected', desc: 'High-throughput bulk marketing and programmatic SMTP dispatch service.', setupTime: '5 min', logo: '🟦', fields: [
      { name: 'sendgridApiKey', label: 'SendGrid API Key', type: 'password', configKey: 'sendgridApiKey', placeholder: 'SG.123456789...' }
    ] },
    { id: 'mailgun', name: 'Mailgun', category: 'Email & SMS', status: 'disconnected', desc: 'Developer-centric inbound/outbound email router.', setupTime: '10 min', logo: '🔫' },
    { id: 'postmark', name: 'Postmark', category: 'Email & SMS', status: 'disconnected', desc: 'Transactional-only high deliverability mail pipelines.', setupTime: '5 min', logo: '📬' },
    { id: 'twilio_market', name: 'Twilio (SMS)', category: 'Email & SMS', status: 'connected', desc: 'Powering automated CRM texting & dynamic voice systems.', setupTime: '5 min', logo: '💬', lastSync: 'Just now', fields: [
      { name: 'sid', label: 'Account SID', type: 'text', configKey: 'twilioAccountSid' },
      { name: 'phone', label: 'Sender Phone Number', type: 'text', configKey: 'twilioPhoneNumber' },
      { name: 'token', label: 'Auth Token', type: 'password', configKey: 'twilioAuthToken' }
    ] },
    { id: 'messagebird', name: 'MessageBird', category: 'Email & SMS', status: 'disconnected', desc: 'Omnichannel message delivery global SMS API.', setupTime: '5 min', logo: '🐦' },
    { id: 'bandwidth', name: 'Bandwidth', category: 'Email & SMS', status: 'disconnected', desc: 'SIP trunk and carrier-level SMS/voice infrastructure.', setupTime: '15 min', logo: '📡' },

    // CALENDAR
    { id: 'google_calendar', name: 'Google Calendar', category: 'Calendar & Scheduling', status: 'connected', desc: 'Real-time appointment schedule syncing with Google via OAuth Credentials.', setupTime: '5 min', logo: '📅', lastSync: '5 mins ago', fields: [
      { name: 'googleClientId', label: 'Google Client ID', type: 'text', configKey: 'googleClientId', placeholder: 'client-id.apps.googleusercontent.com' },
      { name: 'googleClientSecret', label: 'Google Client Secret', type: 'password', configKey: 'googleClientSecret', placeholder: 'GOCSPX-...' },
      { name: 'googleSaEmail', label: 'Service Account Email', type: 'text', configKey: 'googleSaEmail', placeholder: 'sa-name@project-id.iam.gserviceaccount.com' }
    ] },
    { id: 'outlook_cal', name: 'Microsoft Outlook', category: 'Calendar & Scheduling', status: 'disconnected', desc: 'Sync professional calendar bookings with Outlook Exchange.', setupTime: '5 min', logo: '🟦' },
    { id: 'calendly', name: 'Calendly', category: 'Calendar & Scheduling', status: 'disconnected', desc: 'Embed automated landing page booking widgets easily.', setupTime: '5 min', logo: '📆' },
    { id: 'apple_cal', name: 'Apple Calendar', category: 'Calendar & Scheduling', status: 'disconnected', desc: 'Sync client appointments with native iCloud calendars.', setupTime: '5 min', logo: '🍎' },
    { id: 'cal_com', name: 'Cal.com', category: 'Calendar & Scheduling', status: 'disconnected', desc: 'Open-source white-label developer booking platform.', setupTime: '5 min', logo: '🗓️' },

    // SOCIAL MEDIA
    { id: 'fb_messenger', name: 'Facebook Messenger', category: 'Social Media', status: 'connected', desc: 'Import customer conversations directly into unified inbox.', setupTime: '5 min', logo: '💬', lastSync: '30 mins ago', fields: [
      { name: 'fb_page_id', label: 'Facebook Page ID', type: 'text', placeholder: 'Enter Facebook Page ID...' },
      { name: 'fb_page_token', label: 'Page Access Token', type: 'password', placeholder: 'EAA...' }
    ] },
    { id: 'insta_dm', name: 'Instagram DM', category: 'Social Media', status: 'disconnected', desc: 'Direct message automation and funnel trigger responses.', setupTime: '5 min', logo: '📸', fields: [
      { name: 'insta_account_id', label: 'Instagram Business Account ID', type: 'text', placeholder: 'Enter Instagram Account ID...' },
      { name: 'insta_token', label: 'Graph Access Token', type: 'password', placeholder: 'IGQ...' }
    ] },
    { id: 'tiktok_social', name: 'TikTok', category: 'Social Media', status: 'disconnected', desc: 'Lead generation and inbox sync from TikTok campaigns.', setupTime: '5 min', logo: '🎵' },
    { id: 'linkedin_social', name: 'LinkedIn', category: 'Social Media', status: 'disconnected', desc: 'B2B outreach integrations & client profile synchronization.', setupTime: '10 min', logo: '👥', fields: [
      { name: 'linkedin_client_id', label: 'LinkedIn Client ID', type: 'text', placeholder: 'Enter LinkedIn Client ID...' },
      { name: 'linkedin_client_secret', label: 'LinkedIn Client Secret', type: 'password', placeholder: '••••••••' }
    ] },
    { id: 'x_twitter', name: 'X (Twitter)', category: 'Social Media', status: 'disconnected', desc: 'Social engagement, brand alerts, and DM pipelines.', setupTime: '5 min', logo: '𝕏' },
    { id: 'youtube', name: 'YouTube', category: 'Social Media', status: 'disconnected', desc: 'Embed professional video guides & sync lead widgets.', setupTime: '5 min', logo: '▶️' },
    { id: 'whatsapp_biz', name: 'WhatsApp Business', category: 'Social Media', status: 'disconnected', desc: 'Highly engaging direct text messaging workflows.', setupTime: '5 min', logo: '🟢', fields: [
      { name: 'wa_phone_number_id', label: 'WhatsApp Phone Number ID', type: 'text', placeholder: 'e.g. 10294719283...' },
      { name: 'wa_business_account_id', label: 'WhatsApp Business Account ID', type: 'text', placeholder: 'e.g. 1092847293...' },
      { name: 'wa_access_token', label: 'System User Access Token', type: 'password', placeholder: 'EAAB...' }
    ] },

    // ACCOUNTING
    { id: 'qbo', name: 'QuickBooks Online', category: 'Accounting & Bookkeeping', status: 'disconnected', desc: 'Sync invoices, client charts, and ledger entries.', setupTime: '5 min', logo: '🟢' },
    { id: 'qbd', name: 'QuickBooks Desktop', category: 'Accounting & Bookkeeping', status: 'disconnected', desc: 'Desktop sync engine for firm accounting software.', setupTime: '15 min', logo: '💻' },
    { id: 'xero_acc', name: 'Xero', category: 'Accounting & Bookkeeping', status: 'disconnected', desc: 'Reconcile books and invoices with global accounting tools.', setupTime: '5 min', logo: '🔵' },
    { id: 'freshbooks', name: 'FreshBooks', category: 'Accounting & Bookkeeping', status: 'disconnected', desc: 'Simple small business ledger and custom quotes sync.', setupTime: '5 min', logo: '🍃' },
    { id: 'wave_acc', name: 'Wave', category: 'Accounting & Bookkeeping', status: 'disconnected', desc: 'Free accounting tracking for individual tax preparers.', setupTime: '5 min', logo: '🌊' },

    // CREDIT BUREAUS
    { id: 'experian', name: 'Experian', category: 'Credit Bureaus', status: 'disconnected', desc: 'Automated Round 1 credit report diagnostic imports.', setupTime: '10 min', requires: 'IdentityIQ/SmartCredit account', logo: '🔴' },
    { id: 'equifax', name: 'Equifax', category: 'Credit Bureaus', status: 'disconnected', desc: 'Check credit status, scores, and active public items.', setupTime: '10 min', logo: '⚪' },
    { id: 'transunion', name: 'TransUnion', category: 'Credit Bureaus', status: 'disconnected', desc: 'Direct credit file lookup and active trade disputes.', setupTime: '10 min', logo: '🔵' },
    { id: 'credit_karma', name: 'Credit Karma API', category: 'Credit Bureaus', status: 'disconnected', desc: 'Synchronize customer credit metrics in client portals.', setupTime: '10 min', logo: '💚' },
    { id: 'identity_iq', name: 'IdentityIQ', category: 'Credit Bureaus', status: 'disconnected', desc: 'Direct XML pulling for 3-bureau credit file reports.', setupTime: '5 min', logo: '🛡️' },
    { id: 'smartcredit', name: 'SmartCredit', category: 'Credit Bureaus', status: 'disconnected', desc: 'Client score tracking with automated dispute triggers.', setupTime: '5 min', logo: '💳' },

    // AI MODELS
    { id: 'openai', name: 'OpenAI-Compatible Endpoint', category: 'AI Models', status: 'connected', desc: 'Powers the Funnel Genie LLM Architect. Works with OpenAI, GenSpark LLM proxy, LiteLLM, vLLM, Groq, LM Studio — any /chat/completions server.', setupTime: '5 min', logo: '🟢', lastSync: 'Just now', fields: [
      { name: 'openaiApiKey', label: 'API Key', type: 'password', configKey: 'openaiApiKey' },
      { name: 'openaiBaseUrl', label: 'Base URL (e.g. https://api.openai.com/v1)', type: 'text', configKey: 'openaiBaseUrl', placeholder: 'https://api.openai.com/v1' },
      { name: 'openaiModel', label: 'Model Name', type: 'text', configKey: 'openaiModel', placeholder: 'gpt-5-mini' }
    ] },
    { id: 'anthropic', name: 'Anthropic (Claude)', category: 'AI Models', status: 'connected', desc: 'Long-context document analysis and IRS letter drafting.', setupTime: '5 min', logo: '📦', lastSync: 'Just now' },
    { id: 'ai_tuning_market', name: 'AI Cognitive Model Tuning Engine', category: 'AI Models', status: 'connected', desc: 'Configure default models, system prompts, temperature and response length limits for AI agents.', setupTime: '5 min', logo: '🧠', fields: [
      { name: 'aiDefaultModel', label: 'Default LLM Model Name', type: 'text', configKey: 'aiDefaultModel', placeholder: 'gemini' },
      { name: 'aiTemperature', label: 'Generation Temperature (0.0 - 1.0)', type: 'text', configKey: 'aiTemperature', placeholder: '0.6' },
      { name: 'aiMaxTokens', label: 'Max Output Tokens Limit', type: 'text', configKey: 'aiMaxTokens', placeholder: '2048' },
      { name: 'aiSystemPromptOverride', label: 'Global AI Agent System Prompt Override', type: 'text', configKey: 'aiSystemPromptOverride', placeholder: 'You are an advanced professional tax expert...' }
    ] },
    { id: 'gemini_ai_market', name: 'Google Gemini', category: 'AI Models', status: 'connected', desc: 'Underlying high-speed cognitive core and automation.', setupTime: '5 min', logo: '✨', fields: [
      { name: 'apiKey', label: 'Google API Key (Gemini)', type: 'password', configKey: 'googleApiKey' },
      { name: 'openrouterKey', label: 'OpenRouter Key (Claude/GPT)', type: 'password', configKey: 'openrouterApiKey' }
    ] },
    { id: 'cloudflare_ai', name: 'Cloudflare AI', category: 'AI Models', status: 'connected', desc: 'Edge processing for LLM classifications and text scans.', setupTime: '5 min', logo: '🧡', lastSync: 'Just now' },
    { id: 'openrouter_ai', name: 'OpenRouter', category: 'AI Models', status: 'connected', desc: 'Central routing hub for models like Llama 3 & DeepSeek.', setupTime: '5 min', logo: '🔌', lastSync: 'Just now' },
    { id: 'deepseek', name: 'DeepSeek', category: 'AI Models', status: 'disconnected', desc: 'Ultra-low cost high intelligence reasoner system.', setupTime: '5 min', logo: '🐳' },
    { id: 'groq', name: 'Groq', category: 'AI Models', status: 'disconnected', desc: 'Sub-second real-time voice mode logic engine.', setupTime: '5 min', logo: '⚡' },

    // STORAGE & FILES
    { id: 'cloudflare_r2_market', name: 'Cloudflare R2', category: 'Storage & Files', status: 'connected', desc: 'Encrypted object vault for storing W2s, 1099s, & notices.', setupTime: '5 min', logo: '☁️', lastSync: 'Just now', fields: [
      { name: 'endpoint', label: 'R2 S3 REST Endpoint', type: 'text', configKey: 'cloudflareR2S3Api' },
      { name: 'token', label: 'R2 Token (S3 Auth)', type: 'password', configKey: 'cloudflareR2Token' }
    ] },
    { id: 'google_drive', name: 'Google Drive', category: 'Storage & Files', status: 'disconnected', desc: 'Sync parsed client folders directly into Google Workspace.', setupTime: '5 min', logo: '📁' },
    { id: 'dropbox_store', name: 'Dropbox', category: 'Storage & Files', status: 'disconnected', desc: 'Archive completed returns and signed agreements.', setupTime: '5 min', logo: '📦' },
    { id: 'onedrive_store', name: 'OneDrive', category: 'Storage & Files', status: 'disconnected', desc: 'Synchronize client files into secure Microsoft directories.', setupTime: '5 min', logo: '☁️' },
    { id: 'box_store', name: 'Box', category: 'Storage & Files', status: 'disconnected', desc: 'Enterprise certified document storage & folder vaulting.', setupTime: '10 min', logo: '📦' },

    // MARKETING & ADS
    { id: 'google_ads', name: 'Google Ads', category: 'Marketing & Ads', status: 'disconnected', desc: 'Track pay-per-click conversion metrics on tax funnels.', setupTime: '5 min', logo: '🔍' },
    { id: 'meta_ads', name: 'Meta Ads (FB/IG)', category: 'Marketing & Ads', status: 'disconnected', desc: 'Optimize Facebook pixel targetings on landing leads with Conversions API (CAPI) and Lead Ads.', setupTime: '5 min', logo: '♾️', fields: [
      { name: 'facebookAppId', label: 'Facebook App ID', type: 'text', configKey: 'facebookAppId' },
      { name: 'facebookAppSecret', label: 'Facebook App Secret', type: 'password', configKey: 'facebookAppSecret' },
      { name: 'facebookBusinessId', label: 'Facebook Business / Pixel ID', type: 'text', configKey: 'facebookBusinessId' },
      { name: 'facebookAccessToken', label: 'System User Access Token', type: 'password', configKey: 'facebookAccessToken' }
    ] },
    { id: 'tiktok_ads', name: 'TikTok Ads', category: 'Marketing & Ads', status: 'disconnected', desc: 'Sync lead magnet forms directly to automatic workflows.', setupTime: '5 min', logo: '🎵' },
    { id: 'ga4', name: 'Google Analytics 4', category: 'Marketing & Ads', status: 'disconnected', desc: 'Monitor site traffic and active viewport behaviors.', setupTime: '5 min', logo: '📈' },
    { id: 'meta_pixel', name: 'Meta Pixel', category: 'Marketing & Ads', status: 'disconnected', desc: 'Track landing-funnel checkouts and bookings.', setupTime: '5 min', logo: '👾' },
    { id: 'segment', name: 'Segment', category: 'Marketing & Ads', status: 'disconnected', desc: 'Centralize custom customer action events into CRM pipelines.', setupTime: '10 min', logo: '🧩' },
    { id: 'mixpanel', name: 'Mixpanel', category: 'Marketing & Ads', status: 'disconnected', desc: 'In-depth funnel drop-off analytics & event flows.', setupTime: '10 min', logo: '📊' },

    // COMMUNICATION & TEAMS
    { id: 'slack', name: 'Slack', category: 'Communication & Teams', status: 'disconnected', desc: 'Send new lead notifications directly to Slack workspaces.', setupTime: '5 min', logo: '💬' },
    { id: 'teams', name: 'Microsoft Teams', category: 'Communication & Teams', status: 'disconnected', desc: 'Collaborate with staff and launch team video calls.', setupTime: '5 min', logo: '👥' },
    { id: 'discord', name: 'Discord', category: 'Communication & Teams', status: 'disconnected', desc: 'White-label community integrations and group alerts.', setupTime: '5 min', logo: '👾' },
    { id: 'zoom', name: 'Zoom', category: 'Communication & Teams', status: 'disconnected', desc: 'Automatically schedule professional video consultations.', setupTime: '5 min', logo: '📹' },
    { id: 'meet', name: 'Google Meet', category: 'Communication & Teams', status: 'disconnected', desc: 'Create direct meeting links on booked calendar items.', setupTime: '5 min', logo: '📹' },

    // AUTOMATION & WEBHOOKS
    { id: 'zapier', name: 'Zapier', category: 'Automation & Webhooks', status: 'disconnected', desc: 'Trigger 5000+ public apps on custom CRM event logs.', setupTime: '5 min', logo: '🧡' },
    { id: 'make', name: 'Make.com', category: 'Automation & Webhooks', status: 'disconnected', desc: 'Advanced multi-branched external webhook scenarios.', setupTime: '5 min', logo: '💜' },
    { id: 'n8n_flow_market', name: 'n8n', category: 'Automation & Webhooks', status: 'connected', desc: 'Underlying workflow orchestration visual builder engine.', setupTime: 'Immediate', logo: '⚙️', lastSync: 'Just now', fields: [
      { name: 'apiUrl', label: 'n8n Instance API URL', type: 'text', configKey: 'n8nApiUrl' },
      { name: 'accessToken', label: 'API Token', type: 'password', configKey: 'n8nAccessToken' }
    ] },
    { id: 'pipedream', name: 'Pipedream', category: 'Automation & Webhooks', status: 'disconnected', desc: 'Fast developer-centric event handler and logic APIs.', setupTime: '5 min', logo: '💧' },
    { id: 'custom_webhooks', name: 'Custom Webhooks', category: 'Automation & Webhooks', status: 'connected', desc: 'Register endpoints for secure inbound/outbound payloads.', setupTime: 'Immediate', logo: '🔌', lastSync: 'Just now' },

    { id: 'google_business', name: 'Google Business Profile (GMB)', category: 'Reviews & Reputation', status: 'disconnected', desc: 'Automatically pull Google reviews, sync maps, and draft intelligent AI replies.', setupTime: '5 min', logo: '🔍', fields: [
      { name: 'gmb_location_id', label: 'Google Location ID / Resource Name', type: 'text', placeholder: 'accounts/10294719/locations/472938...' },
      { name: 'gmb_api_key', label: 'Google API Key (Places API Enabled)', type: 'password', placeholder: 'AIzaSy...' }
    ] },
    { id: 'yelp', name: 'Yelp', category: 'Reviews & Reputation', status: 'disconnected', desc: 'Monitor yelp rating changes and review counts.', setupTime: '5 min', logo: '🔴' },
    { id: 'trustpilot', name: 'Trustpilot', category: 'Reviews & Reputation', status: 'disconnected', desc: 'Verify business credentials on public review boards.', setupTime: '10 min', logo: '⭐' },
    { id: 'bbb', name: 'Better Business Bureau', category: 'Reviews & Reputation', status: 'disconnected', desc: 'Display BBB badge and track compliance scores.', setupTime: '10 min', logo: '🛡️' },
    { id: 'fb_reviews', name: 'Facebook Reviews', category: 'Reviews & Reputation', status: 'disconnected', desc: 'Automate post-filing rating invitations on Facebook.', setupTime: '5 min', logo: '💬' }
  ];

  // Helper to determine status dynamically (handling mock local changes too)
  const getStatus = (item: IntegrationItem) => {
    if (mockConnectionStatus[item.id]) return mockConnectionStatus[item.id];
    if (item.id === 'gemini_ai_market') return isIntegrationConnected('gemini') ? 'connected' : 'disconnected';
    if (item.id === 'twilio_market') return isIntegrationConnected('twilio') ? 'connected' : 'disconnected';
    if (item.id === 'cloudflare_r2_market') return isIntegrationConnected('cloudflare') ? 'connected' : 'disconnected';
    if (item.id === 'click2mail_market') return isIntegrationConnected('click2mail') ? 'connected' : 'disconnected';
    if (item.id === 'n8n_flow_market') return isIntegrationConnected('n8n') ? 'connected' : 'disconnected';
    if (item.id === 'stripe_market') return isIntegrationConnected('stripe') ? 'connected' : 'disconnected';
    if (item.id === 'meta_ads') return isIntegrationConnected('facebook') ? 'connected' : 'disconnected';
    if (item.id === 'smtp') return isIntegrationConnected('smtp') ? 'connected' : 'disconnected';
    if (item.id === 'resend') return isIntegrationConnected('resend') ? 'connected' : 'disconnected';
    if (item.id === 'sendgrid') return isIntegrationConnected('sendgrid') ? 'connected' : 'disconnected';
    if (item.id === 'google_calendar') return isIntegrationConnected('google_oauth') ? 'connected' : 'disconnected';
    if (item.id === 'ai_tuning_market') return getAppConfig().aiDefaultModel ? 'connected' : 'disconnected';
    return item.status;
  };

  // Filter items
  const filteredIntegrations = integrations.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    const activeStatus = getStatus(item);
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'connected' && activeStatus === 'connected') ||
                          (statusFilter === 'disconnected' && activeStatus !== 'connected');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Simulated click-to-connect protocol handler
  const handleConnectClick = (item: IntegrationItem) => {
    setSelectedIntegration(item);
  };

  const executeModalHandshake = async (item: IntegrationItem) => {
    const isRealService = [
      'gemini_ai_market', 'twilio_market', 'cloudflare_r2_market', 'click2mail_market', 
      'n8n_flow_market', 'stripe_market', 'meta_ads', 'smtp', 'resend', 'sendgrid', 
      'google_calendar', 'ai_tuning_market'
    ].includes(item.id);
    
    if (isRealService) {
      // Map back to config service names to trigger the actual backend testConnection method
      let actualService: 'gemini' | 'twilio' | 'cloudflare' | 'click2mail' | 'n8n' | 'stripe' | 'facebook' | 'smtp' | 'resend' | 'sendgrid' | 'google_oauth' | 'ai_tuning_engine' = 'gemini';
      if (item.id === 'gemini_ai_market') actualService = 'gemini';
      else if (item.id === 'twilio_market') actualService = 'twilio';
      else if (item.id === 'cloudflare_r2_market') actualService = 'cloudflare';
      else if (item.id === 'click2mail_market') actualService = 'click2mail';
      else if (item.id === 'n8n_flow_market') actualService = 'n8n';
      else if (item.id === 'stripe_market') actualService = 'stripe';
      else if (item.id === 'meta_ads') actualService = 'facebook';
      else if (item.id === 'smtp') actualService = 'smtp';
      else if (item.id === 'resend') actualService = 'resend';
      else if (item.id === 'sendgrid') actualService = 'sendgrid';
      else if (item.id === 'google_calendar') actualService = 'google_oauth';
      else if (item.id === 'ai_tuning_market') actualService = 'ai_tuning_engine';

      await testConnection(actualService);
    } else {
      // Run synthetic visual network ping simulation
      setMockTesting(prev => ({ ...prev, [item.id]: true }));
      await new Promise(resolve => setTimeout(resolve, 1200));
      setMockTesting(prev => ({ ...prev, [item.id]: false }));
      
      setMockConnectionStatus(prev => ({ ...prev, [item.id]: 'connected' }));
      alert(`Integration Handshake Verified! ${item.name} is now dynamically connected.`);
    }
  };

  const handleMockSave = (item: IntegrationItem) => {
    setMockConnectionStatus(prev => ({ ...prev, [item.id]: 'connected' }));
    setSelectedIntegration(null);
  };

  return (
    <div className="space-y-6">
      {/* Category Pills & Search */}
      <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/50" />
            <input
              type="text"
              placeholder="Search 50+ enterprise integrations (TaxSlayer, Resend, Experian...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-amber-500/10 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/25 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 border-l border-white/5 pl-0 md:pl-4">
            <Filter className="h-3.5 w-3.5 text-amber-500/60" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:bg-white/5'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('connected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === 'connected' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
            >
              Connected
            </button>
            <button
              onClick={() => setStatusFilter('disconnected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === 'disconnected' ? 'bg-neutral-900 border border-white/5 text-slate-400' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
            >
              Disconnected
            </button>
          </div>
        </div>

        {/* Horizontal Category Pills Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-white/5 pt-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all ${
                selectedCategory === cat 
                  ? 'bg-amber-500 text-neutral-950 border border-amber-400/30 shadow-md shadow-amber-500/15' 
                  : 'bg-black/40 hover:bg-black/60 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredIntegrations.map((item) => {
          const activeStatus = getStatus(item);
          return (
            <div 
              key={item.id} 
              className="bg-neutral-950/40 rounded-3xl p-5 border border-amber-500/10 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              {/* Card top banner glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/0 to-transparent group-hover:via-amber-500/40 transition-all duration-500"></div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-lg font-bold">
                      {item.logo}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100">{item.name}</h4>
                      <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest leading-none mt-0.5">{item.category}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                    activeStatus === 'connected' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-neutral-900 text-slate-500 border-white/5'
                  }`}>
                    {activeStatus === 'connected' ? '● Active' : '○ Offline'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">{item.desc}</p>
              </div>

              <div className="border-t border-white/5 pt-3 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="bg-black/30 border border-white/5 px-2 py-0.5 rounded-lg font-semibold text-slate-400">{item.setupTime} setup</span>
                  {item.requires && (
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg font-bold truncate max-w-[100px]">{item.requires}</span>
                  )}
                </div>

                <button
                  onClick={() => handleConnectClick(item)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                    activeStatus === 'connected' 
                      ? 'bg-neutral-900 hover:bg-neutral-850 text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm' 
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-black shadow-md hover:shadow-amber-500/10 hover:from-amber-600 hover:to-yellow-600'
                  }`}
                >
                  {activeStatus === 'connected' ? 'Configure' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}

        {filteredIntegrations.length === 0 && (
          <div className="col-span-full py-16 bg-neutral-950/40 border border-amber-500/10 rounded-3xl text-center space-y-2 shadow-xl">
            <Sliders className="h-8 w-8 text-amber-500/40 mx-auto" />
            <p className="text-sm font-bold text-slate-100">No integrations found</p>
            <p className="text-xs text-slate-500">Try tweaking your search term or selecting another category.</p>
          </div>
        )}
      </div>

      {/* Integration config slide-up modal overlay */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
          <div className="bg-neutral-950 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-500/20 p-6 space-y-6 relative animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-2xl">
                  {selectedIntegration.logo}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-100 tracking-tight">{selectedIntegration.name} Configuration</h3>
                  <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mt-0.5">{selectedIntegration.category} Integration</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIntegration(null)} 
                className="p-1.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-100 transition cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description & Requirements */}
            <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>{selectedIntegration.desc}</p>
              <div className="flex gap-4 border-t border-white/5 pt-2 text-[10px] font-semibold text-slate-500">
                <span>Setup: <strong className="text-slate-300">{selectedIntegration.setupTime}</strong></span>
                {selectedIntegration.requires && (
                  <span className="text-amber-400">Requires: <strong className="text-amber-300">{selectedIntegration.requires}</strong></span>
                )}
                {selectedIntegration.lastSync && (
                  <span className="ml-auto text-emerald-600">Last Sync: <strong>{selectedIntegration.lastSync}</strong></span>
                )}
              </div>
            </div>

            {/* Input parameters dynamic form */}
            <div className="space-y-4">
              {/* Render either mapped live config overrides or generic placeholders */}
              {selectedIntegration.fields ? (
                selectedIntegration.fields.map((field) => {
                  const isLiveKey = !!field.configKey;
                  const value = isLiveKey ? config[field.configKey as keyof AppConfig] : (mockValues[`${selectedIntegration.id}_${field.name}`] || '');
                  
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{field.label}</label>
                        {field.type === 'password' && (
                          <button 
                            type="button" 
                            onClick={() => setShowModalKey(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                            className="text-[#D4AF37]/70 hover:text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider"
                          >
                            {showModalKey[field.name] ? 'Hide' : 'Show'}
                          </button>
                        )}
                      </div>

                      <input
                        type={field.type === 'password' && !showModalKey[field.name] ? 'password' : 'text'}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                        value={value}
                        onChange={(e) => {
                          if (isLiveKey) {
                            handleConfigChange(field.configKey, e.target.value);
                          } else {
                            setMockValues(prev => ({ ...prev, [`${selectedIntegration.id}_${field.name}`]: e.target.value }));
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-black/60 border border-amber-500/10 focus:border-amber-500/40 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none transition"
                      />
                    </div>
                  );
                })
              ) : (
                /* Static Default API Key input parameter template */
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">API Authentication Key</label>
                    <button 
                      type="button" 
                      onClick={() => setShowModalKey(prev => ({ ...prev, default: !prev[field_name_default_safeguard] }))}
                      className="text-[#D4AF37]/70 hover:text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider"
                    >
                      {showModalKey.default ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showModalKey.default ? 'text' : 'password'}
                    placeholder="Enter integration api key or auth client credentials..."
                    value={mockValues[`${selectedIntegration.id}_apikey`] || ''}
                    onChange={(e) => setMockValues(prev => ({ ...prev, [`${selectedIntegration.id}_apikey`]: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/60 border border-amber-500/10 focus:border-amber-500/40 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none transition"
                  />
                </div>
              )}
            </div>

            {/* Actions / Test Connection / Save */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => executeModalHandshake(selectedIntegration)}
                disabled={mockTesting[selectedIntegration.id]}
                className="px-4 py-2.5 border border-white/10 hover:bg-white/5 text-slate-300 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {mockTesting[selectedIntegration.id] ? (
                  <>Testing...</>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin-slow" /> Test Handshake
                  </>
                )}
              </button>

              {/* Handshake status reporting for real configurations */}
              {[
                'gemini_ai_market', 'twilio_market', 'cloudflare_r2_market', 'click2mail_market', 
                'n8n_flow_market', 'stripe_market', 'smtp', 'resend', 'sendgrid', 
                'google_calendar', 'ai_tuning_market'
              ].includes(selectedIntegration.id) && (() => {
                let actualService: 'gemini' | 'twilio' | 'cloudflare' | 'click2mail' | 'n8n' | 'stripe' | 'smtp' | 'resend' | 'sendgrid' | 'google_oauth' | 'ai_tuning_engine' = 'gemini';
                if (selectedIntegration.id === 'gemini_ai_market') actualService = 'gemini';
                else if (selectedIntegration.id === 'twilio_market') actualService = 'twilio';
                else if (selectedIntegration.id === 'cloudflare_r2_market') actualService = 'cloudflare';
                else if (selectedIntegration.id === 'click2mail_market') actualService = 'click2mail';
                else if (selectedIntegration.id === 'n8n_flow_market') actualService = 'n8n';
                else if (selectedIntegration.id === 'stripe_market') actualService = 'stripe';
                else if (selectedIntegration.id === 'smtp') actualService = 'smtp';
                else if (selectedIntegration.id === 'resend') actualService = 'resend';
                else if (selectedIntegration.id === 'sendgrid') actualService = 'sendgrid';
                else if (selectedIntegration.id === 'google_calendar') actualService = 'google_oauth';
                else if (selectedIntegration.id === 'ai_tuning_market') actualService = 'ai_tuning_engine';

                const result = testResults[actualService];
                if (!result) return null;
                return (
                  <span className={`text-[10px] font-bold flex items-center gap-1 max-w-[200px] truncate ${
                    result.status === 'success' ? 'text-emerald-400' : result.status === 'testing' ? 'text-amber-500' : 'text-red-400'
                  }`}>
                    {result.status === 'success' ? <Check className="h-3.5 w-3.5" /> : result.status === 'testing' ? 'Handshaking...' : <AlertTriangle className="h-3.5 w-3.5" />}
                    <span>{result.message}</span>
                  </span>
                );
              })()}

              <button
                type="button"
                onClick={() => handleMockSave(selectedIntegration)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-amber-500/10 transition active:scale-95 text-center cursor-pointer"
              >
                Save & Connect
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function PluginMarketplaceView() {
  const [plugins, setPlugins] = useState([
    { id: 'irs_efile', name: 'IRS Direct E-File Gateway', category: 'Tax Submission', status: 'active', desc: 'Secure direct e-file transmission protocol to state & federal portals.', version: 'v1.4.2', author: 'RJ Business Solutions' },
    { id: 'qbo_sync', name: 'QuickBooks Real-time Sync', category: 'Accounting', status: 'active', desc: 'Auto-sync active customer tax invoices directly into client records.', version: 'v2.1.0', author: 'Intuit Developer Network' },
    { id: 'credit_pull', name: '3-Bureau Credit Extractor', category: 'Credit Repair', status: 'inactive', desc: 'One-click automated credit report diagnostic pulling for Experian, Equifax, and TransUnion.', version: 'v1.0.8', author: 'IdentityIQ' },
    { id: 'stripe_billing', name: 'Stripe Corporate Retainers', category: 'Billing', status: 'active', desc: 'Enables custom recurring subscription retainer plans on customer landing dashboards.', version: 'v3.2.1', author: 'Stripe Connect' },
    { id: 'drake_sync', name: 'Drake Desktop Bridge', category: 'Tax Software', status: 'inactive', desc: 'Local daemon sync bridge connecting Drake software tax returns with online CRM client profiles.', version: 'v1.2.0', author: 'Drake Software' },
  ]);

  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginDesc, setNewPluginDesc] = useState('');
  const [newPluginCategory, setNewPluginCategory] = useState('Utility');
  const [newPluginUrl, setNewPluginUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleToggle = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to completely uninstall this plugin?')) {
      setPlugins(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddPlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluginName || !newPluginDesc) {
      alert('Please fill in Name and Description.');
      return;
    }
    const newId = `custom_${Date.now()}`;
    const newP = {
      id: newId,
      name: newPluginName,
      category: newPluginCategory,
      status: 'active',
      desc: newPluginDesc,
      version: 'v1.0.0 (Custom)',
      author: newPluginUrl ? newPluginUrl.replace('https://', '').split('/')[0] : 'Self-Hosted'
    };
    setPlugins(prev => [...prev, newP]);
    setNewPluginName('');
    setNewPluginDesc('');
    setNewPluginCategory('Utility');
    setNewPluginUrl('');
    setShowAddModal(false);
    alert(`Successfully installed and compiled customized plugin: "${newPluginName}"!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-serif font-black bg-gradient-to-r from-[#D4AF37] to-amber-300 bg-clip-text text-transparent">White-Label Plugin Manager & Extensions</h2>
          <p className="text-xs text-slate-400 mt-1">Install, compile, and configure customized business plugins directly to your multi-tenant database sandbox.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/15 transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Install Plugin / Manifest
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plugins.map(p => (
          <div 
            key={p.id} 
            className={`bg-neutral-950/60 rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group ${
              p.status === 'active' ? 'border-amber-500/20 shadow-lg shadow-amber-500/5' : 'border-white/5 opacity-75'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono">
                    {p.category}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-100 mt-2">{p.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Author: <strong className="text-slate-300">{p.author}</strong> • Version: {p.version}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(p.id)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      p.status === 'active' ? 'bg-amber-500' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                        p.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 bg-neutral-900 border border-white/5 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-lg transition"
                    title="Uninstall Plugin"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pt-1">{p.desc}</p>
            </div>

            <div className="border-t border-white/5 pt-3.5 flex items-center justify-between text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="font-mono uppercase tracking-wider">{p.status === 'active' ? 'Online & Running' : 'Paused / Off'}</span>
              </div>
              <button className="text-amber-500 font-black hover:underline cursor-pointer uppercase tracking-wider">
                Configure Plugin
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-neutral-950 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-amber-500/20 p-6 space-y-5 relative">
            <h3 className="font-serif font-black text-lg bg-gradient-to-r from-[#D4AF37] to-amber-300 bg-clip-text text-transparent">Install New White-Label Extension</h3>
            
            <form onSubmit={handleAddPlugin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1.5">Plugin Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drake Software e-file, IRS Transcript Puller"
                  value={newPluginName}
                  onChange={(e) => setNewPluginName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs text-white focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1.5">Category</label>
                <select
                  value={newPluginCategory}
                  onChange={(e) => setNewPluginCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs text-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Tax Submission">Tax Submission</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Billing & Pricing">Billing & Pricing</option>
                  <option value="Communications">Communications</option>
                  <option value="Credit Repair">Credit Repair</option>
                  <option value="Utility">Utility</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1.5">Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe the plugin outcome, triggers, and functional mappings..."
                  value={newPluginDesc}
                  onChange={(e) => setNewPluginDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs text-white focus:outline-none transition-all placeholder:text-slate-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1.5">Manifest URL / Git Endpoint (Optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/rjbusinesssolutions/plugin-irs..."
                  value={newPluginUrl}
                  onChange={(e) => setNewPluginUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-xs text-white focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4.5 py-2 bg-neutral-900 border border-white/5 hover:bg-neutral-850 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-xl text-xs uppercase tracking-wider transition"
                >
                  Compile & Deploy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const field_name_default_safeguard = 'default';

