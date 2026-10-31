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
      <div className="bg-[#181714] text-[#F5F4EE] border border-[#2E2C26] rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top bar with progress */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]"></span>
            </span>
            <span className="font-mono text-[#F97316] font-bold uppercase tracking-wider text-[10px]">
              Guided Demo Tour ({currentStep.stepNumber} of {steps.length})
            </span>
          </div>

          <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2E2C26] text-[#F5F4EE] border border-[#444238]">
            {currentStep.badge}
          </span>

          <button
            onClick={onClose}
            className="text-[#A9A593] hover:text-white p-1 rounded-full hover:bg-[#2E2C26] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Title & Content */}
        <h3 className="text-base font-extrabold text-[#F5F4EE] mb-2">{currentStep.title}</h3>
        <p className="text-xs text-[#A9A593] leading-relaxed mb-3 font-sans">
          {currentStep.summary}
        </p>

        {/* Enterprise Takeaway Box */}
        <div className="p-3 rounded-2xl bg-[#121210] border border-[#2E2C26] text-[11px] text-[#F5F4EE] mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0" />
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
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? "w-6 bg-white"
                    : idx < currentIndex
                    ? "w-2 bg-[#6F6C5B]"
                    : "w-1.5 bg-[#2E2C26] hover:bg-[#6F6C5B]"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border border-[#2E2C26] bg-[#121210] hover:bg-[#26251E] text-[#F5F4EE] text-xs font-medium transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white hover:bg-gray-100 text-[#181714] text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
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

