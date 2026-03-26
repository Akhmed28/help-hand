import { ArrowLeft, Globe, Download, Share2, Volume2, VolumeX, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatusIndicator from "@/components/helphand/StatusIndicator";
import type { HelpHandStatus } from "@/hooks/useHelpHand";

interface EditorToolbarProps {
  projectName: string;
  onExport: () => void;
  onShare: () => void;
  helpHandStatus?: HelpHandStatus;
  isMuted?: boolean;
  isSpeaking?: boolean;
  onToggleMute?: () => void;
  onOpenSettings?: () => void;
}

const EditorToolbar = ({ projectName, onExport, onShare, helpHandStatus = "off", isMuted = false, isSpeaking = false, onToggleMute, onOpenSettings }: EditorToolbarProps) => {
  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm font-medium text-foreground">{projectName}</span>
        <StatusIndicator status={helpHandStatus} />
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isSpeaking && !isMuted
                ? "bg-purple-500/20 text-purple-400 helphand-pulse-purple"
                : isMuted
                ? "bg-secondary text-muted-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            title={isMuted ? "Включить голос AI" : "Выключить голос AI"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Настройки HelpHand"
          >
            <Settings size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={onShare}>
          <Share2 size={14} />
          <span className="hidden sm:inline">Поделиться</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={onExport}>
          <Download size={14} />
          <span className="hidden sm:inline">ZIP</span>
        </Button>
        <Button size="sm" className="text-xs gap-1.5" disabled title="Скоро">
          <Globe size={14} />
          <span className="hidden sm:inline">Опубликовать</span>
        </Button>
      </div>
    </header>
  );
};

export default EditorToolbar;
