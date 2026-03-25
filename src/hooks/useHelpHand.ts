import { useState, useCallback, useRef, useEffect } from "react";
import type { HelpHandSettings } from "./useHelpHandSettings";
import {
  sendHelpHandMessage,
  runProactiveAnalysis,
  type HHMessage,
  type ProactiveResult,
  type ActionLogEntry,
} from "@/lib/helphandApi";
import { buildProactiveContext } from "@/lib/helphandPrompt";

export type HelpHandStatus = "active" | "thinking" | "off";

export interface HHChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "observation" | "suggestion" | "warning" | "idea" | "chat";
  action?: { description: string; code?: string } | null;
}

export interface HHActionLog {
  id: string;
  description: string;
  timestamp: Date;
  filesAffected: string[];
  reverted: boolean;
  snapshot: string; // code before the change, used for revert
  revertSnapshot?: string; // code at the time of revert, used to undo revert
  autoExecuted: boolean; // true if AI executed without user approval
}

export function useHelpHand(
  settings: HelpHandSettings,
  hasApiKey: boolean,
  generatedCode: string,
  onSpeak?: (text: string) => void,
  onSendToBuilder?: (text: string) => void,
  iframeErrors?: string[],
  recentChanges?: string,
  onRestoreCode?: (code: string) => void,
  memoryContext?: string,
  memoryGreeting?: string | null
) {
  const [chatMessages, setChatMessages] = useState<HHChatMessage[]>([]);
  const chatMessagesRef = useRef<HHChatMessage[]>([]);
  chatMessagesRef.current = chatMessages;
  const [actionLog, setActionLog] = useState<HHActionLog[]>([]);
  const actionLogRef = useRef<HHActionLog[]>([]);
  actionLogRef.current = actionLog;
  const [status, setStatus] = useState<HelpHandStatus>(
    settings.enabled && hasApiKey ? "active" : "off"
  );
  const [isThinking, setIsThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastCodeRef = useRef<string>("");
  const lastAnalysisRef = useRef<number>(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const generatedCodeRef = useRef(generatedCode);
  generatedCodeRef.current = generatedCode;
  const iframeErrorsRef = useRef(iframeErrors);
  iframeErrorsRef.current = iframeErrors;
  const recentChangesRef = useRef(recentChanges);
  recentChangesRef.current = recentChanges;
  const memoryContextRef = useRef(memoryContext);
  memoryContextRef.current = memoryContext;

  // Inactivity tracking — timestamp of last user action
  const lastActivityRef = useRef<number>(Date.now());
  // Update on every user message or code change
  useEffect(() => { lastActivityRef.current = Date.now(); }, [generatedCode]);

  // Repeated error tracking
  const errorCountsRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    if (!iframeErrors || iframeErrors.length === 0) {
      errorCountsRef.current.clear();
      return;
    }
    for (const err of iframeErrors) {
      for (const msg of err.split("] ").slice(1)) {
        const key = msg || err;
        errorCountsRef.current.set(key, (errorCountsRef.current.get(key) || 0) + 1);
      }
    }
  }, [iframeErrors]);

  // Ref for auto-execute to avoid circular deps
  const tryAutoExecuteRef = useRef<(msgId: string, actionType?: string) => boolean>(() => false);

  // Update status when settings change
  useEffect(() => {
    if (!settings.enabled || !hasApiKey) {
      setStatus("off");
    } else if (!isThinking) {
      setStatus("active");
    }
  }, [settings.enabled, hasApiKey, isThinking]);

  // Send a chat message
  const sendMessage = useCallback(
    async (text: string) => {
      lastActivityRef.current = Date.now(); // user is active
      const s = settingsRef.current;
      const apiKey = s.llmProvider === "openai" ? s.openaiApiKey : s.anthropicApiKey;

      console.log("[HelpHand] sendMessage called", { text, enabled: s.enabled, hasKey: !!apiKey });

      if (!apiKey || !s.enabled) {
        console.warn("[HelpHand] Skipping — no API key or disabled");
        return;
      }

      const userMsg: HHChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
        type: "chat",
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setIsThinking(true);
      setStatus("thinking");

      try {
        // Build history with action context so LLM knows what was done
        const history: HHMessage[] = chatMessagesRef.current.slice(-20).map((m) => {
          let content = m.content;
          // If this assistant message had an action that was executed (action is now null but was present),
          // we lose that context. So check action log for related entries.
          if (m.role === "assistant" && !m.action && m.type === "suggestion") {
            content += "\n[Эта команда была выполнена билдером]";
          }
          return { role: m.role, content };
        });

        const controller = new AbortController();
        abortRef.current = controller;

        console.log("[HelpHand] Calling LLM...", { provider: s.llmProvider, historyLen: history.length, hasCode: !!generatedCodeRef.current });

        // Pass executed actions so LLM knows what was already done
        const executedActions: ActionLogEntry[] = actionLogRef.current.map((a) => ({
          description: a.description,
          reverted: a.reverted,
          autoExecuted: a.autoExecuted,
        }));

        const response = await sendHelpHandMessage(
          s,
          history,
          text,
          generatedCodeRef.current,
          controller.signal,
          iframeErrorsRef.current,
          recentChangesRef.current,
          executedActions,
          memoryContextRef.current
        );

        console.log("[HelpHand] Got response:", response.slice(0, 100));

        // Check for builder command in response
        const builderMatch = response.match(/>>>BUILDER:\s*([\s\S]*?)<<</)
        const cleanResponse = response.replace(/>>>BUILDER:\s*[\s\S]*?<<</, "").trim();

        const assistantMsgId = crypto.randomUUID();
        const assistantMsg: HHChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: cleanResponse,
          timestamp: new Date(),
          type: builderMatch ? "suggestion" : "chat",
          // If there's a builder command, show it as an action card
          action: builderMatch && builderMatch[1]
            ? { description: builderMatch[1].trim() }
            : null,
        };
        setChatMessages((prev) => [...prev, assistantMsg]);

        if (s.voiceEnabled && onSpeak) {
          onSpeak(cleanResponse);
        }

        // Auto-execute builder commands based on autonomy level
        if (assistantMsg.action) {
          setTimeout(() => tryAutoExecuteRef.current(assistantMsgId, "suggestion"), 500);
        }
      } catch (e) {
        console.error("[HelpHand] Error:", e);
        if ((e as Error).name !== "AbortError") {
          const errorMsg: HHChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Ошибка: ${(e as Error).message}`,
            timestamp: new Date(),
            type: "warning",
          };
          setChatMessages((prev) => [...prev, errorMsg]);
        }
      } finally {
        setIsThinking(false);
        const cur = settingsRef.current;
        const curKey = cur.llmProvider === "openai" ? cur.openaiApiKey : cur.anthropicApiKey;
        setStatus(cur.enabled && curKey ? "active" : "off");
      }
    },
    [onSpeak]
  );

  // Proactive analysis
  const runAnalysis = useCallback(async () => {
    const s = settingsRef.current;
    const apiKey = s.llmProvider === "openai" ? s.openaiApiKey : s.anthropicApiKey;
    if (!apiKey || !s.enabled) return;

    // Don't run if already thinking (e.g. processing a fix)
    if (isThinking) return;

    // Don't analyze if nothing changed recently
    const hasNewErrors = iframeErrors && iframeErrors.length > 0;
    const isInactive = Date.now() - lastActivityRef.current >= 120000; // 2+ min
    if (
      !hasNewErrors &&
      !isInactive &&
      generatedCode === lastCodeRef.current &&
      Date.now() - lastAnalysisRef.current < 60000
    ) {
      return;
    }

    lastCodeRef.current = generatedCode;
    lastAnalysisRef.current = Date.now();
    setIsThinking(true);
    setStatus("thinking");

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      // Calculate inactivity
      const inactiveMs = Date.now() - lastActivityRef.current;
      const inactiveMinutes = Math.floor(inactiveMs / 60000);

      // Get repeated errors (2+ occurrences)
      const repeatedErrors: { message: string; count: number }[] = [];
      errorCountsRef.current.forEach((count, message) => {
        if (count >= 2) repeatedErrors.push({ message, count });
      });

      const context = buildProactiveContext({
        generatedCode,
        conversationHistory: chatMessagesRef.current
          .slice(-10)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n"),
        errors: iframeErrors,
        recentChanges,
        inactiveMinutes: inactiveMinutes >= 2 ? inactiveMinutes : undefined,
        repeatedErrors: repeatedErrors.length > 0 ? repeatedErrors : undefined,
        memoryContext: memoryContextRef.current,
      });

      console.log("[HelpHand] Running proactive analysis...");
      const result = await runProactiveAnalysis(s, context, controller.signal);

      if (result) {
        console.log("[HelpHand] Proactive result:", result.message.slice(0, 100));
        const msgId = crypto.randomUUID();
        const msg: HHChatMessage = {
          id: msgId,
          role: "assistant",
          content: result.message,
          timestamp: new Date(),
          type: result.type,
          action: result.action,
        };
        setChatMessages((prev) => [...prev, msg]);

        if (s.voiceEnabled && onSpeak) {
          onSpeak(result.message);
        }

        // Auto-execute if autonomy level allows
        if (result.action) {
          // Small delay so the message renders first
          setTimeout(() => tryAutoExecuteRef.current(msgId, result.type), 500);
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error("[HelpHand] proactive analysis error:", e);
      }
    } finally {
      setIsThinking(false);
      const cur = settingsRef.current;
      const curKey = cur.llmProvider === "openai" ? cur.openaiApiKey : cur.anthropicApiKey;
      setStatus(cur.enabled && curKey ? "active" : "off");
    }
  }, [generatedCode, onSpeak, iframeErrors, recentChanges]);

  // Set up proactive analysis interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!settings.enabled || !hasApiKey) return;

    const ms = settings.analysisIntervalMinutes * 60 * 1000;
    intervalRef.current = window.setInterval(runAnalysis, ms);

    // Run first analysis after 30 seconds
    const initialTimeout = window.setTimeout(() => {
      if (generatedCode) runAnalysis();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(initialTimeout);
    };
  }, [settings.enabled, settings.analysisIntervalMinutes, hasApiKey, runAnalysis]);

  // Execute an action: save snapshot, forward to builder, log it
  const doExecuteAction = useCallback(
    (msgId: string, auto: boolean) => {
      const msg = chatMessagesRef.current.find((m) => m.id === msgId);
      if (!msg?.action) return;

      // Save snapshot of current code before the change
      const snapshot = generatedCodeRef.current;

      const logEntry: HHActionLog = {
        id: crypto.randomUUID(),
        description: msg.action.description,
        timestamp: new Date(),
        filesAffected: ["index.html"],
        reverted: false,
        snapshot,
        autoExecuted: auto,
      };
      setActionLog((prev) => [...prev, logEntry]);

      // Forward the action to the main AI builder
      if (onSendToBuilder) {
        const instruction = msg.action.code
          ? `${msg.action.description}\n\nВот код:\n${msg.action.code}`
          : msg.action.description;
        console.log("[HelpHand] Forwarding to builder:", instruction.slice(0, 120));
        onSendToBuilder(instruction);
      } else {
        console.warn("[HelpHand] No onSendToBuilder callback!");
      }

      // Remove the action card (mark as done)
      setChatMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, action: null } : m)
      );

      if (auto) {
        console.log("[HelpHand] Auto-executed action:", msg.action.description.slice(0, 80));
      }
    },
    [onSendToBuilder]
  );

  // Handle action card "Сделай" (user-initiated)
  const executeAction = useCallback(
    (msgId: string) => doExecuteAction(msgId, false),
    [doExecuteAction]
  );

  // Handle action card "Revert" — restore snapshot
  const revertAction = useCallback((logId: string) => {
    const codeBeforeRevert = generatedCodeRef.current;
    setActionLog((prev) => {
      const entry = prev.find((e) => e.id === logId);
      if (entry && !entry.reverted && entry.snapshot && onRestoreCode) {
        onRestoreCode(entry.snapshot);
        console.log("[HelpHand] Reverted action:", entry.description.slice(0, 80));
      }
      return prev.map((e) =>
        e.id === logId ? { ...e, reverted: true, revertSnapshot: codeBeforeRevert } : e
      );
    });
  }, [onRestoreCode]);

  // Undo a revert — restore the code that was there before reverting
  const undoRevert = useCallback((logId: string) => {
    setActionLog((prev) => {
      const entry = prev.find((e) => e.id === logId);
      if (entry && entry.reverted && entry.revertSnapshot && onRestoreCode) {
        onRestoreCode(entry.revertSnapshot);
        console.log("[HelpHand] Undo revert:", entry.description.slice(0, 80));
      }
      return prev.map((e) =>
        e.id === logId ? { ...e, reverted: false, revertSnapshot: undefined } : e
      );
    });
  }, [onRestoreCode]);

  // Auto-execute based on autonomy level
  const tryAutoExecute = useCallback(
    (msgId: string, actionType?: string) => {
      const level = settingsRef.current.autonomyLevel;

      if (level === "cofounder") {
        doExecuteAction(msgId, true);
        return true;
      }

      if (level === "partner") {
        const autoTypes = new Set(["warning", "observation"]);
        if (actionType && autoTypes.has(actionType)) {
          doExecuteAction(msgId, true);
          return true;
        }
      }

      // Advisor: never auto-execute
      return false;
    },
    [doExecuteAction]
  );
  tryAutoExecuteRef.current = tryAutoExecute;

  // Dismiss action
  const dismissAction = useCallback((msgId: string) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, action: null } : m
      )
    );
  }, []);

  // Proactive greeting on first load — uses memory if available
  const greetedRef = useRef(false);
  useEffect(() => {
    if (!settings.enabled || !hasApiKey || greetedRef.current) return;
    greetedRef.current = true;

    const timer = window.setTimeout(() => {
      const s = settingsRef.current;
      if (!s.enabled) return;

      const greeting = memoryGreeting
        || "Привет! Я HelpHand — твой AI-партнёр. Буду рядом, пока ты работаешь. Если замечу что-то важное — подскажу. А если нужна помощь, просто напиши или скажи.";
      const msg: HHChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: greeting,
        timestamp: new Date(),
        type: "chat",
      };
      setChatMessages((prev) => [...prev, msg]);

      if (s.voiceEnabled && onSpeak) {
        onSpeak(greeting);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [settings.enabled, hasApiKey, onSpeak, memoryGreeting]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    chatMessages,
    actionLog,
    status,
    isThinking,
    sendMessage,
    executeAction,
    revertAction,
    undoRevert,
    dismissAction,
    runAnalysis,
  };
}
