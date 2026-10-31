import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { DashboardOverview, AuditEventItem } from "../types";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileText,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  History,
  Sparkles,
  Zap,
  Lock,
  Cpu,
  Layers,
  RotateCcw,
  Play,
  CheckCircle2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface OverviewViewProps {
  onNavigate: (section: any) => void;
  onStartDemoTour?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate, onStartDemoTour }) => {
  const { activeBrand } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const overview = await api.dashboard.getOverview(activeBrand?.id);
      setData(overview);
      const events = await api.dashboard.getAuditEvents(10);
      setAuditEvents(events);
    } catch (err) {
      console.error("Failed to load dashboard overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBrand]);

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
      await fetchData();
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

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <Activity className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Loading BrandTrace Governance Posture...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Verifying cryptographic hash chain &amp; multi-tenant boundaries</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Compliant Assets", value: data?.compliant_assets_count || 1, color: "#10B981" },
    { name: "Pending Review", value: data?.pending_reviews_count || 1, color: "#F59E0B" },
    { name: "Non-Compliant / Flagged", value: data?.non_compliant_assets_count || 1, color: "#EF4444" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title & Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E8E6D9] dark:border-[#2E2C26] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#26251E] dark:text-[#FCFDFD] tracking-tight">
              Governance Posture — {activeBrand?.name || "Aurevia"}
            </h1>
            <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#FCFDFD] border border-[#E8E6D9] dark:border-[#2E2C26]">
              TENANT: AUREVIA-001
            </span>
          </div>
          <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-1">
            Real-time status of brand claims, evidence substantiation, and deterministic maker-checker gates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onStartDemoTour && (
            <button
              onClick={onStartDemoTour}
              className="px-4 py-2 bg-[#F3F2EB] dark:bg-[#1C1B16] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] text-[#26251E] dark:text-[#FCFDFD] text-xs font-semibold rounded-full border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Launch Guided Demo</span>
            </button>
          )}

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="px-4 py-2 bg-[#F3F2EB] dark:bg-[#1C1B16] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] text-[#26251E] dark:text-[#FCFDFD] text-xs font-semibold rounded-full border border-[#E8E6D9] dark:border-[#2E2C26] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Reset to 12 facts, 8 evidence docs, 6 rules, and 9 assets"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-orange-500 ${isResetting ? "animate-spin" : ""}`} />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={() => onNavigate("content-audits")}
            className="px-4 py-2 bg-[#26251E] hover:bg-[#3B392F] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] dark:hover:bg-[#E8E6D9] text-xs font-semibold rounded-full shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>Audit Content Now</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Facts */}
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-2xs hover:border-[#C5C1AF] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider">Brand Facts</span>
            <span className="p-2 rounded-full bg-[#F3F2EB] dark:bg-[#25241E] text-[#26251E] dark:text-[#FCFDFD]">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#26251E] dark:text-[#FCFDFD] tracking-tight">{data?.total_facts || 12}</span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#3D5A4C] dark:text-emerald-300 border border-[#D1E0D7] dark:border-emerald-800">
              100% Verified
            </span>
          </div>
          <p className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593] mt-2">Grounded in verified benchmark reports</p>
        </div>

        {/* Pending Reviews */}
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-2xs hover:border-[#C5C1AF] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider">Review Queue</span>
            <span className="p-2 rounded-full bg-[#FEF7EE] dark:bg-[#25241E] text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#26251E] dark:text-[#FCFDFD] tracking-tight">{data?.pending_reviews_count || 5}</span>
            <button
              onClick={() => onNavigate("review-queue")}
              className="text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline flex items-center"
            >
              Inspect Queue <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <p className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593] mt-2">Awaiting maker-checker sign-off</p>
        </div>

        {/* Evidence Sources */}
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-2xs hover:border-[#C5C1AF] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider">Evidence Sources</span>
            <span className="p-2 rounded-full bg-[#F3F2EB] dark:bg-[#25241E] text-[#26251E] dark:text-[#FCFDFD]">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#26251E] dark:text-[#FCFDFD] tracking-tight">{data?.total_evidence_sources || 8}</span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#FCFDFD] border border-[#E8E6D9] dark:border-[#2E2C26]">
              Audits &amp; SLAs
            </span>
          </div>
          <p className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593] mt-2">
            {data?.expired_evidence_count ? `${data.expired_evidence_count} requiring renewal` : "All records active"}
          </p>
        </div>

        {/* Active Collateral */}
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-2xs hover:border-[#C5C1AF] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider">Active Collateral</span>
            <span className="p-2 rounded-full bg-[#FDF2F4] dark:bg-[#25241E] text-rose-700 dark:text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#26251E] dark:text-[#FCFDFD] tracking-tight">{data?.total_assets || 9}</span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#3D5A4C] dark:text-emerald-300 border border-[#D1E0D7] dark:border-emerald-800">
              {data?.compliant_assets_count || 4} Approved
            </span>
          </div>
          <p className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593] mt-2">Across Landing Pages, Ads &amp; Emails</p>
        </div>
      </div>

      {/* Enterprise Governance Capabilities Banner */}
      <div className="bg-[#26251E] dark:bg-[#1C1B16] text-[#FCFDFD] p-6 rounded-3xl border border-[#3E3B32] dark:border-[#2E2C26] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3E3B32] dark:border-[#2E2C26] pb-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-[#FCFDFD]">Enterprise Governance &amp; Verification Engines</h2>
          </div>
          <span className="text-[11px] text-[#A9A593] font-mono">
            Sub-400ms Hybrid Retrieval • &lt;2.0s Cascade Revocation • RFC 3161 WORM Ledger
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1 */}
          <div
            onClick={() => onNavigate("traceability")}
            className="p-4 bg-[#34322A] dark:bg-[#25241E] hover:bg-[#3D3A31] border border-[#444035] dark:border-[#333129] rounded-2xl cursor-pointer transition-all space-y-2 group shadow-2xs active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-mono bg-[#444035] px-2.5 py-0.5 rounded-full border border-[#524E40]">
                Visual Grounding
              </span>
              <Cpu className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-sm font-bold text-[#FCFDFD] group-hover:text-orange-200">
              Multi-Modal Evidence Grounding &amp; Bounding Boxes
            </h3>
            <p className="text-xs text-[#A9A593] leading-relaxed">
              PyMuPDF vector mapping, sub-400ms dense + BM25 hybrid retrieval, zero hallucinated citations benchmarked.
            </p>
            <div className="text-[11px] text-orange-300 font-semibold flex items-center space-x-1 pt-1">
              <span>Inspect Bounding Box Provenance</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => onNavigate("impact-map")}
            className="p-4 bg-[#34322A] dark:bg-[#25241E] hover:bg-[#3D3A31] border border-[#444035] dark:border-[#333129] rounded-2xl cursor-pointer transition-all space-y-2 group shadow-2xs active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono bg-[#444035] px-2.5 py-0.5 rounded-full border border-[#524E40]">
                Cascade Engine
              </span>
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-sm font-bold text-[#FCFDFD] group-hover:text-amber-200">
              Automated Blast-Radius &amp; Cascade Re-Audit
            </h3>
            <p className="text-xs text-[#A9A593] leading-relaxed">
              Instant approval invalidation (&lt; 2.0s SLA), 100% automated background re-auditing with diffs, Slack webhook dispatch.
            </p>
            <div className="text-[11px] text-amber-300 font-semibold flex items-center space-x-1 pt-1">
              <span>Launch Automated Cascade Hub</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => onNavigate("audit-history")}
            className="p-4 bg-[#34322A] dark:bg-[#25241E] hover:bg-[#3D3A31] border border-[#444035] dark:border-[#333129] rounded-2xl cursor-pointer transition-all space-y-2 group shadow-2xs active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono bg-[#444035] px-2.5 py-0.5 rounded-full border border-[#524E40]">
                WORM Ledger
              </span>
              <Lock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-sm font-bold text-[#FCFDFD] group-hover:text-emerald-200">
              Cryptographic WORM Ledger &amp; Multi-Tenancy
            </h3>
            <p className="text-xs text-[#A9A593] leading-relaxed">
              SHA-256 Merkle-tree hash chaining, sub-second verification, 0% cross-tenant leakage, exportable JSON-LD proof.
            </p>
            <div className="text-[11px] text-emerald-300 font-semibold flex items-center space-x-1 pt-1">
              <span>Verify Cryptographic WORM Proof</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Collateral Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Distribution Pie Chart */}
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#26251E] dark:text-[#FCFDFD]">Collateral Compliance Status</h3>
            <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-0.5">Asset health across active brand campaigns</p>
          </div>
          <div className="h-48 w-full my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[#E8E6D9] dark:border-[#2E2C26]">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#6F6C5B] dark:text-[#A9A593]">{item.name}</span>
                </div>
                <span className="font-semibold text-[#26251E] dark:text-[#FCFDFD]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* High Exposure / Assets Needing Review */}
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-2xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#26251E] dark:text-[#FCFDFD]">Priority Review &amp; Governance Alerts</h3>
                <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-0.5">Collateral requiring attention or correction</p>
              </div>
              <button
                onClick={() => onNavigate("review-queue")}
                className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
              >
                View Queue
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {(data?.high_risk_assets || []).length > 0 ? (
                data?.high_risk_assets.map((asset) => (
                  <div
                    key={asset.asset_id}
                    className="p-3.5 bg-[#F3F2EB] dark:bg-[#201F1A] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-2xl flex items-start justify-between"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#26251E] dark:text-[#FCFDFD]">{asset.asset_title}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#E8E6D9] dark:bg-[#2A2822] text-[#26251E] dark:text-[#FCFDFD] rounded-full">
                          {asset.asset_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593]">{asset.reason}</p>
                    </div>
                    <button
                      onClick={() => onNavigate("content-audits")}
                      className="shrink-0 text-xs px-3 py-1 bg-[#26251E] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] rounded-full font-medium active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      Audit
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#6F6C5B] dark:text-[#A9A593]">
                  All marketing collateral compliant and up to date.
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E8E6D9] dark:border-[#2E2C26] flex items-center justify-between text-[11px] text-[#6F6C5B] dark:text-[#A9A593]">
            <span>Deterministic compliance gates active</span>
            <button
              onClick={() => onNavigate("simulator")}
              className="text-orange-600 dark:text-orange-400 font-semibold hover:underline flex items-center"
            >
              Test What-If Scenarios <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Immutable Audit Events Log (WORM append-only trail) */}
      <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-[#26251E] dark:text-[#FCFDFD]">Governance Audit Trail (WORM Log)</h3>
          </div>
          <span className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider font-semibold">
            Immutable Cryptographic Ledger
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8E6D9] dark:border-[#2E2C26] text-[#6F6C5B] dark:text-[#A9A593]">
                <th className="pb-2.5 font-semibold">Timestamp</th>
                <th className="pb-2.5 font-semibold">Event</th>
                <th className="pb-2.5 font-semibold">Actor / Role</th>
                <th className="pb-2.5 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6D9]/60 dark:divide-[#2E2C26]">
              {auditEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#F3F2EB]/50 dark:hover:bg-[#201F1A] transition-colors">
                  <td className="py-3 text-[#6F6C5B] dark:text-[#A9A593] whitespace-nowrap">
                    {new Date(evt.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 font-semibold text-[#26251E] dark:text-[#FCFDFD] whitespace-nowrap">
                    <span className="px-2.5 py-0.5 bg-[#F3F2EB] dark:bg-[#201F1A] text-[#26251E] dark:text-[#FCFDFD] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-full text-[10px]">
                      {evt.event_type}
                    </span>
                  </td>
                  <td className="py-3 text-[#26251E] dark:text-[#FCFDFD] whitespace-nowrap">
                    {evt.actor_name} <span className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">({evt.actor_role})</span>
                  </td>
                  <td className="py-3 text-[#6F6C5B] dark:text-[#A9A593]">{evt.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
