import { useState } from 'react';
import { ArrowLeft, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SAMPLE_LEADS = [
  { id: 1, name: "Michael Chen", score: 94, company: "Chen Dynamics", reason: "High website engagement + multiple form submissions", value: 18500, nextStep: "Schedule Strategy Session" },
  { id: 2, name: "Rachel Patel", score: 89, company: "Patel CPA", reason: "Referred by existing client + expressed budget clarity", value: 9200, nextStep: "Send Proposal" },
  { id: 3, name: "David Morales", score: 76, company: "Morales Construction", reason: "Downloaded 2026 Tax Guide + watched webinar", value: 6400, nextStep: "Follow-up Call" },
];

export default function LeadIntelligence() {
  const navigate = useNavigate();
  const [leads] = useState(SAMPLE_LEADS);
  const [selectedLead, setSelectedLead] = useState(leads[0]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/ai')} className="p-3 hover:bg-gray-100 rounded-2xl">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Lead Intelligence</h1>
          <p className="text-gray-500">AI-powered lead scoring • Real-time buying signals</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Lead List */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-2 border">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="font-semibold">High-Intent Leads (AI Scored)</div>
            <div className="text-xs px-4 py-2 bg-emerald-100 text-emerald-700 rounded-3xl">Updated moments ago</div>
          </div>
          
          <div className="divide-y">
            {leads.map((lead) => (
              <div 
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`p-6 flex gap-5 hover:bg-gray-50 cursor-pointer transition-all rounded-3xl mx-2 my-1 ${selectedLead.id === lead.id ? 'bg-violet-50' : ''}`}
              >
                <div className="text-4xl font-semibold text-violet-200 tabular-nums">{lead.score}</div>
                
                <div className="flex-1">
                  <div className="font-semibold text-lg">{lead.name}</div>
                  <div className="text-sm text-gray-500">{lead.company}</div>
                  
                  <div className="mt-4 text-xs leading-snug text-gray-600 line-clamp-2">
                    {lead.reason}
                  </div>
                  
                  <div className="flex justify-between items-end mt-6">
                    <div>
                      <div className="text-xs text-gray-400">EST. VALUE</div>
                      <div className="font-mono text-lg font-semibold">${lead.value.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-emerald-500">NEXT BEST ACTION</div>
                      <div className="text-xs font-medium">{lead.nextStep}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deep Analysis */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl p-8 border">
          {selectedLead && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-emerald-500 text-xs tracking-widest">LEAD INTELLIGENCE REPORT</div>
                  <div className="text-3xl font-semibold mt-1">{selectedLead.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-violet-400 to-fuchsia-500 leading-none">
                    {selectedLead.score}
                  </div>
                  <div className="-mt-3 text-xs text-violet-400">INTENT SCORE</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Target className="text-orange-500" />
                    <div className="font-medium">Why This Lead Is Hot</div>
                  </div>
                  <ul className="space-y-6 text-sm">
                    <li className="flex gap-4">
                      <div className="font-mono text-xl text-orange-400 w-6">01</div>
                      <div>Visited pricing page 4 times in last 6 days</div>
                    </li>
                    <li className="flex gap-4">
                      <div className="font-mono text-xl text-orange-400 w-6">02</div>
                      <div>Downloaded "2026 Tax Changes Guide"</div>
                    </li>
                    <li className="flex gap-4">
                      <div className="font-mono text-xl text-orange-400 w-6">03</div>
                      <div>Referred by Sarah Patel (existing client)</div>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="text-violet-500" />
                    <div className="font-medium">Recommended Actions</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl flex items-start gap-4">
                      <div className="text-xl">📧</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Send personalized proposal</div>
                        <div className="text-xs text-gray-500">Claude recommends emphasizing Section 179 + EV credits</div>
                      </div>
                      <button className="text-xs bg-black text-white px-5 py-2.5 rounded-2xl">SEND</button>
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl flex items-start gap-4">
                      <div className="text-xl">📅</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Book 30-minute strategy session</div>
                        <div className="text-xs text-gray-500">Gemini suggests next Tuesday at 11am</div>
                      </div>
                      <button className="text-xs border px-5 py-2.5 rounded-2xl">BOOK</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t text-center text-xs text-gray-400">
                Analysis performed across Claude 3.5, GPT-4o, and Gemini 1.5 using your full CRM dataset
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
