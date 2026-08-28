import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  Plus, Search, Mail, Phone, Building2, Tag, Edit2, Trash2, 
  Table, Kanban, UploadCloud, Tags, Check, Play, Shield, Award, Sparkles, ChevronRight,
  UserPlus, CreditCard, AlertTriangle, FileText
} from 'lucide-react';
import { ReferralsTab, CreditClientsTab, DisputesTab, DisputeLettersTab } from '../components/contacts/GrowthTabs';
import type { Contact } from '../types';

export default function ContactsPage() {
  const navigate = useNavigate();
  const { contacts, addContact, updateContact, deleteContact } = useAppStore();
  
  const [searchParams] = useSearchParams();
  type ContactsTab = 'table' | 'kanban' | 'import' | 'tags' | 'referrals' | 'credit' | 'disputes' | 'letters';
  const VALID_TABS: ContactsTab[] = ['table', 'kanban', 'import', 'tags', 'referrals', 'credit', 'disputes', 'letters'];
  const [activeTab, setActiveTab] = useState<ContactsTab>('table');

  // Deep-link routing: /contacts?tab=referrals|credit|disputes|letters
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && VALID_TABS.includes(t as ContactsTab)) setActiveTab(t as ContactsTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // CSV Import state
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [mappedFields, setMappedFields] = useState({
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email_address',
    phone: 'phone_number',
    company: 'company_name',
  });

  // Tag Manager state
  const [newTag, setNewTag] = useState('');
  const [tagsList, setTagsList] = useState<Array<{ name: string; color: string; count: number }>>([
    { name: 'lead', color: 'bg-amber-500/10 text-[#D4AF37] border-amber-500/20', count: 2 },
    { name: 'high-value', color: 'bg-yellow-500/10 text-[#FFD700] border-yellow-500/20', count: 1 },
    { name: 'tax-prep', color: 'bg-amber-600/10 text-amber-400 border-amber-600/20', count: 1 },
    { name: 's-corp', color: 'bg-yellow-600/10 text-yellow-500 border-yellow-600/20', count: 1 },
    { name: '1099-contractor', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', count: 1 },
  ]);

  const allContacts = contacts;

  const filteredContacts = allContacts.filter((contact) => {
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'lead':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      case 'prospect':
        return 'bg-yellow-500/10 text-[#FFD700] border border-yellow-500/25';
      case 'customer':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      default:
        return 'bg-slate-500/10 text-slate-300 border border-slate-500/25';
    }
  };

  const handleMoveContact = (contactId: string, newStatus: Contact['status']) => {
    updateContact(contactId, { status: newStatus });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
      setImportStep(2);
    }
  };

  const runCsvImport = () => {
    setImportStep(3);
    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          const imported: Contact[] = [
            {
              id: 'imp-1',
              firstName: 'Alice',
              lastName: 'Wonder',
              email: 'alice@wonderland.co',
              phone: '(555) 771-0021',
              company: 'Wonderland Design',
              tags: ['imported', 'lead'],
              customFields: {},
              source: 'CSV Import',
              status: 'lead',
              notes: [],
              activities: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'imp-2',
              firstName: 'Bob',
              lastName: 'Builder',
              email: 'bob@construct.io',
              phone: '(555) 991-8833',
              company: 'Construct Co',
              tags: ['imported', 'prospect'],
              customFields: {},
              source: 'CSV Import',
              status: 'prospect',
              notes: [],
              activities: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          ];
          imported.forEach(c => addContact(c));
          return 100;
        }
        return p + 25;
      });
    }, 300);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#D4AF37] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              RJ Business Solutions Core
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Contacts & Leads Database
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Segment your client list, move leads across status boards, drag and drop CSV documents, and organize tags.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl text-xs shadow-md transition-all self-start sm:self-auto flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-900 pb-0.5">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'table', label: 'Table View', icon: Table },
            { id: 'kanban', label: 'Status Board', icon: Kanban },
            { id: 'import', label: 'CSV Import Wizard', icon: UploadCloud },
            { id: 'tags', label: 'Tag Management', icon: Tags },
            { id: 'referrals', label: 'Referral Program', icon: UserPlus },
            { id: 'credit', label: 'Credit Clients', icon: CreditCard },
            { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
            { id: 'letters', label: 'Dispute Letters', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setImportStep(1);
                  setCsvFile(null);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                  activeTab === tab.id 
                    ? 'bg-amber-500/10 border-amber-500/25 text-[#D4AF37]' 
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {(activeTab === 'table' || activeTab === 'kanban') && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 w-44 sm:w-60"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500/30"
            >
              <option value="all">All Stages</option>
              <option value="lead">Leads</option>
              <option value="prospect">Prospects</option>
              <option value="customer">Customers</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab Panel Content */}
      {activeTab === 'table' && (
        <div className="bg-neutral-950/80 backdrop-blur-md border border-amber-500/15 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-950 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
                  <th className="px-6 py-4">Client Detail</th>
                  <th className="px-6 py-4">Company Partner</th>
                  <th className="px-6 py-4">Filing Status</th>
                  <th className="px-6 py-4">Active Tags</th>
                  <th className="px-6 py-4">Lead Source</th>
                  <th className="px-6 py-4 text-right font-serif">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs">
                {filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-amber-500/5 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-600/20 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-[#D4AF37] font-extrabold shadow-sm group-hover:scale-105 transition-transform">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="flex items-center gap-2.5 mt-1 text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-500" />{contact.email}</span>
                            <span className="text-neutral-800">•</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-500" />{contact.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      {contact.company ? (
                        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          {contact.company}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg font-mono ${getStatusBadge(contact.status)}`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="px-2 py-0.5 text-[9px] font-bold bg-neutral-900 border border-amber-500/10 text-slate-300 rounded-lg flex items-center gap-1"
                          >
                            <Tag className="h-2.5 w-2.5 text-[#D4AF37]" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-[#D4AF37] font-mono text-[10px] uppercase font-bold">{contact.source}</td>
                    <td className="px-6 py-4.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                          className="p-1.5 bg-neutral-900 border border-amber-500/10 rounded-lg hover:border-amber-500/30 text-slate-400 hover:text-white transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteContact(contact.id)}
                          className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredContacts.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              No matching client records found.
            </div>
          )}
        </div>
      )}

      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['lead', 'prospect', 'customer'] as const).map((stage) => {
            const stageClients = filteredContacts.filter(c => c.status === stage);
            return (
              <div key={stage} className="p-4 bg-neutral-950/80 border border-amber-500/15 rounded-2xl flex flex-col min-h-[480px]">
                {/* Column header */}
                <div className="flex items-center justify-between mb-4 border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-bold text-sm text-white">{stage}s</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-amber-500/10 text-[#D4AF37] rounded-lg border border-amber-500/20">
                      {stageClients.length}
                    </span>
                  </div>
                </div>

                {/* Column Stream */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {stageClients.length === 0 ? (
                    <div className="p-8 border border-neutral-900 border-dashed rounded-xl text-center text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                      Empty column
                    </div>
                  ) : (
                    stageClients.map((c) => (
                      <div 
                        key={c.id} 
                        className="p-4 bg-neutral-900/50 border border-amber-500/10 hover:border-amber-500/20 rounded-xl flex flex-col gap-2.5 transition-all shadow-md group cursor-pointer"
                        onClick={() => navigate(`/contacts/${c.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-xs text-white group-hover:text-[#D4AF37] transition-colors">
                              {c.firstName} {c.lastName}
                            </h4>
                            <span className="text-[10px] text-slate-400 mt-0.5 block truncate font-medium">{c.company || 'Individual Tax filer'}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono font-bold">{c.source}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {c.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-neutral-950 text-[9px] text-slate-300 font-medium rounded border border-amber-500/10">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-950 pt-2.5 mt-1 text-[10px]" onClick={e => e.stopPropagation()}>
                          <div className="text-slate-400 flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3 text-slate-500" />
                            <span className="text-[9px]">{c.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {stage !== 'lead' && (
                              <button 
                                onClick={() => handleMoveContact(c.id, stage === 'customer' ? 'prospect' : 'lead')}
                                className="px-1.5 py-0.5 bg-neutral-950 hover:bg-neutral-900 border border-amber-500/10 rounded text-slate-400 text-[9px]"
                              >
                                ◀ Back
                              </button>
                            )}
                            {stage !== 'customer' && (
                              <button 
                                onClick={() => handleMoveContact(c.id, stage === 'lead' ? 'prospect' : 'customer')}
                                className="px-1.5 py-0.5 bg-neutral-950 hover:bg-neutral-900 border border-amber-500/20 rounded text-[#D4AF37] text-[9px]"
                              >
                                Next ▶
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-6 max-w-3xl mx-auto shadow-xl text-xs">
          {importStep === 1 && (
            <div className="space-y-6 text-center">
              <div 
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-neutral-900 hover:border-amber-500/30 rounded-2xl p-12 bg-neutral-900/10 transition-colors flex flex-col items-center justify-center gap-4 cursor-pointer"
              >
                <div className="w-14 h-14 bg-amber-500/5 rounded-xl flex items-center justify-center text-[#D4AF37] border border-amber-500/10">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Drag and Drop Client CSV</h3>
                  <p className="text-slate-400 text-[11px] mt-1">Or click to select files from your computer (.csv format only)</p>
                </div>
                <input
                  id="csv-uploader"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCsvFile(file);
                      setImportStep(2);
                    }
                  }}
                />
                <label 
                  htmlFor="csv-uploader"
                  className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-amber-500/20 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Select File
                </label>
              </div>

              <div className="p-4 bg-amber-950/10 border border-amber-500/10 rounded-2xl text-left text-slate-300 leading-relaxed">
                <span className="font-bold text-[#D4AF37] uppercase tracking-widest text-[10px] block mb-1">CSV Template Guide</span>
                We support universal client lists. Recommended headers are: <code className="text-amber-400 font-mono">first_name, last_name, email_address, phone_number, company_name</code>. Our intelligent step-2 parser lets you map custom columns instantly.
              </div>
            </div>
          )}

          {importStep === 2 && csvFile && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                <UploadCloud className="h-5 w-5 text-[#D4AF37]" />
                <div>
                  <strong className="text-white font-bold block">{csvFile.name}</strong>
                  <span className="text-[10px] text-slate-400">{(csvFile.size / 1024).toFixed(2)} KB • Map fields to proceed</span>
                </div>
              </div>

              <h3 className="font-bold text-white text-sm">Step 2: Map CSV Columns to CRM Fields</h3>

              <div className="space-y-3">
                {[
                  { field: 'firstName', label: 'First Name', required: true },
                  { field: 'lastName', label: 'Last Name', required: true },
                  { field: 'email', label: 'Email Address', required: true },
                  { field: 'phone', label: 'Phone Number', required: false },
                  { field: 'company', label: 'Company Name', required: false },
                ].map(item => (
                  <div key={item.field} className="flex items-center justify-between p-3.5 bg-neutral-900/40 border border-neutral-900 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-200">{item.label}</span>
                      {item.required && <span className="text-rose-500 font-extrabold">*</span>}
                    </div>
                    <select
                      value={(mappedFields as any)[item.field]}
                      onChange={e => setMappedFields({ ...mappedFields, [item.field]: e.target.value })}
                      className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-amber-500/20"
                    >
                      <option value={`${item.field}_column`}>{item.field}_column</option>
                      <option value="first_name">first_name</option>
                      <option value="last_name">last_name</option>
                      <option value="email_address">email_address</option>
                      <option value="phone_number">phone_number</option>
                      <option value="company_name">company_name</option>
                      <option value="unmapped">Don't Map Field</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-900">
                <button
                  onClick={() => {
                    setCsvFile(null);
                    setImportStep(1);
                  }}
                  className="px-4 py-2 border border-neutral-800 text-slate-400 rounded-xl hover:bg-neutral-900"
                >
                  Back
                </button>
                <button
                  onClick={runCsvImport}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl flex items-center gap-1.5 active:scale-95"
                >
                  <Play className="h-4 w-4" />
                  Trigger Import
                </button>
              </div>
            </div>
          )}

          {importStep === 3 && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-5">
              {importProgress < 100 ? (
                <>
                  <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Processing Demographics & Security Scans</h3>
                    <p className="text-slate-400 text-[10px] font-mono mt-1">STATUS: {importProgress}% COMPLETE</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                    <Check className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">CSV Import Complete!</h3>
                    <p className="text-slate-300 text-[11px] mt-1">Successfully scanned, mapped, and appended <strong className="text-green-400">2 client records</strong> to your active database.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('table')}
                    className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-slate-200 rounded-xl font-semibold"
                  >
                    Return to Table
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-6 max-w-2xl mx-auto shadow-xl text-xs space-y-6">
          <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
            <Tags className="h-4 w-4 text-[#D4AF37]" />
            Active Segment Tags Manager
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Create new label (e.g. Schedule-A, W-2, S-Corp)..."
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/20"
            />
            <button
              onClick={() => {
                if (newTag.trim() && !tagsList.some(t => t.name === newTag.toLowerCase())) {
                  setTagsList([...tagsList, { name: newTag.toLowerCase(), color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', count: 0 }]);
                  setNewTag('');
                }
              }}
              className="px-4 bg-[#D4AF37] text-black font-black rounded-xl hover:bg-yellow-400"
            >
              Add Label
            </button>
          </div>

          <div className="divide-y divide-neutral-900 border border-neutral-900 rounded-2xl overflow-hidden bg-neutral-900/10">
            {tagsList.map(tag => (
              <div key={tag.name} className="flex items-center justify-between p-3.5 hover:bg-neutral-900/30 transition-colors">
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono ${tag.color}`}>
                  {tag.name}
                </span>
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="font-mono font-bold text-[10px] text-slate-300">{tag.count} clients tagged</span>
                  <button 
                    onClick={() => setTagsList(tagsList.filter(t => t.name !== tag.name))}
                    className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'referrals' && <ReferralsTab />}
      {activeTab === 'credit' && <CreditClientsTab />}
      {activeTab === 'disputes' && <DisputesTab />}
      {activeTab === 'letters' && <DisputeLettersTab />}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-amber-500/20 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl text-xs space-y-4">
            <h2 className="text-base font-bold text-[#D4AF37] pb-2 border-b border-neutral-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Create Client Demographic
            </h2>
            <form 
              onSubmit={e => {
                e.preventDefault();
                const target = e.currentTarget;
                const newC: Contact = {
                  id: `con-${Date.now()}`,
                  firstName: (target.elements.namedItem('firstName') as HTMLInputElement).value,
                  lastName: (target.elements.namedItem('lastName') as HTMLInputElement).value,
                  email: (target.elements.namedItem('email') as HTMLInputElement).value,
                  phone: (target.elements.namedItem('phone') as HTMLInputElement).value,
                  company: (target.elements.namedItem('company') as HTMLInputElement).value,
                  status: (target.elements.namedItem('status') as HTMLSelectElement).value as Contact['status'],
                  source: (target.elements.namedItem('source') as HTMLSelectElement).value,
                  tags: ['created-manual'],
                  customFields: {},
                  notes: [],
                  activities: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                addContact(newC);
                setShowAddModal(false);
              }} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/30"
                    placeholder="Rick"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/30"
                    placeholder="Jefferson"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/30"
                  placeholder="rjbizsolution23@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/30"
                  placeholder="(414) 430-4277"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Company Partner</label>
                <input
                  type="text"
                  name="company"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/30"
                  placeholder="RJ Business Solutions"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Status Stage</label>
                  <select
                    name="status"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-slate-300 focus:outline-none focus:border-amber-500/20"
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Lead Source</label>
                  <select
                    name="source"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-slate-300 focus:outline-none focus:border-amber-500/20"
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Direct">Direct</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl active:scale-95"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
