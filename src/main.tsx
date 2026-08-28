import { StrictMode, Component, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.hash = "/";
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-neutral-950 border border-amber-500/20 rounded-3xl p-8 text-center shadow-2xl shadow-amber-500/5">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/10">
              <svg className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-white font-serif mb-2">MYVIRTUAL</h1>
            <p className="text-[10px] text-[#D4AF37] font-mono tracking-[0.2em] uppercase mb-6">TAX PROFESSIONAL PLATFORM</p>
            
            <div className="bg-neutral-900 border border-red-500/20 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-rose-400 mb-1">Application Initialization Error:</p>
              <p className="text-[11px] font-mono text-slate-300 break-all bg-black/40 p-2.5 rounded-lg overflow-x-auto max-h-32 scrollbar-thin">
                {this.state.error?.message || "An unexpected error occurred during startup."}
              </p>
            </div>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              This can happen due to legacy cache or browser storage conflicts. Click below to clear state and refresh.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 active:scale-[0.98]"
            >
              Reset Cache & Launch App
            </button>

            <div className="mt-8 border-t border-neutral-900 pt-6 text-[10px] text-slate-500 font-mono">
              <p>Powered by RJ Business Solutions</p>
              <p className="mt-1">Tijeras, NM 87059</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
