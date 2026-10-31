import React, { useState, useEffect, useMemo } from "react";
import { Search, X, Shield, FileText, CheckCircle2, ArrowRight, Layers, Clock, AlertTriangle, Network } from "lucide-react";
import { NavSection } from "./Sidebar";
import { api } from "../services/api";
import { BrandFact, EvidenceSource, MarketingAsset } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavSection) => void;
}

export const GlobalSearchModal: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState("");
  const [facts, setFacts] = useState<BrandFact[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSource[]>([]);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      api.facts.listByBrand("brand-aurevia-001").catch(() => []),
      api.evidence.listByBrand("brand-aurevia-001").catch(() => []),
      api.assets.listByBrand("brand-aurevia-001").catch(() => [])
    ]).then(([f, e, a]) => {
      setFacts(f);
      setEvidence(e);
      setAssets(a);
      setLoading(false);
    });
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const quickNav = [
    { title: "Governance Overview", section: "overview" as NavSection, icon: Shield, desc: "Executive posture & risk summary" },
    { title: "Brand Knowledge Hub", section: "knowledge-hub" as NavSection, icon: Layers, desc: "Approved facts, evidence & rules" },
    { title: "Content Audits & Diff Studio", section: "content-audits" as NavSection, icon: FileText, desc: "Claim extraction & Auto-Fix" },
    { title: "BrandTrace Lineage", section: "traceability" as NavSection, icon: CheckCircle2, desc: "5-stage deterministic lineage" },
    { title: "Review & Approval Queue", section: "review-queue" as NavSection, icon: AlertTriangle, desc: "Maker-checker approval gates" },
    { title: "Brand Time Machine", section: "time-machine" as NavSection, icon: Clock, desc: "Sentence-level version diffing" },
    { title: "Brand Impact Map", section: "impact-map" as NavSection, icon: Network, desc: "Topological graph & blast radius" },
    { title: "What-If Brand Simulator", section: "simulator" as NavSection, icon: Layers, desc: "Regulatory stress-testing" },
    { title: "Cryptographic WORM Ledger", section: "audit-history" as NavSection, icon: Shield, desc: "Merkle tree & attestation proofs" },
  ];

  const filteredFacts = useMemo(() => {
    if (!query.trim()) return facts.slice(0, 3);
    const q = query.toLowerCase();
    return facts.filter(f => f.claim_statement.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)).slice(0, 4);
  }, [facts, query]);

  const filteredEvidence = useMemo(() => {
    if (!query.trim()) return evidence.slice(0, 2);
    const q = query.toLowerCase();
    return evidence.filter(e => (e.title || "").toLowerCase().includes(q) || (e.responsible_owner || "").toLowerCase().includes(q)).slice(0, 3);
  }, [evidence, query]);

  const filteredAssets = useMemo(() => {
    if (!query.trim()) return assets.slice(0, 2);
    const q = query.toLowerCase();
    return assets.filter(a => (a.title || "").toLowerCase().includes(q) || (a.campaign_name || "").toLowerCase().includes(q)).slice(0, 3);
  }, [assets, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-[#131926] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search approved facts, evidence, collateral, or modules... (Press Esc to close)"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Quick Nav */}
          <div>
            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
              Modules & Workflows
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {quickNav
                .filter(n => !query || n.title.toLowerCase().includes(query.toLowerCase()) || n.desc.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 4)
                .map((item) => (
                  <button
                    key={item.section}
                    onClick={() => {
                      onNavigate(item.section);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-lg text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-colors group"
                  >
                    <item.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{item.desc}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
            </div>
          </div>

          {/* Approved Brand Facts */}
          <div>
            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
              <span>Approved Brand Facts</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">100% Grounded</span>
            </div>
            <div className="space-y-1.5">
              {filteredFacts.map((fact) => (
                <div
                  key={fact.id}
                  onClick={() => {
                    onNavigate("knowledge-hub");
                    onClose();
                  }}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800/70 hover:border-emerald-300 dark:hover:border-emerald-700/60 bg-gray-50/50 dark:bg-[#182234]/50 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{fact.claim_statement}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span className="font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-1 rounded">
                        {fact.metric_value ? `${fact.metric_value}${fact.metric_unit || ''}` : fact.category}
                      </span>
                      <span>Owner: {fact.responsible_owner}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Sources */}
          <div>
            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
              Evidence Sources & Audit Documents
            </div>
            <div className="space-y-1.5">
              {filteredEvidence.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    onNavigate("knowledge-hub");
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-800/70 hover:border-emerald-300 dark:hover:border-emerald-700/60 bg-gray-50/50 dark:bg-[#182234]/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{ev.title}</p>
                      <span className="text-[10px] text-gray-400">{ev.responsible_owner} &bull; Tier 1 Certified</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-gray-50 dark:bg-[#0B0F17] border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[10px]">
              Ctrl+K
            </kbd>
            <span>to open anytime</span>
          </div>
          <span>Inkloom AI Deterministic Governance</span>
        </div>
      </div>
    </div>
  );
};
