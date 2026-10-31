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

  useEffect(() => {
    const load = async () => {
      if (!activeBrand) return;
      try {
        setLoading(true);
        const list = await api.assets.listByBrand(activeBrand.id);
        setAssets(list);
        if (list.length > 0) {
          const defaultAsset = list.find((a) => a.title.toLowerCase().includes("landing")) || list[0];
          setSelectedAsset(defaultAsset);
          if (defaultAsset.current_revision_id) {
            const audit = await api.audits.getLatestAudit(defaultAsset.current_revision_id);
            setLatestAudit(audit);
            if (audit && audit.findings.length > 0) {
              const firstFinding = audit.findings[0];
              setSelectedFindingId(firstFinding.id);
              const chain = await api.audits.getTraceability(firstFinding.id);
              setTraceChain(chain);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load traceability data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeBrand]);

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
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#E7E2D8]">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-[#1F2421]">Citations, Traceability & Lineage</h1>
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EBF2EE] text-[#4A6B5B] border border-[#D1E0D7] rounded">
            Module 3 Active
          </span>
        </div>
        <p className="text-xs text-[#5C6460] mt-1">
          Complete, end-to-end evidence lineage proving how every marketing claim is governed, substantiated, and reviewed.
        </p>
      </div>

      {/* Asset Switcher */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {assets.map((a) => (
          <button
            key={a.id}
            onClick={async () => {
              setSelectedAsset(a);
              if (a.current_revision_id) {
                const audit = await api.audits.getLatestAudit(a.current_revision_id);
                setLatestAudit(audit);
                if (audit && audit.findings.length > 0) {
                  handleSelectFinding(audit.findings[0].id);
                } else {
                  setTraceChain(null);
                }
              }
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium border shrink-0 transition-all ${
              selectedAsset?.id === a.id
                ? "bg-[#EBF2EE] text-[#4A6B5B] border-[#4A6B5B] font-semibold"
                : "bg-white text-[#1F2421] border-[#E7E2D8] hover:bg-[#FAF8F5]"
            }`}
          >
            {a.title}
          </button>
        ))}
      </div>

      {/* Main Grid: Finding Selector on Left, Lineage Chain on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Findings in Asset */}
        <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-[#1F2421]">Audit Findings for Asset</h3>
          <p className="text-xs text-[#5C6460]">Select a finding to inspect its full provenance chain.</p>

          <div className="space-y-2 mt-3">
            {latestAudit?.findings && latestAudit.findings.length > 0 ? (
              latestAudit.findings.map((f) => {
                const isSelected = selectedFindingId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => handleSelectFinding(f.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#FAF8F5] border-[#4A6B5B] shadow-xs"
                        : "bg-white border-[#E7E2D8] hover:border-[#D1E0D7]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[10px] text-[#5C6460] uppercase">
                        {f.category.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          f.severity === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : f.severity === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="font-semibold text-[#1F2421] line-clamp-2">{f.explanation}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#5C6460] italic">No audit findings recorded for this asset.</p>
            )}
          </div>
        </div>

        {/* Right: End-to-End Lineage Flow (The 6 Stages) */}
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#1F2421]">Full Provenance Chain</h3>
            <p className="text-xs text-[#5C6460]">
              Traceable flow: Marketing Claim → Audit Finding → Brand Rule → Evidence Source → Reviewer Decision → Revision
            </p>
          </div>

          {traceChain ? (
            <div className="relative border-l-2 border-[#D1E0D7] ml-4 pl-6 space-y-6">
              {/* Stage 1: Marketing Claim */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#4A6B5B] border-2 border-white" />
                <span className="text-[10px] font-bold text-[#4A6B5B] uppercase tracking-wider">
                  Stage 1: Marketing Claim
                </span>
                <div className="mt-1 p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg text-xs">
                  <p className="font-bold text-[#1F2421]">
                    "{traceChain.claim_text || "General collateral assertion"}"
                  </p>
                  <span className="text-[10px] text-[#5C6460] mt-1 block">
                    Asserted in {traceChain.asset_title} (Revision {traceChain.revision_number})
                  </span>
                </div>
              </div>

              {/* Stage 2: Audit Finding */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#A36B73] border-2 border-white" />
                <span className="text-[10px] font-bold text-[#A36B73] uppercase tracking-wider">
                  Stage 2: Deterministic Finding
                </span>
                <div className="mt-1 p-3 bg-[#FDF2F4] border border-[#F3D2D7] rounded-lg text-xs space-y-1">
                  <div className="font-bold text-[#1F2421]">{traceChain.finding_category} ({traceChain.finding_severity})</div>
                  <p className="text-[#5C6460]">{traceChain.finding_explanation}</p>
                </div>
              </div>

              {/* Stage 3: Governing Brand Rule */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-white" />
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                  Stage 3: Applicable Brand Rule
                </span>
                <div className="mt-1 p-3 bg-purple-50/60 border border-purple-200 rounded-lg text-xs space-y-1">
                  <div className="font-mono font-bold text-purple-900">
                    {traceChain.rule_code || "RULE-GOVERNANCE-DEFAULT"}: {traceChain.rule_name || "General Brand Consistency"}
                  </div>
                  <p className="text-[11px] text-purple-800">
                    Evaluated by pure domain engine. Deterministic pass/fail gating.
                  </p>
                </div>
              </div>

              {/* Stage 4: Supporting Evidence Source */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white" />
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Stage 4: Ground Truth Evidence Source
                </span>
                <div className="mt-1 p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">{traceChain.evidence_title || "Verified Technical Benchmark"}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {traceChain.evidence_status || "VERIFIED"}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800 font-mono bg-white p-2 rounded border border-blue-100">
                    "{traceChain.exact_passage || "Documented technical specification on record."}"
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-blue-200">
                    <span className="text-[10px] text-blue-700 font-mono">
                      PyMuPDF Coordinate Grounding: [x0, y0, x1, y1]
                    </span>
                    <button
                      onClick={() =>
                        setModalEvidence({
                          id: traceChain.evidence_id || "ev-bench-001",
                          title: traceChain.evidence_title,
                          quote: traceChain.exact_passage,
                        })
                      }
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Inspect PDF Bounding Box</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stage 5: Reviewer Sign-Off Decision */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Stage 5: Reviewer Decision (Maker-Checker)
                </span>
                <div className="mt-1 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">
                      Sign-Off: {traceChain.latest_decision || "PENDING_REVIEW"}
                    </span>
                    <span className="text-[10px] text-emerald-800">
                      Reviewer: {traceChain.latest_reviewer_name || "Assigned Approver"}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 italic">
                    Reason: "{traceChain.latest_decision_reason || "Awaiting human review queue sign-off."}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#5C6460]">
              Select a finding from the left to view its complete audit lineage.
            </div>
          )}
        </div>
      </div>

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
