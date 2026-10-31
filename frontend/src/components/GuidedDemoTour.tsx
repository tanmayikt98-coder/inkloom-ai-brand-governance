import React, { useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2, Shield, Eye, Network, Scale, FileText, Layers, Clock } from "lucide-react";
import { NavSection } from "./Sidebar";

interface TourStep {
  stepNumber: number;
  section: NavSection;
  title: string;
  badge: string;
  summary: string;
  takeaway: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavSection) => void;
}

export const GuidedDemoTour: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const steps: TourStep[] = [
    {
      stepNumber: 1,
      section: "overview",
      title: "1. Executive Governance Posture",
      badge: "EVIDENCE BEFORE JUDGMENT",
      summary: "Start here to see Aurevia's enterprise compliance health at a glance. Notice the high information density: real-time compliance velocity, active risk distribution, and WORM ledger verification status with 0.0% cross-tenant leakage.",
      takeaway: "Eliminates opaque compliance spreadsheets through continuous deterministic intelligence."
    },
    {
      stepNumber: 2,
      section: "knowledge-hub",
      title: "2. Grounded Brand Knowledge Hub",
      badge: "SINGLE SOURCE OF TRUTH",
      summary: "Explore 12 approved brand facts, 8 evidentiary documents, and 6 brand rules. Notice how every fact is bound to an official benchmark or SLA audit. Click 'Check Contradictions' to see how conflicting drafts (25% vs 30%) are authoritatively resolved.",
      takeaway: "Every allowable claim is grounded in verified evidence before marketing collateral can cite it."
    },
    {
      stepNumber: 3,
      section: "content-audits",
      title: "3. Content Audit + Auto-Fix Diff Studio",
      badge: "DETERMINISTIC EVALUATION",
      summary: "Review the landing page draft. Notice how the audit engine extracts claims byte-for-byte in ~12ms. It catches an unverified 50% claim and missing disclaimer, then opens the two-pane Diff Studio with character-level highlighting and 1-click Auto-Fix.",
      takeaway: "Zero hallucinated findings. Immediate correction with recalculated state hashes."
    },
    {
      stepNumber: 4,
      section: "traceability",
      title: "4. BrandTrace Provenance Lineage",
      badge: "5-STAGE AUDIT CHAIN",
      summary: "Inspect the 5-stage deterministic provenance chain: Claim &rarr; Finding &rarr; Rule &rarr; Evidence &rarr; Approval Decision. Click 'Inspect PDF Bounding Box' to visually verify the exact [x0, y0, x1, y1] coordinates on the source report.",
      takeaway: "Unbroken audit custody from marketing headline back to regulatory source text."
    },
    {
      stepNumber: 5,
      section: "review-queue",
      title: "5. Review Queue & Maker-Checker Separation",
      badge: "MANDATORY SEGREGATION OF DUTIES",
      summary: "Experience strict enterprise separation of duties. If you are logged in as Sarah Chen (Content Creator), you cannot self-approve your own submission! Switch to Victoria Brooks (Approver) to sign off and mint a Brand Clearance Certificate.",
      takeaway: "Automated prevention of internal fraud, unauthorized collateral, and regulatory fines."
    },
    {
      stepNumber: 6,
      section: "time-machine",
      title: "6. Brand Time Machine & Version Diffs",
      badge: "NON-DESTRUCTIVE RESTORE",
      summary: "Compare Revision 1 (Non-Compliant) against Revision 2 (Compliant). Sentence-level diffing tracks exactly how copy evolved to meet compliance benchmarks. Any previous revision can be restored with an auditable trail.",
      takeaway: "Complete version history with instant compliance delta calculation."
    },
    {
      stepNumber: 7,
      section: "impact-map",
      title: "7. Brand Impact Map & Automated Cascade",
      badge: "SIGNATURE FEATURE",
      summary: "The topological dependency graph visualizes how facts and rules connect to collateral. Click 'Automated Cascade Engine' to simulate a fact update: downstream approvals are revoked within 0.23ms (<2.0s SLA) with outbound Slack webhook alerts.",
      takeaway: "Engineering and legal updates propagate automatically across the entire marketing ecosystem."
    },
    {
      stepNumber: 8,
      section: "simulator",
      title: "8. What-If Brand Simulator",
      badge: "REGULATORY STRESS-TESTING",
      summary: "Simulate regulatory policy updates in isolated sandbox environments. See the projected collateral blast radius before committing changes to production, complete with gated promote-to-live workflows.",
      takeaway: "Enables proactive compliance modeling without risking production collateral."
    },
    {
      stepNumber: 9,
      section: "audit-history",
      title: "9. Cryptographic WORM Ledger & Attestation",
      badge: "LEGAL AUDIT PROOF",
      summary: "Inspect the immutable SHA-256 hash-chained WORM ledger and hierarchical Merkle tree. Click 'Verify Integrity' for sub-second mathematical verification, and download an exportable RFC 3161 JSON-LD compliance certificate for FTC/SEC audits.",
      takeaway: "Cryptographically tamper-evident records meeting strict enterprise regulatory standards."
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = steps[currentIndex];

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      onNavigate(steps[nextIdx].section);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      onNavigate(steps[prevIdx].section);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-slideUp">
      <div className="bg-[#131926] text-white border-2 border-emerald-500/70 rounded-2xl p-5 shadow-2xl shadow-emerald-950/60 backdrop-blur-xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top bar with progress */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
              Guided Demo Tour ({currentStep.stepNumber} of {steps.length})
            </span>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
            {currentStep.badge}
          </span>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Title & Content */}
        <h3 className="text-base font-bold text-white mb-2">{currentStep.title}</h3>
        <p className="text-xs text-gray-300 leading-relaxed mb-3">
          {currentStep.summary}
        </p>

        {/* Enterprise Takeaway Box */}
        <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-gray-800 text-[11px] text-emerald-300 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span><strong>Key Enterprise Value:</strong> {currentStep.takeaway}</span>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((s, idx) => (
              <button
                key={s.stepNumber}
                onClick={() => {
                  setCurrentIndex(idx);
                  onNavigate(s.section);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? "w-6 bg-emerald-400"
                    : idx < currentIndex
                    ? "w-2 bg-emerald-700"
                    : "w-1.5 bg-gray-700 hover:bg-gray-500"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 bg-[#182234] hover:bg-[#202E46] text-gray-300 text-xs font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition-colors"
            >
              {currentIndex === steps.length - 1 ? "Complete Tour" : "Next Module"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
