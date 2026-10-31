import React, { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { Sidebar, NavSection } from "./components/Sidebar";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { GuidedDemoTour } from "./components/GuidedDemoTour";
import { api } from "./services/api";
import { RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

// Views
import { OverviewView } from "./views/OverviewView";
import { BrandKnowledgeHubView } from "./views/BrandKnowledgeHubView";
import { ContentAuditsView } from "./views/ContentAuditsView";
import { TraceabilityView } from "./views/TraceabilityView";
import { ReviewQueueView } from "./views/ReviewQueueView";
import { TimeMachineView } from "./views/TimeMachineView";
import { ImpactMapView } from "./views/ImpactMapView";
import { WhatIfSimulatorView } from "./views/WhatIfSimulatorView";
import { CampaignsAndReportsView } from "./views/CampaignsAndReportsView";
import { AuditHistoryView } from "./views/AuditHistoryView";
import { SettingsView } from "./views/SettingsView";

const MainLayout: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<NavSection>("overview");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [backendWaking, setBackendWaking] = useState(false);

  // Cold-Start & First-Load Resilience Health Probe
  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2500)
        );
        await Promise.race([api.system.checkHealth(), timeoutPromise]);
        if (isMounted) setBackendWaking(false);
      } catch {
        if (isMounted) {
          setBackendWaking(true);
          // Retry probe in background every 3 seconds until awake
          const interval = setInterval(async () => {
            try {
              await api.system.checkHealth();
              if (isMounted) {
                setBackendWaking(false);
                clearInterval(interval);
              }
            } catch {
              // Still waking
            }
          }, 3000);
        }
      }
    };
    probe();
    return () => {
      isMounted = false;
    };
  }, []);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFDFD] dark:bg-[#121210] text-[#26251E] dark:text-[#FCFDFD] flex flex-col font-sans transition-colors duration-200">
      {/* Cold-Start Banner (Shows only if Render free-tier is waking) */}
      {backendWaking && (
        <div className="bg-[#F3F2EB] dark:bg-[#1C1B16] border-b border-[#E8E6D9] dark:border-[#2E2C26] px-4 py-2 text-xs flex items-center justify-between text-[#26251E] dark:text-[#FCFDFD]">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
            <span>
              <strong>Waking compliance runtime...</strong> Initializing PostgreSQL vector store &amp; cryptographic ledger (approx. 10s on first load).
            </span>
          </div>
          <span className="font-mono text-[10px] opacity-75 hidden sm:inline">Render Cold-Start Protection Active</span>
        </div>
      )}

      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onStartDemoTour={() => setIsDemoTourOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
        />
        <main className="flex-1 overflow-y-auto">
          {currentSection === "overview" && (
            <OverviewView
              onNavigate={setCurrentSection}
              onStartDemoTour={() => setIsDemoTourOpen(true)}
            />
          )}
          {currentSection === "knowledge-hub" && <BrandKnowledgeHubView />}
          {currentSection === "content-audits" && <ContentAuditsView />}
          {currentSection === "traceability" && <TraceabilityView />}
          {currentSection === "review-queue" && <ReviewQueueView />}
          {currentSection === "time-machine" && <TimeMachineView />}
          {currentSection === "impact-map" && <ImpactMapView />}
          {currentSection === "simulator" && <WhatIfSimulatorView />}
          {currentSection === "campaigns" && (
            <CampaignsAndReportsView onNavigateAudit={() => setCurrentSection("content-audits")} />
          )}
          {currentSection === "audit-history" && <AuditHistoryView />}
          {currentSection === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(sec) => {
          setCurrentSection(sec);
          setIsSearchOpen(false);
        }}
      />

      <GuidedDemoTour
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onNavigate={(sec) => setCurrentSection(sec)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <MainLayout />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
