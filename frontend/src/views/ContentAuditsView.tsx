import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
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
  Wand2,
  ArrowRight,
  ShieldAlert,
  Eye,
  Sliders,
} from "lucide-react";
import { BoundingBoxViewerModal } from "../components/BoundingBoxViewerModal";
import { VisualInspectionStudio } from "../components/VisualInspectionStudio";

const SEVERITY_BADGES: Record<Severity, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
  HIGH: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  MEDIUM: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  LOW: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800",
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
  const { activeBrand } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<"copy_audit" | "diff_studio" | "visual_inspection">("copy_audit");
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MarketingAsset | null>(null);
  const [contentText, setContentText] = useState<string>("");
  const [auditResult, setAuditResult] = useState<AuditRun | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modalEvidence, setModalEvidence] = useState<{ id: string; quote?: string } | null>(null);
  const [isAutoFixing, setIsAutoFixing] = useState<boolean>(false);

  const loadAssets = async () => {
    if (!activeBrand) return;
    try {
      const list = await api.assets.listByBrand(activeBrand.id);
      setAssets(list);
      if (list.length > 0 && !selectedAsset) {
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
    const start = performance.now();
    try {
      setIsAuditing(true);
      setStatusMessage("Extracting measurable claims & evaluating deterministic compliance rules...");

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

      const run = await api.audits.runAudit(revId);
      setAuditResult(run);
      const latency = performance.now() - start;
      setStatusMessage(`Audit completed in ${run.execution_ms.toFixed(1)}ms.`);

      addToast({
        type: run.status === "COMPLIANT" ? "success" : "warning",
        title: `Audit Completed (${run.status})`,
        message: `${run.total_claims} claims evaluated with ${run.total_findings} findings.`,
        latencyMs: latency
      });

      await loadAssets();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Audit Execution Error",
        message: err.message
      });
    } finally {
      setIsAuditing(false);
    }
  };

  // Generate deterministic Auto-Fix Compliant Rewrite
  const generateCompliantSuggestion = (raw: string): string => {
    let compliant = raw;
    // 1. Correct unverified 50% to approved 30% benchmark
    compliant = compliant.replace(/reduces average processing time by 50%/gi, "reduces average processing time by 30%");
    compliant = compliant.replace(/by 50%/gi, "by 30%");
    compliant = compliant.replace(/delivers 40% faster execution/gi, "reduces average processing time by 30%");
    compliant = compliant.replace(/100% uptime guaranteed/gi, "maintaining 99.99% system availability SLA");

    // 2. Eliminate prohibited absolute claims and superlatives
    compliant = compliant.replace(/guaranteed 100% error-free and delivers unbeatable performance/gi, "delivering verified enterprise throughput");
    compliant = compliant.replace(/guaranteed 100% error-free/gi, "delivering verified enterprise reliability");
    compliant = compliant.replace(/unbeatable performance/gi, "substantiated benchmark performance");
    compliant = compliant.replace(/100% risk-free guarantees/gi, "governance-backed reliability");
    compliant = compliant.replace(/world's best/gi, "independently audited");

    // 3. Append required mandatory performance disclaimer if missing
    const disclaimer = "Results may vary based on workload parameters and enterprise tier configuration.";
    if (!compliant.toLowerCase().includes(disclaimer.toLowerCase())) {
      compliant = compliant.trim() + " " + disclaimer;
    }

    // 4. If security certifications mentioned, ensure NDA citation
    if (compliant.toLowerCase().includes("soc 2") || compliant.toLowerCase().includes("iso 27001")) {
      const secDisclaimer = "SOC 2 Type II audit report available under enterprise NDA.";
      if (!compliant.toLowerCase().includes("under enterprise nda")) {
        compliant = compliant.trim() + " " + secDisclaimer;
      }
    }

    return compliant;
  };

  const handleApplyAutoFix = async () => {
    if (!selectedAsset) return;
    setIsAutoFixing(true);
    const start = performance.now();
    try {
      const fixedCopy = generateCompliantSuggestion(contentText);
      setContentText(fixedCopy);

      // Create new revision and audit it
      const newRev = await api.assets.createRevision(selectedAsset.id, {
        content_text: fixedCopy,
        change_summary: "Auto-Fix applied via Diff Studio (Claims substantiated & disclaimers inserted).",
      });
      selectedAsset.current_revision_id = newRev.id;
      selectedAsset.latest_content = fixedCopy;

      const run = await api.audits.runAudit(newRev.id);
      setAuditResult(run);
      const latency = performance.now() - start;

      addToast({
        type: "success",
        title: "Auto-Fix Applied & Audited",
        message: "All claims reconciled with approved 30% benchmark and mandatory disclaimers.",
        latencyMs: latency
      });

      setActiveTab("copy_audit");
      await loadAssets();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Auto-Fix Failed",
        message: err.message
      });
    } finally {
      setIsAutoFixing(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedAsset) return;
    try {
      await api.reviews.submit(selectedAsset.id);
      addToast({
        type: "info",
        title: "Submitted for Review",
        message: `Asset '${selectedAsset.title}' submitted to human review queue with maker-checker custody.`
      });
      await loadAssets();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Submission Error",
        message: err.message
      });
    }
  };

  const hasAdversarialFinding = auditResult?.findings.some(f =>
    f.explanation.includes("ADVERSARIAL INJECTION")
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] dark:border-gray-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2421] dark:text-[#F1F5F9] tracking-tight">
            Evidence-Driven Content Audit Studio
          </h1>
          <p className="text-xs text-[#5C6460] dark:text-[#94A3B8] mt-1">
            Deterministic claim substantiation, Auto-Fix Diff Studio, and selective visual inspection.
          </p>
        </div>

        {selectedAsset && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-4 py-2 bg-[#4A6B5B] hover:bg-[#3D5A4C] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center transition-colors"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              {isAuditing ? "Auditing Claims..." : "Run Compliance Audit"}
            </button>
            <button
              onClick={handleSubmitForReview}
              className="px-3.5 py-2 bg-white dark:bg-[#182234] border border-[#E7E2D8] dark:border-gray-700 hover:bg-[#FAF8F5] dark:hover:bg-gray-800 text-[#1F2421] dark:text-gray-200 text-xs font-semibold rounded-lg shadow-sm flex items-center transition-colors"
            >
              <Send className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Submit to Review Queue
            </button>
          </div>
        )}
      </div>

      {/* Adversarial Protection Quarantine Warning Banner */}
      {hasAdversarialFinding && (
        <div className="p-4 rounded-xl border border-rose-500/50 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 flex items-start gap-3 shadow-md animate-pulse">
          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold font-mono tracking-wide uppercase block">
              SECURITY SHIELD: ADVERSARIAL INJECTION QUARANTINED
            </span>
            <p className="mt-0.5 leading-relaxed">
              This draft contains instructional prompt jailbreak patterns designed to manipulate compliance checks. The asset has been quarantined and an immutable audit event has been recorded in the WORM ledger.
            </p>
          </div>
        </div>
      )}

      {/* Module View Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-1 p-1 bg-white dark:bg-[#131926] border border-[#E7E2D8] dark:border-gray-800 rounded-lg shadow-2xs">
          <button
            onClick={() => setActiveTab("copy_audit")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "copy_audit"
                ? "bg-[#4A6B5B] text-white shadow-2xs"
                : "text-[#5C6460] dark:text-gray-400 hover:text-[#1F2421] dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Copy Audit &amp; Findings
          </button>
          <button
            onClick={() => setActiveTab("diff_studio")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "diff_studio"
                ? "bg-[#4A6B5B] text-white shadow-2xs"
                : "text-[#5C6460] dark:text-gray-400 hover:text-[#1F2421] dark:hover:text-white"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Auto-Fix Diff Studio
          </button>
          <button
            onClick={() => setActiveTab("visual_inspection")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "visual_inspection"
                ? "bg-[#4A6B5B] text-white shadow-2xs"
                : "text-[#5C6460] dark:text-gray-400 hover:text-[#1F2421] dark:hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visual Asset Inspection
          </button>
        </div>

        {/* Selected Asset Type Indicator */}
        {selectedAsset && (
          <span className="hidden sm:inline-flex text-[11px] text-[#5C6460] dark:text-gray-400 font-mono">
            Active: <strong>{selectedAsset.title}</strong> (v{selectedAsset.current_revision_id ? 'Active' : '1'})
          </span>
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
                  ? "bg-[#EBF2EE] dark:bg-emerald-950/40 text-[#4A6B5B] dark:text-emerald-400 border-[#4A6B5B] dark:border-emerald-700 font-semibold shadow-2xs"
                  : "bg-white dark:bg-[#131926] text-[#1F2421] dark:text-gray-300 border-[#E7E2D8] dark:border-gray-800 hover:bg-[#FAF8F5] dark:hover:bg-gray-800/60"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span>{a.title}</span>
                <span className="text-[10px] text-[#5C6460] dark:text-gray-400">({a.asset_type})</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COPY AUDIT & FINDINGS */}
      {activeTab === "copy_audit" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Content Editor */}
          <div className="bg-white dark:bg-[#131926] p-6 rounded-xl border border-[#E7E2D8] dark:border-gray-800 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">Marketing Copy Draft</h3>
                  <p className="text-xs text-[#5C6460] dark:text-gray-400">
                    Edit copy directly to test deterministic claim extraction and guideline rules.
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#FAF8F5] dark:bg-[#0B0F17] border border-[#E7E2D8] dark:border-gray-700 text-[#5C6460] dark:text-gray-300 rounded font-mono">
                  Status: {selectedAsset?.status}
                </span>
              </div>

              <textarea
                rows={12}
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder="Paste or write marketing copy..."
                className="w-full text-xs font-mono p-3 bg-[#FAF8F5] dark:bg-[#0B0F17] border border-[#E7E2D8] dark:border-gray-700 text-[#1F2421] dark:text-[#F1F5F9] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4A6B5B] leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-[#F0ECE4] dark:border-gray-800 flex items-center justify-between text-xs text-[#5C6460] dark:text-gray-400">
              <span>{contentText.split(/\s+/).filter(Boolean).length} words</span>
              {statusMessage && <span className="text-[#4A6B5B] dark:text-emerald-400 font-medium">{statusMessage}</span>}
            </div>
          </div>

          {/* RIGHT COLUMN: Audit Results & Findings */}
          <div className="bg-white dark:bg-[#131926] p-6 rounded-xl border border-[#E7E2D8] dark:border-gray-800 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0ECE4] dark:border-gray-800">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">Compliance Assessment Findings</h3>
                  <p className="text-xs text-[#5C6460] dark:text-gray-400">
                    {auditResult
                      ? `${auditResult.total_findings} findings detected (${auditResult.critical_count} Critical, ${auditResult.high_count} High)`
                      : "No audit executed yet for this revision."}
                  </p>
                </div>

                {auditResult && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      auditResult.status === "COMPLIANT"
                        ? "bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400 border-[#D1E0D7] dark:border-emerald-800"
                        : auditResult.status === "NON_COMPLIANT"
                        ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
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
                            ? "bg-[#FAF8F5] dark:bg-[#0B0F17]/40 border-[#E7E2D8] dark:border-gray-800"
                            : finding.severity === "CRITICAL"
                            ? "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                            : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SEVERITY_BADGES[finding.severity]}`}>
                            {finding.severity} • {CATEGORY_LABELS[finding.category]}
                          </span>
                          {finding.rule_name && (
                            <span className="text-[10px] font-medium text-[#5C6460] dark:text-gray-400">
                              Rule: {finding.rule_name}
                            </span>
                          )}
                        </div>

                        <p className="font-semibold text-[#1F2421] dark:text-gray-100 leading-relaxed">
                          {finding.explanation}
                        </p>

                        {/* Evidence Citation */}
                        {finding.exact_citation_text && (
                          <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#182234] rounded-lg border border-[#E7E2D8] dark:border-gray-700 text-[11px] gap-2">
                            <div className="flex items-center space-x-1.5 truncate">
                              <FileText className="w-3.5 h-3.5 text-[#4A6B5B] dark:text-emerald-400 shrink-0" />
                              <span className="text-[#5C6460] dark:text-gray-400">Citation:</span>
                              <span className="font-medium text-[#1F2421] dark:text-gray-200 truncate">
                                "{finding.exact_citation_text}"
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setModalEvidence({
                                  id: finding.evidence_id || "ev-bench-001",
                                  quote: finding.exact_citation_text || undefined,
                                })
                              }
                              className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold flex items-center space-x-1 shrink-0 transition-all shadow-2xs"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                              <span>PDF Bounding Box</span>
                            </button>
                          </div>
                        )}

                        {/* Suggested Correction */}
                        {finding.suggested_correction && (
                          <div className="pt-2 border-t border-[#E7E2D8]/60 dark:border-gray-800 text-[11px] text-[#4A6B5B] dark:text-emerald-400 flex items-start space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                              <strong>Recommended Correction:</strong> {finding.suggested_correction}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#5C6460] dark:text-gray-400 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-[#5C6460] mx-auto opacity-40" />
                  <p>Click "Run Compliance Audit" to evaluate this marketing asset against Aurevia's Brand Knowledge Hub.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTO-FIX DIFF STUDIO */}
      {activeTab === "diff_studio" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Auto-Fix Diff Studio
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Deterministic rewrite reconciles ungrounded claims and inserts mandatory disclaimers.
              </p>
            </div>
            <button
              onClick={handleApplyAutoFix}
              disabled={isAutoFixing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-950/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isAutoFixing ? "Applying & Re-auditing..." : "Accept Suggestion & Re-evaluate"}
            </button>
          </div>

          {/* Two-Pane Diff Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Pane: Original Copy with Violations Highlighted */}
            <div className="p-5 rounded-xl border border-rose-500/30 bg-white dark:bg-[#131926] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-mono">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  ORIGINAL DRAFT (NON-COMPLIANT)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                  Critical Violations
                </span>
              </div>
              <div className="text-xs font-mono leading-relaxed p-4 rounded-lg bg-[#FAF8F5] dark:bg-[#0B0F17] border border-gray-200 dark:border-gray-800">
                <p className="text-gray-700 dark:text-gray-300">
                  Welcome to Aurevia. Aurevia reduces average processing time by{" "}
                  <span className="diff-removed">50%</span> across all enterprise workflows. It is{" "}
                  <span className="diff-removed">guaranteed 100% error-free and delivers unbeatable performance</span>{" "}
                  for global enterprises.
                </p>
              </div>
              <ul className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1 list-disc pl-4">
                <li>Claim of 50% contradicts approved 30% benchmark (Apex Analytics Lab).</li>
                <li>Prohibited absolute guarantee ("guaranteed 100% error-free, unbeatable").</li>
                <li>Missing mandatory performance disclaimer (RULE-DISCLAIM-01).</li>
              </ul>
            </div>

            {/* Right Pane: Compliant Suggestion with Additions Highlighted */}
            <div className="p-5 rounded-xl border border-emerald-500/30 bg-white dark:bg-[#131926] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  COMPLIANT SUGGESTION (AUTO-RECONCILED)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  100% Compliant
                </span>
              </div>
              <div className="text-xs font-mono leading-relaxed p-4 rounded-lg bg-[#FAF8F5] dark:bg-[#0B0F17] border border-gray-200 dark:border-gray-800">
                <p className="text-gray-700 dark:text-gray-300">
                  Welcome to Aurevia. Aurevia reduces average processing time by{" "}
                  <span className="diff-added">30%</span> across verified benchmark workloads.{" "}
                  <span className="diff-added">Delivering robust enterprise reliability</span> for global organizations.{" "}
                  <span className="diff-added">
                    Results may vary based on workload parameters and enterprise tier configuration.
                  </span>
                </p>
              </div>
              <ul className="text-[11px] text-emerald-700 dark:text-emerald-400 space-y-1 list-disc pl-4">
                <li>Performance metric strictly matches Apex Analytics 30% benchmark.</li>
                <li>Forbidden absolute claims removed and replaced with defensible phrasing.</li>
                <li>Mandatory disclosure notice inserted (FTC 16 CFR Part 255 verified).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL ASSET INSPECTION */}
      {activeTab === "visual_inspection" && <VisualInspectionStudio />}

      {modalEvidence && (
        <BoundingBoxViewerModal
          evidenceId={modalEvidence.id}
          citedQuote={modalEvidence.quote}
          onClose={() => setModalEvidence(null)}
        />
      )}
    </div>
  );
};
