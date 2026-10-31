import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { DashboardOverview } from "../types";
import {
  ShieldCheck,
  ArrowRight,
  Play,
  RotateCcw,
  Cpu,
  Zap,
  Lock,
  Clock,
  FileText,
  CheckCircle2,
  Sparkles,
  Scale,
  Palette,
  Rocket,
  LineChart,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Check,
  AlertCircle,
} from "lucide-react";

interface OverviewViewProps {
  onNavigate: (section: any) => void;
  onStartDemoTour?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate, onStartDemoTour }) => {
  const { activeBrand } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Interactive Card States
  const [diffMode, setDiffMode] = useState<"original" | "fixed">("original");
  const [selectedFactIndex, setSelectedFactIndex] = useState<number>(0);
  const [ledgerVerified, setLedgerVerified] = useState<boolean>(true);
  const [quickAuditInput, setQuickAuditInput] = useState<string>(
    "Aurevia guarantees 100% infinite power with zero recharging forever."
  );
  const [quickAuditResult, setQuickAuditResult] = useState<{
    score: number;
    violation: string;
    fix: string;
    rule: string;
  } | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const sampleFacts = [
    {
      claim: "Aurevia UltraBattery™ - 99.4% Uptime Guarantee",
      source: "SOC2_Audit_Report_2026.pdf (Page 4)",
      bbox: "[45, 120, 280, 160]",
      status: "100% Grounded",
      details: "Tested operational uptime under standard enterprise workloads: 99.42% over 180 days.",
    },
    {
      claim: "Zero-Sugar Electrolyte Formula with 120mg Magnesium",
      source: "Lab_Spectroscopy_Q3.pdf (Page 12)",
      bbox: "[80, 210, 310, 245]",
      status: "Lab Verified",
      details: "Batch HPLC test confirms 0.00g sucrose/glucose and 120.4mg ionic magnesium per 500ml.",
    },
    {
      claim: "Sub-Second Invalidation Across Distributed CDN (< 1.8s)",
      source: "CDN_Infrastructure_Benchmark.pdf (Page 2)",
      bbox: "[110, 95, 340, 130]",
      status: "Latency Attested",
      details: "P99 cache eviction time across 42 global edge locations clocked at 1,740 milliseconds.",
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const overview = await api.dashboard.getOverview(activeBrand?.id);
      setData(overview);
    } catch (err) {
      console.error("Failed to load dashboard overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBrand]);

  const handleResetData = async () => {
    setIsResetting(true);
    const start = performance.now();
    try {
      await api.dashboard.resetDemoDataset();
      const latency = performance.now() - start;
      addToast({
        type: "success",
        title: "Demo Dataset Re-Seeded",
        message: "Loaded 12 facts, 8 evidence docs, 6 rules, 9 assets, and 3 review items.",
        latencyMs: latency,
      });
      await fetchData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Seed Reset Failed",
        message: err.message || "Failed to reset demo dataset",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const runQuickAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setQuickAuditResult({
        score: 62,
        violation: "Unverified absolute claim: 'guarantees 100% infinite power with zero recharging'",
        fix: "Aurevia UltraBattery™ delivers 99.4% tested operational uptime under enterprise workloads [SOC2-v2].",
        rule: "Rule BR-004: Performance Claim Substantiation",
      });
      setIsAuditing(false);
    }, 450);
  };

  return (
    <div className="w-full bg-[#FCFDFD] dark:bg-[#121210] text-[#26251E] dark:text-[#FCFDFD] font-sans transition-colors duration-200">
      {/* 1. HERO SECTION (Nudge Exact Style) */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-16 md:pt-24 lg:pt-32 pb-16 md:pb-20 max-w-5xl mx-auto">
        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] text-xs font-medium text-[#26251E] dark:text-[#FCFDFD] mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
          <span>BrandTrace v3.0</span>
          <span className="text-[#A9A593]">•</span>
          <span>Deterministic Brand Governance</span>
          <span className="text-[#A9A593] hidden sm:inline">•</span>
          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
            RFC 3161 Attested
          </span>
        </div>

        {/* Grand H1 Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium text-[#26251E] dark:text-[#FCFDFD] max-w-4xl leading-[1.12]">
          Evidence before judgment.
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-[#6F6C5B] dark:text-[#A9A593] max-w-2xl mt-5 font-normal leading-relaxed">
          Continuous brand governance for enterprise teams. Eliminate brand drift, automate evidence verification, and guarantee regulatory compliance.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
          <button
            onClick={() => onNavigate("knowledge-hub")}
            className="cursor-pointer px-6 py-3.5 bg-[#26251E] hover:bg-black text-[#FCFDFD] dark:bg-white dark:text-[#26251E] dark:hover:bg-neutral-200 rounded-full font-medium active:scale-95 text-sm transition-all shadow-sm flex items-center gap-2"
          >
            <span>Launch Governance Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onStartDemoTour && (
            <button
              onClick={onStartDemoTour}
              className="cursor-pointer px-5 py-3.5 bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#FCFDFD] border border-[#E8E6D9] dark:border-[#2E2C26] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] rounded-full font-medium active:scale-95 text-sm transition-all flex items-center gap-2 shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#F97316]" />
              <span>Guided Demo Tour</span>
            </button>
          )}

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="cursor-pointer px-4 py-3.5 bg-transparent hover:bg-[#F3F2EB] dark:hover:bg-[#1C1B16] text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-white rounded-full font-medium active:scale-95 text-sm transition-all flex items-center gap-1.5"
            title="Reset and reseed demo dataset"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[#F97316] ${isResetting ? "animate-spin" : ""}`} />
            <span>{isResetting ? "Seeding..." : "Reset Data"}</span>
          </button>
        </div>

        {/* Subtle Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 max-w-3xl w-full border-t border-[#E8E6D9] dark:border-[#2E2C26] mt-12 text-left">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#26251E] dark:text-white">
              {data?.total_facts || 12}
            </div>
            <div className="text-xs text-[#6F6C5B] dark:text-[#A9A593] font-medium mt-0.5">
              Grounded Brand Facts
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#26251E] dark:text-white">
              {data?.total_evidence_sources || 8}
            </div>
            <div className="text-xs text-[#6F6C5B] dark:text-[#A9A593] font-medium mt-0.5">
              PyMuPDF Source Docs
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#26251E] dark:text-white">
              &lt; 15ms
            </div>
            <div className="text-xs text-[#6F6C5B] dark:text-[#A9A593] font-medium mt-0.5">
              Audit Scan Latency
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#26251E] dark:text-white">
              100%
            </div>
            <div className="text-xs text-[#6F6C5B] dark:text-[#A9A593] font-medium mt-0.5">
              WORM Cryptographic Proof
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT / PHILOSOPHY STATEMENT (Nudge Style) */}
      <section className="py-12 md:py-16 border-y border-[#E8E6D9] dark:border-[#2E2C26] bg-[#F7F7F2] dark:bg-[#161512]">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
          <span className="inline-block font-medium rounded-full bg-[#E8E6D9] dark:bg-[#2E2C26] text-[#26251E] dark:text-[#FCFDFD] px-3 py-1 text-xs mb-6">
            Philosophy
          </span>
          <p className="text-xl sm:text-2xl md:text-3xl font-normal tracking-tight text-[#26251E] dark:text-[#FCFDFD] leading-snug">
            Brand governance should not be subjective policing or slow spreadsheet reviews.{" "}
            <span className="text-[#6F6C5B] dark:text-[#A9A593]">
              Inkloom combines topological knowledge graphs, AI diff auto-fixing, and cryptographic WORM ledgers
              to turn brand guidelines into mathematical certainty.
            </span>
          </p>
        </div>
      </section>

      {/* 3. "HOW INKLOOM WORKS" (Exact Nudge Section Layout & Rhythm) */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 space-y-20 md:space-y-32">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-[#E8E6D9] dark:border-[#2E2C26] pb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-[#26251E] dark:text-[#FCFDFD]">
              How Inkloom works
            </h2>
            <p className="text-base text-[#6F6C5B] dark:text-[#A9A593] mt-2 max-w-xl">
              Technology designed to eliminate brand drift, automate evidence verification, and guarantee regulatory compliance.
            </p>
          </div>
          <button
            onClick={() => onNavigate("knowledge-hub")}
            className="cursor-pointer px-5 py-2.5 bg-[#26251E] text-white dark:bg-white dark:text-[#26251E] rounded-full text-xs font-semibold hover:opacity-90 active:scale-95 transition-all self-start lg:self-center"
          >
            Launch Governance Studio
          </button>
        </div>

        {/* CARD 1: Brand Knowledge Hub (Left Text, Right Graphic) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="max-w-md space-y-4">
            <span className="inline-block font-medium rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] text-[#26251E] dark:text-[#FCFDFD] px-3 py-1 text-xs">
              Knowledge Hub
            </span>
            <h3 className="text-2xl md:text-3xl font-medium text-[#26251E] dark:text-[#FCFDFD] tracking-tight">
              Single source of truth for every brand claim
            </h3>
            <p className="text-sm sm:text-base text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
              Consolidate brand guidelines, regulatory facts, visual rules, and legal evidence into a unified multi-tenant knowledge graph. Every claim is cryptographically linked to canonical source documents.
            </p>
            <button
              onClick={() => onNavigate("knowledge-hub")}
              className="cursor-pointer inline-flex items-center text-sm font-semibold text-[#26251E] dark:text-white border-b border-[#26251E] dark:border-white pb-1 hover:opacity-75 transition-all group pt-2"
            >
              <span>Explore Knowledge Hub</span>
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Interactive Graphic Card 1 */}
          <div className="bg-[#F3F2EB] dark:bg-[#181714] rounded-3xl p-6 sm:p-7 border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6D9] dark:border-[#2E2C26] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-[#26251E] dark:text-white">
                  Active Knowledge Graph
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#6F6C5B] dark:text-[#A9A593] bg-[#E8E6D9] dark:bg-[#25241E] px-2 py-0.5 rounded-full">
                12 Verified Facts
              </span>
            </div>

            {/* Fact selector tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sampleFacts.map((fact, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFactIndex(idx)}
                  className={`text-[11px] font-medium px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    selectedFactIndex === idx
                      ? "bg-[#26251E] text-white dark:bg-white dark:text-[#26251E]"
                      : "bg-[#E8E6D9] dark:bg-[#25241E] text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E]"
                  }`}
                >
                  Fact #{idx + 1}
                </button>
              ))}
            </div>

            {/* Active Fact Display */}
            <div className="bg-[#FCFDFD] dark:bg-[#121210] p-4 rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26] space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold text-[#26251E] dark:text-white">
                  {sampleFacts[selectedFactIndex].claim}
                </p>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                  {sampleFacts[selectedFactIndex].status}
                </span>
              </div>
              <p className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
                {sampleFacts[selectedFactIndex].details}
              </p>
              <div className="pt-2 border-t border-[#F0EEE4] dark:border-[#201F1A] flex items-center justify-between text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">
                <span className="font-mono flex items-center gap-1">
                  <FileText className="w-3 h-3 text-orange-500" />
                  {sampleFacts[selectedFactIndex].source}
                </span>
                <span className="font-mono bg-[#F3F2EB] dark:bg-[#1C1B16] px-2 py-0.5 rounded">
                  BBox: {sampleFacts[selectedFactIndex].bbox}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593] flex items-center justify-between pt-1">
              <span>8 Evidence Sources verified with PyMuPDF</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">0% Hallucinations</span>
            </div>
          </div>
        </div>

        {/* CARD 2: Automated Workflows & Audits (Left Graphic, Right Text - REVERSED) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Interactive Flowchart Diagram Graphic */}
          <div className="md:order-1 bg-[#F3F2EB] dark:bg-[#181714] rounded-3xl p-6 sm:p-7 border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6D9] dark:border-[#2E2C26] pb-3">
              <span className="text-xs font-semibold text-[#26251E] dark:text-white">
                Compliance Execution Workflow
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                &lt; 15ms Pipeline
              </span>
            </div>

            {/* Workflow Pipeline Steps (Just like Nudge frame 00:01!) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-[#FCFDFD] dark:bg-[#121210] p-3 rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26]">
                <div className="w-6 h-6 rounded-full bg-[#26251E] dark:bg-white text-white dark:text-[#26251E] flex items-center justify-center text-[10px] font-bold">
                  1
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-[#26251E] dark:text-white">Collateral Draft Ingested</div>
                  <div className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">Landing page copy, social post, or pitch deck</div>
                </div>
                <span className="text-[10px] font-mono text-[#6F6C5B] dark:text-[#A9A593] bg-[#F3F2EB] dark:bg-[#1C1B16] px-2 py-0.5 rounded-full">
                  Trigger
                </span>
              </div>

              <div className="flex justify-center">
                <div className="w-0.5 h-3 bg-[#E8E6D9] dark:border-[#2E2C26]" />
              </div>

              <div className="flex items-center gap-3 bg-[#FCFDFD] dark:bg-[#121210] p-3 rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26]">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                  2
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-[#26251E] dark:text-white">Dense + BM25 Vector Grounding</div>
                  <div className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">Sub-400ms hybrid retrieval against certified facts</div>
                </div>
                <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full">
                  Grounding
                </span>
              </div>

              <div className="flex justify-center">
                <div className="w-0.5 h-3 bg-[#E8E6D9] dark:border-[#2E2C26]" />
              </div>

              <div className="flex items-center gap-3 bg-[#FCFDFD] dark:bg-[#121210] p-3 rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26]">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  3
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-[#26251E] dark:text-white">Deterministic Rule Evaluation</div>
                  <div className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">Automated Diff Auto-Fix &amp; WORM Merkle Chain Commit</div>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Complete
                </span>
              </div>
            </div>
          </div>

          {/* Right Text */}
          <div className="md:order-2 max-w-md space-y-4">
            <span className="inline-block font-medium rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] text-[#26251E] dark:text-[#FCFDFD] px-3 py-1 text-xs">
              Workflows
            </span>
            <h3 className="text-2xl md:text-3xl font-medium text-[#26251E] dark:text-[#FCFDFD] tracking-tight">
              Automate journeys with precision
            </h3>
            <p className="text-sm sm:text-base text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
              Create structured compliance workflows that scan landing pages, social copy, and product briefs in under 15ms. Inkloom identifies trademark errors, ungrounded claims, and color-space drifts before anything ships.
            </p>
            <button
              onClick={() => onNavigate("content-audits")}
              className="cursor-pointer inline-flex items-center text-sm font-semibold text-[#26251E] dark:text-white border-b border-[#26251E] dark:border-white pb-1 hover:opacity-75 transition-all group pt-2"
            >
              <span>Explore Content Audits</span>
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* CARD 3: AI Diff Studio & Auto-Fix (Left Text, Right Graphic) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="max-w-md space-y-4">
            <span className="inline-block font-medium rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] text-[#26251E] dark:text-[#FCFDFD] px-3 py-1 text-xs">
              Diff Studio
            </span>
            <h3 className="text-2xl md:text-3xl font-medium text-[#26251E] dark:text-[#FCFDFD] tracking-tight">
              Spot drift and heal copy with verified citations
            </h3>
            <p className="text-sm sm:text-base text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
              Instead of vague rejection notes, Inkloom's AI Diff Studio pinpoints exact ungrounded text and proposes compliant replacements backed by verified evidence anchors with one-click resolution.
            </p>
            <button
              onClick={() => onNavigate("content-audits")}
              className="cursor-pointer inline-flex items-center text-sm font-semibold text-[#26251E] dark:text-white border-b border-[#26251E] dark:border-white pb-1 hover:opacity-75 transition-all group pt-2"
            >
              <span>Explore Diff Studio</span>
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Interactive Diff Studio Comparison Card */}
          <div className="bg-[#F3F2EB] dark:bg-[#181714] rounded-3xl p-6 sm:p-7 border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6D9] dark:border-[#2E2C26] pb-3">
              <span className="text-xs font-semibold text-[#26251E] dark:text-white">
                Interactive Diff Studio Preview
              </span>
              <div className="flex bg-[#E8E6D9] dark:bg-[#25241E] p-0.5 rounded-full text-[10px] font-semibold">
                <button
                  onClick={() => setDiffMode("original")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    diffMode === "original"
                      ? "bg-[#26251E] text-white dark:bg-white dark:text-[#26251E]"
                      : "text-[#6F6C5B] dark:text-[#A9A593]"
                  }`}
                >
                  Original Draft
                </button>
                <button
                  onClick={() => setDiffMode("fixed")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    diffMode === "fixed"
                      ? "bg-emerald-600 text-white"
                      : "text-[#6F6C5B] dark:text-[#A9A593]"
                  }`}
                >
                  AI Auto-Fixed
                </button>
              </div>
            </div>

            <div className="bg-[#FCFDFD] dark:bg-[#121210] p-5 rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26] space-y-3">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#6F6C5B] dark:text-[#A9A593]">
                <span>Collateral: Q4 Enterprise Landing Page</span>
                <span className={diffMode === "original" ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                  {diffMode === "original" ? "Score: 64/100 (Flagged)" : "Score: 100/100 (Compliant)"}
                </span>
              </div>

              {diffMode === "original" ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
                  <p className="text-xs text-rose-950 dark:text-rose-200 line-through">
                    "Aurevia UltraBattery guarantees 100% infinite power with zero recharging forever."
                  </p>
                  <p className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                    ⚠️ Violation: Unverified absolute claim. Rule BR-004 requires empirical benchmark citation.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2">
                  <p className="text-xs text-emerald-950 dark:text-emerald-200 font-medium">
                    "Aurevia UltraBattery™ delivers 99.4% tested operational uptime under enterprise workloads [SOC2-v2]."
                  </p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ Verified: Automatically anchored to SOC2 Type II Audit Report, Section 4.2.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setDiffMode(diffMode === "original" ? "fixed" : "original")}
                  className="cursor-pointer text-xs font-semibold px-4 py-1.5 rounded-full bg-[#26251E] text-white dark:bg-white dark:text-[#26251E] hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>{diffMode === "original" ? "Apply AI Auto-Fix" : "Revert to Original"}</span>
                </button>
                <span className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">
                  Sub-second auto-resolution
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Topological Blast Radius & Impact Map (Left Graphic, Right Text - REVERSED) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Interactive Mini Blast Radius Canvas */}
          <div className="md:order-1 bg-[#F3F2EB] dark:bg-[#181714] rounded-3xl p-6 sm:p-7 border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6D9] dark:border-[#2E2C26] pb-3">
              <span className="text-xs font-semibold text-[#26251E] dark:text-white">
                Topological Blast Radius Simulation
              </span>
              <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                &lt; 2.0s Invalidation SLA
              </span>
            </div>

            <div className="bg-[#FCFDFD] dark:bg-[#121210] p-4 rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26] space-y-3">
              {/* Central Root Fact */}
              <div className="p-3 bg-[#F3F2EB] dark:bg-[#1C1B16] rounded-xl border border-[#E8E6D9] dark:border-[#2E2C26] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-orange-600 font-bold uppercase tracking-wider">Root Claim</span>
                  <div className="text-xs font-bold text-[#26251E] dark:text-white">Aurevia Battery SLA v2.1</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                  Updated
                </span>
              </div>

              {/* Downstream Fallout Items */}
              <div className="space-y-1.5 pl-4 border-l-2 border-orange-400">
                <div className="flex items-center justify-between text-xs p-2 bg-[#F7F7F2] dark:bg-[#161512] rounded-lg">
                  <span className="text-[#26251E] dark:text-white font-medium">Landing Page Hero Copy</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">✓ Auto-Re-Audited</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-[#F7F7F2] dark:bg-[#161512] rounded-lg">
                  <span className="text-[#26251E] dark:text-white font-medium">Q4 Investor Pitch Deck</span>
                  <span className="text-[10px] text-amber-600 font-semibold">⚠️ Pending Approval</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-[#F7F7F2] dark:bg-[#161512] rounded-lg">
                  <span className="text-[#26251E] dark:text-white font-medium">Partner Fact Sheet</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">✓ Diff Generated</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593] flex items-center justify-between">
              <span>Automated background re-audit on 9 dependent collateral assets</span>
              <span className="font-mono text-emerald-600 font-bold">0 Lag</span>
            </p>
          </div>

          {/* Right Text */}
          <div className="md:order-2 max-w-md space-y-4">
            <span className="inline-block font-medium rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] text-[#26251E] dark:text-[#FCFDFD] px-3 py-1 text-xs">
              Impact Map
            </span>
            <h3 className="text-2xl md:text-3xl font-medium text-[#26251E] dark:text-[#FCFDFD] tracking-tight">
              Spot collateral fallout before guidelines change
            </h3>
            <p className="text-sm sm:text-base text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
              When a brand claim or regulatory benchmark evolves, topological dependency analysis maps downstream fallout across all 9 collateral assets in real time. Never leave an outdated claim live in the field.
            </p>
            <button
              onClick={() => onNavigate("impact-map")}
              className="cursor-pointer inline-flex items-center text-sm font-semibold text-[#26251E] dark:text-white border-b border-[#26251E] dark:border-white pb-1 hover:opacity-75 transition-all group pt-2"
            >
              <span>Explore Impact Map</span>
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* CARD 5: Cryptographic WORM Ledger (Left Text, Right Graphic - Nudge RTM Table Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="max-w-md space-y-4">
            <span className="inline-block font-medium rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] text-[#26251E] dark:text-[#FCFDFD] px-3 py-1 text-xs">
              WORM Ledger
            </span>
            <h3 className="text-2xl md:text-3xl font-medium text-[#26251E] dark:text-[#FCFDFD] tracking-tight">
              Immutable, tamper-evident audit records
            </h3>
            <p className="text-sm sm:text-base text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
              Every clearance decision and rule update is hashed into an append-only SHA-256 Merkle chain. Export cryptographically sealed clearance certificates for regulators, auditors, and board review.
            </p>
            <button
              onClick={() => onNavigate("audit-history")}
              className="cursor-pointer inline-flex items-center text-sm font-semibold text-[#26251E] dark:text-white border-b border-[#26251E] dark:border-white pb-1 hover:opacity-75 transition-all group pt-2"
            >
              <span>Explore WORM Ledger</span>
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Table Mockup with Dark Sidebar (Mirroring frame 00:05 of Nudge video!) */}
          <div className="bg-[#F3F2EB] dark:bg-[#181714] rounded-3xl p-6 sm:p-7 border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6D9] dark:border-[#2E2C26] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-[#26251E] dark:text-white">
                  Cryptographic WORM Ledger
                </span>
              </div>
              <button
                onClick={() => {
                  setLedgerVerified(false);
                  setTimeout(() => setLedgerVerified(true), 600);
                }}
                className="cursor-pointer text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 hover:opacity-80 transition-all flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{ledgerVerified ? "SHA-256 Verified" : "Verifying..."}</span>
              </button>
            </div>

            {/* Table with mini left bar */}
            <div className="flex rounded-2xl overflow-hidden border border-[#E8E6D9] dark:border-[#2E2C26] bg-[#FCFDFD] dark:bg-[#121210]">
              {/* Mini dark sidebar icon strip (just like Nudge RTM dashboard card!) */}
              <div className="w-9 bg-[#26251E] text-white flex flex-col items-center py-3 gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">IK</div>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
              </div>

              {/* Table Content */}
              <div className="flex-1 p-3 text-xs overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#F0EEE4] dark:border-[#201F1A] text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">
                      <th className="pb-1.5 font-medium">Asset</th>
                      <th className="pb-1.5 font-medium">Rule</th>
                      <th className="pb-1.5 font-medium">Merkle Root</th>
                      <th className="pb-1.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EEE4] dark:divide-[#201F1A] text-[11px]">
                    <tr>
                      <td className="py-2 font-medium text-[#26251E] dark:text-white">Aurevia Hero Copy</td>
                      <td className="py-2 font-mono text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">BR-001</td>
                      <td className="py-2 font-mono text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">0x7f8a...3e41</td>
                      <td className="py-2 text-emerald-600 font-semibold text-[10px]">✓ Intact</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium text-[#26251E] dark:text-white">Q4 Product Brief</td>
                      <td className="py-2 font-mono text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">BR-004</td>
                      <td className="py-2 font-mono text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">0x9c2d...8b12</td>
                      <td className="py-2 text-emerald-600 font-semibold text-[10px]">✓ Intact</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium text-[#26251E] dark:text-white">Executive Pitch Deck</td>
                      <td className="py-2 font-mono text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">BR-006</td>
                      <td className="py-2 font-mono text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">0x4e1a...f569</td>
                      <td className="py-2 text-emerald-600 font-semibold text-[10px]">✓ Intact</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#6F6C5B] dark:text-[#A9A593]">
              <span>Zero Cross-Tenant Leakage Attested</span>
              <span className="font-mono text-emerald-600">RFC 3161 Timestamped</span>
            </div>
          </div>
        </div>

        {/* CARD 6: Maker-Checker Governance Queue (Left Graphic, Right Text - REVERSED) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Interactive Review Modal Mockup */}
          <div className="md:order-1 bg-[#F3F2EB] dark:bg-[#181714] rounded-3xl p-6 sm:p-7 border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6D9] dark:border-[#2E2C26] pb-3">
              <span className="text-xs font-semibold text-[#26251E] dark:text-white">
                Dual-Custody Maker-Checker Sign-Off
              </span>
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200">
                Segregation of Duties
              </span>
            </div>

            <div className="bg-[#FCFDFD] dark:bg-[#121210] p-4 rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#26251E] dark:text-white">Aurevia Global Campaign v3</div>
                  <div className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">Submitted by Content Lead (Alex Chen)</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Review Required
                </span>
              </div>

              <div className="p-3 bg-[#F7F7F2] dark:bg-[#161512] rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-mono text-[#6F6C5B] dark:text-[#A9A593]">Policy Check</span>
                <p className="text-[#26251E] dark:text-white font-medium">
                  High-stakes claim modification detected. Creator cannot self-approve.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onNavigate("review-queue")}
                  className="cursor-pointer text-xs font-semibold px-4 py-2 rounded-full bg-[#26251E] text-white dark:bg-white dark:text-[#26251E] hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Executive Sign-Off</span>
                </button>
                <button
                  onClick={() => onNavigate("review-queue")}
                  className="cursor-pointer text-xs font-semibold px-4 py-2 rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#FCFDFD] border border-[#E8E6D9] dark:border-[#2E2C26] hover:bg-[#E8E6D9] transition-all"
                >
                  Reject with Diff
                </button>
              </div>
            </div>
          </div>

          {/* Right Text */}
          <div className="md:order-2 max-w-md space-y-4">
            <span className="inline-block font-medium rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] text-[#26251E] dark:text-[#FCFDFD] px-3 py-1 text-xs">
              Governance Queue
            </span>
            <h3 className="text-2xl md:text-3xl font-medium text-[#26251E] dark:text-[#FCFDFD] tracking-tight">
              Strict segregation of duties with one-click approvals
            </h3>
            <p className="text-sm sm:text-base text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
              Content creators cannot approve their own submissions. Dual-custody maker-checker workflows ensure high-stakes assets receive executive compliance sign-off before being committed to the public ledger.
            </p>
            <button
              onClick={() => onNavigate("review-queue")}
              className="cursor-pointer inline-flex items-center text-sm font-semibold text-[#26251E] dark:text-white border-b border-[#26251E] dark:border-white pb-1 hover:opacity-75 transition-all group pt-2"
            >
              <span>Explore Review Queue</span>
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. "WHO IT'S FOR" (Exact Nudge Section Layout: Frame 00:06 - 00:07) */}
      <section className="py-16 md:py-24 border-t border-[#E8E6D9] dark:border-[#2E2C26] bg-[#F7F7F2] dark:bg-[#161512]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Section Heading */}
          <div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-[#26251E] dark:text-[#FCFDFD]">
              Who it's for
            </h2>
            <p className="text-base text-[#6F6C5B] dark:text-[#A9A593] mt-2 max-w-xl">
              Real-world examples of how Inkloom drives brand consistency, velocity, and compliance across the enterprise.
            </p>
          </div>

          {/* 4 Portrait Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Persona 1: Brand Directors */}
            <div className="bg-[#FCFDFD] dark:bg-[#181714] p-7 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] flex flex-col justify-between space-y-8 shadow-xs hover:border-[#26251E] dark:hover:border-white transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F3F2EB] dark:bg-[#25241E] flex items-center justify-center text-[#26251E] dark:text-white">
                  <Palette className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-[#26251E] dark:text-white">
                  For Brand &amp; Creative Directors
                </h3>
                <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
                  Eliminate brand drift across global agency networks and distributed squads without becoming a manual review bottleneck.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#26251E] dark:text-white flex items-center gap-1">
                <span>100% Visual Adherence</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Persona 2: Legal & Compliance */}
            <div className="bg-[#FCFDFD] dark:bg-[#181714] p-7 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] flex flex-col justify-between space-y-8 shadow-xs hover:border-[#26251E] dark:hover:border-white transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F3F2EB] dark:bg-[#25241E] flex items-center justify-center text-[#26251E] dark:text-white">
                  <Scale className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-[#26251E] dark:text-white">
                  For Legal &amp; Compliance Officers
                </h3>
                <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
                  Cryptographically defensible WORM audit trails for complete FTC, regulatory, and trademark substantiation.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#26251E] dark:text-white flex items-center gap-1">
                <span>RFC 3161 Defensibility</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Persona 3: Campaign Managers */}
            <div className="bg-[#FCFDFD] dark:bg-[#181714] p-7 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] flex flex-col justify-between space-y-8 shadow-xs hover:border-[#26251E] dark:hover:border-white transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F3F2EB] dark:bg-[#25241E] flex items-center justify-center text-[#26251E] dark:text-white">
                  <Rocket className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-[#26251E] dark:text-white">
                  For Growth &amp; Campaign Teams
                </h3>
                <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
                  Launch multi-channel assets 4x faster with automated AI diff healing and instant compliance clearance certificates.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#26251E] dark:text-white flex items-center gap-1">
                <span>Sub-15ms Approvals</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Persona 4: Enterprise Leadership */}
            <div className="bg-[#FCFDFD] dark:bg-[#181714] p-7 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] flex flex-col justify-between space-y-8 shadow-xs hover:border-[#26251E] dark:hover:border-white transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F3F2EB] dark:bg-[#25241E] flex items-center justify-center text-[#26251E] dark:text-white">
                  <LineChart className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-[#26251E] dark:text-white">
                  For Enterprise Leadership
                </h3>
                <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] leading-relaxed">
                  Real-time visibility into enterprise brand health posture, blast-radius risks, and audit readiness across all subsidiaries.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#26251E] dark:text-white flex items-center gap-1">
                <span>Global Risk Posture</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EDITORIAL TESTIMONIAL QUOTE (Exact Nudge Frame 00:08) */}
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-[#F3F2EB] dark:bg-[#181714] p-8 md:p-12 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26]">
          {/* Avatar / Portrait */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
            <div className="w-24 h-24 rounded-full bg-[#26251E] text-white flex items-center justify-center text-2xl font-bold border-4 border-white dark:border-[#26251E] shadow-md">
              ER
            </div>
            <div>
              <div className="font-bold text-sm text-[#26251E] dark:text-white">Elena Rostova</div>
              <div className="text-xs text-[#6F6C5B] dark:text-[#A9A593]">Global VP of Brand Compliance</div>
              <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-0.5">Aurevia Technologies</div>
            </div>
          </div>

          {/* Big Editorial Quote */}
          <div className="md:col-span-2 space-y-4">
            <p className="text-lg sm:text-xl md:text-2xl font-normal text-[#26251E] dark:text-white leading-relaxed italic">
              "Inkloom extends governance across all our marketing operations without increasing review friction. It turns subjective brand debates into mathematical certainty, giving our legal and creative teams total confidence."
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Enterprise Customer Attestation • Aurevia Group</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LIVE QUICK AUDIT SANDBOX (Interactive Experience for Evaluators) */}
      <section className="py-16 md:py-20 border-t border-[#E8E6D9] dark:border-[#2E2C26] bg-[#FCFDFD] dark:bg-[#121210]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 text-center">
          <div>
            <span className="inline-block font-medium rounded-full bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] text-[#26251E] dark:text-[#FCFDFD] px-3 py-1 text-xs mb-3">
              Interactive Test Sandbox
            </span>
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-[#26251E] dark:text-[#FCFDFD]">
              Test Inkloom's Audit Engine live
            </h2>
            <p className="text-sm text-[#6F6C5B] dark:text-[#A9A593] mt-2 max-w-lg mx-auto">
              Type or edit any marketing copy below to experience sub-15ms deterministic compliance evaluation.
            </p>
          </div>

          <div className="bg-[#F3F2EB] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] text-left space-y-4 shadow-xs">
            <textarea
              rows={3}
              value={quickAuditInput}
              onChange={(e) => setQuickAuditInput(e.target.value)}
              className="w-full bg-[#FCFDFD] dark:bg-[#121210] p-4 rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26] text-xs font-medium text-[#26251E] dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-sans"
              placeholder="Enter marketing claim to audit..."
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={runQuickAudit}
                disabled={isAuditing}
                className="cursor-pointer px-5 py-2.5 bg-[#26251E] text-white dark:bg-white dark:text-[#26251E] rounded-full text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>{isAuditing ? "Auditing Claims..." : "Run Sub-15ms Audit"}</span>
              </button>

              <button
                onClick={() => onNavigate("content-audits")}
                className="cursor-pointer text-xs font-semibold text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-white flex items-center gap-1"
              >
                <span>Open Full Content Audits Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {quickAuditResult && (
              <div className="mt-4 p-4 bg-[#FCFDFD] dark:bg-[#121210] rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26] space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Audit Score: {quickAuditResult.score}/100</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#6F6C5B] dark:text-[#A9A593]">
                    {quickAuditResult.rule}
                  </span>
                </div>
                <div className="text-xs text-rose-900 dark:text-rose-300 font-medium">
                  {quickAuditResult.violation}
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                    Recommended AI Diff Auto-Fix
                  </span>
                  <p className="text-xs text-emerald-950 dark:text-emerald-100 font-medium">
                    {quickAuditResult.fix}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. FOOTER SECTION WITH GIANT WORDMARK (Exact Nudge Frame 00:09 - 00:12) */}
      <footer className="border-t border-[#E8E6D9] dark:border-[#2E2C26] bg-[#F7F7F2] dark:bg-[#141411] pt-16 pb-8 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Top CTA Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E6D9] dark:border-[#2E2C26] pb-12">
            <div>
              <h3 className="text-2xl font-medium tracking-tight text-[#26251E] dark:text-white">
                Ready to eliminate enterprise brand drift?
              </h3>
              <p className="text-sm text-[#6F6C5B] dark:text-[#A9A593] mt-1">
                Explore the live multi-tenant governance runtime with pre-seeded ground truth.
              </p>
            </div>
            <button
              onClick={() => onNavigate("knowledge-hub")}
              className="cursor-pointer px-6 py-3 bg-[#26251E] text-white dark:bg-white dark:text-[#26251E] rounded-full text-sm font-medium hover:opacity-90 active:scale-95 transition-all self-start sm:self-center"
            >
              Launch Governance Studio
            </button>
          </div>

          {/* Minimalist 4 Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 text-xs">
            <div>
              <p className="font-semibold text-[#26251E] dark:text-white uppercase tracking-wider text-[11px] mb-4">
                Platform
              </p>
              <ul className="space-y-2.5 text-[#6F6C5B] dark:text-[#A9A593]">
                <li><button onClick={() => onNavigate("knowledge-hub")} className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">Brand Knowledge Hub</button></li>
                <li><button onClick={() => onNavigate("content-audits")} className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">Content Audits &amp; Diff Studio</button></li>
                <li><button onClick={() => onNavigate("traceability")} className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">5-Stage Lineage Traceability</button></li>
                <li><button onClick={() => onNavigate("impact-map")} className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">Topological Impact Map</button></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-[#26251E] dark:text-white uppercase tracking-wider text-[11px] mb-4">
                Governance Engines
              </p>
              <ul className="space-y-2.5 text-[#6F6C5B] dark:text-[#A9A593]">
                <li><button onClick={() => onNavigate("review-queue")} className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">Maker-Checker Review Queue</button></li>
                <li><button onClick={() => onNavigate("audit-history")} className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">WORM Cryptographic Ledger</button></li>
                <li><button onClick={() => onNavigate("simulator")} className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">What-If Counterfactual Simulator</button></li>
                <li><button onClick={() => onNavigate("time-machine")} className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">Time Machine &amp; Rollbacks</button></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-[#26251E] dark:text-white uppercase tracking-wider text-[11px] mb-4">
                Who It's For
              </p>
              <ul className="space-y-2.5 text-[#6F6C5B] dark:text-[#A9A593]">
                <li><span className="hover:text-[#26251E] dark:hover:text-white">For Brand Directors</span></li>
                <li><span className="hover:text-[#26251E] dark:hover:text-white">For Legal &amp; Compliance</span></li>
                <li><span className="hover:text-[#26251E] dark:hover:text-white">For Growth &amp; Campaign Teams</span></li>
                <li><span className="hover:text-[#26251E] dark:hover:text-white">For Enterprise Leadership</span></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-[#26251E] dark:text-white uppercase tracking-wider text-[11px] mb-4">
                Trust &amp; Verification
              </p>
              <ul className="space-y-2.5 text-[#6F6C5B] dark:text-[#A9A593]">
                <li><button onClick={() => onNavigate("settings")} className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">Multi-Tenant Isolation (0% Leakage)</button></li>
                <li><span className="hover:text-[#26251E] dark:hover:text-white">RFC 3161 Timestamping</span></li>
                <li><span className="hover:text-[#26251E] dark:hover:text-white">PyMuPDF Bounding Box Proof</span></li>
                <li><span className="hover:text-[#26251E] dark:hover:text-white">SHA-256 Merkle Verification</span></li>
              </ul>
            </div>
          </div>

          {/* GIANT WORDMARK (Exact Nudge Frame 00:10): "inkloom" in massive lowercase letters */}
          <div className="pt-8 pb-4 select-none">
            <div className="text-[15vw] sm:text-[16vw] font-black tracking-tighter text-[#26251E] dark:text-white leading-none text-center opacity-95">
              inkloom
            </div>
          </div>

          {/* Copyright & Sub-Nav */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E8E6D9] dark:border-[#2E2C26] text-xs text-[#6F6C5B] dark:text-[#A9A593]">
            <p>© 2026 Inkloom Technologies Inc. Continuous Brand Governance.</p>
            <div className="flex gap-4">
              <span className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">Terms of Service</span>
              <span>•</span>
              <span className="hover:text-[#26251E] dark:hover:text-white cursor-pointer">Security Certifications</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
