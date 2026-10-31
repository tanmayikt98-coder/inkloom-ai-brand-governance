import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { UserRole } from "../types";
import { api } from "../services/api";
import {
  ShieldCheck,
  Sparkles,
  Building2,
  UserCircle,
  ChevronDown,
  CheckCircle2,
  Lock,
  Search,
  Sun,
  Moon,
  RotateCcw,
  Play,
  Layers,
} from "lucide-react";
import { AdversarialBenchmarkModal } from "./AdversarialBenchmarkModal";

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  ORGANIZATION_ADMIN: "Organization Administrator",
  BRAND_MANAGER: "Brand Manager",
  CONTENT_CREATOR: "Content Creator",
  COMPLIANCE_ANALYST: "Compliance Analyst",
  REVIEWER_APPROVER: "Reviewer / Approver",
  READ_ONLY_VIEWER: "Read-Only Viewer",
  EVIDENCE_CUSTODIAN: "Evidence Custodian",
  CAMPAIGN_MANAGER: "Campaign Manager",
  SYSTEM_SERVICE: "System Service",
};

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  ORGANIZATION_ADMIN: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  BRAND_MANAGER: "bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400 border-[#D1E0D7] dark:border-emerald-800",
  CONTENT_CREATOR: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  COMPLIANCE_ANALYST: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  REVIEWER_APPROVER: "bg-[#FDF2F4] dark:bg-rose-950/60 text-[#A36B73] dark:text-rose-400 border-[#F3D2D7] dark:border-rose-800",
  READ_ONLY_VIEWER: "bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800",
  EVIDENCE_CUSTODIAN: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  CAMPAIGN_MANAGER: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  SYSTEM_SERVICE: "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800",
};

interface HeaderProps {
  onOpenSearch?: () => void;
  onStartDemoTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onStartDemoTour }) => {
  const {
    currentUser,
    activeBrand,
    allBrands,
    setActiveBrand,
    activeOrg,
    allOrgs,
    switchTenant,
    switchRole,
  } = useAuth();

  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    setIsResetting(true);
    const start = performance.now();
    try {
      await api.dashboard.resetDemoDataset();
      const latency = performance.now() - start;
      addToast({
        type: "success",
        title: "Demo Dataset Re-Seeded",
        message: "Loaded 12 facts, 8 evidence docs, 6 rules, 9 assets, and 3 scenarios.",
        latencyMs: latency
      });
      window.location.reload();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Seed Reset Failed",
        message: err.message || "Failed to reset demo dataset"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <header className="bg-white/95 dark:bg-[#131926]/95 backdrop-blur-md border-b border-[#E7E2D8] dark:border-gray-800 sticky top-0 z-40 px-4 sm:px-6 py-2.5 shadow-2xs transition-colors">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Tenant Hierarchy */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center text-white shadow-sm font-extrabold tracking-wider text-base">
                IK
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg text-[#1F2421] dark:text-[#F1F5F9] tracking-tight">
                    Inkloom AI
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2EE] dark:bg-emerald-950/70 text-[#4A6B5B] dark:text-emerald-400 border border-[#D1E0D7] dark:border-emerald-800">
                    <Sparkles className="w-3 h-3 mr-1 text-emerald-500" />
                    BrandTrace v3.0
                  </span>
                </div>
                <p className="text-[10px] text-[#5C6460] dark:text-[#94A3B8] font-medium leading-none mt-0.5">
                  Evidence-Driven Brand Governance
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-[#E7E2D8] dark:bg-gray-800 hidden md:block" />

            {/* Multi-Tenant Organization Switcher */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowOrgMenu(!showOrgMenu)}
                className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 dark:text-gray-200 bg-slate-50 dark:bg-[#182234] hover:bg-slate-100 dark:hover:bg-[#202E46] border border-slate-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  Org: <strong className="text-slate-900 dark:text-white">{activeOrg?.name || "Aurevia Technologies"}</strong>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showOrgMenu && (
                <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-[#131926] border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
                    <span>Enterprise Multi-Tenancy</span>
                    <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded text-[9px] font-mono border border-emerald-300 dark:border-emerald-800">
                      0% Leakage
                    </span>
                  </div>
                  <div className="p-1 space-y-1">
                    {allOrgs.map((org) => {
                      const isActive = activeOrg?.id === org.id;
                      return (
                        <button
                          key={org.id}
                          onClick={() => {
                            switchTenant(org.id);
                            setShowOrgMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col space-y-0.5 ${
                            isActive
                              ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-gray-800/60 text-slate-700 dark:text-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{org.name}</span>
                            {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                            {org.active_framework}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Brand Workspace Selector */}
            <div className="relative">
              <button
                onClick={() => setShowBrandMenu(!showBrandMenu)}
                className="flex items-center space-x-1.5 text-xs font-medium text-slate-800 dark:text-gray-200 bg-[#FAF8F5] dark:bg-[#182234] hover:bg-[#F3EFE8] dark:hover:bg-[#202E46] border border-[#E7E2D8] dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Brand: <strong>{activeBrand?.name || "Aurevia"}</strong>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showBrandMenu && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-[#131926] border border-[#E7E2D8] dark:border-gray-800 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#5C6460] dark:text-gray-400 uppercase tracking-wider border-b border-[#F0ECE4] dark:border-gray-800">
                    Active Brand Workspace
                  </div>
                  {allBrands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBrand(b);
                        setShowBrandMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F5] dark:hover:bg-gray-800/60 ${
                        activeBrand?.id === b.id
                          ? "bg-[#EBF2EE] dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium"
                          : "text-[#1F2421] dark:text-gray-200"
                      }`}
                    >
                      <span>{b.name}</span>
                      {activeBrand?.id === b.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Search & Demo Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Global Search Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-[#182234] text-xs text-gray-500 dark:text-gray-400 hover:border-emerald-400 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search facts, collateral...</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 text-[10px] font-mono border border-gray-300 dark:border-gray-700">
                  Ctrl+K
                </kbd>
              </button>
            )}

            {/* Guided Demo Button */}
            {onStartDemoTour && (
              <button
                onClick={onStartDemoTour}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-950/20"
              >
                <Play className="w-3 h-3 fill-white" />
                <span className="hidden sm:inline">Guided Demo</span>
              </button>
            )}

            {/* Seed / Reset Data Control */}
            <button
              onClick={handleResetData}
              disabled={isResetting}
              title="Reset and reload complete 12-fact demo dataset"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#182234] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-emerald-500 ${isResetting ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">{isResetting ? "Loading..." : "Reset Data"}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#182234] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
            >
              {theme === "light" ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Demo Mode Pulse Indicator */}
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              DEMO ACTIVE
            </span>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                  currentUser ? ROLE_BADGE_COLORS[currentUser.role] : "bg-white text-stone-800 border-[#E7E2D8]"
                }`}
              >
                <UserCircle className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {currentUser ? ROLE_DISPLAY_NAMES[currentUser.role] : "Select Role"}
                </span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-[#131926] border border-[#E7E2D8] dark:border-gray-800 rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1 text-[11px] font-semibold text-[#1F2421] dark:text-white border-b border-[#F0ECE4] dark:border-gray-800">
                    <div>Switch Demo Role (RBAC Simulation)</div>
                    <div className="text-[10px] font-normal text-[#5C6460] dark:text-gray-400">
                      Maker-checker separation &amp; multi-tenant governance.
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1">
                    {(
                      [
                        "ORGANIZATION_ADMIN",
                        "BRAND_MANAGER",
                        "CONTENT_CREATOR",
                        "COMPLIANCE_ANALYST",
                        "REVIEWER_APPROVER",
                        "READ_ONLY_VIEWER",
                        "EVIDENCE_CUSTODIAN",
                        "CAMPAIGN_MANAGER",
                      ] as UserRole[]
                    ).map((r) => {
                      const isCurrent = currentUser?.role === r;
                      return (
                        <button
                          key={r}
                          onClick={() => {
                            switchRole(r);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F5] dark:hover:bg-gray-800/60 transition-colors ${
                            isCurrent
                              ? "bg-[#EBF2EE] dark:bg-emerald-950/40 font-semibold text-[#4A6B5B] dark:text-emerald-400"
                              : "text-[#1F2421] dark:text-gray-200"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${isCurrent ? "bg-emerald-500" : "bg-stone-300 dark:bg-gray-600"}`} />
                            <span>{ROLE_DISPLAY_NAMES[r]}</span>
                          </div>
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Benchmark Modal */}
      {showBenchmarkModal && <AdversarialBenchmarkModal onClose={() => setShowBenchmarkModal(false)} />}
    </>
  );
};
