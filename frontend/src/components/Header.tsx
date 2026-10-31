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
      <header className="bg-[#FCFDFD]/90 dark:bg-[#121210]/90 backdrop-blur-md border-b border-[#E8E6D9] dark:border-[#2E2C26] sticky top-0 z-40 px-4 sm:px-6 py-2.5 transition-colors shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Tenant Hierarchy */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#26251E] dark:bg-[#FCFDFD] text-[#FCFDFD] dark:text-[#26251E] flex items-center justify-center shadow-xs font-extrabold tracking-wider text-xs">
                IK
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base text-[#26251E] dark:text-[#FCFDFD] tracking-tight">
                    Inkloom AI
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#FCFDFD] border border-[#E8E6D9] dark:border-[#2E2C26]">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    BrandTrace v3.0
                  </span>
                </div>
                <p className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593] font-medium leading-none mt-0.5">
                  Evidence-Driven Brand Governance
                </p>
              </div>
            </div>

            <div className="h-5 w-px bg-[#E8E6D9] dark:bg-[#2E2C26] hidden md:block" />

            {/* Multi-Tenant Organization Switcher */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowOrgMenu(!showOrgMenu)}
                className="flex items-center space-x-1.5 text-xs font-medium text-[#26251E] dark:text-[#FCFDFD] bg-[#F3F2EB] dark:bg-[#1C1B16] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] border border-[#E8E6D9] dark:border-[#2E2C26] px-3.5 py-1.5 rounded-full active:scale-95 transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                <span>
                  Org: <strong>{activeOrg?.name || "Aurevia Technologies"}</strong>
                </span>
                <ChevronDown className="w-3 h-3 text-[#6F6C5B] dark:text-[#A9A593]" />
              </button>

              {showOrgMenu && (
                <div className="absolute left-0 mt-2 w-72 bg-[#FCFDFD] dark:bg-[#181714] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider border-b border-[#E8E6D9] dark:border-[#2E2C26] flex items-center justify-between">
                    <span>Enterprise Multi-Tenancy</span>
                    <span className="text-[#3D5A4C] dark:text-emerald-400 bg-[#EBF2EE] dark:bg-emerald-950/60 px-2 py-0.5 rounded-full text-[9px] font-mono border border-[#D1E0D7] dark:border-emerald-800">
                      0% Leakage
                    </span>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {allOrgs.map((org) => {
                      const isActive = activeOrg?.id === org.id;
                      return (
                        <button
                          key={org.id}
                          onClick={() => {
                            switchTenant(org.id);
                            setShowOrgMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex flex-col space-y-0.5 ${
                            isActive
                              ? "bg-[#26251E] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] font-semibold"
                              : "hover:bg-[#F3F2EB] dark:hover:bg-[#201F1A] text-[#26251E] dark:text-[#FCFDFD]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{org.name}</span>
                            {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                          </div>
                          <span className={`text-[10px] font-mono ${isActive ? "opacity-80" : "text-[#6F6C5B] dark:text-[#A9A593]"}`}>
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
                className="flex items-center space-x-1.5 text-xs font-medium text-[#26251E] dark:text-[#FCFDFD] bg-[#F3F2EB] dark:bg-[#1C1B16] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] border border-[#E8E6D9] dark:border-[#2E2C26] px-3.5 py-1.5 rounded-full active:scale-95 transition-all"
              >
                <Building2 className="w-3.5 h-3.5 text-[#3D5A4C] dark:text-emerald-400" />
                <span>
                  Brand: <strong>{activeBrand?.name || "Aurevia"}</strong>
                </span>
                <ChevronDown className="w-3 h-3 text-[#6F6C5B] dark:text-[#A9A593]" />
              </button>

              {showBrandMenu && (
                <div className="absolute left-0 mt-2 w-60 bg-[#FCFDFD] dark:bg-[#181714] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-2xl shadow-xl py-1.5 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider border-b border-[#E8E6D9] dark:border-[#2E2C26]">
                    Active Brand Workspace
                  </div>
                  <div className="p-1 space-y-0.5">
                    {allBrands.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setActiveBrand(b);
                          setShowBrandMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                          activeBrand?.id === b.id
                            ? "bg-[#26251E] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] font-medium"
                            : "hover:bg-[#F3F2EB] dark:hover:bg-[#201F1A] text-[#26251E] dark:text-[#FCFDFD]"
                        }`}
                      >
                        <span>{b.name}</span>
                        {activeBrand?.id === b.id && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Search & Demo Tools */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Global Search Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E8E6D9] dark:border-[#2E2C26] bg-[#F3F2EB] dark:bg-[#1C1B16] text-xs text-[#6F6C5B] dark:text-[#A9A593] hover:border-[#C5C1AF] active:scale-95 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search facts, collateral...</span>
                <kbd className="px-1.5 py-0.5 rounded-full bg-[#E8E6D9] dark:bg-[#2A2822] text-[10px] font-mono text-[#26251E] dark:text-[#FCFDFD]">
                  Ctrl+K
                </kbd>
              </button>
            )}

            {/* Guided Demo Button */}
            {onStartDemoTour && (
              <button
                onClick={onStartDemoTour}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#26251E] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] hover:opacity-90 font-semibold text-xs active:scale-95 transition-all shadow-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Guided Demo</span>
              </button>
            )}

            {/* Seed / Reset Data Control */}
            <button
              onClick={handleResetData}
              disabled={isResetting}
              title="Reset and reload complete 12-fact demo dataset"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E6D9] dark:border-[#2E2C26] bg-[#F3F2EB] dark:bg-[#1C1B16] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] text-[#26251E] dark:text-[#FCFDFD] text-xs font-medium active:scale-95 transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-orange-500 ${isResetting ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">{isResetting ? "Loading..." : "Reset Data"}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full border border-[#E8E6D9] dark:border-[#2E2C26] bg-[#F3F2EB] dark:bg-[#1C1B16] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] text-[#26251E] dark:text-[#FCFDFD] active:scale-95 transition-all"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5 text-[#26251E]" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>

            {/* Demo Mode Pulse Indicator */}
            <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-[#EBF2EE] dark:bg-emerald-950/40 text-[#3D5A4C] dark:text-emerald-300 border border-[#D1E0D7] dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              DEMO ACTIVE
            </span>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#E8E6D9] dark:border-[#2E2C26] bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#FCFDFD] active:scale-95 transition-all"
              >
                <UserCircle className="w-3.5 h-3.5 text-orange-500" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {currentUser ? ROLE_DISPLAY_NAMES[currentUser.role] : "Select Role"}
                </span>
                <ChevronDown className="w-3 h-3 text-[#6F6C5B] dark:text-[#A9A593]" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-[#FCFDFD] dark:bg-[#181714] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1 text-[11px] font-semibold text-[#26251E] dark:text-[#FCFDFD] border-b border-[#E8E6D9] dark:border-[#2E2C26]">
                    <div>Switch Demo Role (RBAC Simulation)</div>
                    <div className="text-[10px] font-normal text-[#6F6C5B] dark:text-[#A9A593]">
                      Maker-checker separation &amp; multi-tenant governance.
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-1 space-y-0.5">
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
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isCurrent
                              ? "bg-[#26251E] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] font-medium"
                              : "hover:bg-[#F3F2EB] dark:hover:bg-[#201F1A] text-[#26251E] dark:text-[#FCFDFD]"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${isCurrent ? "bg-orange-400" : "bg-stone-300 dark:bg-stone-600"}`} />
                            <span>{ROLE_DISPLAY_NAMES[r]}</span>
                          </div>
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
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
