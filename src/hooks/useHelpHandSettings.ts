import { useState, useCallback, useEffect } from "react";
import type { OpenAIVoice } from "@/hooks/useTextToSpeech";

export type AutonomyLevel = "advisor" | "partner" | "cofounder";
export type ActivationMode = "button" | "keyword";

export interface HelpHandSettings {
  enabled: boolean;
  openaiApiKey: string;
  openaiVoice: OpenAIVoice;
  autonomyLevel: AutonomyLevel;
  voiceEnabled: boolean;
  voiceSpeed: number;
  voiceVolume: number;
  activationMode: ActivationMode;
  analysisIntervalMinutes: number;
  language: string;
}

const STORAGE_KEY = "helphand_settings";
const SETTINGS_VERSION = 5; // bump to force-reset cached settings after migration

const ENV_OPENAI_KEY = import.meta.env.VITE_HELPHAND_OPENAI_KEY ?? "";

const DEFAULT_SETTINGS: HelpHandSettings = {
  enabled: true,
  openaiApiKey: ENV_OPENAI_KEY,
  openaiVoice: "nova",
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
      // If settings version is outdated, reset to defaults (keep API key)
      if (!saved._version || saved._version < SETTINGS_VERSION) {
        const fresh = {
          ...DEFAULT_SETTINGS,
          openaiApiKey: saved.openaiApiKey || ENV_OPENAI_KEY,
          _version: SETTINGS_VERSION,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh as HelpHandSettings;
      }
      const merged = { ...DEFAULT_SETTINGS, ...saved };
      if (!merged.openaiApiKey && ENV_OPENAI_KEY) {
        merged.openaiApiKey = ENV_OPENAI_KEY;
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

  const hasApiKey = Boolean(settings.openaiApiKey);

  return { settings, updateSettings, resetSettings, hasApiKey };
}
