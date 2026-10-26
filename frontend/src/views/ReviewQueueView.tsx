import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { ReviewQueueItem, ApprovalDecision } from "../types";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldAlert,
  UserCheck,
  FileText,
  Send,
  Eye,
} from "lucide-react";

export const ReviewQueueView: React.FC = () => {
  const { currentUser, canApprove } = useAuth();
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
  const [decisionReason, setDecisionReason] = useState<string>("");
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const items = await api.reviews.getQueue();
      setQueue(items);
      if (items.length > 0 && !selectedItem) {
        setSelectedItem(items[0]);
      }
    } catch (err) {
      console.error("Failed to load review queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleDecision = async (decision: ApprovalDecision) => {
    if (!selectedItem) return;
    if (!decisionReason || decisionReason.trim().length < 5) {
      alert("A mandatory decision reason of at least 5 characters is required by compliance policy.");
      return;
    }

    try {
      setSubmittingDecision(true);
      await api.reviews.decide(selectedItem.asset_id, {
        decision,
        decision_reason: decisionReason,
      });
      alert(`Decision '${decision}' recorded in the immutable audit trail!`);
      setDecisionReason("");
      await loadQueue();
    } catch (err: any) {
      alert("Approval Gate Action Blocked: " + err.message);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const isCreatorOfSelected = selectedItem && currentUser?.id === selectedItem.author_id;
  const hasUnresolvedViolations = selectedItem && (selectedItem.critical_findings > 0 || selectedItem.high_findings > 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421]">Human Review & Approval Queue</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FAF8F5] border border-[#E7E2D8] text-[#5C6460] rounded">
              Maker-Checker Gates Active
            </span>
          </div>
          <p className="text-xs text-[#5C6460] mt-1">
            Enforces strict separation of duties: Content Creators cannot approve their own submissions. High findings block approval.
          </p>
        </div>

        {/* Separation of Duties Status Pill */}
        <div className="p-2.5 bg-white border border-[#E7E2D8] rounded-lg shadow-xs flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-[#4A6B5B]">
            <UserCheck className="w-4 h-4" />
            <span className="font-semibold">Reviewer Role:</span>
          </div>
          <span className="font-bold text-[#1F2421]">{currentUser?.role}</span>
        </div>
      </div>

      {/* Main Grid: Queue List on Left, Inspection Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue Items */}
        <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F2421]">Awaiting Sign-Off</h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FAF8F5] rounded text-[#5C6460]">
              {queue.length} Pending
            </span>
          </div>

          <div className="space-y-2.5 mt-3">
            {queue.map((item) => {
              const isSelected = selectedItem?.asset_id === item.asset_id;
              const hasCritical = item.critical_findings > 0;
              const hasHigh = item.high_findings > 0;

              return (
                <div
                  key={item.asset_id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#FAF8F5] border-[#4A6B5B] shadow-xs"
                      : "bg-white border-[#E7E2D8] hover:border-[#D1E0D7]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#1F2421] truncate max-w-[170px]">{item.title}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-stone-100 rounded text-stone-700">
                      v{item.revision_number}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#5C6460] mb-2">Author: {item.author_name}</div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE4]">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : item.status === "IN_REVIEW"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {item.status}
                    </span>

                    {hasCritical || hasHigh ? (
                      <span className="text-[10px] text-red-600 font-semibold flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {item.critical_findings + item.high_findings} Violations
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#4A6B5B] font-semibold flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Compliant
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Inspection & Action Decision Drawer */}
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs lg:col-span-2 space-y-6">
          {selectedItem ? (
            <>
              <div className="flex items-start justify-between pb-4 border-b border-[#F0ECE4]">
                <div>
                  <h3 className="text-base font-bold text-[#1F2421]">{selectedItem.title}</h3>
                  <p className="text-xs text-[#5C6460] mt-0.5">
                    Revision {selectedItem.revision_number} • Submitted by {selectedItem.author_name} on{" "}
                    {new Date(selectedItem.submitted_at).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs uppercase font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                  {selectedItem.status}
                </span>
              </div>

              {/* Policy Warnings Box */}
              {isCreatorOfSelected && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <strong>Maker-Checker Separation Constraint:</strong> You are the author of this submission ({currentUser?.full_name}). You cannot approve your own work. Switch demo role to <em>Reviewer / Approver</em> or <em>Organization Administrator</em> to execute approval.
                  </div>
                </div>
              )}

              {hasUnresolvedViolations && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <strong>Compliance Block:</strong> This revision contains {selectedItem.critical_findings} Critical and {selectedItem.high_findings} High unresolved findings. Under enterprise policy, approval is locked until a compliant revision is submitted.
                  </div>
                </div>
              )}

              {/* Decision Section */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-[#1F2421] block">
                  Mandatory Review Decision Reason * (Immutable Audit Log)
                </label>
                <textarea
                  rows={3}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="State the formal rationale for this decision (e.g. 'Verified against Q1 Benchmark Report Section 3.2')..."
                  className="w-full text-xs p-3 border border-[#E7E2D8] rounded-lg focus:ring-1 focus:ring-[#4A6B5B]"
                />

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleDecision("APPROVED")}
                    disabled={isCreatorOfSelected || hasUnresolvedViolations || submittingDecision}
                    className="px-4 py-2 bg-[#4A6B5B] hover:bg-[#3D5A4C] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Approve Collateral
                  </button>

                  <button
                    onClick={() => handleDecision("CHANGES_REQUESTED")}
                    disabled={isCreatorOfSelected || submittingDecision}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center shadow-xs transition-colors"
                  >
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    Request Changes
                  </button>

                  <button
                    onClick={() => handleDecision("REJECTED")}
                    disabled={isCreatorOfSelected || submittingDecision}
                    className="px-4 py-2 bg-[#B33939] hover:bg-[#962E2E] disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center shadow-xs transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Reject Submission
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#5C6460]">
              Select an item from the queue to review and sign off.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
