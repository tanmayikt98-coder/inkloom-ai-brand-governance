import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
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
  Layers,
} from "lucide-react";

export const TimeMachineView: React.FC = () => {
  const { activeBrand, canCreateContent } = useAuth();
  const { addToast } = useToast();
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MarketingAsset | null>(null);
  const [revisions, setRevisions] = useState<AssetRevision[]>([]);
  const [baseRevId, setBaseRevId] = useState<string>("");
  const [targetRevId, setTargetRevId] = useState<string>("");
  const [comparison, setComparison] = useState<TimeMachineComparison | null>(null);
  const [diffMode, setDiffMode] = useState<"inline" | "sideBySide">("sideBySide");
  const [loading, setLoading] = useState<boolean>(true);

  const brandId = activeBrand?.id || "brand-aurevia-001";

  const loadAssetData = async () => {
    try {
      setLoading(true);
      const list = await api.assets.listByBrand(brandId);
      setAssets(list);
      if (list.length > 0) {
        const defaultAsset = list.find((a) => a.id === "asset-landing-001") || list[0];
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
  }, [brandId]);

  const handleRunComparison = async () => {
    if (!baseRevId || !targetRevId) return;
    try {
      const comp = await api.timeMachine.compare(baseRevId, targetRevId);
      setComparison(comp);
      addToast({
        type: "info",
        title: "Revisions Compared",
        message: `Comparison refreshed between v${comp.base_revision_number} and v${comp.target_revision_number}.`,
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Comparison Failed",
        message: err.message,
      });
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!selectedAsset) return;
    try {
      await api.timeMachine.restore(selectedAsset.id, revId);
      addToast({
        type: "success",
        title: "Revision Restored",
        message: "Successfully rolled back copy. Intervening audit history preserved.",
      });
      await loadRevisions(selectedAsset.id);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Restore Failed",
        message: err.message,
      });
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] dark:border-gray-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421] dark:text-gray-100">Brand Time Machine</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400 border border-[#D1E0D7] dark:border-emerald-800 rounded-full">
              Revision Provenance Engine
            </span>
          </div>
          <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-1">
            Compare marketing collateral revisions, trace resolved violations, evaluate claim changes, and execute non-destructive rollbacks.
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center space-x-1.5 bg-stone-100 dark:bg-[#182234] border border-stone-200 dark:border-gray-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setDiffMode("inline")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              diffMode === "inline"
                ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                : "text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Inline Diff
          </button>
          <button
            onClick={() => setDiffMode("sideBySide")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              diffMode === "sideBySide"
                ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                : "text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white"
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
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border shrink-0 transition-all cursor-pointer ${
              selectedAsset?.id === a.id
                ? "bg-[#EBF2EE] dark:bg-emerald-950/40 text-[#4A6B5B] dark:text-emerald-400 border-[#4A6B5B] dark:border-emerald-700 font-semibold shadow-xs ring-1 ring-[#4A6B5B]/30"
                : "bg-white dark:bg-[#131926] text-[#1F2421] dark:text-gray-300 border-[#E7E2D8] dark:border-gray-800 hover:bg-[#FAF8F5] dark:hover:bg-gray-800/60"
            }`}
          >
            {a.title}
          </button>
        ))}
      </div>

      {/* Comparison Selectors Bar */}
      <div className="bg-white dark:bg-[#131926] p-4 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#5C6460] dark:text-gray-400">Baseline (Draft):</span>
            <select
              value={baseRevId}
              onChange={(e) => setBaseRevId(e.target.value)}
              className="p-2 border border-[#E7E2D8] dark:border-gray-700 rounded-xl bg-[#FAF8F5] dark:bg-[#182234] text-xs font-semibold text-gray-900 dark:text-white"
            >
              {revisions.map((r) => (
                <option key={r.id} value={r.id}>
                  v{r.revision_number} ({new Date(r.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-[#5C6460] dark:text-gray-400" />

          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#5C6460] dark:text-gray-400">Target (Current):</span>
            <select
              value={targetRevId}
              onChange={(e) => setTargetRevId(e.target.value)}
              className="p-2 border border-[#E7E2D8] dark:border-gray-700 rounded-xl bg-[#FAF8F5] dark:bg-[#182234] text-xs font-semibold text-gray-900 dark:text-white"
            >
              {revisions.map((r) => (
                <option key={r.id} value={r.id}>
                  v{r.revision_number} ({new Date(r.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunComparison}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Revisions</span>
          </button>
        </div>

        {canCreateContent() && selectedAsset && (
          <button
            onClick={() => handleRestoreRevision(baseRevId)}
            className="px-3 py-2 bg-stone-100 dark:bg-gray-800 hover:bg-stone-200 dark:hover:bg-gray-700 text-stone-800 dark:text-white rounded-xl font-semibold flex items-center space-x-1.5 border border-stone-200 dark:border-gray-700 text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Baseline as New Revision</span>
          </button>
        )}
      </div>

      {/* Compliance Delta Summary Cards */}
      {comparison && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Approval Status Delta
            </span>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                v{comparison.base_revision_number}: {comparison.base_audit_status || "NON_COMPLIANT"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                v{comparison.target_revision_number}: {comparison.target_audit_status || "COMPLIANT"}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Resolved Violations
            </span>
            <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              +{comparison.findings_diff.filter((f) => f.status === "resolved").length} Violations Cleared
            </div>
          </div>

          <div className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Maker-Checker Gate
            </span>
            <div className="mt-2 flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full audit trail preserved across revisions</span>
            </div>
          </div>
        </div>
      )}

      {/* Diffs Visualizer */}
      {comparison && (
        <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4] dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Sentence-Level Diff (v{comparison.base_revision_number} ➔ v{comparison.target_revision_number})
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              <span className="text-rose-600 dark:text-rose-400 font-bold">- Removed</span> |{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">+ Added</span>
            </span>
          </div>

          {diffMode === "inline" ? (
            <div className="p-4 bg-stone-50 dark:bg-[#182234] rounded-xl text-xs font-sans leading-relaxed text-gray-900 dark:text-white space-y-2">
              {comparison.text_diff.map((chunk, i) => {
                if (chunk.type === "remove") {
                  return (
                    <span key={i} className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 line-through px-1 rounded mx-0.5">
                      {chunk.text}
                    </span>
                  );
                }
                if (chunk.type === "add") {
                  return (
                    <span key={i} className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1 rounded mx-0.5">
                      {chunk.text}
                    </span>
                  );
                }
                return <span key={i}>{chunk.text}</span>;
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                  v{comparison.base_revision_number} Draft Content
                </span>
                <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
                  {revisions.find((r) => r.id === baseRevId)?.content_text}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  v{comparison.target_revision_number} Compliant Content
                </span>
                <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
                  {revisions.find((r) => r.id === targetRevId)?.content_text}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
