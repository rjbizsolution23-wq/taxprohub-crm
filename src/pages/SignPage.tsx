/**
 * ═══════════════════════════════════════════════════════════════════════
 * PUBLIC E-SIGNATURE PAGE  —  /#/sign?token=…
 * ═══════════════════════════════════════════════════════════════════════
 * ESIGN Act / UETA compliant ceremony: the signer sees the exact document
 * (hash-verified server-side), an explicit electronic-signature disclosure,
 * a consent checkbox, and adopts a typed signature. IP, user agent, timestamp
 * and the document hash are recorded into the audit certificate.
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PenLine, ShieldCheck, CheckCircle2, AlertTriangle, Loader2, FileText } from 'lucide-react';

interface DocState {
  ok: boolean;
  status?: 'pending' | 'signed';
  title?: string;
  body?: string;
  docType?: string;
  signerName?: string;
  signerEmail?: string;
  expiresAt?: string;
  signedAt?: string;
  signatureName?: string;
  practice?: { name: string; email: string; phone: string };
  disclosure?: string;
  error?: string;
}

export default function SignPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [doc, setDoc] = useState<DocState | null>(null);
  const [typed, setTyped] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ signedAt: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) { setDoc({ ok: false, error: 'missing_token' }); return; }
    try {
      const res = await fetch(`/api/esign/document/${encodeURIComponent(token)}`);
      const body = await res.json();
      setDoc(body);
      if (body?.signerName) setTyped(body.signerName);
    } catch {
      setDoc({ ok: false, error: 'unreachable' });
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const sign = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/esign/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signatureName: typed.trim(), consent }),
      });
      const body = await res.json();
      if (body?.ok) setDone({ signedAt: body.signedAt });
      else setError({
        already_signed: 'This document has already been signed.',
        link_expired: 'This signing link has expired. Ask the practice to resend it.',
        document_integrity_failure: 'The document changed after it was sent. For your protection the signature was blocked — contact the practice.',
        esign_consent_required: 'Please tick the electronic signature consent box.',
        signature_name_required: 'Type your full legal name to sign.',
      }[body?.error as string] || body?.error || 'Could not record the signature.');
    } catch {
      setError('Signing service unreachable.');
    }
    setBusy(false);
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#030712] text-white p-6 grid place-items-center">
      <div className="w-full max-w-3xl">{children}</div>
    </div>
  );

  if (!doc) return shell(
    <div className="flex items-center gap-2 text-sm text-gray-300"><Loader2 className="w-4 h-4 animate-spin" /> Loading document…</div>
  );

  if (!doc.ok) return shell(
    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
      <h1 className="text-lg font-bold mt-3">This signing link isn’t valid</h1>
      <p className="text-sm text-gray-400 mt-2">
        {doc.error === 'link_expired' ? 'The link has expired.' : doc.error === 'missing_token' ? 'No signing token was supplied.' : 'We could not find that document.'}
        {' '}Ask your preparer to send a new request.
      </p>
    </div>
  );

  if (done || doc.status === 'signed') return shell(
    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
      <h1 className="text-xl font-bold mt-3">Signed</h1>
      <p className="text-sm text-gray-300 mt-2">
        “{doc.title}” was signed{(done?.signedAt || doc.signedAt) ? ` on ${new Date(done?.signedAt || doc.signedAt!).toLocaleString()}` : ''}.
      </p>
      <p className="text-xs text-gray-500 mt-4 max-w-lg mx-auto leading-relaxed">
        An executed copy and the signature certificate (document hash, timestamp, IP address and your adopted
        signature) have been filed to your practice’s secure vault. You may request a paper copy at any time.
      </p>
    </div>
  );

  return shell(
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-600/10 border border-amber-500/40 grid place-items-center">
          <PenLine className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{doc.title}</h1>
          <p className="text-xs text-gray-400">
            {doc.practice?.name ? `Sent by ${doc.practice.name}` : 'Electronic signature request'}
            {doc.expiresAt ? ` · expires ${new Date(doc.expiresAt).toLocaleDateString()}` : ''}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-500 font-mono mb-3">
          <FileText className="w-3.5 h-3.5" /> Document
        </div>
        <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-200 font-sans max-h-[45vh] overflow-y-auto">{doc.body}</pre>
      </div>

      <div className="rounded-3xl border border-[#D4AF37]/25 bg-neutral-950/80 p-6 space-y-4">
        <div className="flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{doc.disclosure}</span>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-gray-300 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#D4AF37]" />
          <span>I consent to sign this record electronically and agree my typed name is my legal signature.</span>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">Type your full legal name</span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Jane Q. Taxpayer"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg outline-none focus:border-[#D4AF37]/50"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          />
        </label>

        <button
          onClick={sign}
          disabled={busy || !consent || typed.trim().length < 2}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3.5 text-sm font-black text-black disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
          Adopt signature and sign
        </button>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <p className="text-[10px] text-gray-600 leading-relaxed">
          Signature certificate records: document SHA-256 hash, adopted name, timestamp, IP address and
          browser user agent. Retained under ESIGN Act 15 U.S.C. §7001 and UETA §12.
        </p>
      </div>
    </div>
  );
}
