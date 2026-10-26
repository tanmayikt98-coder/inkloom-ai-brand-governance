import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { MarketingAsset, AssetRevision, TimeMachineComparison } from "../types";
import {
  History,
  GitCompare,
  RotateCcw,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";

export const TimeMachineView: React.FC = () => {
  const { activeBrand, canCreateContent } = useAuth();
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MarketingAsset | null>(null);
  const [revisions, setRevisions] = useState<AssetRevision[]>([]);
  const [baseRevId, setBaseRevId] = useState<string>("");
  const [targetRevId, setTargetRevId] = useState<string>("");
  const [comparison, setComparison] = useState<TimeMachineComparison | null>(null);
  const [diffMode, setDiffMode] = useState<"inline" | "sideBySide">("inline");
  const [loading, setLoading] = useState<boolean>(true);

  const loadAssetData = async () => {
    if (!activeBrand) return;
    try {
      setLoading(true);
      const list = await api.assets.listByBrand(activeBrand.id);
      setAssets(list);
      if (list.length > 0) {
        const defaultAsset = list.find((a) => a.title.toLowerCase().includes("landing")) || list[0];
        setSelectedAsset(defaultAsset);
        await loadRevisions(defaultAsset.id);
      }
    } catch (err) {
      console.error("Failed loading assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRevisions = async (assetId: string) => {
    try {
      const revs = await api.timeMachine.listRevisions(assetId);
      setRevisions(revs);
      if (revs.length >= 2) {
        setBaseRevId(revs[0].id);
        setTargetRevId(revs[revs.length - 1].id);
        const comp = await api.timeMachine.compare(revs[0].id, revs[revs.length - 1].id);
        setComparison(comp);
      } else if (revs.length === 1) {
        setBaseRevId(revs[0].id);
        setTargetRevId(revs[0].id);
        const comp = await api.timeMachine.compare(revs[0].id, revs[0].id);
        setComparison(comp);
      }
    } catch (err) {
      console.error("Failed loading revisions:", err);
    }
  };

  useEffect(() => {
    loadAssetData();
  }, [activeBrand]);

  const handleRunComparison = async () => {
    if (!baseRevId || !targetRevId) return;
    try {
      const comp = await api.timeMachine.compare(baseRevId, targetRevId);
      setComparison(comp);
    } catch (err: any) {
      alert("Comparison failed: " + err.message);
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!selectedAsset) return;
    if (!confirm("Restore this revision? This will safely create a NEW revision from its content without deleting history.")) {
      return;
    }
    try {
      await api.timeMachine.restore(selectedAsset.id, revId);
      alert("Revision restored as a new version! Intervening history preserved.");
      await loadRevisions(selectedAsset.id);
    } catch (err: any) {
      alert("Restore failed: " + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421]">Brand Time Machine</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FAF8F5] border border-[#E7E2D8] text-[#5C6460] rounded">
              Version History & Evolution
            </span>
          </div>
          <p className="text-xs text-[#5C6460] mt-1">
            Compare content revisions, trace resolved violations, evaluate claim changes, and execute non-destructive rollbacks.
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center space-x-2 bg-white border border-[#E7E2D8] p-1 rounded-lg text-xs">
          <button
            onClick={() => setDiffMode("inline")}
            className={`px-3 py-1 rounded font-medium ${
              diffMode === "inline" ? "bg-[#4A6B5B] text-white" : "text-[#5C6460] hover:text-[#1F2421]"
            }`}
          >
            Inline Diff
          </button>
          <button
            onClick={() => setDiffMode("sideBySide")}
            className={`px-3 py-1 rounded font-medium ${
              diffMode === "sideBySide" ? "bg-[#4A6B5B] text-white" : "text-[#5C6460] hover:text-[#1F2421]"
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Asset Picker Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {assets.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setSelectedAsset(a);
              loadRevisions(a.id);
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

      {/* Comparison Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E7E2D8] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#5C6460]">Baseline (Old):</span>
            <select
              value={baseRevId}
              onChange={(e) => setBaseRevId(e.target.value)}
              className="p-1.5 border border-[#E7E2D8] rounded bg-[#FAF8F5] text-xs font-semibold"
            >
              {revisions.map((r) => (
                <option key={r.id} value={r.id}>
                  Revision {r.revision_number} ({new Date(r.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-[#5C6460]" />

          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#5C6460]">Target (New):</span>
            <select
              value={targetRevId}
              onChange={(e) => setTargetRevId(e.target.value)}
              className="p-1.5 border border-[#E7E2D8] rounded bg-[#FAF8F5] text-xs font-semibold"
            >
              {revisions.map((r) => (
                <option key={r.id} value={r.id}>
                  Revision {r.revision_number} ({new Date(r.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleRunComparison}
          className="px-4 py-2 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center transition-colors"
        >
          <GitCompare className="w-3.5 h-3.5 mr-1.5" />
          Compare Revisions
        </button>
      </div>

      {/* Comparison Breakdown Cards */}
      {comparison && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: Diff Viewer */}
          <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
              <h3 className="text-sm font-bold text-[#1F2421]">
                Text Diff: Revision {comparison.base_revision_number} → Revision {comparison.target_revision_number}
              </h3>
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-mono">- Deleted</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-mono">+ Added</span>
              </div>
            </div>

            {/* Diff Render Area */}
            {diffMode === "inline" ? (
              <div className="p-4 bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl text-xs font-mono leading-relaxed max-h-96 overflow-y-auto">
                {comparison.text_diff.map((chunk, i) => {
                  if (chunk.type === "remove") {
                    return (
                      <span key={i} className="bg-red-100 text-red-900 line-through px-1 py-0.5 rounded mx-0.5">
                        {chunk.text}{" "}
                      </span>
                    );
                  }
                  if (chunk.type === "add") {
                    return (
                      <span key={i} className="bg-green-100 text-green-900 font-bold px-1 py-0.5 rounded mx-0.5">
                        {chunk.text}{" "}
                      </span>
                    );
                  }
                  return <span key={i}>{chunk.text} </span>;
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-red-50/40 border border-red-200 rounded-lg">
                  <div className="text-[10px] font-bold text-red-800 uppercase mb-2">
                    Revision {comparison.base_revision_number}
                  </div>
                  <div className="leading-relaxed text-[#1F2421]">
                    {revisions.find((r) => r.id === comparison.base_revision_id)?.content_text}
                  </div>
                </div>
                <div className="p-3 bg-green-50/40 border border-green-200 rounded-lg">
                  <div className="text-[10px] font-bold text-green-800 uppercase mb-2">
                    Revision {comparison.target_revision_number}
                  </div>
                  <div className="leading-relaxed text-[#1F2421]">
                    {revisions.find((r) => r.id === comparison.target_revision_id)?.content_text}
                  </div>
                </div>
              </div>
            )}

            {/* AI Summary Banner */}
            {comparison.ai_generated_explanation && (
              <div className="p-3.5 bg-[#EBF2EE] border border-[#D1E0D7] rounded-lg text-xs text-[#223E30] flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-[#4A6B5B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-[#4A6B5B]">Governance Evolution Summary:</span>
                  <p className="mt-0.5 leading-relaxed">{comparison.ai_generated_explanation}</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COL: Claim & Finding Delta */}
          <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-[#1F2421]">Compliance Gate Delta</h3>
              <p className="text-xs text-[#5C6460] mt-0.5">
                {comparison.re_review_required ? "Re-Review Required" : "Earlier approval preserved"}
              </p>
            </div>

            {/* Resolved vs New Findings */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#1F2421] block">Findings Comparison</span>
              {comparison.findings_diff.map((f, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    f.status === "resolved"
                      ? "bg-green-50 text-green-800 border-green-200"
                      : f.status === "new_finding"
                      ? "bg-red-50 text-red-800 border-red-200"
                      : "bg-[#FAF8F5] text-[#5C6460] border-[#E7E2D8]"
                  }`}
                >
                  <span className="truncate max-w-[190px]">{f.explanation}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white">
                    {f.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>

            {/* Rollback / Restore Action */}
            <div className="pt-4 border-t border-[#F0ECE4] space-y-2">
              <span className="text-xs font-bold text-[#1F2421] block">Revision Actions</span>
              <button
                onClick={() => handleRestoreRevision(comparison.base_revision_id)}
                className="w-full px-3 py-2 bg-white border border-[#E7E2D8] hover:bg-[#FAF8F5] text-[#1F2421] text-xs font-semibold rounded-lg flex items-center justify-center transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-[#4A6B5B]" />
                Restore Revision {comparison.base_revision_number} as New Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
