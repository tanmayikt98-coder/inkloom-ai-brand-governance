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
      label: "Governance Overview",
      icon: <LayoutDashboard className="w-4 h-4 mr-3" />,
    },
    {
      id: "knowledge-hub",
      label: "Brand Knowledge Hub",
      icon: <BookOpen className="w-4 h-4 mr-3" />,
    },
    {
      id: "content-audits",
      label: "Content Audits & Diff",
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
      label: "Immutable WORM Trail",
      icon: <ScrollText className="w-4 h-4 mr-3" />,
    },
    {
      id: "settings",
      label: "Settings & RBAC",
      icon: <Settings className="w-4 h-4 mr-3" />,
    },
  ];

  return (
    <aside className="w-64 bg-[#FCFDFD] dark:bg-[#151410] border-r border-[#E8E6D9] dark:border-[#2E2C26] flex flex-col justify-between py-5 shrink-0 min-h-[calc(100vh-61px)] transition-colors">
      <div>
        <div className="px-5 mb-3 text-[10px] font-bold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider">
          Brand Governance Modules
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-medium active:scale-95 transition-all ${
                  isActive
                    ? "bg-[#26251E] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] font-semibold shadow-xs"
                    : "text-[#6F6C5B] dark:text-[#A9A593] hover:bg-[#F3F2EB] dark:hover:bg-[#1C1B16] hover:text-[#26251E] dark:hover:text-[#FCFDFD]"
                }`}
              >
                <div className="flex items-center">
                  <span className={`transition-colors ${isActive ? "text-[#FCFDFD] dark:text-[#26251E]" : "text-[#8C8976] dark:text-[#6F6C5B]"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Governance Trust Badge */}
      <div className="px-3 mt-6">
        <div className="p-3.5 bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-2xl">
          <div className="flex items-center space-x-2 text-[#26251E] dark:text-[#FCFDFD] mb-1">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <span className="text-[11px] font-bold">Deterministic Gate</span>
          </div>
          <p className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
            Strict evidence substantiation active. Zero unverified claims permitted in production.
          </p>
        </div>
      </div>
    </aside>
  );
};
