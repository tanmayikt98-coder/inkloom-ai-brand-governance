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
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E8E6D9] dark:border-[#2E2C26] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-[#26251E] dark:text-[#F5F4EE] tracking-tight">Brand Time Machine</h1>
            <span className="px-3 py-1 text-[11px] font-mono font-medium bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#F5F4EE] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-full inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]"></span>
              Revision Provenance Engine
            </span>
          </div>
          <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-1 font-sans">
            Compare marketing collateral revisions, trace resolved violations, evaluate claim changes, and execute non-destructive rollbacks.
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center space-x-1 bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] p-1 rounded-full text-xs">
          <button
            onClick={() => setDiffMode("inline")}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              diffMode === "inline"
                ? "bg-[#26251E] text-white dark:bg-white dark:text-[#26251E] shadow-sm"
                : "text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-white"
            }`}
          >
            Inline Diff
          </button>
          <button
            onClick={() => setDiffMode("sideBySide")}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              diffMode === "sideBySide"
                ? "bg-[#26251E] text-white dark:bg-white dark:text-[#26251E] shadow-sm"
                : "text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-white"
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Asset Picker Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {assets.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setSelectedAsset(a);
              loadRevisions(a.id);
            }}
            className={`px-4 py-2 rounded-full text-xs font-medium border shrink-0 transition-all cursor-pointer ${
              selectedAsset?.id === a.id
                ? "bg-[#26251E] text-white dark:bg-white dark:text-[#26251E] border-[#26251E] dark:border-white font-semibold shadow-sm"
                : "bg-[#FCFDFD] dark:bg-[#181714] text-[#26251E] dark:text-[#F5F4EE] border-[#E8E6D9] dark:border-[#2E2C26] hover:bg-[#F3F2EB] dark:hover:bg-[#1C1B16]"
            }`}
          >
            {a.title}
          </button>
        ))}
      </div>

      {/* Comparison Selectors Bar */}
      <div className="bg-[#FCFDFD] dark:bg-[#181714] p-5 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#6F6C5B] dark:text-[#A9A593]">Baseline (Draft):</span>
            <select
              value={baseRevId}
              onChange={(e) => setBaseRevId(e.target.value)}
              className="p-2.5 border border-[#E8E6D9] dark:border-[#2E2C26] rounded-xl bg-[#F3F2EB]/50 dark:bg-[#1C1B16] text-xs font-semibold text-[#26251E] dark:text-[#F5F4EE]"
            >
              {revisions.map((r) => (
                <option key={r.id} value={r.id}>
                  v{r.revision_number} ({new Date(r.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-[#6F6C5B] dark:text-[#A9A593]" />

          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#6F6C5B] dark:text-[#A9A593]">Target (Current):</span>
            <select
              value={targetRevId}
              onChange={(e) => setTargetRevId(e.target.value)}
              className="p-2.5 border border-[#E8E6D9] dark:border-[#2E2C26] rounded-xl bg-[#F3F2EB]/50 dark:bg-[#1C1B16] text-xs font-semibold text-[#26251E] dark:text-[#F5F4EE]"
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
            className="px-5 py-2.5 bg-[#26251E] hover:bg-[#38362B] dark:bg-white dark:hover:bg-gray-100 dark:text-[#26251E] text-white rounded-full font-bold flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Compare Revisions</span>
          </button>
        </div>

        {canCreateContent() && selectedAsset && (
          <button
            onClick={() => handleRestoreRevision(baseRevId)}
            className="px-4 py-2.5 bg-[#F3F2EB] dark:bg-[#1C1B16] hover:bg-stone-200 dark:hover:bg-stone-800 text-[#26251E] dark:text-[#F5F4EE] rounded-full font-semibold flex items-center space-x-1.5 border border-[#E8E6D9] dark:border-[#2E2C26] text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#6F6C5B]" />
            <span>Restore Baseline as New Revision</span>
          </button>
        )}
      </div>

      {/* Compliance Delta Summary Cards */}
      {comparison && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs">
            <span className="text-[10px] font-bold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider block font-mono">
              Approval Status Delta
            </span>
            <div className="mt-2.5 flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200">
                v{comparison.base_revision_number}: {comparison.base_audit_status || "NON_COMPLIANT"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#6F6C5B]" />
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#EBF2EE] dark:bg-emerald-950 text-[#4A6B5B] dark:text-emerald-300 border border-[#D1E0D7]">
                v{comparison.target_revision_number}: {comparison.target_audit_status || "COMPLIANT"}
              </span>
            </div>
          </div>

          <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs">
            <span className="text-[10px] font-bold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider block font-mono">
              Resolved Violations
            </span>
            <div className="mt-2 text-2xl font-extrabold text-[#26251E] dark:text-[#F5F4EE]">
              +{comparison.findings_diff.filter((f) => f.status === "resolved").length} Violations Cleared
            </div>
          </div>

          <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs">
            <span className="text-[10px] font-bold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider block font-mono">
              Maker-Checker Gate
            </span>
            <div className="mt-2.5 flex items-center space-x-1.5 text-xs font-semibold text-[#26251E] dark:text-[#F5F4EE]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Full audit trail preserved across revisions</span>
            </div>
          </div>
        </div>
      )}

      {/* Diffs Visualizer */}
      {comparison && (
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E6D9] dark:border-[#2E2C26]">
            <h3 className="text-sm font-bold text-[#26251E] dark:text-[#F5F4EE]">
              Sentence-Level Diff (v{comparison.base_revision_number} ➔ v{comparison.target_revision_number})
            </h3>
            <span className="text-xs text-[#6F6C5B] dark:text-[#A9A593] font-mono">
              <span className="text-rose-600 dark:text-rose-400 font-bold">- Removed</span> |{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">+ Added</span>
            </span>
          </div>

          {diffMode === "inline" ? (
            <div className="p-4 bg-[#F3F2EB]/50 dark:bg-[#1C1B16] rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26] text-xs font-sans leading-relaxed text-[#26251E] dark:text-white space-y-2">
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
                    <span key={i} className="bg-[#EBF2EE] dark:bg-emerald-950 text-[#4A6B5B] dark:text-emerald-300 font-bold px-1 rounded mx-0.5">
                      {chunk.text}
                    </span>
                  );
                }
                return <span key={i}>{chunk.text}</span>;
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block font-mono">
                  v{comparison.base_revision_number} Draft Content
                </span>
                <p className="text-xs text-[#26251E] dark:text-gray-200 leading-relaxed font-sans">
                  {revisions.find((r) => r.id === baseRevId)?.content_text}
                </p>
              </div>

              <div className="p-5 bg-[#EBF2EE]/50 dark:bg-emerald-950/20 border border-[#D1E0D7] dark:border-emerald-900/40 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-[#4A6B5B] dark:text-emerald-400 uppercase tracking-wider block font-mono">
                  v{comparison.target_revision_number} Compliant Content
                </span>
                <p className="text-xs text-[#26251E] dark:text-gray-200 leading-relaxed font-sans">
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
