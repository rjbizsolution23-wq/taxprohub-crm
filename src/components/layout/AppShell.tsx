import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, Users, KanbanSquare, Calendar, MessageSquare, 
  Mail, Zap, Globe, FileText, BookOpen, Star, UserPlus, Folder, 
  RefreshCw, Wrench, ShieldCheck, Calculator, Award, ScanLine, Wand2, KeyRound, 
  Bot, Cpu, Layers, Sparkles, TrendingUp, Mic, DollarSign, BarChart3, 
  Activity, Building2, Settings, ScrollText, Shield, Bell, Search, 
  Menu, LogOut, Moon, Sun, Plus, HelpCircle, AlertTriangle, ChevronDown, Video, GraduationCap,
  Network, Landmark, ArrowRightLeft, Code2, Magnet, Plug, Crown, Rocket
} from 'lucide-react';
import InteractiveTutorial, { TutorialWelcomeBanner } from '../tutorial/InteractiveTutorial';
import { useAppStore } from '../../store';
import { useLiveStream } from '../../utils/liveStream';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  color?: string;
  badge?: string;
  badgeColor?: string;
  count?: number;
  badgeKey?: 'contacts' | 'appointments' | 'workflows' | 'preparers' | 'subAccounts' | 'findings';
}

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-amber-500' },
      { name: 'Tasks', href: '/dashboard?tab=tasks', icon: CheckSquare, badge: 'new', color: 'text-yellow-500' },
    ],
  },
  {
    title: 'CRM',
    items: [
      { name: 'Contacts', href: '/contacts', icon: Users, badgeKey: 'contacts', color: 'text-pink-400' },
      { name: 'Pipelines', href: '/pipelines', icon: KanbanSquare, badge: '$128K', color: 'text-violet-400' },
      { name: 'Calendar', href: '/calendar', icon: Calendar, badgeKey: 'appointments', color: 'text-emerald-400' },
      { name: 'Conversations', href: '/conversations', icon: MessageSquare, count: 3, color: 'text-amber-400' },
      { name: 'Video Calls', href: '/video', icon: Video, badge: 'live', badgeColor: 'text-emerald-400', color: 'text-red-400' },
    ],
  },
  {
    title: 'MARKETING',
    items: [
      { name: 'Campaigns', href: '/campaigns', icon: Mail, color: 'text-rose-400' },
      { name: 'Workflows', href: '/workflows', icon: Zap, badgeKey: 'workflows', color: 'text-cyan-400' },
      { name: 'Sites & Funnels', href: '/funnels', icon: Globe, color: 'text-fuchsia-400' },
      { name: 'Funnel Genie', href: '/genie', icon: Wand2, badge: 'AI ✦ no-key', badgeColor: 'text-fuchsia-300', color: 'text-fuchsia-300' },
      { name: 'Forms', href: '/forms', icon: FileText, color: 'text-sky-400' },
      { name: 'Blog', href: '/blog', icon: BookOpen, color: 'text-lime-400' },
      { name: 'Reputation', href: '/settings?tab=reputation', icon: Star, color: 'text-amber-300' },
      { name: 'Referrals', href: '/contacts?tab=referrals', icon: UserPlus, color: 'text-teal-400' },
    ],
  },
  {
    title: 'TAX MODULE',
    items: [
      { name: 'Tax Clients', href: '/tax?tab=clients', icon: Users, badgeKey: 'contacts', color: 'text-amber-500' },
      { name: 'Invoicing', href: '/billing', icon: FileText, badge: '$ due', badgeColor: 'text-emerald-400', color: 'text-emerald-400' },
      { name: 'Payout Runs', href: '/payout-runs', icon: DollarSign, badge: 'Stripe Connect', badgeColor: 'text-emerald-400', color: 'text-emerald-400' },
      { name: 'Preparers & Payouts', href: '/preparers', icon: Users, badgeKey: 'preparers', color: 'text-[#D4AF37]' },
      { name: 'Document Intelligence', href: '/documents', icon: ScanLine, badge: 'OCR ✦ no-key', badgeColor: 'text-emerald-400', color: 'text-amber-400' },
      { name: 'Documents', href: '/tax?tab=documents', icon: Folder, color: 'text-blue-400' },
      { name: 'TaxSlayer Sync', href: '/tax?tab=sync', icon: RefreshCw, badge: '● connected', badgeColor: 'text-emerald-400', color: 'text-cyan-400' },
      { name: 'IRS Tools', href: '/tax?tab=irs', icon: Wrench, color: 'text-orange-400' },
      { name: 'Audit Shield', href: '/tax?tab=shield', icon: ShieldCheck, color: 'text-indigo-400' },
      { name: 'Bank Products', href: '/bank-products', icon: Landmark, badge: 'RT ✦ advances', badgeColor: 'text-emerald-400', color: 'text-emerald-400' },
      { name: 'Calculators', href: '/tax?tab=calculators', icon: Calculator, color: 'text-pink-400' },
      { name: 'Credentials (PTIN/EFIN)', href: '/tax?tab=credentials', icon: Award, color: 'text-yellow-400' },
    ],
  },
  {
    title: 'CREDIT REPAIR',
    items: [
      { name: 'Credit Clients', href: '/contacts?tab=credit', icon: Users, color: 'text-sky-400' },
      { name: 'Disputes', href: '/contacts?tab=disputes', icon: AlertTriangle, color: 'text-red-400' },
      { name: 'Dispute Letters', href: '/contacts?tab=letters', icon: FileText, color: 'text-purple-400' },
    ],
  },
  {
    title: 'AI SUITE',
    items: [
      { name: 'AI Assistant', href: '/ai', icon: Bot, color: 'text-purple-400' },
      { name: 'AI Agents', href: '/ai?tab=agents', icon: Cpu, color: 'text-pink-400' },
      { name: 'Document Parser', href: '/ai?tab=parser', icon: Layers, color: 'text-indigo-400' },
      { name: 'Year-Round Tax Agent', href: '/ai?tab=tax', icon: Sparkles, color: 'text-amber-400' },
      { name: 'Refund Maximizer', href: '/ai?tab=refund', icon: TrendingUp, color: 'text-emerald-400' },
      { name: 'Voice Mode', href: '/ai?tab=voice', icon: Mic, color: 'text-rose-400' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Overview', href: '/analytics', icon: TrendingUp, color: 'text-indigo-400' },
      { name: 'Revenue', href: '/analytics?tab=revenue', icon: DollarSign, color: 'text-emerald-400' },
      { name: 'Leads', href: '/analytics?tab=leads', icon: BarChart3, color: 'text-amber-400' },
      { name: 'Sub-Account Performance', href: '/analytics?tab=performance', icon: Activity, color: 'text-rose-400' },
    ],
  },
  {
    title: 'ENTERPRISE',
    items: [
      { name: 'Enterprise Hub', href: '/ecosystem', icon: Layers, badge: '40 modules', color: 'text-[#D4AF37]' },
      { name: 'Security & Plan', href: '/security', icon: KeyRound, badge: '2FA + limits', badgeColor: 'text-sky-400', color: 'text-sky-400' },
      { name: 'Compliance Center', href: '/compliance', icon: ShieldCheck, badgeKey: 'findings', badge: '20 agents', badgeColor: 'text-emerald-400', color: 'text-emerald-400' },
      { name: 'Client Portal', href: '/portal', icon: Users, badge: 'passwordless', badgeColor: 'text-cyan-400', color: 'text-cyan-400' },
    ],
  },
  {
    title: 'GROWTH & NETWORK',
    items: [
      { name: 'Recruiting Network', href: '/network', icon: Network, badge: 'downline live', badgeColor: 'text-emerald-400', color: 'text-[#D4AF37]' },
      { name: 'Credit Repair', href: '/credit-repair', icon: ShieldCheck, badge: 'new service', badgeColor: 'text-emerald-400', color: 'text-emerald-400' },
      { name: 'Lead Magnets', href: '/lead-magnets', icon: Magnet, badge: '9 premium', badgeColor: 'text-pink-400', color: 'text-pink-400' },
      { name: 'Migration Center', href: '/migration', icon: ArrowRightLeft, badge: '12 platforms', badgeColor: 'text-cyan-400', color: 'text-cyan-400' },
      { name: 'Integrations Hub', href: '/integrations', icon: Plug, badge: 'IRS ✦ keyed', badgeColor: 'text-emerald-400', color: 'text-sky-400' },
      { name: 'Developer / API', href: '/developer', icon: Code2, badge: 'v1', badgeColor: 'text-violet-400', color: 'text-violet-400' },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { name: 'Tenant Studio', href: '/tenant-studio', icon: Crown, badge: 'master admin', badgeColor: 'text-amber-400', color: 'text-amber-400' },
      { name: 'Company Onboarding', href: '/onboard', icon: Rocket, badge: 'self-serve', badgeColor: 'text-emerald-400', color: 'text-emerald-400' },
      { name: 'Sub-Accounts', href: '/admin', icon: Building2, badgeKey: 'subAccounts', color: 'text-blue-400' },
      { name: 'Help Center', href: '/help', icon: HelpCircle, badge: 'docs', badgeColor: 'text-amber-400', color: 'text-amber-300' },
      { name: 'Settings', href: '/settings', icon: Settings, color: 'text-slate-400' },
      { name: 'Audit Logs', href: '/admin?tab=logs', icon: ScrollText, color: 'text-amber-600' },
      { name: 'Compliance', href: '/admin?tab=compliance', icon: Shield, color: 'text-red-500' },
    ],
  },
];

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, logout, currentSubAccount, subAccounts, setCurrentSubAccount,
    contacts, appointments, workflows, preparers } = useAppStore();
  const { snapshot, connected } = useLiveStream(true);

  /* LIVE sidebar counters — real records only, no invented totals. */
  const liveBadges: Record<string, string | undefined> = {
    contacts: contacts.length ? String(contacts.length) : undefined,
    appointments: appointments.length ? `${appointments.length} booked` : undefined,
    workflows: workflows.filter((w: any) => w.isActive).length ? `${workflows.filter((w: any) => w.isActive).length} active` : undefined,
    preparers: preparers.length ? `${preparers.length} active` : undefined,
    subAccounts: subAccounts.length ? `${subAccounts.length} active` : undefined,
    findings: snapshot?.openFindings ? `${snapshot.openFindings} open` : undefined,
  };
  const [isDark, setIsDark] = useState(true);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showAIQuickBar, setShowAIQuickBar] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard' && !location.search;
    const [path, search] = href.split('?');
    if (search) {
      return location.pathname === path && location.search.includes(search);
    }
    return location.pathname.startsWith(path) && !location.search;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-950 border-r border-[#1f2937]/50 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-[#1f2937]/50 shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg" 
              alt="RJ Logo" 
              className="h-9 w-9 rounded-xl object-cover border border-[#D4AF37]/30 shadow-lg shadow-amber-500/5"
            />
            <div>
              <div className="font-black text-lg tracking-tight text-white font-serif leading-none">
                {currentSubAccount ? currentSubAccount.name : 'MYVIRTUAL'}
              </div>
              <div className="text-[9px] text-[#D4AF37] mt-0.5 font-mono tracking-[0.2em] font-black uppercase">
                {currentSubAccount ? 'WHITE-LABEL PRO' : 'TAX PRO'}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-black text-[#D4AF37]/70 font-serif tracking-[0.2em] border-b border-amber-500/10 mb-2">
                {section.title}
              </div>
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.href);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all group ${
                      active 
                        ? 'bg-gradient-to-r from-amber-500/15 to-yellow-500/5 text-amber-400 border border-amber-500/20 font-semibold shadow-inner shadow-amber-500/5' 
                        : 'text-slate-300 hover:bg-[#1f2937]/40 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                      <span className="truncate pr-1">{item.name}</span>
                    </div>
                    {((item.badgeKey && liveBadges[item.badgeKey]) || item.badge) && (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black shrink-0 ${
                        item.badgeColor || 'bg-amber-500/10 text-[#D4AF37] border border-amber-500/20'
                      }`}>
                        {(item.badgeKey && liveBadges[item.badgeKey]) || item.badge}
                      </span>
                    )}
                    {item.count !== undefined && (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-[8px] text-white flex items-center justify-center font-bold shrink-0">
                        {item.count}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-[#1f2937]/50 shrink-0 bg-neutral-950/80 backdrop-blur-md">
          {/* Quick Buttons */}
          <div className="flex items-center justify-between gap-2 mb-3 px-2">
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-1.5 rounded-lg hover:bg-neutral-900 text-slate-400 hover:text-amber-400 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>
            <button 
              onClick={() => navigate('/contacts?action=add')}
              className="p-1.5 rounded-lg hover:bg-neutral-900 text-slate-400 hover:text-amber-400 transition-colors"
              title="Quick Add Contact"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button 
              onClick={() => navigate('/help')}
              className="p-1.5 rounded-lg hover:bg-neutral-900 text-slate-400 hover:text-amber-400 transition-colors"
              title="Help Center & Documentation"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-neutral-900 text-slate-400 hover:text-rose-400 transition-colors"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-neutral-900/60 border border-amber-500/10 rounded-2xl p-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-600 flex items-center justify-center font-bold text-black font-serif text-sm">
              RJ
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-white truncate">Rick Jefferson</div>
              <div className="text-[9px] text-[#D4AF37] truncate font-mono">support@rjbusinesssolutions.org</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${sidebarOpen ? 'md:pl-64' : 'md:pl-64'}`}>
        {/* Top Navigation */}
        <header className="h-16 border-b border-[#1f2937]/50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between px-6 z-44 sticky top-0 font-sans">
          <button onClick={toggleSidebar} className="md:hidden p-2 -ml-2 text-slate-300 hover:text-amber-400">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 flex items-center gap-4 ml-4 md:ml-0">
            {/* Tenant Switcher */}
            <div className="relative">
              <button 
                onClick={() => setShowTenantMenu(!showTenantMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-[#1f2937] rounded-xl text-xs hover:border-[#D4AF37]/40 transition-colors font-medium text-white"
              >
                <Building2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span className="max-w-[100px] truncate">{currentSubAccount?.name || 'Master Tenant'}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
              {showTenantMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-neutral-950 border border-[#1f2937] rounded-xl shadow-2xl z-50 py-1">
                  <button 
                    onClick={() => { setCurrentSubAccount(null); setShowTenantMenu(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-[#1f2937] text-slate-300 hover:text-white"
                  >
                    Master Tenant
                  </button>
                  {subAccounts.map((sub) => (
                    <button 
                      key={sub.id}
                      onClick={() => { setCurrentSubAccount(sub); setShowTenantMenu(false); }}
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-[#1f2937] text-slate-300 hover:text-white"
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Global Search */}
            <div className="relative flex-1 max-w-xs hidden lg:block">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search clients, files... (Cmd+K)" 
                className="w-full bg-neutral-900/80 border border-[#1f2937] pl-9 pr-4 py-1.5 rounded-xl text-[11px] focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 placeholder:text-slate-500 text-white"
              />
            </div>

            {/* AI Quick Bar */}
            <div className="hidden xl:flex items-center gap-1.5 border-l border-[#1f2937]/80 pl-4">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-500 font-mono">AI Quick-Bar:</span>
              <button onClick={() => navigate('/ai')} className="flex items-center gap-1 px-2 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[10px] rounded-lg text-[#D4AF37] font-semibold hover:bg-[#D4AF37]/20 transition-all">
                <Bot className="h-3 w-3" />
                <span>Assistant</span>
              </button>
              <button onClick={() => navigate('/ai?tab=parser')} className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] rounded-lg text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-all">
                <Layers className="h-3 w-3" />
                <span>Parser</span>
              </button>
              <button onClick={() => navigate('/ai/email')} className="flex items-center gap-1 px-2 py-1 bg-sky-500/10 border border-sky-500/20 text-[10px] rounded-lg text-sky-400 font-semibold hover:bg-sky-500/20 transition-all">
                <Mail className="h-3 w-3" />
                <span>Email</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Status Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              TaxSlayer Live
            </div>

            {/* Interactive Tutorial launcher */}
            <button
              onClick={() => setShowTutorial(true)}
              title="Interactive Tutorial (72 steps)"
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[#D4AF37] hover:bg-amber-500/20 transition-all"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden lg:inline text-[10px] font-black uppercase tracking-wider">Tutorial</span>
            </button>

            <button onClick={() => setIsDark(!isDark)} className="text-slate-400 hover:text-amber-400 transition-colors">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications */}
            <button onClick={() => navigate('/notifications')} className="relative p-1.5 text-slate-400 hover:text-[#D4AF37] transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-4 border-l border-[#1f2937]/80 hover:opacity-90 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">Rick Jefferson</div>
                  <div className="text-[9px] text-[#D4AF37] -mt-0.5 font-mono">AGI Architect</div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-xl flex items-center justify-center text-black font-black text-sm font-serif">
                  RJ
                </div>
              </button>
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-950 border border-[#1f2937] rounded-xl shadow-2xl z-52 py-1.5">
                  <div className="px-3.5 py-2 border-b border-[#1f2937] mb-1">
                    <div className="text-xs font-bold text-white">Rick Jefferson</div>
                    <div className="text-[10px] text-slate-400 truncate">rjbizsolution23@gmail.com</div>
                  </div>
                  <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }} className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-[#1f2937] text-slate-300 hover:text-white transition-colors">
                    Profile Settings
                  </button>
                  <button onClick={() => { navigate('/admin?tab=compliance'); setShowUserMenu(false); }} className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-[#1f2937] text-slate-300 hover:text-white transition-colors">
                    Compliance Shield
                  </button>
                  <button onClick={() => { navigate('/admin?tab=logs'); setShowUserMenu(false); }} className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-[#1f2937] text-slate-300 hover:text-white transition-colors">
                    Audit Logs
                  </button>
                  <hr className="border-[#1f2937] my-1" />
                  <button onClick={handleLogout} className="w-full text-left px-3.5 py-2 text-xs hover:bg-rose-500/10 text-rose-400 font-semibold transition-colors">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden flex flex-col justify-between min-h-[calc(100vh-4rem)]">
          <div className="max-w-[1600px] w-full mx-auto p-6 md:p-8 flex-1">
            <Outlet />
          </div>

          {/* Footer Compliance Strip */}
          <footer className="border-t border-[#1f2937]/50 bg-neutral-950/80 backdrop-blur-md px-6 py-4 text-xs text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4 mt-auto">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono tracking-wider">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                SOC 2 TYPE II
              </span>
              <span className="text-slate-600">|</span>
              <span>IRS PUB 4557</span>
              <span className="text-slate-600">|</span>
              <span>GLBA SAFEGUARDS</span>
              <span className="text-slate-600">|</span>
              <span>CCPA COMPLIANT</span>
            </div>

            <div className="flex items-center gap-4 font-mono text-[10px]">
              <span className="text-amber-500 font-bold">RJ Business Solutions</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Session Timer: 14:59</span>
              <span className="text-slate-600">•</span>
              <span className="text-[#D4AF37] font-bold">Build v2.0.4</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Interactive 72-step Tutorial */}
      <InteractiveTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
      {!showTutorial && <TutorialWelcomeBanner onStart={() => setShowTutorial(true)} />}
    </div>
  );
}
