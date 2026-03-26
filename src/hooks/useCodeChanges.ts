import { useRef, useCallback } from "react";

export interface CodeChange {
  timestamp: number;
  summary: string;
}

const MAX_CHANGES = 10;

/**
 * Tracks changes between successive generated code versions.
 * Returns a human-readable summary of what changed.
 */
export function useCodeChanges() {
  const prevCodeRef = useRef<string>("");
  const changesRef = useRef<CodeChange[]>([]);

  const trackChange = useCallback((newCode: string): CodeChange[] => {
    const prev = prevCodeRef.current;
    prevCodeRef.current = newCode;

    if (!prev || !newCode) return changesRef.current;
    if (prev === newCode) return changesRef.current;

    const summary = diffSummary(prev, newCode);
    if (!summary) return changesRef.current;

    const change: CodeChange = {
      timestamp: Date.now(),
      summary,
    };

    changesRef.current = [...changesRef.current.slice(-(MAX_CHANGES - 1)), change];
    return changesRef.current;
  }, []);

  const getChanges = useCallback(() => changesRef.current, []);

  return { trackChange, getChanges };
}

function diffSummary(prev: string, next: string): string {
  const prevLines = prev.split("\n");
  const nextLines = next.split("\n");

  const prevSet = new Set(prevLines);
  const nextSet = new Set(nextLines);
  const added = nextLines.filter((l) => !prevSet.has(l)).length;
  const removed = prevLines.filter((l) => !nextSet.has(l)).length;

  if (added === 0 && removed === 0) return "";

  const parts: string[] = [];

  // Detect structural changes
  const prevTags = extractTags(prev);
  const nextTags = extractTags(next);
  const prevTagSet = new Set(prevTags);
  const nextTagSet = new Set(nextTags);
  const newTags = nextTags.filter((t) => !prevTagSet.has(t));
  const removedTags = prevTags.filter((t) => !nextTagSet.has(t));

  if (newTags.length > 0) parts.push(`Добавлены элементы: ${newTags.slice(0, 5).join(", ")}`);
  if (removedTags.length > 0) parts.push(`Удалены элементы: ${removedTags.slice(0, 5).join(", ")}`);

  // Style changes
  const prevStyles = (prev.match(/<style[\s\S]*?<\/style>/gi) || []).join("");
  const nextStyles = (next.match(/<style[\s\S]*?<\/style>/gi) || []).join("");
  if (prevStyles !== nextStyles) parts.push("Изменены стили");

  // Script changes
  const prevScripts = (prev.match(/<script[\s\S]*?<\/script>/gi) || []).join("");
  const nextScripts = (next.match(/<script[\s\S]*?<\/script>/gi) || []).join("");
  if (prevScripts !== nextScripts) parts.push("Изменена логика (JS)");

  if (parts.length === 0) {
    parts.push(`+${added}/-${removed} строк`);
  }

  return parts.join("; ");
}

function extractTags(html: string): string[] {
  const matches = html.match(/<(\w+)[\s>]/g) || [];
  return [...new Set(matches.map((m) => m.replace(/[<\s>]/g, "")))];
}
