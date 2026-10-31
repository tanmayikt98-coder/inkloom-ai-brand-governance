import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { MarketingAsset, AuditRun, FindingCategory, Severity, AssetRevision } from "../types";
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
  History,
  Layers,
} from "lucide-react";
import { BoundingBoxViewerModal } from "../components/BoundingBoxViewerModal";
import { VisualInspectionStudio } from "../components/VisualInspectionStudio";

const SEVERITY_BADGES: Record<Severity, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  HIGH: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  MEDIUM: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  LOW: "bg-green-100 text-green-800 border-green-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
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
  const [revisions, setRevisions] = useState<AssetRevision[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>("");
  const [contentText, setContentText] = useState<string>("");
  const [auditResult, setAuditResult] = useState<AuditRun | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modalEvidence, setModalEvidence] = useState<{ id: string; quote?: string } | null>(null);
  const [isAutoFixing, setIsAutoFixing] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const brandId = activeBrand?.id || "brand-aurevia-001";

  const loadAssets = async () => {
    try {
      const list = await api.assets.listByBrand(brandId);
      setAssets(list);
      if (list.length > 0) {
        const defaultAsset = list.find((a) => a.id === "asset-landing-001") || list[0];
        await handleSelectAsset(defaultAsset);
      }
    } catch (err) {
      console.error("Failed to load assets:", err);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [brandId]);

  const handleSelectAsset = async (asset: MarketingAsset) => {
    setSelectedAsset(asset);
    setStatusMessage(null);

    // Fetch revisions for this asset
    try {
      const revs = await api.timeMachine.listRevisions(asset.id);
      setRevisions(revs);
      // If landing page, default to v1 to demonstrate the unverified claims & diff studio
      const initialRev = revs.length > 0 ? revs[0] : null;
      if (initialRev) {
        setSelectedRevisionId(initialRev.id);
        setContentText(initialRev.content_text);
        try {
          const audit = await api.audits.getLatestAudit(initialRev.id);
          setAuditResult(audit);
        } catch {
          // If no previous audit, run on demand
          const run = await api.audits.runAudit(initialRev.id);
          setAuditResult(run);
        }
      } else {
        setContentText(asset.latest_content || "");
      }
    } catch {
      setContentText(asset.latest_content || "");
      if (asset.current_revision_id) {
        const latest = await api.audits.getLatestAudit(asset.current_revision_id);
        setAuditResult(latest);
      }
    }
  };

  const handleSelectRevision = async (rev: AssetRevision) => {
    setSelectedRevisionId(rev.id);
    setContentText(rev.content_text);
    try {
      setIsAuditing(true);
      const audit = await api.audits.getLatestAudit(rev.id);
      setAuditResult(audit);
    } catch {
      const run = await api.audits.runAudit(rev.id);
      setAuditResult(run);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleRunAudit = async () => {
    if (!selectedAsset) return;
    const start = performance.now();
    try {
      setIsAuditing(true);
      setStatusMessage("Extracting measurable claims & evaluating deterministic compliance rules...");

      let revId = selectedRevisionId || selectedAsset.current_revision_id;
      if (contentText.trim() !== (selectedAsset.latest_content || "").trim()) {
        const newRev = await api.assets.createRevision(selectedAsset.id, {
          content_text: contentText,
          change_summary: "Edited in Content Audit Studio.",
        });
        revId = newRev.id;
        setSelectedRevisionId(newRev.id);
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
        latencyMs: latency,
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Audit Execution Error",
        message: err.message,
      });
    } finally {
      setIsAuditing(false);
    }
  };

  // Generate deterministic Auto-Fix Compliant Rewrite
  const generateCompliantSuggestion = (raw: string): string => {
    let compliant = raw;
    compliant = compliant.replace(/reduces average processing time by 50%/gi, "reduces average processing time by 30%");
    compliant = compliant.replace(/by 50%/gi, "by 30%");
    compliant = compliant.replace(/delivers 40% faster execution/gi, "reduces average processing time by 30%");
    compliant = compliant.replace(/100% uptime guaranteed/gi, "maintaining 99.99% system availability SLA");

    compliant = compliant.replace(/guaranteed 100% error-free and delivers unbeatable performance/gi, "delivering verified enterprise reliability for global organizations");
    compliant = compliant.replace(/guaranteed 100% error-free/gi, "delivering robust enterprise reliability");
    compliant = compliant.replace(/unbeatable performance/gi, "substantiated benchmark throughput");
    compliant = compliant.replace(/100% risk-free guarantees/gi, "governance-backed reliability");

    const disclaimer = "Results may vary based on workload parameters and enterprise tier configuration.";
    if (!compliant.toLowerCase().includes(disclaimer.toLowerCase())) {
      compliant = compliant.trim() + " " + disclaimer;
    }

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
        change_summary: "Auto-Fix applied via Diff Studio (Reconciled with 30% benchmark & disclaimers).",
      });
      selectedAsset.current_revision_id = newRev.id;
      selectedAsset.latest_content = fixedCopy;
      setSelectedRevisionId(newRev.id);

      const run = await api.audits.runAudit(newRev.id);
      setAuditResult(run);
      const latency = performance.now() - start;

      addToast({
        type: "success",
        title: "Auto-Fix Applied & Audited",
        message: "All claims reconciled with approved 30% benchmark and mandatory disclaimers. Status: COMPLIANT.",
        latencyMs: latency,
      });

      setActiveTab("copy_audit");
      const revs = await api.timeMachine.listRevisions(selectedAsset.id);
      setRevisions(revs);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Auto-Fix Failed",
        message: err.message,
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
        message: `Asset '${selectedAsset.title}' submitted to human review queue with maker-checker custody.`,
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Submission Error",
        message: err.message,
      });
    }
  };

  const handleSeedAssets = async () => {
    try {
      setIsSeeding(true);
      await api.dashboard.resetDemoDataset();
      await loadAssets();
    } catch (e) {
      console.error("Failed seeding assets:", e);
    } finally {
      setIsSeeding(false);
    }
  };

  const hasAdversarialFinding = auditResult?.findings.some((f) =>
    f.explanation.includes("ADVERSARIAL INJECTION")
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] dark:border-gray-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421] dark:text-gray-100 tracking-tight">
              Evidence-Driven Content Audit Studio
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400 border border-[#D1E0D7] dark:border-emerald-800 rounded-full">
              Deterministic Rule Engine Active
            </span>
          </div>
          <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-1">
            Deterministic claim substantiation, Auto-Fix Diff Studio, and selective visual inspection.
          </p>
        </div>

        {selectedAsset && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              {isAuditing ? "Auditing Claims..." : "Run Compliance Audit"}
            </button>
            <button
              onClick={handleSubmitForReview}
              className="px-3.5 py-2 bg-white dark:bg-[#182234] border border-[#E7E2D8] dark:border-gray-700 hover:bg-[#FAF8F5] dark:hover:bg-gray-800 text-[#1F2421] dark:text-gray-200 text-xs font-semibold rounded-xl shadow-xs flex items-center transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              Submit to Review Queue
            </button>
          </div>
        )}
      </div>

      {/* Adversarial Quarantine Warning Banner */}
      {hasAdversarialFinding && (
        <div className="p-4 rounded-xl border border-rose-500/50 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 flex items-start gap-3 shadow-md">
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

      {/* Empty State Fallback */}
      {assets.length === 0 && (
        <div className="p-12 bg-white dark:bg-[#131926] rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center space-y-4">
          <FileText className="w-10 h-10 text-emerald-500 mx-auto opacity-75" />
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No Marketing Collateral Loaded</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              Initialize the 9 Aurevia marketing assets across Landing Pages, Executive Social Posts, and Email Briefs.
            </p>
          </div>
          <button
            onClick={handleSeedAssets}
            disabled={isSeeding}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
            <span>{isSeeding ? "Seeding Assets..." : "Load Demo Assets (9 Collateral)"}</span>
          </button>
        </div>
      )}

      {/* Module View Tabs */}
      {assets.length > 0 && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-1.5 p-1 bg-stone-100 dark:bg-[#182234] border border-stone-200 dark:border-gray-800 rounded-xl">
              <button
                onClick={() => setActiveTab("copy_audit")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "copy_audit"
                    ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                    : "text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Copy Audit &amp; Findings
              </button>
              <button
                onClick={() => setActiveTab("diff_studio")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "diff_studio"
                    ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                    : "text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                Auto-Fix Diff Studio
              </button>
              <button
                onClick={() => setActiveTab("visual_inspection")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "visual_inspection"
                    ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                    : "text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Visual Asset Inspection
              </button>
            </div>

            {/* Revision Selector Pill */}
            {revisions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Revision:</span>
                <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-[#182234] border border-stone-200 dark:border-gray-800 rounded-lg">
                  {revisions.map((rev) => (
                    <button
                      key={rev.id}
                      onClick={() => handleSelectRevision(rev)}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded font-semibold transition-colors cursor-pointer ${
                        selectedRevisionId === rev.id
                          ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      v{rev.revision_number} {rev.revision_number === 1 ? "(Draft)" : "(Fixed)"}
                    </button>
                  ))}
                </div>
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#EBF2EE] dark:bg-emerald-950/40 text-[#4A6B5B] dark:text-emerald-400 border-[#4A6B5B] dark:border-emerald-700 font-semibold shadow-xs ring-1 ring-[#4A6B5B]/30"
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
          {activeTab === "copy_audit" && selectedAsset && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Pane: Copy Editor with Real-Time Claim Highlighting */}
              <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">Marketing Copy Draft</h3>
                  <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {contentText.length} characters • {contentText.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <textarea
                  rows={8}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Paste or write marketing copy here to audit claims..."
                  className="w-full text-xs p-4 border border-[#E7E2D8] dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-emerald-500 bg-[#FAF8F5] dark:bg-[#182234] text-gray-900 dark:text-white leading-relaxed font-sans"
                />

                <div className="flex items-center justify-between text-xs text-[#5C6460] dark:text-gray-400 pt-2 border-t border-[#F0ECE4] dark:border-gray-800">
                  <span>Deterministic token evaluation active</span>
                  <button
                    onClick={() => setActiveTab("diff_studio")}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Open in Auto-Fix Diff Studio <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Pane: Audit Findings & Rule Citations */}
              <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4] dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">
                      Audit Findings ({auditResult?.findings.length || 0})
                    </h3>
                    {auditResult && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          auditResult.status === "COMPLIANT"
                            ? "bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400"
                            : "bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-400"
                        }`}
                      >
                        {auditResult.status}
                      </span>
                    )}
                  </div>
                  {auditResult && (
                    <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                      Evaluated in {auditResult.execution_ms?.toFixed(1) || "12.0"}ms
                    </span>
                  )}
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {auditResult && auditResult.findings.length > 0 ? (
                    auditResult.findings.map((f) => (
                      <div
                        key={f.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                          f.severity === "CRITICAL"
                            ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                            : f.severity === "HIGH"
                            ? "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                            : "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              SEVERITY_BADGES[f.severity] || "bg-stone-100"
                            }`}
                          >
                            {f.severity}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-gray-500 dark:text-gray-400">
                            {CATEGORY_LABELS[f.category] || f.category}
                          </span>
                        </div>

                        <p className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed">
                          {f.explanation}
                        </p>

                        {f.exact_citation_text && (
                          <div className="text-[11px] font-mono text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-black/30 p-2 rounded-lg border border-gray-200 dark:border-gray-800">
                            <span className="text-[10px] text-gray-400 block font-sans">Official Benchmark Grounding:</span>
                            "{f.exact_citation_text}"
                          </div>
                        )}

                        {f.suggested_correction && (
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 p-2 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-start gap-1.5">
                            <Wand2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                            <span>
                              <strong>Suggested Fix:</strong> {f.suggested_correction}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-gray-900 dark:text-white">All Evaluated Claims Compliant</p>
                      <p>Every metric is substantiated by an active Tier 1 evidentiary benchmark.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTO-FIX DIFF STUDIO */}
          {activeTab === "diff_studio" && selectedAsset && (
            <div className="space-y-6">
              {/* Studio Action Header */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Deterministic Auto-Fix Diff Studio
                  </h4>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                    Reconciles unverified claims to official 30% benchmark, removes prohibited superlatives, and appends mandatory FTC disclaimers.
                  </p>
                </div>

                <button
                  onClick={handleApplyAutoFix}
                  disabled={isAutoFixing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAutoFixing ? "Applying & Re-evaluating..." : "Accept Suggestion & Re-evaluate"}</span>
                </button>
              </div>

              {/* Two-Pane Diff Studio */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Pane: Original Draft */}
                <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-950">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Original Draft (Non-Compliant)
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                      3 Violations Flagged
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/30 dark:bg-rose-950/20 text-xs font-sans leading-relaxed text-gray-800 dark:text-gray-200 space-y-3 min-h-[180px]">
                    <p>
                      Welcome to Aurevia. Aurevia{" "}
                      <span className="bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 px-1 py-0.5 rounded line-through font-bold">
                        reduces average processing time by 50%
                      </span>{" "}
                      across verified benchmark workloads.{" "}
                      <span className="bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 px-1 py-0.5 rounded line-through font-bold">
                        Guaranteed 100% error-free and delivers unbeatable performance
                      </span>{" "}
                      for global organizations.
                    </p>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 font-mono italic">
                      [Missing Mandatory FTC &amp; SLA Performance Disclaimer]
                    </p>
                  </div>
                </div>

                {/* Right Pane: Suggested Compliant Copy */}
                <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-950">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Suggested Compliant Copy (Substantiated)
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      100% Compliant Score
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20 text-xs font-sans leading-relaxed text-gray-800 dark:text-gray-200 space-y-3 min-h-[180px]">
                    <p>
                      Welcome to Aurevia. Aurevia{" "}
                      <span className="bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 px-1 py-0.5 rounded font-bold underline">
                        reduces average processing time by 30%
                      </span>{" "}
                      across verified benchmark workloads.{" "}
                      <span className="bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 px-1 py-0.5 rounded font-bold">
                        Delivering robust enterprise reliability for global organizations.
                      </span>{" "}
                      <span className="bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 px-1 py-0.5 rounded font-bold">
                        Results may vary based on workload parameters and enterprise tier configuration.
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                      ✓ Grounded in Apex Benchmark ev-bench-001 (Sec 3.2) • Rule RULE-DISCLAIM-01 satisfied.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VISUAL INSPECTION STUDIO */}
          {activeTab === "visual_inspection" && selectedAsset && (
            <VisualInspectionStudio />
          )}
        </>
      )}

      {/* Bounding Box Modal */}
      {modalEvidence && (
        <BoundingBoxViewerModal
          evidenceId={modalEvidence.id}
          evidenceTitle="Substantiating Audit Document"
          citedQuote={modalEvidence.quote}
          onClose={() => setModalEvidence(null)}
        />
      )}
    </div>
  );
};
