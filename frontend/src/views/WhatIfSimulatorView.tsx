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
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E8E6D9] dark:border-[#2E2C26] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-[#26251E] dark:text-[#F5F4EE] tracking-tight">What-If Brand Simulator</h1>
            <span className="px-3 py-1 text-[11px] font-mono font-medium bg-[#F3F2EB] dark:bg-[#1C1B16] text-[#26251E] dark:text-[#F5F4EE] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-full inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]"></span>
              Isolated Sandbox Active
            </span>
          </div>
          <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-1 font-sans">
            Simulate hypothetical changes to product metrics, policy disclaimers, or retiring evidence. Re-run rules without touching production data.
          </p>
        </div>

        {canSimulate() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#26251E] hover:bg-[#38362B] dark:bg-white dark:hover:bg-gray-100 dark:text-[#26251E] text-white text-xs font-semibold rounded-full shadow-sm flex items-center transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5 text-[#F97316]" />
            Create Scenario
          </button>
        )}
      </div>

      {/* Main Grid: Scenarios List on Left, Sandbox Simulation Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scenarios List */}
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-[#26251E] dark:text-[#F5F4EE]">Simulated Scenarios ({scenarios.length})</h3>
          <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593]">Select a hypothetical policy change to execute.</p>

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
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#F3F2EB] dark:bg-[#1C1B16] border-[#26251E] dark:border-white shadow-xs"
                      : "bg-[#FCFDFD] dark:bg-[#181714] border-[#E8E6D9] dark:border-[#2E2C26] hover:border-[#6F6C5B]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#26251E] dark:text-[#F5F4EE] truncate max-w-[190px]">{s.title}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isPromoted
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200"
                          : s.status === "SIMULATED"
                          ? "bg-[#EBF2EE] dark:bg-emerald-950 text-[#4A6B5B] dark:text-emerald-300 border border-[#D1E0D7]"
                          : "bg-[#F3F2EB] dark:bg-gray-800 text-[#6F6C5B] dark:text-gray-300 border border-[#E8E6D9]"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593] line-clamp-2 leading-relaxed">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Sandbox Execution & Projected Impact */}
        <div className="bg-[#FCFDFD] dark:bg-[#181714] p-6 rounded-3xl border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs lg:col-span-2 space-y-6">
          {selectedScenario ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-[#E8E6D9] dark:border-[#2E2C26] gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#26251E] dark:text-[#F5F4EE]">{selectedScenario.title}</h3>
                  <p className="text-xs text-[#6F6C5B] dark:text-[#A9A593] mt-0.5">{selectedScenario.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunSimulation(selectedScenario.id)}
                    disabled={isRunning}
                    className="px-5 py-2.5 bg-[#26251E] hover:bg-[#38362B] dark:bg-white dark:hover:bg-gray-100 dark:text-[#26251E] disabled:opacity-50 text-white text-xs font-semibold rounded-full flex items-center shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5 text-[#F97316]" />
                    {isRunning ? "Simulating..." : "Run Simulation"}
                  </button>

                  {selectedScenario.status !== "PROMOTED" && (
                    <button
                      onClick={() => handlePromoteScenario(selectedScenario.id)}
                      disabled={isPromoting}
                      className="px-5 py-2.5 bg-[#F3F2EB] dark:bg-[#1C1B16] hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-50 text-[#26251E] dark:text-[#F5F4EE] text-xs font-semibold rounded-full flex items-center border border-[#E8E6D9] dark:border-[#2E2C26] shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#F97316]" />
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
                    <div className="p-5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                        Assets at Risk
                      </span>
                      <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-200">
                        {simulationResult.affected_assets_count}
                      </span>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">Would be invalidated if promoted</p>
                    </div>

                    <div className="p-5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-1">
                      <span className="text-[10px] font-mono font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider block">
                        New Violations
                      </span>
                      <span className="text-2xl font-extrabold text-rose-900 dark:text-rose-200">
                        +{simulationResult.net_new_violations}
                      </span>
                      <p className="text-[10px] text-rose-700 dark:text-rose-400">Contradictions introduced</p>
                    </div>

                    <div className="p-5 bg-[#EBF2EE] dark:bg-emerald-950/30 border border-[#D1E0D7] dark:border-emerald-900 rounded-2xl space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#4A6B5B] dark:text-emerald-400 uppercase tracking-wider block">
                        Sandbox Isolation
                      </span>
                      <div className="flex items-center space-x-1.5 text-[#26251E] dark:text-emerald-300 font-bold text-sm mt-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Zero Production Side-Effects</span>
                      </div>
                      <p className="text-[10px] text-[#6F6C5B] dark:text-emerald-400">Production data untouched</p>
                    </div>
                  </div>

                  {/* Projected Asset Impact Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#26251E] dark:text-[#F5F4EE] uppercase tracking-wider">
                      Projected Collateral Impact Breakdown
                    </h4>

                    <div className="space-y-2.5">
                      {simulationResult.affected_assets.map((item, i) => (
                        <div
                          key={i}
                          className="p-4 bg-[#F3F2EB]/50 dark:bg-[#1C1B16] border border-[#E8E6D9] dark:border-[#2E2C26] rounded-2xl flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#26251E] dark:text-[#F5F4EE]">{item.asset_title}</span>
                            <p className="text-[11px] text-[#6F6C5B] dark:text-[#A9A593]">{item.reason}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            item.impact_level === "CRITICAL"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200"
                          }`}>
                            {item.impact_level} RISK
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#6F6C5B] dark:text-[#A9A593]">
                  Click 'Run Simulation' to project the impact of this policy change across all active marketing collateral.
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#6F6C5B] dark:text-[#A9A593]">
              Select a scenario to inspect or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
