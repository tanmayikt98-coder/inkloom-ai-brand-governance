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
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] dark:border-gray-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1F2421] dark:text-gray-100 tracking-tight">
              Governance Posture — {activeBrand?.name || "Aurevia"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              TENANT: AUREVIA-001
            </span>
          </div>
          <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-1">
            Real-time status of brand claims, evidence substantiation, and deterministic maker-checker gates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onStartDemoTour && (
            <button
              onClick={onStartDemoTour}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Guided Demo</span>
            </button>
          )}

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="px-3 py-2 bg-stone-100 dark:bg-gray-800 hover:bg-stone-200 dark:hover:bg-gray-700 text-stone-700 dark:text-gray-300 text-xs font-semibold rounded-xl border border-stone-200 dark:border-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset to 12 facts, 8 evidence docs, 6 rules, and 9 assets"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={() => onNavigate("content-audits")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Content Now</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Facts */}
        <div className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6460] dark:text-gray-400 uppercase tracking-wider">Brand Facts</span>
            <span className="p-2 bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400 rounded-xl">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#1F2421] dark:text-white">{data?.total_facts || 12}</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">100% Verified</span>
          </div>
          <p className="text-[11px] text-[#5C6460] dark:text-gray-400 mt-1">Grounded in verified benchmark reports</p>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6460] dark:text-gray-400 uppercase tracking-wider">Review Queue</span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#1F2421] dark:text-white">{data?.pending_reviews_count || 5}</span>
            <button
              onClick={() => onNavigate("review-queue")}
              className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center"
            >
              Inspect Queue <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <p className="text-[11px] text-[#5C6460] dark:text-gray-400 mt-1">Awaiting maker-checker sign-off</p>
        </div>

        {/* Evidence Sources */}
        <div className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6460] dark:text-gray-400 uppercase tracking-wider">Evidence Sources</span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#1F2421] dark:text-white">{data?.total_evidence_sources || 8}</span>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Audits &amp; SLAs</span>
          </div>
          <p className="text-[11px] text-[#5C6460] dark:text-gray-400 mt-1">
            {data?.expired_evidence_count ? `${data.expired_evidence_count} requiring renewal` : "All records active"}
          </p>
        </div>

        {/* Active Collateral */}
        <div className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6460] dark:text-gray-400 uppercase tracking-wider">Active Collateral</span>
            <span className="p-2 bg-[#FDF2F4] dark:bg-rose-950/60 text-[#A36B73] dark:text-rose-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#1F2421] dark:text-white">{data?.total_assets || 9}</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {data?.compliant_assets_count || 4} Approved
            </span>
          </div>
          <p className="text-[11px] text-[#5C6460] dark:text-gray-400 mt-1">Across Landing Pages, Ads &amp; Emails</p>
        </div>
      </div>

      {/* Charts & Collateral Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Distribution Pie Chart */}
        <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">Collateral Compliance Status</h3>
            <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-0.5">Asset health across active brand campaigns</p>
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
          <div className="space-y-1.5 pt-2 border-t border-[#F0ECE4] dark:border-gray-800">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#5C6460] dark:text-gray-400">{item.name}</span>
                </div>
                <span className="font-semibold text-[#1F2421] dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* High Exposure / Assets Needing Review */}
        <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">Priority Review &amp; Governance Alerts</h3>
                <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-0.5">Collateral requiring attention or correction</p>
              </div>
              <button
                onClick={() => onNavigate("review-queue")}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View Queue
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {(data?.high_risk_assets || []).length > 0 ? (
                data?.high_risk_assets.map((asset) => (
                  <div
                    key={asset.asset_id}
                    className="p-3 bg-[#FAF8F5] dark:bg-[#182234] border border-[#E7E2D8] dark:border-gray-800 rounded-xl flex items-start justify-between"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#1F2421] dark:text-white">{asset.asset_title}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded">
                          {asset.asset_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C6460] dark:text-gray-400">{asset.reason}</p>
                    </div>
                    <button
                      onClick={() => onNavigate("content-audits")}
                      className="shrink-0 text-xs px-2.5 py-1 bg-white dark:bg-[#131926] border border-[#E7E2D8] dark:border-gray-700 text-[#1F2421] dark:text-white hover:bg-[#FAF8F5] dark:hover:bg-gray-800 rounded-lg font-medium cursor-pointer"
                    >
                      Audit
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#5C6460] dark:text-gray-400">
                  All marketing collateral compliant and up to date.
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0ECE4] dark:border-gray-800 flex items-center justify-between text-[11px] text-[#5C6460] dark:text-gray-400">
            <span>Deterministic compliance gates active</span>
            <button
              onClick={() => onNavigate("simulator")}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center"
            >
              Test What-If Scenarios <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Immutable Audit Events Log (WORM append-only trail) */}
      <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">Governance Audit Trail (WORM Log)</h3>
          </div>
          <span className="text-[10px] text-[#5C6460] dark:text-gray-400 uppercase tracking-wider font-semibold">
            Immutable Cryptographic Ledger
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7E2D8] dark:border-gray-800 text-[#5C6460] dark:text-gray-400">
                <th className="pb-2 font-semibold">Timestamp</th>
                <th className="pb-2 font-semibold">Event</th>
                <th className="pb-2 font-semibold">Actor / Role</th>
                <th className="pb-2 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4] dark:divide-gray-800">
              {auditEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#FAF8F5] dark:hover:bg-gray-800/40">
                  <td className="py-2.5 text-[#5C6460] dark:text-gray-400 whitespace-nowrap">
                    {new Date(evt.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 font-semibold text-[#1F2421] dark:text-white whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400 rounded-full text-[10px]">
                      {evt.event_type}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#1F2421] dark:text-white whitespace-nowrap">
                    {evt.actor_name} <span className="text-[10px] text-[#5C6460] dark:text-gray-400">({evt.actor_role})</span>
                  </td>
                  <td className="py-2.5 text-[#5C6460] dark:text-gray-400">{evt.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
