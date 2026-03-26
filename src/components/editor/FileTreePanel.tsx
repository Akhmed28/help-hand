import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { FileCode2, FileText, Braces, FolderOpen, Copy, Check, X } from "lucide-react";

interface FileTreePanelProps {
  hasCode: boolean;
  code: string;
}

type FileType = "html" | "css" | "js";

interface ParsedFile {
  name: string;
  type: FileType;
  content: string;
  lines: number;
  size: string;
}

const LANG_COLORS: Record<FileType, string> = {
  html: "#f97316",
  css:  "#60a5fa",
  js:   "#facc15",
};

const FILE_ICON: Record<FileType, typeof FileCode2> = {
  html: FileCode2,
  css: FileText,
  js: Braces,
};

function formatSize(str: string): string {
  const bytes = new TextEncoder().encode(str).length;
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`;
}

function parseFiles(code: string): ParsedFile[] {
  if (!code) return [];
  const cssContent = [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(m => m[1].trim()).join("\n\n") || "/* No CSS blocks found */";
  const jsContent = [...code.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1].trim()).filter(Boolean).join("\n\n") || "// No JavaScript found";

  return [
    { name: "index.html", type: "html", content: code.trimEnd(),        lines: code.trimEnd().split("\n").length,        size: formatSize(code) },
    { name: "style.css",  type: "css",  content: cssContent.trimEnd(),  lines: cssContent.trimEnd().split("\n").length,  size: formatSize(cssContent) },
    { name: "script.js",  type: "js",   content: jsContent.trimEnd(),   lines: jsContent.trimEnd().split("\n").length,   size: formatSize(jsContent) },
  ];
}

function highlight(code: string, type: FileType): string {
  const esc = code.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  if (type === "html") return esc
    .replace(/(&lt;\/?)([\w-]+)/g,'<span style="color:#f97316">$1$2</span>')
    .replace(/([\w-]+=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,'<span style="color:#a78bfa">$1</span><span style="color:#86efac">$2</span>')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g,'<span style="color:#6b7280">$1</span>');
  if (type === "css") {
    let out = esc.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6b7280">$1</span>');
    out = out.replace(/^([^{}\n]+)(\{)/gm, '<span style="color:#60a5fa">$1</span>$2');
    out = out.replace(/^(\s*)([\w-]+)(\s*:)/gm, '$1<span style="color:#c084fc">$2</span>$3');
    out = out.replace(/:\s*([^;{\n<]+)/g, ': <span style="color:#86efac">$1</span>');
    return out;
  }
  if (type === "js") return esc
    .replace(/(\/\/[^\n]*)/g,'<span style="color:#6b7280">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|for|while|async|await|class|new|import|export|from|typeof|null|undefined|true|false|type|interface|string|number|boolean)\b/g,'<span style="color:#f97316">$1</span>')
    .replace(/(`[^`]*`|"[^"]*"|'[^']*')/g,'<span style="color:#86efac">$1</span>');
  return esc;
}

export default function FileTreePanel({ hasCode, code }: FileTreePanelProps) {
  const files = useMemo(() => parseFiles(code), [code]);
  const [openTabs, setOpenTabs]   = useState<FileType[]>(hasCode ? ["html"] : []);
  const [activeTab, setActiveTab] = useState<FileType | null>(hasCode ? "html" : null);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    if (hasCode && openTabs.length === 0) {
      setOpenTabs(["html"]);
      setActiveTab("html");
    }
  }, [hasCode]);

  const [explorerWidth, setExplorerWidth] = useState(160);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = explorerWidth;
    e.preventDefault();

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - dragStartX.current;
      setExplorerWidth(Math.min(320, Math.max(100, dragStartW.current + delta)));
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [explorerWidth]);

  const activeFile  = useMemo(() => files.find(f => f.type === activeTab) ?? null, [files, activeTab]);
  const highlighted = useMemo(() => activeFile ? highlight(activeFile.content.trimEnd(), activeFile.type) : "", [activeFile]);

  function openFile(type: FileType) {
    if (!openTabs.includes(type)) setOpenTabs(t => [...t, type]);
    setActiveTab(type);
  }

  function closeTab(type: FileType, e: React.MouseEvent) {
    e.stopPropagation();
    const next = openTabs.filter(t => t !== type);
    setOpenTabs(next);
    if (activeTab === type) setActiveTab(next[next.length - 1] ?? null);
  }

  function handleCopy() {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex h-full overflow-hidden bg-card" style={{ fontSize: "12px" }}>
      <div
        className="flex flex-col shrink-0 overflow-hidden"
        style={{ width: `${explorerWidth}px`, borderRight: "1px solid var(--color-border-tertiary)" }}
      >
        <div className="px-3 py-2 border-b border-border shrink-0"
          style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
          Explorer
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {hasCode ? (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ color: "var(--color-text-secondary)" }}>
                <FolderOpen size={13} />
                <span style={{ fontSize: "11px", fontWeight: 500 }}>project</span>
              </div>
              {files.map(f => {
                const Icon = FILE_ICON[f.type];
                const isActive = activeTab === f.type;
                return (
                  <button key={f.type} onClick={() => openFile(f.type)}
                    className="w-full flex items-center gap-2 pl-6 pr-2 py-1 text-left transition-colors"
                    style={{
                      background: isActive ? "var(--color-background-secondary)" : "transparent",
                      color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    }}>
                    <Icon size={13} style={{ color: LANG_COLORS[f.type], flexShrink: 0 }} />
                    <span className="truncate" style={{ fontSize: "12px" }}>{f.name}</span>
                    <span className="ml-auto shrink-0" style={{ fontSize: "9px", color: "var(--color-text-tertiary)" }}>{f.size}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <div className="flex items-center justify-center mt-8 px-3 text-center"
              style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>
              Generate a site to see files
            </div>
          )}
        </div>
      </div>

      <div
        onMouseDown={onMouseDown}
        className="shrink-0 transition-colors"
        style={{
          width: "4px",
          cursor: "col-resize",
          background: "var(--color-border-tertiary)",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--color-border-secondary)")}
        onMouseLeave={e => (e.currentTarget.style.background = "var(--color-border-tertiary)")}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {openTabs.length > 0 && (
          <div className="flex items-center border-b border-border shrink-0 overflow-x-auto"
            style={{ minHeight: "35px", background: "var(--color-background-primary)" }}>
            {openTabs.map(type => {
              const f = files.find(x => x.type === type)!;
              const Icon = FILE_ICON[type];
              const isActive = activeTab === type;
              return (
                <div key={type} onClick={() => setActiveTab(type)}
                  className="flex items-center gap-1.5 px-3 border-r border-border cursor-pointer shrink-0 group transition-colors"
                  style={{
                    height: "35px",
                    background: isActive ? "var(--color-background-secondary)" : "transparent",
                    borderBottom: isActive ? "2px solid #60a5fa" : "2px solid transparent",
                    color: isActive ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  }}>
                  <Icon size={12} style={{ color: LANG_COLORS[type] }} />
                  <span style={{ fontSize: "11px" }}>{f.name}</span>
                  <button onClick={(e) => closeTab(type, e)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity ml-1"
                    style={{ lineHeight: 0 }}>
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeFile ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-3 border-b border-border shrink-0"
              style={{ height: "26px", fontSize: "10px", color: "var(--color-text-tertiary)", background: "var(--color-background-secondary)" }}>
              <span className="font-mono">
                project / <span style={{ color: LANG_COLORS[activeFile.type] }}>{activeFile.name}</span>
              </span>
              <div className="flex items-center gap-3">
                <span>{activeFile.lines} lines · {activeFile.size}</span>
                <button onClick={handleCopy} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  {copied ? <Check size={10} style={{ color: "#4ade80" }} /> : <Copy size={10} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 overflow-auto code-scroll" style={{ background: "#0d0d0d", scrollbarWidth: "thin", scrollbarColor: "#374151 transparent" }}>
              <div className="select-none shrink-0 text-right pt-3 px-2 font-mono border-r"
                style={{ fontSize: "11px", lineHeight: "18px", color: "#374151", borderColor: "#1f2937", minWidth: "40px" }}>
                {activeFile.content.trimEnd().split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <pre className="flex-1 pt-3 px-4 font-mono whitespace-pre"
                style={{ fontSize: "11px", lineHeight: "18px", margin: 0, minWidth: 0 }}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>

            <div className="flex items-center gap-3 px-3 shrink-0 border-t"
              style={{ height: "20px", fontSize: "10px", color: "var(--color-text-tertiary)", borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
              <span style={{ color: LANG_COLORS[activeFile.type] }}>{activeFile.type.toUpperCase()}</span>
              <span>UTF-8</span>
              <span className="ml-auto">Ln {activeFile.lines}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2"
            style={{ color: "var(--color-text-tertiary)" }}>
            <FileCode2 size={28} style={{ opacity: 0.25 }} />
            <span style={{ fontSize: "11px" }}>
              {hasCode ? "Click a file to open it" : "Generate a site to see code"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
