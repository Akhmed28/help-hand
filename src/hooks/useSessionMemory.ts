import { useState, useCallback, useRef, useEffect } from "react";
import type { HelpHandSettings } from "./useHelpHandSettings";
import type { HHChatMessage } from "./useHelpHand";

const MEMORY_KEY = "helphand_session_memory";

export interface SessionMemory {
  /** What was the project about */
  projectDescription: string;
  /** Summary of the last session */
  lastSessionSummary: string;
  /** Key decisions made (e.g., "chose PostgreSQL over MongoDB") */
  decisions: string[];
  /** Open tasks / known issues not yet fixed */
  openTasks: string[];
  /** Plans discussed for the future */
  futurePlans: string[];
  /** Timestamp of last save */
  lastUpdated: string;
  /** How many sessions so far */
  sessionCount: number;
}

const EMPTY_MEMORY: SessionMemory = {
  projectDescription: "",
  lastSessionSummary: "",
  decisions: [],
  openTasks: [],
  futurePlans: [],
  lastUpdated: "",
  sessionCount: 0,
};

function loadMemory(): SessionMemory {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return { ...EMPTY_MEMORY };
    return { ...EMPTY_MEMORY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_MEMORY };
  }
}

function saveMemory(memory: SessionMemory) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

/**
 * Generate a session summary via LLM based on chat history
 */
async function generateSummary(
  settings: HelpHandSettings,
  chatMessages: HHChatMessage[],
  currentCode: string,
  previousMemory: SessionMemory
): Promise<Partial<SessionMemory> | null> {
  const apiKey = settings.openaiApiKey;
  if (!apiKey || chatMessages.length < 3) return null;

  // Build conversation excerpt (last 30 messages)
  const excerpt = chatMessages
    .slice(-30)
    .map((m) => `${m.role === "user" ? "User" : "HelpHand"}: ${m.content.slice(0, 200)}`)
    .join("\n");

  // Code summary — first 2000 chars
  const codeSummary = currentCode
    ? currentCode.slice(0, 2000)
    : "(нет кода)";

  const previousContext = previousMemory.lastSessionSummary
    ? `\nПРЕДЫДУЩАЯ СЕССИЯ:\n${previousMemory.lastSessionSummary}`
    : "";

  const previousDecisions = previousMemory.decisions.length > 0
    ? `\nРАНЕЕ ПРИНЯТЫЕ РЕШЕНИЯ:\n${previousMemory.decisions.join("\n")}`
    : "";

  const systemPrompt = `Ты анализируешь рабочую сессию AI-ассистента и пользователя. На основе разговора и кода сгенерируй JSON с полями:

{
  "projectDescription": "Краткое описание проекта (что это, для кого, стек) — 1-2 предложения",
  "lastSessionSummary": "Что делали в этой сессии — 2-3 предложения",
  "decisions": ["Решение 1", "Решение 2"],
  "openTasks": ["Задача 1 которую не завершили", "Известный баг"],
  "futurePlans": ["План на будущее 1"]
}

ПРАВИЛА:
- decisions: только КЛЮЧЕВЫЕ технические или дизайнерские решения. Не дублируй старые решения.
- openTasks: незавершённые задачи, баги, проблемы. Убери задачи которые уже решены.
- futurePlans: обсуждённые, но не начатые планы.
- Все на русском. Коротко и конкретно.
- Ответь ТОЛЬКО JSON, без пояснений.`;

  const userContent = `РАЗГОВОР ЭТОЙ СЕССИИ:\n${excerpt}\n\nТЕКУЩИЙ КОД (начало):\n${codeSummary}${previousContext}${previousDecisions}`;

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_completion_tokens: 512,
        temperature: 0.3,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const responseText = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as Partial<SessionMemory>;
  } catch (e) {
    console.error("[SessionMemory] Failed to generate summary:", e);
    return null;
  }
}

/**
 * Build a context-aware greeting based on previous memory
 */
export function buildMemoryGreeting(memory: SessionMemory): string | null {
  if (!memory.lastSessionSummary && !memory.projectDescription) return null;

  const parts: string[] = ["Привет! С возвращением."];

  if (memory.lastSessionSummary) {
    parts.push(`В прошлый раз: ${memory.lastSessionSummary}`);
  }

  if (memory.openTasks.length > 0) {
    const tasks = memory.openTasks.slice(0, 3).join(", ");
    parts.push(`Осталось: ${tasks}.`);
  }

  parts.push("Продолжим?");

  return parts.join(" ");
}

/**
 * Build a system prompt addon with memory context for the LLM
 */
export function buildMemoryContext(memory: SessionMemory): string {
  if (!memory.lastSessionSummary && !memory.projectDescription) return "";

  const parts: string[] = [];

  if (memory.projectDescription) {
    parts.push(`ПРОЕКТ: ${memory.projectDescription}`);
  }
  if (memory.lastSessionSummary) {
    parts.push(`ПРОШЛАЯ СЕССИЯ: ${memory.lastSessionSummary}`);
  }
  if (memory.decisions.length > 0) {
    parts.push(`ПРИНЯТЫЕ РЕШЕНИЯ:\n${memory.decisions.map((d) => `- ${d}`).join("\n")}`);
  }
  if (memory.openTasks.length > 0) {
    parts.push(`ОТКРЫТЫЕ ЗАДАЧИ:\n${memory.openTasks.map((t) => `- ${t}`).join("\n")}`);
  }
  if (memory.futurePlans.length > 0) {
    parts.push(`ПЛАНЫ:\n${memory.futurePlans.map((p) => `- ${p}`).join("\n")}`);
  }

  return `\n\n---\nПАМЯТЬ ИЗ ПРОШЛЫХ СЕССИЙ:\n${parts.join("\n\n")}`;
}

export function useSessionMemory(settings: HelpHandSettings) {
  const [memory, setMemory] = useState<SessionMemory>(loadMemory);
  const savingRef = useRef(false);
  const memoryRef = useRef(memory);
  memoryRef.current = memory;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Increment session count on mount (once per page load)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    setMemory((prev) => {
      const updated = { ...prev, sessionCount: prev.sessionCount + 1 };
      saveMemory(updated);
      return updated;
    });
  }, []);

  /**
   * Save session memory — call on session end (beforeunload, manual, or periodic)
   */
  const saveSessionSummary = useCallback(
    async (chatMessages: HHChatMessage[], currentCode: string) => {
      if (savingRef.current) return;
      if (chatMessages.length < 3) return; // not enough context
      savingRef.current = true;

      const currentMemory = memoryRef.current;

      try {
        console.log("[SessionMemory] Generating session summary...");
        const result = await generateSummary(
          settingsRef.current,
          chatMessages,
          currentCode,
          currentMemory
        );

        if (result) {
          const updated: SessionMemory = {
            projectDescription: result.projectDescription || currentMemory.projectDescription,
            lastSessionSummary: result.lastSessionSummary || currentMemory.lastSessionSummary,
            // Merge decisions (keep old + add new, deduplicate)
            decisions: dedup([
              ...currentMemory.decisions,
              ...(result.decisions || []),
            ]).slice(-10),
            // Replace open tasks with latest analysis
            openTasks: (result.openTasks || currentMemory.openTasks).slice(-10),
            // Merge future plans
            futurePlans: dedup([
              ...currentMemory.futurePlans,
              ...(result.futurePlans || []),
            ]).slice(-10),
            lastUpdated: new Date().toISOString(),
            sessionCount: currentMemory.sessionCount,
          };
          saveMemory(updated);
          setMemory(updated);
          console.log("[SessionMemory] Saved:", updated);
        }
      } catch (e) {
        console.error("[SessionMemory] Save error:", e);
      } finally {
        savingRef.current = false;
      }
    },
    []
  );

  const clearMemory = useCallback(() => {
    localStorage.removeItem(MEMORY_KEY);
    setMemory({ ...EMPTY_MEMORY });
  }, []);

  return {
    memory,
    saveSessionSummary,
    clearMemory,
    hasMemory: !!memory.lastSessionSummary || !!memory.projectDescription,
  };
}

/** Simple deduplication for string arrays */
function dedup(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((s) => {
    const key = s.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
