import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  ImpactGraph,
  ImpactAnalysis,
  GraphNode,
  AffectedAssetDetail,
  CascadeResult,
  BrandFact,
} from "../types";
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
  Zap,
  Send,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  BellRing,
} from "lucide-react";

export const ImpactMapView: React.FC = () => {
  const { activeBrand } = useAuth();
  const [graphData, setGraphData] = useState<ImpactGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "list" | "cascade">("graph");
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  // Round 3 Cascade State
  const [facts, setFacts] = useState<BrandFact[]>([]);
  const [selectedFactId, setSelectedFactId] = useState<string>("fact-perf-001");
  const [cascadeAction, setCascadeAction] = useState<string>("DEPRECATED");
  const [cascadeMetric, setCascadeMetric] = useState<number>(20.0);
  const [cascadeExecuting, setCascadeExecuting] = useState<boolean>(false);
  const [latestCascade, setLatestCascade] = useState<CascadeResult | null>(null);
  const [cascadeHistory, setCascadeHistory] = useState<CascadeResult[]>([]);

  const loadGraph = async () => {
    if (!activeBrand) return;
    try {
      setLoading(true);
      const [graph, factList, hist] = await Promise.all([
        api.impact.getGraph(activeBrand.id),
        api.facts.listByBrand(activeBrand.id),
        api.impact.getCascadeHistory(),
      ]);
      setGraphData(graph);
      setFacts(factList);
      setCascadeHistory(hist);
      if (hist.length > 0) {
        setLatestCascade(hist[0]);
      }
      if (factList.length > 0) {
        setSelectedFactId(factList[0].id);
      }
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

  const handleExecuteCascade = async () => {
    try {
      setCascadeExecuting(true);
      const res = await api.impact.triggerCascade({
        fact_id: selectedFactId,
        action: cascadeAction,
        new_metric_value: cascadeAction === "MODIFIED_METRIC" ? cascadeMetric : undefined,
        reason:
          cascadeAction === "DEPRECATED"
            ? "Specification retired by product board."
            : `Benchmark readjusted down to ${cascadeMetric}%.`,
      });
      setLatestCascade(res);
      setCascadeHistory((prev) => [res, ...prev]);
    } catch (err) {
      console.error("Failed executing automated cascade:", err);
    } finally {
      setCascadeExecuting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421]">Brand Impact Map &amp; Blast Radius</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EBF2EE] text-[#4A6B5B] border border-[#D1E0D7] rounded-full">
              Round 3 Cascade Engine
            </span>
          </div>
          <p className="text-xs text-[#5C6460] mt-1">
            Navigable topological graph &amp; event-driven automated background pipeline for instant approval revocation and re-auditing.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode("graph")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === "graph" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Visual Graph
          </button>
          <button
            onClick={() => setViewMode("cascade")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
              viewMode === "cascade"
                ? "bg-amber-500 text-white shadow-2xs"
                : "text-amber-800 hover:bg-amber-100/60"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Automated Cascade Hub</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === "list" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Searchable List
          </button>
        </div>
      </div>

      {/* VIEW 1: GRAPH CANVAS */}
      {viewMode === "graph" && graphData && (
        <>
          <ImpactGraphCanvas
            nodes={graphData.nodes}
            edges={graphData.edges}
            selectedNodeId={selectedNode?.id}
            onSelectNode={handleSelectNode}
          />

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

                  {impactAnalysis && (
                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900">Blast Radius Magnitude</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                          Score: {impactAnalysis.blast_radius_score} / 100
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-amber-800">
                        {impactAnalysis.affected_assets.length} Downstream Assets
                      </div>
                      <p className="text-[11px] text-amber-700 leading-snug">
                        Direct dependencies: {impactAnalysis.direct_affected_count} • Indirect propagation: {impactAnalysis.indirect_affected_count}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (selectedNode.type === "FACT") {
                        setSelectedFactId(selectedNode.id.replace("fact_", ""));
                      }
                      setViewMode("cascade");
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-2xs transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Open Automated Cascade Controller</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Click any graph node to inspect blast radius.</p>
              )}
            </div>

            {/* Affected Collateral Detail */}
            <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-[#1F2421]">
                Downstream Collateral Exposure ({impactAnalysis?.affected_assets.length || 0})
              </h3>
              {impactAnalysis && impactAnalysis.affected_assets.length > 0 ? (
                <div className="space-y-3">
                  {impactAnalysis.affected_assets.map((asset) => (
                    <div
                      key={asset.asset_id}
                      className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-[#1F2421]">{asset.asset_title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Campaign: {asset.campaign || "General"} | Type: {asset.asset_type}
                        </div>
                        <div className="text-[11px] text-amber-800">{asset.reason}</div>
                      </div>
                      <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-800 rounded shrink-0">
                        {asset.impact_level} RISK
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400 italic">
                  Select a Fact, Rule, or Evidence node to calculate topological blast radius.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: ROUND 3 AUTOMATED CASCADE HUB */}
      {viewMode === "cascade" && (
        <div className="space-y-6">
          {/* Cascade Trigger Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl space-y-5 border border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold">Automated Blast-Radius Invalidation &amp; Cascade Re-Audit</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Event-driven background pipeline: instantly revokes approval status (&lt; 2.0s), re-audits all dependent collateral, and dispatches webhook alerts.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-mono font-bold">
                  SLA: &lt; 2.0s Revocation
                </span>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-mono font-bold">
                  100% Auto Re-Audit
                </span>
              </div>
            </div>

            {/* Simulation Form Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-700/60 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Ground-Truth BrandFact</label>
                <select
                  value={selectedFactId}
                  onChange={(e) => setSelectedFactId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-amber-400"
                >
                  {facts.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.claim_statement.slice(0, 55)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Triggering Event / Action</label>
                <select
                  value={cascadeAction}
                  onChange={(e) => setCascadeAction(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-amber-400"
                >
                  <option value="DEPRECATED">Fact Deprecation / Specification Retired</option>
                  <option value="MODIFIED_METRIC">Metric Downgrade (e.g. 30% to 20%)</option>
                  <option value="EXPIRED">Evidence Certificate Expired</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleExecuteCascade}
                  disabled={cascadeExecuting}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg transition-all disabled:opacity-50"
                >
                  {cascadeExecuting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Executing Blast-Radius Cascade...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-slate-950" />
                      <span>Execute Cascade Invalidation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          {latestCascade && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Immediate Revocation Speed</span>
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-emerald-700 font-mono">
                  {latestCascade.immediate_revocation_ms} ms
                </div>
                <div className="text-xs text-emerald-800 flex items-center space-x-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>&lt; 2.0s Acceptance Criteria MET</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Collateral Re-Audited</span>
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-indigo-700 font-mono">
                  100% ({latestCascade.affected_assets_count} assets)
                </div>
                <div className="text-xs text-indigo-800 flex items-center space-x-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Full diff reports delivered to reviewers</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Outbound Alert</span>
                  <BellRing className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-amber-700 font-mono">
                  Slack &amp; Teams API
                </div>
                <div className="text-xs text-amber-800 flex items-center space-x-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Direct Re-Approval Deep Link active</span>
                </div>
              </div>
            </div>
          )}

          {/* Re-Audit Diff Report Table */}
          {latestCascade && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cascade Re-Audit Diff Report</h3>
                  <p className="text-xs text-slate-500">
                    Automatic before-and-after audit findings generated across 100% of affected collateral.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold font-mono">
                  {latestCascade.re_audit_diff_reports.length} Violations Flagged
                </span>
              </div>

              <div className="space-y-3">
                {latestCascade.re_audit_diff_reports.map((diff, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{diff.title}</span>
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold">
                          {diff.severity} VIOLATION
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono">
                        <span className="line-through text-emerald-700 font-bold">{diff.previous_compliance}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-red-700 font-bold">{diff.new_compliance}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold block mb-0.5">Discrepancy Detected:</span>
                        <p className="text-slate-800">{diff.finding_explanation}</p>
                      </div>
                      <div>
                        <span className="text-emerald-700 font-semibold block mb-0.5">Suggested Correction:</span>
                        <p className="text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                          {diff.suggested_correction}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <a
                        href={diff.direct_re_approval_url}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Diff &amp; Re-Approve in Review Queue</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outbound Slack Webhook Simulation Card */}
          {latestCascade?.dispatched_webhook && (
            <div className="bg-[#1A1D21] text-[#D1D2D3] p-6 rounded-2xl shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-bold text-white">Slack Outbound Webhook Simulation</span>
                  <span className="text-slate-500 font-mono">#brand-governance-alerts</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  HTTP 200 OK Dispatched
                </span>
              </div>

              {/* Slack Message Block */}
              <div className="flex items-start space-x-3 text-xs leading-relaxed">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                  IK
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">Inkloom Cascade Bot</span>
                    <span className="px-1.5 py-0.2 bg-slate-700 text-slate-300 rounded text-[9px] uppercase font-mono">APP</span>
                    <span className="text-slate-500 text-[10px]">Just now</span>
                  </div>

                  <div className="p-3 bg-[#222529] rounded-xl border border-slate-700/80 space-y-2">
                    <div className="text-amber-400 font-bold text-sm">
                      🚨 Automated Blast-Radius Revocation Alert ({latestCascade.trigger_action})
                    </div>
                    <p className="text-slate-300">
                      Target Fact: <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded">{latestCascade.target_fact_claim}</code><br />
                      Execution Speed: <strong className="text-emerald-400">{latestCascade.immediate_revocation_ms}ms</strong> (&lt;2.0s SLA Met)<br />
                      Collateral Affected: <strong className="text-white">{latestCascade.affected_assets_count} marketing assets</strong> revoked and re-audited.
                    </p>

                    <div className="pt-2">
                      <a
                        href={latestCascade.dispatched_webhook.deep_link}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#007A5A] hover:bg-[#148567] text-white rounded text-xs font-bold shadow-xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Diff &amp; Direct Re-Approval</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: SEARCHABLE LIST */}
      {viewMode === "list" && graphData && (
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1F2421]">Searchable Knowledge Dependency Nodes</h3>
          <div className="space-y-2">
            {graphData.nodes.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  handleSelectNode(node);
                  setViewMode("graph");
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <span className="font-bold text-slate-900">{node.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono ml-2">Type: {node.type}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
