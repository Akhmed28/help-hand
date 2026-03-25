import { useState, useCallback, useEffect } from "react";

export type AutonomyLevel = "advisor" | "partner" | "cofounder";
export type ActivationMode = "button" | "keyword";
export type LLMProvider = "openai" | "anthropic";

export interface HelpHandSettings {
  enabled: boolean;
  openaiApiKey: string;
  anthropicApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  llmProvider: LLMProvider;
  autonomyLevel: AutonomyLevel;
  voiceEnabled: boolean;
  voiceSpeed: number;
  voiceVolume: number;
  activationMode: ActivationMode;
  analysisIntervalMinutes: number;
  language: string;
}

const STORAGE_KEY = "helphand_settings";
const SETTINGS_VERSION = 3; // bump to force-reset cached settings

const ENV_OPENAI_KEY = import.meta.env.VITE_HELPHAND_OPENAI_KEY ?? "";
const ENV_ELEVENLABS_KEY = import.meta.env.VITE_HELPHAND_ELEVENLABS_KEY ?? "";

const DEFAULT_SETTINGS: HelpHandSettings = {
  enabled: true,
  openaiApiKey: ENV_OPENAI_KEY,
  anthropicApiKey: "",
  elevenLabsApiKey: ENV_ELEVENLABS_KEY,
  elevenLabsVoiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
  llmProvider: "openai",
  autonomyLevel: "advisor",
  voiceEnabled: true,
  voiceSpeed: 1.0,
  voiceVolume: 0.8,
  activationMode: "button",
  analysisIntervalMinutes: 5,
  language: "ru",
};

function loadSettings(): HelpHandSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // If settings version is outdated, reset to defaults (keep API keys)
      if (!saved._version || saved._version < SETTINGS_VERSION) {
        const fresh = {
          ...DEFAULT_SETTINGS,
          openaiApiKey: saved.openaiApiKey || ENV_OPENAI_KEY,
          anthropicApiKey: saved.anthropicApiKey || "",
          elevenLabsApiKey: saved.elevenLabsApiKey || ENV_ELEVENLABS_KEY,
          elevenLabsVoiceId: saved.elevenLabsVoiceId || DEFAULT_SETTINGS.elevenLabsVoiceId,
          _version: SETTINGS_VERSION,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh as HelpHandSettings;
      }
      const merged = { ...DEFAULT_SETTINGS, ...saved };
      // If saved key is empty but env key exists, use the env key
      if (!merged.openaiApiKey && ENV_OPENAI_KEY) {
        merged.openaiApiKey = ENV_OPENAI_KEY;
      }
      if (!merged.elevenLabsApiKey && ENV_ELEVENLABS_KEY) {
        merged.elevenLabsApiKey = ENV_ELEVENLABS_KEY;
      }
      // Migrate old default interval (15 min) to new default (1 min)
      if (saved.analysisIntervalMinutes === 15) {
        merged.analysisIntervalMinutes = 1;
      }
      return merged;
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function useHelpHandSettings() {
  const [settings, setSettingsState] = useState<HelpHandSettings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<HelpHandSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, _version: SETTINGS_VERSION }));
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  const hasApiKey = Boolean(
    settings.llmProvider === "openai" ? settings.openaiApiKey : settings.anthropicApiKey
  );

  return { settings, updateSettings, resetSettings, hasApiKey };
}
