import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Calendar,
  Mail,
  Workflow,
  Funnel,
  Globe,
  FileText,
  BookOpen,
  Share2,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  Building2,
  ChevronDown,
  Bot,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Pipelines', href: '/pipelines', icon: KanbanSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Funnels', href: '/funnels', icon: Funnel },
  { name: 'Websites', href: '/websites', icon: Globe },
  { name: 'Forms', href: '/forms', icon: FileText },
  { name: 'Blog', href: '/blog', icon: BookOpen },
  { name: 'Social', href: '/social', icon: Share2 },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Tax Module', href: '/tax', icon: FileText },
];

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, currentSubAccount, sidebarOpen, toggleSidebar, logout, subAccounts, setCurrentSubAccount } = useAppStore();
  const [showSubAccountMenu, setShowSubAccountMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-950 text-white transition-transform duration-300 ease-in-out border-r border-neutral-800/40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-amber-500" />
              <div>
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">MYVIRTUAL</span>
                <span className="text-[9px] font-semibold text-neutral-400 block -mt-1 tracking-widest">TAX SOFTWARE</span>
              </div>
            </div>
            <div className="px-1.5 py-0.5 text-[9px] font-mono bg-neutral-900 text-amber-400 border border-amber-500/20 rounded">v1.0</div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden p-1 hover:bg-neutral-800 rounded">
            <X className="h-5 w-5 text-neutral-400" />
          </button>
        </div>

        {/* Sub-account selector */}
        {subAccounts.length > 0 && (
          <div className="px-4 py-3 border-b border-neutral-800">
            <div className="relative">
              <button
                onClick={() => setShowSubAccountMenu(!showSubAccountMenu)}
                className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">
                    {currentSubAccount?.name || 'Master Admin'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {showSubAccountMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setCurrentSubAccount(null);
                      setShowSubAccountMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700"
                  >
                    Master Admin
                  </button>
                  {subAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setCurrentSubAccount(account);
                        setShowSubAccountMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700"
                    >
                      {account.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-md shadow-amber-500/10'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-6 px-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Administration
            </div>
          </div>
          <ul className="mt-2 space-y-1 px-2">
            {adminNavigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-md shadow-amber-500/10'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-3">
          {/* TaxSlayer Status */}
          <div className="bg-slate-800 rounded-lg p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="font-medium">TAXSLAYER LIVE</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">API v2.4</div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Last sync: moments ago</div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>

          <div className="text-[10px] text-center text-neutral-500 pt-2 border-t border-neutral-800">
            Tax Pro Hub University • Phase 1 • Delivered May 2026
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts, deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="h-8 w-8 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center font-bold">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {currentUser?.name || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Settings
                    </a>
                    <a href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Admin Panel
                    </a>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
