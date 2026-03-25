import type { HelpHandSettings } from "@/hooks/useHelpHandSettings";
import { HELPHAND_SYSTEM_PROMPT, HELPHAND_PROACTIVE_PROMPT } from "./helphandPrompt";

export interface HHMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProactiveResult {
  message: string;
  type: "observation" | "suggestion" | "warning" | "idea";
  action: { description: string; code?: string } | null;
}

async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  messages: HHMessage[],
  signal?: AbortSignal
): Promise<string> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${resp.status}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(
  apiKey: string,
  systemPrompt: string,
  messages: HHMessage[],
  signal?: AbortSignal
): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    signal,
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      system: systemPrompt,
      messages: messages.filter((m) => m.role !== "system").map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 1024,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${resp.status}`);
  }

  const data = await resp.json();
  return data.content?.[0]?.text ?? "";
}

async function callLLM(
  settings: HelpHandSettings,
  systemPrompt: string,
  messages: HHMessage[],
  signal?: AbortSignal
): Promise<string> {
  if (settings.llmProvider === "anthropic" && settings.anthropicApiKey) {
    return callAnthropic(settings.anthropicApiKey, systemPrompt, messages, signal);
  }
  if (settings.openaiApiKey) {
    return callOpenAI(settings.openaiApiKey, systemPrompt, messages, signal);
  }
  throw new Error("API ключ не настроен. Откройте настройки HelpHand.");
}

export interface ActionLogEntry {
  description: string;
  reverted: boolean;
  autoExecuted: boolean;
}

export async function sendHelpHandMessage(
  settings: HelpHandSettings,
  chatHistory: HHMessage[],
  userMessage: string,
  generatedCode?: string,
  signal?: AbortSignal,
  errors?: string[],
  recentChanges?: string,
  executedActions?: ActionLogEntry[],
  memoryContext?: string
): Promise<string> {
  // Build a system prompt that includes the current project code
  let systemPrompt = HELPHAND_SYSTEM_PROMPT;
  // Inject persistent memory from previous sessions
  if (memoryContext) {
    systemPrompt += memoryContext;
  }
  if (generatedCode) {
    const truncated = generatedCode.length > 12000
      ? generatedCode.slice(0, 12000) + "\n... (код обрезан)"
      : generatedCode;
    systemPrompt += `\n\n---\nТЕКУЩИЙ КОД ПРОЕКТА ПОЛЬЗОВАТЕЛЯ (ты его видишь и можешь анализировать):\n\`\`\`html\n${truncated}\n\`\`\``;
  }
  if (errors && errors.length > 0) {
    systemPrompt += `\n\n---\nОШИБКИ В ПРЕВЬЮ (из iframe):\n${errors.slice(-10).join("\n")}`;
  }
  if (recentChanges) {
    systemPrompt += `\n\n---\nНЕДАВНИЕ ИЗМЕНЕНИЯ:\n${recentChanges}`;
  }
  if (executedActions && executedActions.length > 0) {
    const actionLines = executedActions.map((a) => {
      let line = `- ${a.description}`;
      if (a.reverted) line += " (ОТКАЧЕНО пользователем)";
      if (a.autoExecuted) line += " (авто)";
      return line;
    });
    systemPrompt += `\n\n---\nВЫПОЛНЕННЫЕ ДЕЙСТВИЯ (команды, которые ты уже отправил билдеру):\n${actionLines.join("\n")}\n\nКогда пользователь спрашивает "что было изменено/добавлено" — ответь на основе этого списка. НЕ предлагай новые изменения, а расскажи что уже сделано.`;
  }

  const messages: HHMessage[] = [
    ...chatHistory,
    { role: "user", content: userMessage },
  ];

  const response = await callLLM(settings, systemPrompt, messages, signal);

  // If the response doesn't contain a builder command but should have one,
  // retry once with a forced nudge
  if (!response.includes(">>>BUILDER:") && looksLikeChangeRequest(userMessage)) {
    console.log("[HelpHand] Response missing >>>BUILDER: command, retrying with nudge...");
    const retryMessages: HHMessage[] = [
      ...messages,
      { role: "assistant", content: response },
      { role: "user", content: "Ты забыл добавить команду билдеру. Ответь ОДНИМ коротким предложением + обязательно включи >>>BUILDER: конкретная подробная задача<<<. НЕ ОБСУЖДАЙ, просто дай команду." },
    ];
    const retryResponse = await callLLM(settings, systemPrompt, retryMessages, signal);

    // If retry also failed, force-construct the builder command from LLM's own description
    if (!retryResponse.includes(">>>BUILDER:")) {
      console.log("[HelpHand] Retry also failed, force-constructing builder command");
      // Use the retry response as the builder task since it often contains the specific plan
      const combinedText = `${response}\n${retryResponse}`.trim();
      // Pick the more detailed text as the builder instruction
      const builderTask = retryResponse.length > response.length ? retryResponse : userMessage;
      const displayText = response.length > 5 ? response : retryResponse;
      return `${displayText} >>>BUILDER: ${builderTask}<<<`;
    }
    return retryResponse;
  }

  return response;
}

// Heuristic: does the user's message look like they want changes made?
function looksLikeChangeRequest(msg: string): boolean {
  const lower = msg.toLowerCase();

  // Questions / status checks are NOT change requests
  const questionPatterns = [
    // English
    "what was", "what did", "what changed", "what added", "was changed", "was added",
    "what happened", "what's different", "what is different", "what have you",
    "show me what", "tell me what", "did you change", "did you add", "did you do",
    "how is it", "how does it", "is it ready", "is it done", "are you done",
    "what's new", "what is new", "status", "progress",
    // Russian
    "что было", "что изменил", "что добавил", "что сделал", "что поменял",
    "что нового", "что произошло", "что ты сделал", "что ты изменил",
    "покажи что", "расскажи что", "как дела", "как идёт", "как идет",
    "готово", "сделано", "что там", "ну как", "ну что",
  ];
  if (questionPatterns.some((q) => lower.includes(q))) return false;

  // Also exclude messages that start with question words and are short
  if (/^(what|how|why|when|where|who|did|is|are|was|were|do|does|что|как|зачем|почему|когда|где|кто)\b/i.test(lower) && lower.length < 60) {
    return false;
  }

  const actionWords = [
    // Russian imperatives
    "добавь", "измени", "поменяй", "сделай", "убери", "удали", "исправь",
    "обнови", "замени", "создай", "настрой", "подготовь", "оптимизируй",
    "поставь", "включи", "выключи", "перенеси", "перепиши", "улучши",
    // English imperatives / intent
    "add", "change", "make", "fix", "update", "remove", "delete", "create",
    "prepare", "optimize", "improve", "set up", "ready", "publish",
    "need", "want", "better", "нужно", "хочу", "лучше",
  ];
  return actionWords.some((w) => lower.includes(w));
}

export async function runProactiveAnalysis(
  settings: HelpHandSettings,
  context: string,
  signal?: AbortSignal
): Promise<ProactiveResult | null> {
  const messages: HHMessage[] = [
    { role: "user", content: context },
  ];

  const response = await callLLM(settings, HELPHAND_PROACTIVE_PROMPT, messages, signal);
  const trimmed = response.trim();

  if (trimmed === "SILENCE" || trimmed.toUpperCase().includes("SILENCE")) {
    return null;
  }

  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ProactiveResult;
    }
  } catch {}

  // If not valid JSON, treat as a plain message
  return {
    message: trimmed,
    type: "observation",
    action: null,
  };
}
