import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  GitBranch,
  Inbox,
  History,
  Network,
  FlaskConical,
  Settings,
  ShieldAlert,
  FolderKanban,
  ScrollText,
} from "lucide-react";

export type NavSection =
  | "overview"
  | "knowledge-hub"
  | "content-audits"
  | "traceability"
  | "review-queue"
  | "time-machine"
  | "impact-map"
  | "simulator"
  | "campaigns"
  | "audit-history"
  | "settings";

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  pendingReviewsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  pendingReviewsCount = 0,
}) => {
  const navItems: { id: NavSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="w-4 h-4 mr-3" />,
    },
    {
      id: "knowledge-hub",
      label: "Brand Knowledge Hub",
      icon: <BookOpen className="w-4 h-4 mr-3" />,
    },
    {
      id: "content-audits",
      label: "Content Audits",
      icon: <FileCheck2 className="w-4 h-4 mr-3" />,
    },
    {
      id: "traceability",
      label: "Evidence & Traceability",
      icon: <GitBranch className="w-4 h-4 mr-3" />,
    },
    {
      id: "review-queue",
      label: "Review Queue",
      icon: <Inbox className="w-4 h-4 mr-3" />,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
    },
    {
      id: "time-machine",
      label: "Brand Time Machine",
      icon: <History className="w-4 h-4 mr-3" />,
    },
    {
      id: "impact-map",
      label: "Brand Impact Map",
      icon: <Network className="w-4 h-4 mr-3" />,
    },
    {
      id: "simulator",
      label: "What-If Simulator",
      icon: <FlaskConical className="w-4 h-4 mr-3" />,
    },
    {
      id: "campaigns",
      label: "Campaigns & Analytics",
      icon: <FolderKanban className="w-4 h-4 mr-3" />,
    },
    {
      id: "audit-history",
      label: "Immutable Audit Trail",
      icon: <ScrollText className="w-4 h-4 mr-3" />,
    },
    {
      id: "settings",
      label: "Settings & RBAC",
      icon: <Settings className="w-4 h-4 mr-3" />,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E7E2D8] flex flex-col justify-between py-5 shrink-0 min-h-[calc(100vh-61px)]">
      <div>
        <div className="px-5 mb-3 text-[10px] font-bold text-[#5C6460] uppercase tracking-wider">
          Brand Governance Modules
        </div>
        <nav className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#EBF2EE] text-[#4A6B5B] font-semibold shadow-xs"
                    : "text-[#2B2D2F] hover:bg-[#FAF8F5] hover:text-[#1F2421]"
                }`}
              >
                <div className="flex items-center">
                  <span className={isActive ? "text-[#4A6B5B]" : "text-[#5C6460]"}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-[#A36B73] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Governance Trust Badge */}
      <div className="px-4 mt-6">
        <div className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg">
          <div className="flex items-center space-x-2 text-[#4A6B5B] mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[11px] font-bold">Deterministic Gate</span>
          </div>
          <p className="text-[10px] text-[#5C6460] leading-relaxed">
            Strict evidence substantiation active. Zero unverified claims permitted in production.
          </p>
        </div>
      </div>
    </aside>
  );
};
