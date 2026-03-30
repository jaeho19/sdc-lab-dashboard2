"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { useTheme } from "next-themes";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X } from "lucide-react";
import {
  NODES,
  LINKS,
  NODE_COLORS,
  NODE_LABELS,
  type MapNode,
  type MapLink,
  type NodeType,
  type StudentProfile,
} from "./research-map-data";
import { usePapers } from "@/hooks/use-papers";

// ─── Types for D3 simulation ───
interface SimNode extends MapNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends Omit<MapLink, "source" | "target"> {
  source: SimNode | string;
  target: SimNode | string;
}

type ViewMode = "all" | "urban" | "rural" | "bridge" | "conf";

const VIEW_OPTIONS: { mode: ViewMode; label: string }[] = [
  { mode: "all", label: "All Connections" },
  { mode: "urban", label: "Urban Context (도시)" },
  { mode: "rural", label: "Rural Context (농촌)" },
  { mode: "conf", label: "Conference Matching" },
  { mode: "bridge", label: "Shared Methods" },
];

const NODE_TYPE_BADGES: { type: NodeType; label: string }[] = [
  { type: "student", label: "학생" },
  { type: "theme", label: "연구주제" },
  { type: "project", label: "프로젝트" },
  { type: "conference", label: "학회" },
  { type: "method", label: "방법론" },
  { type: "tech", label: "기술/도구" },
  { type: "axis", label: "연구축" },
  { type: "paper", label: "논문" },
];

const LEGEND_ITEMS: { type: NodeType; label: string }[] = [
  { type: "student", label: "학생 (Student)" },
  { type: "theme", label: "연구주제 (Research Topic)" },
  { type: "project", label: "프로젝트 (Project)" },
  { type: "conference", label: "학회 (Conference)" },
  { type: "method", label: "방법론 (Method)" },
  { type: "tech", label: "기술/도구 (Tech/Tools)" },
  { type: "axis", label: "연구축 (Research Axis)" },
  { type: "paper", label: "논문 (Paper)" },
];

// ─── Helper: get id from node or string ───
function nodeId(n: SimNode | string): string {
  return typeof n === "object" ? n.id : n;
}

// ─── Helper: get connections for a node ───
function getConnections(
  nodeIdVal: string,
  links: SimLink[],
  nodes: SimNode[]
): (SimNode & { linkType: string })[] {
  const connIds: { id: string; lt: string }[] = [];
  for (const l of links) {
    const s = nodeId(l.source);
    const t = nodeId(l.target);
    if (s === nodeIdVal && t !== nodeIdVal) connIds.push({ id: t, lt: l.type });
    if (t === nodeIdVal && s !== nodeIdVal) connIds.push({ id: s, lt: l.type });
  }
  const seen = new Set<string>();
  return connIds
    .filter((x) => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    })
    .map((x) => {
      const n = nodes.find((y) => y.id === x.id);
      return n ? { ...n, linkType: x.lt } : null;
    })
    .filter(Boolean) as (SimNode & { linkType: string })[];
}

// ─── Helper: compute view-mode visible node set ───
function computeViewModeVisible(
  viewMode: ViewMode,
  nodes: SimNode[],
  links: SimLink[]
): Set<string> {
  if (viewMode === "all") return new Set(nodes.map((n) => n.id));

  if (viewMode === "urban" || viewMode === "rural") {
    // Axis node + students in this axis
    const seeds = new Set<string>([viewMode]);
    for (const n of nodes) {
      if (n.axes?.includes(viewMode)) seeds.add(n.id);
    }
    // Expand 1-hop from seeds (don't cascade)
    const vis = new Set(seeds);
    for (const l of links) {
      const s = nodeId(l.source);
      const t = nodeId(l.target);
      if (seeds.has(s)) vis.add(t);
      if (seeds.has(t)) vis.add(s);
    }
    return vis;
  }

  if (viewMode === "conf") {
    // Conference nodes + all direct connections
    const seeds = new Set<string>();
    for (const n of nodes) {
      if (n.type === "conference") seeds.add(n.id);
    }
    const vis = new Set(seeds);
    for (const l of links) {
      const s = nodeId(l.source);
      const t = nodeId(l.target);
      if (seeds.has(s)) vis.add(t);
      if (seeds.has(t)) vis.add(s);
    }
    return vis;
  }

  if (viewMode === "bridge") {
    // Method + tech nodes + students connected to them
    const seeds = new Set<string>();
    for (const n of nodes) {
      if (n.type === "method" || n.type === "tech") seeds.add(n.id);
    }
    const vis = new Set(seeds);
    for (const l of links) {
      const s = nodeId(l.source);
      const t = nodeId(l.target);
      if (seeds.has(s)) {
        const tn = nodes.find((x) => x.id === t);
        if (tn && tn.type === "student") vis.add(t);
      }
      if (seeds.has(t)) {
        const sn = nodes.find((x) => x.id === s);
        if (sn && sn.type === "student") vis.add(s);
      }
    }
    return vis;
  }

  return new Set(nodes.map((n) => n.id));
}

// ─── Helper: original link properties ───
function origLinkOpacity(d: SimLink): number {
  return d.type === "kk" ? 0.06 : d.type === "collab" ? 0.4 : 0.15;
}
function origLinkWidth(d: SimLink): number {
  return d.type === "kk" ? 1 : d.type === "collab" ? 2 : 1.2;
}

// ─── Unified visual state ───
function applyVisualState(
  nodeEls: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>,
  linkEls: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
  nodes: SimNode[],
  links: SimLink[],
  viewMode: ViewMode,
  disabledTypes: Set<NodeType>,
  selectedNodeId: string | null,
  duration: number = 300
) {
  // Layer 1: View Mode
  const viewVisible = computeViewModeVisible(viewMode, nodes, links);

  // Layer 2: Node Type filter (remove disabled types from visible set)
  const typeVisible = new Set<string>();
  for (const id of viewVisible) {
    const n = nodes.find((x) => x.id === id);
    if (n && !disabledTypes.has(n.type)) typeVisible.add(id);
  }

  // Layer 3: Node selection (1-hop from selected, within typeVisible)
  const effectiveSelectedId =
    selectedNodeId && typeVisible.has(selectedNodeId) ? selectedNodeId : null;

  let finalNodeVisible: Set<string>;
  if (effectiveSelectedId) {
    const neighborhood = new Set<string>([effectiveSelectedId]);
    for (const l of links) {
      const s = nodeId(l.source);
      const t = nodeId(l.target);
      if (s === effectiveSelectedId && typeVisible.has(t)) neighborhood.add(t);
      if (t === effectiveSelectedId && typeVisible.has(s)) neighborhood.add(s);
    }
    finalNodeVisible = neighborhood;
  } else {
    finalNodeVisible = typeVisible;
  }

  const hasDimming =
    viewMode !== "all" || disabledTypes.size > 0 || effectiveSelectedId !== null;

  // ── Apply to nodes ──
  nodeEls.each(function (d: SimNode) {
    const isVisible = finalNodeVisible.has(d.id);
    const g = d3.select(this);
    g.classed("rm-sel", d.id === effectiveSelectedId);
    g.select("circle")
      .transition()
      .duration(duration)
      .attr("opacity", isVisible ? 1 : 0.08);
    g.select("text")
      .transition()
      .duration(duration)
      .attr("opacity", isVisible ? 1 : 0.05);
  });

  // ── Apply to links ──
  linkEls.each(function (d: SimLink) {
    const sId = nodeId(d.source);
    const tId = nodeId(d.target);
    const bothVisible = finalNodeVisible.has(sId) && finalNodeVisible.has(tId);
    const connectsSelected =
      effectiveSelectedId !== null &&
      (sId === effectiveSelectedId || tId === effectiveSelectedId);

    const origOp = origLinkOpacity(d);
    const origW = origLinkWidth(d);

    let targetOpacity: number;
    let targetWidth: number;

    if (!bothVisible) {
      targetOpacity = 0.04;
      targetWidth = origW;
    } else if (effectiveSelectedId && connectsSelected) {
      targetOpacity = Math.max(origOp * 3, 0.35);
      targetWidth = origW + 0.5;
    } else if (hasDimming && !effectiveSelectedId) {
      targetOpacity = origOp;
      targetWidth = origW + 0.5;
    } else {
      targetOpacity = origOp;
      targetWidth = origW;
    }

    d3.select(this)
      .transition()
      .duration(duration)
      .attr("stroke-opacity", targetOpacity)
      .attr("stroke-width", targetWidth);
  });
}

// ════════════════════════════════════════════════════════
// ─── Main Component ───
// ════════════════════════════════════════════════════════

export function ResearchMapGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [showPrompt, setShowPrompt] = useState(true);
  const [disabledTypes, setDisabledTypes] = useState<Set<NodeType>>(new Set());
  const [showPapers, setShowPapers] = useState(false);

  // DB paper nodes
  const { data: paperMapData } = usePapers({ enabled: true });

  // Ref for D3 callbacks to read latest selection without stale closures
  const selectedNodeRef = useRef<string | null>(null);
  selectedNodeRef.current = selectedNode?.id ?? null;

  // ─── D3 initialization ───
  useEffect(() => {
    const svgEl = svgRef.current;
    const container = containerRef.current;
    if (!svgEl || !container) return;

    d3.select(svgEl).selectAll("*").remove();

    const W = container.clientWidth;
    const H = container.clientHeight;

    const svg = d3.select(svgEl).attr("width", W).attr("height", H);
    const g = svg.append("g");

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    // Glow filters
    const defs = svg.append("defs");
    for (const [key] of Object.entries(NODE_COLORS)) {
      const filter = defs.append("filter").attr("id", `glow-${key}`);
      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", 3)
        .attr("result", "blur");
      const merge = filter.append("feMerge");
      merge.append("feMergeNode").attr("in", "blur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    }

    // Clone data for D3 mutation — merge static + DB paper nodes
    const nodes: SimNode[] = NODES.map((n) => ({ ...n }));
    const links: SimLink[] = LINKS.map((l) => ({ ...l }));

    if (showPapers && paperMapData) {
      const existingIds = new Set(nodes.map((n) => n.id));
      for (const pn of paperMapData.nodes) {
        if (!existingIds.has(pn.id)) {
          nodes.push({ ...pn, axes: undefined, actions: undefined, student: undefined });
        }
      }
      for (const pl of paperMapData.links) {
        const srcExists = nodes.some((n) => n.id === pl.source);
        const tgtExists = nodes.some((n) => n.id === pl.target);
        if (srcExists && tgtExists) {
          links.push({ ...pl });
        }
      }
    }

    nodesRef.current = nodes;
    linksRef.current = links;

    // Simulation
    const sim = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) => {
            if (d.type === "kk") return 60;
            if (d.type === "collab") return 70;
            const s = nodes.find((x) => x.id === nodeId(d.source));
            const t = nodes.find((x) => x.id === nodeId(d.target));
            if (!s || !t) return 100;
            if (s.type === "paper" || t.type === "paper") return 50;
            if (s.type === "axis" || t.type === "axis") return 200;
            if (s.type === "student" !== (t.type === "student")) return 100;
            return 130;
          })
      )
      .force(
        "charge",
        d3.forceManyBody<SimNode>().strength((d) => {
          if (d.type === "axis") return -900;
          if (d.type === "paper") return -150;
          if (
            d.type === "student" ||
            d.type === "project" ||
            d.type === "conference"
          )
            return -400;
          return -200;
        })
      )
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force(
        "collision",
        d3.forceCollide<SimNode>().radius((d) => d.size + 10)
      )
      .force("x", d3.forceX(W / 2).strength(0.02))
      .force("y", d3.forceY(H / 2).strength(0.02));

    simRef.current = sim;

    // Links
    const linkG = g.append("g");
    const linkEls = linkG
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links)
      .enter()
      .append("line")
      .attr("class", (d) =>
        d.type === "kk" ? "rm-link rm-link-kk" : "rm-link"
      )
      .attr("stroke", (d) => {
        if (d.type === "kk") return "#ffffff";
        if (d.type === "collab") return NODE_COLORS.student;
        const tn = nodes.find((x) => x.id === nodeId(d.target));
        return tn ? NODE_COLORS[tn.type] : "#1a2040";
      })
      .attr("stroke-width", (d) => origLinkWidth(d))
      .attr("stroke-opacity", (d) => origLinkOpacity(d))
      .attr("stroke-dasharray", (d) =>
        d.type === "kk" ? "2,4" : d.type === "collab" ? "5,3" : null
      );

    // Nodes
    const nodeG = g.append("g");
    let dragMoved = false;
    const nodeEls = nodeG
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "rm-node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (e, d) => {
            dragMoved = false;
            if (!e.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (e, d) => {
            dragMoved = true;
            d.fx = e.x;
            d.fy = e.y;
          })
          .on("end", (e, d) => {
            if (!e.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            if (!dragMoved) {
              e.sourceEvent?.stopPropagation();
              tooltip.style("opacity", 0);
              setShowPrompt(false);
              // Toggle: re-clicking same node clears selection
              if (selectedNodeRef.current === d.id) {
                setSelectedNode(null);
              } else {
                setSelectedNode({ ...d });
              }
            }
          })
      );

    nodeEls
      .append("circle")
      .attr("r", (d) => d.size)
      .attr("fill", (d) => {
        if (d.type === "axis") return NODE_COLORS[d.type] + "30";
        if (d.type === "paper") return NODE_COLORS[d.type] + "88";
        return NODE_COLORS[d.type] + "cc";
      })
      .attr("stroke", (d) => NODE_COLORS[d.type])
      .attr("stroke-width", (d) => (d.type === "axis" ? 2 : 1.5))
      .attr("stroke-opacity", (d) => (d.type === "axis" ? 0.5 : d.type === "paper" ? 0.5 : 0.7))
      .attr("stroke-dasharray", (d) => (d.type === "paper" ? "3,2" : null));

    nodeEls
      .append("text")
      .attr("dy", (d) => d.size + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", (d) =>
        d.type === "student" ? "11px" : d.type === "axis" ? "12px" : "9.5px"
      )
      .attr("fill", "#8898b8")
      .attr("font-weight", 500)
      .attr("font-family", "var(--font-paperlogy), 'Pretendard', sans-serif")
      .style("pointer-events", "none")
      .style("text-shadow", "0 0 8px #06081a, 0 0 16px #06081a")
      .text((d) => d.label);

    // Tooltip
    const tooltip = d3
      .select(container)
      .append("div")
      .attr("class", "rm-tooltip")
      .style("position", "absolute")
      .style("padding", "10px 14px")
      .style("background", "rgba(8,10,26,0.97)")
      .style("border", "1px solid rgba(60,80,140,0.3)")
      .style("border-radius", "8px")
      .style("font-size", "0.74rem")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("transition", "opacity 0.1s")
      .style("z-index", "100")
      .style("max-width", "300px")
      .style("color", "#8898b8")
      .style("box-shadow", "0 8px 32px rgba(0,0,0,0.6)")
      .style("backdrop-filter", "blur(8px)");

    nodeEls
      .on("mouseover", (e, d) => {
        const rect = container.getBoundingClientRect();
        tooltip
          .style("opacity", 1)
          .html(
            `<b style="color:#d0d8f0">${d.label}</b>
             <div style="font-size:0.6rem;letter-spacing:1px;text-transform:uppercase;margin-top:1px;color:${NODE_COLORS[d.type]}">${NODE_LABELS[d.type]}</div>
             <div style="margin-top:3px">${d.desc || ""}</div>`
          )
          .style("left", e.clientX - rect.left + 14 + "px")
          .style("top", e.clientY - rect.top - 10 + "px");
      })
      .on("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        tooltip
          .style("left", e.clientX - rect.left + 14 + "px")
          .style("top", e.clientY - rect.top - 10 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // Background click to clear selection
    g.insert("rect", ":first-child")
      .attr("width", W * 10)
      .attr("height", H * 10)
      .attr("x", -W * 5)
      .attr("y", -H * 5)
      .attr("fill", "transparent")
      .style("cursor", "default")
      .on("click", () => {
        setSelectedNode(null);
      });

    // Tick
    sim.on("tick", () => {
      linkEls
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      nodeEls.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Initial zoom
    setTimeout(() => {
      svg
        .transition()
        .duration(700)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(W * 0.05, H * 0.05).scale(0.8)
        );
    }, 400);

    // Store refs for effects to use
    (svgEl as any).__rm = { nodeEls, linkEls, nodes, links };

    // Keyboard
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedNode(null);
      }
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      sim.stop();
      tooltip.remove();
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, showPapers, paperMapData]);

  // ─── Unified visual state effect ───
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !(svgEl as any).__rm) return;
    const { nodeEls, linkEls, nodes, links } = (svgEl as any).__rm;

    // If selected node's type got disabled, clear selection
    if (selectedNode && disabledTypes.has(selectedNode.type)) {
      setSelectedNode(null);
      return;
    }

    applyVisualState(
      nodeEls,
      linkEls,
      nodes,
      links,
      viewMode,
      disabledTypes,
      selectedNode?.id ?? null
    );
  }, [viewMode, disabledTypes, selectedNode]);

  // ─── View mode change handler ───
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setSelectedNode(null);
    setViewMode(mode);
  }, []);

  // ─── Toggle node type (multi-select) ───
  const handleToggleNodeType = useCallback((type: NodeType) => {
    setDisabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // ─── Click node from detail panel ───
  const handleDetailNodeClick = useCallback((id: string) => {
    const svgEl = svgRef.current;
    if (!svgEl || !(svgEl as any).__rm) return;
    const { nodes } = (svgEl as any).__rm;
    const node = nodes.find((n: SimNode) => n.id === id);
    if (!node) return;
    setSelectedNode({ ...node });
  }, []);

  // ─── Selected node connections ───
  const connections = selectedNode
    ? getConnections(selectedNode.id, linksRef.current, nodesRef.current)
    : [];

  const connectionsByType: Record<
    string,
    (SimNode & { linkType: string })[]
  > = {};
  for (const conn of connections) {
    let key = NODE_LABELS[conn.type] || conn.type;
    if (conn.linkType === "kk") key = "관련 키워드";
    if (!connectionsByType[key]) connectionsByType[key] = [];
    connectionsByType[key].push(conn);
  }

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div
      className="relative flex overflow-hidden rounded-lg"
      style={{
        height: "calc(100vh - 160px)",
        minHeight: 500,
        background: "#0a0e2a",
        fontFamily:
          "var(--font-paperlogy), 'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      {/* ── Left Sidebar ── */}
      <div
        className="relative z-10 flex shrink-0 flex-col overflow-y-auto"
        style={{
          width: 300,
          borderRight: "1px solid rgba(60,80,140,0.2)",
          background:
            "linear-gradient(180deg, #0c1030 0%, #080c22 100%)",
        }}
      >
        {/* Title */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid rgba(60,80,140,0.15)",
          }}
        >
          <h2 className="text-lg font-bold" style={{ color: "#a0c0ff" }}>
            SDC Lab Research Map
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "#3a4a6a" }}>
            Spatial Data Community Lab | 2026
          </p>
        </div>

        {/* View Mode */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(60,80,140,0.15)",
          }}
        >
          <p
            className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px]"
            style={{ color: "#4a5a7a" }}
          >
            View Mode
          </p>
          <div className="flex flex-col gap-1">
            {VIEW_OPTIONS.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                className="w-full rounded-md px-3 py-2 text-left text-[13px] font-medium transition-all"
                style={{
                  background:
                    viewMode === mode
                      ? "rgba(40,60,120,0.4)"
                      : "rgba(20,25,60,0.4)",
                  border: `1px solid ${
                    viewMode === mode
                      ? "rgba(80,120,200,0.4)"
                      : "rgba(40,50,90,0.3)"
                  }`,
                  color: viewMode === mode ? "#7eb8ff" : "#5a6a90",
                  boxShadow:
                    viewMode === mode
                      ? "0 0 12px rgba(80,120,200,0.1)"
                      : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Node Types — multi-toggle filter */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(60,80,140,0.15)",
          }}
        >
          <p
            className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px]"
            style={{ color: "#4a5a7a" }}
          >
            Node Types
          </p>
          <div className="flex flex-wrap gap-1.5">
            {NODE_TYPE_BADGES.map(({ type, label }) => {
              const isEnabled = !disabledTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => handleToggleNodeType(type)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    cursor: "pointer",
                    color: isEnabled ? NODE_COLORS[type] : NODE_COLORS[type] + "40",
                    border: `1.5px solid ${
                      isEnabled ? NODE_COLORS[type] + "80" : "rgba(40,50,80,0.3)"
                    }`,
                    background: isEnabled
                      ? `${NODE_COLORS[type]}15`
                      : "rgba(15,20,40,0.5)",
                    boxShadow: isEnabled
                      ? `0 0 8px ${NODE_COLORS[type]}15`
                      : "none",
                    opacity: isEnabled ? 1 : 0.5,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Paper Toggle */}
        <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(60,80,140,0.15)" }}>
          <button
            onClick={() => setShowPapers((prev) => !prev)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-all"
            style={{
              background: showPapers ? "rgba(245,166,35,0.15)" : "rgba(20,25,60,0.4)",
              border: `1px solid ${showPapers ? "rgba(245,166,35,0.4)" : "rgba(40,50,90,0.3)"}`,
              color: showPapers ? "#f5a623" : "#5a6a90",
            }}
          >
            <span style={{ fontSize: "14px" }}>📄</span>
            Papers {showPapers ? "ON" : "OFF"}
            {paperMapData && (
              <span className="ml-auto text-[11px]" style={{ color: showPapers ? "#f5a623" : "#3a4a6a" }}>
                {paperMapData.nodes.length}
              </span>
            )}
          </button>
        </div>

        {/* Legend — interactive, synced with Node Types */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(60,80,140,0.15)",
          }}
        >
          <p
            className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px]"
            style={{ color: "#4a5a7a" }}
          >
            Legend
          </p>
          <div className="flex flex-col gap-1.5">
            {LEGEND_ITEMS.map((item) => {
              const isEnabled = !disabledTypes.has(item.type);
              return (
                <button
                  key={item.type}
                  onClick={() => handleToggleNodeType(item.type)}
                  className="flex items-center gap-2 rounded-md px-1.5 py-0.5 text-left text-[13px] transition-all"
                  style={{
                    color: isEnabled ? "#8898b8" : "#3a4a6a",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    opacity: isEnabled ? 1 : 0.5,
                  }}
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full transition-opacity"
                    style={{
                      background: NODE_COLORS[item.type],
                      opacity: isEnabled ? 1 : 0.25,
                    }}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Click Prompt / Detail Preview */}
        <div className="flex-1" style={{ padding: "16px 20px" }}>
          {selectedNode ? (
            <div>
              <h3
                className="text-base font-bold"
                style={{ color: "#a0c0ff" }}
              >
                {selectedNode.label}
              </h3>
              <p
                className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: NODE_COLORS[selectedNode.type] }}
              >
                {NODE_LABELS[selectedNode.type]}
              </p>
              {selectedNode.student ? (
                <StudentSidebarPreview student={selectedNode.student} />
              ) : (
                <div
                  className="mt-3 text-xs leading-relaxed [&_strong]:font-semibold [&_ul]:pl-4 [&_li]:my-0.5"
                  style={{ color: "#8898b8" }}
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedNode.body || `<p>${selectedNode.desc}</p>`,
                  }}
                />
              )}
            </div>
          ) : (
            <div>
              <h3
                className="text-base font-bold"
                style={{ color: "#a0c0ff" }}
              >
                노드를 클릭하세요
              </h3>
              <p
                className="mt-0.5 text-[10px] uppercase tracking-widest"
                style={{ color: "#3a4a6a" }}
              >
                Click a node to see details
              </p>
              <p
                className="mt-3 text-xs leading-relaxed"
                style={{ color: "#5a6a8a" }}
              >
                그래프의 노드를 클릭하면 해당 항목의 상세 정보가 여기에
                표시됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Graph Area ── */}
      <div
        ref={containerRef}
        className="relative flex-1"
        style={{
          background:
            "radial-gradient(ellipse at center, #0a0e28 0%, #060818 70%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(60,80,140,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <svg ref={svgRef} className="h-full w-full" />

        {/* ── Detail Panel — absolute overlay inside graph container ── */}
        <div
          className={`absolute right-0 top-0 bottom-0 z-20 hidden w-[400px] transition-transform duration-300 ease-in-out md:block ${
            selectedNode ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            borderLeft: "1px solid rgba(60,80,140,0.15)",
            background:
              "linear-gradient(180deg, #0c1030 0%, #080c22 100%)",
          }}
        >
          {selectedNode && (
            <DetailPanel
              node={selectedNode}
              connections={connectionsByType}
              onClose={clearSelection}
              onNodeClick={handleDetailNodeClick}
              isDark={isDark}
            />
          )}
        </div>
      </div>

      {/* Mobile: Sheet */}
      <Sheet
        open={!!selectedNode}
        onOpenChange={(open) => {
          if (!open) clearSelection();
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[70vh] md:hidden"
          style={{
            background: "#0c1030",
            borderColor: "rgba(60,80,140,0.2)",
          }}
        >
          {selectedNode && (
            <DetailPanel
              node={selectedNode}
              connections={connectionsByType}
              onClose={clearSelection}
              onNodeClick={handleDetailNodeClick}
              isDark={isDark}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* ── CSS for D3 elements ── */}
      <style jsx global>{`
        .rm-link {
          transition: stroke-opacity 0.2s, stroke-width 0.2s;
        }
        .rm-node circle {
          transition: opacity 0.2s;
        }
        .rm-node text {
          transition: opacity 0.2s;
        }
        .rm-node:hover circle {
          filter: brightness(1.2) drop-shadow(0 0 6px currentColor);
        }
        .rm-node.rm-sel circle {
          stroke: #fff !important;
          stroke-width: 2.5;
          filter: drop-shadow(0 0 14px currentColor);
        }
        .rm-node.rm-sel text {
          fill: #e0e8ff !important;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

// ─── Detail Panel Component ───
function DetailPanel({
  node,
  connections,
  onClose,
  onNodeClick,
  isDark,
}: {
  node: SimNode;
  connections: Record<string, (SimNode & { linkType: string })[]>;
  onClose: () => void;
  onNodeClick: (id: string) => void;
  isDark: boolean;
}) {
  const totalConnections = Object.values(connections).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="h-full overflow-y-auto p-5" style={{ color: "#c8d0e8" }}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-3 top-3 rounded-md p-1 transition"
        style={{ color: "#3a4a6a" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#8aa0d0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#3a4a6a")}
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div
        className="mb-4 flex items-center gap-3 pb-3"
        style={{ borderBottom: "1px solid rgba(40,50,80,0.25)" }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{
            background: NODE_COLORS[node.type] + "15",
            border: `1.5px solid ${NODE_COLORS[node.type]}40`,
            color: NODE_COLORS[node.type],
          }}
        />
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#d0d8f0" }}>
            {node.label}
          </h2>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: NODE_COLORS[node.type] }}
          >
            {NODE_LABELS[node.type]}
          </p>
        </div>
      </div>

      {/* Student-specific sections */}
      {node.student ? (
        <StudentDetailSections
          student={node.student}
          body={node.body}
          desc={node.desc}
          actions={node.actions}
        />
      ) : (
        <>
          {/* Overview */}
          <section className="mb-4">
            <SectionHeader>Overview</SectionHeader>
            <div
              className="text-[13px] leading-relaxed [&_strong]:font-semibold [&_em]:not-italic [&_ul]:pl-4 [&_li]:my-0.5"
              style={{ color: "#8898b8" }}
              dangerouslySetInnerHTML={{
                __html: node.body || `<p>${node.desc}</p>`,
              }}
            />
          </section>

          {/* Action Items */}
          {node.actions && node.actions.length > 0 && (
            <section className="mb-4">
              <SectionHeader>Action Items</SectionHeader>
              <div className="space-y-1.5">
                {node.actions.map((a, i) => (
                  <ActionCard key={i} title={a.title} desc={a.desc} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Connections */}
      <section>
        <h3
          className="mb-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider"
          style={{
            color: "#3a4a6a",
            borderBottom: "1px solid rgba(30,40,60,0.4)",
          }}
        >
          Connections ({totalConnections})
        </h3>
        {Object.entries(connections).map(([type, items]) => (
          <div key={type} className="mb-2">
            <p
              className="mb-1 text-[10px] font-bold"
              style={{ color: "#3a4a6a" }}
            >
              {type} ({items.length})
            </p>
            <ul className="space-y-0.5">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition"
                  style={{ border: "1px solid transparent" }}
                  onClick={() => onNodeClick(n.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(25,35,70,0.5)";
                    e.currentTarget.style.borderColor =
                      "rgba(60,80,140,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: NODE_COLORS[n.type] }}
                  />
                  <span style={{ color: "#8898b8" }}>{n.label}</span>
                  <span
                    className="ml-auto max-w-[140px] truncate text-right text-[11px]"
                    style={{ color: "#3a4a6a" }}
                  >
                    {(n.desc || "").substring(0, 35)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

// ─── Shared UI Helpers ───
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider"
      style={{
        color: "#3a4a6a",
        borderBottom: "1px solid rgba(30,40,60,0.4)",
      }}
    >
      {children}
    </h3>
  );
}

function ActionCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      className="rounded-md p-2.5"
      style={{
        background: "rgba(15,20,45,0.5)",
        border: "1px solid rgba(40,50,80,0.25)",
      }}
    >
      <div className="text-sm font-semibold" style={{ color: "#ffb74d" }}>
        {title}
      </div>
      <div className="text-xs" style={{ color: "#5a6a8a" }}>
        {desc}
      </div>
    </div>
  );
}

// ─── Student Sidebar Preview (left panel) ───
function StudentSidebarPreview({ student }: { student: StudentProfile }) {
  return (
    <div className="mt-3 space-y-3">
      <div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: "#5bc0eb20",
            color: "#5bc0eb",
            border: "1px solid #5bc0eb40",
          }}
        >
          {student.degree}
        </span>
        <p
          className="mt-1.5 text-xs leading-relaxed"
          style={{ color: "#8898b8" }}
        >
          {student.topic}
        </p>
      </div>
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "#4a5a7a" }}
        >
          현재 진행
        </p>
        <p
          className="mt-1 text-[11px] leading-relaxed"
          style={{ color: "#7a8ab0" }}
        >
          {student.status}
        </p>
      </div>
      {student.timeline && student.timeline.length > 0 && (
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "#4a5a7a" }}
          >
            향후 일정
          </p>
          <div className="mt-1 space-y-1">
            {student.timeline.slice(0, 3).map((t, i) => (
              <div key={i} className="flex gap-2 text-[11px]">
                <span
                  className="shrink-0 font-semibold"
                  style={{ color: "#7eb8ff", minWidth: 72 }}
                >
                  {t.date}
                </span>
                <span style={{ color: "#6a7a9a" }}>{t.event}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {student.methods && student.methods.length > 0 && (
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "#4a5a7a" }}
          >
            방법론
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {student.methods.map((m, i) => (
              <span
                key={i}
                className="rounded px-1.5 py-0.5 text-[10px]"
                style={{
                  background: "rgba(20,25,60,0.6)",
                  color: "#6a7a9a",
                  border: "1px solid rgba(40,50,80,0.4)",
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Student Detail Sections (right panel) ───
function StudentDetailSections({
  student,
  body,
  desc,
  actions,
}: {
  student: StudentProfile;
  body: string;
  desc: string;
  actions?: { title: string; desc: string }[];
}) {
  return (
    <>
      <section className="mb-4">
        <SectionHeader>연구 개요 (Research Overview)</SectionHeader>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              background: "#5bc0eb20",
              color: "#5bc0eb",
              border: "1px solid #5bc0eb40",
            }}
          >
            {student.degree}
          </span>
        </div>
        <p
          className="mb-2 text-[13px] font-medium"
          style={{ color: "#a0b8d8" }}
        >
          {student.topic}
        </p>
        <div
          className="text-[13px] leading-relaxed [&_strong]:font-semibold [&_em]:not-italic [&_ul]:pl-4 [&_li]:my-0.5"
          style={{ color: "#8898b8" }}
          dangerouslySetInnerHTML={{
            __html: body || `<p>${desc}</p>`,
          }}
        />
      </section>

      <section className="mb-4">
        <SectionHeader>현재 진행 상황 (Current Status)</SectionHeader>
        <div
          className="rounded-md p-3"
          style={{
            background: "rgba(15,20,45,0.5)",
            border: "1px solid rgba(40,60,100,0.25)",
          }}
        >
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "#8898b8" }}
          >
            {student.status}
          </p>
        </div>
      </section>

      {student.publications && student.publications.length > 0 && (
        <section className="mb-4">
          <SectionHeader>투고 현황 (Publications)</SectionHeader>
          <div className="space-y-1.5">
            {student.publications.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md p-2.5"
                style={{
                  background: "rgba(15,20,45,0.5)",
                  border: "1px solid rgba(40,50,80,0.25)",
                }}
              >
                <div
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background:
                      p.progress.includes("투고") ||
                      p.progress.includes("작성")
                        ? "#5bc0eb"
                        : p.progress === "목표 저널"
                          ? "#5a6a8a"
                          : "#7ec884",
                  }}
                />
                <div className="flex-1">
                  <div
                    className="text-[13px] font-semibold"
                    style={{ color: "#a0b8d8" }}
                  >
                    {p.journal}
                  </div>
                  <div
                    className="flex items-center gap-2 text-[11px]"
                    style={{ color: "#5a6a8a" }}
                  >
                    {p.impactFactor && <span>IF {p.impactFactor}</span>}
                    <span>{p.progress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {student.timeline && student.timeline.length > 0 && (
        <section className="mb-4">
          <SectionHeader>향후 일정 (Timeline)</SectionHeader>
          <div
            className="relative ml-2 space-y-0"
            style={{ borderLeft: "2px solid rgba(40,60,100,0.3)" }}
          >
            {student.timeline.map((t, i) => (
              <div key={i} className="relative pb-3 pl-4">
                <div
                  className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full"
                  style={{
                    background: "#7eb8ff",
                    border: "2px solid #0c1030",
                  }}
                />
                <div
                  className="text-[11px] font-semibold"
                  style={{ color: "#7eb8ff" }}
                >
                  {t.date}
                </div>
                <div className="text-[13px]" style={{ color: "#a0b8d8" }}>
                  {t.event}
                </div>
                {t.detail && (
                  <div className="text-[11px]" style={{ color: "#5a6a8a" }}>
                    {t.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {student.methods && student.methods.length > 0 && (
        <section className="mb-4">
          <SectionHeader>연구 방법론 (Methods & Tools)</SectionHeader>
          <div className="flex flex-wrap gap-1.5">
            {student.methods.map((m, i) => (
              <span
                key={i}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: "rgba(126,100,224,0.1)",
                  color: "#c084e0",
                  border: "1px solid rgba(126,100,224,0.3)",
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      {actions && actions.length > 0 && (
        <section className="mb-4">
          <SectionHeader>Action Items</SectionHeader>
          <div className="space-y-1.5">
            {actions.map((a, i) => (
              <ActionCard key={i} title={a.title} desc={a.desc} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
