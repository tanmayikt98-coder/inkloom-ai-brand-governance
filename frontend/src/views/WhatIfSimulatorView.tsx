import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
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
  Zap,
} from "lucide-react";

export const WhatIfSimulatorView: React.FC = () => {
  const { activeBrand, canSimulate } = useAuth();
  const { addToast } = useToast();
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

  const brandId = activeBrand?.id || "brand-aurevia-001";

  const loadScenarios = async () => {
    try {
      const list = await api.simulator.listScenarios(brandId);
      setScenarios(list);
      if (list.length > 0) {
        const first = list[0];
        setSelectedScenario(first);
        // Pre-run simulation for instant report display
        try {
          const res = await api.simulator.runSimulation(first.id);
          setSimulationResult(res);
        } catch {}
      }
    } catch (err) {
      console.error("Failed loading scenarios:", err);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [brandId]);

  const handleRunSimulation = async (scenarioId: string) => {
    const start = performance.now();
    try {
      setIsRunning(true);
      const res = await api.simulator.runSimulation(scenarioId);
      setSimulationResult(res);
      const latency = performance.now() - start;
      addToast({
        type: "success",
        title: "Simulation Complete",
        message: `Projected impact: ${res.affected_assets_count} assets at risk across active brand collateral.`,
        latencyMs: latency,
      });
      await loadScenarios();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Simulation Error",
        message: err.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handlePromoteScenario = async (scenarioId: string) => {
    try {
      setIsPromoting(true);
      await api.simulator.promote(scenarioId);
      addToast({
        type: "success",
        title: "Promoted to Live Production",
        message: "Scenario approved and promoted. Production Brand Facts updated with version increments.",
      });
      await loadScenarios();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Promotion Failed",
        message: err.message,
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenTitle) return;
    try {
      let payload: Record<string, any> = {};
      if (scenType === "UPDATE_FACT_METRIC") {
        payload = { metric_value: parseFloat(metricVal) };
      } else if (scenType === "ADD_RESTRICTED_PHRASE") {
        payload = { restricted_phrase: restrictedPhrase };
      }

      await api.simulator.create(brandId, {
        title: scenTitle,
        description: scenDesc,
        change_type: scenType,
        target_entity_id: "fact-perf-001",
        proposed_payload: payload,
      });

      setShowCreateModal(false);
      setScenTitle("");
      setScenDesc("");
      addToast({
        type: "success",
        title: "Scenario Created",
        message: "New hypothetical policy change staged in isolated sandbox.",
      });
      await loadScenarios();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Creation Failed",
        message: err.message,
      });
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] dark:border-gray-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421] dark:text-gray-100">What-If Brand Simulator</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#EBF2EE] dark:bg-emerald-950/60 text-[#4A6B5B] dark:text-emerald-400 border border-[#D1E0D7] dark:border-emerald-800 rounded-full">
              Isolated Sandbox Active
            </span>
          </div>
          <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-1">
            Simulate hypothetical changes to product metrics, policy disclaimers, or retiring evidence. Re-run rules without touching production data.
          </p>
        </div>

        {canSimulate() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Scenario
          </button>
        )}
      </div>

      {/* Main Grid: Scenarios List on Left, Sandbox Simulation Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scenarios List */}
        <div className="bg-white dark:bg-[#131926] p-5 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-[#1F2421] dark:text-white">Simulated Scenarios ({scenarios.length})</h3>
          <p className="text-xs text-[#5C6460] dark:text-gray-400">Select a hypothetical policy change to execute.</p>

          <div className="space-y-2.5 mt-3 max-h-[500px] overflow-y-auto pr-1">
            {scenarios.map((s) => {
              const isSelected = selectedScenario?.id === s.id;
              const isPromoted = s.status === "PROMOTED";
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedScenario(s);
                    handleRunSimulation(s.id);
                  }}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#FAF8F5] dark:bg-[#182234] border-[#4A6B5B] dark:border-emerald-600 shadow-xs ring-1 ring-[#4A6B5B]/30"
                      : "bg-white dark:bg-[#131926] border-[#E7E2D8] dark:border-gray-800 hover:border-[#D1E0D7] dark:hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#1F2421] dark:text-white truncate max-w-[190px]">{s.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isPromoted
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300"
                          : s.status === "SIMULATED"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                          : "bg-stone-100 dark:bg-gray-800 text-stone-700 dark:text-gray-300"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C6460] dark:text-gray-400 line-clamp-2">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Sandbox Execution & Projected Impact */}
        <div className="bg-white dark:bg-[#131926] p-6 rounded-2xl border border-[#E7E2D8] dark:border-gray-800 shadow-xs lg:col-span-2 space-y-6">
          {selectedScenario ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-[#F0ECE4] dark:border-gray-800 gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#1F2421] dark:text-white">{selectedScenario.title}</h3>
                  <p className="text-xs text-[#5C6460] dark:text-gray-400 mt-0.5">{selectedScenario.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunSimulation(selectedScenario.id)}
                    disabled={isRunning}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    {isRunning ? "Simulating..." : "Run Simulation"}
                  </button>

                  {selectedScenario.status !== "PROMOTED" && (
                    <button
                      onClick={() => handlePromoteScenario(selectedScenario.id)}
                      disabled={isPromoting}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {isPromoting ? "Promoting..." : "Promote to Live"}
                    </button>
                  )}
                </div>
              </div>

              {/* Simulation Result Report */}
              {simulationResult ? (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                        Assets at Risk
                      </span>
                      <span className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                        {simulationResult.affected_assets_count}
                      </span>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">Would be invalidated if promoted</p>
                    </div>

                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider block">
                        New Violations
                      </span>
                      <span className="text-2xl font-bold text-rose-900 dark:text-rose-200">
                        +{simulationResult.net_new_violations}
                      </span>
                      <p className="text-[10px] text-rose-700 dark:text-rose-400">Contradictions introduced</p>
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                        Sandbox Isolation
                      </span>
                      <div className="flex items-center space-x-1 text-emerald-800 dark:text-emerald-300 font-bold text-sm mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Zero Production Side-Effects</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Production data untouched</p>
                    </div>
                  </div>

                  {/* Projected Asset Impact Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Projected Collateral Impact Breakdown
                    </h4>

                    <div className="space-y-2">
                      {simulationResult.affected_assets.map((item, i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-stone-50 dark:bg-[#182234] border border-stone-200 dark:border-gray-800 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-gray-900 dark:text-white">{item.asset_title}</span>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.reason}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.impact_level === "CRITICAL"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                          }`}>
                            {item.impact_level} RISK
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-gray-500 dark:text-gray-400">
                  Click 'Run Simulation' to project the impact of this policy change across all active marketing collateral.
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-xs text-gray-500 dark:text-gray-400">
              Select a scenario to inspect or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
