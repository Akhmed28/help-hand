import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  ClipboardList,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Hand,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ActionCard from "./ActionCard";
import type { HHChatMessage, HHActionLog } from "@/hooks/useHelpHand";
import type { AutonomyLevel } from "@/hooks/useHelpHandSettings";

type Tab = "chat" | "log";

interface HelpHandPanelProps {
  chatMessages: HHChatMessage[];
  actionLog: HHActionLog[];
  isThinking: boolean;
  autonomyLevel: AutonomyLevel;
  enabled: boolean;
  onSend: (text: string) => void;
  onExecuteAction: (id: string) => void;
  onDismissAction: (id: string) => void;
  onRevertAction: (id: string) => void;
  onOpenSettings: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  // Voice controls
  isListening?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  onToggleMic?: () => void;
  onToggleMute?: () => void;
  micSupported?: boolean;
}

const HelpHandPanel = ({
  chatMessages,
  actionLog,
  isThinking,
  autonomyLevel,
  enabled,
  onSend,
  onExecuteAction,
  onDismissAction,
  onRevertAction,
  onOpenSettings,
  collapsed,
  onToggleCollapse,
  isListening = false,
  isSpeaking = false,
  isMuted = false,
  onToggleMic,
  onToggleMute,
  micSupported = false,
}: HelpHandPanelProps) => {
  const [tab, setTab] = useState<Tab>("chat");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSend(input.trim());
    setInput("");
  };

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-3 px-1 bg-card border-l border-border w-10">
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-500/30 transition-colors mb-2"
          title="Открыть HelpHand"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="writing-mode-vertical text-[10px] text-purple-400 font-medium mt-2 rotate-180" style={{ writingMode: "vertical-rl" }}>
          HelpHand
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Hand size={12} className="text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-foreground">HelpHand</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Настройки"
          >
            <Settings size={13} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Свернуть"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Disabled state */}
      {!enabled && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-3">
            <Hand size={24} className="text-muted-foreground" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">HelpHand выключен</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Включите в настройках, чтобы получать советы от AI-сооснователя.
          </p>
          <button
            onClick={onOpenSettings}
            className="mt-3 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-[10px] font-medium hover:bg-purple-500/30 transition-colors"
          >
            Открыть настройки
          </button>
        </div>
      )}

      {/* Tabs */}
      {enabled && <div className="flex border-b border-border">
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 py-2 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors ${
            tab === "chat"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare size={11} /> Чат
        </button>
        <button
          onClick={() => setTab("log")}
          className={`flex-1 py-2 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors ${
            tab === "log"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList size={11} /> Действия
          {actionLog.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-400 text-[9px] flex items-center justify-center">
              {actionLog.length}
            </span>
          )}
        </button>
      </div>}

      {/* Content */}
      {enabled && (tab === "chat" ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                  <Hand size={24} className="text-purple-400" />
                </div>
                <p className="text-xs font-medium text-foreground">HelpHand</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Ваш AI-сооснователь. Наблюдает за кодом и предлагает улучшения.
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Напишите сообщение или подождите — HelpHand сам заговорит, когда увидит что-то важное.
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs bg-primary text-primary-foreground">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Hand size={11} className="text-purple-400" />
                        </div>
                        <div className="max-w-[90%] rounded-xl px-3 py-2 text-xs bg-secondary/50 text-foreground leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>

                      {/* Action card if present */}
                      {msg.action && (
                        <div className="ml-8">
                          <ActionCard
                            id={msg.id}
                            description={msg.action.description}
                            code={msg.action.code}
                            type={msg.type || "suggestion"}
                            autonomyLevel={autonomyLevel}
                            onExecute={onExecuteAction}
                            onDismiss={onDismissAction}
                            onRevert={onRevertAction}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Hand size={11} className="text-purple-400" />
                </div>
                <div className="bg-secondary/50 rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input + voice controls inline */}
          <form onSubmit={handleSubmit} className="p-2 border-t border-border">
            <div className="flex items-center gap-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Спросите HelpHand..."
                disabled={isThinking}
                className="flex-1 min-w-0 bg-secondary rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-purple-500/50 transition-colors"
              />
              {micSupported && (
                <>
                  <button
                    type="button"
                    onClick={onToggleMic}
                    disabled={isThinking}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                      isListening
                        ? "bg-red-500 text-white helphand-pulse-red"
                        : isSpeaking
                        ? "bg-purple-500 text-white helphand-pulse-purple"
                        : "bg-purple-600 text-white hover:bg-purple-500"
                    }`}
                    title={isListening ? "Остановить запись" : "Голосовой ввод"}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isMuted
                        ? "bg-gray-600 text-gray-300"
                        : "bg-purple-600/60 text-white hover:bg-purple-500/60"
                    }`}
                    title={isMuted ? "Включить голос AI" : "Выключить голос AI"}
                  >
                    {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                </>
              )}
              <Button
                type="submit"
                size="icon"
                disabled={isThinking || !input.trim()}
                className="shrink-0 rounded-lg h-8 w-8 bg-purple-600 hover:bg-purple-500"
              >
                {isThinking ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </Button>
            </div>
          </form>
        </>
      ) : (
        /* Action Log Tab */
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {actionLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <ClipboardList size={24} className="text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                Здесь будет лог действий HelpHand
              </p>
            </div>
          ) : (
            actionLog.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-lg border p-2.5 space-y-1.5 ${
                  entry.reverted
                    ? "border-orange-500/20 bg-orange-500/5 opacity-60"
                    : "border-border bg-secondary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-foreground leading-relaxed">
                    {entry.description}
                  </p>
                  {!entry.reverted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] text-orange-400 hover:text-orange-300 px-1.5 shrink-0"
                      onClick={() => onRevertAction(entry.id)}
                    >
                      <Undo2 size={10} className="mr-0.5" /> Откатить
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{entry.timestamp.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                  {entry.filesAffected.length > 0 && (
                    <span className="text-purple-400">{entry.filesAffected.join(", ")}</span>
                  )}
                  {entry.autoExecuted && !entry.reverted && (
                    <span className="text-emerald-400">авто</span>
                  )}
                  {entry.reverted && (
                    <span className="text-orange-400">откачено</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      ))}
    </div>
  );
};

export default HelpHandPanel;
