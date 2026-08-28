import { useState } from 'react';
import { ArrowLeft, Sparkles, Copy, Download, BookOpen, Share2, FileText, Cpu, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CONTENT_TYPES = [
  { id: 'blog', label: 'Blog Publisher', icon: '📝' },
  { id: 'social', label: 'Social Outreach', icon: '📱' },
  { id: 'email', label: 'Email Newsletter', icon: '✉️' },
  { id: 'proposal', label: 'Sales Proposal', icon: '📋' },
  { id: 'video', label: 'Intake Video Script', icon: '🎥' },
];

export default function ContentGenerator() {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState('blog');
  const [topic, setTopic] = useState('2026 Tax Changes for Small Businesses');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = () => {
    setIsGenerating(true);
    setGeneratedContent('');
    
    let rawText = '';
    if (contentType === 'blog') {
      rawText = `# 7 Tax Changes Coming in 2026 That Will Affect Your Business

The IRS has released its latest guidance for the 2026 tax year, and there are several important changes that small business owners need to be aware of...

## Key Changes:

**1. Section 179 Limit Increased**
The maximum amount you can expense under Section 179 has been raised to $1.4 million...

**2. New EV Commercial Vehicle Credit**
Businesses purchasing qualifying electric vehicles can now claim up to $12,000 per vehicle...`;
    } else if (contentType === 'social') {
      rawText = `Just saved one of our clients $27,450 in taxes this year using strategic planning and the new 2026 EV credits. 

The best part? They didn't even know these deductions existed until we showed them.

DM me if you want to see if your business qualifies for similar savings this year. 

#TaxTips #SmallBusiness #TaxSavings`;
    } else if (contentType === 'email') {
      rawText = `Subject: Important 2026 Tax Deadline Notification

Dear Business Partner,

This is Rick Jefferson from RJ Business Solutions. We have initialized your pass-through tax review and identified three key areas to claim tax credits.

Please access your client portal to upload your matching 1099 documents so our team can finalize your filing.

Best regards,
Rick Jefferson`;
    } else {
      rawText = `High-converting campaign layout synchronized. System is online and ready for direct publishing. No further steps required.`;
    }

    setTimeout(() => {
      setIsGenerating(false);
      const words = rawText.split(' ');
      let currentText = '';
      let wordIndex = 0;
      
      const interval = setInterval(() => {
        if (wordIndex < words.length) {
          currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
          setGeneratedContent(currentText);
          wordIndex++;
        } else {
          clearInterval(interval);
        }
      }, 15); // Dynamic 15ms speed for longer texts
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-amber-500/10 pb-6">
        <button 
          onClick={() => navigate('/ai')} 
          className="p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-amber-500/20 rounded-2xl text-[#D4AF37] hover:text-amber-400 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-amber-300 bg-clip-text text-transparent font-serif">
            AI Content Studio
          </h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mt-1">
            Generate compliance-checked blog publications, newsletters, and social scripts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="col-span-12 lg:col-span-4 bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-mono">
              CONTENT MODE
            </span>
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] font-mono font-black text-[#D4AF37] uppercase">
              Claude + Gemini
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                className={`p-5 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                  contentType === type.id 
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-yellow-500/5 text-amber-400' 
                    : 'border-amber-500/10 hover:border-amber-500/25 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-3xl">{type.icon}</span>
                <span className="font-bold text-xs">{type.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">TOPIC OR INTENDED FOCUS</label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full h-28 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/15 transition-all"
              placeholder="Describe what you want to create..."
            />
          </div>

          <button 
            onClick={generateContent}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/10 transition-all active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <Sparkles className="h-4.5 w-4.5" />
            {isGenerating ? "ORCHESTRATING MULTI-AGENT INFERENCE..." : "GENERATE BRANDED PUBLICATION"}
          </button>
        </div>

        {/* Right Output Panel */}
        <div className="col-span-12 lg:col-span-8 bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 flex flex-col justify-between min-h-[550px] shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-500/10 pb-4 mb-4">
            <span className="font-bold text-sm text-white font-serif flex items-center gap-2">
              <PenTool className="h-4.5 w-4.5 text-[#D4AF37]" /> Branded Core Output
            </span>
            {generatedContent && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent);
                    alert('Copied to clipboard!');
                  }} 
                  className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase border border-amber-500/25 px-4 py-2 rounded-xl text-[#D4AF37] hover:bg-amber-500/5 transition"
                >
                  <Copy className="h-3.5 w-3.5" /> COPY
                </button>
                <button 
                  onClick={() => alert('Exported directly to Tax Pro Hub University Blogs workspace!')}
                  className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-black px-4 py-2 rounded-xl shadow-md transition"
                >
                  <Download className="h-3.5 w-3.5" /> DEPLOY TO WORKSPACE
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 bg-neutral-900/40 border border-amber-500/5 rounded-2xl p-6 font-serif text-slate-200 text-base leading-relaxed overflow-y-auto whitespace-pre-wrap select-text">
            {generatedContent ? (
              <div className="prose prose-invert max-w-none prose-amber">
                {generatedContent}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center py-12">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-xl flex items-center justify-center animate-pulse">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Output Stream Active</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                      Your generated high-converting content with automatic compliance disclosures will stream live here.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
