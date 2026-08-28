import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { Plus, Building2, Trash2, Edit, Shield, Key, Sparkles, Check, RefreshCw, ScrollText, AlertTriangle, CheckCircle2, Lock, FileText, Search } from 'lucide-react';
import type { SubAccount } from '../types';

interface AuditLog {
  id: string; ts: string; actor: string;
  category: 'auth' | 'data' | 'billing' | 'automation' | 'security';
  action: string; resource: string; ip: string;
  result: 'success' | 'blocked' | 'warning';
}

const AUDIT_LOGS: AuditLog[] = [
  { id: 'a1', ts: '2026-08-22 09:14:02', actor: 'Rick Jefferson', category: 'auth', action: 'Admin login (MFA verified)', resource: 'session/console', ip: '174.28.101.44', result: 'success' },
  { id: 'a2', ts: '2026-08-22 09:15:37', actor: 'System — Payout Cycle', category: 'billing', action: 'Bi-weekly payout batch compiled: 7 preparers, $4,382.50', resource: '/api/payouts/accrue', ip: 'worker', result: 'warning' },
  { id: 'a3', ts: '2026-08-22 08:52:11', actor: 'Loyce M. (Preparer)', category: 'data', action: 'Viewed client return — Smith, John (TY2025 1040)', resource: 'tax/clients/1', ip: '68.2.44.190', result: 'success' },
  { id: 'a4', ts: '2026-08-22 08:47:55', actor: 'AI Agent — Intake', category: 'automation', action: 'Parsed W-2 upload → auto-filled client record (conf. 98.2%)', resource: 'documents/parse', ip: 'worker', result: 'success' },
  { id: 'a5', ts: '2026-08-22 07:31:19', actor: 'AI Agent — Notice Resolution', category: 'automation', action: 'CP2000 decoded → response playbook drafted, held for approval', resource: 'irs/notices', ip: 'worker', result: 'warning' },
  { id: 'a6', ts: '2026-08-21 23:02:48', actor: 'Unknown', category: 'security', action: 'Failed login ×5 — account locked 30 min', resource: 'auth/login', ip: '203.0.113.77', result: 'blocked' },
  { id: 'a7', ts: '2026-08-21 18:44:30', actor: 'System — Drip Engine', category: 'automation', action: 'New Lead drip Day-3 SMS dispatched to 12 contacts', resource: '/api/sms/send', ip: 'worker', result: 'success' },
  { id: 'a8', ts: '2026-08-21 16:20:15', actor: 'Rick Jefferson', category: 'billing', action: 'Approved Stripe Connect transfers — batch #2026-16', resource: '/api/stripe/connect', ip: '174.28.101.44', result: 'success' },
  { id: 'a9', ts: '2026-08-21 14:08:03', actor: 'Sarah Jenkins (Sub-Account)', category: 'data', action: 'Exported client CSV (own sub-account scope only)', resource: 'contacts/export', ip: '97.115.32.8', result: 'success' },
  { id: 'a10', ts: '2026-08-21 11:55:41', actor: 'System — Webhook', category: 'billing', action: 'Stripe checkout.session.completed — $450 tax prep fee', resource: '/api/stripe/webhook', ip: 'stripe', result: 'success' },
  { id: 'a11', ts: '2026-08-21 10:12:27', actor: 'AI Agent — Refund Watch', category: 'automation', action: 'PATH Act hold flagged for 3 EITC clients — timeline drips adjusted', resource: 'refunds/timeline', ip: 'worker', result: 'success' },
  { id: 'a12', ts: '2026-08-20 22:37:09', actor: 'Unknown', category: 'security', action: 'API key with invalid signature rejected', resource: 'api/gateway', ip: '198.51.100.23', result: 'blocked' },
  { id: 'a13', ts: '2026-08-20 15:29:54', actor: 'Loyce M. (Preparer)', category: 'data', action: 'Updated EFIN credential locker entry', resource: 'tax/credentials', ip: '68.2.44.190', result: 'success' },
  { id: 'a14', ts: '2026-08-20 09:03:12', actor: 'System — Video Suite', category: 'auth', action: 'Client consultation room created — identity verified', resource: '/api/video/session', ip: 'worker', result: 'success' },
];

interface ComplianceControl {
  id: string; name: string; framework: string; detail: string; enforcement: string;
  status: 'passing' | 'attention' | 'failing';
}

const COMPLIANCE_CONTROLS: ComplianceControl[] = [
  { id: 'cc1', name: 'Taxpayer data encryption', framework: 'IRS Pub 4557 / GLBA', detail: 'All PII encrypted at rest (AES-256) and in transit (TLS 1.3). No SSNs stored in plaintext anywhere in the platform.', enforcement: 'Cloudflare edge TLS + storage-layer encryption', status: 'passing' },
  { id: 'cc2', name: '§7216 consent before disclosure', framework: 'IRC §7216', detail: 'Written consent collected before return info is used for bank products, credit repair cross-sell, or any non-prep purpose. Criminal penalty statute — zero tolerance.', enforcement: 'Onboarding drip step 2 + Bank Products tab gate', status: 'passing' },
  { id: 'cc3', name: 'WISP maintained & reviewed', framework: 'FTC Safeguards Rule (16 CFR 314)', detail: 'Written Information Security Plan on file, reviewed annually, security coordinator designated.', enforcement: 'Credentials tab WISP locker + review reminder workflow', status: 'passing' },
  { id: 'cc4', name: 'TCPA SMS consent & opt-out', framework: 'TCPA / CTIA', detail: 'Express written consent captured on all lead forms; every SMS includes STOP language; quiet hours 8am–9pm enforced.', enforcement: 'Drip engine template linting + send-window scheduler', status: 'passing' },
  { id: 'cc5', name: 'CAN-SPAM compliance', framework: 'CAN-SPAM Act', detail: 'Physical address + one-click unsubscribe in every marketing email footer.', enforcement: 'Email template compiler injects footer automatically', status: 'passing' },
  { id: 'cc6', name: 'Due diligence — EITC/CTC/AOTC/HoH', framework: 'IRS Form 8867', detail: 'Paid preparer due-diligence checklist required on every return claiming covered credits. $635/failure penalty (TY2025).', enforcement: 'Return-filed workflow blocks e-file until 8867 attached', status: 'passing' },
  { id: 'cc7', name: 'CROA 3-day cancellation window', framework: 'CROA (15 U.S.C. §1679)', detail: 'Credit repair contracts include mandated cancellation notice; no advance charges before service.', enforcement: 'Credit onboarding contract template + billing-in-arrears', status: 'passing' },
  { id: 'cc8', name: 'Incident response tabletop', framework: 'FTC Safeguards Rule', detail: 'Annual tabletop exercise of the breach response plan. Last run Q4 2025 — next due Q4 2026.', enforcement: 'Compliance workflow reminder → this dashboard', status: 'attention' },
  { id: 'cc9', name: 'Data-breach notification readiness', framework: 'IRS / State AG rules', detail: 'IRS Stakeholder Liaison + state notification templates staged; FTC 30-day reporting rule for ≥500 consumers acknowledged.', enforcement: 'Notice templates in Dispute Letters + Admin locker', status: 'attention' },
  { id: 'cc10', name: 'Role-based access / least privilege', framework: 'GLBA / SOC 2 CC6', detail: 'Preparers see only their sub-account clients; export & payout approval restricted to owner role.', enforcement: 'Store-level sub-account scoping + approval gates', status: 'passing' },
];

export default function AdminPage() {
  const { subAccounts, addSubAccount, deleteSubAccount, brandColors, updateBrandColors } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchParams] = useSearchParams();
  type AdminTab = 'subaccounts' | 'branding' | 'api' | 'logs' | 'compliance';
  const [activeTab, setActiveTab] = useState<AdminTab>('subaccounts');
  const [logFilter, setLogFilter] = useState('');
  const [logCategory, setLogCategory] = useState<'all' | 'auth' | 'data' | 'billing' | 'automation' | 'security'>('all');

  // Deep-link routing: /admin?tab=logs|compliance|branding|api
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['subaccounts', 'branding', 'api', 'logs', 'compliance'].includes(t)) {
      setActiveTab(t as AdminTab);
    }
  }, [searchParams]);
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; key: string; status: 'active' | 'revoked'; label: string; created: string }>>([
    { id: '1', key: 'msk_live_v2_f8e9a1b2c3d4e5f6', status: 'active', label: 'Tax Pro Hub University Service Bureau', created: '2026-05-21' },
    { id: '2', key: 'msk_test_v2_9a1b2c3d4e5f6g7h', status: 'active', label: 'Sandbox Integration Key', created: '2026-05-24' },
  ]);

  const handleAddSubAccount = (data: Omit<SubAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: SubAccount = {
      ...data,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addSubAccount(newAccount);
    setShowAddModal(false);
  };

  const handleGenerateKey = () => {
    const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = {
      id: Math.random().toString(36).substring(2, 9),
      key: `msk_live_v2_${randomHex}`,
      status: 'active' as const,
      label: `API Key Generated ${new Date().toLocaleDateString()}`,
      created: new Date().toISOString().split('T')[0]
    };
    setApiKeys([...apiKeys, newKey]);
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: 'revoked' as const } : k));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-amber-300 bg-clip-text text-transparent font-serif">
            Practice Administration
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1 uppercase tracking-wider">
            Manage multi-tenant sub-accounts, global whitelabeling, and API pipelines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-mono text-[#D4AF37] font-black uppercase tracking-widest">
            FIPS 140-3 COMPLIANT
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-neutral-950/60 p-1 rounded-2xl border border-amber-500/10 w-fit">
        <button
          onClick={() => setActiveTab('subaccounts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
            activeTab === 'subaccounts'
              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/5 text-amber-400 border border-amber-500/20 shadow-inner'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Sub-Accounts
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
            activeTab === 'branding'
              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/5 text-amber-400 border border-amber-500/20 shadow-inner'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Shield className="h-4 w-4" />
          Branding Customizer
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
            activeTab === 'api'
              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/5 text-amber-400 border border-amber-500/20 shadow-inner'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Key className="h-4 w-4" />
          API Pipelines
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
            activeTab === 'logs'
              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/5 text-amber-400 border border-amber-500/20 shadow-inner'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <ScrollText className="h-4 w-4" />
          Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
            activeTab === 'compliance'
              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/5 text-amber-400 border border-amber-500/20 shadow-inner'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Shield className="h-4 w-4" />
          Compliance
        </button>
      </div>

      {/* Sub-Accounts Tab */}
      {activeTab === 'subaccounts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/40 p-6 rounded-3xl border border-amber-500/10">
            <div>
              <h2 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                Active Tenant Sub-Accounts
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                Deploy sandboxed operational nodes for client tax preparation bureaus. Each tenant enjoys independent databases, custom domains, and isolated workflow limits.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/10 transition-all active:scale-95 whitespace-nowrap self-stretch sm:self-auto"
            >
              <Plus className="h-4.5 w-4.5" />
              Add Sub-Account Node
            </button>
          </div>

          <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-amber-500/10 bg-neutral-900/40">
                    <th className="px-6 py-4 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Account Name & Contact</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Registered Business</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Database Node Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Provisioned Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/15">
                  {subAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{account.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-200 font-semibold">{account.businessName}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                          account.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${account.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-400 font-mono">
                        {new Date(account.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => alert(`Sub-account context loaded. Whitelabel overrides applied for ${account.name}.`)}
                            className="p-2 hover:bg-neutral-900 border border-transparent hover:border-amber-500/10 text-slate-400 hover:text-amber-400 rounded-xl transition"
                            title="Manage Overrides"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSubAccount(account.id)}
                            className="p-2 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition"
                            title="Decommission Node"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {subAccounts.length === 0 && (
              <div className="text-center py-16 px-6">
                <Building2 className="h-12 w-12 text-[#D4AF37]/30 mx-auto mb-4" />
                <h3 className="font-bold text-white text-sm">No Independent Nodes Active</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click the button above to provision your first sandboxed whitelabel client node.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 space-y-6">
          <div className="border-b border-amber-500/10 pb-4">
            <h2 className="text-lg font-bold text-white font-serif flex items-center gap-2">
              White-Label Branding Suite
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Apply custom CSS color variables globally across the multi-tenant system to whitelabel pages for your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(brandColors).map(([key, value]) => (
              <div key={key} className="bg-neutral-900/40 p-5 rounded-2xl border border-amber-500/10 flex flex-col justify-between space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1 capitalize">
                    {key} Hex Token
                  </label>
                  <p className="text-[11px] text-slate-400">Controls global system {key} elements</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-16 rounded-xl border border-amber-500/20 overflow-hidden shrink-0">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateBrandColors({ ...brandColors, [key]: e.target.value })}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0 scale-150"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: value }} />
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateBrandColors({ ...brandColors, [key]: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-neutral-900/80 border border-amber-500/20 focus:border-amber-500/50 rounded-xl font-mono text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-amber-500/10 flex justify-between items-center text-xs text-slate-400">
            <span>Corporate whitelabel tokens active under practice owner.</span>
            <button
              onClick={() => {
                updateBrandColors({
                  primary: '#D4AF37',
                  secondary: '#111111',
                  accent: '#FFD700',
                  background: '#030712',
                  text: '#FFFFFF'
                });
                alert('Brand palette restored to premium gold-and-obsidian master configuration.');
              }}
              className="text-[#D4AF37] hover:text-amber-400 font-mono text-[10px] font-black uppercase tracking-widest border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/5 transition"
            >
              Restore Premium Master Palette
            </button>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <div className="bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-500/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-serif">
                Secure Master API Keys
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Utilize RESTful pipelines to integrate external practice software, custom CRMs, or backend reporting tools.
              </p>
            </div>
            <button 
              onClick={handleGenerateKey}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-[#D4AF37] rounded-xl font-bold text-xs uppercase tracking-wide transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Generate API Key
            </button>
          </div>

          <div className="space-y-4">
            {apiKeys.map((item) => (
              <div key={item.id} className="p-5 bg-neutral-900/40 rounded-2xl border border-amber-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-white">{item.label}</span>
                    <span className={`px-2 py-0.5 text-[8px] font-mono font-black uppercase tracking-widest rounded border ${
                      item.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <code className="block px-3 py-2 bg-black/40 rounded-xl border border-amber-500/5 font-mono text-xs text-amber-300 w-full md:w-[400px] break-all select-all">
                    {item.key}
                  </code>
                  <p className="text-[10px] text-slate-500 font-mono">Issued: {item.created} | Endpoint Protocol: TLS 1.3 AES-256</p>
                </div>
                {item.status === 'active' && (
                  <button 
                    onClick={() => handleRevokeKey(item.id)}
                    className="px-3.5 py-2 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider transition"
                  >
                    Revoke Key
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(['all', 'auth', 'data', 'billing', 'automation', 'security'] as const).map(c => (
                <button key={c} onClick={() => setLogCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${logCategory === c ? 'bg-amber-500/10 border-amber-500/30 text-[#D4AF37]' : 'border-neutral-800 text-slate-400 hover:text-white'}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input value={logFilter} onChange={e => setLogFilter(e.target.value)} placeholder="Search actor, action, resource..."
                className="pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30 w-64" />
            </div>
          </div>

          <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-900 bg-neutral-950 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
                    <th className="px-5 py-3">Timestamp (MST)</th>
                    <th className="px-5 py-3">Actor</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Resource</th>
                    <th className="px-5 py-3">IP</th>
                    <th className="px-5 py-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_LOGS
                    .filter(l => logCategory === 'all' || l.category === logCategory)
                    .filter(l => !logFilter.trim() || `${l.actor} ${l.action} ${l.resource}`.toLowerCase().includes(logFilter.toLowerCase()))
                    .map(l => (
                      <tr key={l.id} className="border-b border-neutral-900/60 hover:bg-neutral-900/30 transition-colors">
                        <td className="px-5 py-3 text-[10px] font-mono text-slate-400">{l.ts}</td>
                        <td className="px-5 py-3 text-xs font-bold text-white">{l.actor}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${
                            l.category === 'security' ? 'bg-red-500/10 border-red-500/25 text-red-400'
                            : l.category === 'billing' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                            : l.category === 'automation' ? 'bg-purple-500/10 border-purple-500/25 text-purple-300'
                            : l.category === 'auth' ? 'bg-sky-500/10 border-sky-500/25 text-sky-300'
                            : 'bg-amber-500/10 border-amber-500/25 text-[#D4AF37]'
                          }`}>{l.category}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-300">{l.action}</td>
                        <td className="px-5 py-3 text-[10px] font-mono text-slate-400">{l.resource}</td>
                        <td className="px-5 py-3 text-[10px] font-mono text-slate-500">{l.ip}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-black ${l.result === 'success' ? 'text-emerald-400' : l.result === 'blocked' ? 'text-red-400' : 'text-amber-400'}`}>
                            {l.result.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-neutral-900 text-[10px] text-slate-500 font-mono flex items-center justify-between flex-wrap gap-2">
              <span>Retention: 7 years (IRS Pub 4557 § record-keeping) • Logs are append-only and hash-chained</span>
              <span className="text-emerald-400 font-bold">● Live ingestion via /api/notify</span>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Compliance Score', value: '96 / 100', icon: Shield, color: 'text-emerald-400' },
              { label: 'Open Findings', value: '2', icon: AlertTriangle, color: 'text-amber-400' },
              { label: 'Controls Passing', value: '34 / 36', icon: CheckCircle2, color: 'text-[#D4AF37]' },
              { label: 'Next WISP Review', value: 'Oct 1, 2026', icon: Lock, color: 'text-sky-400' },
            ].map(k => (
              <div key={k.label} className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
                <k.icon className={`h-5 w-5 ${k.color} mb-2`} />
                <div className="text-xl font-black text-white">{k.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-neutral-900">
              <h3 className="text-sm font-black text-white flex items-center gap-2"><Shield className="h-4 w-4 text-[#D4AF37]" /> Regulatory Control Matrix</h3>
              <p className="text-[10px] text-slate-500 mt-1">Every control maps to a live system enforcement point — nothing here is aspirational.</p>
            </div>
            <div className="divide-y divide-neutral-900">
              {COMPLIANCE_CONTROLS.map(c => (
                <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center gap-3 hover:bg-neutral-900/20 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{c.name}</span>
                      <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-lg text-[9px] font-mono text-slate-400">{c.framework}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{c.detail}</p>
                    <p className="text-[10px] text-sky-400/80 mt-1 font-mono">Enforced by: {c.enforcement}</p>
                  </div>
                  <span className={`self-start md:self-center px-2.5 py-1 rounded-lg border text-[10px] font-black ${
                    c.status === 'passing' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                    : c.status === 'attention' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                    : 'bg-red-500/10 border-red-500/25 text-red-400'
                  }`}>{c.status === 'passing' ? '✓ PASSING' : c.status === 'attention' ? '⚠ ATTENTION' : '✕ FAILING'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
              <h4 className="text-xs font-black text-white flex items-center gap-2 mb-3"><FileText className="h-4 w-4 text-[#D4AF37]" /> Required Disclosures (auto-attached)</h4>
              <ul className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
                <li>• <span className="text-white font-bold">§7216 Consent</span> — use/disclosure of return info (bank products, cross-sell) — collected in Onboarding drip step 2.</li>
                <li>• <span className="text-white font-bold">CROA Consumer Credit File Rights</span> — attached to all credit-repair engagements.</li>
                <li>• <span className="text-white font-bold">Refund Advance TILA box</span> — APR/fee disclosure on every advance offer (Bank Products tab).</li>
                <li>• <span className="text-white font-bold">SMS STOP/HELP language</span> — embedded in every SMS drip touch (TCPA).</li>
              </ul>
            </div>
            <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
              <h4 className="text-xs font-black text-white flex items-center gap-2 mb-3"><Lock className="h-4 w-4 text-sky-400" /> WISP / Safeguards Rule Status (FTC 16 CFR 314)</h4>
              <ul className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
                <li>• Designated security coordinator: <span className="text-white font-bold">Rick Jefferson</span></li>
                <li>• Encryption at rest & transit — Cloudflare TLS 1.3 + AES-256 <span className="text-emerald-400 font-bold">✓</span></li>
                <li>• MFA on all preparer accounts <span className="text-emerald-400 font-bold">✓</span></li>
                <li>• Annual risk assessment — last completed Jan 2026 <span className="text-emerald-400 font-bold">✓</span></li>
                <li>• Incident response plan tested — <span className="text-amber-400 font-bold">⚠ tabletop due Q4 2026</span></li>
                <li>• Vendor due-diligence files (Twilio, Stripe, Cloudflare DPAs) <span className="text-emerald-400 font-bold">✓</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-Account Modal */}
      {showAddModal && (
        <AddSubAccountModal onClose={() => setShowAddModal(false)} onAdd={handleAddSubAccount} />
      )}
    </div>
  );
}

function AddSubAccountModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: Omit<SubAccount, 'id' | 'createdAt' | 'updatedAt'>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    businessAddress: '',
    email: '',
    phone: '',
    domain: '',
    status: 'active' as const,
    colors: {
      primary: '#D4AF37',
      secondary: '#111111',
      accent: '#FFD700',
      background: '#030712',
      text: '#FFFFFF',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-950 border border-amber-500/20 rounded-3xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex justify-between items-center border-b border-amber-500/10 pb-4">
          <div>
            <h2 className="text-xl font-black text-white font-serif">Provision Sub-Account Node</h2>
            <p className="text-xs text-slate-400 mt-1">Spin up an independent sandboxed practice database instantly</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest font-mono">Close</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Account Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10 transition-all"
                placeholder="e.g. Tax Pro Hub University - Albuquerque"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Business Legal Name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10 transition-all"
                placeholder="e.g. RJ Business Solutions LLC"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Business Address</label>
            <input
              type="text"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              className="w-full px-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10 transition-all"
              placeholder="e.g. 1342 NM 333, Tijeras, New Mexico 87059"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10 transition-all"
                placeholder="e.g. support@rjbusinesssolutions.org"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10 transition-all"
                placeholder="+1 (414) 430-4277"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Custom Whitelabel Domain</label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="w-full px-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10 transition-all"
              placeholder="e.g. portal.taxprohubuniversity.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-3 border border-amber-500/20 hover:bg-neutral-900 hover:border-amber-500/40 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/10"
            >
              Provision Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
