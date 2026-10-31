import React, { useState, useMemo } from "react";
import { GraphNode, GraphEdge, EntityType } from "../types";
import { ZoomIn, ZoomOut, RotateCcw, Filter, Move } from "lucide-react";

interface ImpactGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string | null;
  onSelectNode: (node: GraphNode) => void;
}

const NODE_COLORS: Record<EntityType, { bg: string; darkBg: string; border: string; darkBorder: string; text: string; darkText: string }> = {
  FACT: { bg: "#EBF2EE", darkBg: "#064e3b", border: "#10B981", darkBorder: "#059669", text: "#064e3b", darkText: "#a7f3d0" },
  EVIDENCE: { bg: "#EFF6FF", darkBg: "#1e3a8a", border: "#3B82F6", darkBorder: "#2563eb", text: "#1e3a8a", darkText: "#bfdbfe" },
  RULE: { bg: "#FAF5FF", darkBg: "#581c87", border: "#A855F7", darkBorder: "#9333ea", text: "#581c87", darkText: "#e9d5ff" },
  ASSET: { bg: "#FDF2F4", darkBg: "#881337", border: "#F43F5E", darkBorder: "#e11d48", text: "#881337", darkText: "#fecdd3" },
  CLAIM: { bg: "#FEF7EE", darkBg: "#78350f", border: "#F59E0B", darkBorder: "#d97706", text: "#78350f", darkText: "#fde68a" },
  FINDING: { bg: "#FEF2F2", darkBg: "#7f1d1d", border: "#EF4444", darkBorder: "#dc2626", text: "#7f1d1d", darkText: "#fecaca" },
  DECISION: { bg: "#F0FDF4", darkBg: "#14532d", border: "#22C55E", darkBorder: "#16a34a", text: "#14532d", darkText: "#bbf7d0" },
};

export const ImpactGraphCanvas: React.FC<ImpactGraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}) => {
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState<string>("ALL");

  // Layout positions deterministically in distinct vertical tier columns
  const { positions, maxX, maxY } = useMemo(() => {
    const columns: Record<EntityType, number> = {
      EVIDENCE: 100,
      FACT: 380,
      RULE: 380,
      CLAIM: 680,
      ASSET: 960,
      FINDING: 1240,
      DECISION: 1240,
    };

    const typeCounters: Record<string, number> = {};
    const posMap: Record<string, { x: number; y: number }> = {};

    nodes.forEach((node) => {
      const colX = columns[node.type] || 380;
      typeCounters[node.type] = (typeCounters[node.type] || 0) + 1;
      const rowY = 50 + typeCounters[node.type] * 85 + (node.type === "RULE" ? 220 : 0);
      posMap[node.id] = { x: colX, y: rowY };
    });

    const calculatedMaxY = Math.max(
      ...Object.values(posMap).map((p) => p.y),
      700
    ) + 120;

    return {
      positions: posMap,
      maxX: 1250,
      maxY: calculatedMaxY,
    };
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (filterType === "ALL") return nodes;
    return nodes.filter((n) => n.type === filterType);
  }, [nodes, filterType]);

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  return (
    <div className="relative w-full h-[580px] bg-[#FAF8F5] dark:bg-[#0B0F17] border border-[#E7E2D8] dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col shadow-xs transition-colors">
      {/* Graph Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 bg-white/95 dark:bg-[#131926]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E7E2D8] dark:border-gray-700 shadow-md text-xs">
        <div className="flex items-center space-x-1 border-r border-[#E7E2D8] dark:border-gray-700 pr-2">
          <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-transparent border-0 text-gray-900 dark:text-white focus:ring-0 font-medium cursor-pointer"
          >
            <option value="ALL">All Nodes ({nodes.length})</option>
            <option value="FACT">Facts ({nodes.filter(n => n.type === "FACT").length})</option>
            <option value="EVIDENCE">Evidence ({nodes.filter(n => n.type === "EVIDENCE").length})</option>
            <option value="RULE">Rules ({nodes.filter(n => n.type === "RULE").length})</option>
            <option value="ASSET">Assets ({nodes.filter(n => n.type === "ASSET").length})</option>
            <option value="CLAIM">Claims ({nodes.filter(n => n.type === "CLAIM").length})</option>
          </select>
        </div>

        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300 cursor-pointer"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Graph Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 bg-white/95 dark:bg-[#131926]/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#E7E2D8] dark:border-gray-700 shadow-md text-[10px]">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center space-x-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border"
              style={{ backgroundColor: color.bg, borderColor: color.border }}
            />
            <span className="font-semibold text-gray-700 dark:text-gray-300">{type}</span>
          </div>
        ))}
      </div>

      {/* Interactive SVG Canvas */}
      <div className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing p-4">
        <svg
          width={maxX * zoom}
          height={maxY * zoom}
          viewBox={`0 0 ${maxX} ${maxY}`}
          className="transition-transform duration-100"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
            </marker>
          </defs>

          {/* Render Directed Edges */}
          {edges.map((edge) => {
            const src = positions[edge.source];
            const tgt = positions[edge.target];
            if (!src || !tgt) return null;
            if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return null;

            const isSelected = selectedNodeId === edge.source || selectedNodeId === edge.target;

            // Smooth cubic bezier curve between node centers
            const midX = (src.x + tgt.x) / 2;
            const pathData = `M ${src.x + 80} ${src.y + 18} C ${midX} ${src.y + 18}, ${midX} ${tgt.y + 18}, ${tgt.x - 10} ${tgt.y + 18}`;

            return (
              <g key={edge.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? "#10B981" : "#94a3b840"}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  strokeDasharray={edge.is_confirmed ? "none" : "4 4"}
                  markerEnd={isSelected ? "url(#arrow-active)" : "url(#arrow)"}
                />
                <text
                  x={midX}
                  y={(src.y + tgt.y) / 2 - 4}
                  fill={isSelected ? "#10B981" : "#64748B"}
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="select-none pointer-events-none"
                >
                  {edge.relation}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {filteredNodes.map((node) => {
            const pos = positions[node.id] || { x: 100, y: 100 };
            const isSelected = selectedNodeId === node.id;
            const colors = NODE_COLORS[node.type] || { bg: "#FFFFFF", darkBg: "#182234", border: "#CCC", darkBorder: "#444", text: "#000", darkText: "#FFF" };

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x - 70}, ${pos.y - 12})`}
                onClick={() => onSelectNode(node)}
                className="cursor-pointer group"
              >
                {/* Node Box */}
                <rect
                  width="180"
                  height="44"
                  rx="10"
                  fill={colors.bg}
                  stroke={isSelected ? "#10B981" : colors.border}
                  strokeWidth={isSelected ? "2.5" : "1"}
                  className="transition-all filter drop-shadow-sm group-hover:brightness-95"
                />

                {/* Node Type Pill */}
                <rect
                  x="6"
                  y="6"
                  width="54"
                  height="14"
                  rx="4"
                  fill={isSelected ? "#10B981" : colors.border}
                  opacity="0.9"
                />
                <text
                  x="33"
                  y="16"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="select-none font-mono"
                >
                  {node.type}
                </text>

                {/* Status Indicator */}
                {node.status && (
                  <circle
                    cx="168"
                    cy="13"
                    r="4"
                    fill={node.status === "APPROVED" || node.status === "VERIFIED" ? "#10B981" : node.status === "EXPIRED" ? "#EF4444" : "#F59E0B"}
                  />
                )}

                {/* Node Label Text */}
                <text
                  x="8"
                  y="32"
                  fill={colors.text}
                  fontSize="10"
                  fontWeight="bold"
                  className="select-none truncate font-sans"
                >
                  {node.label.length > 25 ? `${node.label.substring(0, 24)}...` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
