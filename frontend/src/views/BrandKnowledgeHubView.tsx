import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { BrandFact, EvidenceSource, BrandRule, FactStatus, EvidenceStatus, EvidenceType, RuleType, Severity } from "../types";
import {
  BookOpen,
  Plus,
  Upload,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Layers,
  Sparkles,
  Cpu,
  RotateCcw,
  Scale,
  Shield,
  Zap,
} from "lucide-react";
import { BoundingBoxViewerModal } from "../components/BoundingBoxViewerModal";
import { ConflictResolutionModal } from "../components/ConflictResolutionModal";
import { EvidenceConflict } from "../types";

export const BrandKnowledgeHubView: React.FC = () => {
  const { activeBrand, canEditFacts, canUploadEvidence } = useAuth();
  const [activeTab, setActiveTab] = useState<"facts" | "evidence" | "rules">("facts");
  const [selectedEvidenceForModal, setSelectedEvidenceForModal] = useState<{ id: string; title: string } | null>(null);
  const [facts, setFacts] = useState<BrandFact[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSource[]>([]);
  const [rules, setRules] = useState<BrandRule[]>([]);
  const [conflicts, setConflicts] = useState<EvidenceConflict[]>([]);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Modals & Inspection Drawer
  const [showAddFactModal, setShowAddFactModal] = useState<boolean>(false);
  const [showUploadEvidenceModal, setShowUploadEvidenceModal] = useState<boolean>(false);
  const [selectedFact, setSelectedFact] = useState<BrandFact | null>(null);

  // New Fact Form
  const [newFactStatement, setNewFactStatement] = useState("");
  const [newFactMetric, setNewFactMetric] = useState<string>("");
  const [newFactUnit, setNewFactUnit] = useState<string>("%");
  const [newFactCategory, setNewFactCategory] = useState("performance");
  const [newFactStatus, setNewFactStatus] = useState<FactStatus>("APPROVED");
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);

  // Evidence Upload Form
  const [evTitle, setEvTitle] = useState("");
  const [evType, setEvType] = useState<EvidenceType>("BENCHMARK_REPORT");
  const [evFile, setEvFile] = useState<File | null>(null);
  const [evText, setEvText] = useState("");
  const [evUploadMode, setEvUploadMode] = useState<"file" | "text">("file");

  const brandId = activeBrand?.id || "brand-aurevia-001";

  const loadData = async () => {
    try {
      setLoading(true);
      const [factsData, evData, rulesData, conflictsData] = await Promise.all([
        api.facts.listByBrand(brandId).catch(() => []),
        api.evidence.listByBrand(brandId).catch(() => []),
        api.rules.listByBrand(brandId).catch(() => []),
        api.evidence.getConflicts().catch(() => []),
      ]);
      setFacts(factsData);
      setEvidence(evData);
      setRules(rulesData);
      setConflicts(conflictsData);
      if (factsData.length > 0 && !selectedFact) {
        setSelectedFact(factsData[0]);
      }
    } catch (err) {
      console.error("Failed to load Knowledge Hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [brandId]);

  const handleSeedDataset = async () => {
    try {
      setIsResetting(true);
      await api.dashboard.resetDemoDataset();
      await loadData();
    } catch (e) {
      console.error("Failed to seed demo data:", e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactStatement) return;
    try {
      await api.facts.create(brandId, {
        claim_statement: newFactStatement,
        category: newFactCategory,
        status: newFactStatus,
        metric_value: newFactMetric ? parseFloat(newFactMetric) : undefined,
        metric_unit: newFactUnit,
        evidence_ids: selectedEvidenceIds,
      });
      setShowAddFactModal(false);
      setNewFactStatement("");
      setNewFactMetric("");
      setSelectedEvidenceIds([]);
      await loadData();
    } catch (err: any) {
      alert("Error creating fact: " + err.message);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle) return;
    try {
      if (evUploadMode === "file" && evFile) {
        const formData = new FormData();
        formData.append("title", evTitle);
        formData.append("source_type", evType);
        formData.append("verification_status", "VERIFIED");
        formData.append("file", evFile);
        await api.evidence.uploadFile(brandId, formData);
      } else {
        await api.evidence.create(brandId, {
          title: evTitle,
          source_type: evType,
          document_text: evText,
          verification_status: "VERIFIED",
        });
      }
      setShowUploadEvidenceModal(false);
      setEvTitle("");
      setEvFile(null);
      setEvText("");
      await loadData();
    } catch (err: any) {
      alert("Error adding evidence: " + err.message);
    }
  };

  const filteredFacts = facts.filter((f) =>
    (f.claim_statement || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvidence = evidence.filter((e) =>
    (e.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.source_type || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRules = rules.filter((r) =>
    (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.rule_code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E8E6D9] dark:border-[#2E2C26] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#26251E] dark:text-[#FCFDFD] tracking-tight">Brand Knowledge Hub</h1>
            <span className="px-3 py-0.5 text-[10px] font-mono font-medium bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#FCFDFD] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-full">
              {activeBrand?.name || "Aurevia"} • Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-1">
            Official repository of approved brand claims, evidentiary documents, and deterministic policy rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditFacts() && (
            <button
              onClick={() => setShowAddFactModal(true)}
              className="px-4 py-2 bg-[#26251E] hover:bg-[#3B392F] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] dark:hover:bg-[#E8E6D9] text-xs font-semibold rounded-full flex items-center shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Fact
            </button>
          )}
          {canUploadEvidence() && (
            <button
              onClick={() => setShowUploadEvidenceModal(true)}
              className="px-3.5 py-2 bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] text-[#26251E] dark:text-[#FCFDFD] text-xs font-medium rounded-full flex items-center active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-orange-500" />
              Ingest Evidence
            </button>
          )}
          <button
            onClick={() => setShowConflictModal(true)}
            className="px-3.5 py-2 bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] hover:bg-[#E8E6D9] dark:hover:bg-[#25241E] text-[#26251E] dark:text-[#FCFDFD] rounded-full text-xs font-medium flex items-center active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5" />
            Check Contradictions ({conflicts.length})
          </button>
        </div>
      </div>

      {/* Navigation Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 bg-[#F3F2EB] dark:bg-[#1C1B16] p-1 rounded-full border border-[#E8E6D9] dark:border-[#2E2C26]">
          <button
            onClick={() => setActiveTab("facts")}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
              activeTab === "facts"
                ? "bg-[#26251E] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] shadow-xs"
                : "text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-[#FCFDFD]"
            }`}
          >
            Approved Facts ({facts.length})
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
              activeTab === "evidence"
                ? "bg-[#26251E] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] shadow-xs"
                : "text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-[#FCFDFD]"
            }`}
          >
            Evidence Documents ({evidence.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
              activeTab === "rules"
                ? "bg-[#26251E] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] shadow-xs"
                : "text-[#6F6C5B] dark:text-[#A9A593] hover:text-[#26251E] dark:hover:text-[#FCFDFD]"
            }`}
          >
            Brand Rules &amp; Disclaimers ({rules.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#6F6C5B] dark:text-[#A9A593] absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search claims, metrics, or sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs bg-[#FCFDFD] dark:bg-[#181714] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-full w-72 focus:outline-none focus:ring-1 focus:ring-orange-500 text-[#26251E] dark:text-[#FCFDFD] transition-colors"
          />
        </div>
      </div>

      {/* Empty State Fallback with Instant 1-Click Re-Seed */}
      {!loading && facts.length === 0 && (
        <div className="p-12 bg-[#FCFDFD] dark:bg-[#181714] rounded-3xl border border-dashed border-[#E8E6D9] dark:border-[#2E2C26] text-center space-y-4">
          <BookOpen className="w-10 h-10 text-orange-500 mx-auto opacity-75" />
          <div>
            <h3 className="text-base font-bold text-[#26251E] dark:text-[#FCFDFD]">Knowledge Hub Needs Initialization</h3>
            <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-1 max-w-md mx-auto">
              Load the complete Aurevia brand knowledge base containing 12 substantiated facts, 8 benchmark documents, and 6 brand rules.
            </p>
          </div>
          <button
            onClick={handleSeedDataset}
            disabled={isResetting}
            className="px-4 py-2 bg-[#26251E] hover:bg-[#3B392F] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] text-xs font-semibold rounded-full shadow-xs transition-colors inline-flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>{isResetting ? "Seeding Knowledge..." : "Load Full Aurevia Dataset"}</span>
          </button>
        </div>
      )}

      {/* TAB 1: BRAND FACTS */}
      {activeTab === "facts" && facts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFacts.map((fact) => {
            const isApproved = fact.status === "APPROVED";
            const isExpired = fact.status === "EXPIRED";
            return (
              <div
                key={fact.id}
                onClick={() => setSelectedFact(fact)}
                className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] hover:border-[#C5C1AF] cursor-pointer shadow-2xs transition-all flex flex-col justify-between group active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold text-[#6F6C5B] dark:text-[#A9A593] tracking-wider">
                      {fact.category} • v{fact.version}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${
                        isApproved
                          ? "bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#3D5A4C] dark:text-emerald-300 border-[#D1E0D7] dark:border-emerald-800"
                          : isExpired
                          ? "bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-400 border-red-200 dark:border-rose-800"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {fact.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#26251E] dark:text-[#FCFDFD] mb-2 leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    "{fact.claim_statement}"
                  </h3>
                  {fact.metric_value !== undefined && (
                    <div className="inline-flex items-center space-x-1.5 bg-[#F3F2EB] dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] px-3 py-1 rounded-full text-xs text-[#26251E] dark:text-[#FCFDFD] font-semibold my-2">
                      <span className="text-[#6F6C5B] dark:text-[#A9A593] font-normal">Metric:</span>
                      <span className="text-[#26251E] dark:text-[#FCFDFD] font-bold">
                        {fact.metric_value}
                        {fact.metric_unit || ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E8E6D9] dark:border-[#2E2C26] text-[11px] text-[#6F6C5B] dark:text-[#A9A593] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileCheck className="w-3.5 h-3.5 mr-1 text-[#3D5A4C] dark:text-emerald-400" />
                      {fact.evidence_sources.length} Linked Source(s)
                    </span>
                    <span className="flex items-center font-medium text-orange-600 dark:text-orange-400">
                      <Zap className="w-3.5 h-3.5 mr-1" />
                      {fact.dependent_asset_count || 3} Dependent Assets
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: EVIDENCE DOCUMENTS */}
      {activeTab === "evidence" && evidence.length > 0 && (
        <div className="space-y-4">
          <div className="bg-[#FCFDFD] dark:bg-[#181714] rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F2EB] dark:bg-[#1C1B16] border-b border-[#E8E6D9] dark:border-[#2E2C26] text-[#6F6C5B] dark:text-[#A9A593]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Evidence Title</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Owner / Auditor</th>
                  <th className="py-3.5 px-4 font-semibold">Validity</th>
                  <th className="py-3.5 px-4 font-semibold">Extracted Passage</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Visual Grounding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6D9]/60 dark:divide-[#2E2C26]">
                {filteredEvidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#F3F2EB]/50 dark:hover:bg-[#201F1A] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#26251E] dark:text-[#FCFDFD]">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>{ev.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#6F6C5B] dark:text-[#A9A593] uppercase text-[10px] font-semibold">
                      {ev.source_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          ev.verification_status === "VERIFIED"
                            ? "bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#3D5A4C] dark:text-emerald-300 border-[#D1E0D7] dark:border-emerald-800"
                            : "bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-400 border-red-200 dark:border-rose-800"
                        }`}
                      >
                        {ev.verification_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#26251E] dark:text-[#FCFDFD]">{ev.responsible_owner || "Apex Analytics Lab"}</td>
                    <td className="py-3.5 px-4 text-[#6F6C5B] dark:text-[#A9A593]">
                      {ev.expiration_date
                        ? `Expires: ${new Date(ev.expiration_date).toLocaleDateString()}`
                        : "Active 2026-Q4"}
                    </td>
                    <td className="py-3.5 px-4 text-[#6F6C5B] dark:text-[#A9A593] max-w-xs truncate font-mono text-[11px]">
                      {ev.document_text}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEvidenceForModal({ id: ev.id, title: ev.title })}
                        className="px-3 py-1 bg-[#26251E] hover:bg-[#3B392F] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 shadow-2xs active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-orange-400" />
                        <span>Inspect Bounding Box</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BRAND RULES */}
      {activeTab === "rules" && rules.length > 0 && (
        <div className="space-y-4">
          <div className="bg-[#FCFDFD] dark:bg-[#181714] rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F2EB] dark:bg-[#1C1B16] border-b border-[#E8E6D9] dark:border-[#2E2C26] text-[#6F6C5B] dark:text-[#A9A593]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Rule Code</th>
                  <th className="py-3.5 px-4 font-semibold">Rule Name</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Severity</th>
                  <th className="py-3.5 px-4 font-semibold">Check Pattern</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6D9]/60 dark:divide-[#2E2C26]">
                {filteredRules.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F3F2EB]/50 dark:hover:bg-[#201F1A] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">{r.rule_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#26251E] dark:text-[#FCFDFD]">{r.name}</td>
                    <td className="py-3.5 px-4 text-[10px] uppercase font-bold text-[#6F6C5B] dark:text-[#A9A593]">
                      {r.rule_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          r.severity === "CRITICAL"
                            ? "bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-400 border-red-200 dark:border-rose-800"
                            : r.severity === "HIGH"
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6F6C5B] dark:text-[#A9A593] font-mono text-[11px] max-w-xs truncate">
                      "{r.check_pattern}"
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#3D5A4C] dark:text-emerald-300 rounded-full text-[10px] font-semibold border border-[#D1E0D7] dark:border-emerald-800">
                        Active Policy
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rich Fact Detail Drawer Modal */}
      {selectedFact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#FCFDFD] dark:bg-[#181714] rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E6D9] dark:border-[#2E2C26]">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <h3 className="text-base font-bold text-[#26251E] dark:text-[#FCFDFD]">
                  Brand Fact v{selectedFact.version} — Provenance Detail
                </h3>
              </div>
              <button
                onClick={() => setSelectedFact(null)}
                className="text-[#6F6C5B] hover:text-[#26251E] dark:hover:text-white p-1 rounded-full text-base"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-[10px] font-bold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider">
                Official Approved Claim Statement
              </div>
              <p className="text-sm font-bold text-[#26251E] dark:text-[#FCFDFD] mt-1 leading-snug">
                "{selectedFact.claim_statement}"
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-3.5 bg-[#F3F2EB] dark:bg-[#201F1A] rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26]">
                <span className="text-[#6F6C5B] dark:text-[#A9A593] block text-[10px] font-semibold uppercase">Metric Value</span>
                <span className="font-bold text-[#26251E] dark:text-[#FCFDFD] text-sm mt-0.5 block">
                  {selectedFact.metric_value ? `${selectedFact.metric_value}${selectedFact.metric_unit || ""}` : "Qualitative"}
                </span>
              </div>
              <div className="p-3.5 bg-[#F3F2EB] dark:bg-[#201F1A] rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26]">
                <span className="text-[#6F6C5B] dark:text-[#A9A593] block text-[10px] font-semibold uppercase">Category</span>
                <span className="font-bold text-[#26251E] dark:text-[#FCFDFD] text-xs mt-0.5 block capitalize">
                  {selectedFact.category}
                </span>
              </div>
              <div className="p-3.5 bg-[#F3F2EB] dark:bg-[#201F1A] rounded-2xl border border-[#E8E6D9] dark:border-[#2E2C26]">
                <span className="text-[#6F6C5B] dark:text-[#A9A593] block text-[10px] font-semibold uppercase">Blast Radius</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 text-xs mt-0.5 block">
                  {selectedFact.dependent_asset_count || 3} Assets at Risk
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-[#6F6C5B] dark:text-[#A9A593] uppercase tracking-wider mb-2">
                Substantiating Evidence Sources ({selectedFact.evidence_sources.length})
              </div>
              {selectedFact.evidence_sources.length > 0 ? (
                selectedFact.evidence_sources.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-[#F3F2EB] dark:bg-[#201F1A] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-2xl text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#26251E] dark:text-[#FCFDFD]">{ev.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8E6D9] dark:bg-[#2A2822] text-[#26251E] dark:text-[#FCFDFD]">
                        {ev.verification_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#26251E] dark:text-[#FCFDFD] font-mono leading-relaxed bg-[#FCFDFD] dark:bg-[#181714] p-3 rounded-xl border border-[#E8E6D9] dark:border-[#2E2C26]">
                      {ev.document_text}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[#6F6C5B] dark:text-[#A9A593]">
                        Owner: {ev.responsible_owner || "Apex Analytics Lab"}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedFact(null);
                          setSelectedEvidenceForModal({ id: ev.id, title: ev.title });
                        }}
                        className="px-3 py-1 bg-[#26251E] hover:bg-[#3B392F] text-[#FCFDFD] dark:bg-[#FCFDFD] dark:text-[#26251E] rounded-full text-[10px] font-semibold active:scale-95 transition-all shadow-xs flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-orange-400" /> View Bounding Box
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-[#F3F2EB] dark:bg-[#201F1A] rounded-2xl text-xs text-[#6F6C5B]">
                  Direct benchmark evidence link configured.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedFact(null)}
                className="px-4 py-2 bg-[#F3F2EB] dark:bg-[#201F1A] hover:bg-[#E8E6D9] text-[#26251E] dark:text-[#FCFDFD] rounded-full text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Bounding Box Modal */}
      {selectedEvidenceForModal && (
        <BoundingBoxViewerModal
          evidenceId={selectedEvidenceForModal.id}
          evidenceTitle={selectedEvidenceForModal.title}
          onClose={() => setSelectedEvidenceForModal(null)}
        />
      )}

      {/* Evidence Conflict Resolution Modal */}
      {showConflictModal && (
        <ConflictResolutionModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          conflicts={conflicts}
          onResolved={loadData}
        />
      )}
    </div>
  );
};
