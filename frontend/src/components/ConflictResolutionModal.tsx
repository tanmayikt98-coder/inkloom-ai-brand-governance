import React, { useState } from "react";
import { AlertCircle, Scale, CheckCircle2, FileQuestion, ArrowRight, ShieldCheck, X } from "lucide-react";
import { EvidenceConflict } from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conflicts: EvidenceConflict[];
  onResolved?: () => void;
}

export const ConflictResolutionModal: React.FC<Props> = ({ isOpen, onClose, conflicts, onResolved }) => {
  const { addToast } = useToast();
  const [resolving, setResolving] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResolve = async (conflict: EvidenceConflict, action: "ENFORCE_TIER_1" | "CREATE_DISCREPANCY_TICKET") => {
    setResolving(conflict.conflict_id);
    const start = performance.now();
    try {
      await api.evidence.resolveConflict(
        conflict.conflict_id,
        action,
        action === "ENFORCE_TIER_1"
          ? "Authoritatively enforced Tier 1 certified audit by Apex Analytics Lab over uncalibrated Tier 3 draft."
          : "Created priority discrepancy ticket for Evidence Custodian board review."
      );
      const latency = performance.now() - start;
      addToast({
        type: "success",
        title: action === "ENFORCE_TIER_1" ? "Tier 1 Authority Enforced" : "Discrepancy Ticket Created",
        message: "Conflict resolved. Downstream claims grounded against certified benchmark.",
        latencyMs: latency
      });
      if (onResolved) onResolved();
      onClose();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Resolution Failed",
        message: err.message || "Failed to resolve conflict"
      });
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-[#131926] rounded-2xl border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Evidence Conflict & Discrepancy Resolution
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {conflicts.length} ACTIVE CONFLICT
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Deterministic detection of contradictory research and draft metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {conflicts.map((c) => (
            <div
              key={c.conflict_id}
              className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0B0F17]/50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Claim Topic: {c.claim_topic}
                </span>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                  &Delta; {c.variance_pct.toFixed(1)}% Discrepancy
                </span>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source A: Certified Authority */}
                <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Primary Certified Source
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                      Tier 1
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                    {c.primary_source_title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Metric: <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">{c.primary_metric}%</strong>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-mono">
                    {c.primary_tier}
                  </p>
                </div>

                {/* Source B: Conflicting Draft */}
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <FileQuestion className="w-4 h-4 text-amber-600" />
                      Conflicting Document
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                      Tier 3
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                    {c.conflicting_source_title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Metric: <strong className="text-amber-700 dark:text-amber-400 font-mono text-sm">{c.conflicting_metric}%</strong>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-mono">
                    {c.conflicting_tier}
                  </p>
                </div>
              </div>

              {/* Discrepancy Note */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong>Analysis:</strong> {c.detected_discrepancy}
              </div>

              {/* Resolution Action CTAs */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  disabled={resolving !== null}
                  onClick={() => handleResolve(c, "ENFORCE_TIER_1")}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-md shadow-emerald-950/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {resolving === c.conflict_id ? "Enforcing..." : "Enforce Tier 1 (Apex Benchmark 30%)"}
                </button>
                <button
                  disabled={resolving !== null}
                  onClick={() => handleResolve(c, "CREATE_DISCREPANCY_TICKET")}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-[#182234] hover:bg-gray-200 dark:hover:bg-[#202E46] text-gray-800 dark:text-gray-200 font-medium text-xs border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <FileQuestion className="w-4 h-4 text-amber-500" />
                  Create Discrepancy Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
