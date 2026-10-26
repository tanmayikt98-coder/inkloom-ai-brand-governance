import React, { useState, useMemo } from "react";
import { GraphNode, GraphEdge, EntityType } from "../types";
import { ZoomIn, ZoomOut, RotateCcw, Filter } from "lucide-react";

interface ImpactGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string | null;
  onSelectNode: (node: GraphNode) => void;
}

const NODE_COLORS: Record<EntityType, { bg: string; border: string; text: string }> = {
  FACT: { bg: "#EBF2EE", border: "#4A6B5B", text: "#223E30" },
  EVIDENCE: { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" },
  RULE: { bg: "#FAF5FF", border: "#A855F7", text: "#6B21A8" },
  ASSET: { bg: "#FDF2F4", border: "#A36B73", text: "#612A32" },
  CLAIM: { bg: "#FEF7EE", border: "#F59E0B", text: "#92400E" },
  FINDING: { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" },
  DECISION: { bg: "#F0FDF4", border: "#22C55E", text: "#166534" },
};

export const ImpactGraphCanvas: React.FC<ImpactGraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}) => {
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState<string>("ALL");

  // Layout positions deterministically in columns based on EntityType
  const layout = useMemo(() => {
    const columns: Record<EntityType, number> = {
      EVIDENCE: 80,
      FACT: 280,
      CLAIM: 480,
      ASSET: 680,
      RULE: 480,
      FINDING: 880,
      DECISION: 880,
    };

    const typeCounters: Record<string, number> = {};
    const positions: Record<string, { x: number; y: number }> = {};

    nodes.forEach((node) => {
      const colX = columns[node.type] || 300;
      typeCounters[node.type] = (typeCounters[node.type] || 0) + 1;
      const rowY = 60 + typeCounters[node.type] * 80 + (node.type === "RULE" ? 220 : 0);
      positions[node.id] = { x: colX, y: rowY };
    });

    return positions;
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (filterType === "ALL") return nodes;
    return nodes.filter((n) => n.type === filterType);
  }, [nodes, filterType]);

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  return (
    <div className="relative w-full h-[520px] bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl overflow-hidden flex flex-col">
      {/* Graph Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-[#E7E2D8] shadow-xs text-xs">
        <div className="flex items-center space-x-1 border-r border-[#E7E2D8] pr-2">
          <Filter className="w-3.5 h-3.5 text-[#5C6460]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-transparent border-0 text-[#1F2421] focus:ring-0 font-medium"
          >
            <option value="ALL">All Entities ({nodes.length})</option>
            <option value="FACT">Facts Only</option>
            <option value="EVIDENCE">Evidence Only</option>
            <option value="RULE">Rules Only</option>
            <option value="ASSET">Assets Only</option>
            <option value="CLAIM">Claims Only</option>
          </select>
        </div>

        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))}
          className="p-1 hover:bg-[#FAF8F5] rounded text-[#5C6460]"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
          className="p-1 hover:bg-[#FAF8F5] rounded text-[#5C6460]"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1 hover:bg-[#FAF8F5] rounded text-[#5C6460]"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Graph Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 bg-white/95 backdrop-blur px-3 py-2 rounded-lg border border-[#E7E2D8] shadow-xs text-[10px]">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center space-x-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border"
              style={{ backgroundColor: color.bg, borderColor: color.border }}
            />
            <span className="font-medium text-[#5C6460]">{type}</span>
          </div>
        ))}
      </div>

      {/* Interactive SVG Canvas */}
      <div className="w-full h-full overflow-auto">
        <svg
          width={1100 * zoom}
          height={650 * zoom}
          viewBox="0 0 1100 650"
          className="transition-transform duration-150"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
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
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#8C9B93" />
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
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4A6B5B" />
            </marker>
          </defs>

          {/* Render Directed Edges */}
          {edges.map((edge) => {
            const src = layout[edge.source];
            const tgt = layout[edge.target];
            if (!src || !tgt) return null;
            if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return null;

            const isSelected = selectedNodeId === edge.source || selectedNodeId === edge.target;

            // Bezier curve between nodes
            const midX = (src.x + tgt.x) / 2;
            const pathData = `M ${src.x + 60} ${src.y + 15} C ${midX} ${src.y + 15}, ${midX} ${tgt.y + 15}, ${tgt.x - 10} ${tgt.y + 15}`;

            return (
              <g key={edge.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? "#4A6B5B" : "#D1DDD6"}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  strokeDasharray={edge.is_confirmed ? "none" : "4 4"}
                  markerEnd={isSelected ? "url(#arrow-active)" : "url(#arrow)"}
                />
                <text
                  x={midX}
                  y={(src.y + tgt.y) / 2}
                  fill="#7A8780"
                  fontSize="9"
                  textAnchor="middle"
                  className="select-none"
                >
                  {edge.relation}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {filteredNodes.map((node) => {
            const pos = layout[node.id] || { x: 100, y: 100 };
            const isSelected = selectedNodeId === node.id;
            const colors = NODE_COLORS[node.type] || { bg: "#FFFFFF", border: "#CCC", text: "#000" };

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x - 70}, ${pos.y - 10})`}
                onClick={() => onSelectNode(node)}
                className="cursor-pointer group"
              >
                <rect
                  width="150"
                  height="48"
                  rx="8"
                  fill={colors.bg}
                  stroke={isSelected ? "#1F2421" : colors.border}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="transition-all group-hover:filter group-hover:brightness-95 drop-shadow-xs"
                />
                <text
                  x="12"
                  y="18"
                  fill={colors.text}
                  fontSize="9"
                  fontWeight="bold"
                  className="uppercase tracking-wider select-none"
                >
                  {node.type} {node.status ? `• ${node.status}` : ""}
                </text>
                <text
                  x="12"
                  y="34"
                  fill="#1F2421"
                  fontSize="11"
                  fontWeight="600"
                  className="select-none truncate"
                  style={{ maxWidth: "125px" }}
                >
                  {node.label.length > 20 ? node.label.slice(0, 20) + "..." : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
