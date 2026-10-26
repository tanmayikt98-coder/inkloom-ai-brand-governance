import React from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import {
  Settings,
  Shield,
  Users,
  Check,
  X,
  Lock,
  Building,
  Key,
} from "lucide-react";

interface PermissionDef {
  action: string;
  module: string;
  roles: UserRole[];
}

const PERMISSION_MATRIX: PermissionDef[] = [
  { action: "Manage Workspaces & Brand Profiles", module: "Administration", roles: ["ORGANIZATION_ADMIN", "BRAND_MANAGER"] },
  { action: "Manage Users & Assign Roles", module: "Administration", roles: ["ORGANIZATION_ADMIN"] },
  { action: "Create & Update Brand Facts", module: "Brand Knowledge Hub", roles: ["ORGANIZATION_ADMIN", "BRAND_MANAGER"] },
  { action: "Upload & Verify Evidence Documents", module: "Evidence Store", roles: ["ORGANIZATION_ADMIN", "EVIDENCE_CUSTODIAN", "BRAND_MANAGER"] },
  { action: "Create & Edit Marketing Collateral", module: "Content Authoring", roles: ["ORGANIZATION_ADMIN", "CONTENT_CREATOR", "BRAND_MANAGER", "CAMPAIGN_MANAGER"] },
  { action: "Run Deterministic Content Audits", module: "Compliance Engine", roles: ["ORGANIZATION_ADMIN", "CONTENT_CREATOR", "COMPLIANCE_ANALYST", "BRAND_MANAGER", "CAMPAIGN_MANAGER"] },
  { action: "Approve Collateral (Maker-Checker Gate)", module: "Review Queue", roles: ["ORGANIZATION_ADMIN", "REVIEWER_APPROVER"] },
  { action: "Execute Brand Time Machine Restores", module: "Time Machine", roles: ["ORGANIZATION_ADMIN", "BRAND_MANAGER", "CONTENT_CREATOR"] },
  { action: "Run & Promote What-If Scenarios", module: "Simulator", roles: ["ORGANIZATION_ADMIN", "BRAND_MANAGER"] },
  { action: "View Analytics & Reports Only", module: "Governance Analytics", roles: ["READ_ONLY_VIEWER", "ORGANIZATION_ADMIN", "BRAND_MANAGER", "REVIEWER_APPROVER"] },
];

export const SettingsView: React.FC = () => {
  const { currentUser, demoUsers, switchRole } = useAuth();

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#E7E2D8]">
        <h1 className="text-2xl font-bold text-[#1F2421]">Settings & Role-Based Access Control (RBAC)</h1>
        <p className="text-xs text-[#5C6460] mt-1">
          Complete permissions matrix, workspace tenant isolation, and demonstration user accounts.
        </p>
      </div>

      {/* Active User Security Status */}
      <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#5C6460] tracking-wider block">
            Current Authenticated Principal
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg font-bold text-[#1F2421]">{currentUser?.full_name}</span>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#EBF2EE] text-[#4A6B5B] border border-[#D1E0D7]">
              {currentUser?.role}
            </span>
          </div>
          <p className="text-xs text-[#5C6460] mt-0.5">
            Email: {currentUser?.email} • Organization: Aurevia Technologies Inc. (Tenant Isolated)
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#5C6460]">
          <Lock className="w-4 h-4 text-[#4A6B5B]" />
          <span>Backend Authorization Enforced</span>
        </div>
      </div>

      {/* Demo Accounts Quick-Switching Grid */}
      <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#1F2421]">Demo Accounts (All 8 Human Roles)</h3>
          <p className="text-xs text-[#5C6460] mt-0.5">
            Click any account to immediately simulate their backend permissions and workflow view.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {demoUsers.map((u) => {
            const isCurrent = currentUser?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => switchRole(u.role)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? "bg-[#EBF2EE] border-[#4A6B5B] shadow-xs"
                    : "bg-[#FAF8F5] border-[#E7E2D8] hover:border-[#D1E0D7]"
                }`}
              >
                <div className="font-bold text-xs text-[#1F2421]">{u.full_name}</div>
                <div className="text-[10px] text-[#4A6B5B] font-semibold mt-0.5">{u.role}</div>
                <div className="text-[10px] text-[#5C6460] mt-1">{u.email}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Complete Role-Permission Matrix */}
      <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#1F2421]">Role-Based Access Control (RBAC) Permission Matrix</h3>
          <p className="text-xs text-[#5C6460] mt-0.5">
            Verified server-side enforcement. Unauthorized requests return HTTP 403 Forbidden.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E2D8] text-[#5C6460]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Governance Capability</th>
                <th className="py-2.5 px-3 font-semibold">Module</th>
                <th className="py-2.5 px-3 font-semibold">Admin</th>
                <th className="py-2.5 px-3 font-semibold">Brand Mgr</th>
                <th className="py-2.5 px-3 font-semibold">Creator</th>
                <th className="py-2.5 px-3 font-semibold">Auditor</th>
                <th className="py-2.5 px-3 font-semibold">Approver</th>
                <th className="py-2.5 px-3 font-semibold">Custodian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {PERMISSION_MATRIX.map((perm, i) => (
                <tr key={i} className="hover:bg-[#FAF8F5]">
                  <td className="py-2.5 px-3 font-semibold text-[#1F2421]">{perm.action}</td>
                  <td className="py-2.5 px-3 text-[#5C6460] text-[11px]">{perm.module}</td>
                  {/* Admin */}
                  <td className="py-2.5 px-3 text-center">
                    <Check className="w-4 h-4 text-[#4A6B5B] inline" />
                  </td>
                  {/* Brand Mgr */}
                  <td className="py-2.5 px-3 text-center">
                    {perm.roles.includes("BRAND_MANAGER") ? (
                      <Check className="w-4 h-4 text-[#4A6B5B] inline" />
                    ) : (
                      <X className="w-4 h-4 text-stone-300 inline" />
                    )}
                  </td>
                  {/* Creator */}
                  <td className="py-2.5 px-3 text-center">
                    {perm.roles.includes("CONTENT_CREATOR") ? (
                      <Check className="w-4 h-4 text-[#4A6B5B] inline" />
                    ) : (
                      <X className="w-4 h-4 text-stone-300 inline" />
                    )}
                  </td>
                  {/* Compliance Auditor */}
                  <td className="py-2.5 px-3 text-center">
                    {perm.roles.includes("COMPLIANCE_ANALYST") ? (
                      <Check className="w-4 h-4 text-[#4A6B5B] inline" />
                    ) : (
                      <X className="w-4 h-4 text-stone-300 inline" />
                    )}
                  </td>
                  {/* Approver */}
                  <td className="py-2.5 px-3 text-center">
                    {perm.roles.includes("REVIEWER_APPROVER") ? (
                      <Check className="w-4 h-4 text-[#4A6B5B] inline" />
                    ) : (
                      <X className="w-4 h-4 text-stone-300 inline" />
                    )}
                  </td>
                  {/* Custodian */}
                  <td className="py-2.5 px-3 text-center">
                    {perm.roles.includes("EVIDENCE_CUSTODIAN") ? (
                      <Check className="w-4 h-4 text-[#4A6B5B] inline" />
                    ) : (
                      <X className="w-4 h-4 text-stone-300 inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
