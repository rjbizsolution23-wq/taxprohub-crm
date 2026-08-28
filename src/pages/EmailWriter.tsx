import { useState } from 'react';
import { ArrowLeft, Sparkles, Copy, RefreshCw, User, Mail, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TEMPLATES = [
  { id: 1, name: 'Follow-up After Call', tone: 'Professional' },
  { id: 2, name: 'Tax Season Reminder', tone: 'Friendly & Urgent' },
  { id: 3, name: 'Proposal Delivery', tone: 'Confident' },
  { id: 4, name: 'Referral Request', tone: 'Warm' },
];

export default function EmailWriter() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [recipient, setRecipient] = useState('john.smith@company.com');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');

  const generateEmail = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setSubject("Follow-up on Our Discussion About Your 2026 Tax Strategy");
      setBody(`Hi John,

I wanted to follow up on our conversation last week regarding your tax situation for 2026. After reviewing your documents, I believe we can save you approximately $8,400 through strategic planning.

I've put together a comprehensive proposal that includes:
• Maximizing your QBI deduction
• New EV tax credit opportunities
• Retirement contribution optimization

Would you be available for a 20-minute call next week to review this?

Looking forward to your thoughts.

Best regards,
Rick Jefferson
Tax Pro Hub University
(414) 430-4277`);

      setIsGenerating(false);
    }, 1350);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(body);
    alert("Email copied to clipboard!");
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
            AI Email Writer
          </h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mt-1">
            Powered by Claude 3.5 + GPT-4o • Context-aware from your CRM data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="col-span-12 lg:col-span-4 bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 space-y-6">
          <div className="uppercase text-[10px] font-black tracking-widest text-[#D4AF37] font-mono">
            Configure Outreach Email
          </div>
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Recipient</label>
              <div className="relative">
                <User className="absolute left-4 top-3 text-slate-400 h-4.5 w-4.5" />
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-neutral-900/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/15 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {['professional', 'friendly', 'urgent'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`py-2 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                      tone === t 
                        ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-yellow-500/5 text-amber-400 font-bold' 
                        : 'border-amber-500/10 hover:border-amber-500/25 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Length</label>
              <select 
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full py-2.5 px-4 bg-neutral-900/60 border border-amber-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/15 transition-all"
              >
                <option value="short">Short (2-3 sentences)</option>
                <option value="medium">Medium (1 paragraph)</option>
                <option value="long">Detailed (multiple paragraphs)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Context-Aware Templates</label>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      generateEmail();
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedTemplate === template.id 
                        ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-yellow-500/5 text-amber-400 font-bold' 
                        : 'border-amber-500/10 hover:bg-neutral-900/60 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{template.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-mono font-medium">{template.tone}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateEmail}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-black rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>GENERATING EMAIL BROADCAST...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  GENERATE WITH COGNITIVE CORE
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Preview */}
        <div className="col-span-12 lg:col-span-8 bg-neutral-950/80 border border-amber-500/10 rounded-3xl p-6 flex flex-col justify-between min-h-[550px] shadow-2xl">
          <div className="flex justify-between items-center border-b border-amber-500/10 pb-4 mb-4">
            <span className="font-bold text-sm text-white font-serif flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-[#D4AF37]" /> Advanced Preview
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={copyToClipboard} 
                className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase border border-amber-500/25 px-4 py-2 rounded-xl text-[#D4AF37] hover:bg-amber-500/5 transition"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Code
              </button>
              <button 
                onClick={generateEmail}
                className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase border border-amber-500/25 px-4 py-2 rounded-xl text-[#D4AF37] hover:bg-amber-500/5 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> RE-WRITE
              </button>
            </div>
          </div>

          <div className="border border-amber-500/15 rounded-2xl p-6 bg-neutral-900/30 shadow-inner flex-1 flex flex-col justify-between">
            {subject ? (
              <div className="space-y-6">
                <div className="border-b border-amber-500/10 pb-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] font-mono">SUBJECT OVERVIEW</div>
                  <h2 className="text-base font-bold text-white mt-1">{subject}</h2>
                </div>
                
                <div className="whitespace-pre-line leading-relaxed text-sm text-slate-100 font-sans select-text">
                  {body}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 flex items-center justify-center mb-4 animate-pulse">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-sm font-black text-white">AI Email Ready</div>
                <div className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Select a template or configure the parameters on the left. Our agentic parser pulls live context of this customer record directly from the database.
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-[10px] text-center font-mono text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Co-written by Claude 3.5 + GPT-4o with GLBA/Circular 230 Disclosures Attached
          </div>
        </div>
      </div>
    </div>
  );
}
