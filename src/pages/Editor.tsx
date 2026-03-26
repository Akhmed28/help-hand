import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import EditorToolbar from "@/components/editor/EditorToolbar";
import ChatPanel from "@/components/editor/ChatPanel";
import PreviewPanel from "@/components/editor/PreviewPanel";
import FileTreePanel from "@/components/editor/FileTreePanel";
import StructurePanel from "@/components/editor/StructurePanel";
import HelpHandSettingsModal from "@/components/helphand/HelpHandSettings";
import { streamChat, streamAutoImprove, getImprovementSummary, extractHtmlCode, type Msg } from "@/lib/streamChat";
import { AGENTS, FINAL_AGENT, AUTO_IMPROVE_AGENT, AUTO_IMPROVE_DONE_AGENT } from "@/lib/agents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";
import { Monitor, Code2, GitFork, Sparkles, Check, X, Eye } from "lucide-react";
import { useHelpHandSettings } from "@/hooks/useHelpHandSettings";
import { useHelpHand } from "@/hooks/useHelpHand";
import { useSessionMemory, buildMemoryGreeting, buildMemoryContext } from "@/hooks/useSessionMemory";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useIframeErrors } from "@/hooks/useIframeErrors";
import { useCodeChanges } from "@/hooks/useCodeChanges";
import ErrorAlert from "@/components/helphand/ErrorAlert";

const SESSION_KEY = "helphand_session_id";
const CODE_SNAPSHOT_KEY = "helphand_code_snapshot";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ── Main area: tabbed view with Code / Structure / Preview ──
function MainArea({ code }: { code: string }) {
  const [view, setView] = useState<"code" | "structure" | "preview">("preview");

  const tabs = [
    { id: "code" as const, label: "Code", icon: Code2 },
    { id: "structure" as const, label: "Structure", icon: GitFork },
    { id: "preview" as const, label: "Preview", icon: Monitor },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toggle bar */}
      <div className="flex items-center gap-1 px-3 border-b border-border bg-card shrink-0" style={{ height: "38px" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors"
            style={{
              background: view === id ? "var(--color-background-secondary)" : "transparent",
              color: view === id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === "code" && <FileTreePanel hasCode={!!code} code={code} />}
        {view === "structure" && <StructurePanel code={code} />}
        {view === "preview" && <PreviewPanel code={code} />}
      </div>
    </div>
  );
}

const Editor = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const latestCodeRef = useRef("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [autoSubmitError, setAutoSubmitError] = useState("");
  const [queuedPrompt, setQueuedPrompt] = useState(() => searchParams.get("prompt")?.trim() ?? "");
  const agentIndexRef = useRef(0);
  const totalCharsRef = useRef(0);
  const promptFromUrl = searchParams.get("prompt")?.trim() ?? "";
  // HelpHand state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, updateSettings, resetSettings, hasApiKey } = useHelpHandSettings();

  const openaiKey = settings.openaiApiKey || import.meta.env.VITE_OPENAI_CODE_KEY || "";
  const tts = useTextToSpeech({
    apiKey: openaiKey,
    voice: settings.openaiVoice,
    speed: settings.voiceSpeed,
    volume: settings.voiceVolume,
    enabled: settings.voiceEnabled,
  });

  // Context observation
  const { errors: iframeErrors, clearErrors } = useIframeErrors();
  const { trackChange, getChanges } = useCodeChanges();

  // Track code changes whenever generatedCode updates
  const recentChangesRef = useRef("");
  useEffect(() => {
    if (!generatedCode) return;
    clearErrors();
    const changes = trackChange(generatedCode);
    recentChangesRef.current = changes.map((c) => c.summary).join("\n");
    localStorage.setItem(CODE_SNAPSHOT_KEY, generatedCode);
    latestCodeRef.current = generatedCode;
  }, [generatedCode, trackChange, clearErrors]);

  // Format iframe errors for HelpHand
  const errorStrings = iframeErrors.map((e) => `[${e.type}] ${e.message}`);

  // Error alert popup
  const [errorAlertDismissed, setErrorAlertDismissed] = useState(false);
  const prevErrorCountRef = useRef(0);

  useEffect(() => {
    if (iframeErrors.length > prevErrorCountRef.current) {
      setErrorAlertDismissed(false);
    }
    prevErrorCountRef.current = iframeErrors.length;
  }, [iframeErrors.length]);

  // Session memory
  const sessionMemory = useSessionMemory(settings);
  const memoryContext = buildMemoryContext(sessionMemory.memory);
  const memoryGreeting = buildMemoryGreeting(sessionMemory.memory);

  // Ref to forward HelpHand commands to the main builder
  const builderSendRef = useRef<(text: string) => void>(() => {});

  const helpHand = useHelpHand(
    settings, hasApiKey, generatedCode, tts.speak,
    (text) => builderSendRef.current(text),
    errorStrings,
    recentChangesRef.current,
    setGeneratedCode,
    memoryContext,
    memoryGreeting
  );

  const handleFixError = useCallback((errorSummary: string) => {
    setErrorAlertDismissed(true);
    clearErrors();
    helpHand.sendMessage(
      `В превью обнаружены ошибки. Пожалуйста, проанализируй и предложи исправление:\n\n${errorSummary}`
    );
  }, [helpHand.sendMessage, clearErrors]);

  // Auto-save session memory on page close and periodically
  const helpHandMessagesRef = useRef(helpHand.chatMessages);
  helpHandMessagesRef.current = helpHand.chatMessages;
  const generatedCodeMemRef = useRef(generatedCode);
  generatedCodeMemRef.current = generatedCode;

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (helpHandMessagesRef.current.length >= 3) {
        console.log("[SessionMemory] Page unloading, will generate summary next session");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    const interval = window.setInterval(() => {
      if (helpHandMessagesRef.current.length >= 3) {
        sessionMemory.saveSessionSummary(helpHandMessagesRef.current, generatedCodeMemRef.current);
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(interval);
      if (helpHandMessagesRef.current.length >= 3) {
        sessionMemory.saveSessionSummary(helpHandMessagesRef.current, generatedCodeMemRef.current);
      }
    };
  }, [sessionMemory.saveSessionSummary]);

  useEffect(() => {
    console.log("[Editor] mounted", { promptFromUrl, queuedPrompt });
  }, [promptFromUrl, queuedPrompt]);

  useEffect(() => {
    if (promptFromUrl && !queuedPrompt) {
      setQueuedPrompt(promptFromUrl);
    }
  }, [promptFromUrl, queuedPrompt]);

  useEffect(() => {
    if (!promptFromUrl) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("prompt");
    setSearchParams(nextParams, { replace: true });
  }, [promptFromUrl, searchParams, setSearchParams]);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const sessionId = getSessionId();

        const { data: convos } = await supabase
          .from("conversations")
          .select("id")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (convos && convos.length > 0) {
          const convId = convos[0].id;
          setConversationId(convId);

          const { data: msgs } = await supabase
            .from("chat_messages")
            .select("role, content, agent_name")
            .eq("conversation_id", convId)
            .order("created_at", { ascending: true });

          if (msgs && msgs.length > 0) {
            const validRoles = new Set(["user", "assistant", "system"]);
            const restored: Msg[] = msgs
              .filter((m: { role: string }) => validRoles.has(m.role))
              .map((m: { role: string; content: string; agent_name?: string }) => ({
                role: m.role as Msg["role"],
                content: m.content,
                ...(m.agent_name ? { agent: m.agent_name } : {}),
              }));
            setMessages(restored);

            // Prefer localStorage snapshot (preserves reverts) over Supabase
            const savedCode = localStorage.getItem(CODE_SNAPSHOT_KEY);
            if (savedCode) {
              setGeneratedCode(savedCode);
            } else {
              const lastAssistant = msgs.filter((m: { role: string; content: string }) => m.role === "assistant").pop();
              if (lastAssistant) {
                const html = extractHtmlCode(lastAssistant.content);
                if (html) setGeneratedCode(html);
              }
            }
          }
        }
      } catch (error) {
        console.error("[Editor] loadHistory failed", error);
      } finally {
        setIsEditorReady(true);
      }
    };

    loadHistory();
  }, []);

  const saveMessage = useCallback(async (convId: string, msg: Msg) => {
    await supabase.from("chat_messages").insert({
      conversation_id: convId,
      role: msg.role,
      content: msg.content,
      agent_name: msg.agent || null,
    });
  }, []);

  const conversationPromiseRef = useRef<Promise<string> | null>(null);
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId;
    if (conversationPromiseRef.current) return conversationPromiseRef.current;
    const promise = (async () => {
      const sessionId = getSessionId();
      const { data } = await supabase
        .from("conversations")
        .insert({ session_id: sessionId })
        .select("id")
        .single();
      if (!data) throw new Error("Failed to create conversation");
      setConversationId(data.id);
      return data.id;
    })();
    conversationPromiseRef.current = promise;
    return promise;
  }, [conversationId]);

  const addAgentMessage = useCallback((agent: typeof AGENTS[0] | typeof FINAL_AGENT) => {
    const msg: Msg = {
      role: "system",
      content: agent.statusMessage,
      agent: agent.name,
      agentColor: agent.textColor,
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  const handleSend = useCallback(
    async (input: string) => {
      console.log("[Editor] handleSend", { input, isEditorReady });
      const userMsg: Msg = { role: "user", content: input };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setImproveProposal(null); // dismiss any pending proposal
      if (autoImproveTimerRef.current) {
        window.clearTimeout(autoImproveTimerRef.current);
        autoImproveTimerRef.current = null;
      }

      agentIndexRef.current = 0;
      totalCharsRef.current = 0;

      const convId = await ensureConversation();
      await saveMessage(convId, userMsg);

      const firstAgentMsg = addAgentMessage(AGENTS[0]);
      await saveMessage(convId, firstAgentMsg);
      agentIndexRef.current = 1;

      let assistantSoFar = "";
      const estimatedTotal = 8000;

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        totalCharsRef.current += chunk.length;

        const progress = totalCharsRef.current / estimatedTotal;
        const nextIdx = agentIndexRef.current;
        if (nextIdx < AGENTS.length && progress >= AGENTS[nextIdx].threshold) {
          const agentMsg = addAgentMessage(AGENTS[nextIdx]);
          saveMessage(convId, agentMsg).catch(console.error);
          agentIndexRef.current = nextIdx + 1;
        }

        const html = extractHtmlCode(assistantSoFar);
        if (html) {
          setGeneratedCode(html);
          latestCodeRef.current = html;
        }
      };

      try {
        await streamChat({
          messages: [...messages, userMsg],
          currentCode: generatedCode || undefined,
          onDelta: (chunk) => upsertAssistant(chunk),
          onDone: async () => {
            try {
              // Flush any remaining agents that weren't activated during streaming
              while (agentIndexRef.current < AGENTS.length) {
                const agentMsg = addAgentMessage(AGENTS[agentIndexRef.current]);
                saveMessage(convId, agentMsg).catch(console.error);
                agentIndexRef.current++;
              }

              const html = extractHtmlCode(assistantSoFar);
              if (html) setGeneratedCode(html);

              const assistantMsg: Msg = { role: "assistant", content: assistantSoFar };
              await saveMessage(convId, assistantMsg);

              const finalMsg = addAgentMessage(FINAL_AGENT);
              await saveMessage(convId, finalMsg);

              // Schedule auto-improve for this user generation
              pendingAutoImproveRef.current = true;
            } finally {
              setIsLoading(false);
            }
          },
        });
      } catch (e) {
        console.error(e);
        setIsLoading(false);
        toast.error(e instanceof Error ? e.message : "Ошибка генерации");
      }
    },
    [messages, ensureConversation, saveMessage, addAgentMessage, generatedCode]
  );

  // ── Auto-improve design ~60s after user generation ──
  const autoImproveTimerRef = useRef<number | null>(null);
  const isAutoImprovingRef = useRef(false);
  const pendingAutoImproveRef = useRef(false); // set true only after user generation

  // Proposal state: improved code waiting for user accept/decline
  const [improveProposal, setImproveProposal] = useState<{
    improvedCode: string;
    originalCode: string;
    summary: string;
  } | null>(null);

  const handleAcceptImprove = useCallback(() => {
    if (!improveProposal) return;
    setGeneratedCode(improveProposal.improvedCode);
    latestCodeRef.current = improveProposal.improvedCode;
    toast.success("Улучшения приняты!");
    setImproveProposal(null);
  }, [improveProposal]);

  const handleDeclineImprove = useCallback(() => {
    if (!improveProposal) return;
    // Restore original code (already current, just clear proposal)
    setImproveProposal(null);
    toast("Улучшения отклонены");
  }, [improveProposal]);

  const runAutoImprove = useCallback(async () => {
    const code = latestCodeRef.current;
    if (!code || isAutoImprovingRef.current) return;

    isAutoImprovingRef.current = true;
    const oldCode = code;

    const improveMsg = addAgentMessage(AUTO_IMPROVE_AGENT);
    const convId = conversationId;
    if (convId) saveMessage(convId, improveMsg).catch(console.error);

    let improvedSoFar = "";

    try {
      await streamAutoImprove({
        currentCode: oldCode,
        onDelta: (chunk) => {
          improvedSoFar += chunk;
        },
        onDone: async () => {
          const html = extractHtmlCode(improvedSoFar);
          if (html && html !== oldCode) {
            const doneMsg = addAgentMessage(AUTO_IMPROVE_DONE_AGENT);
            if (convId) saveMessage(convId, doneMsg).catch(console.error);

            const summary = await getImprovementSummary(oldCode, html);

            const summaryMsg: Msg = {
              role: "system",
              content: `${summary} — примите или отклоните изменения.`,
              agent: AUTO_IMPROVE_DONE_AGENT.name,
              agentColor: AUTO_IMPROVE_DONE_AGENT.textColor,
            };
            setMessages(prev => [...prev, summaryMsg]);
            if (convId) saveMessage(convId, summaryMsg).catch(console.error);

            // Show proposal for user to accept/decline
            setImproveProposal({ improvedCode: html, originalCode: oldCode, summary });

            // Voice notification
            tts.speak(`Я подготовил улучшения дизайна. ${summary} Примите или отклоните изменения.`);
          }
        },
      });
    } catch (err) {
      console.error("[AutoImprove] failed:", err);
    } finally {
      isAutoImprovingRef.current = false;
    }
  }, [addAgentMessage, conversationId, saveMessage, tts]);

  // Schedule auto-improve ONCE after user-initiated generation completes
  useEffect(() => {
    // Only schedule when loading just finished and we have a pending flag
    if (isLoading || !generatedCode || !pendingAutoImproveRef.current) return;

    // Consume the flag so it only runs once
    pendingAutoImproveRef.current = false;

    // Clear any existing timer
    if (autoImproveTimerRef.current) {
      window.clearTimeout(autoImproveTimerRef.current);
    }

    autoImproveTimerRef.current = window.setTimeout(() => {
      autoImproveTimerRef.current = null;
      runAutoImprove();
    }, 60_000);

    return () => {
      if (autoImproveTimerRef.current) {
        window.clearTimeout(autoImproveTimerRef.current);
        autoImproveTimerRef.current = null;
      }
    };
  }, [isLoading, generatedCode, runAutoImprove]);

  // Keep ref in sync so HelpHand can forward commands to builder
  builderSendRef.current = handleSend;

  const handleExport = useCallback(async () => {
    if (!generatedCode) {
      toast.error("Нет кода для экспорта");
      return;
    }
    const zip = new JSZip();
    zip.file("index.html", generatedCode);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "helphand-project.zip";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Проект экспортирован!");
  }, [generatedCode]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Ссылка скопирована!");
  }, []);

  useEffect(() => {
    if (!queuedPrompt || isEditorReady) return;

    const timeoutId = window.setTimeout(() => {
      console.error("[Editor] auto-start timeout waiting for ready state", { queuedPrompt });
      setAutoSubmitError("Не удалось подключиться к AI. Пожалуйста, отправьте запрос вручную.");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [isEditorReady, queuedPrompt]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Error alert popup */}
      {!errorAlertDismissed && iframeErrors.length > 0 && (
        <ErrorAlert
          errors={iframeErrors}
          onFix={handleFixError}
          onDismiss={() => setErrorAlertDismissed(true)}
        />
      )}

      <EditorToolbar
        projectName="Мой проект"
        onExport={handleExport}
        onShare={handleShare}
        helpHandStatus={helpHand.status}
        isMuted={!settings.voiceEnabled}
        isSpeaking={tts.isSpeaking}
        onToggleMute={() => {
          const wasSpeaking = settings.voiceEnabled;
          updateSettings({ voiceEnabled: !settings.voiceEnabled });
          if (wasSpeaking) tts.stop();
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Auto-improve proposal banner */}
      {improveProposal && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-cyan-500/20 bg-cyan-500/5 shrink-0">
          <Sparkles size={16} className="text-cyan-400 shrink-0" />
          <p className="text-xs text-foreground flex-1 min-w-0 truncate">
            <span className="font-medium text-cyan-400">AI-Дизайнер</span>
            {" — "}
            {improveProposal.summary}
          </p>
          <button
            onClick={() => {
              // Preview the improved version
              setGeneratedCode(improveProposal.improvedCode);
              latestCodeRef.current = improveProposal.improvedCode;
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors shrink-0"
          >
            <Eye size={12} /> Превью
          </button>
          <button
            onClick={handleAcceptImprove}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0"
          >
            <Check size={12} /> Принять
          </button>
          <button
            onClick={() => {
              // Restore original and decline
              setGeneratedCode(improveProposal.originalCode);
              latestCodeRef.current = improveProposal.originalCode;
              handleDeclineImprove();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
          >
            <X size={12} /> Отклонить
          </button>
        </div>
      )}

      <div className="flex-1 hidden md:flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={25} minSize={18}>
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              onSend={handleSend}
              onSendToHH={helpHand.sendMessage}
              initialInput={queuedPrompt}
              autoSubmitPrompt={queuedPrompt}
              canAutoSubmit={isEditorReady}
              onAutoSubmitHandled={() => {
                setAutoSubmitError("");
                setQueuedPrompt("");
              }}
              inlineError={autoSubmitError}
              hhMessages={helpHand.chatMessages}
              hhIsThinking={helpHand.isThinking}
              autonomyLevel={settings.autonomyLevel}
              onExecuteAction={helpHand.executeAction}
              onDismissAction={helpHand.dismissAction}
              onRevertAction={helpHand.revertAction}
              onUndoRevert={helpHand.undoRevert}
              isSpeaking={tts.isSpeaking}
              actionLog={helpHand.actionLog}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75} minSize={40}>
            <MainArea code={generatedCode} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Settings modal */}
      <HelpHandSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
        onReset={resetSettings}
        onClearMemory={sessionMemory.clearMemory}
        hasMemory={sessionMemory.hasMemory}
      />

      <MobileTabs
        messages={messages}
        isLoading={isLoading}
        onSend={handleSend}
        onSendToHH={helpHand.sendMessage}
        generatedCode={generatedCode}
        initialInput={queuedPrompt}
        canAutoSubmit={isEditorReady}
        autoSubmitPrompt={queuedPrompt}
        onAutoSubmitHandled={() => {
          setAutoSubmitError("");
          setQueuedPrompt("");
        }}
        autoSubmitError={autoSubmitError}
        hhMessages={helpHand.chatMessages}
        hhIsThinking={helpHand.isThinking}
        autonomyLevel={settings.autonomyLevel}
        onExecuteAction={helpHand.executeAction}
        onDismissAction={helpHand.dismissAction}
        onRevertAction={helpHand.revertAction}
        onUndoRevert={helpHand.undoRevert}
        isSpeaking={tts.isSpeaking}
        actionLog={helpHand.actionLog}
      />
    </div>
  );
};

function MobileTabs({
  messages,
  isLoading,
  onSend,
  onSendToHH,
  generatedCode,
  initialInput,
  canAutoSubmit,
  autoSubmitPrompt,
  onAutoSubmitHandled,
  autoSubmitError,
  hhMessages,
  hhIsThinking,
  autonomyLevel,
  onExecuteAction,
  onDismissAction,
  onRevertAction,
  onUndoRevert,
  isSpeaking,
  actionLog,
}: {
  messages: Msg[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onSendToHH?: (text: string) => void;
  generatedCode: string;
  initialInput: string;
  canAutoSubmit: boolean;
  autoSubmitPrompt: string;
  onAutoSubmitHandled: () => void;
  autoSubmitError: string;
  hhMessages?: import("@/hooks/useHelpHand").HHChatMessage[];
  hhIsThinking?: boolean;
  autonomyLevel?: import("@/hooks/useHelpHandSettings").AutonomyLevel;
  onExecuteAction?: (id: string) => void;
  onDismissAction?: (id: string) => void;
  onRevertAction?: (id: string) => void;
  onUndoRevert?: (id: string) => void;
  isSpeaking?: boolean;
  actionLog?: import("@/hooks/useHelpHand").HHActionLog[];
}) {
  const [tab, setTab] = useState<"chat" | "code" | "structure" | "preview">("chat");

  return (
    <div className="flex-1 flex flex-col md:hidden">
      <div className="flex border-b border-border bg-card">
        {(["chat", "code", "structure", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            {t === "chat" ? "Чат" : t === "code" ? "Код" : t === "structure" ? "Граф" : "Превью"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "chat" && (
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSend={onSend}
            onSendToHH={onSendToHH}
            initialInput={initialInput}
            canAutoSubmit={canAutoSubmit}
            autoSubmitPrompt={autoSubmitPrompt}
            onAutoSubmitHandled={onAutoSubmitHandled}
            inlineError={autoSubmitError}
            hhMessages={hhMessages}
            hhIsThinking={hhIsThinking}
            autonomyLevel={autonomyLevel}
            onExecuteAction={onExecuteAction}
            onDismissAction={onDismissAction}
            onRevertAction={onRevertAction}
            onUndoRevert={onUndoRevert}
            isSpeaking={isSpeaking}
            actionLog={actionLog}
          />
        )}
        {tab === "code" && <FileTreePanel hasCode={!!generatedCode} code={generatedCode} />}
        {tab === "structure" && <StructurePanel code={generatedCode} />}
        {tab === "preview" && <PreviewPanel code={generatedCode} />}
      </div>
    </div>
  );
}

export default Editor;
