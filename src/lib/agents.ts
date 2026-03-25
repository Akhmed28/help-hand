import { LayoutTemplate, Code, Palette, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Agent {
  name: string;
  icon: LucideIcon;
  color: string; // tailwind bg class
  textColor: string; // tailwind text class
  threshold: number; // 0-1, when this agent "activates" during streaming
  statusMessage: string;
}

export const AGENTS: Agent[] = [
  {
    name: "Архитектор",
    icon: LayoutTemplate,
    color: "bg-blue-500/20",
    textColor: "text-blue-400",
    threshold: 0,
    statusMessage: "Анализирую запрос и планирую структуру сайта...",
  },
  {
    name: "Разработчик",
    icon: Code,
    color: "bg-emerald-500/20",
    textColor: "text-emerald-400",
    threshold: 0.15,
    statusMessage: "Пишу HTML-разметку и структуру страницы...",
  },
  {
    name: "Дизайнер",
    icon: Palette,
    color: "bg-pink-500/20",
    textColor: "text-pink-400",
    threshold: 0.5,
    statusMessage: "Применяю стили и настраиваю адаптивность...",
  },
  {
    name: "Тестировщик",
    icon: ShieldCheck,
    color: "bg-orange-500/20",
    textColor: "text-orange-400",
    threshold: 0.85,
    statusMessage: "Проверяю код на ошибки и совместимость...",
  },
];

export const FINAL_AGENT = {
  name: "Команда",
  icon: Users,
  color: "bg-violet-500/20",
  textColor: "text-violet-400",
  statusMessage: "✅ Сайт полностью готов!",
};
