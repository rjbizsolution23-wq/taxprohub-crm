import { Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-gray-950 to-neutral-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 text-white border-r border-amber-500/10 bg-black/40 relative overflow-hidden">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_100%)] pointer-events-none" />
        
        <div className="mb-8 relative z-10">
          <div className="inline-flex p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Shield className="h-12 w-12 text-amber-400" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black mb-4 tracking-tight relative z-10 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
          Tax Pro Hub University
        </h1>
        
        <p className="text-xl text-neutral-300 mb-8 relative z-10 leading-relaxed font-light">
          White-label, AI-driven billing and tax CRM platform for elite professionals. 
          Manage clients, automate secure vaults, run advanced AI workflows, and process 
          monetization under your high-end brand.
        </p>
        
        <div className="space-y-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-100 text-base">Contact & Lead Management</h3>
              <p className="text-neutral-400 text-sm">Track elite clients, files, and prospects in one centralized hub</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-100 text-base">Pipeline & Deal Tracking</h3>
              <p className="text-neutral-400 text-sm">Visualize multi-stage deal flow and drive automated task triggers</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-100 text-base">Omnichannel Marketing</h3>
              <p className="text-neutral-400 text-sm">Automated email, SMS, and content pipelines powered by Tax Pro Hub University AI</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-100 text-base">White-Label & Secure Vaults</h3>
              <p className="text-neutral-400 text-sm">Cloudflare R2 RAG storage and personalized client portal branding</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Contract Footer Banner */}
      <div className="absolute bottom-6 right-8 hidden xl:block text-[10px] text-amber-500/40 font-mono bg-black/60 px-3 py-1 rounded border border-amber-500/10">
        CONTRACT #MTX-2026-01 • $1,500 PHASE 1 • MAY 22 2026
      </div>
    </div>
  );
}
