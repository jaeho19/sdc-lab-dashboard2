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
} from "./research-map-data";

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

const VIEW_LABELS: Record<ViewMode, string> = {
  all: "All",
  urban: "Urban",
  rural: "Rural",
  bridge: "Shared",
  conf: "Conference",
};

const NODE_TYPE_BADGES: { type: NodeType; label: string }[] = [
  { type: "student", label: "학생" },
  { type: "theme", label: "연구주제" },
  { type: "project", label: "프로젝트" },
  { type: "conference", label: "학회" },
  { type: "method", label: "방법론" },
  { type: "axis", label: "연구축" },
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
  const [activeNodeType, setActiveNodeType] = useState<NodeType | null>(null);

  // ─── D3 initialization ───
  useEffect(() => {
    const svgEl = svgRef.current;
    const container = containerRef.current;
    if (!svgEl || !container) return;

    // Clear previous
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
    for (const [key, color] of Object.entries(NODE_COLORS)) {
      const filter = defs
        .append("filter")
        .attr("id", `glow-${key}`);
      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", 3)
        .attr("result", "blur");
      const merge = filter.append("feMerge");
      merge.append("feMergeNode").attr("in", "blur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    }

    // Clone data for D3 mutation
    const nodes: SimNode[] = NODES.map((n) => ({ ...n }));
    const links: SimLink[] = LINKS.map((l) => ({ ...l }));
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
            const s = nodes.find(
              (x) => x.id === nodeId(d.source)
            );
            const t = nodes.find(
              (x) => x.id === nodeId(d.target)
            );
            if (!s || !t) return 100;
            if (s.type === "axis" || t.type === "axis") return 200;
            if (s.type === "student" !== (t.type === "student")) return 100;
            return 130;
          })
      )
      .force(
        "charge",
        d3.forceManyBody<SimNode>().strength((d) => {
          if (d.type === "axis") return -900;
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
      .attr("stroke-width", (d) =>
        d.type === "kk" ? 1 : d.type === "collab" ? 2 : 1.2
      )
      .attr("stroke-opacity", (d) =>
        d.type === "kk" ? 0.06 : d.type === "collab" ? 0.4 : 0.15
      )
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
            // Click detection: fire select if no drag movement occurred
            if (!dragMoved) {
              e.sourceEvent?.stopPropagation();
              tooltip.style("opacity", 0);
              setShowPrompt(false);
              setSelectedNode({ ...d });
              highlightNode(d, nodeEls, linkEls, nodes, links);
            }
          })
      );

    nodeEls
      .append("circle")
      .attr("r", (d) => d.size)
      .attr("fill", (d) => {
        if (d.type === "axis") return NODE_COLORS[d.type] + "30";
        return NODE_COLORS[d.type] + "cc";
      })
      .attr("stroke", (d) => NODE_COLORS[d.type])
      .attr("stroke-width", (d) => (d.type === "axis" ? 2 : 1.5))
      .attr("stroke-opacity", (d) => (d.type === "axis" ? 0.5 : 0.7));

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

    // Background click to clear selection (rect instead of svg.on("click") to avoid zoom conflicts)
    g.insert("rect", ":first-child")
      .attr("width", W * 10)
      .attr("height", H * 10)
      .attr("x", -W * 5)
      .attr("y", -H * 5)
      .attr("fill", "transparent")
      .style("cursor", "default")
      .on("click", () => {
        setSelectedNode(null);
        clearHighlight(nodeEls, linkEls);
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

    // Store refs for view mode changes
    (svgEl as any).__rm = { nodeEls, linkEls, nodes, links };

    // Keyboard
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedNode(null);
        clearHighlight(nodeEls, linkEls);
      }
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      sim.stop();
      tooltip.remove();
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  // ─── View mode effect ───
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !(svgEl as any).__rm) return;
    const { nodeEls, linkEls, nodes, links } = (svgEl as any).__rm;

    setSelectedNode(null);
    setActiveNodeType(null);
    clearHighlight(nodeEls, linkEls);

    if (viewMode === "all") {
      nodeEls.classed("rm-dim", false);
      linkEls.classed("rm-dim", false);
      return;
    }

    if (viewMode === "urban" || viewMode === "rural") {
      const vis = new Set<string>([viewMode]);
      for (const n of nodes) {
        if (n.axes?.includes(viewMode)) vis.add(n.id);
      }
      for (const l of links) {
        const s = nodeId(l.source);
        const t = nodeId(l.target);
        if (vis.has(s)) vis.add(t);
        if (vis.has(t)) vis.add(s);
      }
      nodeEls.classed("rm-dim", (n: SimNode) => !vis.has(n.id));
      linkEls.classed("rm-dim", (l: SimLink) => {
        return !vis.has(nodeId(l.source)) || !vis.has(nodeId(l.target));
      });
      return;
    }

    if (viewMode === "bridge") {
      const urbanStudents = new Set(
        nodes
          .filter(
            (n: SimNode) =>
              n.type === "student" && n.axes?.includes("urban")
          )
          .map((n: SimNode) => n.id)
      );
      const ruralStudents = new Set(
        nodes
          .filter(
            (n: SimNode) =>
              n.type === "student" && n.axes?.includes("rural")
          )
          .map((n: SimNode) => n.id)
      );
      const bridgeKw = new Set<string>();
      for (const kw of nodes.filter((n: SimNode) =>
        ["theme", "method", "tech"].includes(n.type)
      )) {
        const connIds = getConnections(kw.id, links, nodes).map(
          (x) => x.id
        );
        if (
          connIds.some((id) => urbanStudents.has(id)) &&
          connIds.some((id) => ruralStudents.has(id))
        ) {
          bridgeKw.add(kw.id);
        }
      }
      const vis = new Set(bridgeKw);
      for (const l of links) {
        const s = nodeId(l.source);
        const t = nodeId(l.target);
        if (bridgeKw.has(s)) {
          vis.add(s);
          vis.add(t);
        }
        if (bridgeKw.has(t)) {
          vis.add(t);
          vis.add(s);
        }
      }
      nodeEls.classed("rm-dim", (n: SimNode) => !vis.has(n.id));
      linkEls.classed("rm-dim", (l: SimLink) => {
        return !vis.has(nodeId(l.source)) || !vis.has(nodeId(l.target));
      });
      return;
    }

    if (viewMode === "conf") {
      const vis = new Set<string>();
      for (const n of nodes) {
        if (n.type === "conference" || n.type === "student") vis.add(n.id);
      }
      for (const kw of nodes.filter((n: SimNode) =>
        ["theme", "method", "tech"].includes(n.type)
      )) {
        const c = getConnections(kw.id, links, nodes);
        if (
          c.some((x) => x.type === "conference") &&
          c.some((x) => x.type === "student")
        ) {
          vis.add(kw.id);
        }
      }
      nodeEls.classed("rm-dim", (n: SimNode) => !vis.has(n.id));
      linkEls.classed("rm-dim", (l: SimLink) => {
        return !vis.has(nodeId(l.source)) || !vis.has(nodeId(l.target));
      });
    }
  }, [viewMode]);

  // ─── Node type filter effect ───
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !(svgEl as any).__rm) return;
    const { nodeEls, linkEls } = (svgEl as any).__rm;

    if (!activeNodeType) {
      // Reset — re-apply current view mode by not touching classes here
      // (view mode effect handles it)
      return;
    }

    setSelectedNode(null);
    // Highlight nodes of this type + their direct connections
    const vis = new Set<string>();
    const nodes: SimNode[] = (svgEl as any).__rm.nodes;
    const links: SimLink[] = (svgEl as any).__rm.links;
    for (const n of nodes) {
      if (n.type === activeNodeType) vis.add(n.id);
    }
    for (const l of links) {
      const s = nodeId(l.source);
      const t = nodeId(l.target);
      if (vis.has(s)) vis.add(t);
      if (vis.has(t)) vis.add(s);
    }
    nodeEls.classed("rm-dim", (n: SimNode) => !vis.has(n.id));
    linkEls.classed("rm-dim", (l: SimLink) => !vis.has(nodeId(l.source)) || !vis.has(nodeId(l.target)));
  }, [activeNodeType]);

  // ─── Click node from detail panel ───
  const handleDetailNodeClick = useCallback(
    (id: string) => {
      const svgEl = svgRef.current;
      if (!svgEl || !(svgEl as any).__rm) return;
      const { nodeEls, linkEls, nodes, links } = (svgEl as any).__rm;
      const node = nodes.find((n: SimNode) => n.id === id);
      if (!node) return;
      setSelectedNode(node);
      highlightNode(node, nodeEls, linkEls, nodes, links);
    },
    []
  );

  // ─── Selected node connections ───
  const connections = selectedNode
    ? getConnections(
        selectedNode.id,
        linksRef.current,
        nodesRef.current
      )
    : [];

  const connectionsByType: Record<string, (SimNode & { linkType: string })[]> =
    {};
  for (const conn of connections) {
    let key = NODE_LABELS[conn.type] || conn.type;
    if (conn.linkType === "kk") key = "관련 키워드";
    if (!connectionsByType[key]) connectionsByType[key] = [];
    connectionsByType[key].push(conn);
  }

  // ─── Legend items ───
  const legendItems: { type: NodeType; label: string }[] = [
    { type: "student", label: "학생 (Student)" },
    { type: "theme", label: "연구주제 (Research Topic)" },
    { type: "project", label: "프로젝트 (Project)" },
    { type: "conference", label: "학회 (Conference)" },
    { type: "method", label: "방법론 (Method)" },
    { type: "axis", label: "연구축 (Research Axis)" },
  ];

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    const svgEl = svgRef.current;
    if (svgEl && (svgEl as any).__rm) {
      clearHighlight(
        (svgEl as any).__rm.nodeEls,
        (svgEl as any).__rm.linkEls
      );
    }
  }, []);

  return (
    <div className="relative flex overflow-hidden rounded-lg" style={{ height: "calc(100vh - 160px)", minHeight: 500, background: "#0a0e2a", fontFamily: "var(--font-paperlogy), 'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* ── Left Sidebar ── */}
      <div
        className="relative z-10 flex shrink-0 flex-col overflow-y-auto"
        style={{ width: 300, borderRight: "1px solid rgba(60,80,140,0.2)", background: "linear-gradient(180deg, #0c1030 0%, #080c22 100%)" }}
      >
        {/* Title */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(60,80,140,0.15)" }}>
          <h2 className="text-lg font-bold" style={{ color: "#a0c0ff" }}>SDC Lab Research Map</h2>
          <p className="mt-0.5 text-xs" style={{ color: "#3a4a6a" }}>Spatial Data Community Lab | 2026</p>
        </div>

        {/* View Mode */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(60,80,140,0.15)" }}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: "#4a5a7a" }}>View Mode</p>
          <div className="flex flex-col gap-1">
            {VIEW_OPTIONS.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="w-full rounded-md px-3 py-2 text-left text-[13px] font-medium transition-all"
                style={{
                  background: viewMode === mode ? "rgba(40,60,120,0.4)" : "rgba(20,25,60,0.4)",
                  border: `1px solid ${viewMode === mode ? "rgba(80,120,200,0.4)" : "rgba(40,50,90,0.3)"}`,
                  color: viewMode === mode ? "#7eb8ff" : "#5a6a90",
                  boxShadow: viewMode === mode ? "0 0 12px rgba(80,120,200,0.1)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Node Types — clickable filter */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(60,80,140,0.15)" }}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: "#4a5a7a" }}>Node Types</p>
          <div className="flex flex-wrap gap-1.5">
            {NODE_TYPE_BADGES.map(({ type, label }) => {
              const isActive = activeNodeType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    const next = isActive ? null : type;
                    setActiveNodeType(next);
                    if (next) setViewMode("all");
                  }}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    cursor: "pointer",
                    color: isActive ? "#0a0e2a" : NODE_COLORS[type],
                    border: `1.5px solid ${isActive ? NODE_COLORS[type] : NODE_COLORS[type] + "60"}`,
                    background: isActive ? NODE_COLORS[type] : `${NODE_COLORS[type]}10`,
                    boxShadow: isActive ? `0 0 10px ${NODE_COLORS[type]}40` : "none",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(60,80,140,0.15)" }}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: "#4a5a7a" }}>Legend</p>
          <div className="flex flex-col gap-1.5">
            {legendItems.map((item) => (
              <div key={item.type} className="flex items-center gap-2 text-[13px]" style={{ color: "#8898b8" }}>
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: NODE_COLORS[item.type] }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Click Prompt / Detail Preview */}
        <div className="flex-1" style={{ padding: "16px 20px" }}>
          {selectedNode ? (
            <div>
              <h3 className="text-base font-bold" style={{ color: "#a0c0ff" }}>{selectedNode.label}</h3>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: NODE_COLORS[selectedNode.type] }}>{NODE_LABELS[selectedNode.type]}</p>
              <div className="mt-3 text-xs leading-relaxed [&_strong]:font-semibold [&_ul]:pl-4 [&_li]:my-0.5" style={{ color: "#8898b8" }} dangerouslySetInnerHTML={{ __html: selectedNode.body || `<p>${selectedNode.desc}</p>` }} />
              {selectedNode.actions && selectedNode.actions.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {selectedNode.actions.map((a, i) => (
                    <div key={i} className="rounded-md p-2" style={{ background: "rgba(15,20,45,0.5)", border: "1px solid rgba(40,50,80,0.25)" }}>
                      <div className="text-xs font-semibold" style={{ color: "#ffb74d" }}>{a.title}</div>
                      <div className="text-[11px]" style={{ color: "#5a6a8a" }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold" style={{ color: "#a0c0ff" }}>노드를 클릭하세요</h3>
              <p className="mt-0.5 text-[10px] uppercase tracking-widest" style={{ color: "#3a4a6a" }}>Click a node to see details</p>
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "#5a6a8a" }}>
                그래프의 노드를 클릭하면 해당 항목의 상세 정보가 여기에 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Graph Area ── */}
      <div ref={containerRef} className="relative flex-1" style={{ background: "radial-gradient(ellipse at center, #0a0e28 0%, #060818 70%)" }}>
        {/* Grid background */}
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(60,80,140,0.06) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <svg ref={svgRef} className="h-full w-full" />
      </div>

      {/* ── Detail Panel — Desktop slide-in ── */}
      <div
        className={`absolute right-0 top-0 bottom-0 z-20 hidden w-[400px] transition-transform duration-300 ease-in-out md:block ${
          selectedNode ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ borderLeft: "1px solid rgba(60,80,140,0.15)", background: "linear-gradient(180deg, #0c1030 0%, #080c22 100%)" }}
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

      {/* Mobile: Sheet */}
      <Sheet open={!!selectedNode} onOpenChange={(open) => { if (!open) clearSelection(); }}>
        <SheetContent side="bottom" className="h-[70vh] md:hidden" style={{ background: "#0c1030", borderColor: "rgba(60,80,140,0.2)" }}>
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
        .rm-link.rm-dim {
          stroke-opacity: 0.02 !important;
        }
        .rm-link.rm-hi {
          stroke-opacity: 0.8 !important;
        }
        .rm-node circle {
          transition: 0.2s;
        }
        .rm-node:hover circle {
          filter: brightness(1.2) drop-shadow(0 0 6px currentColor);
        }
        .rm-node.rm-dim circle {
          opacity: 0.05;
        }
        .rm-node.rm-dim text {
          opacity: 0.02;
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

// ─── Highlight helpers ───
function highlightNode(
  d: SimNode,
  nodeEls: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>,
  linkEls: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
  nodes: SimNode[],
  links: SimLink[]
) {
  const connected = new Set<string>([d.id]);
  for (const l of links) {
    const s = nodeId(l.source);
    const t = nodeId(l.target);
    if (s === d.id) connected.add(t);
    if (t === d.id) connected.add(s);
  }
  nodeEls
    .classed("rm-dim", (n) => !connected.has(n.id))
    .classed("rm-sel", (n) => n.id === d.id);
  linkEls
    .classed("rm-dim", (l) => {
      return (
        !connected.has(nodeId(l.source)) ||
        !connected.has(nodeId(l.target))
      );
    })
    .classed("rm-hi", (l) => {
      return (
        nodeId(l.source) === d.id || nodeId(l.target) === d.id
      );
    });
}

function clearHighlight(
  nodeEls: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>,
  linkEls: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown>
) {
  nodeEls.classed("rm-dim", false).classed("rm-sel", false);
  linkEls.classed("rm-dim", false).classed("rm-hi", false);
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
      <div className="mb-4 flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid rgba(40,50,80,0.25)" }}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{
            background: NODE_COLORS[node.type] + "15",
            border: `1.5px solid ${NODE_COLORS[node.type]}40`,
            color: NODE_COLORS[node.type],
          }}
        />
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#d0d8f0" }}>{node.label}</h2>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: NODE_COLORS[node.type] }}>
            {NODE_LABELS[node.type]}
          </p>
        </div>
      </div>

      {/* Overview */}
      <section className="mb-4">
        <h3 className="mb-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#3a4a6a", borderBottom: "1px solid rgba(30,40,60,0.4)" }}>
          Overview
        </h3>
        <div
          className="text-[13px] leading-relaxed [&_strong]:font-semibold [&_em]:not-italic [&_ul]:pl-4 [&_li]:my-0.5"
          style={{ color: "#8898b8" }}
          dangerouslySetInnerHTML={{ __html: node.body || `<p>${node.desc}</p>` }}
        />
      </section>

      {/* Action Items */}
      {node.actions && node.actions.length > 0 && (
        <section className="mb-4">
          <h3 className="mb-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#3a4a6a", borderBottom: "1px solid rgba(30,40,60,0.4)" }}>
            Action Items
          </h3>
          <div className="space-y-1.5">
            {node.actions.map((a, i) => (
              <div key={i} className="rounded-md p-2.5" style={{ background: "rgba(15,20,45,0.5)", border: "1px solid rgba(40,50,80,0.25)" }}>
                <div className="text-sm font-semibold" style={{ color: "#ffb74d" }}>{a.title}</div>
                <div className="text-xs" style={{ color: "#5a6a8a" }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Connections */}
      <section>
        <h3 className="mb-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#3a4a6a", borderBottom: "1px solid rgba(30,40,60,0.4)" }}>
          Connections ({totalConnections})
        </h3>
        {Object.entries(connections).map(([type, items]) => (
          <div key={type} className="mb-2">
            <p className="mb-1 text-[10px] font-bold" style={{ color: "#3a4a6a" }}>{type} ({items.length})</p>
            <ul className="space-y-0.5">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition"
                  style={{ border: "1px solid transparent" }}
                  onClick={() => onNodeClick(n.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(25,35,70,0.5)"; e.currentTarget.style.borderColor = "rgba(60,80,140,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                >
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: NODE_COLORS[n.type] }} />
                  <span style={{ color: "#8898b8" }}>{n.label}</span>
                  <span className="ml-auto max-w-[140px] truncate text-right text-[11px]" style={{ color: "#3a4a6a" }}>
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
