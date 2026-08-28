import { useState } from 'react';
import { useAppStore } from '../store';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Video, Phone,
  List, Link as LinkIcon, Edit, Plus, Trash2, Check, AlertCircle, Copy, Info
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

interface AppointmentType {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'call' | 'webinar' | 'consultation';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  description?: string;
  meetingLink?: string;
}

interface BookingLink {
  id: string;
  name: string;
  duration: number;
  type: 'video' | 'phone';
  active: boolean;
  slug: string;
  clicks: number;
  bookings: number;
}

const sampleAppointments: AppointmentType[] = [
  { id: '1', title: 'Tax Consultation - Mike Brown', startTime: new Date(), endTime: new Date(), type: 'consultation', status: 'confirmed', description: 'Initial corporate S-Corp planning consultation' },
  { id: '2', title: 'Follow-up Call - Lisa Chen', startTime: new Date(), endTime: new Date(), type: 'call', status: 'scheduled', description: 'Checking on W-2 retrieval status' },
  { id: '3', title: 'Tax Review - ABC Corp', startTime: new Date(new Date().setDate(new Date().getDate() + 1)), endTime: new Date(), type: 'meeting', status: 'confirmed', description: 'Year 2025 dual filing review' },
  { id: '4', title: 'Webinar: Tax Planning 2026', startTime: new Date(new Date().setDate(new Date().getDate() + 2)), endTime: new Date(), type: 'webinar', status: 'scheduled', description: 'White label webinar presentation for RJ Partners' },
];

export default function CalendarPage() {
  const { appointments, addAppointment, updateAppointment } = useAppStore();
  const allAppointments = (appointments.length > 0 ? appointments : sampleAppointments) as AppointmentType[];

  const [activeTab, setActiveTab] = useState<'scheduler' | 'list' | 'links' | 'editor'>('scheduler');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  // List Filter
  const [listStatusFilter, setListStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Booking links data
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([
    { id: 'lnk-1', name: '15-Min Tax Organizer Intake', duration: 15, type: 'phone', active: true, slug: 'organizer-intake-15', clicks: 124, bookings: 42 },
    { id: 'lnk-2', name: '45-Min Year-End 1040 Strategy Review', duration: 45, type: 'video', active: true, slug: 'tax-strategy-review', clicks: 89, bookings: 19 },
    { id: 'lnk-3', name: '60-Min Corporate S-Corp Tax Setup', duration: 60, type: 'video', active: false, slug: 'corporate-setup-consulting', clicks: 42, bookings: 5 },
  ]);

  // Link Editor form state
  const [editorData, setEditorData] = useState({
    name: '30-Min General Tax Sync',
    duration: 30,
    type: 'video' as 'video' | 'phone',
    availableHoursStart: '09:00',
    availableHoursEnd: '17:00',
    requireOrganizer: true,
    hasRentalProperties: false
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayAppointments = (date: Date) => {
    return allAppointments.filter((apt) => isSameDay(new Date(apt.startTime), date));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
      case 'video': return <Video className="h-3.5 w-3.5" />;
      case 'call':
      case 'phone': return <Phone className="h-3.5 w-3.5" />;
      default: return <CalendarIcon className="h-3.5 w-3.5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
      case 'meeting': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'call': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'webinar': return 'bg-green-500/10 text-green-400 border border-green-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const handleCancelAppointment = (id: string) => {
    // If inside useAppStore list
    updateAppointment(id, { status: 'cancelled' });
    // Also update local mock for sample if needed
    const found = allAppointments.find(a => a.id === id);
    if (found) found.status = 'cancelled';
  };

  const handleCopyLink = (slug: string, id: string) => {
    navigator.clipboard.writeText(`https://rjbusinesssolutions.org/book/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSaveBookingLink = (e: React.FormEvent) => {
    e.preventDefault();
    const newLnk: BookingLink = {
      id: `lnk-${Date.now()}`,
      name: editorData.name,
      duration: editorData.duration,
      type: editorData.type,
      active: true,
      slug: editorData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      clicks: 0,
      bookings: 0
    };
    setBookingLinks([...bookingLinks, newLnk]);
    setActiveTab('links');
  };

  return (
    <div className="space-y-6 text-white bg-slate-900 min-h-screen p-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Calendar & Bookings Core
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Map out tax consultation bookings, create scheduling calendars, manage appointment statuses, and configure intake questionnaires.
          </p>
        </div>
        <button 
          onClick={() => {
            setEditorData({
              name: '30-Min General Tax Sync',
              duration: 30,
              type: 'video',
              availableHoursStart: '09:00',
              availableHoursEnd: '17:00',
              requireOrganizer: true,
              hasRentalProperties: false
            });
            setActiveTab('editor');
          }}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Create Booking Link
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-0.5">
        {[
          { id: 'scheduler', label: 'Scheduler Grid', icon: CalendarIcon },
          { id: 'list', label: 'Appointments List', icon: List },
          { id: 'links', label: 'Booking Links', icon: LinkIcon },
          { id: 'editor', label: 'Booking Link Creator', icon: Edit },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-950 border-slate-800 text-cyan-400 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/20'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Scheduler Tab Panel */}
      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid Canvas */}
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-850 rounded-3xl p-6 shadow-xl">
            {/* Month Nav Row */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest font-mono">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                  className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setSelectedDate(new Date());
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-850 text-slate-300"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                  className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest py-1.5 font-mono">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day) => {
                const dayAppointments = getDayAppointments(day);
                const hasApts = dayAppointments.length > 0;
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[85px] p-2 bg-slate-950/20 border border-slate-900 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                      !isSameMonth(day, currentMonth) ? 'opacity-30' : 'hover:bg-slate-900/40'
                    } ${isToday(day) ? 'bg-cyan-500/5 border-cyan-500/20 ring-1 ring-cyan-500/10' : ''} ${
                      selectedDate && isSameDay(day, selectedDate) ? 'border-cyan-400 bg-slate-900/50' : ''
                    }`}
                  >
                    <div className={`text-[11px] font-extrabold font-mono ${isToday(day) ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate font-mono text-center leading-normal border ${
                            apt.status === 'cancelled' 
                              ? 'line-through opacity-40 bg-slate-900 border-slate-800 text-slate-500' 
                              : getTypeColor(apt.type)
                          }`}
                        >
                          {apt.title.split('-')[1]?.trim() || apt.title}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[8px] text-center font-bold text-cyan-500/70 font-mono">+{dayAppointments.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Detail Card */}
          <div className="space-y-6">
            {/* Selected day events */}
            <div className="p-5 bg-slate-950/60 border border-slate-850 rounded-3xl shadow-xl">
              <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest font-mono mb-4 pb-2.5 border-b border-slate-900">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {selectedDate && getDayAppointments(selectedDate).length > 0 ? (
                  getDayAppointments(selectedDate).map((apt) => (
                    <div key={apt.id} className="p-3 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col gap-2 relative">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase font-mono ${getTypeColor(apt.type)}`}>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(apt.type)}
                            {apt.type}
                          </span>
                        </span>
                        <span className={`text-[9px] font-bold uppercase font-mono ${
                          apt.status === 'confirmed' ? 'text-green-400' :
                          apt.status === 'cancelled' ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      
                      <h4 className={`text-xs font-bold text-slate-100 ${apt.status === 'cancelled' ? 'line-through text-slate-500' : ''}`}>
                        {apt.title}
                      </h4>
                      {apt.description && (
                        <p className="text-[10px] text-slate-500 leading-relaxed pr-6">{apt.description}</p>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-950 pt-2 mt-1 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 font-bold">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          {format(new Date(apt.startTime), 'h:mm a')}
                        </span>
                        {apt.status !== 'cancelled' && (
                          <button 
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="text-[9px] font-bold text-rose-400 hover:underline"
                          >
                            Cancel Slot
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-6 text-[11px] font-mono uppercase font-bold tracking-wider">No active bookings</p>
                )}
              </div>
            </div>

            {/* General Sync Metrics */}
            <div className="p-5 bg-slate-950/60 border border-slate-850 rounded-3xl shadow-xl space-y-3 text-xs leading-normal">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Google Calendar Sync</span>
              <div className="p-3 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="font-semibold text-slate-300">Sync Pipeline Connected</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                  Enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List Tab Panel */}
      {activeTab === 'list' && (
        <div className="bg-slate-950/60 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-850 bg-slate-950/40 flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Bookings Log</span>
            <select
              value={listStatusFilter}
              onChange={e => setListStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
            >
              <option value="all">All Booking Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Title / Client</th>
                  <th className="px-6 py-4">Booking Time</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Filing Status</th>
                  <th className="px-6 py-4 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50 text-xs">
                {allAppointments
                  .filter(apt => listStatusFilter === 'all' || apt.status === listStatusFilter)
                  .map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="font-semibold text-slate-100">{apt.title}</div>
                        {apt.description && <div className="text-[10px] text-slate-500 mt-0.5">{apt.description}</div>}
                      </td>
                      <td className="px-6 py-4.5 font-mono text-slate-300 font-bold">
                        {format(new Date(apt.startTime), 'MMM d, yyyy • h:mm a')}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded font-mono ${getTypeColor(apt.type)}`}>
                          {apt.type}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`text-[10px] font-bold uppercase font-mono ${
                          apt.status === 'confirmed' ? 'text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded' :
                          apt.status === 'cancelled' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded' : 
                          'text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        {apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-[10px] font-semibold text-rose-400 rounded-lg hover:border-rose-500/30 transition-all"
                          >
                            Cancel Appointment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Links Manager Tab Panel */}
      {activeTab === 'links' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookingLinks.map((lnk) => (
            <div 
              key={lnk.id} 
              className={`p-5 border rounded-3xl flex flex-col justify-between gap-5 transition-all bg-slate-950/60 ${
                lnk.active 
                  ? 'border-slate-850 hover:border-slate-700 shadow-lg' 
                  : 'border-slate-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase font-mono ${
                    lnk.type === 'video' 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    <span className="flex items-center gap-1">
                      {getTypeIcon(lnk.type)}
                      {lnk.duration} mins • {lnk.type}
                    </span>
                  </span>

                  <label className="relative inline-flex items-center cursor-pointer scale-90" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={lnk.active} 
                      onChange={() => setBookingLinks(bookingLinks.map(b => b.id === lnk.id ? { ...b, active: !b.active } : b))}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-black"></div>
                  </label>
                </div>

                <h3 className="font-bold text-slate-100 text-sm">{lnk.name}</h3>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">/book/{lnk.slug}</span>

                <div className="grid grid-cols-2 gap-3 mt-4 border-t border-slate-900 pt-4 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Clicks</span>
                    <strong className="text-sm font-bold font-mono text-slate-200 mt-0.5 block">{lnk.clicks}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Bookings</span>
                    <strong className="text-sm font-bold font-mono text-cyan-400 mt-0.5 block">{lnk.bookings}</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyLink(lnk.slug, lnk.id)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5"
                >
                  {copiedId === lnk.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditorData({
                      name: lnk.name,
                      duration: lnk.duration,
                      type: lnk.type,
                      availableHoursStart: '09:00',
                      availableHoursEnd: '17:00',
                      requireOrganizer: true,
                      hasRentalProperties: false
                    });
                    setActiveTab('editor');
                  }}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-750 text-slate-400 hover:text-white"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Link Editor Tab Panel */}
      {activeTab === 'editor' && (
        <div className="bg-slate-950/60 border border-slate-850 rounded-3xl p-6 max-w-2xl mx-auto shadow-xl text-xs">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 mb-6">
            <Edit className="h-4 w-4 text-cyan-400" />
            Booking Link Configurator
          </h3>

          <form onSubmit={handleSaveBookingLink} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Appointment Event Name</label>
                <input
                  type="text"
                  value={editorData.name}
                  onChange={e => setEditorData({ ...editorData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-white focus:outline-none"
                  placeholder="30-Min Corporate Tax Review"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Duration Slot (Minutes)</label>
                <select
                  value={editorData.duration}
                  onChange={e => setEditorData({ ...editorData, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-300 focus:outline-none"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Location / Channel</label>
                <select
                  value={editorData.type}
                  onChange={e => setEditorData({ ...editorData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-300 focus:outline-none"
                >
                  <option value="video">Google Meet (Video)</option>
                  <option value="phone">Direct Phone Call</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Availability Hours Start</label>
                <input
                  type="time"
                  value={editorData.availableHoursStart}
                  onChange={e => setEditorData({ ...editorData, availableHoursStart: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Availability Hours End</label>
                <input
                  type="time"
                  value={editorData.availableHoursEnd}
                  onChange={e => setEditorData({ ...editorData, availableHoursEnd: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Custom questionnaire settings */}
            <div className="p-4 bg-slate-900/60 border border-slate-900 rounded-2xl space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Intake Form Fields Integration</span>
              
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-slate-200 font-bold block">Require Organizer Completion</strong>
                  <span className="text-[10px] text-slate-500">Form blocks bookings if 2026 tax organizer is unsubmitted.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editorData.requireOrganizer} 
                    onChange={e => setEditorData({ ...editorData, requireOrganizer: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-slate-950 pt-3">
                <div>
                  <strong className="text-slate-200 font-bold block">Ask Rental Property Question</strong>
                  <span className="text-[10px] text-slate-500">Injects custom Schedule E rental questionnaire check in intake.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editorData.hasRentalProperties} 
                    onChange={e => setEditorData({ ...editorData, hasRentalProperties: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
              <button
                type="button"
                onClick={() => setActiveTab('links')}
                className="px-4 py-2 border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-xl font-bold"
              >
                Compile Booking Link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
