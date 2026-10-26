import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { MarketingAsset, AuditRun, FindingCategory, Severity } from "../types";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  Send,
  Save,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";

const SEVERITY_BADGES: Record<Severity, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
  HIGH: "bg-amber-100 text-amber-800 border-amber-200",
  MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
  LOW: "bg-green-100 text-green-800 border-green-200",
};

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  SUPPORTED: "Verified Supported",
  UNSUPPORTED: "Unsupported Claim",
  CONTRADICTED: "Direct Contradiction",
  NEEDS_HUMAN_VERIFICATION: "Needs Verification",
  EXPIRED_EVIDENCE: "Expired Evidence Source",
  MISSING_DISCLOSURE: "Missing Disclosure",
  BRAND_GUIDELINE_VIOLATION: "Guideline Violation",
  INSUFFICIENT_EVIDENCE: "Insufficient Evidence",
};

export const ContentAuditsView: React.FC = () => {
  const { activeBrand, canCreateContent } = useAuth();
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MarketingAsset | null>(null);
  const [contentText, setContentText] = useState<string>("");
  const [auditResult, setAuditResult] = useState<AuditRun | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadAssets = async () => {
    if (!activeBrand) return;
    try {
      const list = await api.assets.listByBrand(activeBrand.id);
      setAssets(list);
      if (list.length > 0 && !selectedAsset) {
        // Select hero landing page by default
        const hero = list.find((a) => a.title.toLowerCase().includes("landing")) || list[0];
        handleSelectAsset(hero);
      }
    } catch (err) {
      console.error("Failed to load assets:", err);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [activeBrand]);

  const handleSelectAsset = async (asset: MarketingAsset) => {
    setSelectedAsset(asset);
    setContentText(asset.latest_content || "");
    setAuditResult(null);
    setStatusMessage(null);

    // Fetch latest audit if revision exists
    if (asset.current_revision_id) {
      try {
        const latest = await api.audits.getLatestAudit(asset.current_revision_id);
        setAuditResult(latest);
      } catch (err) {
        console.error("Failed fetching latest audit:", err);
      }
    }
  };

  const handleRunAudit = async () => {
    if (!selectedAsset) return;
    try {
      setIsAuditing(true);
      setStatusMessage("Extracting measurable claims & evaluating deterministic compliance rules...");

      // 1. If content was modified, save a new revision first
      let revId = selectedAsset.current_revision_id;
      if (contentText.trim() !== (selectedAsset.latest_content || "").trim()) {
        const newRev = await api.assets.createRevision(selectedAsset.id, {
          content_text: contentText,
          change_summary: "Edited in Content Audit Studio.",
        });
        revId = newRev.id;
        selectedAsset.current_revision_id = newRev.id;
        selectedAsset.latest_content = contentText;
      }

      if (!revId) return;

      // 2. Run audit
      const run = await api.audits.runAudit(revId);
      setAuditResult(run);
      setStatusMessage(`Audit completed in ${run.execution_ms}ms.`);
      await loadAssets();
    } catch (err: any) {
      alert("Audit execution failed: " + err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedAsset) return;
    try {
      await api.reviews.submit(selectedAsset.id);
      alert(`Asset '${selectedAsset.title}' submitted to human review queue!`);
      await loadAssets();
    } catch (err: any) {
      alert("Submission error: " + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2421]">Evidence-Driven Content Audit</h1>
          <p className="text-xs text-[#5C6460] mt-1">
            Deterministic claim substantiation against official brand facts and mandatory disclosures.
          </p>
        </div>

        {selectedAsset && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-4 py-2 bg-[#4A6B5B] hover:bg-[#3D5A4C] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center transition-colors"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              {isAuditing ? "Auditing Claims..." : "Run Compliance Audit"}
            </button>
            <button
              onClick={handleSubmitForReview}
              className="px-3.5 py-2 bg-white border border-[#E7E2D8] hover:bg-[#FAF8F5] text-[#1F2421] text-xs font-semibold rounded-lg shadow-xs flex items-center transition-colors"
            >
              <Send className="w-3.5 h-3.5 mr-1.5 text-[#A36B73]" />
              Submit to Review Queue
            </button>
          </div>
        )}
      </div>

      {/* Asset Selector Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {assets.map((a) => {
          const isSelected = selectedAsset?.id === a.id;
          return (
            <button
              key={a.id}
              onClick={() => handleSelectAsset(a)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium border shrink-0 transition-all ${
                isSelected
                  ? "bg-[#EBF2EE] text-[#4A6B5B] border-[#4A6B5B] font-semibold"
                  : "bg-white text-[#1F2421] border-[#E7E2D8] hover:bg-[#FAF8F5]"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span>{a.title}</span>
                <span className="text-[10px] text-[#5C6460]">({a.asset_type})</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Two Column Layout: Content Editor on Left, Audit Report on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Content Editor */}
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1F2421]">Marketing Copy Draft</h3>
                <p className="text-xs text-[#5C6460]">
                  Edit text directly to test automated claim extraction and correction.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#FAF8F5] border border-[#E7E2D8] text-[#5C6460] rounded">
                Status: {selectedAsset?.status}
              </span>
            </div>

            <textarea
              rows={12}
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Paste or write marketing copy..."
              className="w-full text-xs font-mono p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4A6B5B] leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-xs text-[#5C6460]">
            <span>{contentText.split(/\s+/).filter(Boolean).length} words</span>
            {statusMessage && <span className="text-[#4A6B5B] font-medium">{statusMessage}</span>}
          </div>
        </div>

        {/* RIGHT COLUMN: Audit Results & Findings */}
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0ECE4]">
              <div>
                <h3 className="text-sm font-bold text-[#1F2421]">Compliance Assessment Findings</h3>
                <p className="text-xs text-[#5C6460]">
                  {auditResult
                    ? `${auditResult.total_findings} findings detected (${auditResult.critical_count} Critical, ${auditResult.high_count} High)`
                    : "No audit executed yet for this revision."}
                </p>
              </div>

              {auditResult && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    auditResult.status === "COMPLIANT"
                      ? "bg-[#EBF2EE] text-[#4A6B5B] border-[#D1E0D7]"
                      : auditResult.status === "NON_COMPLIANT"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {auditResult.status}
                </span>
              )}
            </div>

            {/* Finding Cards List */}
            {auditResult ? (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {auditResult.findings.map((finding) => {
                  const isSupported = finding.category === "SUPPORTED";
                  return (
                    <div
                      key={finding.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                        isSupported
                          ? "bg-[#FAF8F5] border-[#E7E2D8]"
                          : finding.severity === "CRITICAL"
                          ? "bg-red-50/60 border-red-200"
                          : "bg-amber-50/60 border-amber-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SEVERITY_BADGES[finding.severity]}`}>
                          {finding.severity} • {CATEGORY_LABELS[finding.category]}
                        </span>
                        {finding.rule_name && (
                          <span className="text-[10px] font-medium text-[#5C6460]">
                            Rule: {finding.rule_name}
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-[#1F2421] leading-relaxed">
                        {finding.explanation}
                      </p>

                      {/* Evidence Citation */}
                      {finding.exact_citation_text && (
                        <div className="p-2 bg-white rounded border border-[#E7E2D8] text-[11px] flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#4A6B5B] shrink-0" />
                          <span className="text-[#5C6460]">Citation:</span>
                          <span className="font-medium text-[#1F2421] truncate">
                            {finding.exact_citation_text}
                          </span>
                        </div>
                      )}

                      {/* Suggested Correction */}
                      {finding.suggested_correction && (
                        <div className="pt-2 border-t border-[#E7E2D8]/60 text-[11px] text-[#4A6B5B] flex items-start space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span><strong>Recommended Correction:</strong> {finding.suggested_correction}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#5C6460] space-y-2">
                <ShieldCheck className="w-8 h-8 text-[#5C6460] mx-auto opacity-40" />
                <p>Click "Run Compliance Audit" to evaluate this marketing asset against Aurevia's Brand Knowledge Hub.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
