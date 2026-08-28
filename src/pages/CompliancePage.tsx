/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMPLIANCE COMMAND CENTER
 * ═══════════════════════════════════════════════════════════════════════
 * A Chief Compliance Orchestrator supervising 20 specialist agents. Every
 * agent runs a real query against this tenant's D1 records — the score, the
 * findings and the agent telemetry below are all live. An empty practice
 * legitimately scores 100 with zero findings.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Bot, Play, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Scale, Activity, ChevronRight, Radio, Filter, XCircle, Loader2, FileArchive, Download,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useLiveStream, ACTIVITY_LABELS } from '../utils/liveStream';

interface Agent {
  agent_key: string; name: string; domain: string; authority: string;
  cadence: string; status: string; last_run_at: string | null;
  last_duration_ms: number; open_findings: number; checks_run: number;
}
interface Finding {
  id: string; agent_key: string; severity: 'critical' | 'high' | 'medium' | 'low';
  title: string; detail: string; authority: string; remediation: string;
  deep_link: string; status: string; first_seen: string; last_seen: string;
}
interface Overview {
  ok: boolean;
  chief: { name: string; supervises: number; score: number; lastRun: string | null; cadence: string };
  agents: Agent[];
  findings: Finding[];
  runs: { id: string; started_at: string; completed_at: string | null; agents_run: number; findings_opened: number; findings_resolved: number; score: number; trigger: string }[];
  bySeverity: Record<string, number>;
}

const SEV_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-300 border-red-500/30',
  high: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  medium: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  low: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

export default function CompliancePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [sweeping, setSweeping] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [sevFilter, setSevFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const { snapshot, activity, connected } = useLiveStream(true);

  /* ── Audit-ready evidence bundles ── */
  const [exports, setExports] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  const loadExports = useCallback(async () => {
    const res = await apiFetch<{ items: any[] }>('/api/compliance/evidence');
    if (res.ok) setExports(((res.data as any)?.items) || []);
  }, []);

  const buildEvidence = async () => {
    setExporting(true);
    const res = await apiFetch<{ title: string; sizeBytes: number; sha256: string }>('/api/compliance/evidence', { method: 'POST', body: '{}' });
    const d: any = res.data || {};
    setNotice(res.ok
      ? `Evidence bundle generated — ${d.title} (${(d.sizeBytes / 1024).toFixed(1)} KB, sha256 ${String(d.sha256).slice(0, 16)}…), archived to the vault.`
      : (d.hint || d.error || 'Export failed.'));
    setExporting(false);
    await loadExports();
  };

  const downloadEvidence = async (id: string, title: string) => {
    const token = localStorage.getItem('tph_session_token') || '';
    const res = await fetch(`/api/compliance/evidence/${id}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = title; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const load = useCallback(async () => {
    const res = await apiFetch<Overview>('/api/compliance/overview');
    if (res.ok && res.data) { setData(res.data as Overview); setNotice(''); }
    else setNotice((res.data as any)?.hint || res.error || 'Compliance engine requires the D1 backend. Run npm run cf:setup and sign in.');
    setLoading(false);
  }, []);

  useEffect(() => { void load(); void loadExports(); }, [load, loadExports]);

  const sweep = async (agentKey?: string) => {
    setSweeping(agentKey || 'all');
    const res = await apiFetch('/api/compliance/run', {
      method: 'POST',
      body: JSON.stringify(agentKey ? { agentKey } : {}),
    });
    const d: any = res.data || {};
    setNotice(res.ok
      ? `Sweep complete — ${d.agentsRun} agent${d.agentsRun === 1 ? '' : 's'} run, ${d.opened} new finding${d.opened === 1 ? '' : 's'}, ${d.resolved} auto-resolved, score ${d.score}.`
      : (d.hint || d.error || 'Sweep failed.'));
    setSweeping(null);
    await load();
  };

  const act = async (id: string, status: 'resolved' | 'waived') => {
    await apiFetch(`/api/compliance/findings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason: status === 'waived' ? 'Accepted risk — reviewed by practice owner' : '' }),
    });
    await load();
  };

  const findings = useMemo(() => (data?.findings || []).filter((f) =>
    (sevFilter === 'all' || f.severity === sevFilter) &&
    (agentFilter === 'all' || f.agent_key === agentFilter)), [data, sevFilter, agentFilter]);

  const score = data?.chief.score ?? 0;
  const scoreColor = score >= 90 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black text-black bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
              Compliance Command Center
            </span>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider font-mono border flex items-center gap-1.5 ${connected ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
              <Radio className={`h-3 w-3 ${connected ? 'animate-pulse' : ''}`} /> {connected ? 'Live stream on' : 'Stream idle'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-2.5">Chief Compliance Orchestrator</h1>
          <p className="text-slate-400 text-sm mt-1">
            Supervising {data?.chief.supervises ?? 20} specialist agents · {data?.chief.cadence ?? 'daily + on demand'}
            {data?.chief.lastRun ? ` · last sweep ${new Date(data.chief.lastRun).toLocaleString()}` : ' · never run'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => load()} className="p-2.5 bg-neutral-950 border border-[#1f2937] hover:border-[#D4AF37]/40 rounded-xl text-slate-400 hover:text-[#D4AF37]">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => sweep()}
            disabled={sweeping !== null}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
          >
            {sweeping === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run full sweep
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-amber-500/5 p-3 text-xs text-amber-200 font-mono">{notice}</div>
      )}

      {/* Score + severity + live snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="bg-neutral-950/85 border border-[#D4AF37]/20 rounded-3xl p-6 flex flex-col items-center justify-center">
          <div className={`text-6xl font-black font-mono ${scoreColor}`}>{score}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono mt-2">Compliance score</div>
          <div className="text-[10px] text-slate-500 mt-1">100 − weighted open findings</div>
        </div>

        <div className="lg:col-span-2 bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Scale className="h-4 w-4 text-[#D4AF37]" /> Open findings by severity</h3>
          <div className="grid grid-cols-4 gap-3">
            {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
              <button key={sev} onClick={() => setSevFilter(sevFilter === sev ? 'all' : sev)}
                className={`rounded-2xl border p-4 text-left transition-all ${SEV_STYLE[sev]} ${sevFilter === sev ? 'ring-2 ring-[#D4AF37]/50' : ''}`}>
                <div className="text-2xl font-black font-mono">{data?.bySeverity?.[sev] ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wider font-mono mt-1">{sev}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-[#D4AF37]" /> Live practice</h3>
          {snapshot ? (
            <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
              <div className="flex justify-between"><span className="text-slate-500">clients</span><span>{snapshot.contacts}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">engagements</span><span>{snapshot.deals}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">documents</span><span>{snapshot.documents}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">open tasks</span><span>{snapshot.openTasks}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">queued sends</span><span>{snapshot.queuedSends}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">active flows</span><span>{snapshot.activeWorkflows}</span></div>
              <div className="flex justify-between text-red-300"><span className="text-slate-500">critical</span><span>{snapshot.criticalFindings}</span></div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 font-mono">Waiting for the live stream…</p>
          )}
        </div>
      </div>

      {/* Agent roster */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#D4AF37]" /> Specialist agent roster
          <span className="text-[10px] font-mono text-slate-500">({data?.agents.length ?? 0} agents)</span>
        </h2>
        {loading ? (
          <p className="text-xs text-slate-500 font-mono">Loading roster…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(data?.agents || []).map((a) => (
              <div key={a.agent_key}
                className={`bg-neutral-950/80 border rounded-2xl p-5 transition-all ${a.open_findings > 0 ? 'border-amber-500/30' : 'border-[#1f2937]'} ${agentFilter === a.agent_key ? 'ring-2 ring-[#D4AF37]/40' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{a.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mt-0.5">{a.domain} · {a.cadence}</div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-black font-mono px-2 py-1 rounded-lg border ${a.open_findings > 0 ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                    {a.open_findings > 0 ? `${a.open_findings} open` : 'clear'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">{a.authority}</p>
                <div className="flex items-center justify-between mt-4 text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {a.last_run_at ? `${new Date(a.last_run_at).toLocaleTimeString()} · ${a.last_duration_ms}ms` : 'never run'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAgentFilter(agentFilter === a.agent_key ? 'all' : a.agent_key)} className="hover:text-[#D4AF37]">
                      <Filter className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => sweep(a.agent_key)} disabled={sweeping !== null} className="hover:text-[#D4AF37] disabled:opacity-40">
                      {sweeping === a.agent_key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Findings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#D4AF37]" /> Findings
            <span className="text-[10px] font-mono text-slate-500">({findings.length} shown)</span>
          </h2>
          {(sevFilter !== 'all' || agentFilter !== 'all') && (
            <button onClick={() => { setSevFilter('all'); setAgentFilter('all'); }} className="text-[11px] text-[#D4AF37] hover:underline">Clear filters</button>
          )}
        </div>

        {findings.length === 0 ? (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-sm text-emerald-200 mt-3 font-semibold">No open findings</p>
            <p className="text-xs text-slate-400 mt-1">Run a sweep to re-verify all {data?.chief.supervises ?? 20} domains against current data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {findings.map((f) => (
              <div key={f.id} className="bg-neutral-950/80 border border-[#1f2937] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded-lg border ${SEV_STYLE[f.severity]}`}>{f.severity}</span>
                      <span className="text-[10px] font-mono text-slate-500">{f.agent_key}</span>
                      {f.status === 'waived' && <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-lg border border-slate-600 text-slate-400">waived</span>}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2">{f.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{f.detail}</p>
                    <p className="text-[11px] text-emerald-300/80 mt-2 leading-relaxed"><strong>Fix:</strong> {f.remediation}</p>
                    <p className="text-[10px] text-slate-600 font-mono mt-2">{f.authority} · first seen {new Date(f.first_seen).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {f.deep_link && (
                      <button onClick={() => navigate(f.deep_link.replace(/^#/, ''))}
                        className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        Open <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                    <button onClick={() => act(f.id, 'resolved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Resolve
                    </button>
                    <button onClick={() => act(f.id, 'waived')}
                      className="px-3 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/30 text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Waive
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence exports */}
      <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileArchive className="h-4 w-4 text-[#D4AF37]" /> Audit-ready evidence bundle</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Agent roster, sweep history, full findings register, executed agreements with hashes,
              vault inventory, preparer credentials, digest delivery log and the audit trail — one signed text record.
            </p>
          </div>
          <button onClick={buildEvidence} disabled={exporting}
            className="px-4 py-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-black uppercase tracking-wider disabled:opacity-50 flex items-center gap-2">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileArchive className="h-3.5 w-3.5" />} Generate bundle
          </button>
        </div>
        {exports.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {exports.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 text-[11px] font-mono border-b border-neutral-900 pb-1.5 last:border-0">
                <span className="text-slate-300 truncate">{e.title}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-500">score {e.score} · {e.findings_open} open · {(Number(e.size) / 1024).toFixed(1)} KB</span>
                  <button onClick={() => downloadEvidence(e.id, e.title)} className="text-[#D4AF37] hover:underline flex items-center gap-1">
                    <Download className="h-3 w-3" /> download
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Runs + live activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#D4AF37]" /> Sweep history</h3>
          {(data?.runs || []).length === 0 ? (
            <p className="text-[11px] text-slate-500 font-mono">No sweeps recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {(data?.runs || []).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-[11px] font-mono border-b border-neutral-900 pb-2 last:border-0">
                  <span className="text-slate-400">{new Date(r.started_at).toLocaleString()} · {r.trigger}</span>
                  <span className="text-slate-300">{r.agents_run} agents · +{r.findings_opened} / −{r.findings_resolved} · score {r.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-neutral-950/85 border border-[#D4AF37]/15 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Radio className="h-4 w-4 text-[#D4AF37]" /> Live activity feed</h3>
          {activity.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-mono">{connected ? 'Connected — waiting for events…' : 'Stream offline (sign in with a live backend).'}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activity.map((e, i) => (
                <div key={`${e.created_at}-${i}`} className="text-[11px] font-mono flex justify-between gap-3 border-b border-neutral-900 pb-1.5 last:border-0">
                  <span className="text-slate-300 truncate">{ACTIVITY_LABELS[e.action] || e.action} <span className="text-slate-500">{e.resource}</span></span>
                  <span className="text-slate-600 shrink-0">{new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
