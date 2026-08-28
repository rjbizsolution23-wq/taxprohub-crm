import { useState, useMemo } from 'react';
import {
  FileText, Plus, Printer, Send, DollarSign, Clock, CheckCircle2,
  CreditCard, X, Search, Trash2, ShieldCheck, Landmark, Copy, Check
} from 'lucide-react';
import { useAppStore } from '../store';

/* ============================================================
   ENTERPRISE INVOICING — letterhead-quality billing documents
   Print-ready via window.print(); Stripe pay-link wired to the
   Cloudflare worker (/api/stripe/checkout) when keys are set.
   ============================================================ */

interface InvoiceLine {
  id: string;
  description: string;
  detail?: string;
  qty: number;
  rate: number;
}

interface Invoice {
  id: string;
  number: string;
  client: { name: string; company?: string; email: string; address: string };
  issued: string;
  due: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'refund_transfer';
  lines: InvoiceLine[];
  discount: number;        // dollars
  notes: string;
  terms: string;
}

const SERVICE_CATALOG: Array<{ description: string; detail: string; rate: number }> = [
  { description: 'Form 1040 — Individual Income Tax Return', detail: 'Federal preparation & e-file, TY2025', rate: 285 },
  { description: 'Form 1040 + Schedule C — Self-Employed Return', detail: 'Business income, expense optimization, SE tax computation', rate: 425 },
  { description: 'Form 1120-S — S-Corporation Return', detail: 'Corporate return incl. K-1 preparation per shareholder', rate: 895 },
  { description: 'Form 1065 — Partnership Return', detail: 'Partnership return incl. K-1 preparation per partner', rate: 795 },
  { description: 'State Income Tax Return', detail: 'Per-state preparation & e-file', rate: 95 },
  { description: 'Amended Return (1040-X)', detail: 'Prior-year correction with supporting schedules', rate: 350 },
  { description: 'IRS Notice Response & Representation', detail: 'Notice analysis, response drafting, correspondence handling', rate: 275 },
  { description: 'Quarterly Estimated Tax Planning', detail: 'Safe-harbor computation & voucher schedule (4 quarters)', rate: 225 },
  { description: 'Tax Planning Session — Advisory', detail: '60-minute strategy consultation with written action plan', rate: 350 },
  { description: 'Bookkeeping — Monthly', detail: 'Transaction categorization, reconciliation, monthly statements', rate: 295 },
  { description: 'Audit Shield Protection — Annual', detail: 'Full audit representation coverage for the covered return', rate: 129 },
  { description: 'Credit Repair — Monthly Program', detail: 'Tri-bureau disputes, letter dispatch, score monitoring', rate: 149 },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv1', number: 'INV-2026-0847',
    client: { name: 'John Smith', company: 'Smith Consulting', email: 'john.smith@example.com', address: '2214 W Meadowlark Ln, Albuquerque, NM 87104' },
    issued: '2026-08-18', due: '2026-09-01', status: 'sent',
    lines: [
      { id: 'l1', description: 'Form 1040 + Schedule C — Self-Employed Return', detail: 'Business income, expense optimization, SE tax computation', qty: 1, rate: 425 },
      { id: 'l2', description: 'State Income Tax Return', detail: 'New Mexico PIT-1 preparation & e-file', qty: 1, rate: 95 },
      { id: 'l3', description: 'Quarterly Estimated Tax Planning', detail: 'Safe-harbor computation & voucher schedule (4 quarters)', qty: 1, rate: 225 },
    ],
    discount: 50,
    notes: 'Thank you for trusting RJ Business Solutions with your tax practice. Your e-file confirmation and copies of all schedules are available in your client portal.',
    terms: 'Payment due within 14 days. Secure card payment via the Stripe link below, ACH on request. A refund-transfer option (fees deducted from refund) is available with signed §7216 consent and bank-product disclosures.',
  },
  {
    id: 'inv2', number: 'INV-2026-0846',
    client: { name: 'Emily Davis', company: 'Davis Consulting', email: 'emily.davis@consulting.com', address: '918 Coal Ave SE, Albuquerque, NM 87106' },
    issued: '2026-08-15', due: '2026-08-29', status: 'paid',
    lines: [
      { id: 'l1', description: 'Form 1120-S — S-Corporation Return', detail: 'Corporate return incl. K-1 preparation (2 shareholders)', qty: 1, rate: 895 },
      { id: 'l2', description: 'Tax Planning Session — Advisory', detail: 'Reasonable-comp analysis & accountable plan setup', qty: 1, rate: 350 },
    ],
    discount: 0,
    notes: 'Paid in full — receipt issued. K-1 packages delivered to both shareholders via the client portal.',
    terms: 'Payment due within 14 days of issue. Late balances accrue 1.5% monthly after the due date.',
  },
  {
    id: 'inv3', number: 'INV-2026-0845',
    client: { name: 'Maria Gonzalez', email: 'mgonzalez@email.com', address: '410 San Pedro Dr NE, Albuquerque, NM 87108' },
    issued: '2026-08-12', due: '2026-08-26', status: 'refund_transfer',
    lines: [
      { id: 'l1', description: 'Form 1040 — Individual Income Tax Return', detail: 'Federal preparation & e-file incl. EITC due-diligence (Form 8867)', qty: 1, rate: 285 },
      { id: 'l2', description: 'State Income Tax Return', detail: 'New Mexico PIT-1', qty: 1, rate: 95 },
    ],
    discount: 0,
    notes: 'Fees collected via refund transfer per signed consent. No out-of-pocket payment required — this invoice is informational.',
    terms: 'Refund transfer authorized under signed IRC §7216 consent and bank-product disclosure dated 2026-08-12.',
  },
  {
    id: 'inv4', number: 'INV-2026-0839',
    client: { name: 'Robert Wilson', company: 'Wilson Finance', email: 'rwilson@finance.com', address: '77 Broadway Blvd NE, Albuquerque, NM 87102' },
    issued: '2026-07-28', due: '2026-08-11', status: 'overdue',
    lines: [
      { id: 'l1', description: 'IRS Notice Response & Representation', detail: 'CP2000 response — proposed adjustment reduced from $4,210 to $0', qty: 1, rate: 275 },
    ],
    discount: 0,
    notes: 'CP2000 fully resolved in your favor — the IRS accepted our documentation and withdrew the proposed assessment.',
    terms: 'Payment due within 14 days. This balance is 11 days past due — the dunning sequence has paused pending your reply.',
  },
];

const STATUS_META: Record<Invoice['status'], { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-slate-500/10 border-slate-500/30 text-slate-300' },
  sent: { label: 'Sent — Awaiting Payment', cls: 'bg-sky-500/10 border-sky-500/30 text-sky-300' },
  paid: { label: 'Paid ✓', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  overdue: { label: 'Overdue', cls: 'bg-red-500/10 border-red-500/30 text-red-400' },
  refund_transfer: { label: 'Refund Transfer', cls: 'bg-purple-500/10 border-purple-500/30 text-purple-300' },
};

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function invTotal(inv: Invoice) {
  const sub = inv.lines.reduce((a, l) => a + l.qty * l.rate, 0);
  return { sub, total: Math.max(0, sub - inv.discount) };
}

export default function BillingPage() {
  const { addNotification, currentSubAccount } = useAppStore();
  const [invoices, setInvoices] = useState<Invoice[]>(SEED_INVOICES);
  const [selected, setSelected] = useState<Invoice | null>(SEED_INVOICES[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // create-form state
  const [cName, setCName] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cLines, setCLines] = useState<InvoiceLine[]>([]);
  const [cDiscount, setCDiscount] = useState(0);

  const stats = useMemo(() => {
    const open = invoices.filter(i => ['sent', 'overdue'].includes(i.status));
    const paid = invoices.filter(i => i.status === 'paid');
    return {
      outstanding: open.reduce((a, i) => a + invTotal(i).total, 0),
      collected: paid.reduce((a, i) => a + invTotal(i).total, 0),
      overdue: invoices.filter(i => i.status === 'overdue').length,
      count: invoices.length,
    };
  }, [invoices]);

  const filtered = invoices.filter(i =>
    !query.trim() || `${i.number} ${i.client.name} ${i.client.company || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const addCatalogLine = (item: typeof SERVICE_CATALOG[number]) => {
    setCLines(prev => [...prev, { id: `cl-${Date.now()}-${prev.length}`, description: item.description, detail: item.detail, qty: 1, rate: item.rate }]);
  };

  const createInvoice = () => {
    if (!cName.trim() || cLines.length === 0) return;
    const nextNum = 848 + invoices.length - SEED_INVOICES.length;
    const inv: Invoice = {
      id: `inv-${Date.now()}`,
      number: `INV-2026-0${nextNum}`,
      client: { name: cName.trim(), company: cCompany.trim() || undefined, email: cEmail.trim(), address: cAddress.trim() },
      issued: new Date().toISOString().slice(0, 10),
      due: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'draft',
      lines: cLines,
      discount: cDiscount,
      notes: 'Thank you for trusting RJ Business Solutions. Copies of all schedules and your e-file confirmation are available in your client portal.',
      terms: 'Payment due within 14 days. Secure card payment via Stripe, ACH on request. Late balances accrue 1.5% monthly after the due date.',
    };
    setInvoices(prev => [inv, ...prev]);
    setSelected(inv);
    setShowCreate(false);
    setCName(''); setCCompany(''); setCEmail(''); setCAddress(''); setCLines([]); setCDiscount(0);
    addNotification({
      id: `notif-${Date.now()}`, title: 'Invoice Created',
      message: `${inv.number} drafted for ${inv.client.name} — ${money(invTotal(inv).total)}.`,
      type: 'success', read: false, createdAt: new Date(),
    });
  };

  const markSent = (inv: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'sent' as const } : i));
    setSelected(s => s && s.id === inv.id ? { ...s, status: 'sent' } : s);
    addNotification({
      id: `notif-${Date.now()}`, title: 'Invoice Sent',
      message: `${inv.number} delivered to ${inv.client.email} with a secure Stripe payment link.`,
      type: 'info', read: false, createdAt: new Date(),
    });
  };

  const markPaid = (inv: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' as const } : i));
    setSelected(s => s && s.id === inv.id ? { ...s, status: 'paid' } : s);
  };

  const copyPayLink = (inv: Invoice) => {
    navigator.clipboard?.writeText(`https://rjbizsolutions.tax/pay/${inv.number.toLowerCase()}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const printInvoice = () => window.print();

  const t = selected ? invTotal(selected) : { sub: 0, total: 0 };
  const firm = currentSubAccount?.businessName || 'RJ Business Solutions';

  return (
    <div className="space-y-6 pb-12">
      {/* print styles: only the invoice document prints */}
      <style>{`@media print { body * { visibility: hidden; } #invoice-document, #invoice-document * { visibility: visible; } #invoice-document { position: absolute; left: 0; top: 0; width: 100%; background: white !important; } }`}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-amber-300 bg-clip-text text-transparent font-serif">
            Client Invoicing
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1 uppercase tracking-wider">
            Letterhead-quality billing · Stripe payment rails · refund-transfer aware
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[
          { label: 'Outstanding', value: money(stats.outstanding), icon: Clock, color: 'text-sky-400' },
          { label: 'Collected (recent)', value: money(stats.collected), icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Overdue Invoices', value: stats.overdue, icon: FileText, color: 'text-red-400' },
          { label: 'Total Invoices', value: stats.count, icon: CreditCard, color: 'text-[#D4AF37]' },
        ].map(k => (
          <div key={k.label} className="bg-neutral-950/80 border border-amber-500/15 rounded-2xl p-5 shadow-lg">
            <k.icon className={`h-5 w-5 ${k.color} mb-2`} />
            <div className="text-2xl font-black text-white">{k.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Invoice list */}
        <div className="space-y-3 print:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search invoices..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30" />
          </div>
          {filtered.map(inv => {
            const tt = invTotal(inv);
            return (
              <button key={inv.id} onClick={() => setSelected(inv)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${selected?.id === inv.id ? 'bg-amber-500/10 border-amber-500/35' : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white font-mono">{inv.number}</span>
                  <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black ${STATUS_META[inv.status].cls}`}>{STATUS_META[inv.status].label}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">{inv.client.name}{inv.client.company ? ` · ${inv.client.company}` : ''}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-black text-[#D4AF37]">{money(tt.total)}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Due {inv.due}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Invoice document */}
        <div className="xl:col-span-2 space-y-4">
          {selected && (
            <>
              {/* Action bar */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button onClick={printInvoice} className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[11px] font-black text-slate-300 hover:text-white flex items-center gap-1.5 transition-all">
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </button>
                <button onClick={() => copyPayLink(selected)} className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[11px] font-black text-slate-300 hover:text-white flex items-center gap-1.5 transition-all">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy Pay Link'}
                </button>
                {selected.status === 'draft' && (
                  <button onClick={() => markSent(selected)} className="px-4 py-2 bg-gradient-to-r from-sky-600 to-cyan-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 active:scale-95 transition-all">
                    <Send className="h-3.5 w-3.5" /> Send to Client
                  </button>
                )}
                {['sent', 'overdue'].includes(selected.status) && (
                  <button onClick={() => markPaid(selected)} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 active:scale-95 transition-all">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                  </button>
                )}
                <span className="text-[10px] text-slate-500 font-mono ml-auto">Card payments settle via /api/stripe/checkout</span>
              </div>

              {/* THE DOCUMENT — letterhead quality */}
              <div id="invoice-document" className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                {/* Letterhead band */}
                <div className="bg-gradient-to-r from-[#0a0a0a] via-[#141414] to-[#0a0a0a] px-10 py-8 flex items-start justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-black font-black text-lg font-serif">VT</div>
                      <div>
                        <div className="text-xl font-black text-white font-serif tracking-tight">{firm}</div>
                        <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.2em]">Tax Pro Hub University · Enterprise Tax Practice</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                      1342 NM 333, Tijeras, New Mexico 87059<br />
                      support@rjbusinesssolutions.org · (877) 561-8001 · EIN on file · PTIN/EFIN verified
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[28px] font-black text-white font-serif leading-none">INVOICE</div>
                    <div className="text-sm font-black text-[#D4AF37] font-mono mt-1">{selected.number}</div>
                    <span className={`inline-block mt-3 px-3 py-1 rounded-lg border text-[10px] font-black ${STATUS_META[selected.status].cls}`}>
                      {STATUS_META[selected.status].label}
                    </span>
                  </div>
                </div>

                {/* Gold rule */}
                <div className="h-1 bg-gradient-to-r from-amber-600 via-[#D4AF37] to-yellow-400" />

                {/* Meta grid */}
                <div className="px-10 py-7 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-neutral-200">
                  <div>
                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.18em]">Billed To</div>
                    <div className="text-sm font-black text-neutral-900 mt-1.5">{selected.client.name}</div>
                    {selected.client.company && <div className="text-xs text-neutral-600">{selected.client.company}</div>}
                    <div className="text-xs text-neutral-500 mt-1 leading-relaxed">{selected.client.address}</div>
                    <div className="text-xs text-neutral-500">{selected.client.email}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.18em]">Invoice Details</div>
                    <div className="text-xs text-neutral-700 mt-1.5 space-y-1">
                      <div><span className="font-bold">Issued:</span> {selected.issued}</div>
                      <div><span className="font-bold">Due:</span> {selected.due}</div>
                      <div><span className="font-bold">Terms:</span> Net 14</div>
                      <div><span className="font-bold">Tax Year:</span> 2025</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.18em]">Amount Due</div>
                    <div className="text-3xl font-black text-neutral-900 font-serif mt-1.5">{money(t.total)}</div>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-neutral-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Secure payment · Stripe · PCI-DSS Level 1
                    </div>
                  </div>
                </div>

                {/* Line items */}
                <div className="px-10 py-6">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.18em] border-b-2 border-neutral-900">
                        <th className="text-left pb-3">Professional Service</th>
                        <th className="text-center pb-3 w-16">Qty</th>
                        <th className="text-right pb-3 w-28">Rate</th>
                        <th className="text-right pb-3 w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.lines.map(l => (
                        <tr key={l.id} className="border-b border-neutral-100">
                          <td className="py-4">
                            <div className="text-sm font-bold text-neutral-900">{l.description}</div>
                            {l.detail && <div className="text-xs text-neutral-500 mt-0.5">{l.detail}</div>}
                          </td>
                          <td className="py-4 text-center text-sm text-neutral-700 font-semibold">{l.qty}</td>
                          <td className="py-4 text-right text-sm text-neutral-700 font-semibold">{money(l.rate)}</td>
                          <td className="py-4 text-right text-sm font-black text-neutral-900">{money(l.qty * l.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end mt-6">
                    <div className="w-72 space-y-2">
                      <div className="flex justify-between text-sm text-neutral-600">
                        <span>Subtotal</span><span className="font-semibold">{money(t.sub)}</span>
                      </div>
                      {selected.discount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-700">
                          <span>Loyalty Discount</span><span className="font-semibold">−{money(selected.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-neutral-600">
                        <span>Sales Tax</span><span className="font-semibold">$0.00 <span className="text-[10px] text-neutral-400">(professional services — NM exempt)</span></span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t-2 border-neutral-900">
                        <span className="text-sm font-black text-neutral-900 uppercase tracking-wide">Total Due</span>
                        <span className="text-2xl font-black text-neutral-900 font-serif">{money(t.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment methods */}
                <div className="px-10 pb-6">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2.5">
                      <CreditCard className="h-4 w-4 text-neutral-700 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-black text-neutral-900">Pay Online (fastest)</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5 font-mono break-all">rjbizsolutions.tax/pay/{selected.number.toLowerCase()}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Landmark className="h-4 w-4 text-neutral-700 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-black text-neutral-900">ACH / Bank Transfer</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">Request routing details from your preparer</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <DollarSign className="h-4 w-4 text-neutral-700 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-black text-neutral-900">Refund Transfer</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">Fees from refund — requires signed §7216 consent</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes & terms */}
                <div className="px-10 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.18em] mb-1.5">Notes</div>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">{selected.notes}</p>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.18em] mb-1.5">Terms & Conditions</div>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">{selected.terms}</p>
                  </div>
                </div>

                {/* Footer band */}
                <div className="bg-neutral-900 px-10 py-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">© 2026 {firm} · All rights reserved · Managed by Rick Jefferson</span>
                  <span className="text-[10px] text-[#D4AF37] font-black font-mono">THANK YOU FOR YOUR BUSINESS</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-neutral-950 border border-amber-500/25 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
              <div>
                <h2 className="text-lg font-black text-white font-serif">New Client Invoice</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Pick services from the catalog — rates pre-filled, fully editable</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-neutral-900 rounded-xl text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Client full name *" className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30" />
              <input value={cCompany} onChange={e => setCCompany(e.target.value)} placeholder="Company (optional)" className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30" />
              <input value={cEmail} onChange={e => setCEmail(e.target.value)} type="email" placeholder="client@email.com" className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30" />
              <input value={cAddress} onChange={e => setCAddress(e.target.value)} placeholder="Billing address" className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30" />
            </div>

            <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-2">Service Catalog — click to add</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 max-h-48 overflow-y-auto pr-1">
              {SERVICE_CATALOG.map(item => (
                <button key={item.description} onClick={() => addCatalogLine(item)}
                  className="text-left rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 hover:border-amber-500/30 transition-all">
                  <div className="flex justify-between gap-2">
                    <span className="text-[11px] font-bold text-white leading-snug">{item.description}</span>
                    <span className="text-[11px] font-black text-[#D4AF37] shrink-0">{money(item.rate)}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">{item.detail}</div>
                </button>
              ))}
            </div>

            {cLines.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Invoice Lines ({cLines.length})</div>
                <div className="space-y-2">
                  {cLines.map(l => (
                    <div key={l.id} className="flex items-center gap-2 bg-neutral-900/60 border border-neutral-800 rounded-xl p-2.5">
                      <span className="flex-1 text-[11px] text-white font-semibold truncate">{l.description}</span>
                      <input type="number" min={1} value={l.qty}
                        onChange={e => setCLines(prev => prev.map(x => x.id === l.id ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x))}
                        className="w-14 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-white text-center" />
                      <input type="number" min={0} value={l.rate}
                        onChange={e => setCLines(prev => prev.map(x => x.id === l.id ? { ...x, rate: Math.max(0, Number(e.target.value)) } : x))}
                        className="w-24 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-white text-right" />
                      <button onClick={() => setCLines(prev => prev.filter(x => x.id !== l.id))} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">Discount ($)</span>
                    <input type="number" min={0} value={cDiscount} onChange={e => setCDiscount(Math.max(0, Number(e.target.value)))}
                      className="w-24 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-white text-right" />
                  </div>
                  <div className="text-sm font-black text-[#D4AF37]">
                    Total: {money(Math.max(0, cLines.reduce((a, l) => a + l.qty * l.rate, 0) - cDiscount))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-neutral-800">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-slate-400 font-bold text-xs hover:text-white transition-all">Cancel</button>
              <button onClick={createInvoice} disabled={!cName.trim() || cLines.length === 0}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl text-xs active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
