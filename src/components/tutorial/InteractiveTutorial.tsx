import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, X, ChevronLeft, ChevronRight, CheckCircle2,
  Sparkles, BookOpen, Trophy, Lightbulb, MousePointerClick, Map
} from 'lucide-react';
import {
  TUTORIAL_STEPS, TUTORIAL_CHAPTERS, loadTutorialProgress,
  saveTutorialProgress, TutorialProgress
} from '../../utils/tutorialSteps';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function InteractiveTutorial({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<TutorialProgress>(loadTutorialProgress);
  const [showChapters, setShowChapters] = useState(false);
  const [celebration, setCelebration] = useState(false);

  const step = TUTORIAL_STEPS.find(s => s.id === progress.currentStep) || TUTORIAL_STEPS[0];
  const total = TUTORIAL_STEPS.length;
  const pct = Math.round((progress.completedSteps.length / total) * 100);
  const chapter = TUTORIAL_CHAPTERS.find(c => step.id >= c.range[0] && step.id <= c.range[1]);

  const persist = useCallback((p: TutorialProgress) => {
    setProgress(p);
    saveTutorialProgress(p);
  }, []);

  // Navigate the app to the step's route whenever the step changes while open
  useEffect(() => {
    if (open && step) navigate(step.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, progress.currentStep]);

  const goTo = (id: number) => {
    const clamped = Math.max(1, Math.min(total, id));
    const completed = progress.completedSteps.includes(progress.currentStep)
      ? progress.completedSteps
      : [...progress.completedSteps, progress.currentStep];
    persist({ ...progress, currentStep: clamped, completedSteps: completed });
    setShowChapters(false);
  };

  const next = () => {
    if (progress.currentStep >= total) {
      const done = { ...progress, completedSteps: TUTORIAL_STEPS.map(s => s.id), completedAt: new Date().toISOString() };
      persist(done);
      setCelebration(true);
      return;
    }
    goTo(progress.currentStep + 1);
  };

  const prev = () => goTo(progress.currentStep - 1);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, progress.currentStep]);

  if (!open) return null;

  if (celebration) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="bg-gradient-to-b from-neutral-950 to-neutral-900 border-2 border-[#D4AF37]/40 rounded-3xl shadow-2xl max-w-lg w-full p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.15),transparent_60%)]" />
          <Trophy className="h-16 w-16 text-[#D4AF37] mx-auto mb-4 relative" />
          <h2 className="text-2xl font-black text-white font-serif relative">Certification Complete</h2>
          <p className="text-[#D4AF37] font-bold text-sm mt-1 relative">All 72 steps · Every module mastered</p>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed relative">
            You've completed the full Tax Pro Hub University platform walkthrough — CRM, Tax Intelligence,
            Document OCR, Campaigns, Funnels, AI Agents, Video, Payouts, and Compliance.
            The Help Center holds the written manuals whenever you need a reference.
          </p>
          <div className="flex gap-3 mt-8 relative">
            <button
              onClick={() => { setCelebration(false); persist({ ...progress, currentStep: 1 }); }}
              className="flex-1 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-slate-300 font-bold text-sm hover:text-white transition-all"
            >
              Restart Tutorial
            </button>
            <button
              onClick={() => { setCelebration(false); onClose(); navigate('/dashboard'); }}
              className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl text-sm active:scale-95 transition-all"
            >
              Start Operating 🏆
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chapter picker drawer */}
      {showChapters && (
        <div className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowChapters(false)}>
          <div className="bg-neutral-950 border border-amber-500/25 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white font-serif flex items-center gap-2">
                <Map className="h-5 w-5 text-[#D4AF37]" /> Tutorial Chapters
              </h3>
              <button onClick={() => setShowChapters(false)} className="p-1.5 hover:bg-neutral-900 rounded-lg text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TUTORIAL_CHAPTERS.map(ch => {
                const stepsInChapter = TUTORIAL_STEPS.filter(s => s.id >= ch.range[0] && s.id <= ch.range[1]);
                const doneCount = stepsInChapter.filter(s => progress.completedSteps.includes(s.id)).length;
                const isCurrent = step.id >= ch.range[0] && step.id <= ch.range[1];
                return (
                  <button
                    key={ch.name}
                    onClick={() => goTo(ch.range[0])}
                    className={`text-left rounded-2xl border p-4 transition-all ${isCurrent ? 'bg-amber-500/10 border-amber-500/40' : 'bg-neutral-900/40 border-neutral-800 hover:border-amber-500/25'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ch.icon}</span>
                      <span className="text-xs font-black text-white">{ch.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[10px] text-slate-500 font-mono">Steps {ch.range[0]}–{ch.range[1]}</span>
                      <span className={`text-[10px] font-black ${doneCount === stepsInChapter.length ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {doneCount}/{stepsInChapter.length} {doneCount === stepsInChapter.length && '✓'}
                      </span>
                    </div>
                    <div className="h-1 bg-neutral-800 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all" style={{ width: `${(doneCount / stepsInChapter.length) * 100}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main tutorial card — docked bottom-right, page stays interactive */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[460px] z-[98]">
        <div className="bg-gradient-to-b from-neutral-950 to-neutral-900 border-2 border-[#D4AF37]/30 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-neutral-900">
            <div className="h-full bg-gradient-to-r from-amber-600 via-[#D4AF37] to-yellow-400 transition-all duration-500" style={{ width: `${(step.id / total) * 100}%` }} />
          </div>

          {/* Header */}
          <div className="px-5 pt-4 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/25 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest font-mono truncate">
                  {chapter?.icon} {step.chapter}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Step {step.id} of {total} · {pct}% complete</div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setShowChapters(true)} title="Chapters" className="p-2 hover:bg-neutral-800 rounded-xl text-slate-400 hover:text-[#D4AF37] transition-colors">
                <BookOpen className="h-4 w-4" />
              </button>
              <button onClick={() => { persist({ ...progress, dismissed: true }); onClose(); }} title="Close (progress saved)" className="p-2 hover:bg-neutral-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4 max-h-[42vh] overflow-y-auto">
            <h3 className="text-base font-black text-white leading-snug">{step.title}</h3>
            <p className="text-[12.5px] text-slate-300 leading-relaxed mt-2.5">{step.body}</p>

            {step.action && (
              <div className="mt-3.5 flex items-start gap-2.5 bg-emerald-500/8 border border-emerald-500/25 rounded-xl p-3">
                <MousePointerClick className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Try it now</div>
                  <p className="text-[11.5px] text-emerald-100/90 leading-relaxed mt-0.5">{step.action}</p>
                </div>
              </div>
            )}

            {step.proTip && (
              <div className="mt-3 flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/25 rounded-xl p-3">
                <Lightbulb className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Elite Tip</div>
                  <p className="text-[11.5px] text-amber-100/90 leading-relaxed mt-0.5">{step.proTip}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="px-5 pb-4 pt-2 flex items-center justify-between gap-3 border-t border-neutral-800/60">
            <button
              onClick={prev}
              disabled={step.id === 1}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            <div className="flex items-center gap-1">
              {TUTORIAL_CHAPTERS.map(ch => {
                const isCurrent = step.id >= ch.range[0] && step.id <= ch.range[1];
                const chDone = TUTORIAL_STEPS.filter(s => s.id >= ch.range[0] && s.id <= ch.range[1]).every(s => progress.completedSteps.includes(s.id));
                return (
                  <button
                    key={ch.name}
                    onClick={() => goTo(ch.range[0])}
                    title={ch.name}
                    className={`h-1.5 rounded-full transition-all ${isCurrent ? 'w-6 bg-[#D4AF37]' : chDone ? 'w-2 bg-emerald-500' : 'w-2 bg-neutral-700 hover:bg-neutral-600'}`}
                  />
                );
              })}
            </div>

            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl text-xs active:scale-95 transition-all shadow-lg shadow-amber-900/30"
            >
              {step.id === total ? (<><Trophy className="h-4 w-4" /> Finish</>) : (<>Next <ChevronRight className="h-4 w-4" /></>)}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** First-visit launcher: shows a welcome invite for brand-new users. */
export function TutorialWelcomeBanner({ onStart }: { onStart: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const p = loadTutorialProgress();
    if (!p.dismissed && p.completedSteps.length === 0 && !p.completedAt) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[97] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-neutral-950 to-neutral-900 border-2 border-[#D4AF37]/35 rounded-3xl shadow-2xl max-w-xl w-full p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.12),transparent_55%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-500/10 border border-amber-500/35 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-serif">Welcome to Tax Pro Hub University</h2>
              <p className="text-[11px] text-[#D4AF37] font-bold uppercase tracking-widest font-mono">Enterprise Tax Practice Platform</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mt-5">
            You're standing inside a complete tax practice operating system — CRM, on-device document OCR,
            IRS intelligence, drip marketing, AI funnel building, video consultations, and multi-location payouts.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mt-3">
            The <span className="text-white font-bold">interactive tutorial</span> walks you through all of it in
            <span className="text-[#D4AF37] font-black"> 72 guided steps</span> — the tutorial navigates the app for you,
            so every step is live on screen as you read it. Progress saves automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <button
              onClick={() => { const p = loadTutorialProgress(); saveTutorialProgress({ ...p, dismissed: true }); setVisible(false); }}
              className="flex-1 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-slate-300 font-bold text-sm hover:text-white transition-all"
            >
              Explore on my own
            </button>
            <button
              onClick={() => { setVisible(false); onStart(); }}
              className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-xl text-sm active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/40"
            >
              <GraduationCap className="h-5 w-5" /> Start the 72-Step Tutorial
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500 justify-center">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Takes ~25 minutes · Resume anytime from the 🎓 icon in the top bar
          </div>
        </div>
      </div>
    </div>
  );
}
