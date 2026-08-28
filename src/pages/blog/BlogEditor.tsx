import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Calendar, Tag, Image, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: '',
    status: 'draft' as 'draft' | 'published' | 'scheduled',
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/blog')} 
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-[#D4AF37]" />
          </button>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase">Editorial Publisher</span>
            <h1 className="text-2xl font-black text-white tracking-tight">{id ? 'Edit Blog Article' : 'Compose Blog Article'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer">
            <Eye className="h-5 w-5 text-[#D4AF37]" />
          </button>
          <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer">
            <Save className="h-4 w-4" />
            Publish Article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Main Canvas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-md font-bold text-white mb-6 uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-3">Article Content Workspace</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-4 py-3 bg-black/55 border border-amber-500/25 rounded-xl text-white text-base focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500 font-bold"
                  placeholder="e.g. 5 Crucial Small Business Tax Strategy Mistakes in 2026"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 bg-black/45 border border-white/5 rounded-xl text-[#D4AF37] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder-slate-600"
                  placeholder="/article-url-slug"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-3 bg-black/55 border border-amber-500/25 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500 leading-relaxed"
                  rows={3}
                  placeholder="Provide a brief summary of the article for social lists..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Article Body (Markdown Supported)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 bg-black/55 border border-amber-500/25 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-600 leading-relaxed min-h-[350px]"
                  placeholder="### Section Heading here... Write your content..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Parameters */}
        <div className="space-y-6">
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
            <h2 className="text-md font-bold text-white mb-5 uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-3">Publish Parameters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'scheduled' })}
                  className="w-full px-3.5 py-2.5 bg-black/45 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="draft" className="bg-neutral-950">Draft</option>
                  <option value="published" className="bg-neutral-950">Published</option>
                  <option value="scheduled" className="bg-neutral-950">Scheduled</option>
                </select>
              </div>

              {formData.status === 'scheduled' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    Publish Date
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-3.5 py-2.5 bg-black/45 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-amber-500" />
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/45 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-600"
                  placeholder="e.g. s-corp, deductions, business tax"
                />
              </div>
            </div>
          </div>

          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-md font-bold text-white mb-5 uppercase tracking-wider text-[#D4AF37] border-b border-white/5 pb-3">Featured Image</h2>
            <div className="border border-dashed border-amber-500/20 bg-black/45 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Image className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <p className="text-xs text-slate-400 font-medium max-w-[180px] mx-auto">Drag & drop your cover banner or upload</p>
              <button className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer uppercase tracking-wider transition-colors">
                Choose Image
              </button>
            </div>
          </div>

          <div className="p-4 bg-neutral-900/60 border border-white/5 rounded-xl flex gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              Articles publish directly to tenant funnels and website sitemaps matching SEO schemas instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

