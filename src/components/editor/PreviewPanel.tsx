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
  const safeCode = useMemo(() => (code ? injectErrorCatcher(code) : ""), [code]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Browser chrome */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
        </div>

        <div className="flex-1 mx-4 max-w-md">
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
      <div className="flex-1 flex items-start justify-center overflow-auto p-4 bg-muted/30">
        {code ? (
          <iframe
            srcDoc={safeCode}
            sandbox="allow-scripts allow-same-origin allow-modals"
            className="bg-white rounded-lg shadow-2xl transition-all duration-300"
            style={{
              width: viewportWidths[viewport],
              maxWidth: "100%",
              height: "100%",
              border: "none",
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
