import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Bot } from 'lucide-react';

interface AIPromptBarProps {
  placeholder?: string;
  defaultPrompt?: string;
  moduleName: string;
}

export default function AIPromptBar({ 
  placeholder = "Describe what you want to build (e.g. S-Corp Client Onboarding with automated email reminders)...", 
  defaultPrompt = "",
  moduleName
}: AIPromptBarProps) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(defaultPrompt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    navigate(`/ai?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-950/90 border border-amber-500/20 shadow-[0_0_30px_rgba(212,175,55,0.05)] backdrop-blur-md p-5 group transition-all duration-300 hover:border-amber-500/45 hover:shadow-[0_0_35px_rgba(212,175,55,0.08)]">
      {/* Background glow animations */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-amber-500/10 to-transparent blur-3xl pointer-events-none transition-all duration-500 group-hover:opacity-100" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#D4AF37]/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-neutral-900 to-amber-950/40 rounded-xl border border-amber-500/30 shadow-md group-hover:scale-105 transition-transform duration-300">
            <Bot className="h-5 w-5 text-[#FFD700] animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5 uppercase font-mono">
              Tax Pro Hub University Prompt-to-Build Campaign Engine
              <span className="text-[9px] bg-amber-500/15 border border-amber-500/20 text-[#D4AF37] px-2 py-0.5 rounded-md font-mono tracking-normal normal-case">
                v2.0 Active
              </span>
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Prompt the Unified Architect to synthesize connected {moduleName}, workflows, blogs, and communication sequences automatically.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 relative flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors duration-200">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/95 hover:bg-neutral-900/100 focus:bg-neutral-900 border border-neutral-800 focus:border-amber-500/50 rounded-xl text-xs text-white placeholder-slate-500 font-semibold focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(212,175,55,0.06)]"
          />
        </div>
        <button
          type="submit"
          disabled={!prompt.trim()}
          className="flex items-center gap-1.5 px-6 py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 disabled:from-neutral-900 disabled:to-neutral-900 disabled:text-slate-500 text-black font-black rounded-xl text-xs transition-all duration-300 disabled:border disabled:border-neutral-800 disabled:shadow-none hover:shadow-lg active:scale-95 disabled:pointer-events-none"
        >
          <span>Compile Asset</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
