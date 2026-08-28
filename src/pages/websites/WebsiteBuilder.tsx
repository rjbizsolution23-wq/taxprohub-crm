import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash2, Eye, MoveUp, MoveDown, Globe, Laptop, 
  Tablet, Smartphone, RotateCcw, RotateCw, Play, CheckCircle2, AlertTriangle, 
  Settings as SettingsIcon, Image as ImageIcon, Heading as HeadingIcon, Type, 
  MousePointerClick, Star, Sparkles, FormInput, Calendar as CalendarIcon, 
  Layout, Columns, RefreshCw, Layers, Copy, Check, EyeOff, HelpCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

// Pre-built website templates definition
const templates = [
  { id: 'ts-1', name: 'Tax Office Landing', description: 'Local tax firm homepage optimized for Local SEO.' },
  { id: 'ts-2', name: 'Service Bureau Hub', description: 'Central portal for national service bureaus.' },
  { id: 'ts-3', name: 'Multi-Office Firm', description: 'Firm landing page supporting multiple regional branches.' },
  { id: 'ts-4', name: 'Solo Preparer Portfolio', description: 'Personal portfolio landing for single PTIN holder.' },
  { id: 'ts-5', name: 'Credit Repair Service Site', description: 'Consumer dispute resolution agency homepage.' },
  { id: 'ts-6', name: 'Bookkeeper + Tax Combo Site', description: 'Year-round accounting and business tax service portal.' },
  { id: 'ts-7', name: 'Online Tax Prep', description: 'DIY-assist hybrid platform marketing landing page.' },
  { id: 'ts-8', name: 'Coming-Soon / Pre-Launch', description: 'Teaser page with countdown timer and email capturing.' },
  { id: 'ts-9', name: 'Maintenance Mode', description: 'Temporary downtime message with estimated completion timer.' },
  { id: 'ts-10', name: 'Squeeze Page', description: 'High-conversion absolute-minimal email capture page.' }
];

interface Block {
  id: string;
  type: string;
  name: string;
  content: string;
  styles: {
    padding: string;
    margin: string;
    bgColor: string;
    textColor: string;
    accentColor: string;
    fontSize: string;
    alignment: string;
    animation: string;
  };
  elements: { id: string; type: string; content: string; styles?: any }[];
}

export default function WebsiteBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [websiteName, setWebsiteName] = useState('My Firm Official Website');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ts-1');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [pages, setPages] = useState<any[]>([
    { name: 'Home Page', slug: '', type: 'landing' },
    { name: 'About Us', slug: 'about', type: 'custom' },
    { name: 'Contact & Location', slug: 'contact', type: 'custom' }
  ]);
  const [activeTab, setActiveTab] = useState<'blocks' | 'settings' | 'seo'>('blocks');

  // Canvas State containing sections
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: 'b-hero',
      type: 'hero',
      name: 'Hero split-screen panel',
      content: 'Filing returns since 2012',
      styles: {
        padding: 'py-20 px-8',
        margin: 'mb-0',
        bgColor: 'bg-neutral-950',
        textColor: 'text-white',
        accentColor: '#D4AF37',
        fontSize: 'text-4xl font-extrabold font-serif',
        alignment: 'text-center',
        animation: 'fade-in'
      },
      elements: [
        { id: 'sh-1', type: 'heading', content: 'Modern Tax Prep & Multi-Service Firm' },
        { id: 'sh-2', type: 'paragraph', content: 'Providing security-hardened bookkeeping, credit repair and IRS services. Registered PTIN and EFIN credentials.' },
        { id: 'sh-3', type: 'button', content: 'Book consultation appointment' }
      ]
    }
  ]);

  const [selectedBlockId, setSelectedBlockId] = useState<string>('b-hero');
  const [history, setHistory] = useState<Block[][]>([[...blocks]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // SEO states
  const [seoTitle, setSeoTitle] = useState('My Firm Official Website');
  const [seoDescription, setSeoDescription] = useState('Trusted tax preparation, bookkeeping, and credit repair services.');
  const [seoOgImage, setSeoOgImage] = useState('https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg');

  // Trigger state update & push history
  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const handleTemplateSelect = (tempId: string) => {
    setSelectedTemplate(tempId);
    const template = templates.find(t => t.id === tempId);
    if (template) {
      setWebsiteName(template.name);
      setBlocks([
        {
          id: 'b-site-hero-temp',
          type: 'hero',
          name: 'Premium Site Header',
          content: `${template.name} - Welcome`,
          styles: {
            padding: 'py-20 px-8',
            margin: 'mb-0',
            bgColor: 'bg-neutral-950',
            textColor: 'text-white',
            accentColor: '#D4AF37',
            fontSize: 'text-4xl font-extrabold font-serif',
            alignment: 'text-center',
            animation: 'fade-in'
          },
          elements: [
            { id: 'sh-temp-1', type: 'heading', content: template.name },
            { id: 'sh-temp-2', type: 'paragraph', content: 'Providing security-hardened bookkeeping, credit repair and IRS services. Built for professional firms.' },
            { id: 'sh-temp-3', type: 'button', content: 'View Services' }
          ]
        }
      ]);
      setSelectedBlockId('b-site-hero-temp');
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setPublishUrl(`https://myvirtualtax-site-${Math.random().toString(36).substring(2, 6)}.pages.dev`);
    setIsPublishing(false);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || blocks[0];

  const updateSelectedBlockStyle = (styleKey: string, value: string) => {
    const updated = blocks.map(b => {
      if (b.id === selectedBlockId) {
        return {
          ...b,
          styles: {
            ...b.styles,
            [styleKey]: value
          }
        };
      }
      return b;
    });
    updateBlocks(updated);
  };

  const updateSelectedBlockElement = (elemId: string, value: string) => {
    const updated = blocks.map(b => {
      if (b.id === selectedBlockId) {
        return {
          ...b,
          elements: b.elements.map(e => e.id === elemId ? { ...e, content: value } : e)
        };
      }
      return b;
    });
    updateBlocks(updated);
  };

  const addBlockToCanvas = (type: string) => {
    let newBlock: Block;
    const randomId = 'b-' + Math.random().toString(36).substring(2, 7);
    
    switch (type) {
      case 'pricing':
        newBlock = {
          id: randomId,
          type: 'pricing',
          name: 'Premium Pricing Table',
          content: 'Choose Your Program Tier',
          styles: {
            padding: 'py-20 px-8',
            margin: 'mb-0',
            bgColor: 'bg-neutral-950',
            textColor: 'text-white',
            accentColor: '#D4AF37',
            fontSize: 'text-3xl font-bold font-serif',
            alignment: 'text-center',
            animation: 'scale-up'
          },
          elements: [
            { id: randomId + '-h', type: 'heading', content: 'Filing & Bookkeeping Plans' },
            { id: randomId + '-p1', type: 'paragraph', content: 'Filing only: $149 | Continuous Retainer: $350 / month' }
          ]
        };
        break;
      case 'testimonials':
        newBlock = {
          id: randomId,
          type: 'testimonials',
          name: 'Spotlight Testimonials Carousel',
          content: 'Client Endorsements',
          styles: {
            padding: 'py-16 px-6',
            margin: 'mb-0',
            bgColor: 'bg-neutral-900',
            textColor: 'text-white',
            accentColor: '#D4AF37',
            fontSize: 'text-2xl font-semibold italic font-serif',
            alignment: 'text-center',
            animation: 'fade-in'
          },
          elements: [
            { id: randomId + '-h', type: 'heading', content: 'Firm Reviews' },
            { id: randomId + '-q', type: 'paragraph', content: '"Tax Pro Hub University got me my refund advance within 12 hours. Outstanding service!" - Loyalty M.' }
          ]
        };
        break;
      case 'faq':
        newBlock = {
          id: randomId,
          type: 'faq',
          name: 'Collapsible FAQ Accordion',
          content: 'Frequently Asked Compliance Questions',
          styles: {
            padding: 'py-16 px-8',
            margin: 'mb-0',
            bgColor: 'bg-neutral-950',
            textColor: 'text-white',
            accentColor: '#D4AF37',
            fontSize: 'text-3xl font-bold font-serif',
            alignment: 'text-left',
            animation: 'fade-up'
          },
          elements: [
            { id: randomId + '-q1', type: 'heading', content: 'Do you offer same-day cash advances?' },
            { id: randomId + '-a1', type: 'paragraph', content: 'Yes, up to $6,000 in advances matched through banking integrations upon return acceptance.' }
          ]
        };
        break;
      default:
        newBlock = {
          id: randomId,
          type: 'custom',
          name: 'Flexible Text Column Block',
          content: 'Custom Block Title',
          styles: {
            padding: 'py-16 px-8',
            margin: 'mb-0',
            bgColor: 'bg-neutral-900',
            textColor: 'text-white',
            accentColor: '#D4AF37',
            fontSize: 'text-xl font-normal font-sans',
            alignment: 'text-center',
            animation: 'fade-in'
          },
          elements: [
            { id: randomId + '-txt', type: 'paragraph', content: 'Drag or click items on the right block configurations to edit custom sections.' }
          ]
        };
    }
    
    updateBlocks([...blocks, newBlock]);
    setSelectedBlockId(randomId);
  };

  const removeBlock = (blockId: string) => {
    if (blocks.length > 1) {
      const remaining = blocks.filter(b => b.id !== blockId);
      updateBlocks(remaining);
      setSelectedBlockId(remaining[0].id);
    }
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < blocks.length) {
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      updateBlocks(newBlocks);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 -m-6 md:-m-8 flex flex-col text-white">
      {/* Visual Editor Header */}
      <header className="h-16 border-b border-[#1f2937]/50 bg-neutral-950 flex items-center justify-between px-6 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/websites')} 
            className="p-2 hover:bg-neutral-900 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-[#D4AF37] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                VISUAL SITE BUILDER
              </span>
              <span className="text-xs text-slate-500">Draft Auto-Saved</span>
            </div>
            <input 
              type="text" 
              value={websiteName}
              onChange={(e) => setWebsiteName(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-neutral-800 focus:border-[#D4AF37] focus:outline-none text-base font-serif font-bold text-white py-0.5"
            />
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-neutral-900/60 border border-neutral-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewport('desktop')}
            className={`p-2 rounded-lg transition ${viewport === 'desktop' ? 'bg-[#D4AF37] text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            title="Desktop View (1440px)"
          >
            <Laptop className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setViewport('tablet')}
            className={`p-2 rounded-lg transition ${viewport === 'tablet' ? 'bg-[#D4AF37] text-black' : 'text-slate-400 hover:text-white'}`}
            title="Tablet View (768px)"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={`p-2 rounded-lg transition ${viewport === 'mobile' ? 'bg-[#D4AF37] text-black' : 'text-slate-400 hover:text-white'}`}
            title="Mobile View (375px)"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        {/* Undo Redo & Publish */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button 
              onClick={handleUndo} 
              disabled={historyIndex === 0}
              className="p-2 hover:bg-neutral-900 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              title="Undo Action"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button 
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-2 hover:bg-neutral-900 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              title="Redo Action"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          <button 
            onClick={() => {
              setShowSavedToast(true);
              setTimeout(() => setShowSavedToast(false), 2000);
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-sm font-bold rounded-xl transition"
          >
            Save Draft
          </button>
          
          <button 
            onClick={handlePublish}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:brightness-110 text-black font-black text-sm rounded-xl shadow-lg shadow-amber-500/10 transition"
          >
            <Play className="h-4 w-4 fill-current" />
            Publish Live
          </button>
        </div>
      </header>

      {/* Main Builder Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Pages Navigator & Toolbox Tab controls */}
        <aside className="w-64 border-r border-[#1f2937]/40 bg-neutral-950 flex flex-col shrink-0">
          <div className="p-4 border-b border-[#1f2937]/40">
            <h3 className="text-xs font-bold text-[#D4AF37] font-serif tracking-[0.2em] uppercase mb-3">
              Website Pages
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {pages.map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePageIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition border text-left ${
                    idx === activePageIndex 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold' 
                      : 'border-transparent hover:bg-neutral-900/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    {page.name}
                  </span>
                  <span className="text-[9px] opacity-60 italic">/{page.slug}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => {
                setPages([...pages, { name: 'New Page', slug: 'page-' + (pages.length + 1), type: 'custom' }]);
              }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-neutral-800 hover:border-amber-500/30 rounded-lg text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-amber-400 transition"
            >
              <Plus className="h-3 w-3" /> Add Site Page
            </button>
          </div>

          {/* Quick Preload Library */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-[#D4AF37]/80 uppercase tracking-widest mb-2 border-b border-amber-500/10 pb-1">
                <span>10 Site Templates</span>
              </div>
              <div className="space-y-1.5">
                {templates.map(temp => (
                  <button
                    key={temp.id}
                    onClick={() => handleTemplateSelect(temp.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border ${
                      selectedTemplate === temp.id 
                        ? 'bg-gradient-to-r from-amber-500/15 to-transparent border-amber-500/30 text-amber-400 font-bold' 
                        : 'border-neutral-900 hover:bg-neutral-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="truncate font-semibold">{temp.name}</div>
                    <div className="text-[10px] opacity-60 truncate">{temp.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center Canvas with live scaling */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-8 flex flex-col items-center">
          {/* Active Canvas Frame */}
          <div 
            className={`bg-neutral-950 border border-[#1f2937]/50 shadow-2xl transition-all duration-300 relative rounded-2xl overflow-hidden min-h-[600px] flex flex-col ${
              viewport === 'desktop' ? 'w-full max-w-5xl' : viewport === 'tablet' ? 'w-[768px]' : 'w-[375px]'
            }`}
          >
            {/* Viewport Frame Header decoration */}
            <div className="h-8 bg-neutral-950 border-b border-neutral-900 flex items-center px-4 gap-1.5 select-none shrink-0">
              <span className="w-2.5 h-2.5 bg-red-500/60 rounded-full"></span>
              <span className="w-2.5 h-2.5 bg-yellow-500/60 rounded-full"></span>
              <span className="w-2.5 h-2.5 bg-green-500/60 rounded-full"></span>
              <span className="text-[10px] text-slate-600 font-mono ml-4 truncate">
                {websiteName.toLowerCase().replace(/\s+/g, '-')}.myvirtualtax.com/{pages[activePageIndex]?.slug || ''}
              </span>
            </div>

            {/* Canvas Body */}
            <div className="flex-1 flex flex-col relative bg-neutral-950">
              {blocks.map((block, idx) => {
                const isSelected = block.id === selectedBlockId;
                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`relative group border transition-all ${
                      isSelected 
                        ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/30 bg-neutral-950/20' 
                        : 'border-transparent hover:border-[#D4AF37]/40'
                    }`}
                  >
                    {/* Hover controls bar */}
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-neutral-950/95 border border-neutral-800 rounded-xl p-1 shadow-xl z-30 transition">
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'up'); }}
                        disabled={idx === 0}
                        className="p-1.5 hover:bg-neutral-900 text-slate-400 hover:text-[#D4AF37] disabled:opacity-30 rounded-lg transition"
                      >
                        <MoveUp className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'down'); }}
                        disabled={idx === blocks.length - 1}
                        className="p-1.5 hover:bg-neutral-900 text-slate-400 hover:text-[#D4AF37] disabled:opacity-30 rounded-lg transition"
                      >
                        <MoveDown className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                        disabled={blocks.length === 1}
                        className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded-lg transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Rendering block content by type */}
                    <div className={`${block.styles.padding} ${block.styles.alignment} ${block.styles.bgColor} ${block.styles.textColor} relative overflow-hidden`}>
                      
                      {/* Decorative Background Mesh Glow if dark */}
                      {block.styles.bgColor.includes('neutral-95') && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                      )}

                      {block.elements.map((elem) => (
                        <div key={elem.id} className="mb-4 last:mb-0">
                          {elem.type === 'badge' && (
                            <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500/15 to-yellow-500/5 border border-amber-500/30 rounded-full text-[9px] font-mono font-black text-[#D4AF37] tracking-[0.2em] uppercase">
                              {elem.content}
                            </span>
                          )}
                          {elem.type === 'heading' && (
                            <h2 className={`${block.styles.fontSize} font-serif tracking-tight leading-tight text-white`}>
                              {elem.content}
                            </h2>
                          )}
                          {elem.type === 'paragraph' && (
                            <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed mt-2">
                              {elem.content}
                            </p>
                          )}
                          {elem.type === 'button' && (
                            <div className="mt-6 flex justify-center">
                              <button className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:scale-105 active:scale-95 text-black font-black text-sm rounded-xl transition shadow-lg shadow-amber-500/10 pointer-events-none">
                                {elem.content}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Left Border selected visual strip */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37]"></div>
                    )}
                  </div>
                );
              })}

              {/* Add block drop zone placeholder */}
              <div className="py-12 border-2 border-dashed border-neutral-900 rounded-b-2xl flex flex-col items-center justify-center bg-neutral-950/20 p-6">
                <Layout className="h-8 w-8 text-neutral-800 mb-2" />
                <span className="text-xs text-slate-500">Insertion Drop Zone</span>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => addBlockToCanvas('pricing')}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-bold uppercase rounded-lg text-slate-400 hover:text-white transition"
                  >
                    + Add Pricing Table
                  </button>
                  <button 
                    onClick={() => addBlockToCanvas('testimonials')}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-bold uppercase rounded-lg text-slate-400 hover:text-white transition"
                  >
                    + Add Testimonials
                  </button>
                  <button 
                    onClick={() => addBlockToCanvas('faq')}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-bold uppercase rounded-lg text-slate-400 hover:text-white transition"
                  >
                    + Add FAQ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel: Property Settings / Elements palette */}
        <aside className="w-80 border-l border-[#1f2937]/40 bg-neutral-950 flex flex-col shrink-0">
          {/* Drawer tab triggers */}
          <div className="grid grid-cols-3 border-b border-[#1f2937]/40 text-center text-xs text-slate-400">
            <button 
              onClick={() => setActiveTab('blocks')}
              className={`py-3 border-b-2 font-bold uppercase tracking-wider ${activeTab === 'blocks' ? 'border-[#D4AF37] text-white' : 'border-transparent hover:text-white'}`}
            >
              Blocks
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`py-3 border-b-2 font-bold uppercase tracking-wider ${activeTab === 'settings' ? 'border-[#D4AF37] text-white' : 'border-transparent hover:text-white'}`}
            >
              Styles
            </button>
            <button 
              onClick={() => setActiveTab('seo')}
              className={`py-3 border-b-2 font-bold uppercase tracking-wider ${activeTab === 'seo' ? 'border-[#D4AF37] text-white' : 'border-transparent hover:text-white'}`}
            >
              SEO
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'blocks' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-neutral-900 pb-2">
                  Atomic Elements
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => addBlockToCanvas('custom')} className="p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center transition hover:border-[#D4AF37]/30 group">
                    <HeadingIcon className="h-5 w-5 text-slate-400 group-hover:text-amber-400 mb-1" />
                    <span className="text-[10px] font-bold text-white">Header Title</span>
                  </button>
                  <button onClick={() => addBlockToCanvas('custom')} className="p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center transition hover:border-[#D4AF37]/30 group">
                    <Type className="h-5 w-5 text-slate-400 group-hover:text-amber-400 mb-1" />
                    <span className="text-[10px] font-bold text-white">Paragraph Text</span>
                  </button>
                  <button onClick={() => addBlockToCanvas('custom')} className="p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center transition hover:border-[#D4AF37]/30 group">
                    <MousePointerClick className="h-5 w-5 text-slate-400 group-hover:text-amber-400 mb-1" />
                    <span className="text-[10px] font-bold text-white">Link Button</span>
                  </button>
                  <button onClick={() => addBlockToCanvas('custom')} className="p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center transition hover:border-[#D4AF37]/30 group">
                    <FormInput className="h-5 w-5 text-slate-400 group-hover:text-amber-400 mb-1" />
                    <span className="text-[10px] font-bold text-white">Contact Form</span>
                  </button>
                </div>

                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-neutral-900 pb-2 pt-4">
                  Full Page Sections
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-900 flex items-center justify-between text-xs hover:border-[#D4AF37]/20 transition">
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4 text-amber-500" />
                      <div>
                        <div className="font-bold text-white">Pricing Grid</div>
                        <div className="text-[9px] text-slate-500">Service tiers comparison</div>
                      </div>
                    </div>
                    <button onClick={() => addBlockToCanvas('pricing')} className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[9px] font-black uppercase tracking-wider rounded">
                      Add
                    </button>
                  </div>

                  <div className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-900 flex items-center justify-between text-xs hover:border-[#D4AF37]/20 transition">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500 animate-pulse" />
                      <div>
                        <div className="font-bold text-white">Testimonials Spotlight</div>
                        <div className="text-[9px] text-slate-500">Verified review slider</div>
                      </div>
                    </div>
                    <button onClick={() => addBlockToCanvas('testimonials')} className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[9px] font-black uppercase tracking-wider rounded">
                      Add
                    </button>
                  </div>

                  <div className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-900 flex items-center justify-between text-xs hover:border-[#D4AF37]/20 transition">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-amber-500" />
                      <div>
                        <div className="font-bold text-white">Accordion FAQ</div>
                        <div className="text-[9px] text-slate-500">Service and compliance Q&A</div>
                      </div>
                    </div>
                    <button onClick={() => addBlockToCanvas('faq')} className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[9px] font-black uppercase tracking-wider rounded">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest font-serif border-b border-amber-500/10 pb-2">
                  Block Parameters
                </div>

                <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-xl space-y-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Active Target: {selectedBlock.name}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Inline Text Editor
                    </label>
                    {selectedBlock.elements.map((elem) => (
                      <div key={elem.id} className="mb-2">
                        <div className="text-[9px] text-[#D4AF37] uppercase font-mono font-bold">{elem.type}</div>
                        <input
                          type="text"
                          value={elem.content}
                          onChange={(e) => updateSelectedBlockElement(elem.id, e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Background Palette
                    </label>
                    <select
                      value={selectedBlock.styles.bgColor}
                      onChange={(e) => updateSelectedBlockStyle('bgColor', e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="bg-neutral-950">Luxury Pure Black (#030712)</option>
                      <option value="bg-neutral-900">Charcoal Dark Neutral (#111827)</option>
                      <option value="bg-amber-950/20 bg-neutral-950">Subtle Gold Glaze (#D4AF37/10)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Padding Envelope
                    </label>
                    <select
                      value={selectedBlock.styles.padding}
                      onChange={(e) => updateSelectedBlockStyle('padding', e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="py-12 px-6">Compact (py-12 px-6)</option>
                      <option value="py-20 px-8">Comfortable (py-20 px-8)</option>
                      <option value="py-32 px-12">Tall Fullscreen (py-32 px-12)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Alignment Flow
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                      {['text-left', 'text-center', 'text-right'].map(align => (
                        <button
                          key={align}
                          onClick={() => updateSelectedBlockStyle('alignment', align)}
                          className={`py-1 text-[9px] uppercase font-bold rounded-md transition ${selectedBlock.styles.alignment === align ? 'bg-amber-500/10 text-[#D4AF37] border border-amber-500/20' : 'text-slate-400'}`}
                        >
                          {align.replace('text-', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Aesthetic Animation
                    </label>
                    <select
                      value={selectedBlock.styles.animation}
                      onChange={(e) => updateSelectedBlockStyle('animation', e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="fade-up">Fade Up Micro-Animation</option>
                      <option value="fade-in">Fade In Subtle</option>
                      <option value="scale-up">Scale Accent</option>
                      <option value="slide-right">Slide Right Slide</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-neutral-900 pb-2">
                  SEO & Indexability Engine
                </div>
                <div className="space-y-3 bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Meta Description</label>
                    <textarea
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg min-h-[80px] focus:outline-none focus:border-[#D4AF37]"
                    />
                    <div className="text-[9px] text-emerald-400 text-right font-mono mt-1">
                      {seoDescription.length}/160 Optimal Length
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">OG Share Image (URL)</label>
                    <input
                      type="text"
                      value={seoOgImage}
                      onChange={(e) => setSeoOgImage(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-lg font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> SEO Compliance Verifier
                  </div>
                  <ul className="text-[10px] space-y-1.5 text-slate-400 list-disc list-inside">
                    <li className="text-emerald-400">Canonical Tag autowired</li>
                    <li className="text-emerald-400">robots.txt indexed securely</li>
                    <li className="text-emerald-400">WCAG 2.1 Contrast levels passed</li>
                    <li>Sitemap registration auto-queued</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Cloudflare Deploy Loading Overlay */}
      {isPublishing && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 relative mb-6">
            <div className="absolute inset-0 border-4 border-amber-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold font-serif text-white mb-2">
            Compiling and Syncing Website to Cloudflare Edge CDN...
          </h2>
          <p className="text-sm text-slate-400 max-w-sm animate-pulse">
            Establishing synthetic pipeline, compressing single-file index build and dispatching worldwide.
          </p>
        </div>
      )}

      {/* Cloudflare Deploy Success Dialog */}
      {publishUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-amber-500/20 p-6 rounded-2xl shadow-2xl relative">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <h3 className="text-lg font-bold font-serif text-white">
                Website Deployed Live!
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cloudflare Pages deployment completed successfully. Your firm official site asset is active globally.
              </p>
              
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs font-mono text-amber-400 select-all select-none">
                {publishUrl}
              </div>

              <div className="flex gap-2">
                <a 
                  href={publishUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-black text-xs rounded-xl text-center shadow"
                >
                  Visit Live Site
                </a>
                <button 
                  onClick={() => setPublishUrl('')}
                  className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition"
                >
                  Back to Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Temp Auto Save Toast */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1f2937] text-white border border-[#334155] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="h-4 w-4 text-emerald-400" />
          Website Progress Saved Successfully!
        </div>
      )}
    </div>
  );
}
