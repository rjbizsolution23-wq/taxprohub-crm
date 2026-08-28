/**
 * ═══════════════════════════════════════════════════════════════════════
 * PUBLIC INTAKE FORM  —  /#/f/:tenantId/:slug
 * ═══════════════════════════════════════════════════════════════════════
 * Unauthenticated landing/funnel form. Renders the practice's real form
 * definition from D1, submits to the public intake endpoint, and the response
 * creates (or dedupes) a live contact and can enrol it in a workflow.
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertTriangle, ShieldCheck, Send } from 'lucide-react';

interface Field {
  id: string; type: string; label: string; placeholder?: string;
  required?: boolean; options?: string[]; position?: number;
}
interface FormDef {
  ok: boolean;
  form?: { id: string; name: string; fields: Field[]; submitButtonText: string; successMessage: string };
  practice?: { name: string; logo: string | null; colors: Record<string, string> };
  error?: string;
}

export default function PublicFormPage() {
  const { tenantId = '', slug = '' } = useParams();
  const [def, setDef] = useState<FormDef | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [hp, setHp] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/forms/${encodeURIComponent(tenantId)}/${encodeURIComponent(slug)}`);
      setDef(await res.json());
    } catch {
      setDef({ ok: false, error: 'unreachable' });
    }
  }, [tenantId, slug]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/public/forms/${encodeURIComponent(tenantId)}/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values, _hp: hp, _source: 'public_form', _referrer: document.referrer }),
      });
      const body = await res.json();
      if (body?.ok) setDone(body.message || 'Thank you — your information was received.');
      else setError({
        rate_limited: 'Too many submissions from this connection. Please try again in a few minutes.',
        form_not_found: 'This form is no longer available.',
        capacity: 'This practice cannot accept new intakes right now. Please contact them directly.',
      }[body?.error as string] || body?.hint || 'Submission failed. Please try again.');
    } catch {
      setError('Could not reach the intake service.');
    }
    setBusy(false);
  };

  const wrap = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#030712] text-white grid place-items-center p-6">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );

  if (!def) return wrap(<div className="flex items-center gap-2 text-sm text-gray-300"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>);

  if (!def.ok || !def.form) return wrap(
    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
      <h1 className="text-lg font-bold mt-3">Form unavailable</h1>
      <p className="text-sm text-gray-400 mt-2">This intake form could not be found.</p>
    </div>
  );

  if (done) return wrap(
    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-10 text-center">
      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
      <h1 className="text-xl font-bold mt-3">Received</h1>
      <p className="text-sm text-gray-300 mt-2">{done}</p>
      <p className="text-[11px] text-gray-600 mt-5">
        Your information is transmitted over TLS and stored under the practice’s Written Information
        Security Plan (IRS Pub 4557).
      </p>
    </div>
  );

  const fields = [...(def.form.fields || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const set = (label: string, v: string) => setValues((p) => ({ ...p, [label]: v }));

  return wrap(
    <form onSubmit={submit} className="space-y-5">
      <div className="text-center">
        {def.practice?.logo && <img src={def.practice.logo} alt="" className="h-12 w-12 rounded-2xl object-cover mx-auto mb-3" />}
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-mono">{def.practice?.name}</div>
        <h1 className="text-2xl font-bold mt-1">{def.form.name}</h1>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        {fields.map((f) => (
          <label key={f.id} className="block">
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-mono">
              {f.label}{f.required ? ' *' : ''}
            </span>
            {f.type === 'textarea' ? (
              <textarea
                required={f.required} rows={4} placeholder={f.placeholder}
                value={values[f.label] || ''} onChange={(e) => set(f.label, e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50"
              />
            ) : f.type === 'select' ? (
              <select
                required={f.required} value={values[f.label] || ''} onChange={(e) => set(f.label, e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50"
              >
                <option value="">Select…</option>
                {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'checkbox' ? (
              <span className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" required={f.required} checked={values[f.label] === 'yes'}
                  onChange={(e) => set(f.label, e.target.checked ? 'yes' : '')} className="accent-[#D4AF37]" />
                {f.placeholder || 'I agree'}
              </span>
            ) : (
              <input
                type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : f.type === 'date' ? 'date' : 'text'}
                required={f.required} placeholder={f.placeholder}
                value={values[f.label] || ''} onChange={(e) => set(f.label, e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50"
              />
            )}
          </label>
        ))}

        {/* Honeypot — hidden from humans, filled by bots */}
        <input value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off"
          aria-hidden="true" className="hidden" />

        <button type="submit" disabled={busy}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3.5 text-sm font-black text-black disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {def.form.submitButtonText}
        </button>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-600 text-center flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3 h-3" /> Encrypted in transit · retained under IRC §6107(b)
      </p>
    </form>
  );
}
