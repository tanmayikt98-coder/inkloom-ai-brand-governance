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
} from "lucide-react";
import { BoundingBoxViewerModal } from "../components/BoundingBoxViewerModal";

export const BrandKnowledgeHubView: React.FC = () => {
  const { activeBrand, canEditFacts, canUploadEvidence } = useAuth();
  const [activeTab, setActiveTab] = useState<"facts" | "evidence" | "rules">("facts");
  const [selectedEvidenceForModal, setSelectedEvidenceForModal] = useState<{ id: string; title: string } | null>(null);
  const [hybridQuery, setHybridQuery] = useState<string>("");
  const [hybridResults, setHybridResults] = useState<any | null>(null);
  const [hybridSearching, setHybridSearching] = useState<boolean>(false);
  const [facts, setFacts] = useState<BrandFact[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSource[]>([]);
  const [rules, setRules] = useState<BrandRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
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

  const loadData = async () => {
    if (!activeBrand) return;
    try {
      setLoading(true);
      const [factsData, evData, rulesData] = await Promise.all([
        api.facts.listByBrand(activeBrand.id),
        api.evidence.listByBrand(activeBrand.id),
        api.rules.listByBrand(activeBrand.id),
      ]);
      setFacts(factsData);
      setEvidence(evData);
      setRules(rulesData);
    } catch (err) {
      console.error("Failed to load Knowledge Hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBrand]);

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBrand || !newFactStatement) return;
    try {
      await api.facts.create(activeBrand.id, {
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
    if (!activeBrand || !evTitle) return;
    try {
      if (evUploadMode === "file" && evFile) {
        const formData = new FormData();
        formData.append("title", evTitle);
        formData.append("source_type", evType);
        formData.append("verification_status", "VERIFIED");
        formData.append("file", evFile);
        await api.evidence.uploadFile(activeBrand.id, formData);
      } else {
        await api.evidence.create(activeBrand.id, {
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
    f.claim_statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvidence = evidence.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.source_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421]">Brand Knowledge Hub</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FAF8F5] border border-[#E7E2D8] text-[#5C6460] rounded">
              Fictional Brand: {activeBrand?.name || "Aurevia"}
            </span>
          </div>
          <p className="text-xs text-[#5C6460] mt-1">
            Centralized source of brand truth, substantiated product facts, and policy rules.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {canEditFacts() && (
            <button
              onClick={() => setShowAddFactModal(true)}
              className="px-3 py-1.5 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg flex items-center shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Brand Fact
            </button>
          )}
          {canUploadEvidence() && (
            <button
              onClick={() => setShowUploadEvidenceModal(true)}
              className="px-3 py-1.5 bg-white border border-[#E7E2D8] hover:bg-[#FAF8F5] text-[#1F2421] text-xs font-semibold rounded-lg flex items-center transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-[#4A6B5B]" />
              Ingest Evidence
            </button>
          )}
        </div>
      </div>

      {/* Navigation Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-[#E7E2D8] shadow-xs">
          <button
            onClick={() => setActiveTab("facts")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "facts" ? "bg-[#4A6B5B] text-white" : "text-[#5C6460] hover:text-[#1F2421]"
            }`}
          >
            Approved Facts ({facts.length})
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "evidence" ? "bg-[#4A6B5B] text-white" : "text-[#5C6460] hover:text-[#1F2421]"
            }`}
          >
            Evidence Documents ({evidence.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "rules" ? "bg-[#4A6B5B] text-white" : "text-[#5C6460] hover:text-[#1F2421]"
            }`}
          >
            Brand Rules & Disclaimers ({rules.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#5C6460] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search claims, metrics, or sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs bg-white border border-[#E7E2D8] rounded-lg w-72 focus:outline-none focus:ring-1 focus:ring-[#4A6B5B]"
          />
        </div>
      </div>

      {/* TAB 1: BRAND FACTS */}
      {activeTab === "facts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFacts.map((fact) => {
              const isApproved = fact.status === "APPROVED";
              const isExpired = fact.status === "EXPIRED";
              return (
                <div
                  key={fact.id}
                  onClick={() => setSelectedFact(fact)}
                  className="bg-white p-5 rounded-xl border border-[#E7E2D8] hover:border-[#4A6B5B] cursor-pointer shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-[#5C6460] tracking-wider">
                        {fact.category} • v{fact.version}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isApproved
                            ? "bg-[#EBF2EE] text-[#4A6B5B]"
                            : isExpired
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {fact.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#1F2421] mb-2 leading-snug">
                      "{fact.claim_statement}"
                    </h3>
                    {fact.metric_value !== undefined && (
                      <div className="inline-flex items-center space-x-1.5 bg-[#FAF8F5] border border-[#E7E2D8] px-2.5 py-1 rounded text-xs text-[#1F2421] font-semibold my-2">
                        <span>Metric:</span>
                        <span className="text-[#4A6B5B]">
                          {fact.metric_value}
                          {fact.metric_unit || ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#F0ECE4] text-[11px] text-[#5C6460] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <FileCheck className="w-3.5 h-3.5 mr-1 text-[#4A6B5B]" />
                        {fact.evidence_sources.length} Linked Source(s)
                      </span>
                      <span className="flex items-center font-medium">
                        <Layers className="w-3.5 h-3.5 mr-1 text-[#A36B73]" />
                        {fact.dependent_asset_count} Dependent Asset(s)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: EVIDENCE SOURCES */}
      {activeTab === "evidence" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E7E2D8] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E7E2D8] text-[#5C6460]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Evidence Title</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Owner / Auditor</th>
                  <th className="py-3 px-4 font-semibold">Validity</th>
                  <th className="py-3 px-4 font-semibold">Extracted Passage</th>
                  <th className="py-3 px-4 font-semibold">Visual Grounding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4]">
                {filteredEvidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4 font-bold text-[#1F2421]">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-[#4A6B5B]" />
                        <span>{ev.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5C6460] uppercase text-[10px] font-semibold">
                      {ev.source_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.verification_status === "VERIFIED"
                            ? "bg-[#EBF2EE] text-[#4A6B5B]"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {ev.verification_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#1F2421]">{ev.responsible_owner || "Unassigned"}</td>
                    <td className="py-3 px-4 text-[#5C6460]">
                      {ev.expiration_date
                        ? `Expires: ${new Date(ev.expiration_date).toLocaleDateString()}`
                        : "Indefinite"}
                    </td>
                    <td className="py-3 px-4 text-[#5C6460] max-w-xs truncate font-mono text-[11px]">
                      {ev.document_text}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedEvidenceForModal({ id: ev.id, title: ev.title })}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-all whitespace-nowrap"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Inspect PDF Bounding Box</span>
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
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E7E2D8] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E7E2D8] text-[#5C6460]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rule Code</th>
                  <th className="py-3 px-4 font-semibold">Rule Name</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Check Pattern</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4]">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4 font-mono font-bold text-[#4A6B5B]">{r.rule_code}</td>
                    <td className="py-3 px-4 font-semibold text-[#1F2421]">{r.name}</td>
                    <td className="py-3 px-4 text-[10px] uppercase font-bold text-[#5C6460]">
                      {r.rule_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.severity === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : r.severity === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5C6460] font-mono text-[11px] max-w-xs truncate">
                      "{r.check_pattern}"
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-semibold">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fact Detail Modal */}
      {selectedFact && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E7E2D8] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
              <h3 className="text-base font-bold text-[#1F2421]">Fact Details — v{selectedFact.version}</h3>
              <button onClick={() => setSelectedFact(null)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#5C6460] uppercase">Official Brand Claim</div>
              <p className="text-sm font-bold text-[#1F2421] mt-1">"{selectedFact.claim_statement}"</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-[#FAF8F5] rounded border border-[#E7E2D8]">
                <span className="text-[#5C6460] block">Metric Value:</span>
                <span className="font-bold text-[#4A6B5B]">
                  {selectedFact.metric_value ? `${selectedFact.metric_value}${selectedFact.metric_unit || ""}` : "Qualitative"}
                </span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] rounded border border-[#E7E2D8]">
                <span className="text-[#5C6460] block">Status:</span>
                <span className="font-bold">{selectedFact.status}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-[#5C6460] uppercase mb-2">Supporting Evidence Sources</div>
              {selectedFact.evidence_sources.length > 0 ? (
                selectedFact.evidence_sources.map((ev) => (
                  <div key={ev.id} className="p-3 bg-[#EBF2EE] border border-[#D1E0D7] rounded-lg text-xs space-y-1">
                    <div className="font-bold text-[#4A6B5B]">{ev.title}</div>
                    <p className="text-[11px] text-[#223E30] font-mono leading-relaxed">{ev.document_text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-amber-700 italic">No formal evidence linked to this fact.</p>
              )}
            </div>

            <div className="pt-3 border-t border-[#F0ECE4] flex justify-end">
              <button
                onClick={() => setSelectedFact(null)}
                className="px-4 py-1.5 bg-[#4A6B5B] text-white text-xs font-semibold rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Fact Modal */}
      {showAddFactModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateFact} className="bg-white rounded-xl border border-[#E7E2D8] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#1F2421]">Add Approved Brand Fact</h3>
            <div>
              <label className="text-xs font-semibold text-[#1F2421] block mb-1">Claim Statement *</label>
              <textarea
                required
                rows={2}
                value={newFactStatement}
                onChange={(e) => setNewFactStatement(e.target.value)}
                placeholder="e.g. Aurevia reduces average processing time by 30%."
                className="w-full text-xs p-2.5 border border-[#E7E2D8] rounded-lg focus:ring-1 focus:ring-[#4A6B5B]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Metric Value</label>
                <input
                  type="number"
                  step="any"
                  value={newFactMetric}
                  onChange={(e) => setNewFactMetric(e.target.value)}
                  placeholder="30"
                  className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Unit</label>
                <input
                  type="text"
                  value={newFactUnit}
                  onChange={(e) => setNewFactUnit(e.target.value)}
                  placeholder="%"
                  className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1F2421] block mb-1">Link Supporting Evidence</label>
              <select
                multiple
                value={selectedEvidenceIds}
                onChange={(e) =>
                  setSelectedEvidenceIds(Array.from(e.target.selectedOptions, (o) => o.value))
                }
                className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg h-24"
              >
                {evidence.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.source_type})
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddFactModal(false)}
                className="px-3 py-1.5 text-xs text-[#5C6460] hover:bg-[#FAF8F5] rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg"
              >
                Save Fact
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ingest Evidence Modal */}
      {showUploadEvidenceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUploadEvidence} className="bg-white rounded-xl border border-[#E7E2D8] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#1F2421]">Ingest Evidence Document</h3>
            <div>
              <label className="text-xs font-semibold text-[#1F2421] block mb-1">Document Title *</label>
              <input
                required
                type="text"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="e.g. Core Engine Benchmark Report 2026"
                className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1F2421] block mb-1">Source Type</label>
              <select
                value={evType}
                onChange={(e) => setEvType(e.target.value as EvidenceType)}
                className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg"
              >
                <option value="BENCHMARK_REPORT">Benchmark Report</option>
                <option value="AUDIT_DOCUMENT">Audit Document</option>
                <option value="CERTIFICATION">Certification</option>
                <option value="LEGAL_OPINION">Legal Opinion</option>
                <option value="TECHNICAL_SPEC">Technical Specification</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 text-xs mb-2">
              <button
                type="button"
                onClick={() => setEvUploadMode("file")}
                className={`px-3 py-1 rounded font-semibold ${
                  evUploadMode === "file" ? "bg-[#4A6B5B] text-white" : "bg-stone-100 text-stone-700"
                }`}
              >
                Upload File (PDF / TXT)
              </button>
              <button
                type="button"
                onClick={() => setEvUploadMode("text")}
                className={`px-3 py-1 rounded font-semibold ${
                  evUploadMode === "text" ? "bg-[#4A6B5B] text-white" : "bg-stone-100 text-stone-700"
                }`}
              >
                Paste Excerpt
              </button>
            </div>

            {evUploadMode === "file" ? (
              <div className="p-4 border-2 border-dashed border-[#E7E2D8] rounded-lg text-center">
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setEvFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs"
                />
                <p className="text-[10px] text-[#5C6460] mt-1">Automatic PDF text parsing via PyMuPDF</p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Document Text Excerpt *</label>
                <textarea
                  required
                  rows={4}
                  value={evText}
                  onChange={(e) => setEvText(e.target.value)}
                  placeholder="Paste verbatim benchmark finding or audit clause..."
                  className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowUploadEvidenceModal(false)}
                className="px-3 py-1.5 text-xs text-[#5C6460] hover:bg-[#FAF8F5] rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg"
              >
                Ingest & Verify
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Round 3 Bounding Box Modal */}
      {selectedEvidenceForModal && (
        <BoundingBoxViewerModal
          evidenceId={selectedEvidenceForModal.id}
          evidenceTitle={selectedEvidenceForModal.title}
          onClose={() => setSelectedEvidenceForModal(null)}
        />
      )}
    </div>
  );
};
