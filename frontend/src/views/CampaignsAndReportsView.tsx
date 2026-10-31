import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { CampaignItem, GovernanceReportsResponse, Severity, AssetStatus } from "../types";
import {
  FolderKanban,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Download,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

interface CampaignsAndReportsViewProps {
  onNavigateAudit?: () => void;
}

export const CampaignsAndReportsView: React.FC<CampaignsAndReportsViewProps> = ({ onNavigateAudit }) => {
  const { activeBrand } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [analytics, setAnalytics] = useState<GovernanceReportsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  const [exportModalData, setExportModalData] = useState<any | null>(null);

  const loadData = async () => {
    const brandId = activeBrand?.id || "brand-aurevia-001";
    try {
      setLoading(true);
      const [campData, reportData] = await Promise.all([
        api.campaigns.listByBrand(brandId),
        api.reports.getAnalytics(brandId),
      ]);
      setCampaigns(campData);
      setAnalytics(reportData);
      if (campData.length > 0 && !selectedCampaign) {
        setSelectedCampaign(campData[0]);
      }
    } catch (err) {
      console.error("Failed loading campaign & governance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBrand]);

  const handleExportReport = async () => {
    try {
      const summary = await api.reports.exportSummary();
      setExportModalData(summary);
    } catch (err: any) {
      alert("Failed exporting report: " + err.message);
    }
  };

  const getRiskBadge = (risk: Severity) => {
    switch (risk) {
      case "CRITICAL":
      case "HIGH":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60";
      case "MEDIUM":
        return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60";
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60";
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] dark:border-gray-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421] dark:text-white">Campaign Governance & Analytics</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-300 border border-[#D1E0D7] dark:border-emerald-800/60 rounded">
              Module 8 Active
            </span>
          </div>
          <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-1">
            Coordinate marketing collateral by campaign, enforce pre-flight compliance thresholds, and track organizational governance velocity.
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="px-4 py-2 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export Certified Governance Report
        </button>
      </div>

      {/* Analytics KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#131926] p-5 rounded-xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#5C6460] dark:text-gray-400">
              <span className="font-semibold uppercase tracking-wider">Overall Compliance</span>
              <ShieldCheck className="w-4 h-4 text-[#4A6B5B] dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2421] dark:text-white">
              {analytics.compliance_rate}%
            </div>
            <div className="mt-2 h-1.5 w-full bg-[#FAF8F5] dark:bg-gray-800 rounded-full overflow-hidden border border-[#E7E2D8] dark:border-gray-700">
              <div
                className="h-full bg-[#4A6B5B] dark:bg-emerald-500 rounded-full"
                style={{ width: `${analytics.compliance_rate}%` }}
              />
            </div>
            <p className="text-[10px] text-[#5C6460] dark:text-gray-400 mt-2">Approved marketing collateral ratio</p>
          </div>

          <div className="bg-white dark:bg-[#131926] p-5 rounded-xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#5C6460] dark:text-gray-400">
              <span className="font-semibold uppercase tracking-wider">Evidence Freshness</span>
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2421] dark:text-white">
              {analytics.evidence_health_score}%
            </div>
            <div className="mt-2 h-1.5 w-full bg-[#FAF8F5] dark:bg-gray-800 rounded-full overflow-hidden border border-[#E7E2D8] dark:border-gray-700">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full"
                style={{ width: `${analytics.evidence_health_score}%` }}
              />
            </div>
            <p className="text-[10px] text-[#5C6460] dark:text-gray-400 mt-2">Active, unexpired evidence records</p>
          </div>

          <div className="bg-white dark:bg-[#131926] p-5 rounded-xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#5C6460] dark:text-gray-400">
              <span className="font-semibold uppercase tracking-wider">Review Velocity</span>
              <Clock className="w-4 h-4 text-[#A36B73] dark:text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2421] dark:text-white">
              {analytics.avg_turnaround_hours}h
            </div>
            <p className="text-[10px] text-[#5C6460] dark:text-gray-400 mt-3">Average Maker-Checker decision turnaround</p>
          </div>

          <div className="bg-white dark:bg-[#131926] p-5 rounded-xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#5C6460] dark:text-gray-400">
              <span className="font-semibold uppercase tracking-wider">Deterministic Rules</span>
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2421] dark:text-white">
              {analytics.active_rules_count} Active
            </div>
            <p className="text-[10px] text-[#5C6460] dark:text-gray-400 mt-3">{analytics.total_audits_completed} automated audits executed</p>
          </div>
        </div>
      )}

      {/* Main Campaign Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2421] dark:text-white">Active Marketing Campaigns</h2>
          <span className="text-xs text-[#5C6460] dark:text-gray-400">{campaigns.length} campaigns governed</span>
        </div>

        {campaigns.length === 0 && !loading ? (
          <div className="bg-white dark:bg-[#131926] p-8 rounded-xl border border-[#E7E2D8] dark:border-gray-800 text-center space-y-3">
            <FolderKanban className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="font-bold text-sm text-[#1F2421] dark:text-white">No Campaigns Registered</h3>
            <p className="text-xs text-[#5C6460] dark:text-gray-400 max-w-md mx-auto">
              Initialize Aurevia campaigns to visualize marketing governance rollups and compliance distributions.
            </p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Refresh Aurevia Campaigns
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((c) => (
              <div
                key={c.campaign_name}
                onClick={() => setSelectedCampaign(c)}
                className={`bg-white dark:bg-[#131926] p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedCampaign?.campaign_name === c.campaign_name
                    ? "border-[#4A6B5B] dark:border-emerald-500 shadow-sm ring-1 ring-[#4A6B5B] dark:ring-emerald-500"
                    : "border-[#E7E2D8] dark:border-gray-800 hover:border-[#D1E0D7] dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#1F2421] dark:text-white">{c.campaign_name}</h3>
                    <div className="flex items-center space-x-1.5 text-[11px] text-[#5C6460] dark:text-gray-400 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Target: {c.target_deadline || "Ongoing"}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskBadge(c.risk_level)}`}>
                    {c.risk_level} Risk
                  </span>
                </div>

                {/* Progress */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5C6460] dark:text-gray-400">Compliance Health</span>
                    <span className="font-bold text-[#1F2421] dark:text-white">{c.compliance_score}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#FAF8F5] dark:bg-gray-800 rounded-full overflow-hidden border border-[#E7E2D8] dark:border-gray-700">
                    <div
                      className={`h-full rounded-full ${
                        c.compliance_score >= 80 ? "bg-[#4A6B5B] dark:bg-emerald-500" : c.compliance_score >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${c.compliance_score}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown Pills */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#F0ECE4] dark:border-gray-800 text-center">
                  <div className="p-1.5 bg-[#EBF2EE] dark:bg-emerald-950/40 rounded">
                    <div className="text-xs font-bold text-[#4A6B5B] dark:text-emerald-300">{c.compliant_assets}</div>
                    <div className="text-[9px] text-[#5C6460] dark:text-gray-400">Approved</div>
                  </div>
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 rounded">
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300">{c.pending_assets}</div>
                    <div className="text-[9px] text-[#5C6460] dark:text-gray-400">In Review</div>
                  </div>
                  <div className="p-1.5 bg-red-50 dark:bg-red-950/40 rounded">
                    <div className="text-xs font-bold text-red-700 dark:text-red-300">{c.non_compliant_assets}</div>
                    <div className="text-[9px] text-[#5C6460] dark:text-gray-400">Flagged</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Campaign Assets Detail */}
      {selectedCampaign && (
        <div className="bg-white dark:bg-[#131926] p-6 rounded-xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4] dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">
                Campaign Collateral Assets — {selectedCampaign.campaign_name}
              </h3>
              <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-0.5">
                {selectedCampaign.assets.length} assets registered to this campaign.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#4A6B5B] dark:text-emerald-400">
              {selectedCampaign.compliant_assets} of {selectedCampaign.total_assets} Cleared for Launch
            </span>
          </div>

          <div className="divide-y divide-[#F0ECE4] dark:divide-gray-800">
            {selectedCampaign.assets.map((a) => (
              <div key={a.asset_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileCheck2 className="w-4 h-4 text-[#4A6B5B] dark:text-emerald-400" />
                  <div>
                    <div className="font-semibold text-xs text-[#1F2421] dark:text-white">{a.title}</div>
                    <div className="text-[10px] text-[#5C6460] dark:text-gray-400">
                      Type: {a.asset_type} • Version {a.revision_number}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      a.status === "APPROVED"
                        ? "bg-[#EBF2EE] dark:bg-emerald-950/40 text-[#4A6B5B] dark:text-emerald-300 border-[#D1E0D7] dark:border-emerald-800/60"
                        : a.status === "IN_REVIEW"
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                        : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60"
                    }`}
                  >
                    {a.status}
                  </span>
                  {onNavigateAudit && (
                    <button
                      onClick={onNavigateAudit}
                      className="text-xs text-[#4A6B5B] dark:text-emerald-400 hover:underline flex items-center font-medium"
                    >
                      Audit Studio <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {exportModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#131926] rounded-xl border border-[#E7E2D8] dark:border-gray-800 shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D8] dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#4A6B5B] dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-[#1F2421] dark:text-white">Certified Brand Governance Report</h3>
              </div>
              <button
                onClick={() => setExportModalData(null)}
                className="text-xs font-semibold text-[#5C6460] dark:text-gray-400 hover:text-[#1F2421] dark:hover:text-white"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#5C6460] dark:text-gray-400">
              This payload certifies organizational adherence to evidence substantiation standards, maker-checker sign-offs, and deterministic audit gates.
            </p>

            <pre className="p-3 bg-[#FAF8F5] dark:bg-[#0B0F17] border border-[#E7E2D8] dark:border-gray-800 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed text-[#1F2421] dark:text-emerald-400">
              {JSON.stringify(exportModalData, null, 2)}
            </pre>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#F0ECE4] dark:border-gray-800">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(exportModalData, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `inkloom-governance-report-${new Date().toISOString().split("T")[0]}.json`;
                  a.click();
                }}
                className="px-4 py-2 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download JSON Audit Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
