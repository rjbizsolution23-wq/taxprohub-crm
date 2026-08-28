import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Plus, BookOpen, Edit, Trash2, Eye, Calendar, Sparkles, Award } from 'lucide-react';
import AIPromptBar from '../components/layout/AIPromptBar';

export default function BlogPage() {
  const navigate = useNavigate();
  const { blogPosts, deleteBlogPost } = useAppStore();
  const allPosts = blogPosts;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      case 'draft':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      default:
        return 'bg-slate-500/10 text-slate-300 border border-slate-500/25';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#D4AF37] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              RJ Business Solutions Editorial
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Editorial Publications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage and publish tax education blog posts, bulletins, and authority articles</p>
        </div>
        <button
          onClick={() => navigate('/blog/new')}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl text-xs shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          New Article
        </button>
      </div>

      {/* AI Prompt-to-Build Widget */}
      <AIPromptBar 
        moduleName="editorial blog articles" 
        placeholder="Prompt the AI to write a blog post (e.g. S-Corp tax strategies or rental property depreciation tips)..."
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Published Posts', count: allPosts.filter((p) => p.status === 'published').length, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Saved Drafts', count: allPosts.filter((p) => p.status === 'draft').length, icon: Edit, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Scheduled Releases', count: allPosts.filter((p) => p.status === 'scheduled').length, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 p-5 flex items-center gap-4 relative overflow-hidden group shadow-md">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-black text-white tracking-tight">{stat.count}</p>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Posts List */}
      <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 overflow-hidden shadow-xl">
        <div className="divide-y divide-neutral-900">
          {allPosts.map((post) => (
            <div key={post.id} className="p-6 hover:bg-amber-500/5 transition-all duration-150">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-white text-base hover:text-[#D4AF37] transition-colors cursor-pointer" onClick={() => navigate(`/blog/${post.id}`)}>
                      {post.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 text-[9px] font-black font-mono uppercase rounded-lg ${getStatusBadge(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-2 leading-relaxed max-w-3xl">{post.excerpt}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-4 flex-wrap">
                    <span className="flex items-center gap-1.5 font-mono text-[10px]">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'NOT PUBLISHED'}
                    </span>
                    <span className="text-neutral-800">•</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {post.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-neutral-900 border border-amber-500/10 text-slate-300 rounded-lg text-[9px] font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button className="p-2 bg-neutral-900 hover:bg-neutral-850 rounded-lg text-slate-400 hover:text-white transition-colors" title="Preview">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className="p-2 bg-neutral-900 hover:bg-neutral-850 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteBlogPost?.(post.id)}
                    className="p-2 bg-neutral-900 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors" 
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {allPosts.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <BookOpen className="h-10 w-10 text-slate-500 mx-auto" />
            <p className="text-slate-400 text-xs">No blog posts or educational bulletins created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
