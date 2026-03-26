import { Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { injectErrorCatcher } from "@/hooks/useIframeErrors";

type Viewport = "desktop" | "tablet" | "mobile";

interface PreviewPanelProps {
  code: string;
}

const viewportWidths: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

const PreviewPanel = ({ code }: PreviewPanelProps) => {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const safeCode = useMemo(() => {
    if (!code) return "";
    const hideScrollbarCSS = `<style>html,body{scrollbar-width:none;-ms-overflow-style:none;}::-webkit-scrollbar{display:none;}</style>`;
    let html = injectErrorCatcher(code);
    if (html.includes("<head>")) {
      html = html.replace("<head>", "<head>" + hideScrollbarCSS);
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", "<HEAD>" + hideScrollbarCSS);
    } else {
      html = hideScrollbarCSS + html;
    }
    return html;
  }, [code]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Browser chrome */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex-1 max-w-md mx-auto">
          <div className="bg-secondary rounded-md px-3 py-1 text-xs text-muted-foreground text-center truncate">
            preview.helphand.app
          </div>
        </div>

        <div className="flex items-center gap-1">
          {([
            ["desktop", Monitor],
            ["tablet", Tablet],
            ["mobile", Smartphone],
          ] as const).map(([vp, Icon]) => (
            <Button
              key={vp}
              variant={viewport === vp ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewport(vp)}
            >
              <Icon size={14} />
            </Button>
          ))}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-start justify-center overflow-hidden p-4 bg-muted/30">
        {code ? (
          <iframe
            srcDoc={safeCode}
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
            className="bg-white rounded-lg shadow-2xl transition-all duration-300"
            style={{
              width: viewportWidths[viewport],
              maxWidth: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
            title="Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-muted-foreground text-sm">
            Предпросмотр появится после генерации кода
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
