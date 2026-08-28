import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Plus, FileText, Copy, Trash2, Eye, Settings, Sparkles, Award } from 'lucide-react';
import AIPromptBar from '../components/layout/AIPromptBar';

const sampleForms = [
  { id: '1', name: 'Contact Form', fields: [{ id: 'f1', type: 'text' as const, label: 'Name', required: true, position: 0 }, { id: 'f2', type: 'email' as const, label: 'Email', required: true, position: 1 }, { id: 'f3', type: 'phone' as const, label: 'Phone', required: false, position: 2 }, { id: 'f4', type: 'textarea' as const, label: 'Message', required: true, position: 3 }], settings: { submitButtonText: 'Send Message', successMessage: 'Thank you!', storeSubmissions: true }, submissions: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Tax Consultation Request', fields: [{ id: 'f1', type: 'text' as const, label: 'Full Name', required: true, position: 0 }, { id: 'f2', type: 'email' as const, label: 'Email', required: true, position: 1 }, { id: 'f3', type: 'select' as const, label: 'Service Type', required: true, options: ['Individual Tax', 'Business Tax', 'Tax Planning', 'IRS Help'], position: 2 }, { id: 'f4', type: 'date' as const, label: 'Preferred Date', required: false, position: 3 }], settings: { submitButtonText: 'Request Consultation', successMessage: 'We will contact you soon!', notifyEmail: 'appointments@rjbusinesssolutions.org', storeSubmissions: true }, submissions: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Newsletter Signup', fields: [{ id: 'f1', type: 'email' as const, label: 'Email Address', required: true, position: 0 }, { id: 'f2', type: 'checkbox' as const, label: 'I agree to receive emails', required: true, position: 1 }], settings: { submitButtonText: 'Subscribe', successMessage: 'Welcome to our newsletter!', storeSubmissions: true }, submissions: [], createdAt: new Date(), updatedAt: new Date() },
];

export default function FormBuilder() {
  const navigate = useNavigate();
  const { forms, deleteForm } = useAppStore();
  const allForms = forms.length > 0 ? forms : sampleForms;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#D4AF37] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              RJ Business Solutions Systems
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Visual Intake Forms
          </h1>
          <p className="text-slate-400 text-sm mt-1">Create customized client document and intake forms with conditional validation logic</p>
        </div>
        <button
          onClick={() => navigate('/forms/new')}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl text-xs shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          New Form
        </button>
      </div>

      {/* AI Prompt-to-Build Widget */}
      <AIPromptBar 
        moduleName="client intake forms" 
        placeholder="Prompt the AI to build an intake form (e.g. S-Corp annual client intake questionnaire with write-off details)..."
      />

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allForms.map((form) => (
          <div
            key={form.id}
            className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/15 overflow-hidden hover:border-amber-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between"
          >
            <div className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/25">
                  <FileText className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate text-sm">{form.name}</h3>
                  <p className="text-xs text-[#D4AF37] font-mono mt-0.5">{form.fields.length} active fields</p>
                </div>
              </div>

              {/* Fields Preview */}
              <div className="space-y-2 mb-5">
                {form.fields.slice(0, 4).map((field) => (
                  <div key={field.id} className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50" />
                    <span className="text-slate-300 font-semibold">{field.label}</span>
                    {field.required && <span className="text-rose-500 font-black">*</span>}
                  </div>
                ))}
                {form.fields.length > 4 && (
                  <p className="text-[10px] text-slate-500 font-bold font-mono pl-3">+{form.fields.length - 4} MORE FIELDS</p>
                )}
              </div>

              {/* Settings Preview */}
              <div className="pt-4 border-t border-neutral-900">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Submissions stored</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-black border ${
                    form.settings.storeSubmissions 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-neutral-900 text-slate-400 border-neutral-800'
                  }`}>
                    {form.settings.storeSubmissions ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 bg-neutral-900 hover:bg-neutral-850 rounded-lg text-slate-400 hover:text-white transition-colors" title="Preview">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-1.5 bg-neutral-900 hover:bg-neutral-850 rounded-lg text-slate-400 hover:text-white transition-colors" title="Duplicate">
                  <Copy className="h-4 w-4" />
                </button>
                <button className="p-1.5 bg-neutral-900 hover:bg-neutral-850 rounded-lg text-slate-400 hover:text-white transition-colors" title="Settings">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => deleteForm?.(form.id)}
                  className="p-1.5 bg-neutral-900 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors" 
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate(`/forms/${form.id}`)}
                  className="px-3.5 py-1.5 text-xs bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-lg transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allForms.length === 0 && (
        <div className="text-center py-16 bg-neutral-950/80 border border-neutral-800 rounded-2xl max-w-md mx-auto space-y-4">
          <FileText className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-md font-bold text-white">No forms created yet</h3>
          <p className="text-slate-400 text-xs px-6">Build responsive customer client files, document upload panels, or custom questionnaires.</p>
          <button
            onClick={() => navigate('/forms/new')}
            className="px-4 py-2 bg-[#D4AF37] text-black font-black rounded-xl text-xs hover:bg-yellow-400"
          >
            Create Intake Form
          </button>
        </div>
      )}
    </div>
  );
}
