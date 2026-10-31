import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import {
  ShieldCheck,
  Sparkles,
  Building2,
  UserCircle,
  ChevronDown,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  ExternalLink,
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
  ORGANIZATION_ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  BRAND_MANAGER: "bg-[#EBF2EE] text-[#4A6B5B] border-[#D1E0D7]",
  CONTENT_CREATOR: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLIANCE_ANALYST: "bg-amber-50 text-amber-800 border-amber-200",
  REVIEWER_APPROVER: "bg-[#FDF2F4] text-[#A36B73] border-[#F3D2D7]",
  READ_ONLY_VIEWER: "bg-stone-100 text-stone-700 border-stone-200",
  EVIDENCE_CUSTODIAN: "bg-emerald-50 text-emerald-800 border-emerald-200",
  CAMPAIGN_MANAGER: "bg-indigo-50 text-indigo-800 border-indigo-200",
  SYSTEM_SERVICE: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export const Header: React.FC = () => {
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

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E7E2D8] sticky top-0 z-40 px-6 py-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          {/* Logo & Tenant Hierarchy */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D4539] to-[#4A6B5B] flex items-center justify-center text-white shadow-xs font-bold tracking-wider text-base">
                IK
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg text-[#1F2421] tracking-tight">Inkloom AI</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2EE] text-[#4A6B5B] border border-[#D1E0D7]">
                    <Sparkles className="w-3 h-3 mr-1 text-[#4A6B5B]" />
                    BrandTrace v3.0
                  </span>
                </div>
                <p className="text-[10px] text-[#5C6460] font-medium leading-none mt-0.5">
                  Multi-Modal Grounding &amp; WORM Ledger
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-[#E7E2D8] hidden md:block" />

            {/* Multi-Tenant Organization Switcher */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowOrgMenu(!showOrgMenu)}
                className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-all shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Org: <strong className="text-slate-900">{activeOrg?.name || "Aurevia Technologies"}</strong></span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showOrgMenu && (
                <div className="absolute left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>Enterprise Multi-Tenancy</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] font-mono">
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
                            isActive ? "bg-indigo-50/80 text-indigo-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{org.name}</span>
                            {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{org.active_framework}</span>
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
                className="flex items-center space-x-1.5 text-xs font-medium text-slate-800 bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E7E2D8] px-3 py-1.5 rounded-lg transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-[#4A6B5B]" />
                <span>Brand: <strong>{activeBrand?.name || "Aurevia"}</strong></span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showBrandMenu && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white border border-[#E7E2D8] rounded-xl shadow-xl py-1 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#5C6460] uppercase tracking-wider border-b border-[#F0ECE4]">
                    Active Brand Workspace
                  </div>
                  {allBrands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBrand(b);
                        setShowBrandMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F5] ${
                        activeBrand?.id === b.id ? "bg-[#EBF2EE] text-[#4A6B5B] font-medium" : "text-[#1F2421]"
                      }`}
                    >
                      <span>{b.name}</span>
                      {activeBrand?.id === b.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#4A6B5B]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Badges & Benchmark Trigger */}
          <div className="hidden xl:flex items-center space-x-3">
            <button
              onClick={() => setShowBenchmarkModal(true)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold flex items-center space-x-1.5 transition-all shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Adversarial Benchmark: 0% Hallucinations</span>
            </button>

            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-[11px] font-bold flex items-center space-x-1.5 shadow-2xs">
              <Lock className="w-3 h-3 text-indigo-600" />
              <span>WORM Ledger: Verified Active</span>
            </span>
          </div>

          {/* Right Section: Role Badge & Local Demo Switcher */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all shadow-2xs ${
                  currentUser ? ROLE_BADGE_COLORS[currentUser.role] : "bg-white text-stone-800 border-[#E7E2D8]"
                }`}
              >
                <UserCircle className="w-3.5 h-3.5" />
                <span className="truncate max-w-[140px] sm:max-w-none">
                  {currentUser ? ROLE_DISPLAY_NAMES[currentUser.role] : "Select Role"}
                </span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white border border-[#E7E2D8] rounded-xl shadow-xl py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-1 text-[11px] font-semibold text-[#1F2421] border-b border-[#F0ECE4]">
                    <div>Switch Demo Role (RBAC Simulation)</div>
                    <div className="text-[10px] font-normal text-[#5C6460]">
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
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F5] transition-colors ${
                            isCurrent ? "bg-[#EBF2EE] font-semibold text-[#4A6B5B]" : "text-[#1F2421]"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${isCurrent ? "bg-[#4A6B5B]" : "bg-stone-300"}`} />
                            <span>{ROLE_DISPLAY_NAMES[r]}</span>
                          </div>
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#4A6B5B]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900">{currentUser?.full_name || "Elena Vance"}</span>
              <span className="text-[10px] text-slate-500 font-mono">{currentUser?.email || "admin@inkloom.ai"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Benchmark Modal */}
      {showBenchmarkModal && <AdversarialBenchmarkModal onClose={() => setShowBenchmarkModal(false)} />}
    </>
  );
};
