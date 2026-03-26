export type Msg = {
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  agentColor?: string;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `Ты — senior веб-разработчик и дизайнер. Создавай КРАСИВЫЕ, ПРОФЕССИОНАЛЬНЫЕ сайты.

ПРАВИЛА ОТВЕТА:
- Отвечай ТОЛЬКО кодом — полный HTML документ. Никаких пояснений.
- Начинай с <!DOCTYPE html>. Используй встроенные CSS и JS.
- НЕ используй внешние библиотеки и CDN.

КАЧЕСТВО ДИЗАЙНА (КРИТИЧЕСКИ ВАЖНО):
- Используй CSS Grid или Flexbox для layout. ВСЕГДА задавай max-width контейнерам (например max-width: 1200px; margin: 0 auto).
- Все изображения ОБЯЗАНЫ иметь: width: 100%; height: 200px; object-fit: cover; border-radius.
- Карточки: одинаковая высота, тень (box-shadow), скругления, hover-эффекты.
- Адаптивность: используй @media queries. На мобильных — одна колонка.
- Цветовая палитра: выбери 2-3 цвета и используй ВЕЗДЕ консистентно.
- Типография: используй system-ui или подключи Google Font через <link>. Иерархия заголовков.
- Отступы: min 16px padding в карточках, gap между элементами.
- НЕ ДОПУСКАЙ: текст выходящий за границы, изображения без ограничений размера, элементы без отступов.

ИЗОБРАЖЕНИЯ:
- Используй ТОЛЬКО https://images.unsplash.com/ с конкретными ID реальных фото.
- Для пиццы/еды: https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop (пицца), https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop (пицца 2), https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=400&h=300&fit=crop (пицца 3), https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop (пицца 4), https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=300&fit=crop (пицца 5), https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop (пицца 6)
- Для других тем: подбирай реальные Unsplash photo ID. Формат: https://images.unsplash.com/photo-XXXXXXXXXXX?w=400&h=300&fit=crop
- НИКОГДА не используй via.placeholder.com, picsum.photos, loremflickr.com, example.com
- КАЖДОЕ изображение должно иметь alt текст.

МОДИФИКАЦИЯ КОДА:
Если дан текущий код — модифицируй ИМЕННО его. НЕ генерируй заново. Сохрани существующий функционал.`;

export function extractHtmlCode(text: string): string | null {
  const codeBlockMatch = text.match(/```(?:html)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
    const start = text.indexOf("<!DOCTYPE html>") !== -1
      ? text.indexOf("<!DOCTYPE html>")
      : text.indexOf("<html");
    const end = text.lastIndexOf("</html>");
    if (end !== -1) return text.slice(start, end + 7);
    return text.slice(start);
  }

  return null;
}

export async function streamChat({
  messages,
  onDelta,
  onDone,
  currentCode,
}: {
  messages: Msg[];
  onDelta: (deltaText: string) => void;
  onDone: () => void | Promise<void>;
  currentCode?: string;
}) {
  const apiKey = import.meta.env.VITE_OPENAI_CODE_KEY || import.meta.env.VITE_HELPHAND_OPENAI_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API ключ не настроен. Добавьте VITE_OPENAI_CODE_KEY в .env.local");
  }

  const model = import.meta.env.VITE_CODE_MODEL || "gpt-5.2";

  // Filter out agent status messages (system role with agent field) before sending to AI
  const apiMessages = messages.filter(m => !(m.role === "system" && m.agent));

  // If there's existing code, include it so the AI modifies it instead of starting from scratch
  let systemPrompt = SYSTEM_PROMPT;
  if (currentCode) {
    const truncated = currentCode.length > 12000
      ? currentCode.slice(0, 12000) + "\n... (обрезано)"
      : currentCode;
    systemPrompt += `\n\n---\nТЕКУЩИЙ КОД ПРОЕКТА (модифицируй его, не создавай заново):\n\`\`\`html\n${truncated}\n\`\`\``;
  }

  const resp = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...apiMessages,
      ],
      stream: true,
    }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ error: { message: "Ошибка соединения" } }));
    const msg = errorData.error?.message || `HTTP ${resp.status}`;
    throw new Error(msg);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  function processLine(line: string): boolean {
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (line.startsWith(":") || line.trim() === "") return false;
    if (!line.startsWith("data: ")) return false;

    const jsonStr = line.slice(6).trim();
    if (jsonStr === "[DONE]") return true;

    try {
      const parsed = JSON.parse(jsonStr);
      const content = parsed.choices?.[0]?.delta?.content as string | undefined;
      if (content) onDelta(content);
    } catch {
      // Malformed JSON chunk — skip it instead of re-buffering (which could cause infinite loops)
    }
    return false;
  }

  let done = false;
  while (!done) {
    const result = await reader.read();
    if (result.done) break;
    textBuffer += decoder.decode(result.value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      const line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (processLine(line)) {
        done = true;
        break;
      }
    }
  }

  // Process any remaining data in the buffer
  if (textBuffer.trim()) {
    for (const raw of textBuffer.split("\n")) {
      if (!raw || raw.trim() === "") continue;
      processLine(raw);
    }
  }

  await onDone();
}

const AUTO_IMPROVE_PROMPT = `Ты — senior UI/UX дизайнер. Тебе дан HTML-код сайта. Твоя задача — УЛУЧШИТЬ его дизайн.

ПРАВИЛА:
- Отвечай ТОЛЬКО кодом — полный HTML документ. Никаких пояснений.
- Сохрани ВСЮ существующую функциональность и контент.
- НЕ меняй структуру и текст — только визуал.

ЧТО УЛУЧШАТЬ:
- Цветовая палитра: более гармоничные и современные цвета, градиенты.
- Типография: лучшая иерархия, межстрочные интервалы, размеры.
- Отступы и spacing: больше воздуха, ритм.
- Hover-эффекты и микро-анимации (transition, transform).
- Тени (box-shadow) для глубины.
- Скругления (border-radius) — современный вид.
- Кнопки: стильнее, с hover-эффектами.
- Общий "polish" — чтобы сайт выглядел профессионально и современно.

ИЗОБРАЖЕНИЯ: НЕ меняй URL изображений.`;

export async function streamAutoImprove({
  currentCode,
  onDelta,
  onDone,
}: {
  currentCode: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void | Promise<void>;
}) {
  const apiKey = import.meta.env.VITE_OPENAI_CODE_KEY || import.meta.env.VITE_HELPHAND_OPENAI_KEY;
  if (!apiKey) throw new Error("OpenAI API ключ не настроен");

  const model = import.meta.env.VITE_CODE_MODEL || "gpt-5.2";

  const truncated = currentCode.length > 12000
    ? currentCode.slice(0, 12000) + "\n... (обрезано)"
    : currentCode;

  const resp = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: AUTO_IMPROVE_PROMPT },
        { role: "user", content: `Улучши дизайн этого сайта:\n\n\`\`\`html\n${truncated}\n\`\`\`` },
      ],
      stream: true,
    }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ error: { message: "Ошибка соединения" } }));
    throw new Error(errorData.error?.message || `HTTP ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  function processLine(line: string): boolean {
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (line.startsWith(":") || line.trim() === "") return false;
    if (!line.startsWith("data: ")) return false;
    const jsonStr = line.slice(6).trim();
    if (jsonStr === "[DONE]") return true;
    try {
      const parsed = JSON.parse(jsonStr);
      const content = parsed.choices?.[0]?.delta?.content as string | undefined;
      if (content) onDelta(content);
    } catch {}
    return false;
  }

  let done = false;
  while (!done) {
    const result = await reader.read();
    if (result.done) break;
    textBuffer += decoder.decode(result.value, { stream: true });
    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      const line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (processLine(line)) { done = true; break; }
    }
  }
  if (textBuffer.trim()) {
    for (const raw of textBuffer.split("\n")) {
      if (!raw || raw.trim() === "") continue;
      processLine(raw);
    }
  }

  await onDone();
}

export async function getImprovementSummary(oldCode: string, newCode: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_CODE_KEY || import.meta.env.VITE_HELPHAND_OPENAI_KEY;
  if (!apiKey) return "Дизайн был улучшен.";

  const model = import.meta.env.VITE_CODE_MODEL || "gpt-5.2";

  const oldSnippet = oldCode.slice(0, 4000);
  const newSnippet = newCode.slice(0, 4000);

  try {
    const resp = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Ты — помощник. Сравни два HTML-кода сайта и кратко опиши, какие визуальные улучшения были сделаны. Ответь на русском языке, 1-3 предложения. Без технических деталей — опиши для обычного пользователя.",
          },
          {
            role: "user",
            content: `БЫЛО:\n\`\`\`html\n${oldSnippet}\n\`\`\`\n\nСТАЛО:\n\`\`\`html\n${newSnippet}\n\`\`\``,
          },
        ],
        max_completion_tokens: 200,
      }),
    });

    if (!resp.ok) return "Дизайн сайта был улучшен.";

    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || "Дизайн сайта был улучшен.";
  } catch {
    return "Дизайн сайта был улучшен.";
  }
}
