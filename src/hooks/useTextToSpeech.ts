import { useRef, useState, useCallback } from "react";

export type OpenAIVoice = "alloy" | "ash" | "coral" | "echo" | "fable" | "onyx" | "nova" | "sage" | "shimmer";

interface UseTTSOptions {
  apiKey: string;
  voice?: OpenAIVoice;
  speed?: number;
  volume?: number;
  enabled?: boolean;
}

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

export function useTextToSpeech({
  apiKey,
  voice = "nova",
  speed = 1.0,
  volume = 0.8,
  enabled = true,
}: UseTTSOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakOpenAI = useCallback(
    async (text: string) => {
      if (!enabled || !apiKey || !text.trim()) return;
      stop();

      const controller = new AbortController();
      abortRef.current = controller;
      setIsSpeaking(true);

      try {
        const resp = await fetch(OPENAI_TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice,
            speed,
            response_format: "mp3",
          }),
        });

        if (!resp.ok || !resp.body) {
          console.warn("OpenAI TTS error:", resp.status, "— falling back to browser voice");
          setIsSpeaking(false);
          speakBrowserFallback(text);
          return;
        }

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = volume;
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };

        await audio.play().catch(() => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.warn("OpenAI TTS failed, falling back to browser voice:", e);
          speakBrowserFallback(text);
          return;
        }
        setIsSpeaking(false);
      }
    },
    [apiKey, voice, speed, volume, enabled, stop]
  );

  const speakBrowserFallback = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ru-RU";
      utterance.rate = speed;
      utterance.volume = volume;
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [speed, volume]
  );

  const speakBrowser = useCallback(
    (text: string) => {
      if (!enabled || !text.trim()) return;
      stop();
      speakBrowserFallback(text);
    },
    [enabled, stop, speakBrowserFallback]
  );

  const speak = useCallback(
    (text: string) => {
      if (apiKey) {
        speakOpenAI(text);
      } else {
        speakBrowser(text);
      }
    },
    [apiKey, speakOpenAI, speakBrowser]
  );

  return { isSpeaking, speak, stop };
}
