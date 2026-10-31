import React, { useState } from "react";
import { Eye, CheckCircle2, AlertTriangle, ShieldCheck, Upload, Layers, Maximize2 } from "lucide-react";

interface SampleGraphic {
  id: string;
  name: string;
  dimensions: string;
  aspectRatio: string;
  contrastRatio: number;
  contrastPass: boolean;
  clearSpaceMargin: number;
  clearSpacePass: boolean;
  distortionDetected: boolean;
  previewColor: string;
  textColor: string;
}

export const VisualInspectionStudio: React.FC = () => {
  const samples: SampleGraphic[] = [
    {
      id: "sample-hero",
      name: "Aurevia Enterprise Launch Hero Banner",
      dimensions: "1200 x 630 px",
      aspectRatio: "1.91:1 (Standard OpenGraph)",
      contrastRatio: 5.2,
      contrastPass: true,
      clearSpaceMargin: 18.0,
      clearSpacePass: true,
      distortionDetected: false,
      previewColor: "from-emerald-950 via-[#0B0F17] to-gray-900",
      textColor: "#10B981"
    },
    {
      id: "sample-social",
      name: "Social Media Square Promo Card",
      dimensions: "1080 x 1080 px",
      aspectRatio: "1:1 (Square)",
      contrastRatio: 3.4,
      contrastPass: false,
      clearSpaceMargin: 11.5,
      clearSpacePass: false,
      distortionDetected: true,
      previewColor: "from-amber-950/80 via-[#131926] to-gray-900",
      textColor: "#F59E0B"
    },
    {
      id: "sample-email",
      name: "Q2 Executive Briefing Email Header",
      dimensions: "600 x 200 px",
      aspectRatio: "3:1 (Wide Banner)",
      contrastRatio: 6.8,
      contrastPass: true,
      clearSpaceMargin: 16.5,
      clearSpacePass: true,
      distortionDetected: false,
      previewColor: "from-slate-900 via-[#182234] to-emerald-950/60",
      textColor: "#34D399"
    }
  ];

  const [selectedSample, setSelectedSample] = useState<SampleGraphic>(samples[0]);
  const [showClearSpace, setShowClearSpace] = useState(true);
  const [showContrastGrid, setShowContrastGrid] = useState(true);

  return (
    <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#131926] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Selective Visual Inspection Studio
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Logo Clear-Space &amp; Contrast
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Automated logo clear-space bounding box verification, aspect ratio distortion detection, and WCAG AA contrast audit.
          </p>
        </div>

        {/* Asset Selector */}
        <div className="flex items-center gap-2">
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSample(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedSample.id === s.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-[#182234] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#202E46]"
              }`}
            >
              {s.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Canvas and Inspection Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Display */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-[#0B0F17]/50 flex flex-col items-center justify-center">
          {/* Overlay Toggles */}
          <div className="w-full flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClearSpace}
                  onChange={(e) => setShowClearSpace(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Logo 15% Clear-Space Box
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showContrastGrid}
                  onChange={(e) => setShowContrastGrid(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Contrast Boundary Mask
              </label>
            </div>
            <span className="font-mono text-[11px] text-gray-500">{selectedSample.dimensions}</span>
          </div>

          {/* Graphic Simulator */}
          <div
            className={`w-full aspect-[16/9] max-h-72 rounded-xl bg-gradient-to-br ${selectedSample.previewColor} relative flex items-center justify-center overflow-hidden border border-gray-700 shadow-inner`}
          >
            {/* Background Grid Pattern */}
            {showContrastGrid && (
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }}
              />
            )}

            {/* Clear-Space Bounding Box */}
            <div className="relative p-6">
              {showClearSpace && (
                <div
                  className={`absolute inset-0 rounded-lg border-2 border-dashed pointer-events-none transition-all ${
                    selectedSample.clearSpacePass
                      ? "border-emerald-500/70 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      : "border-rose-500/80 bg-rose-500/15 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
                  }`}
                >
                  <span className="absolute -top-3 left-2 px-1 text-[9px] font-mono bg-black/80 rounded text-emerald-400">
                    CLEAR-SPACE {selectedSample.clearSpaceMargin}%
                  </span>
                </div>
              )}

              {/* Logo Emblem */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg font-bold text-xl tracking-tighter">
                  AV
                </div>
                <div>
                  <div className="text-lg font-bold text-white tracking-tight">AUREVIA</div>
                  <div className="text-[10px] tracking-widest text-emerald-400 font-mono">DETERMINISTIC TRUST</div>
                </div>
              </div>
            </div>

            {/* Graphic Badge */}
            <div className="absolute bottom-3 right-3 text-[10px] font-mono bg-black/60 backdrop-blur-sm text-gray-300 px-2 py-0.5 rounded border border-gray-700">
              {selectedSample.aspectRatio}
            </div>
          </div>
        </div>

        {/* Audit Findings & Telemetry */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Automated Visual Findings
          </div>

          {/* Clear-Space Check */}
          <div
            className={`p-3.5 rounded-xl border ${
              selectedSample.clearSpacePass
                ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                {selectedSample.clearSpacePass ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                Logo Clear-Space Rule
              </span>
              <span className="font-mono text-xs font-bold">
                {selectedSample.clearSpaceMargin}% (Min 15%)
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {selectedSample.clearSpacePass
                ? "Exceeds standard 15% protective exclusion boundary."
                : "Clearance margin insufficient (11.5%). Logo crowded by container boundaries."}
            </p>
          </div>

          {/* Contrast Check */}
          <div
            className={`p-3.5 rounded-xl border ${
              selectedSample.contrastPass
                ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                {selectedSample.contrastPass ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                WCAG Contrast Audit
              </span>
              <span className="font-mono text-xs font-bold">
                {selectedSample.contrastRatio}:1 (Target 4.5:1)
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {selectedSample.contrastPass
                ? "WCAG 2.1 AA Compliant contrast between logo mark and backdrop."
                : "Contrast 3.4:1 is below the required 4.5:1 threshold for regulatory disclosures."}
            </p>
          </div>

          {/* Aspect Ratio Distortion */}
          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-[#0B0F17]/40 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Distortion Check</span>
              <span
                className={`font-mono text-xs font-bold ${
                  selectedSample.distortionDetected ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {selectedSample.distortionDetected ? "DISTORTED (+4%)" : "0.0% SKEW"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Vector glyph aspect ratio matches approved master identity brand asset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

