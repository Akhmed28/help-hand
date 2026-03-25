import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import EditorToolbar from "@/components/editor/EditorToolbar";
import ChatPanel from "@/components/editor/ChatPanel";
import PreviewPanel from "@/components/editor/PreviewPanel";
import HelpHandSettingsModal from "@/components/helphand/HelpHandSettings";
import { streamChat, extractHtmlCode, type Msg } from "@/lib/streamChat";
import { AGENTS, FINAL_AGENT } from "@/lib/agents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";
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

const Editor = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
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

  const tts = useTextToSpeech({
    apiKey: settings.elevenLabsApiKey,
    voiceId: settings.elevenLabsVoiceId,
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
    clearErrors(); // clear old errors when new code is rendered
    const changes = trackChange(generatedCode);
    recentChangesRef.current = changes.map((c) => c.summary).join("\n");
    // Persist current code so reverts survive page refresh
    localStorage.setItem(CODE_SNAPSHOT_KEY, generatedCode);
  }, [generatedCode, trackChange, clearErrors]);

  // Format iframe errors for HelpHand
  const errorStrings = iframeErrors.map((e) => `[${e.type}] ${e.message}`);

  // Error alert popup
  const [errorAlertDismissed, setErrorAlertDismissed] = useState(false);
  const prevErrorCountRef = useRef(0);

  // Show alert again when new errors arrive
  useEffect(() => {
    if (iframeErrors.length > prevErrorCountRef.current) {
      setErrorAlertDismissed(false);
    }
    prevErrorCountRef.current = iframeErrors.length;
  }, [iframeErrors.length]);

  // Session memory — persistent across browser sessions
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
    setGeneratedCode, // onRestoreCode — for reverting actions
    memoryContext,
    memoryGreeting
  );

  const handleFixError = useCallback((errorSummary: string) => {
    setErrorAlertDismissed(true);
    clearErrors(); // clear immediately so proactive analysis doesn't re-suggest
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
    // Save memory when user leaves the page
    const handleBeforeUnload = () => {
      if (helpHandMessagesRef.current.length >= 3) {
        // Use sendBeacon-compatible approach: save synchronously what we can
        // The full LLM summary will be generated next time if needed
        console.log("[SessionMemory] Page unloading, will generate summary next session");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Periodic save every 5 minutes if there's enough conversation
    const interval = window.setInterval(() => {
      if (helpHandMessagesRef.current.length >= 3) {
        sessionMemory.saveSessionSummary(helpHandMessagesRef.current, generatedCodeMemRef.current);
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(interval);
      // Save on unmount (e.g., navigation away)
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
            const restored: Msg[] = msgs.map((m: any) => ({
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
              const lastAssistant = msgs.filter((m: any) => m.role === "assistant").pop();
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

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId;
    const sessionId = getSessionId();
    const { data } = await supabase
      .from("conversations")
      .insert({ session_id: sessionId })
      .select("id")
      .single();
    const id = data!.id;
    setConversationId(id);
    return id;
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

      agentIndexRef.current = 0;
      totalCharsRef.current = 0;

      const convId = await ensureConversation();
      await saveMessage(convId, userMsg);

      // Add first agent message immediately
      const firstAgentMsg = addAgentMessage(AGENTS[0]);
      await saveMessage(convId, firstAgentMsg);
      agentIndexRef.current = 1;

      let assistantSoFar = "";
      
      // Estimate ~4000 chars for a typical response
      const estimatedTotal = 4000;

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        totalCharsRef.current += chunk.length;

        // Check if next agent should activate
        const progress = totalCharsRef.current / estimatedTotal;
        const nextIdx = agentIndexRef.current;
        if (nextIdx < AGENTS.length && progress >= AGENTS[nextIdx].threshold) {
          const agentMsg = addAgentMessage(AGENTS[nextIdx]);
          saveMessage(convId, agentMsg);
          agentIndexRef.current = nextIdx + 1;
        }

        // Try to extract and render code as it streams
        const html = extractHtmlCode(assistantSoFar);
        if (html) setGeneratedCode(html);
      };

      try {
        await streamChat({
          messages: [...messages, userMsg],
          currentCode: generatedCode || undefined,
          onDelta: (chunk) => upsertAssistant(chunk),
          onDone: async () => {
            setIsLoading(false);
            const html = extractHtmlCode(assistantSoFar);
            if (html) setGeneratedCode(html);

            // Save full assistant message (hidden in chat but persisted)
            const assistantMsg: Msg = { role: "assistant", content: assistantSoFar };
            await saveMessage(convId, assistantMsg);

            // Final "done" agent message
            const finalMsg = addAgentMessage(FINAL_AGENT);
            await saveMessage(convId, finalMsg);
          },
        });
      } catch (e) {
        console.error(e);
        setIsLoading(false);
        toast.error(e instanceof Error ? e.message : "Ошибка генерации");
      }
    },
    [messages, ensureConversation, saveMessage, addAgentMessage]
  );

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

      <div className="flex-1 hidden md:block">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={30} minSize={18}>
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
          <ResizablePanel defaultSize={70} minSize={40}>
            <PreviewPanel code={generatedCode} />
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
        generatedCode={generatedCode}
        initialInput={queuedPrompt}
        canAutoSubmit={isEditorReady}
        autoSubmitPrompt={queuedPrompt}
        onAutoSubmitHandled={() => {
          setAutoSubmitError("");
          setQueuedPrompt("");
        }}
        autoSubmitError={autoSubmitError}
      />
    </div>
  );
};

function MobileTabs({
  messages,
  isLoading,
  onSend,
  generatedCode,
  initialInput,
  canAutoSubmit,
  autoSubmitPrompt,
  onAutoSubmitHandled,
  autoSubmitError,
}: {
  messages: Msg[];
  isLoading: boolean;
  onSend: (text: string) => void;
  generatedCode: string;
  initialInput: string;
  canAutoSubmit: boolean;
  autoSubmitPrompt: string;
  onAutoSubmitHandled: () => void;
  autoSubmitError: string;
}) {
  const [tab, setTab] = useState<"chat" | "preview">("chat");

  return (
    <div className="flex-1 flex flex-col md:hidden">
      <div className="flex border-b border-border bg-card">
        {(["chat", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            {t === "chat" ? "Чат" : "Превью"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "chat" && <ChatPanel messages={messages} isLoading={isLoading} onSend={onSend} initialInput={initialInput} canAutoSubmit={canAutoSubmit} autoSubmitPrompt={autoSubmitPrompt} onAutoSubmitHandled={onAutoSubmitHandled} inlineError={autoSubmitError} />}
        {tab === "preview" && <PreviewPanel code={generatedCode} />}
      </div>
    </div>
  );
}

export default Editor;
