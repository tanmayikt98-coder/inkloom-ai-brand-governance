import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface OverviewViewProps {
  onNavigate: (section: any) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { activeBrand } = useAuth();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
    fetchData();
  }, [activeBrand]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-[#5C6460]">
          <Activity className="w-5 h-5 animate-spin text-[#4A6B5B]" />
          <span className="text-sm font-medium">Loading BrandTrace Governance Overview...</span>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Compliant Assets", value: data?.compliant_assets_count || 1, color: "#4A6B5B" },
    { name: "Pending Review", value: data?.pending_reviews_count || 1, color: "#D97706" },
    { name: "Non-Compliant / Flagged", value: data?.non_compliant_assets_count || 1, color: "#B33939" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2421] tracking-tight">
            Governance Overview — {activeBrand?.name || "Aurevia"}
          </h1>
          <p className="text-xs text-[#5C6460] mt-1">
            Real-time status of brand claims, evidence substantiation, and review gates.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate("content-audits")}
            className="px-4 py-2 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Audit Content Now
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Facts */}
        <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6460] uppercase tracking-wider">Brand Facts</span>
            <span className="p-2 bg-[#EBF2EE] text-[#4A6B5B] rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#1F2421]">{data?.total_facts || 0}</span>
            <span className="text-[11px] font-medium text-[#4A6B5B]">100% Verified</span>
          </div>
          <p className="text-[11px] text-[#5C6460] mt-1">Grounded in verified benchmark reports</p>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6460] uppercase tracking-wider">Review Queue</span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#1F2421]">{data?.pending_reviews_count || 0}</span>
            <button
              onClick={() => onNavigate("review-queue")}
              className="text-[11px] font-medium text-amber-700 hover:underline flex items-center"
            >
              Inspect Queue <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <p className="text-[11px] text-[#5C6460] mt-1">Awaiting maker-checker sign-off</p>
        </div>

        {/* Evidence Sources */}
        <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6460] uppercase tracking-wider">Evidence Sources</span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#1F2421]">{data?.total_evidence_sources || 0}</span>
            <span className="text-[11px] font-medium text-blue-700">Audit Reports & SLAs</span>
          </div>
          <p className="text-[11px] text-[#5C6460] mt-1">
            {data?.expired_evidence_count ? `${data.expired_evidence_count} requiring renewal` : "All records active"}
          </p>
        </div>

        {/* Compliance Integrity */}
        <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6460] uppercase tracking-wider">Active Collateral</span>
            <span className="p-2 bg-[#FDF2F4] text-[#A36B73] rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#1F2421]">{data?.total_assets || 0}</span>
            <span className="text-[11px] font-medium text-[#4A6B5B]">
              {data?.compliant_assets_count || 0} Approved
            </span>
          </div>
          <p className="text-[11px] text-[#5C6460] mt-1">Across Landing Pages, Ads & Emails</p>
        </div>
      </div>

      {/* Charts & Collateral Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1F2421]">Collateral Compliance Status</h3>
            <p className="text-xs text-[#5C6460] mt-0.5">Asset health across active brand campaigns</p>
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
          <div className="space-y-1.5 pt-2 border-t border-[#F0ECE4]">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#5C6460]">{item.name}</span>
                </div>
                <span className="font-semibold text-[#1F2421]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* High Exposure / Assets Needing Review */}
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1F2421]">Priority Review & Governance Alerts</h3>
                <p className="text-xs text-[#5C6460] mt-0.5">Collateral requiring attention or correction</p>
              </div>
              <button
                onClick={() => onNavigate("review-queue")}
                className="text-xs font-semibold text-[#4A6B5B] hover:underline"
              >
                View Queue
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {(data?.high_risk_assets || []).length > 0 ? (
                data?.high_risk_assets.map((asset) => (
                  <div
                    key={asset.asset_id}
                    className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg flex items-start justify-between"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#1F2421]">{asset.asset_title}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                          {asset.asset_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C6460]">{asset.reason}</p>
                    </div>
                    <button
                      onClick={() => onNavigate("content-audits")}
                      className="shrink-0 text-xs px-2.5 py-1 bg-white border border-[#E7E2D8] text-[#1F2421] hover:bg-[#FAF8F5] rounded font-medium"
                    >
                      Audit
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#5C6460]">
                  All marketing collateral compliant and up to date.
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-[11px] text-[#5C6460]">
            <span>Deterministic compliance gates active</span>
            <button
              onClick={() => onNavigate("simulator")}
              className="text-[#4A6B5B] font-semibold hover:underline flex items-center"
            >
              Test What-If Scenarios <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Immutable Audit Events Log (WORM append-only trail) */}
      <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-[#4A6B5B]" />
            <h3 className="text-sm font-bold text-[#1F2421]">Governance Audit Trail (WORM Log)</h3>
          </div>
          <span className="text-[10px] text-[#5C6460] uppercase tracking-wider font-semibold">
            Immutable Historical Log
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7E2D8] text-[#5C6460]">
                <th className="pb-2 font-semibold">Timestamp</th>
                <th className="pb-2 font-semibold">Event</th>
                <th className="pb-2 font-semibold">Actor / Role</th>
                <th className="pb-2 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {auditEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-2.5 text-[#5C6460] whitespace-nowrap">
                    {new Date(evt.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 font-semibold text-[#1F2421] whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-[#EBF2EE] text-[#4A6B5B] rounded text-[10px]">
                      {evt.event_type}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#1F2421] whitespace-nowrap">
                    {evt.actor_name} <span className="text-[10px] text-[#5C6460]">({evt.actor_role})</span>
                  </td>
                  <td className="py-2.5 text-[#5C6460]">{evt.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
