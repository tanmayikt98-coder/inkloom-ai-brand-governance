import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, Database } from "lucide-react";
import { api } from "../services/api";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isResetting: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isResetting: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, isResetting: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Inkloom AI Uncaught Governance UI Exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleReloadDataset = async () => {
    this.setState({ isResetting: true });
    try {
      await api.dashboard.resetDemoDataset();
      window.location.reload();
    } catch (e) {
      console.error("Failed to reset dataset:", e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-[#131926] border border-rose-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Inkloom AI Safe Mode</h2>
                <p className="text-xs text-rose-400/80 font-mono">Governance Engine Isolation Trap</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              A runtime boundary exception occurred while rendering this view. Your underlying cryptographic audit trail and database records remain safe and uncorrupted.
            </p>

            {this.state.error && (
              <div className="bg-[#0B0F17] border border-gray-800 rounded-lg p-3 mb-6 font-mono text-xs text-rose-300 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-lg shadow-emerald-950/40"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                onClick={this.handleReloadDataset}
                disabled={this.state.isResetting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F293D] hover:bg-[#2A374F] text-gray-200 font-medium text-xs border border-gray-700 transition-colors"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                {this.state.isResetting ? "Re-seeding..." : "Reset Full Demo Data"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
