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
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] dark:border-gray-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421] dark:text-gray-100">Brand Knowledge Hub</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400 border border-[#D1E0D7] dark:border-emerald-800 rounded-full">
              {activeBrand?.name || "Aurevia"} • Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-1">
            Official repository of approved brand claims, evidentiary documents, and deterministic policy rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditFacts() && (
            <button
              onClick={() => setShowAddFactModal(true)}
              className="px-3 py-1.5 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Fact
            </button>
          )}
          {canUploadEvidence() && (
            <button
              onClick={() => setShowUploadEvidenceModal(true)}
              className="px-3 py-1.5 bg-white dark:bg-[#182234] border border-[#E7E2D8] dark:border-gray-700 hover:bg-[#FAF8F5] dark:hover:bg-gray-800 text-[#1F2421] dark:text-gray-200 text-xs font-semibold rounded-xl flex items-center transition-colors shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              Ingest Evidence
            </button>
          )}
          <button
            onClick={() => setShowConflictModal(true)}
            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-semibold flex items-center transition-colors shadow-xs cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
            Check Contradictions ({conflicts.length})
          </button>
        </div>
      </div>

      {/* Navigation Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 bg-stone-100 dark:bg-[#182234] p-1 rounded-xl border border-stone-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("facts")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "facts"
                ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                : "text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Approved Facts ({facts.length})
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "evidence"
                ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                : "text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Evidence Documents ({evidence.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "rules"
                ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                : "text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Brand Rules &amp; Disclaimers ({rules.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search claims, metrics, or sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-[#182234] border border-[#E7E2D8] dark:border-gray-800 rounded-xl w-72 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Empty State Fallback with Instant 1-Click Re-Seed */}
      {!loading && facts.length === 0 && (
        <div className="p-12 bg-white dark:bg-[#131926] rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center space-y-4">
          <BookOpen className="w-10 h-10 text-emerald-500 mx-auto opacity-75" />
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Knowledge Hub Needs Initialization</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              Load the complete Aurevia brand knowledge base containing 12 substantiated facts, 8 benchmark documents, and 6 brand rules.
            </p>
          </div>
          <button
            onClick={handleSeedDataset}
            disabled={isResetting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
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
                className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 hover:border-[#4A6B5B] dark:hover:border-emerald-500 cursor-pointer shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-[#5C6460] dark:text-gray-400 tracking-wider">
                      {fact.category} • v{fact.version}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isApproved
                          ? "bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400"
                          : isExpired
                          ? "bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-400"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {fact.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1F2421] dark:text-white mb-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    "{fact.claim_statement}"
                  </h3>
                  {fact.metric_value !== undefined && (
                    <div className="inline-flex items-center space-x-1.5 bg-[#FAF8F5] dark:bg-[#182234] border border-[#E7E2D8] dark:border-gray-700 px-2.5 py-1 rounded-lg text-xs text-[#1F2421] dark:text-white font-semibold my-2">
                      <span className="text-gray-500 dark:text-gray-400 font-normal">Metric:</span>
                      <span className="text-[#4A6B5B] dark:text-emerald-400 font-bold">
                        {fact.metric_value}
                        {fact.metric_unit || ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F0ECE4] dark:border-gray-800 text-[11px] text-[#5C6460] dark:text-gray-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileCheck className="w-3.5 h-3.5 mr-1 text-[#4A6B5B] dark:text-emerald-400" />
                      {fact.evidence_sources.length} Linked Source(s)
                    </span>
                    <span className="flex items-center font-medium text-amber-600 dark:text-amber-400">
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
          <div className="bg-white dark:bg-[#131926] rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] dark:bg-[#182234] border-b border-[#E7E2D8] dark:border-gray-800 text-[#5C6460] dark:text-gray-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Evidence Title</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Owner / Auditor</th>
                  <th className="py-3 px-4 font-semibold">Validity</th>
                  <th className="py-3 px-4 font-semibold">Extracted Passage</th>
                  <th className="py-3 px-4 font-semibold text-right">Visual Grounding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] dark:divide-gray-800">
                {filteredEvidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#FAF8F5] dark:hover:bg-gray-800/40">
                    <td className="py-3 px-4 font-bold text-[#1F2421] dark:text-white">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{ev.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5C6460] dark:text-gray-400 uppercase text-[10px] font-semibold">
                      {ev.source_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.verification_status === "VERIFIED"
                            ? "bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400"
                            : "bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-400"
                        }`}
                      >
                        {ev.verification_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#1F2421] dark:text-gray-200">{ev.responsible_owner || "Apex Analytics Lab"}</td>
                    <td className="py-3 px-4 text-[#5C6460] dark:text-gray-400">
                      {ev.expiration_date
                        ? `Expires: ${new Date(ev.expiration_date).toLocaleDateString()}`
                        : "Active 2026-Q4"}
                    </td>
                    <td className="py-3 px-4 text-[#5C6460] dark:text-gray-400 max-w-xs truncate font-mono text-[11px]">
                      {ev.document_text}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEvidenceForModal({ id: ev.id, title: ev.title })}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 shadow-2xs transition-all whitespace-nowrap cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
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
          <div className="bg-white dark:bg-[#131926] rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] dark:bg-[#182234] border-b border-[#E7E2D8] dark:border-gray-800 text-[#5C6460] dark:text-gray-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rule Code</th>
                  <th className="py-3 px-4 font-semibold">Rule Name</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Check Pattern</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] dark:divide-gray-800">
                {filteredRules.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF8F5] dark:hover:bg-gray-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{r.rule_code}</td>
                    <td className="py-3 px-4 font-semibold text-[#1F2421] dark:text-white">{r.name}</td>
                    <td className="py-3 px-4 text-[10px] uppercase font-bold text-[#5C6460] dark:text-gray-400">
                      {r.rule_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.severity === "CRITICAL"
                            ? "bg-red-100 dark:bg-rose-950/60 text-red-800 dark:text-rose-400"
                            : r.severity === "HIGH"
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                            : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5C6460] dark:text-gray-400 font-mono text-[11px] max-w-xs truncate">
                      "{r.check_pattern}"
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-semibold border border-emerald-300 dark:border-emerald-800">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#131926] rounded-2xl border border-emerald-500/40 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4] dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-[#1F2421] dark:text-white">
                  Brand Fact v{selectedFact.version} — Provenance Detail
                </h3>
              </div>
              <button
                onClick={() => setSelectedFact(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Official Approved Claim Statement
              </div>
              <p className="text-sm font-bold text-[#1F2421] dark:text-white mt-1 leading-snug">
                "{selectedFact.claim_statement}"
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 bg-[#FAF8F5] dark:bg-[#182234] rounded-xl border border-[#E7E2D8] dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 block text-[10px] font-semibold uppercase">Metric Value</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                  {selectedFact.metric_value ? `${selectedFact.metric_value}${selectedFact.metric_unit || ""}` : "Qualitative"}
                </span>
              </div>
              <div className="p-3 bg-[#FAF8F5] dark:bg-[#182234] rounded-xl border border-[#E7E2D8] dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 block text-[10px] font-semibold uppercase">Category</span>
                <span className="font-bold text-gray-900 dark:text-white text-xs mt-0.5 block capitalize">
                  {selectedFact.category}
                </span>
              </div>
              <div className="p-3 bg-[#FAF8F5] dark:bg-[#182234] rounded-xl border border-[#E7E2D8] dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 block text-[10px] font-semibold uppercase">Blast Radius</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-xs mt-0.5 block">
                  {selectedFact.dependent_asset_count || 3} Assets at Risk
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Substantiating Evidence Sources ({selectedFact.evidence_sources.length})
              </div>
              {selectedFact.evidence_sources.length > 0 ? (
                selectedFact.evidence_sources.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">{ev.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                        {ev.verification_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 font-mono leading-relaxed bg-white/70 dark:bg-black/30 p-2 rounded">
                      {ev.document_text}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Owner: {ev.responsible_owner || "Apex Analytics Lab"}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedFact(null);
                          setSelectedEvidenceForModal({ id: ev.id, title: ev.title });
                        }}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> View Visual Bounding Box
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-stone-50 dark:bg-gray-800 rounded-xl text-xs text-stone-500">
                  Direct benchmark evidence link configured.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedFact(null)}
                className="px-4 py-2 bg-stone-100 dark:bg-gray-800 hover:bg-stone-200 dark:hover:bg-gray-700 text-stone-800 dark:text-white rounded-xl text-xs font-semibold cursor-pointer"
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
