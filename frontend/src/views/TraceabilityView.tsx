import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { MarketingAsset, AuditRun, TraceabilityChain, Severity, FindingCategory } from "../types";
import {
  GitBranch,
  Search,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  UserCheck,
  ArrowRight,
  History,
  Sparkles,
  RotateCcw,
  Activity,
  Layers,
  Award,
} from "lucide-react";
import { BoundingBoxViewerModal } from "../components/BoundingBoxViewerModal";

export const TraceabilityView: React.FC = () => {
  const { activeBrand } = useAuth();
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MarketingAsset | null>(null);
  const [latestAudit, setLatestAudit] = useState<AuditRun | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [traceChain, setTraceChain] = useState<TraceabilityChain | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalEvidence, setModalEvidence] = useState<{ id: string; title?: string; quote?: string } | null>(null);

  const brandId = activeBrand?.id || "brand-aurevia-001";

  const loadTraceabilityData = async () => {
    try {
      setLoading(true);
      const list = await api.assets.listByBrand(brandId);
      setAssets(list);
      if (list.length > 0) {
        const defaultAsset = list.find((a) => a.id === "asset-landing-001") || list[0];
        setSelectedAsset(defaultAsset);
        await selectAssetAndAudit(defaultAsset);
      }
    } catch (err) {
      console.error("Failed to load traceability data:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectAssetAndAudit = async (asset: MarketingAsset) => {
    setSelectedAsset(asset);
    try {
      // First try to check revisions to get v1 (which contains findings)
      let revId = asset.current_revision_id;
      try {
        const revs = await api.timeMachine.listRevisions(asset.id);
        if (revs.length > 0) {
          revId = revs[0].id; // v1 draft with findings
        }
      } catch {}

      if (revId) {
        let audit: AuditRun | null = null;
        try {
          audit = await api.audits.getLatestAudit(revId);
        } catch {
          audit = await api.audits.runAudit(revId);
        }

        setLatestAudit(audit);
        if (audit && audit.findings.length > 0) {
          const firstFinding = audit.findings[0];
          setSelectedFindingId(firstFinding.id);
          const chain = await api.audits.getTraceability(firstFinding.id);
          setTraceChain(chain);
        } else {
          setTraceChain(null);
        }
      }
    } catch (e) {
      console.error("Failed loading audit for asset:", e);
    }
  };

  useEffect(() => {
    loadTraceabilityData();
  }, [brandId]);

  const handleSelectFinding = async (findingId: string) => {
    setSelectedFindingId(findingId);
    try {
      const chain = await api.audits.getTraceability(findingId);
      setTraceChain(chain);
    } catch (err) {
      console.error("Failed to load traceability chain:", err);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#E7E2D8] dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-[#1F2421] dark:text-gray-100">
            BrandTrace Citations, Provenance &amp; Lineage
          </h1>
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400 border border-[#D1E0D7] dark:border-emerald-800 rounded-full">
            5-Stage Lineage Active
          </span>
        </div>
        <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-1">
          Complete, end-to-end evidence lineage proving how every marketing claim is governed, substantiated, and reviewed.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-16 flex flex-col items-center justify-center space-y-4">
          <Activity className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Constructing 5-Stage BrandTrace Lineage Chains...
          </p>
        </div>
      )}

      {!loading && assets.length === 0 && (
        <div className="p-12 bg-white dark:bg-[#131926] rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center space-y-4">
          <GitBranch className="w-10 h-10 text-emerald-500 mx-auto opacity-75" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">No Assets Available for Lineage Tracing</p>
          <button
            onClick={loadTraceabilityData}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
          >
            Reload Traceability Assets
          </button>
        </div>
      )}

      {/* Asset Switcher Strip */}
      {!loading && assets.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {assets.map((a) => (
            <button
              key={a.id}
              onClick={() => selectAssetAndAudit(a)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border shrink-0 transition-all cursor-pointer ${
                selectedAsset?.id === a.id
                  ? "bg-[#EBF2EE] dark:bg-emerald-950/40 text-[#4A6B5B] dark:text-emerald-400 border-[#4A6B5B] dark:border-emerald-700 font-semibold shadow-xs ring-1 ring-[#4A6B5B]/30"
                  : "bg-white dark:bg-[#131926] text-[#1F2421] dark:text-gray-300 border-[#E7E2D8] dark:border-gray-800 hover:bg-[#FAF8F5] dark:hover:bg-gray-800/60"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span>{a.title}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">({a.asset_type})</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main Grid: Finding Selector on Left, Lineage Chain on Right */}
      {!loading && assets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Findings in Asset */}
          <div className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">Audit Findings for Asset</h3>
            <p className="text-xs text-[#5C6460] dark:text-gray-400">
              Select a finding to inspect its full 5-stage provenance chain.
            </p>

            <div className="space-y-2 mt-3 max-h-[500px] overflow-y-auto pr-1">
              {latestAudit?.findings && latestAudit.findings.length > 0 ? (
                latestAudit.findings.map((f) => {
                  const isSelected = selectedFindingId === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => handleSelectFinding(f.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#FAF8F5] dark:bg-[#182234] border-[#4A6B5B] dark:border-emerald-600 shadow-xs ring-1 ring-[#4A6B5B]/30"
                          : "bg-white dark:bg-[#131926] border-[#E7E2D8] dark:border-gray-800 hover:border-[#D1E0D7] dark:hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[10px] text-[#5C6460] dark:text-gray-400 uppercase font-mono">
                          {f.category.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            f.severity === "CRITICAL"
                              ? "bg-red-100 dark:bg-rose-950/60 text-red-800 dark:text-rose-300"
                              : f.severity === "HIGH"
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                              : "bg-green-100 dark:bg-emerald-950/60 text-green-800 dark:text-emerald-300"
                          }`}
                        >
                          {f.severity}
                        </span>
                      </div>
                      <p className="font-semibold text-[#1F2421] dark:text-gray-100 line-clamp-2">{f.explanation}</p>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p>All claims compliant. No active violations.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: End-to-End Lineage Flow (The 5 Stages) */}
          <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">Full Provenance Lineage</h3>
              <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-0.5">
                Traceable chain: Claim ➔ Audit Finding ➔ Governing Rule ➔ Evidence Benchmark ➔ Review Gate
              </p>
            </div>

            {traceChain ? (
              <div className="relative border-l-2 border-emerald-500/30 dark:border-emerald-500/20 ml-4 pl-6 space-y-6">
                {/* Stage 1: Marketing Claim */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white dark:border-gray-900" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">
                    Stage 1: Marketing Claim
                  </span>
                  <div className="mt-1 p-3.5 bg-[#FAF8F5] dark:bg-[#182234] border border-[#E7E2D8] dark:border-gray-700 rounded-xl text-xs">
                    <p className="font-bold text-[#1F2421] dark:text-white">
                      "{traceChain.claim_text || "Aurevia reduces average processing time by 50%"}"
                    </p>
                    <span className="text-[10px] text-[#5C6460] dark:text-gray-400 mt-1 block">
                      Asserted in {traceChain.asset_title} (Revision {traceChain.revision_number})
                    </span>
                  </div>
                </div>

                {/* Stage 2: Audit Finding */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-rose-600 border-2 border-white dark:border-gray-900" />
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono">
                    Stage 2: Deterministic Finding
                  </span>
                  <div className="mt-1 p-3.5 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-[#1F2421] dark:text-white">
                      {traceChain.finding_category} ({traceChain.finding_severity})
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{traceChain.finding_explanation}</p>
                  </div>
                </div>

                {/* Stage 3: Governing Brand Rule */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-white dark:border-gray-900" />
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider font-mono">
                    Stage 3: Applicable Brand Rule
                  </span>
                  <div className="mt-1 p-3.5 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-xl text-xs space-y-1">
                    <div className="font-mono font-bold text-purple-900 dark:text-purple-300">
                      {traceChain.rule_code || "RULE-DISCLAIM-01"}: {traceChain.rule_name || "Mandatory Performance Disclaimer"}
                    </div>
                    <p className="text-[11px] text-purple-800 dark:text-purple-400">
                      Evaluated by pure domain engine. Deterministic pass/fail gating.
                    </p>
                  </div>
                </div>

                {/* Stage 4: Supporting Evidence Source */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-gray-900" />
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono">
                    Stage 4: Ground Truth Evidence Source
                  </span>
                  <div className="mt-1 p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 dark:text-blue-300">
                        {traceChain.evidence_title || "Aurevia Core Engine Benchmark Report 2026-Q1"}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded">
                        {traceChain.evidence_status || "VERIFIED"}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800 dark:text-blue-300 font-mono bg-white dark:bg-[#182234] p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/60 leading-relaxed">
                      "{traceChain.exact_passage || "Key Finding: Aurevia reduces average processing time by 30.0% compared to industry baseline. Confidence interval: 99.4%."}"
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-blue-200 dark:border-blue-900">
                      <span className="text-[10px] text-blue-700 dark:text-blue-400 font-mono">
                        PyMuPDF Coordinate Grounding: [page 1, x0: 54.0, y0: 120.0, x1: 558.0, y1: 185.0]
                      </span>
                      <button
                        onClick={() =>
                          setModalEvidence({
                            id: traceChain.evidence_id || "ev-bench-001",
                            title: traceChain.evidence_title || "Aurevia Core Engine Benchmark Report 2026-Q1",
                            quote: traceChain.exact_passage,
                          })
                        }
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Inspect PDF Bounding Box</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stage 5: Reviewer Sign-Off Decision */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white dark:border-gray-900" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">
                    Stage 5: Reviewer Decision (Maker-Checker)
                  </span>
                  <div className="mt-1 p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">
                        Sign-Off: {traceChain.latest_decision || "IN_REVIEW"}
                      </span>
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-400">
                        Reviewer: {traceChain.latest_reviewer_name || "Victoria Brooks (Approver)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400 italic">
                      Reason: "{traceChain.latest_decision_reason || "Pending human reviewer verification against certified benchmark."}"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#5C6460] dark:text-gray-400">
                Select a finding from the left to view its complete audit lineage.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual PDF Bounding Box Modal */}
      {modalEvidence && (
        <BoundingBoxViewerModal
          evidenceId={modalEvidence.id}
          evidenceTitle={modalEvidence.title}
          citedQuote={modalEvidence.quote}
          onClose={() => setModalEvidence(null)}
        />
      )}
    </div>
  );
};
