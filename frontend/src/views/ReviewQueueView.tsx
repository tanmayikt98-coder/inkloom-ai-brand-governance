import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { ReviewQueueItem, ApprovalDecision, BrandClearanceCertificate } from "../types";
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
  Award,
  Lock,
  Sparkles,
} from "lucide-react";
import { ClearanceCertificateModal } from "../components/ClearanceCertificateModal";

export const ReviewQueueView: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
  const [decisionReason, setDecisionReason] = useState<string>("");
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Clearance Certificate Modal State
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState<BrandClearanceCertificate | null>(null);
  const [certLoading, setCertLoading] = useState(false);

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
      addToast({
        type: "error",
        title: "Reason Required",
        message: "A mandatory decision reason of at least 5 characters is required by compliance policy."
      });
      return;
    }

    const start = performance.now();
    try {
      setSubmittingDecision(true);
      await api.reviews.decide(selectedItem.asset_id, {
        decision,
        decision_reason: decisionReason,
      });
      const latency = performance.now() - start;
      addToast({
        type: decision === "APPROVED" ? "success" : "warning",
        title: `Asset ${decision}`,
        message: `Decision recorded into immutable WORM ledger. State hash locked.`,
        latencyMs: latency
      });
      setDecisionReason("");
      await loadQueue();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Approval Gate Blocked",
        message: err.message || "Failed to submit review decision"
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleViewCertificate = async (assetId: string) => {
    setCertLoading(true);
    const start = performance.now();
    try {
      const cert = await api.reviews.getClearanceCertificate(assetId);
      setCurrentCertificate(cert);
      setCertificateModalOpen(true);
      const latency = performance.now() - start;
      addToast({
        type: "success",
        title: "Certificate Verified",
        message: `Cryptographic SHA-256 state locked: ${cert.content_sha256.substring(0, 12)}...`,
        latencyMs: latency
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Certificate Retrieval Failed",
        message: err.message || "Unable to generate certificate"
      });
    } finally {
      setCertLoading(false);
    }
  };

  const isCreatorOfSelected = selectedItem && currentUser?.id === selectedItem.author_id;
  const hasUnresolvedViolations = selectedItem && (selectedItem.critical_findings > 0 || selectedItem.high_findings > 0);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E8E6D9] dark:border-[#2E2C26] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-[#26251E] dark:text-[#F5F4EE] tracking-tight">Human Review &amp; Approval Queue</h1>
            <span className="px-3 py-1 text-[11px] font-mono font-medium bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#F5F4EE] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-full inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]"></span>
              Maker-Checker Gates Active
            </span>
          </div>
          <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-1 font-sans">
            Enforces strict separation of duties: Content Creators cannot approve their own submissions. High findings block approval.
          </p>
        </div>

        {/* Separation of Duties Status Pill */}
        <div className="px-4 py-2 bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-full shadow-xs flex items-center space-x-2.5 text-xs">
          <div className="flex items-center space-x-1.5 text-[#26251E] dark:text-[#F5F4EE]">
            <UserCheck className="w-4 h-4 text-[#F97316]" />
            <span className="font-semibold">Reviewer Role:</span>
          </div>
          <span className="font-bold text-[#26251E] dark:text-white">{currentUser?.role}</span>
        </div>
      </div>

      {/* Main Grid: Queue List on Left, Inspection Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue Items */}
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#26251E] dark:text-[#F5F4EE]">Awaiting Sign-Off</h3>
            <span className="px-3 py-0.5 text-[10px] font-mono font-bold bg-[#F3F2EB] dark:bg-[#1C1B16] rounded-full text-[#6F6C5B] dark:text-[#A9A593] border border-[#E8E6D9] dark:border-[#2E2C26]">
              {queue.length} Pending
            </span>
          </div>

          <div className="space-y-2.5 mt-3 max-h-[600px] overflow-y-auto pr-1">
            {queue.map((item) => {
              const isSelected = selectedItem?.asset_id === item.asset_id;
              const hasCritical = item.critical_findings > 0;
              const hasHigh = item.high_findings > 0;

              return (
                <div
                  key={item.asset_id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#F3F2EB] dark:bg-[#1C1B16] border-[#26251E] dark:border-white shadow-xs"
                      : "bg-[#FCFDFD] dark:bg-[#181714] border-[#E8E6D9] dark:border-[#2E2C26] hover:border-[#6F6C5B]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#26251E] dark:text-[#F5F4EE] truncate max-w-[170px]">{item.title}</span>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-[#E8E6D9] dark:bg-[#2E2C26] rounded-full text-[#26251E] dark:text-[#F5F4EE]">
                      v{item.revision_number}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593] mb-2 font-sans">Author: {item.author_name}</div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E6D9] dark:border-[#2E2C26]">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.status === "APPROVED"
                          ? "bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-300 border border-[#D1E0D7]"
                          : item.status === "IN_REVIEW"
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200"
                          : "bg-[#F3F2EB] dark:bg-gray-800 text-[#6F6C5B] dark:text-gray-300 border border-[#E8E6D9]"
                      }`}
                    >
                      {item.status}
                    </span>

                    {hasCritical || hasHigh ? (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {item.critical_findings + item.high_findings} Violations
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#4A6B5B] dark:text-emerald-400 font-semibold flex items-center">
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
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs lg:col-span-2 space-y-6">
          {selectedItem ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-[#E8E6D9] dark:border-[#2E2C26] gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#26251E] dark:text-[#F5F4EE]">{selectedItem.title}</h3>
                  <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-0.5">
                    Revision {selectedItem.revision_number} • Submitted by {selectedItem.author_name} on{" "}
                    {new Date(selectedItem.submitted_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs uppercase font-mono font-bold px-3 py-1 rounded-full border ${
                    selectedItem.status === "APPROVED"
                      ? "bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-300 border-[#D1E0D7]"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200"
                  }`}>
                    {selectedItem.status}
                  </span>

                  {selectedItem.status === "APPROVED" && (
                    <button
                      onClick={() => handleViewCertificate(selectedItem.asset_id)}
                      disabled={certLoading}
                      className="px-4 py-1.5 bg-[#26251E] hover:bg-[#38362B] dark:bg-white dark:hover:bg-gray-100 dark:text-[#26251E] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#F97316]" />
                      View Certificate
                    </button>
                  )}
                </div>
              </div>

              {/* Policy Warnings Box */}
              {isCreatorOfSelected && (
                <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <strong>Maker-Checker Separation Constraint:</strong> You are the author of this submission ({currentUser?.full_name}). You cannot approve your own work. Switch demo role to <em>Reviewer / Approver</em> or <em>Organization Administrator</em> to execute approval.
                  </div>
                </div>
              )}

              {hasUnresolvedViolations && (
                <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <strong>Compliance Block:</strong> This revision contains {selectedItem.critical_findings} Critical and {selectedItem.high_findings} High unresolved findings. Under enterprise policy, approval is locked until a compliant revision is submitted.
                  </div>
                </div>
              )}

              {/* Decision Section */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-[#26251E] dark:text-[#F5F4EE] block">
                  Mandatory Review Decision Reason * (Immutable WORM Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="State the formal rationale for this decision (e.g. 'Verified claims against Q1 Benchmark Report Section 3.2. Mandatory disclaimers present.')..."
                  className="w-full text-xs p-3.5 border border-[#E8E6D9] dark:border-[#2E2C26] rounded-2xl focus:ring-1 focus:ring-[#26251E] dark:focus:ring-white bg-[#F3F2EB]/50 dark:bg-[#1C1B16] text-[#26251E] dark:text-[#F5F4EE] outline-none"
                />

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleDecision("APPROVED")}
                    disabled={Boolean(isCreatorOfSelected || hasUnresolvedViolations || submittingDecision)}
                    className="px-5 py-2.5 bg-[#26251E] hover:bg-[#38362B] dark:bg-white dark:hover:bg-gray-100 dark:text-[#26251E] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-full flex items-center shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                    Approve Collateral
                  </button>

                  <button
                    onClick={() => handleDecision("CHANGES_REQUESTED")}
                    disabled={Boolean(isCreatorOfSelected || submittingDecision)}
                    className="px-5 py-2.5 bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-40 text-[#26251E] dark:text-[#F5F4EE] text-xs font-semibold rounded-full flex items-center shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600 dark:text-amber-400" />
                    Request Changes
                  </button>

                  <button
                    onClick={() => handleDecision("REJECTED")}
                    disabled={Boolean(isCreatorOfSelected || submittingDecision)}
                    className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 disabled:opacity-40 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-full flex items-center shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 mr-1.5 text-rose-600 dark:text-rose-400" />
                    Reject Submission
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#6F6C5B] dark:text-[#A9A593]">
              Select an item from the queue to review and sign off.
            </div>
          )}
        </div>
      </div>

      {/* Brand Clearance Certificate Modal */}
      <ClearanceCertificateModal
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        certificate={currentCertificate}
      />
    </div>
  );
};
