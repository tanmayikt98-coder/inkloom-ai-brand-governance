import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { WhatIfScenario, ScenarioSimulationResult, ScenarioChangeType } from "../types";
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Plus,
} from "lucide-react";

export const WhatIfSimulatorView: React.FC = () => {
  const { activeBrand, canSimulate } = useAuth();
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<WhatIfScenario | null>(null);
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Scenario Form
  const [scenTitle, setScenTitle] = useState("");
  const [scenDesc, setScenDesc] = useState("");
  const [scenType, setScenType] = useState<ScenarioChangeType>("UPDATE_FACT_METRIC");
  const [metricVal, setMetricVal] = useState("20.0");
  const [restrictedPhrase, setRestrictedPhrase] = useState("guaranteed");

  const loadScenarios = async () => {
    if (!activeBrand) return;
    try {
      const list = await api.simulator.listScenarios(activeBrand.id);
      setScenarios(list);
      if (list.length > 0 && !selectedScenario) {
        setSelectedScenario(list[0]);
      }
    } catch (err) {
      console.error("Failed loading scenarios:", err);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [activeBrand]);

  const handleRunSimulation = async (scenarioId: string) => {
    try {
      setIsRunning(true);
      const res = await api.simulator.runSimulation(scenarioId);
      setSimulationResult(res);
      await loadScenarios();
    } catch (err: any) {
      alert("Simulation failed: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handlePromoteScenario = async (scenarioId: string) => {
    if (!confirm("Promote this simulated scenario to LIVE PRODUCTION? This will update approved Brand Facts/Rules with version increments.")) {
      return;
    }
    try {
      setIsPromoting(true);
      await api.simulator.promote(scenarioId);
      alert("Scenario successfully promoted to live production! Production facts/rules updated.");
      await loadScenarios();
    } catch (err: any) {
      alert("Promotion failed: " + err.message);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBrand || !scenTitle) return;
    try {
      const payload: Record<string, any> = {};
      if (scenType === "UPDATE_FACT_METRIC") {
        payload["metric_value"] = parseFloat(metricVal);
        payload["unit"] = "%";
      } else if (scenType === "ADD_RESTRICTED_PHRASE") {
        payload["restricted_phrase"] = restrictedPhrase;
      }

      await api.simulator.create(activeBrand.id, {
        title: scenTitle,
        description: scenDesc,
        change_type: scenType,
        target_entity_id: "fact-perf-001", // Default target for demo
        proposed_payload: payload,
      });

      setShowCreateModal(false);
      setScenTitle("");
      setScenDesc("");
      await loadScenarios();
    } catch (err: any) {
      alert("Failed creating scenario: " + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421]">What-If Brand Simulator</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FAF8F5] border border-[#E7E2D8] text-[#5C6460] rounded">
              Isolated Proposed Sandbox
            </span>
          </div>
          <p className="text-xs text-[#5C6460] mt-1">
            Simulate hypothetical changes to product metrics, policy disclaimers, or expiring evidence. Re-run rules without touching production data.
          </p>
        </div>

        {canSimulate() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Scenario
          </button>
        )}
      </div>

      {/* Main Grid: Scenarios List on Left, Sandbox Simulation Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scenarios List */}
        <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-[#1F2421]">Simulated Scenarios</h3>
          <p className="text-xs text-[#5C6460]">Select a hypothetical policy change to execute.</p>

          <div className="space-y-2.5 mt-3">
            {scenarios.map((s) => {
              const isSelected = selectedScenario?.id === s.id;
              const isPromoted = s.status === "PROMOTED";
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedScenario(s);
                    setSimulationResult(null);
                  }}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#FAF8F5] border-[#4A6B5B] shadow-xs"
                      : "bg-white border-[#E7E2D8] hover:border-[#D1E0D7]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#1F2421] truncate max-w-[190px]">{s.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isPromoted
                          ? "bg-purple-100 text-purple-800"
                          : s.status === "SIMULATED"
                          ? "bg-[#EBF2EE] text-[#4A6B5B]"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C6460] line-clamp-2">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Sandbox Execution & Projected Impact */}
        <div className="bg-white p-6 rounded-xl border border-[#E7E2D8] shadow-xs lg:col-span-2 space-y-6">
          {selectedScenario ? (
            <>
              <div className="flex items-start justify-between pb-4 border-b border-[#F0ECE4]">
                <div>
                  <h3 className="text-base font-bold text-[#1F2421]">{selectedScenario.title}</h3>
                  <p className="text-xs text-[#5C6460] mt-0.5">{selectedScenario.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunSimulation(selectedScenario.id)}
                    disabled={isRunning}
                    className="px-3.5 py-1.5 bg-[#4A6B5B] hover:bg-[#3D5A4C] disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center shadow-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    {isRunning ? "Simulating..." : "Run Simulation"}
                  </button>

                  {selectedScenario.status === "SIMULATED" && (
                    <button
                      onClick={() => handlePromoteScenario(selectedScenario.id)}
                      disabled={isPromoting}
                      className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {isPromoting ? "Promoting..." : "Promote to Live Production"}
                    </button>
                  )}
                </div>
              </div>

              {/* Simulation Output Cards */}
              {simulationResult ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-[#5C6460] block">
                        Net-New Violations
                      </span>
                      <span className="text-2xl font-extrabold text-red-600 block mt-1">
                        +{simulationResult.net_new_violations}
                      </span>
                    </div>

                    <div className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-[#5C6460] block">
                        Affected Assets
                      </span>
                      <span className="text-2xl font-extrabold text-[#1F2421] block mt-1">
                        {simulationResult.affected_assets_count}
                      </span>
                    </div>

                    <div className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-[#5C6460] block">
                        Total Non-Compliant
                      </span>
                      <span className="text-2xl font-extrabold text-amber-600 block mt-1">
                        {simulationResult.projected_non_compliant_assets}
                      </span>
                    </div>
                  </div>

                  {/* Narrative Assessment */}
                  <div className="p-4 bg-[#EBF2EE] border border-[#D1E0D7] rounded-xl text-xs space-y-1">
                    <span className="font-bold text-[#4A6B5B] block">Qualitative Governance Impact:</span>
                    <p className="text-[#223E30] leading-relaxed">{simulationResult.risk_summary}</p>
                  </div>

                  {/* Affected Assets Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-[#1F2421] mb-2">Projected Non-Compliant Collateral:</h4>
                    <div className="space-y-2">
                      {simulationResult.affected_assets.map((asset) => (
                        <div
                          key={asset.asset_id}
                          className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-[#1F2421] block">{asset.asset_title}</span>
                            <span className="text-[11px] text-[#5C6460]">{asset.reason}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded">
                            Requires Revision
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#5C6460] space-y-2">
                  <FlaskConical className="w-8 h-8 text-[#5C6460] mx-auto opacity-40" />
                  <p>Click "Run Simulation" above to evaluate how this proposed change cascades across all active collateral.</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#5C6460]">Select a scenario to inspect.</div>
          )}
        </div>
      </div>

      {/* Create Scenario Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateScenario} className="bg-white rounded-xl border border-[#E7E2D8] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#1F2421]">Create What-If Scenario</h3>
            <div>
              <label className="text-xs font-semibold text-[#1F2421] block mb-1">Scenario Title *</label>
              <input
                required
                type="text"
                value={scenTitle}
                onChange={(e) => setScenTitle(e.target.value)}
                placeholder="e.g. Q4 Re-benchmarking Performance Reduction"
                className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1F2421] block mb-1">Change Type</label>
              <select
                value={scenType}
                onChange={(e) => setScenType(e.target.value as ScenarioChangeType)}
                className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg"
              >
                <option value="UPDATE_FACT_METRIC">Update Fact Metric (e.g. 30% to 20%)</option>
                <option value="EXPIRE_EVIDENCE">Simulate Expiring Evidence Source</option>
                <option value="ADD_RESTRICTED_PHRASE">Add Restricted Brand Phrase</option>
                <option value="ADD_MANDATORY_DISCLAIMER">Add Mandatory Policy Disclaimer</option>
                <option value="RETIRE_FACT">Retire / Supersede Fact</option>
              </select>
            </div>

            {scenType === "UPDATE_FACT_METRIC" && (
              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Proposed Metric Value (%)</label>
                <input
                  type="number"
                  value={metricVal}
                  onChange={(e) => setMetricVal(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg"
                />
              </div>
            )}

            {scenType === "ADD_RESTRICTED_PHRASE" && (
              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Restricted Phrase</label>
                <input
                  type="text"
                  value={restrictedPhrase}
                  onChange={(e) => setRestrictedPhrase(e.target.value)}
                  placeholder="e.g. guaranteed, unbeatable"
                  className="w-full text-xs p-2 border border-[#E7E2D8] rounded-lg"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs text-[#5C6460] hover:bg-[#FAF8F5] rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#4A6B5B] hover:bg-[#3D5A4C] text-white text-xs font-semibold rounded-lg"
              >
                Save Scenario
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
