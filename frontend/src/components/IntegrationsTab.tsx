import React, { useState } from "react";
import { GitPullRequest, Palette, MessageSquare, Play, CheckCircle2, ShieldAlert, Code2, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { IntegrationSimulation } from "../types";
import { useToast } from "../context/ToastContext";

export const IntegrationsTab: React.FC = () => {
  const { addToast } = useToast();
  const [platform, setPlatform] = useState<"github" | "figma" | "slack">("github");
  const [assetScenario, setAssetScenario] = useState<"non_compliant" | "compliant">("non_compliant");
  const [simulation, setSimulation] = useState<IntegrationSimulation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const assetId = assetScenario === "non_compliant" ? "asset-landing-001" : "asset-social-002";
      const result = await api.dashboard.simulateIntegration(platform, assetId);
      setSimulation(result);
      const latency = performance.now() - start;
      addToast({
        type: result.governance_decision === "APPROVED" ? "success" : "error",
        title: `${result.platform} Webhook Processed`,
        message: result.summary_message,
        latencyMs: latency
      });
    } catch (e: any) {
      addToast({
        type: "error",
        title: "Simulation Failed",
        message: e.message || "Failed to trigger webhook simulation"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#131926] shadow-sm space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          Enterprise Integration Webhooks &amp; CI/CD Gates
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            ACTIVE WEBHOOK DISPATCHER
          </span>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Automated governance gates for developer pull requests, Figma design token checks, and real-time compliance alerting.
        </p>
      </div>

      {/* Simulator Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0B0F17]/50">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Platform Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#182234] border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium">
            <button
              onClick={() => setPlatform("github")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                platform === "github"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              GitHub PR Check
            </button>
            <button
              onClick={() => setPlatform("figma")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                platform === "figma"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Figma Tokens
            </button>
            <button
              onClick={() => setPlatform("slack")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                platform === "slack"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Slack Alerts
            </button>
          </div>

          {/* Test Scenario */}
          {platform === "github" && (
            <select
              value={assetScenario}
              onChange={(e) => setAssetScenario(e.target.value as any)}
              className="bg-white dark:bg-[#182234] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-lg px-3 py-2"
            >
              <option value="non_compliant">Test: Unsubstantiated Claim (50% vs 30% Benchmark)</option>
              <option value="compliant">Test: Verified Copy (30% Benchmark + Disclaimer)</option>
            </select>
          )}
        </div>

        {/* Trigger Button */}
        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/20 transition-all"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          Trigger Webhook Event
        </button>
      </div>

      {/* Simulation Result Presentation */}
      {simulation ? (
        <div className="space-y-4">
          {/* Decision Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              simulation.governance_decision === "APPROVED"
                ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100"
                : "border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100"
            }`}
          >
            <div className="flex items-center gap-3">
              {simulation.governance_decision === "APPROVED" ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-rose-600/20 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider block">
                  Governance Gate Decision: {simulation.governance_decision}
                </span>
                <p className="text-xs font-medium mt-0.5">{simulation.summary_message}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-black/20 text-gray-400">
              {simulation.simulation_id}
            </span>
          </div>

          {/* Raw Webhook JSON Payload */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-[#0B0F17] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#131926] border-b border-gray-800 text-xs text-gray-400">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                Dispatched Webhook Payload (JSON)
              </span>
              <span className="font-mono text-[10px] text-gray-500">200 OK Response</span>
            </div>
            <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-64 leading-relaxed">
              {JSON.stringify(simulation.raw_payload, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
          Select an integration platform above and click <strong>"Trigger Webhook Event"</strong> to simulate automated gate execution.
        </div>
      )}
    </div>
  );
};
