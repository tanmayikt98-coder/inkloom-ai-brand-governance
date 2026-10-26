import React from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import { ShieldCheck, Sparkles, Building2, UserCircle, ChevronDown, CheckCircle2 } from "lucide-react";

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
  const { currentUser, activeBrand, allBrands, setActiveBrand, switchRole, demoUsers } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);
  const [showBrandMenu, setShowBrandMenu] = React.useState(false);

  return (
    <header className="bg-white border-b border-[#E7E2D8] sticky top-0 z-40 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Brand Logo & Intelligence Tag */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#4A6B5B] flex items-center justify-center text-white shadow-sm font-semibold tracking-wide text-lg">
              IK
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-[#1F2421] tracking-tight">Inkloom AI</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#EBF2EE] text-[#4A6B5B] border border-[#D1E0D7]">
                  <Sparkles className="w-3 h-3 mr-1 text-[#4A6B5B]" />
                  BrandTrace Intelligence
                </span>
              </div>
              <p className="text-[11px] text-[#5C6460] font-normal leading-none mt-0.5">
                Evidence-Driven Brand Governance
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-[#E7E2D8] hidden sm:block"></div>

          {/* Active Brand Workspace Selector */}
          <div className="relative">
            <button
              onClick={() => setShowBrandMenu(!showBrandMenu)}
              className="flex items-center space-x-2 text-xs font-medium text-[#1F2421] bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E7E2D8] px-3 py-1.5 rounded-md transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-[#4A6B5B]" />
              <span>Brand: <strong>{activeBrand?.name || "Aurevia"}</strong></span>
              <ChevronDown className="w-3 h-3 text-[#5C6460]" />
            </button>

            {showBrandMenu && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white border border-[#E7E2D8] rounded-lg shadow-lg py-1 z-50">
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

        {/* Right Section: Role Badge & Local Demo Role Switcher */}
        <div className="flex items-center space-x-4">
          {/* Clearly Labelled Local Demo Switcher */}
          <div className="relative">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#5C6460] hidden md:inline font-medium">Demo Mode:</span>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-md border transition-all ${
                  currentUser ? ROLE_BADGE_COLORS[currentUser.role] : "bg-white text-stone-800 border-[#E7E2D8]"
                }`}
              >
                <UserCircle className="w-3.5 h-3.5" />
                <span>Role: <strong>{currentUser ? ROLE_DISPLAY_NAMES[currentUser.role] : "Select Role"}</strong></span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
            </div>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white border border-[#E7E2D8] rounded-lg shadow-xl py-2 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-[#1F2421] border-b border-[#F0ECE4]">
                  <div>Switch Demo Role (RBAC Simulation)</div>
                  <div className="text-[10px] font-normal text-[#5C6460]">
                    Select any role to test authorization gates & maker-checker policies.
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

          {/* Active User Name */}
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-[#1F2421]">{currentUser?.full_name || "Elena Vance"}</span>
            <span className="text-[10px] text-[#5C6460]">{currentUser?.email || "admin@inkloom.ai"}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
