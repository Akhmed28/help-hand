import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, User, Mic, MicOff, Hand, Code2, ClipboardList, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { AGENTS, FINAL_AGENT } from "@/lib/agents";
import type { Msg } from "@/lib/streamChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useWakeWordTF } from "@/hooks/useWakeWordTF";
import type { HHChatMessage, HHActionLog } from "@/hooks/useHelpHand";
import type { AutonomyLevel } from "@/hooks/useHelpHandSettings";
import ActionCard from "@/components/helphand/ActionCard";

type ChatMode = "code" | "ai";

interface ChatPanelProps {
  messages: Msg[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onSendToHH?: (text: string) => void;
  initialInput?: string;
  autoSubmitPrompt?: string;
  canAutoSubmit?: boolean;
  onAutoSubmitHandled?: () => void;
  inlineError?: string;
  // HelpHand integration
  hhMessages?: HHChatMessage[];
  hhIsThinking?: boolean;
  autonomyLevel?: AutonomyLevel;
  onExecuteAction?: (id: string) => void;
  onDismissAction?: (id: string) => void;
  onRevertAction?: (id: string) => void;
  onUndoRevert?: (id: string) => void;
  isSpeaking?: boolean;
  actionLog?: HHActionLog[];
}

const AgentAvatar = ({ agent, color, Icon }: { agent: string; color: string; Icon: any }) => (
  <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0 mt-0.5`}>
    <Icon size={14} />
  </div>
);

const ChatPanel = ({
  messages,
  isLoading,
  onSend,
  onSendToHH,
  initialInput = "",
  autoSubmitPrompt = "",
  canAutoSubmit = false,
  onAutoSubmitHandled,
  inlineError = "",
  hhMessages = [],
  hhIsThinking = false,
  autonomyLevel = "advisor",
  onExecuteAction,
  onDismissAction,
  onRevertAction,
  onUndoRevert,
  isSpeaking = false,
  actionLog = [],
}: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>("code");
  const [aiSubTab, setAiSubTab] = useState<"chat" | "log">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSubmittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const spaceHeldRef = useRef(false);

  // Unread HelpHand messages badge
  const [unreadHH, setUnreadHH] = useState(0);
  const lastSeenHHCountRef = useRef(hhMessages.length);

  // When new HH messages arrive while on "code" tab, increment unread
  useEffect(() => {
    const newCount = hhMessages.length;
    if (newCount > lastSeenHHCountRef.current && chatMode === "code") {
      setUnreadHH((prev) => prev + (newCount - lastSeenHHCountRef.current));
    }
    lastSeenHHCountRef.current = newCount;
  }, [hhMessages.length, chatMode]);

  // Clear unread when switching to AI tab
  useEffect(() => {
    if (chatMode === "ai") {
      setUnreadHH(0);
      lastSeenHHCountRef.current = hhMessages.length;
    }
  }, [chatMode, hhMessages.length]);

  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechRecognition({
      onResult: (text) => setInput((prev) => (prev ? prev + " " + text : text)),
    });

  // TensorFlow.js wake word — runs on its own AudioContext, no conflict with Web Speech API
  const wakeWord = useWakeWordTF({
    enabled: true,
    paused: isListening || isSpeaking, // pause while recording OR while AI is talking
    onWake: () => {
      console.log("[ChatPanel] Wake word detected — starting mic");
      if (!isListening) startListening();
    },
  });

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Push-to-talk: hold Space to record (only when input is not focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      // Don't capture if user is typing in any input or textarea
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement as HTMLElement)?.isContentEditable) return;
      if (e.repeat || spaceHeldRef.current) return;

      e.preventDefault();
      spaceHeldRef.current = true;
      if (!isListening) {
        startListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (!spaceHeldRef.current) return;

      e.preventDefault();
      spaceHeldRef.current = false;
      if (isListening) {
        stopListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, hhMessages]);

  useEffect(() => {
    if (initialInput && !input && !autoSubmittedRef.current) {
      setInput(initialInput);
    }
  }, [initialInput, input]);

  useEffect(() => {
    if (!autoSubmitPrompt) {
      autoSubmittedRef.current = false;
    }
  }, [autoSubmitPrompt]);

  useEffect(() => {
    if (!canAutoSubmit || !autoSubmitPrompt || autoSubmittedRef.current || isLoading) return;

    console.log("[ChatPanel] auto-submit prompt", { autoSubmitPrompt, canAutoSubmit });
    autoSubmittedRef.current = true;
    onSend(autoSubmitPrompt);
    setInput("");
    onAutoSubmitHandled?.();
  }, [autoSubmitPrompt, canAutoSubmit, isLoading, onAutoSubmitHandled, onSend]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (chatMode === "code") {
      if (isLoading) return;
      onSend(input.trim());
    } else {
      onSendToHH?.(input.trim());
    }
    setInput("");
  };

  const getAgentInfo = (msg: Msg) => {
    if (msg.agent) {
      const found = AGENTS.find(a => a.name === msg.agent);
      if (found) return found;
      if (msg.agent === FINAL_AGENT.name) return FINAL_AGENT;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Mode toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setChatMode("code")}
          className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            chatMode === "code"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2 size={13} /> Код
        </button>
        <button
          onClick={() => setChatMode("ai")}
          className={`relative flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            chatMode === "ai"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Hand size={13} /> AI-партнёр
          {unreadHH > 0 && chatMode !== "ai" && (
            <span className="absolute top-1.5 right-4 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-purple-500 text-white text-[10px] font-bold px-1 animate-pulse">
              {unreadHH}
            </span>
          )}
          {hhIsThinking && chatMode !== "ai" && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          )}
        </button>
      </div>

      {/* AI sub-tabs: Chat / Actions */}
      {chatMode === "ai" && (
        <div className="flex border-b border-border bg-secondary/30">
          <button
            onClick={() => setAiSubTab("chat")}
            className={`flex-1 py-1.5 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors ${
              aiSubTab === "chat"
                ? "text-purple-400 border-b border-purple-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Hand size={10} /> Чат
          </button>
          <button
            onClick={() => setAiSubTab("log")}
            className={`flex-1 py-1.5 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors ${
              aiSubTab === "log"
                ? "text-purple-400 border-b border-purple-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList size={10} /> Действия
            {actionLog.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-400 text-[9px] flex items-center justify-center">
                {actionLog.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Header with agent avatars — only in code mode */}
      {chatMode === "code" && (
        <div className="px-4 py-2.5 border-b border-border">
          <div className="flex gap-1.5">
            {AGENTS.map((agent) => (
              <div key={agent.name} className="flex items-center gap-1">
                <div className={`w-5 h-5 rounded-md ${agent.color} flex items-center justify-center`}>
                  <agent.icon size={10} className={agent.textColor} />
                </div>
                <span className={`text-[10px] ${agent.textColor}`}>{agent.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* CODE MODE */}
        {chatMode === "code" && (
          <>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-4">
                <div className="flex gap-2 mb-4">
                  {AGENTS.map((agent) => (
                    <div key={agent.name} className={`w-10 h-10 rounded-xl ${agent.color} flex items-center justify-center`}>
                      <agent.icon size={20} className={agent.textColor} />
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-foreground">Команда из 4 ИИ-агентов</p>
                <p className="text-xs mt-1">готова создать ваш сайт</p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const agentInfo = getAgentInfo(msg);

                if (msg.role === "system" && agentInfo) {
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-2.5"
                    >
                      <AgentAvatar agent={agentInfo.name} color={agentInfo.color} Icon={agentInfo.icon} />
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-semibold ${agentInfo.textColor} mb-0.5`}>
                          {agentInfo.name}
                        </span>
                        <div className="bg-secondary/50 rounded-xl px-3 py-2 text-xs text-muted-foreground italic">
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (msg.role === "user") {
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2.5 justify-end"
                    >
                      <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground break-words overflow-hidden">
                        {msg.content}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <User size={14} className="text-muted-foreground" />
                      </div>
                    </motion.div>
                  );
                }

                return null;
              })}
            </AnimatePresence>

            {isLoading && !messages.some(m => m.role === "system") && (() => {
              const FirstIcon = AGENTS[0].icon;
              return (
                <div className="flex gap-2.5">
                  <div className={`w-7 h-7 rounded-lg ${AGENTS[0].color} flex items-center justify-center shrink-0`}>
                    <FirstIcon size={14} className={AGENTS[0].textColor} />
                  </div>
                  <div className="bg-secondary rounded-xl px-3.5 py-2.5">
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* AI MODE */}
        {chatMode === "ai" && aiSubTab === "chat" && (
          <>
            {hhMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                  <Hand size={24} className="text-purple-400" />
                </div>
                <p className="text-xs font-medium text-foreground">AI-партнёр HelpHand</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Обсуждайте идеи, просите советы. HelpHand может предложить отправить команду в Код-чат.
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {hhMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.role === "user" ? (
                    <div className="flex gap-2.5 justify-end">
                      <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed bg-purple-600 text-white break-words overflow-hidden">
                        {msg.content}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <User size={14} className="text-muted-foreground" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Hand size={14} className="text-purple-400" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[10px] font-semibold text-purple-400 mb-0.5">HelpHand</span>
                          <div className="rounded-xl px-3 py-2 text-xs bg-purple-500/10 border border-purple-500/20 text-foreground leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                      {msg.action && onExecuteAction && onDismissAction && onRevertAction && (
                        <div className="ml-9">
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

            {hhIsThinking && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Hand size={14} className="text-purple-400" />
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-3.5 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ACTION LOG */}
        {chatMode === "ai" && aiSubTab === "log" && (() => {
          // Only the last entry gets revert/undo buttons to prevent out-of-order issues
          const lastIdx = actionLog.length - 1;
          return (
          <>
            {actionLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <ClipboardList size={24} className="text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Здесь будет лог действий HelpHand
                </p>
              </div>
            ) : (
              actionLog.map((entry, idx) => (
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
                    <div className="flex gap-1 shrink-0">
                      {idx === lastIdx && !entry.reverted && onRevertAction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-orange-400 hover:text-orange-300 px-1.5"
                          onClick={() => onRevertAction(entry.id)}
                        >
                          <Undo2 size={10} className="mr-0.5" /> Откатить
                        </Button>
                      )}
                      {idx === lastIdx && entry.reverted && onUndoRevert && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-emerald-400 hover:text-emerald-300 px-1.5"
                          onClick={() => onUndoRevert(entry.id)}
                        >
                          <Undo2 size={10} className="mr-0.5 rotate-180" /> Вернуть
                        </Button>
                      )}
                    </div>
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
          </>
        );
        })()}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        {inlineError && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {inlineError}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={isListening && transcript ? transcript : input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={chatMode === "code" ? "Опишите сайт..." : "Спросите AI-партнёра..."}
            disabled={chatMode === "code" && isLoading}
            className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors"
          />
          {isSupported && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={chatMode === "code" && isLoading}
              className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isListening
                  ? "bg-red-500/20 text-red-400 pulse-recording"
                  : wakeWord.isListening
                    ? "bg-purple-500/10 border border-purple-500/30 text-purple-400"
                    : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
              title={
                isListening
                  ? "Остановить запись"
                  : wakeWord.isListening
                    ? "Скажите «Go» или «Yes» для активации (или нажмите)"
                    : "Голосовой ввод (или зажмите Пробел)"
              }
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          )}
          <Button type="submit" size="icon" disabled={(chatMode === "code" && isLoading) || !input.trim()} className="shrink-0 rounded-lg">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
