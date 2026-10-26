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
    if (!activeBrand) return;
    try {
      setLoading(true);
      const [campData, reportData] = await Promise.all([
        api.campaigns.listByBrand(activeBrand.id),
        api.reports.getAnalytics(activeBrand.id),
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
        return "bg-red-50 text-red-700 border-red-200";
      case "MEDIUM":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421]">Campaign Governance & Analytics</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EBF2EE] text-[#4A6B5B] border border-[#D1E0D7] rounded">
              Module 8 Active
            </span>
          </div>
          <p className="text-xs text-[#5C6460] mt-1">
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
          <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#5C6460]">
              <span className="font-semibold uppercase tracking-wider">Overall Compliance</span>
              <ShieldCheck className="w-4 h-4 text-[#4A6B5B]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2421]">
              {analytics.compliance_rate}%
            </div>
            <div className="mt-2 h-1.5 w-full bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E7E2D8]">
              <div
                className="h-full bg-[#4A6B5B] rounded-full"
                style={{ width: `${analytics.compliance_rate}%` }}
              />
            </div>
            <p className="text-[10px] text-[#5C6460] mt-2">Approved marketing collateral ratio</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#5C6460]">
              <span className="font-semibold uppercase tracking-wider">Evidence Freshness</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2421]">
              {analytics.evidence_health_score}%
            </div>
            <div className="mt-2 h-1.5 w-full bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E7E2D8]">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${analytics.evidence_health_score}%` }}
              />
            </div>
            <p className="text-[10px] text-[#5C6460] mt-2">Active, unexpired evidence records</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#5C6460]">
              <span className="font-semibold uppercase tracking-wider">Review Velocity</span>
              <Clock className="w-4 h-4 text-[#A36B73]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2421]">
              {analytics.avg_turnaround_hours}h
            </div>
            <p className="text-[10px] text-[#5C6460] mt-3">Average Maker-Checker decision turnaround</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#5C6460]">
              <span className="font-semibold uppercase tracking-wider">Deterministic Rules</span>
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1F2421]">
              {analytics.active_rules_count} Active
            </div>
            <p className="text-[10px] text-[#5C6460] mt-3">{analytics.total_audits_completed} automated audits executed</p>
          </div>
        </div>
      )}

      {/* Main Campaign Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2421]">Active Marketing Campaigns</h2>
          <span className="text-xs text-[#5C6460]">{campaigns.length} campaigns governed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c) => (
            <div
              key={c.campaign_name}
              onClick={() => setSelectedCampaign(c)}
              className={`bg-white p-5 rounded-xl border cursor-pointer transition-all ${
                selectedCampaign?.campaign_name === c.campaign_name
                  ? "border-[#4A6B5B] shadow-sm ring-1 ring-[#4A6B5B]"
                  : "border-[#E7E2D8] hover:border-[#D1E0D7]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#1F2421]">{c.campaign_name}</h3>
                  <div className="flex items-center space-x-1.5 text-[11px] text-[#5C6460] mt-1">
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
                  <span className="text-[#5C6460]">Compliance Health</span>
                  <span className="font-bold text-[#1F2421]">{c.compliance_score}%</span>
                </div>
                <div className="h-2 w-full bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E7E2D8]">
                  <div
                    className={`h-full rounded-full ${
                      c.compliance_score >= 80 ? "bg-[#4A6B5B]" : c.compliance_score >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${c.compliance_score}%` }}
                  />
                </div>
              </div>

              {/* Status Breakdown Pills */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#F0ECE4] text-center">
                <div className="p-1.5 bg-[#EBF2EE] rounded">
                  <div className="text-xs font-bold text-[#4A6B5B]">{c.compliant_assets}</div>
                  <div className="text-[9px] text-[#5C6460]">Approved</div>
                </div>
                <div className="p-1.5 bg-amber-50 rounded">
                  <div className="text-xs font-bold text-amber-700">{c.pending_assets}</div>
                  <div className="text-[9px] text-[#5C6460]">In Review</div>
                </div>
                <div className="p-1.5 bg-red-50 rounded">
                  <div className="text-xs font-bold text-red-700">{c.non_compliant_assets}</div>
                  <div className="text-[9px] text-[#5C6460]">Flagged</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Campaign Assets Detail */}
      {selectedCampaign && (
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
            <div>
              <h3 className="text-sm font-bold text-[#1F2421]">
                Campaign Collateral Assets — {selectedCampaign.campaign_name}
              </h3>
              <p className="text-xs text-[#5C6460] mt-0.5">
                {selectedCampaign.assets.length} assets registered to this campaign.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#4A6B5B]">
              {selectedCampaign.compliant_assets} of {selectedCampaign.total_assets} Cleared for Launch
            </span>
          </div>

          <div className="divide-y divide-[#F0ECE4]">
            {selectedCampaign.assets.map((a) => (
              <div key={a.asset_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileCheck2 className="w-4 h-4 text-[#4A6B5B]" />
                  <div>
                    <div className="font-semibold text-xs text-[#1F2421]">{a.title}</div>
                    <div className="text-[10px] text-[#5C6460]">
                      Type: {a.asset_type} • Version {a.revision_number}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      a.status === "APPROVED"
                        ? "bg-[#EBF2EE] text-[#4A6B5B] border-[#D1E0D7]"
                        : a.status === "IN_REVIEW"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {a.status}
                  </span>
                  {onNavigateAudit && (
                    <button
                      onClick={onNavigateAudit}
                      className="text-xs text-[#4A6B5B] hover:underline flex items-center font-medium"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E7E2D8] shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D8]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#4A6B5B]" />
                <h3 className="font-bold text-sm text-[#1F2421]">Certified Brand Governance Report</h3>
              </div>
              <button
                onClick={() => setExportModalData(null)}
                className="text-xs font-semibold text-[#5C6460] hover:text-[#1F2421]"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#5C6460]">
              This payload certifies organizational adherence to evidence substantiation standards, maker-checker sign-offs, and deterministic audit gates.
            </p>

            <pre className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed text-[#1F2421]">
              {JSON.stringify(exportModalData, null, 2)}
            </pre>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#F0ECE4]">
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
