/**
 * 🔄 MIGRATION CENTER — Universal Data Import
 * Kill the switching cost: import clients, returns metadata, and pipelines
 * from every major competitor (Drake, TaxSlayer Pro, TaxWise, CrossLink,
 * ProSeries, Lacerte, UltraTax, ATX, TaxDome, Canopy, HighLevel) or any CSV,
 * with intelligent field mapping and live preview before commit.
 */

import { useCallback, useRef, useState } from 'react';
import {
  ArrowRightLeft, FileUp, CheckCircle2, Database,
  Users, Sparkles, ShieldCheck, ArrowRight, RefreshCw, X,
} from 'lucide-react';
import { useAppStore } from '../store';
import type { Contact } from '../types';

// ── Source platform registry ─────────────────────────────────────────────────
interface SourcePlatform {
  id: string;
  name: string;
  vendor: string;
  formats: string;
  howToExport: string[];
  fieldHints: Record<string, string[]>; // ourField -> candidate source headers
}

const COMMON_HINTS: Record<string, string[]> = {
  firstName: ['first name', 'firstname', 'first', 'fname', 'taxpayer first name', 'tp first name', 'given name'],
  lastName: ['last name', 'lastname', 'last', 'lname', 'taxpayer last name', 'tp last name', 'surname'],
  email: ['email', 'e-mail', 'email address', 'taxpayer email', 'client email'],
  phone: ['phone', 'cell', 'mobile', 'phone number', 'cell phone', 'home phone', 'daytime phone'],
  ssnLast4: ['ssn', 'ssn last 4', 'last 4', 'taxpayer ssn', 'social security'],
  address: ['address', 'street', 'address 1', 'street address', 'mailing address'],
  city: ['city', 'town'],
  state: ['state', 'st', 'province'],
  zip: ['zip', 'zip code', 'postal', 'postal code'],
  filingStatus: ['filing status', 'fs', 'status'],
  lastYearFee: ['prep fee', 'fee', 'invoice amount', 'total fee', 'preparation fee', 'amount billed'],
  refundAmount: ['refund', 'refund amount', 'fed refund', 'federal refund'],
  preparer: ['preparer', 'preparer name', 'assigned to', 'pro', 'staff'],
  taxYear: ['tax year', 'year', 'ty', 'season'],
};

const PLATFORMS: SourcePlatform[] = [
  { id: 'drake', name: 'Drake Tax', vendor: 'Drake Software', formats: 'Client CSV export · Drake Documents',
    howToExport: ['Open Drake → Reports → Report Manager', 'Run "Client Contact Information" (or a custom client list report)', 'Export → CSV, include SSN last-4, fees, and preparer columns', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'taxslayerpro', name: 'TaxSlayer Pro', vendor: 'TaxSlayer', formats: 'Client list CSV · Pro Web reports',
    howToExport: ['Pro Web: Reports → Client Reports → Client List', 'Desktop: Reports → Client Reports', 'Export as CSV with contact + fee columns', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'taxwise', name: 'TaxWise', vendor: 'Wolters Kluwer', formats: 'Client list CSV · Report exports',
    howToExport: ['TaxWise → Reports → Client Lists', 'Choose contact detail report → Export CSV', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'crosslink', name: 'CrossLink', vendor: 'CrossLink Professional', formats: 'Reports CSV · MIS exports',
    howToExport: ['CrossLink → Reports → Management Reports', 'Client listing with contact info → Export CSV', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'proseries', name: 'ProSeries', vendor: 'Intuit', formats: 'HomeBase export CSV',
    howToExport: ['ProSeries → HomeBase view', 'Select all clients → Export → CSV', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'lacerte', name: 'Lacerte', vendor: 'Intuit', formats: 'Client list export CSV',
    howToExport: ['Lacerte → Clients tab → select all', 'File → Export → Client List (CSV)', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'ultratax', name: 'UltraTax CS', vendor: 'Thomson Reuters', formats: 'Client listing CSV · Practice CS export',
    howToExport: ['UltraTax → Utilities → Client Listing Reports', 'Export to CSV with contact detail', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'atx', name: 'ATX', vendor: 'Wolters Kluwer', formats: 'Client list CSV',
    howToExport: ['ATX → Return Manager → select all', 'Export client list to CSV', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'taxdome', name: 'TaxDome', vendor: 'TaxDome', formats: 'Accounts CSV export',
    howToExport: ['TaxDome → Clients → Accounts', 'Bulk actions → Export to CSV', 'Includes tags, custom fields, contacts', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'canopy', name: 'Canopy', vendor: 'Canopy', formats: 'Contact export CSV',
    howToExport: ['Canopy → Contacts → Lists', 'Export list → CSV', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'highlevel', name: 'HighLevel (GHL)', vendor: 'HighLevel', formats: 'Contacts CSV · API pull',
    howToExport: ['GHL → Contacts → select all → Export CSV', 'Tags and custom fields export included', 'Drop the CSV here'], fieldHints: COMMON_HINTS },
  { id: 'csv', name: 'Any CSV / Excel export', vendor: 'Universal', formats: 'CSV with any headers',
    howToExport: ['Export your client list from ANY system as CSV', 'Headers are auto-detected and mapped', 'Review the mapping, then import'], fieldHints: COMMON_HINTS },
];

const OUR_FIELDS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'ssnLast4', label: 'SSN Last-4', required: false },
  { key: 'address', label: 'Street Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zip', label: 'ZIP', required: false },
  { key: 'filingStatus', label: 'Filing Status', required: false },
  { key: 'lastYearFee', label: 'Prior-Year Fee', required: false },
  { key: 'refundAmount', label: 'Refund Amount', required: false },
  { key: 'preparer', label: 'Assigned Preparer', required: false },
  { key: 'taxYear', label: 'Tax Year', required: false },
];

// ── Tiny CSV parser (handles quoted fields) ─────────────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (cur !== '' || row.length) { row.push(cur); rows.push(row); row = []; cur = ''; }
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function autoMap(headers: string[], hints: Record<string, string[]>): Record<string, number> {
  const map: Record<string, number> = {};
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const [field, candidates] of Object.entries(hints)) {
    for (const cand of candidates) {
      const idx = lower.findIndex((h) => h === cand || h.includes(cand));
      if (idx >= 0 && !Object.values(map).includes(idx)) { map[field] = idx; break; }
    }
  }
  return map;
}

type Step = 'pick' | 'upload' | 'map' | 'done';

export default function MigrationPage() {
  const { addContact, addNotification, contacts } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('pick');
  const [platform, setPlatform] = useState<SourcePlatform | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [imported, setImported] = useState(0);
  const [skipped, setSkipped] = useState(0);

  const onFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(String(reader.result ?? ''));
      if (parsed.length < 2) {
        addNotification({ id: `ntf-${Date.now()}`, title: 'Import error', message: 'File must contain a header row plus at least one data row.', type: 'error', read: false, createdAt: new Date() });
        return;
      }
      setHeaders(parsed[0]);
      setRows(parsed.slice(1));
      setMapping(autoMap(parsed[0], platform?.fieldHints ?? COMMON_HINTS));
      setStep('map');
    };
    reader.readAsText(file);
  }, [platform, addNotification]);

  const runImport = () => {
    let ok = 0, skip = 0;
    const existingEmails = new Set(contacts.map((c) => c.email?.toLowerCase()).filter(Boolean));
    rows.forEach((r, i) => {
      const get = (f: string) => (mapping[f] !== undefined ? (r[mapping[f]] ?? '').trim() : '');
      const first = get('firstName'), last = get('lastName');
      if (!first && !last) { skip++; return; }
      const email = get('email').toLowerCase();
      if (email && existingEmails.has(email)) { skip++; return; }
      const custom: Record<string, string> = {};
      for (const f of ['ssnLast4', 'address', 'city', 'state', 'zip', 'filingStatus', 'lastYearFee', 'refundAmount', 'preparer', 'taxYear'] as const) {
        const v = get(f); if (v) custom[f === 'ssnLast4' ? 'ssn_last4' : f] = f === 'ssnLast4' ? v.replace(/\D/g, '').slice(-4) : v;
      }
      const contact: Contact = {
        id: `mig_${Date.now().toString(36)}_${i}`,
        firstName: first || 'Unknown', lastName: last || 'Client',
        email: email, phone: get('phone'),
        tags: ['migrated', `src:${platform?.id ?? 'csv'}`],
        customFields: custom, source: `Migration: ${platform?.name ?? 'CSV'}`,
        status: 'customer', notes: [], activities: [],
        createdAt: new Date(), updatedAt: new Date(),
      };
      addContact(contact);
      if (email) existingEmails.add(email);
      ok++;
    });
    setImported(ok); setSkipped(skip); setStep('done');
    addNotification({ id: `ntf-${Date.now()}`, title: 'Migration complete', message: `${ok} clients imported from ${platform?.name ?? 'CSV'} (${skip} duplicates/blank skipped). All tagged 'migrated' for easy segmentation.`, type: 'success', read: false, createdAt: new Date() });
  };

  const mappedCount = Object.keys(mapping).length;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-600/10 border border-emerald-500/40 grid place-items-center">
            <ArrowRightLeft className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Migration Center</h1>
            <p className="text-sm text-gray-400">Switching is painless: import your entire book of business from any competitor in minutes.</p>
          </div>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" /> Data stays in your browser until you commit
        </span>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs">
        {(['pick', 'upload', 'map', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg grid place-items-center font-black
              ${step === s ? 'bg-emerald-500 text-black' : (['pick','upload','map','done'].indexOf(step) > i ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-500')}`}>{i + 1}</span>
            <span className={step === s ? 'text-white font-semibold' : 'text-gray-500'}>
              {s === 'pick' ? 'Choose Source' : s === 'upload' ? 'Export & Upload' : s === 'map' ? 'Map Fields' : 'Imported'}
            </span>
            {i < 3 && <ArrowRight className="w-3.5 h-3.5 text-gray-600" />}
          </div>
        ))}
      </div>

      {step === 'pick' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLATFORMS.map((p) => (
            <button key={p.id} onClick={() => { setPlatform(p); setStep('upload'); }}
              className="text-left rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 hover:bg-white/[0.06] transition p-4 group">
              <div className="flex items-center justify-between">
                <Database className="w-5 h-5 text-emerald-300" />
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-300 transition" />
              </div>
              <div className="text-white font-bold mt-2">{p.name}</div>
              <div className="text-[11px] text-gray-500">{p.vendor} · {p.formats}</div>
            </button>
          ))}
        </div>
      )}

      {step === 'upload' && platform && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-300" /> How to export from {platform.name}</h3>
            <ol className="space-y-2.5">
              {platform.howToExport.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-300">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 grid place-items-center text-[11px] font-black flex-none">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <button onClick={() => setStep('pick')} className="mt-4 text-xs text-gray-500 hover:text-white flex items-center gap-1"><X className="w-3 h-3" /> Choose a different source</button>
          </div>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
            className="rounded-2xl border-2 border-dashed border-white/15 hover:border-emerald-500/50 bg-white/[0.02] hover:bg-white/[0.04] transition cursor-pointer grid place-items-center p-10 text-center">
            <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <div>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/30 grid place-items-center mb-3">
                <FileUp className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="text-white font-semibold">Drop your {platform.name} export here</div>
              <div className="text-xs text-gray-500 mt-1">CSV format · headers auto-detected & mapped</div>
            </div>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center gap-3 text-sm text-emerald-300">
            <CheckCircle2 className="w-4 h-4 flex-none" />
            {rows.length.toLocaleString()} rows detected · {mappedCount} of {OUR_FIELDS.length} fields auto-mapped from {headers.length} source columns. Adjust anything below, then import.
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
            <div className="grid sm:grid-cols-2 gap-3">
              {OUR_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <div className="w-36 text-sm text-gray-300 flex-none">
                    {f.label}{f.required && <span className="text-red-400"> *</span>}
                  </div>
                  <select
                    value={mapping[f.key] ?? -1}
                    onChange={(e) => setMapping((m) => {
                      const v = Number(e.target.value);
                      const n = { ...m };
                      if (v < 0) delete n[f.key]; else n[f.key] = v;
                      return n;
                    })}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50 outline-none">
                    <option value={-1}>— not mapped —</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          {/* Preview */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 overflow-x-auto">
            <h3 className="text-white font-bold mb-3 text-sm">Preview — first 5 rows as they will import</h3>
            <table className="w-full text-xs">
              <thead><tr className="text-gray-500 text-left">
                {OUR_FIELDS.filter((f) => mapping[f.key] !== undefined).map((f) => <th key={f.key} className="pb-2 pr-4 font-semibold">{f.label}</th>)}
              </tr></thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-white/5 text-gray-300">
                    {OUR_FIELDS.filter((f) => mapping[f.key] !== undefined).map((f) => (
                      <td key={f.key} className="py-2 pr-4">{f.key === 'ssnLast4' ? `•••${(r[mapping[f.key]] ?? '').replace(/\D/g, '').slice(-4)}` : r[mapping[f.key]]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button onClick={runImport}
              disabled={mapping.firstName === undefined && mapping.lastName === undefined}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 hover:brightness-110 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              <Users className="w-4 h-4" /> Import {rows.length.toLocaleString()} Clients Now
            </button>
            <button onClick={() => setStep('upload')} className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/15 text-gray-300 text-sm hover:bg-white/10">Back</button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-3xl bg-gradient-to-b from-emerald-500/15 to-transparent border border-emerald-500/30 p-10 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center shadow-lg shadow-emerald-500/30 mb-4">
            <CheckCircle2 className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-black text-white">Migration Complete</h2>
          <p className="text-gray-400 text-sm mt-2">
            <span className="text-emerald-400 font-bold">{imported.toLocaleString()} clients imported</span> from {platform?.name}
            {skipped > 0 && <> · {skipped} skipped (duplicates or blank rows)</>}.
            All records are tagged <code className="text-amber-300">migrated</code> — target them with a "We've upgraded!" welcome campaign.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <a href="#/contacts" className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm">View Imported Clients</a>
            <button onClick={() => { setStep('pick'); setPlatform(null); setHeaders([]); setRows([]); }}
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/15 text-gray-300 text-sm hover:bg-white/10 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Import Another Source
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
