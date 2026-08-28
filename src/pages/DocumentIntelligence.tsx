/**
 * 📄 DOCUMENT INTELLIGENCE CENTER — Zero-Key OCR → Parse → CRM Autofill
 * The flagship intake engine: drop any tax document, watch the on-device
 * neural OCR read it, see box-by-box IRS field extraction, then inject
 * everything into the CRM (contact + deal) with one click.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileUp, ScanLine, Cpu, ShieldCheck, CheckCircle2, AlertTriangle,
  UserPlus, Briefcase, ArrowRight, FileText, Sparkles, Eye, X, Layers, Lock,
  FolderOpen, Wand2, User, FolderTree, Zap, CloudUpload, Download, Trash2, Database,
} from 'lucide-react';
import { runOCR, type OCRResult } from '../utils/ocr';
import { parseTaxDocument, type ParsedTaxDocument, type ExtractedField } from '../utils/taxDocParser';
import { autofillCRM, type AutofillResult } from '../utils/crmAutofill';
import { buildFilingPlan, type FilingPlan } from '../utils/smartFiling';
import {
  listVaultFiles, uploadVaultFile, deleteVaultFile, downloadVaultFile, humanSize,
  type VaultFile,
} from '../utils/vault';

type Phase = 'idle' | 'ocr' | 'parsed' | 'injected';

interface ProcessedDoc {
  file: File;
  ocr: OCRResult;
  parsed: ParsedTaxDocument;
  plan: FilingPlan;
  autofill?: AutofillResult;
}

const CATEGORY_META: Record<ExtractedField['category'], { label: string; cls: string }> = {
  identity: { label: 'Identity', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  employer: { label: 'Employer/Payer', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  income: { label: 'Income', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  withholding: { label: 'Withholding', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  deduction: { label: 'Deduction', cls: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
  account: { label: 'Account', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  meta: { label: 'Meta', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
};

export default function DocumentIntelligence() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [docs, setDocs] = useState<ProcessedDoc[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [batchInfo, setBatchInfo] = useState<{ current: number; total: number } | null>(null);
  const [createDeal, setCreateDeal] = useState(true);
  const [showRawText, setShowRawText] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Secure Document Vault (Cloudflare R2) ─────────────────────────── */
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [vaultState, setVaultState] = useState<'checking' | 'ready' | 'unconfigured' | 'signedout'>('checking');
  const [vaultHint, setVaultHint] = useState<string>('');
  const [vaultBusy, setVaultBusy] = useState(false);

  const refreshVault = useCallback(async () => {
    const res = await listVaultFiles({ limit: 100 });
    if (res.ok) { setVaultFiles(res.items); setVaultState('ready'); return true; }
    if (res.status === 401) { setVaultState('signedout'); return false; }
    setVaultState('unconfigured');
    setVaultHint(res.hint || res.error || 'Vault unavailable');
    return false;
  }, []);

  useEffect(() => { void refreshVault(); }, [refreshVault]);

  const archiveToVault = useCallback(async (processed: ProcessedDoc[]) => {
    if (vaultState !== 'ready' || processed.length === 0) return;
    setVaultBusy(true);
    for (const d of processed) {
      await uploadVaultFile(d.file, {
        folder: d.plan.folder,
        docType: d.parsed.formType,
        taxYear: d.parsed.taxYear,
      });
    }
    await refreshVault();
    setVaultBusy(false);
  }, [vaultState, refreshVault]);

  const removeFromVault = async (id: string) => {
    setVaultBusy(true);
    await deleteVaultFile(id);
    await refreshVault();
    setVaultBusy(false);
  };

  const doc = docs[selectedIdx] ?? null;

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);
    setDocs([]);
    setSelectedIdx(0);
    setPhase('ocr');
    setProgress(0);
    const results: ProcessedDoc[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setBatchInfo(files.length > 1 ? { current: i + 1, total: files.length } : null);
        setStage(files.length > 1 ? `[${i + 1}/${files.length}] ${file.name} — running neural OCR…` : 'Initializing on-device OCR…');
        const ocr = await runOCR(file, (s, p) => { setStage(files.length > 1 ? `[${i + 1}/${files.length}] ${s}` : s); setProgress(p); });
        const parsed = parseTaxDocument(ocr.fullText, ocr.meanConfidence);
        const plan = buildFilingPlan(parsed, file.name);
        results.push({ file, ocr, parsed, plan });
      }
      setDocs(results);
      setBatchInfo(null);
      setPhase('parsed');
      void archiveToVault(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OCR engine failed to process this file.');
      setBatchInfo(null);
      if (results.length > 0) { setDocs(results); setPhase('parsed'); } else { setPhase('idle'); }
    }
  }, [archiveToVault]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) processFiles(files);
  }, [processFiles]);

  const injectToCRM = () => {
    if (!doc) return;
    const result = autofillCRM(doc.parsed, { fileName: doc.plan.standardizedName, createDeal });
    setDocs((prev) => prev.map((d, i) => (i === selectedIdx ? { ...d, autofill: result } : d)));
    setPhase('injected');
  };

  const autoProcessAll = () => {
    setDocs((prev) => prev.map((d) => {
      if (d.autofill || !d.plan.autoProcessEligible) return d;
      const result = autofillCRM(d.parsed, { fileName: d.plan.standardizedName, createDeal: true });
      return { ...d, autofill: result };
    }));
  };

  const reset = () => { setDocs([]); setSelectedIdx(0); setPhase('idle'); setProgress(0); setError(null); setBatchInfo(null); };

  // Filing cabinet: group processed docs by client → folder
  const cabinet = useMemo(() => {
    const byClient = new Map<string, Map<string, ProcessedDoc[]>>();
    docs.forEach((d) => {
      const client = d.plan.clientMatch.displayName;
      if (!byClient.has(client)) byClient.set(client, new Map());
      const folders = byClient.get(client)!;
      if (!folders.has(d.plan.folder)) folders.set(d.plan.folder, []);
      folders.get(d.plan.folder)!.push(d);
    });
    return byClient;
  }, [docs]);

  const eligibleCount = docs.filter((d) => d.plan.autoProcessEligible && !d.autofill).length;
  const processedCount = docs.filter((d) => d.autofill).length;

  const grouped = doc ? doc.parsed.fields.reduce<Record<string, ExtractedField[]>>((acc, f) => {
    (acc[f.category] ||= []).push(f);
    return acc;
  }, {}) : {};

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-600/10 border border-amber-500/40 grid place-items-center">
              <ScanLine className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Document Intelligence Center
              </h1>
              <p className="text-sm text-gray-400">Zero-key neural OCR → box-by-box IRS parsing → instant CRM autofill</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> On-Device — No AI Keys Needed
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> IRS Pub 4557 Aligned
          </span>
        </div>
      </div>

      {/* Engine strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Cpu, title: 'Tesseract v7 LSTM', sub: 'WASM neural OCR core' },
          { icon: FileText, title: 'PDF.js v6', sub: 'Lossless text-layer + rasterizer' },
          { icon: Layers, title: '17 IRS Form Schemas', sub: 'W-2 · 1099 family · 1098 · K-1 · SSA' },
          { icon: Sparkles, title: 'CRM Autofill Bridge', sub: 'Contacts + Deals + Audit trail' },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-4">
            <c.icon className="w-4 h-4 text-amber-400 mb-2" />
            <div className="text-sm font-semibold text-white">{c.title}</div>
            <div className="text-xs text-gray-500">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Dropzone / Progress */}
      {docs.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => phase === 'idle' && inputRef.current?.click()}
          className={`relative rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
            ${dragOver ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' : 'border-white/15 bg-white/[0.02] hover:border-amber-500/50 hover:bg-white/[0.04]'}
            ${phase === 'ocr' ? 'pointer-events-none' : ''}`}
        >
          <input
            ref={inputRef} type="file" className="hidden" multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp"
            onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))}
          />
          <div className="p-10 text-center">
            {phase === 'ocr' ? (
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 grid place-items-center animate-pulse shadow-lg shadow-amber-500/30">
                  <Cpu className="w-7 h-7 text-black" />
                </div>
                <div className="text-white font-semibold">{stage}</div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-xs text-gray-500">
                  {batchInfo ? `Document ${batchInfo.current} of ${batchInfo.total} · ` : ''}{progress}% — documents never leave this browser
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 grid place-items-center mb-4">
                  <FileUp className="w-7 h-7 text-amber-400" />
                </div>
                <div className="text-lg font-semibold text-white">Drop any tax documents — single or an entire stack — or click to browse</div>
                <div className="text-sm text-gray-500 mt-1">W-2 · 1099-NEC/MISC/INT/DIV/B/R/K/G · 1098 · 1098-T · SSA-1099 · K-1 · PDF or photo</div>
                <div className="text-xs text-amber-400/80 mt-2 flex items-center justify-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5" /> Multi-file drops auto-arrange into per-client, per-year folders with standardized names
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-3 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-none" /> {error}
        </div>
      )}

      {/* 🗂️ AUTO-ARRANGE FILING CABINET — batch view */}
      {docs.length > 1 && (
        <div className="rounded-3xl bg-gradient-to-br from-violet-500/10 via-white/[0.02] to-transparent border border-violet-500/25 backdrop-blur-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-transparent border border-violet-500/40 grid place-items-center">
                <FolderTree className="w-5 h-5 text-violet-300" />
              </div>
              <div>
                <div className="text-white font-bold">Auto-Arranged Filing Cabinet</div>
                <div className="text-xs text-gray-400">
                  {docs.length} documents → {cabinet.size} client{cabinet.size !== 1 ? 's' : ''} · matched, foldered & renamed automatically · {processedCount} injected
                </div>
              </div>
            </div>
            {eligibleCount > 0 && (
              <button onClick={autoProcessAll}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:brightness-110 transition flex items-center gap-2">
                <Zap className="w-4 h-4" /> Auto-Process {eligibleCount} High-Confidence Doc{eligibleCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from(cabinet.entries()).map(([client, folders]) => (
              <div key={client} className="rounded-2xl bg-black/30 border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 grid place-items-center">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-sm font-bold text-white truncate">{client}</div>
                </div>
                <div className="space-y-2">
                  {Array.from(folders.entries()).map(([folder, items]) => (
                    <div key={folder}>
                      <div className="flex items-center gap-1.5 text-[11px] text-violet-300 font-semibold uppercase tracking-wide mb-1">
                        <FolderOpen className="w-3 h-3" /> {folder}
                      </div>
                      {items.map((d) => {
                        const idx = docs.indexOf(d);
                        return (
                          <button key={d.plan.standardizedName + idx} onClick={() => { setSelectedIdx(idx); setPhase(d.autofill ? 'injected' : 'parsed'); }}
                            className={`w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition mb-1
                              ${idx === selectedIdx ? 'bg-amber-500/15 border border-amber-500/30 text-amber-200' : 'bg-white/[0.03] border border-white/5 text-gray-300 hover:bg-white/[0.07]'}`}>
                            <FileText className="w-3 h-3 flex-none" />
                            <span className="truncate flex-1">{d.plan.standardizedName}</span>
                            {d.autofill
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-none" />
                              : d.plan.autoProcessEligible
                                ? <Zap className="w-3.5 h-3.5 text-violet-300 flex-none" />
                                : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-none" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {doc && phase !== 'ocr' && (
        <div className="space-y-5">
          {/* Classification banner */}
          <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-white/[0.03] to-transparent border border-amber-500/25 backdrop-blur-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 grid place-items-center shadow-lg shadow-amber-500/25">
                <span className="text-black font-black text-xs text-center leading-tight px-1">{doc.parsed.formType}</span>
              </div>
              <div>
                <div className="text-white font-bold text-lg">{doc.file.name}</div>
                <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  <span>Engine: {doc.ocr.engine}</span>
                  <span>·</span>
                  <span>{doc.ocr.durationMs.toLocaleString()}ms</span>
                  <span>·</span>
                  <span>OCR confidence {doc.ocr.meanConfidence.toFixed(1)}%</span>
                  {doc.parsed.taxYear && (<><span>·</span><span>Tax Year {doc.parsed.taxYear}</span></>)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowRawText(!showRawText)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-gray-300 text-sm hover:bg-white/10 flex items-center gap-2">
                <Eye className="w-4 h-4" /> {showRawText ? 'Hide' : 'View'} OCR Text
              </button>
              <button onClick={reset}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-gray-300 text-sm hover:bg-white/10 flex items-center gap-2">
                <X className="w-4 h-4" /> New Document
              </button>
            </div>
          </div>

          {showRawText && (
            <pre className="rounded-2xl bg-black/50 border border-white/10 p-4 text-xs text-gray-400 max-h-72 overflow-auto whitespace-pre-wrap">
              {doc.ocr.fullText || '(no text recognized)'}
            </pre>
          )}

          {/* 🧠 Smart Filing Plan */}
          <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 via-white/[0.02] to-transparent border border-violet-500/25 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-4 h-4 text-violet-300" />
              <span className="text-white font-bold text-sm">Smart Filing Plan — Auto-Arranged</span>
              {doc.plan.autoProcessEligible && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">AUTO-PROCESS ELIGIBLE</span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl bg-black/30 border border-white/10 p-3.5">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Client Match</div>
                <div className="text-white font-semibold text-sm mt-1 truncate">{doc.plan.clientMatch.displayName}</div>
                <div className="text-[11px] mt-1">
                  <span className={doc.plan.clientMatch.method === 'new_client' ? 'text-amber-400' : 'text-emerald-400'}>
                    {doc.plan.clientMatch.method === 'email' ? 'Matched by email' :
                     doc.plan.clientMatch.method === 'ssn_last4' ? 'Matched by SSN last-4' :
                     doc.plan.clientMatch.method === 'name' ? 'Matched by name' : 'New client — will be created'}
                  </span>
                  <span className="text-gray-500"> · {doc.plan.clientMatch.confidence}%</span>
                </div>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/10 p-3.5">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1"><FolderOpen className="w-3 h-3" /> Filed Into</div>
                <div className="text-violet-300 font-semibold text-sm mt-1">{doc.plan.folder} / TY{doc.plan.taxYear}</div>
                <div className="text-[11px] text-gray-500 mt-1 leading-snug">{doc.plan.folderReason}</div>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/10 p-3.5">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1"><FileText className="w-3 h-3" /> Standardized Name</div>
                <div className="text-amber-300 font-mono text-[11px] mt-1 break-all leading-snug">{doc.plan.standardizedName}</div>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/10 p-3.5">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1"><Sparkles className="w-3 h-3" /> Recommended Next Action</div>
                <div className="text-[11px] text-gray-300 mt-1 leading-snug">{doc.plan.nextAction}</div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {doc.parsed.warnings.length > 0 && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-1.5">
              {doc.parsed.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-amber-300">
                  <AlertTriangle className="w-4 h-4 flex-none mt-0.5" /> {w}
                </div>
              ))}
            </div>
          )}

          {/* Extracted fields grid */}
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              {Object.entries(grouped).map(([cat, fields]) => {
                const meta = CATEGORY_META[cat as ExtractedField['category']];
                return (
                  <div key={cat} className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
                    <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-semibold tracking-wide uppercase mb-3 ${meta.cls}`}>
                      {meta.label} — {fields.length} field{fields.length > 1 ? 's' : ''}
                    </span>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {fields.map((f) => (
                        <div key={f.key} className="rounded-xl bg-black/30 border border-white/10 p-3.5">
                          <div className="text-[11px] text-gray-500 uppercase tracking-wide">{f.label}</div>
                          <div className="text-white font-semibold mt-1 break-words">{f.value}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                              <div className={`h-full ${f.confidence >= 85 ? 'bg-emerald-500' : f.confidence >= 65 ? 'bg-amber-500' : 'bg-red-500'}`}
                                   style={{ width: `${f.confidence}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-500">{Math.round(f.confidence)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {doc.parsed.fields.length === 0 && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 text-center text-gray-400 text-sm">
                  No structured fields could be confidently extracted. View the OCR text above and enter data manually — or try a higher-resolution scan.
                </div>
              )}
            </div>

            {/* CRM injection panel */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/25 backdrop-blur-xl p-5 sticky top-6">
                <h3 className="text-white font-bold flex items-center gap-2 mb-1">
                  <UserPlus className="w-4 h-4 text-amber-400" /> CRM Injection
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  {doc.parsed.identity.fullName
                    ? <>Detected taxpayer: <span className="text-amber-300 font-semibold">{doc.parsed.identity.fullName}</span></>
                    : 'Taxpayer identity partially detected — a contact will still be created for review.'}
                </p>

                {!doc.autofill ? (
                  <>
                    <label className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/10 p-3 cursor-pointer mb-4">
                      <input type="checkbox" checked={createDeal} onChange={(e) => setCreateDeal(e.target.checked)}
                             className="accent-amber-500 w-4 h-4" />
                      <div>
                        <div className="text-sm text-white font-medium flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Also open Tax-Prep Deal
                        </div>
                        <div className="text-[11px] text-gray-500">Pipeline card seeded with detected income & fee estimate</div>
                      </div>
                    </label>
                    <button onClick={injectToCRM}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm shadow-lg shadow-amber-500/30 hover:brightness-110 transition flex items-center justify-center gap-2">
                      Inject {doc.parsed.fields.length} Fields Into CRM <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : doc.autofill && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                      <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Contact {doc.autofill.action === 'created' ? 'Created' : 'Enriched'}
                      </div>
                      <ul className="space-y-1.5">
                        {doc.autofill.summary.map((s, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => navigate(`/contacts/${doc.autofill!.contactId}`)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm flex items-center justify-center gap-2">
                      Open Contact Record <ArrowRight className="w-4 h-4" />
                    </button>
                    {doc.autofill.dealCreated && (
                      <button onClick={() => navigate('/pipelines')}
                        className="w-full py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-semibold hover:bg-white/10 flex items-center justify-center gap-2">
                        View Deal in Pipeline <Briefcase className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={reset}
                      className="w-full py-2.5 rounded-xl text-gray-400 text-xs hover:text-white transition">
                      Process another document →
                    </button>
                  </div>
                )}

                {/* Totals mini-summary */}
                {(doc.parsed.totals.totalIncome !== undefined || doc.parsed.totals.federalWithholding !== undefined) && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    {doc.parsed.totals.totalIncome !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Detected Income</span>
                        <span className="text-emerald-400 font-bold">
                          {doc.parsed.totals.totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                      </div>
                    )}
                    {doc.parsed.totals.federalWithholding !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Federal Withholding</span>
                        <span className="text-amber-400 font-bold">
                          {doc.parsed.totals.federalWithholding.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SECURE DOCUMENT VAULT — Cloudflare R2 ═══════════ */}
      <div className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-600/10 border border-cyan-500/40 grid place-items-center">
              <Database className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Secure Document Vault</h2>
              <p className="text-xs text-gray-400">
                Originals are archived to Cloudflare R2 and indexed in D1 — tenant-scoped, never public.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {vaultBusy && (
              <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <CloudUpload className="w-3 h-3 animate-pulse" /> Syncing…
              </span>
            )}
            {vaultState === 'ready' && (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Vault online · {vaultFiles.length} object{vaultFiles.length === 1 ? '' : 's'}
              </span>
            )}
            {vaultState === 'signedout' && (
              <span className="px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-300">
                Sign in to archive documents
              </span>
            )}
            {vaultState === 'unconfigured' && (
              <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                Not provisioned
              </span>
            )}
          </div>
        </div>

        {vaultState === 'unconfigured' && (
          <div className="text-xs text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 font-mono">
            {vaultHint || 'Run `npm run cf:setup` to create the R2 bucket + D1 index, then redeploy.'}
          </div>
        )}

        {vaultState === 'ready' && vaultFiles.length === 0 && (
          <div className="text-xs text-gray-500 border border-dashed border-white/10 rounded-2xl p-6 text-center">
            No documents archived yet. Drop a return above — the original is stored automatically.
          </div>
        )}

        {vaultFiles.length > 0 && (
          <div className="divide-y divide-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {vaultFiles.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.03]">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{f.name}</div>
                  <div className="text-[11px] text-gray-500">
                    {f.folder} · {f.docType}{f.taxYear ? ` · TY${f.taxYear}` : ''} · {humanSize(f.size)} · {new Date(f.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => downloadVaultFile(f.id, f.name)}
                  className="p-2 rounded-xl hover:bg-white/10 text-gray-300"
                  title="Download from R2"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeFromVault(f.id)}
                  className="p-2 rounded-xl hover:bg-red-500/10 text-red-400"
                  title="Delete permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
