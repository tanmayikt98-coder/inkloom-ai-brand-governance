import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { Sidebar, NavSection } from "./components/Sidebar";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { GuidedDemoTour } from "./components/GuidedDemoTour";
import { api } from "./services/api";
import {
  RefreshCw,
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  GitBranch,
  Inbox,
  History,
  Network,
  FlaskConical,
  FolderKanban,
  ScrollText,
  Settings,
  PanelLeft,
  PanelLeftClose,
  ArrowRight,
  ArrowLeft,
  Search,
  Sun,
  Moon,
  RotateCcw,
  Sparkles,
} from "lucide-react";

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
  const [showSidebar, setShowSidebar] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

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

  const handleResetData = async () => {
    setIsResetting(true);
    const start = performance.now();
    try {
      await api.dashboard.resetDemoDataset();
      const latency = performance.now() - start;
      addToast({
        type: "success",
        title: "Demo Dataset Re-Seeded",
        message: "Loaded 12 facts, 8 evidence docs, 6 rules, 9 assets, and 3 review items.",
        latencyMs: latency,
      });
      window.location.reload();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Seed Reset Failed",
        message: err.message || "Failed to reset demo dataset",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const navPills: { id: NavSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: "knowledge-hub", label: "Knowledge Hub", icon: <BookOpen className="w-3.5 h-3.5" />, badge: "12" },
    { id: "content-audits", label: "Content Audits", icon: <FileCheck2 className="w-3.5 h-3.5" />, badge: "9" },
    { id: "traceability", label: "Lineage", icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: "impact-map", label: "Impact Map", icon: <Network className="w-3.5 h-3.5" /> },
    { id: "review-queue", label: "Review Queue", icon: <Inbox className="w-3.5 h-3.5" />, badge: "3" },
    { id: "time-machine", label: "Time Machine", icon: <History className="w-3.5 h-3.5" /> },
    { id: "simulator", label: "What-If Simulator", icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: "audit-history", label: "WORM Ledger", icon: <ScrollText className="w-3.5 h-3.5" /> },
    { id: "campaigns", label: "Campaigns", icon: <FolderKanban className="w-3.5 h-3.5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  const isOverview = currentSection === "overview";

  return (
    <div className="min-h-screen bg-[#FCFDFD] dark:bg-[#121210] text-[#26251E] dark:text-[#FCFDFD] flex flex-col font-sans transition-colors duration-200">
      {/* Cold-Start Banner (Shows only if Render free-tier is waking) */}
      {backendWaking && (
        <div className="bg-[#F3F2EB] dark:bg-[#1C1B16] border-b border-[#E8E6D9] dark:border-[#2E2C26] px-4 py-2 text-xs flex items-center justify-between text-[#26251E] dark:text-[#FCFDFD] z-50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
            <span>
              <strong>Waking compliance runtime...</strong> Initializing PostgreSQL vector store &amp; cryptographic ledger (approx. 10s on first load).
            </span>
          </div>
          <span className="font-mono text-[10px] opacity-75 hidden sm:inline">Render Cold-Start Protection Active</span>
        </div>
      )}

      {/* TOP NAVIGATION: Conditional on Mode */}
      {isOverview ? (
        /* NUDGE-STYLE MINIMALIST NAVBAR */
        <header className="bg-[#FCFDFD]/90 dark:bg-[#121210]/90 backdrop-blur-md border-b border-[#E8E6D9] dark:border-[#2E2C26] sticky top-0 z-40 px-4 sm:px-8 py-3.5 transition-colors">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            {/* Brand Logo (Exact Nudge Minimalist Wordmark) */}
            <div
              onClick={() => setCurrentSection("overview")}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#26251E] dark:bg-white text-white dark:text-[#26251E] flex items-center justify-center font-extrabold text-xs tracking-wider shadow-xs">
                IK
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[#26251E] dark:text-white">
                inkloom
              </span>
            </div>

            {/* Editorial Nav Links */}
            <nav className="hidden md:flex items-center space-x-7 text-xs font-medium text-[#6F6C5B] dark:text-[#A9A593]">
              <button
                onClick={() => setCurrentSection("knowledge-hub")}
                className="hover:text-[#26251E] dark:hover:text-white transition-colors cursor-pointer"
              >
                Knowledge Graph
              </button>
              <button
                onClick={() => setCurrentSection("content-audits")}
                className="hover:text-[#26251E] dark:hover:text-white transition-colors cursor-pointer"
              >
                Workflows
              </button>
              <button
                onClick={() => setCurrentSection("content-audits")}
                className="hover:text-[#26251E] dark:hover:text-white transition-colors cursor-pointer"
              >
                Diff Studio
              </button>
              <button
                onClick={() => setCurrentSection("impact-map")}
                className="hover:text-[#26251E] dark:hover:text-white transition-colors cursor-pointer"
              >
                Impact Map
              </button>
              <button
                onClick={() => setCurrentSection("audit-history")}
                className="hover:text-[#26251E] dark:hover:text-white transition-colors cursor-pointer"
              >
                WORM Ledger
              </button>
              <button
                onClick={() => setCurrentSection("review-queue")}
                className="hover:text-[#26251E] dark:hover:text-white transition-colors cursor-pointer"
              >
                Review Queue
              </button>
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-white hover:bg-[#F3F2EB] dark:hover:bg-[#1C1B16] transition-all cursor-pointer"
                title="Search Brand Knowledge (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-white hover:bg-[#F3F2EB] dark:hover:bg-[#1C1B16] transition-all cursor-pointer"
                title="Toggle Dark Mode"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-[#F3F2EB] dark:hover:bg-[#1C1B16] transition-all cursor-pointer"
                title="Reset demo dataset"
              >
                <RotateCcw className={`w-3 h-3 text-[#F97316] ${isResetting ? "animate-spin" : ""}`} />
                <span>{isResetting ? "Seeding..." : "Reset"}</span>
              </button>

              {/* Main Nudge-Style Action Pill */}
              <button
                onClick={() => setCurrentSection("knowledge-hub")}
                className="cursor-pointer px-5 py-2.5 rounded-full bg-[#26251E] hover:bg-black text-white dark:bg-white dark:text-[#26251E] dark:hover:bg-neutral-200 text-xs font-semibold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>
      ) : (
        /* GOVERNANCE STUDIO TOOLBAR */
        <>
          <Header
            onOpenSearch={() => setIsSearchOpen(true)}
            onStartDemoTour={() => setIsDemoTourOpen(true)}
          />

          {/* Studio Module Pills & Back Button */}
          <div className="border-b border-[#E8E6D9] dark:border-[#2E2C26] bg-[#FCFDFD]/90 dark:bg-[#121210]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-2 shadow-2xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                {/* Back to Nudge Overview Button */}
                <button
                  onClick={() => setCurrentSection("overview")}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F3F2EB] dark:bg-[#1C1B16] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] text-[#26251E] dark:text-white border border-[#E8E6D9] dark:border-[#2E2C26] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
                  <span>Overview</span>
                </button>

                <div className="h-4 w-px bg-[#E8E6D9] dark:bg-[#2E2C26] hidden sm:block" />

                {/* 11 Module Pills */}
                <nav className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
                  {navPills.map((item) => {
                    const isActive = currentSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentSection(item.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          isActive
                            ? "bg-[#26251E] text-white dark:bg-white dark:text-[#26251E] shadow-sm"
                            : "text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-white hover:bg-[#F3F2EB] dark:hover:bg-[#1C1B16]"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                              isActive
                                ? "bg-white/20 text-white dark:bg-black/20 dark:text-[#26251E]"
                                : "bg-[#E8E6D9] dark:bg-[#2E2C26] text-[#26251E] dark:text-[#FCFDFD]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <button
                onClick={() => setShowSidebar((prev) => !prev)}
                title={showSidebar ? "Full Width Canvas" : "Show Sidebar"}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[#E8E6D9] dark:border-[#2E2C26] bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {showSidebar ? <PanelLeftClose className="w-3.5 h-3.5 text-[#F97316]" /> : <PanelLeft className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{showSidebar ? "Full Canvas" : "Sidebar"}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* MAIN VIEWPORT */}
      <div className="flex flex-1 overflow-hidden">
        {!isOverview && showSidebar && (
          <Sidebar
            currentSection={currentSection}
            onSelectSection={(sec) => setCurrentSection(sec)}
          />
        )}
        <main className="flex-1 overflow-y-auto w-full">
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
