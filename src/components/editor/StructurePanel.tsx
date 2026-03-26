import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  Layout, FormInput, Globe, Menu, Footprints,
  List, Box,
  Type, ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  color: string;
  type: "page" | "section" | "form" | "input" | "element";
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  dashed?: boolean;
  label?: string;
}

interface StructurePanelProps {
  code: string;
}

const NODE_W = 160;
const NODE_H = 56;
const COL_GAP = 80;
const ROW_GAP = 24;

function buildGraph(
  html: string,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (!html) return { nodes: [], edges: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;
  if (!body) return { nodes: [], edges: [] };

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let nodeId = 0;

  const mkId = () => `n${nodeId++}`;

  const pageId = mkId();
  const title = doc.querySelector("title")?.textContent?.trim() || "Page";
  nodes.push({
    id: pageId,
    label: title.length > 20 ? title.slice(0, 18) + "…" : title,
    sublabel: "HTML Document",
    icon: Globe,
    color: "#f97316",
    type: "page",
    x: 0,
    y: 0,
  });

  const sectionTags = ["header", "nav", "main", "section", "article", "aside", "footer"];
  const topElements = Array.from(body.children);

  interface SectionInfo {
    tag: string;
    el: Element;
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
  }

  const sections: SectionInfo[] = [];

  function findSections(el: Element, depth: number) {
    const tag = el.tagName.toLowerCase();
    if (sectionTags.includes(tag) || (tag === "div" && el.id)) {
      const label =
        tag === "header" ? "Header" :
        tag === "nav" ? "Navigation" :
        tag === "main" ? "Main Content" :
        tag === "section" ? (el.querySelector("h1,h2,h3")?.textContent?.trim().slice(0, 18) || "Section") :
        tag === "article" ? "Article" :
        tag === "aside" ? "Sidebar" :
        tag === "footer" ? "Footer" :
        el.id ? `#${el.id}` : "Block";

      const icon =
        tag === "header" ? Layout :
        tag === "nav" ? Menu :
        tag === "main" ? Box :
        tag === "footer" ? Footprints :
        tag === "section" || tag === "article" ? Type :
        tag === "aside" ? List :
        Layout;

      const color =
        tag === "header" ? "#818cf8" :
        tag === "nav" ? "#a78bfa" :
        tag === "main" ? "#34d399" :
        tag === "footer" ? "#9ca3af" :
        tag === "section" ? "#60a5fa" :
        tag === "article" ? "#fbbf24" :
        tag === "aside" ? "#f472b6" :
        "#6b7280";

      const sid = mkId();
      sections.push({ tag, el, id: sid, label, icon, color });
      return;
    }
    if (depth < 3) {
      Array.from(el.children).forEach((c) => findSections(c, depth + 1));
    }
  }

  topElements.forEach((el) => findSections(el, 0));

  if (sections.length === 0) {
    const sid = mkId();
    sections.push({
      tag: "body",
      el: body,
      id: sid,
      label: "Content",
      icon: Box,
      color: "#60a5fa",
    });
  }

  const col1X = NODE_W + COL_GAP;
  const sectionsStartY = -(sections.length - 1) * (NODE_H + ROW_GAP) / 2;

  sections.forEach((sec, i) => {
    nodes.push({
      id: sec.id,
      label: sec.label,
      sublabel: `<${sec.tag}>`,
      icon: sec.icon,
      color: sec.color,
      type: "section",
      x: col1X,
      y: sectionsStartY + i * (NODE_H + ROW_GAP),
    });
    edges.push({ from: pageId, to: sec.id });
  });

  const forms = Array.from(doc.querySelectorAll("form"));
  const col2X = col1X + NODE_W + COL_GAP;

  interface FormInfo {
    el: Element;
    id: string;
    nodeId: string;
    parentSectionId: string;
    fields: { name: string; type: string }[];
  }

  const formInfos: FormInfo[] = [];

  forms.forEach((form, fi) => {
    const formNodeId = mkId();
    const formId = form.id || `form_${fi}`;

    let parentSectionId = sections[0]?.id || pageId;
    for (const sec of sections) {
      if (sec.el.contains(form)) {
        parentSectionId = sec.id;
        break;
      }
    }

    const inputs = Array.from(form.querySelectorAll("input, textarea, select"));
    const fields = inputs
      .map((inp) => {
        const type = inp.getAttribute("type") || (inp.tagName === "TEXTAREA" ? "textarea" : "text");
        if (type === "submit" || type === "button" || type === "hidden") return null;
        const name = inp.getAttribute("name") || inp.getAttribute("id") || inp.getAttribute("placeholder") || `field`;
        return { name, type };
      })
      .filter(Boolean) as { name: string; type: string }[];

    const label = form.id
      ? `#${form.id}`
      : form.querySelector("h1,h2,h3,h4,legend,label")?.textContent?.trim().slice(0, 16) || `Form ${fi + 1}`;

    formInfos.push({ el: form, id: formId, nodeId: formNodeId, parentSectionId, fields });

    nodes.push({
      id: formNodeId,
      label: label,
      sublabel: `${fields.length} fields`,
      icon: FormInput,
      color: "#f43f5e",
      type: "form",
      x: col2X,
      y: 0,
    });

    edges.push({ from: parentSectionId, to: formNodeId });
  });

  const formsStartY = -(formInfos.length - 1) * (NODE_H + ROW_GAP) / 2;
  formInfos.forEach((fi, i) => {
    const node = nodes.find((n) => n.id === fi.nodeId)!;
    node.y = formsStartY + i * (NODE_H + ROW_GAP);
  });

  const col3X = col2X + NODE_W + COL_GAP;

  formInfos.forEach((fi) => {
    fi.fields.forEach((field, fieldIdx) => {
      const fieldNodeId = mkId();
      const baseY = (nodes.find((n) => n.id === fi.nodeId)?.y || 0);
      const fieldY = baseY + (fieldIdx - (fi.fields.length - 1) / 2) * (NODE_H * 0.7 + 8);

      nodes.push({
        id: fieldNodeId,
        label: field.name.length > 14 ? field.name.slice(0, 12) + "…" : field.name,
        sublabel: field.type,
        icon: FormInput,
        color: "#fb923c",
        type: "input",
        x: col3X,
        y: fieldY,
      });

      edges.push({ from: fi.nodeId, to: fieldNodeId, dashed: true });
    });
  });

  const minX = Math.min(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  nodes.forEach((n) => {
    n.x -= minX - 40;
    n.y -= minY - 40;
  });

  return { nodes, edges };
}

function EdgeLine({
  from,
  to,
  nodes,
  dashed,
  label,
}: {
  from: string;
  to: string;
  nodes: GraphNode[];
  dashed?: boolean;
  label?: string;
}) {
  const fromNode = nodes.find((n) => n.id === from);
  const toNode = nodes.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  const x1 = fromNode.x + NODE_W;
  const y1 = fromNode.y + NODE_H / 2;
  const x2 = toNode.x;
  const y2 = toNode.y + NODE_H / 2;

  const midX = (x1 + x2) / 2;

  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={dashed ? "#374151" : "#4b5563"}
        strokeWidth={dashed ? 1 : 1.5}
        strokeDasharray={dashed ? "4 3" : undefined}
        opacity={0.6}
      />
      <circle cx={x2} cy={y2} r={3} fill="#4b5563" opacity={0.6} />
      {label && (
        <text
          x={midX}
          y={(y1 + y2) / 2 - 6}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={8}
          fontFamily="monospace"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function NodeCard({ node }: { node: GraphNode }) {
  const Icon = node.icon;

  const bgColor =
    node.type === "form" ? "#1a0a1a" :
    node.type === "page" ? "#1a1400" :
    node.type === "input" ? "#1a1200" :
    "#111318";

  const borderColor = `${node.color}30`;

  return (
    <div
      className="absolute flex items-center gap-2.5 rounded-lg border px-3 transition-all hover:brightness-125 hover:scale-[1.02] cursor-default"
      style={{
        left: node.x,
        top: node.y,
        width: NODE_W,
        height: NODE_H,
        backgroundColor: bgColor,
        borderColor,
        boxShadow: `0 0 20px ${node.color}08`,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${node.color}18`, border: `1px solid ${node.color}25` }}
      >
        <Icon size={15} style={{ color: node.color }} />
      </div>

      <div className="flex flex-col min-w-0 gap-0.5">
        <span
          className="text-xs font-medium truncate"
          style={{ color: "#e5e7eb", lineHeight: "14px" }}
        >
          {node.label}
        </span>
        {node.sublabel && (
          <span
            className="truncate"
            style={{ fontSize: "9px", color: "#6b7280", lineHeight: "11px" }}
          >
            {node.sublabel}
          </span>
        )}
      </div>

      <div
        className="absolute w-2 h-2 rounded-full"
        style={{
          right: -4,
          top: NODE_H / 2 - 4,
          backgroundColor: node.color,
          opacity: 0.4,
        }}
      />
      <div
        className="absolute w-2 h-2 rounded-full"
        style={{
          left: -4,
          top: NODE_H / 2 - 4,
          backgroundColor: node.color,
          opacity: 0.4,
        }}
      />
    </div>
  );
}

function GridBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1f2937" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

function StatsBar({ nodes }: { nodes: GraphNode[] }) {
  const counts = useMemo(() => {
    const c = { sections: 0, forms: 0, fields: 0 };
    nodes.forEach((n) => {
      if (n.type === "section") c.sections++;
      if (n.type === "form") c.forms++;
      if (n.type === "input") c.fields++;
    });
    return c;
  }, [nodes]);

  const items = [
    { label: "Sections", value: counts.sections, color: "#60a5fa" },
    { label: "Forms", value: counts.forms, color: "#f43f5e" },
    { label: "Fields", value: counts.fields, color: "#fb923c" },
  ];

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
      style={{ borderColor: "#1f2937", background: "#0a0a0f" }}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5" style={{ fontSize: "10px" }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
          <span style={{ color: "#6b7280" }}>{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1 ml-auto" style={{ fontSize: "9px", color: "#4b5563" }}>
        <ArrowRight size={9} />
        <span>Data Flow</span>
      </div>
    </div>
  );
}

export default function StructurePanel({ code }: StructurePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const { nodes, edges } = useMemo(
    () => buildGraph(code),
    [code]
  );

  const canvasW = useMemo(
    () => Math.max(800, ...nodes.map((n) => n.x + NODE_W + 80)),
    [nodes]
  );
  const canvasH = useMemo(
    () => Math.max(400, ...nodes.map((n) => n.y + NODE_H + 80)),
    [nodes]
  );

  useEffect(() => {
    if (containerRef.current && nodes.length > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const cx = (rect.width - canvasW) / 2;
      const cy = (rect.height - canvasH) / 2;
      setOffset({ x: Math.min(0, cx), y: Math.min(0, cy) });
    }
  }, [nodes.length, canvasW, canvasH]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }, [offset]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  if (!code) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2"
        style={{ color: "#4b5563", background: "#09090b" }}>
        <Layout size={32} style={{ opacity: 0.2 }} />
        <span style={{ fontSize: "11px" }}>Сгенерируйте сайт, чтобы увидеть структуру</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#09090b" }}>
      <StatsBar nodes={nodes} />

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <GridBackground />

        <div
          className="absolute"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            width: canvasW,
            height: canvasH,
          }}
        >
          <svg
            className="absolute inset-0"
            width={canvasW}
            height={canvasH}
            style={{ pointerEvents: "none" }}
          >
            {edges.map((edge, i) => (
              <EdgeLine
                key={i}
                from={edge.from}
                to={edge.to}
                nodes={nodes}
                dashed={edge.dashed}
                label={edge.label}
              />
            ))}
          </svg>

          {nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}
