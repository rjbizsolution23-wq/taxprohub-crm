import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Plus, Globe, Eye, Edit, Trash2, ExternalLink, Award } from 'lucide-react';
import AIPromptBar from '../components/layout/AIPromptBar';

const sampleWebsites = [
  { id: '1', name: 'Tax Pro Hub University', domain: 'myvirtualtax.com', pages: [{ id: 'p1', title: 'Home', slug: '/', content: '', isHome: true, published: true }, { id: 'p2', title: 'Services', slug: '/services', content: '', isHome: false, published: true }, { id: 'p3', title: 'About', slug: '/about', content: '', isHome: false, published: true }, { id: 'p4', title: 'Contact', slug: '/contact', content: '', isHome: false, published: true }], theme: { primaryColor: '#D4AF37', secondaryColor: '#111111', fontFamily: 'Inter', headerStyle: 'modern', footerStyle: 'classic' }, published: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Tax Blog', domain: 'blog.myvirtualtax.com', pages: [{ id: 'p1', title: 'Blog Home', slug: '/', content: '', isHome: true, published: true }], theme: { primaryColor: '#10B981', secondaryColor: '#059669', fontFamily: 'Georgia', headerStyle: 'minimal', footerStyle: 'minimal' }, published: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Client Portal', pages: [{ id: 'p1', title: 'Portal', slug: '/', content: '', isHome: true, published: false }], theme: { primaryColor: '#D4AF37', secondaryColor: '#111111', fontFamily: 'Inter', headerStyle: 'modern', footerStyle: 'modern' }, published: false, createdAt: new Date(), updatedAt: new Date() },
];

export default function WebsitesPage() {
  const navigate = useNavigate();
  const { websites } = useAppStore();
  const allWebsites = websites.length > 0 ? websites : sampleWebsites;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#D4AF37] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              RJ Business Solutions Core Web
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Websites & Domains
          </h1>
          <p className="text-slate-400 text-sm mt-1">Design and publish responsive practice portals and client education domains</p>
        </div>
        <button
          onClick={() => navigate('/websites/new')}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl text-xs shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          New Website
        </button>
      </div>

      {/* AI Prompt-to-Build Widget */}
      <AIPromptBar 
        moduleName="practice websites" 
        placeholder="Prompt the AI to build a multi-page practice website (e.g. S-Corp business advisory portal with custom contact & services subpages)..."
      />

      {/* Websites Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allWebsites.map((website) => (
          <div
            key={website.id}
            className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 overflow-hidden hover:border-amber-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between"
          >
            {/* Preview */}
            <div className="h-40 bg-gradient-to-br from-neutral-900 via-neutral-950 to-amber-950/20 flex items-center justify-center border-b border-neutral-900 relative">
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-0.5 text-[9px] font-black font-mono uppercase rounded-lg border ${
                  website.published 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-neutral-900 text-slate-400 border-neutral-800'
                }`}>
                  {website.published ? 'Published' : 'Draft'}
                </span>
              </div>
              <Globe className="h-16 w-16 text-[#D4AF37]/20" />
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-white text-base">{website.name}</h3>
                {website.domain && (
                  <a
                    href={`https://${website.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#D4AF37] hover:text-yellow-400 font-bold flex items-center gap-1 mt-1 transition-colors"
                  >
                    {website.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Pages */}
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Pages ({website.pages.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {website.pages.slice(0, 5).map((page) => (
                    <span
                      key={page.id}
                      className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-lg border ${
                        page.published 
                          ? 'bg-emerald-500/5 text-slate-300 border-emerald-500/10' 
                          : 'bg-neutral-900 text-slate-500 border-neutral-800'
                      }`}
                    >
                      {page.title}
                    </span>
                  ))}
                  {website.pages.length > 5 && (
                    <span className="px-2 py-0.5 text-xs text-slate-500 font-mono">
                      +{website.pages.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              {/* Theme Preview */}
              <div className="pt-4 border-t border-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Theme Palette:</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-neutral-800"
                      style={{ backgroundColor: website.theme.primaryColor }}
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-neutral-800"
                      style={{ backgroundColor: website.theme.secondaryColor }}
                    />
                    <span className="text-xs text-slate-300 font-mono font-bold ml-1">{website.theme.fontFamily}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 bg-neutral-900 hover:bg-neutral-850 rounded-lg text-slate-400 hover:text-white transition-colors" title="Preview">
                  <Eye className="h-4 w-4" />
                </button>
                {website.domain && (
                  <a
                    href={`https://${website.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-neutral-900 hover:bg-neutral-850 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Visit"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 bg-neutral-900 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate(`/websites/${website.id}`)}
                  className="px-3.5 py-1.5 text-xs bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-lg transition-all"
                >
                  Edit Portal
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allWebsites.length === 0 && (
        <div className="text-center py-16 bg-neutral-950/80 border border-neutral-800 rounded-2xl max-w-md mx-auto space-y-4">
          <Globe className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-md font-bold text-white">No websites created yet</h3>
          <p className="text-slate-400 text-xs px-6">Generate premium advisory portfolios, client login gateways, and localized tax resource folders.</p>
          <button
            onClick={() => navigate('/websites/new')}
            className="px-4 py-2 bg-[#D4AF37] text-black font-black rounded-xl text-xs hover:bg-yellow-400"
          >
            Create Website
          </button>
        </div>
      )}
    </div>
  );
}
