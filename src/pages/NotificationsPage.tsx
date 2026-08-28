import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { 
  Bell, BellOff, Check, Trash2, Info, CheckCircle2, AlertTriangle, 
  XCircle, Filter, Calendar, ExternalLink, ArrowRight, ShieldAlert 
} from 'lucide-react';
import { Notification } from '../types';

export default function NotificationsPage() {
  const { 
    notifications, 
    addNotification, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'warning'>('all');

  // Seed default notifications if none exist in the store to provide a premium experience
  useEffect(() => {
    if (notifications.length === 0) {
      const defaultAlerts: Notification[] = [
        {
          id: 'n-1',
          type: 'success',
          title: 'TaxSlayer E-File Approved',
          message: 'Filing ID #TXS-2026-9801 for Marcus Vance has been approved by IRS. Expected deposit: May 24, 2026.',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
        },
        {
          id: 'n-2',
          type: 'info',
          title: 'New Document Uploaded',
          message: 'Client Sarah Jenkins uploaded W-2 statements & 1099-NEC into the Cloudflare R2 Document Vault.',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
          id: 'n-3',
          type: 'warning',
          title: 'Twilio SMS Gateway Delay',
          message: 'Outbound carrier logs indicate standard routing bottlenecks on 10DLC unregistered numbers. Re-verifying business profiles is advised.',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // Yesterday
        },
        {
          id: 'n-4',
          type: 'error',
          title: 'Click2Mail Dispatch Failed',
          message: 'XML Dispatcher rejected envelope parameters for David Kross due to a missing valid recipient zip code formatting.',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
        }
      ];

      // Reverse seed so the newest is at the top
      defaultAlerts.reverse().forEach(alert => addNotification(alert));
    }
  }, [notifications.length, addNotification]);

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'warning') return n.type === 'warning' || n.type === 'error';
    return true;
  });

  const getAlertIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'error': return <XCircle className="h-5 w-5 text-rose-400" />;
      default: return <Info className="h-5 w-5 text-amber-500" />;
    }
  };

  const getAlertBg = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500/10 border-green-500/15';
      case 'warning': return 'bg-amber-500/10 border-amber-500/15';
      case 'error': return 'bg-rose-500/10 border-rose-500/15';
      default: return 'bg-amber-500/10 border-amber-500/15';
    }
  };

  const formatTime = (dateObj: Date | string) => {
    const d = typeof dateObj === 'string' ? new Date(dateObj) : dateObj;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 text-white bg-slate-900 min-h-screen p-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-500" />
            System Notifications Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track real-time tax filing updates, incoming messages, uploader triggers, and master gateway events.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={markAllNotificationsRead}
            disabled={notifications.every(n => n.read)}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 disabled:opacity-45 disabled:pointer-events-none rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-300"
          >
            <Check className="h-4 w-4" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Control filters row */}
      <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-2xl">
        <div className="flex items-center gap-1">
          {(['all', 'unread', 'warning'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                activeFilter === filter 
                  ? 'bg-slate-900 border border-slate-800 text-white font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter === 'warning' ? 'Alerts & Errors' : filter}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono text-slate-500 px-2 font-bold uppercase tracking-wider">
          {filteredNotifications.length} Notifications Shown
        </span>
      </div>

      {/* Main Stream list */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-16 border border-slate-800 border-dashed rounded-3xl text-center bg-slate-950/20">
            <BellOff className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              There are no {activeFilter === 'unread' ? 'unread' : activeFilter === 'warning' ? 'warning-level' : ''} alerts currently needing your attention.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-4 border rounded-2xl flex items-start gap-4 transition-all relative group ${getAlertBg(n.type)} ${
                n.read ? 'opacity-65 grayscale-[30%] hover:opacity-90' : 'hover:border-slate-700/60 shadow-lg shadow-amber-500/2'
              }`}
            >
              {/* Unread Indicator */}
              {!n.read && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-r-full"></span>
              )}

              {/* Alert icon */}
              <div className="mt-0.5 flex-shrink-0">
                {getAlertIcon(n.type)}
              </div>

              {/* Message body */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className={`text-xs font-extrabold tracking-tight ${n.read ? 'text-slate-300' : 'text-white'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {/* Quick Actions (Hover visible or static) */}
              <div className="flex-shrink-0 flex items-center gap-1 self-center">
                {!n.read && (
                  <button 
                    onClick={() => markNotificationRead(n.id)}
                    title="Mark as Read"
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:border-amber-500/40 text-slate-400 hover:text-amber-500 transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compliance Banner */}
      <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-slate-300 block">Security Audit Notice</span>
            <p className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">
              All notifications and audit log operations are strictly archived locally in the <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded font-mono">myvirtual-tax-crm</code> environment in compliance with IRS Pub 1075 standards.
            </p>
          </div>
        </div>
        <a 
          href="https://rjbusinesssolutions.org" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-amber-500 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          Verification Gateway
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
