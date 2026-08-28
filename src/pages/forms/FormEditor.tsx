import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, MoveUp, MoveDown, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function FormEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState([
    { id: '1', type: 'text', label: 'Name', required: true },
    { id: '2', type: 'email', label: 'Email', required: true },
  ]);

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'textarea', label: 'Text Area' },
  ];

  const addField = () => {
    setFields([...fields, { id: Math.random().toString(36).substring(2, 15), type: 'text', label: 'New Field', required: false }]);
  };

  const removeField = (fieldId: string) => {
    if (fields.length > 1) {
      setFields(fields.filter((f) => f.id !== fieldId));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/forms')} 
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-[#D4AF37]" />
          </button>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase">Interactive Form Designer</span>
            <h1 className="text-2xl font-black text-white tracking-tight">{id ? 'Edit Client Intake Form' : 'Design Client Intake Form'}</h1>
          </div>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer">
          <Save className="h-4 w-4" />
          Save Form Design
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Properties */}
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-md font-bold text-white mb-4 uppercase tracking-wider text-[#D4AF37]">Form Properties</h2>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Form Title</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-3 bg-black/55 border border-amber-500/25 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-slate-500"
                placeholder="e.g. Tax Year 2026 S-Corp Intake Questionnaire"
              />
            </div>
          </div>

          {/* Form Fields Workspace */}
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-md font-bold text-white uppercase tracking-wider text-[#D4AF37]">Design Fields</h2>
                <p className="text-slate-400 text-xs mt-0.5">Drag, arrange, and formulate questionnaire inputs</p>
              </div>
              <button
                onClick={addField}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/20 text-xs font-bold text-[#D4AF37] uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Input Field
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-neutral-900/60 border border-white/5 rounded-xl hover:border-amber-500/20 transition-all">
                  {/* Position Controllers */}
                  <div className="flex sm:flex-col gap-1">
                    <button
                      onClick={() => {
                        const newFields = [...fields];
                        if (index > 0) {
                          [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
                          setFields(newFields);
                        }
                      }}
                      disabled={index === 0}
                      className="p-1 hover:bg-neutral-800 rounded text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <MoveUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const newFields = [...fields];
                        if (index < fields.length - 1) {
                          [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
                          setFields(newFields);
                        }
                      }}
                      disabled={index === fields.length - 1}
                      className="p-1 hover:bg-neutral-800 rounded text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <MoveDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Field Index */}
                  <span className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#D4AF37] flex items-center justify-center text-xs font-mono font-bold">
                    {index + 1}
                  </span>

                  {/* Field Parameters */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    <div>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                          const newFields = [...fields];
                          newFields[index].label = e.target.value;
                          setFields(newFields);
                        }}
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Field label"
                      />
                    </div>
                    <div>
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const newFields = [...fields];
                          newFields[index].type = e.target.value;
                          setFields(newFields);
                        }}
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {fieldTypes.map((t) => (
                          <option key={t.value} value={t.value} className="bg-neutral-950">{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const newFields = [...fields];
                            newFields[index].required = e.target.checked;
                            setFields(newFields);
                          }}
                          className="h-4 w-4 bg-black/60 border-amber-500/25 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-black cursor-pointer"
                        />
                        <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Required Input</span>
                      </label>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeField(field.id)}
                    disabled={fields.length === 1}
                    className="p-2.5 hover:bg-red-950/40 border border-transparent hover:border-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-md font-bold text-white mb-4 uppercase tracking-wider text-[#D4AF37]">Designer Guidelines</h2>
            <div className="space-y-4">
              <div className="p-3 bg-neutral-900 rounded-xl border border-white/5 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  <strong>Secure Intake</strong>: All custom demographic fields comply fully with secure client portal protocols and local storage synchronization rules.
                </p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect this form to workflows using the AI Assistant Campaign Workspace. To dispatch direct SMS or Click2Mail physical campaigns, set the trigger configuration to this active form.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

