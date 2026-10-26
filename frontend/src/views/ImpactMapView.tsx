import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { ImpactGraph, ImpactAnalysis, GraphNode, AffectedAssetDetail } from "../types";
import { ImpactGraphCanvas } from "../components/ImpactGraphCanvas";
import {
  Network,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  FileText,
  Activity,
} from "lucide-react";

export const ImpactMapView: React.FC = () => {
  const { activeBrand } = useAuth();
  const [graphData, setGraphData] = useState<ImpactGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const loadGraph = async () => {
    if (!activeBrand) return;
    try {
      setLoading(true);
      const graph = await api.impact.getGraph(activeBrand.id);
      setGraphData(graph);
      // Auto-select first fact node to trigger blast radius
      const firstFact = graph.nodes.find((n) => n.type === "FACT");
      if (firstFact) {
        handleSelectNode(firstFact);
      }
    } catch (err) {
      console.error("Failed loading impact graph:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [activeBrand]);

  const handleSelectNode = async (node: GraphNode) => {
    setSelectedNode(node);
    if (["FACT", "EVIDENCE", "RULE"].includes(node.type)) {
      try {
        setAnalyzing(true);
        // Extract raw UUID from node.id (format: fact_uuid or evidence_uuid)
        const rawId = node.id.replace(/^[a-z]+_/, "");
        const analysis = await api.impact.analyze(rawId, node.type);
        setImpactAnalysis(analysis);
      } catch (err) {
        console.error("Failed running impact analysis:", err);
      } finally {
        setAnalyzing(false);
      }
    } else {
      setImpactAnalysis(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421]">Brand Impact Map & Blast Radius</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EBF2EE] text-[#4A6B5B] border border-[#D1E0D7] rounded">
              Dependency Propagation Engine
            </span>
          </div>
          <p className="text-xs text-[#5C6460] mt-1">
            Navigable graph mapping ground truth facts to live marketing assets. Trace downstream blast radius when policies evolve.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2 bg-white border border-[#E7E2D8] p-1 rounded-lg text-xs">
          <button
            onClick={() => setViewMode("graph")}
            className={`px-3 py-1 rounded font-medium ${
              viewMode === "graph" ? "bg-[#4A6B5B] text-white" : "text-[#5C6460] hover:text-[#1F2421]"
            }`}
          >
            Visual Graph
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded font-medium ${
              viewMode === "list" ? "bg-[#4A6B5B] text-white" : "text-[#5C6460] hover:text-[#1F2421]"
            }`}
          >
            Searchable List
          </button>
        </div>
      </div>

      {/* GRAPH CANVAS OR LIST VIEW */}
      {viewMode === "graph" && graphData && (
        <ImpactGraphCanvas
          nodes={graphData.nodes}
          edges={graphData.edges}
          selectedNodeId={selectedNode?.id}
          onSelectNode={handleSelectNode}
        />
      )}

      {/* Selected Node Blast Radius & Affected Assets Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Entity Inspector */}
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1F2421]">Selected Knowledge Node</h3>
          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#5C6460] block">
                  {selectedNode.type} Node
                </span>
                <span className="font-bold text-[#1F2421] text-sm block mt-1">{selectedNode.label}</span>
              </div>

              {/* Blast Radius Gauge */}
              {impactAnalysis && (
                <div className="p-4 bg-[#FDF2F4] border border-[#F3D2D7] rounded-xl text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#A36B73] tracking-wider block">
                    Blast Radius Exposure
                  </span>
                  <div className="text-3xl font-extrabold text-[#1F2421]">
                    {impactAnalysis.blast_radius_score}%
                  </div>
                  <span className="text-[11px] text-[#5C6460] block">
                    {impactAnalysis.direct_affected_count} Direct • {impactAnalysis.indirect_affected_count} Indirect Affected
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#5C6460] italic">Click any node in the graph above to evaluate downstream blast radius.</p>
          )}
        </div>

        {/* Downstream Affected Collateral Table */}
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
            <div>
              <h3 className="text-sm font-bold text-[#1F2421]">Downstream Dependent Collateral</h3>
              <p className="text-xs text-[#5C6460]">
                Assets that require audit or update if this fact/rule changes.
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-[#FAF8F5] border border-[#E7E2D8] rounded text-[#5C6460]">
              {impactAnalysis?.affected_assets.length || 0} Assets At Risk
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {impactAnalysis?.affected_assets && impactAnalysis.affected_assets.length > 0 ? (
              impactAnalysis.affected_assets.map((asset) => (
                <div
                  key={asset.asset_id}
                  className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg text-xs flex items-start justify-between"
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#1F2421]">{asset.asset_title}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-stone-200 text-stone-800 rounded">
                        {asset.asset_type}
                      </span>
                    </div>
                    <p className="text-[#5C6460]">{asset.reason}</p>
                    <div className="text-[11px] text-[#4A6B5B] font-semibold">
                      Required Action: {asset.action_required}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                    {asset.impact_level} Risk
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#5C6460] italic text-center py-8">
                No active marketing collateral depends on this entity.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
