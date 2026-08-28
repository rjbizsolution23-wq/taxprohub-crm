/**
 * 🧞 FUNNEL GENIE — LLM Funnel Architect + Instant Draft fallback
 *
 * PRIMARY: Live LLM Architect — 4-stage generative pipeline (strategy →
 * per-page forge → campaign → validation gate). Every funnel is UNIQUE:
 * bespoke strategy, unique long-form copy per page, proper multi-page chain
 * with linked CTAs, and an 8-point quality gate that FAILS cheap output.
 *
 * FALLBACK: Instant Draft (template intelligence, zero-key) when no LLM
 * endpoint is configured — clearly labeled as a draft, never passed off
 * as generative output.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wand2, Sparkles, Palette, Mail, MessageSquare, Rocket, CheckCircle2,
  XCircle, Eye, Layers, Zap, ArrowRight, Monitor, Smartphone, BrainCircuit,
  ShieldCheck, Link2, AlertTriangle, Settings, Gauge,
} from 'lucide-react';
import { generateFunnelBlueprint } from '../utils/funnelIntelligence';
import {
  generateLLMFunnel, resolveEndpoints,
  type ArchitectedFunnel,
} from '../utils/funnelArchitect';
import { useAppStore } from '../store';
import type { Funnel, Campaign, FunnelStep } from '../types';

const EXAMPLES = [
  'Self-employed tax credit campaign for "Iron Route Logistics" trucking company — navy and safety orange, book a call',
  'Tax credit campaign for "Fade Kings" barbershop — black and red brand',
  'Credit repair launch for "Rise Credit Co" — purple and gold, book a call',
  'Maximum refund tax season push for a daycare, teal brand colors',
];

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

type EngineMode = 'llm' | 'draft';

interface GenState {
  stage: string;
  pct: number;
  detail?: string;
}

export default function FunnelGenie() {
  const navigate = useNavigate();
  const { addFunnel, addCampaign, addNotification, currentSubAccount } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [gen, setGen] = useState<GenState>({ stage: '', pct: 0 });
  const [funnel, setFunnel] = useState<ArchitectedFunnel | null>(null);
  const [engineUsed, setEngineUsed] = useState<EngineMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState(0);
  const [mobileView, setMobileView] = useState(false);
  const [deployed, setDeployed] = useState<{ funnelId: string; campaignId: string } | null>(null);

  const endpoints = useMemo(() => resolveEndpoints(), []);
  const llmAvailable = endpoints.length > 0;

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setFunnel(null);
    setDeployed(null);
    setError(null);

    if (llmAvailable) {
      // ── PRIMARY: Live LLM Architect ─────────────────────────────────────
      try {
        const result = await generateLLMFunnel(prompt, {
          fallbackBusinessName: currentSubAccount?.businessName,
          onProgress: (stage, pct, detail) => setGen({ stage, pct, detail }),
        });
        setFunnel(result);
        setEngineUsed('llm');
        setActivePreview(0);
        setGenerating(false);
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`LLM Architect failed (${msg.slice(0, 140)}). Falling back to Instant Draft.`);
      }
    }

    // ── FALLBACK: Instant Draft (template intelligence) ───────────────────
    setGen({ stage: 'Compiling Instant Draft (no LLM configured)…', pct: 60 });
    await new Promise((r) => setTimeout(r, 500));
    const bp = generateFunnelBlueprint(prompt, currentSubAccount?.businessName);
    const draft: ArchitectedFunnel = {
      strategy: {
        businessName: bp.businessName,
        vertical: bp.vertical,
        offer: bp.offer,
        audience: `${bp.vertical} operators`,
        bigIdea: bp.headline,
        angle: bp.urgency,
        palette: {
          primary: bp.palette.primary, secondary: bp.palette.secondary,
          accent: bp.palette.accent, background: bp.palette.dark, textOnDark: '#FFFFFF',
        },
        fonts: { heading: 'Playfair Display, serif', body: 'Inter, sans-serif' },
        voice: 'Confident, direct-response',
        pages: bp.steps.map((s, i) => ({
          slug: s.path, title: s.name, purpose: s.type, keyElements: [],
          ctaLabel: bp.cta, nextSlug: bp.steps[i + 1]?.path ?? null,
        })),
      },
      pages: bp.steps.map((s) => ({
        slug: s.path, title: s.name, purpose: s.type, html: s.html,
        wordCount: s.html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length, sections: 0,
      })),
      campaign: {
        emails: [{ day: 0, subject: bp.emailCampaign.subject, preheader: bp.emailCampaign.preheader, body: bp.emailCampaign.body }],
        sms: [{ day: 0, message: bp.smsCampaign }],
      },
      validation: {
        checks: [{ name: 'Instant Draft mode', pass: true, detail: 'Template-compiled draft — connect an LLM key in Settings for fully generative unique funnels' }],
        passed: true, score: 0, uniquenessPct: 0,
      },
      provider: 'Instant Draft (template intelligence)',
      model: 'on-device',
      totalLatencyMs: 500,
      llmCalls: 0,
    };
    setFunnel(draft);
    setEngineUsed('draft');
    setActivePreview(0);
    setGenerating(false);
  };

  const deploy = () => {
    if (!funnel) return;
    const now = new Date();
    const funnelId = uid('funnel');
    const stepType = (slug: string, i: number): FunnelStep['type'] =>
      /thank/i.test(slug) ? 'thankyou' : /book|intake|capture|apply|checkout/i.test(slug) ? 'checkout' : i === 0 ? 'landing' : 'custom';

    const funnelRecord: Funnel = {
      id: funnelId,
      name: `${funnel.strategy.businessName} — ${funnel.strategy.offer.slice(0, 60)}`,
      steps: funnel.pages.map((p, i) => ({
        id: uid('step'), name: p.title, type: stepType(p.slug, i),
        path: p.slug, content: p.html, position: i,
      })),
      published: false,
      stats: { views: 0, conversions: 0, conversionRate: 0, revenue: 0 },
      createdAt: now, updatedAt: now,
    };
    addFunnel(funnelRecord);

    const campaignId = uid('cmp');
    const emailBlock = funnel.campaign.emails
      .map((e) => `── EMAIL (Day ${e.day}) ──\nSubject: ${e.subject}\nPreheader: ${e.preheader}\n\n${e.body}`)
      .join('\n\n');
    const smsBlock = funnel.campaign.sms.map((s) => `── SMS (Day ${s.day}) ──\n${s.message}`).join('\n\n');
    addCampaign({
      id: campaignId,
      name: `${funnel.strategy.businessName} — Nurture Sequence`,
      type: 'both', status: 'draft',
      subject: funnel.campaign.emails[0]?.subject || '',
      content: `${emailBlock}\n\n${smsBlock}`,
      recipientCount: 0, sentCount: 0, openedCount: 0, clickedCount: 0,
      createdAt: now,
    } as Campaign);

    addNotification({
      id: uid('ntf'), type: 'success',
      title: engineUsed === 'llm' ? 'LLM-Architected Funnel Deployed' : 'Draft Funnel Deployed',
      message: `"${funnelRecord.name}" — ${funnel.pages.length}-page chain + ${funnel.campaign.emails.length}-email nurture saved to CRM.`,
      read: false, createdAt: now,
    });
    setDeployed({ funnelId, campaignId });
  };

  const v = funnel?.validation;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-amber-500/10 border border-fuchsia-500/40 grid place-items-center">
            <BrainCircuit className="w-5 h-5 text-fuchsia-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              Funnel Genie — LLM Architect
            </h1>
            <p className="text-sm text-gray-400">4-stage generative pipeline: bespoke strategy → unique page forge → nurture campaign → quality gate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {llmAvailable ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <BrainCircuit className="w-3 h-3" /> LLM Live: {endpoints[0].name}
            </span>
          ) : (
            <button onClick={() => navigate('/settings')}
              className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 hover:bg-amber-500/20 transition">
              <Settings className="w-3 h-3" /> No LLM key — Instant Draft mode. Configure →
            </button>
          )}
        </div>
      </div>

      {/* Pipeline strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: BrainCircuit, title: 'Stage 1 — Strategy', sub: 'LLM designs bespoke audience, angle, brand system & page chain' },
          { icon: Layers, title: 'Stage 2 — Page Forge', sub: 'Dedicated LLM call per page: unique long-form copy & design' },
          { icon: Mail, title: 'Stage 3 — Campaign', sub: '3-email nurture + SMS follow-ups in the funnel voice' },
          { icon: ShieldCheck, title: 'Stage 4 — Quality Gate', sub: '8-point validation: chain links, uniqueness, no thin pages' },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-4">
            <c.icon className="w-4 h-4 text-fuchsia-400 mb-2" />
            <div className="text-sm font-semibold text-white">{c.title}</div>
            <div className="text-xs text-gray-500">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Prompt console */}
      <div className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6">
        <label className="text-xs uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Describe the funnel you want
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(); }}
          placeholder={`e.g. "${EXAMPLES[0]}"`}
          rows={3}
          className="w-full rounded-2xl bg-black/40 border border-white/15 p-4 text-white placeholder-gray-600 text-sm outline-none focus:border-amber-500/60 resize-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.slice(0, 3).map((ex, i) => (
              <button key={i} onClick={() => setPrompt(ex)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-400 hover:text-white hover:border-amber-500/40 transition">
                {ex.length > 56 ? ex.slice(0, 56) + '…' : ex}
              </button>
            ))}
          </div>
          <button onClick={generate} disabled={generating || !prompt.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm shadow-lg shadow-amber-500/30 hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> {llmAvailable ? 'Architect Unique Funnel' : 'Generate Instant Draft'}
          </button>
        </div>

        {/* Live pipeline progress */}
        {generating && (
          <div className="mt-5 rounded-2xl bg-black/40 border border-fuchsia-500/25 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-fuchsia-400 animate-pulse" />
              <span className="text-sm text-white font-semibold">{gen.stage}</span>
            </div>
            {gen.detail && <div className="text-xs text-gray-400 pl-7 italic">“{gen.detail}”</div>}
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-fuchsia-500 via-amber-500 to-yellow-400 transition-all duration-500" style={{ width: `${gen.pct}%` }} />
            </div>
            <div className="text-[11px] text-gray-500">
              {llmAvailable
                ? 'Each page is a dedicated LLM generation — a full 4-page funnel takes 3–6 minutes. Worth it.'
                : 'Compiling draft…'}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 flex items-start gap-2 text-red-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-none mt-0.5" /> {error}
          </div>
        )}
      </div>

      {/* Result */}
      {funnel && !generating && (
        <div className="space-y-5">
          {/* Engine + validation banner */}
          <div className={`rounded-3xl border backdrop-blur-xl p-5 ${
            engineUsed === 'llm'
              ? (v?.passed ? 'bg-gradient-to-r from-emerald-500/10 via-white/[0.03] to-transparent border-emerald-500/30' : 'bg-gradient-to-r from-amber-500/10 via-white/[0.03] to-transparent border-amber-500/40')
              : 'bg-gradient-to-r from-slate-500/10 via-white/[0.03] to-transparent border-slate-500/30'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl grid place-items-center shadow-lg ${engineUsed === 'llm' ? 'bg-gradient-to-br from-fuchsia-500 to-purple-700 shadow-fuchsia-500/25' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
                  {engineUsed === 'llm' ? <BrainCircuit className="w-7 h-7 text-white" /> : <Layers className="w-7 h-7 text-white" />}
                </div>
                <div>
                  <div className="text-white font-bold text-lg flex items-center gap-2 flex-wrap">
                    {funnel.strategy.businessName} — {funnel.strategy.offer.length > 50 ? funnel.strategy.offer.slice(0, 50) + '…' : funnel.strategy.offer}
                    {engineUsed === 'llm'
                      ? <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-semibold">LLM-ARCHITECTED · UNIQUE</span>
                      : <span className="px-2 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-300 text-[10px] font-semibold">INSTANT DRAFT</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {funnel.provider} · {funnel.model} · {funnel.llmCalls} LLM calls · {(funnel.totalLatencyMs / 1000).toFixed(1)}s ·
                    Chain: {funnel.pages.map((p) => p.slug).join(' → ')}
                  </div>
                </div>
              </div>
              {engineUsed === 'llm' && v && (
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className={`text-2xl font-black ${v.passed ? 'text-emerald-400' : 'text-amber-400'}`}>{v.score}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Gate Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-fuchsia-400">{v.uniquenessPct}%</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Unique</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left rail */}
            <div className="lg:col-span-2 space-y-4">
              {/* Strategy brief */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5 space-y-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-fuchsia-400" /> Bespoke Strategy
                </h3>
                {[
                  ['Audience', funnel.strategy.audience],
                  ['Big Idea', funnel.strategy.bigIdea],
                  ['Angle / Mechanism', funnel.strategy.angle],
                  ['Voice', funnel.strategy.voice],
                ].map(([k, val]) => (
                  <div key={k}>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">{k}</div>
                    <div className="text-xs text-gray-200 leading-relaxed">{val}</div>
                  </div>
                ))}
              </div>

              {/* Page chain */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
                <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
                  <Link2 className="w-4 h-4 text-amber-400" /> Funnel Chain — {funnel.pages.length} Pages
                </h3>
                <div className="space-y-2">
                  {funnel.pages.map((p, i) => (
                    <button key={p.slug} onClick={() => setActivePreview(i)}
                      className={`w-full text-left rounded-xl border p-3 transition ${activePreview === i ? 'bg-amber-500/10 border-amber-500/40' : 'bg-black/30 border-white/10 hover:border-white/25'}`}>
                      <div className="flex items-center gap-2.5">
                        <span className="flex-none w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 text-black grid place-items-center text-[11px] font-black">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white truncate">{p.title}</div>
                          <div className="text-[10px] text-gray-500 truncate">{p.slug} · {p.wordCount} words · {(p.html.length / 1024).toFixed(1)}KB</div>
                        </div>
                        {i < funnel.pages.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-gray-600 flex-none" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Validation gate report */}
              {engineUsed === 'llm' && v && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
                    <Gauge className="w-4 h-4 text-emerald-400" /> Quality Gate — {v.checks.filter((c) => c.pass).length}/{v.checks.length} Passed
                  </h3>
                  <div className="space-y-2">
                    {v.checks.map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {c.pass
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-none mt-0.5" />
                          : <XCircle className="w-3.5 h-3.5 text-red-400 flex-none mt-0.5" />}
                        <div>
                          <div className="text-xs text-white font-medium">{c.name}</div>
                          <div className="text-[10px] text-gray-500">{c.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Palette */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5">
                <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-amber-400" /> Brand System
                </h3>
                <div className="flex gap-2">
                  {(Object.entries(funnel.strategy.palette) as [string, string][]).map(([k, hex]) => (
                    <div key={k} className="flex-1 text-center">
                      <div className="h-12 rounded-xl border border-white/15" style={{ background: hex }} />
                      <div className="text-[9px] text-gray-500 mt-1 uppercase">{k.replace('textOnDark', 'text')}</div>
                      <div className="text-[9px] text-gray-400 font-mono">{hex}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaign */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5 space-y-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" /> Nurture Campaign — {funnel.campaign.emails.length} Emails · {funnel.campaign.sms.length} SMS
                </h3>
                {funnel.campaign.emails.map((e, i) => (
                  <details key={i} className="rounded-xl bg-black/40 border border-white/10 p-3">
                    <summary className="text-xs text-white font-semibold cursor-pointer">Day {e.day}: {e.subject}</summary>
                    <div className="text-[10px] text-gray-500 mt-1">Preheader: {e.preheader}</div>
                    <pre className="text-[11px] text-gray-400 whitespace-pre-wrap mt-2 max-h-40 overflow-auto">{e.body}</pre>
                  </details>
                ))}
                {funnel.campaign.sms.map((s, i) => (
                  <div key={i} className="rounded-xl bg-black/40 border border-white/10 p-3">
                    <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mb-1"><MessageSquare className="w-3 h-3" /> SMS Day {s.day}</div>
                    <div className="text-[11px] text-gray-300">{s.message}</div>
                  </div>
                ))}
              </div>

              {/* Deploy */}
              {!deployed ? (
                <button onClick={deploy}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold shadow-lg shadow-amber-500/30 hover:brightness-110 transition flex items-center justify-center gap-2">
                  <Rocket className="w-5 h-5" /> Deploy {funnel.pages.length}-Page Funnel + Campaign to CRM
                </button>
              ) : (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Deployed to CRM
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => navigate(`/funnels/${deployed.funnelId}`)}
                      className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold flex items-center justify-center gap-1.5">
                      Open Funnel <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => navigate(`/campaigns/${deployed.campaignId}`)}
                      className="py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                      Open Campaign <Mail className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: live page preview */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden sticky top-6">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                  <div className="text-xs text-gray-300 font-semibold truncate pr-4">
                    {funnel.pages[activePreview]?.slug} — {funnel.pages[activePreview]?.title}
                  </div>
                  <div className="flex items-center gap-1.5 flex-none">
                    <button onClick={() => setMobileView(false)}
                      className={`p-2 rounded-lg ${!mobileView ? 'bg-amber-500/20 text-amber-300' : 'text-gray-500 hover:text-white'}`}>
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button onClick={() => setMobileView(true)}
                      className={`p-2 rounded-lg ${mobileView ? 'bg-amber-500/20 text-amber-300' : 'text-gray-500 hover:text-white'}`}>
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="bg-black/40 p-4 flex justify-center">
                  <iframe
                    key={`${activePreview}-${mobileView}`}
                    title="Funnel Page Preview"
                    srcDoc={funnel.pages[activePreview]?.html || ''}
                    className={`rounded-xl border border-white/10 bg-white transition-all ${mobileView ? 'w-[390px]' : 'w-full'}`}
                    style={{ height: '680px' }}
                    sandbox=""
                  />
                </div>
                <div className="px-5 py-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-gray-500">
                  <Eye className="w-3.5 h-3.5" />
                  {engineUsed === 'llm'
                    ? `Uniquely generated page — ${funnel.pages[activePreview]?.wordCount} words of bespoke copy, chain-linked CTA`
                    : 'Instant Draft preview — connect an LLM key for fully generative unique pages'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
