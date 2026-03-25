import { useRef, useState, useEffect } from "react";

interface UseWakeWordOptions {
  keyword?: string;
  enabled?: boolean;
  onWake?: () => void;
  lang?: string;
}

/**
 * Continuously listens for a wake word using Web Speech API.
 * When the keyword is detected, calls onWake() and pauses listening
 * to allow the main speech recognition to take over.
 */
export function useWakeWord({
  keyword = "helphand",
  enabled = false,
  onWake,
  lang = "ru-RU",
}: UseWakeWordOptions) {
  const [isActive, setIsActive] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onWakeRef = useRef(onWake);
  onWakeRef.current = onWake;
  const restartTimerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognitionAPI;

  useEffect(() => {
    if (!enabled || !SpeechRecognitionAPI) {
      // Stop everything
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      setIsActive(false);
      return;
    }

    const keywordLower = keyword.toLowerCase();
    // Variations of how "helphand" might be transcribed
    const variants = [keywordLower, "help hand", "хелп хенд", "хелпхенд", "help and"];

    function start() {
      if (pausedRef.current) return;

      // Clean up any existing instance
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch {}
      }

      const recognition = new SpeechRecognitionAPI!();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        console.log("[WakeWord] Listening for wake word...");
        setIsActive(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript.toLowerCase();
          const detected = variants.some((v) => text.includes(v));
          if (detected) {
            console.log("[WakeWord] Wake word detected:", text);

            // Stop wake word listening
            recognition.onend = null;
            try { recognition.stop(); } catch {}
            recognitionRef.current = null;
            setIsActive(false);
            pausedRef.current = true;

            // Trigger callback
            onWakeRef.current?.();

            // Resume wake word listening after 10s
            restartTimerRef.current = window.setTimeout(() => {
              pausedRef.current = false;
              start();
            }, 10000);
            return;
          }
        }
      };

      recognition.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        console.error("[WakeWord] Error:", e.error);
      };

      // Browser stops continuous recognition after silence — auto-restart
      recognition.onend = () => {
        setIsActive(false);
        if (!pausedRef.current) {
          restartTimerRef.current = window.setTimeout(() => {
            start();
          }, 500);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        console.error("[WakeWord] Start failed:", e);
        // Retry after a delay
        restartTimerRef.current = window.setTimeout(() => start(), 2000);
      }
    }

    pausedRef.current = false;
    start();

    return () => {
      pausedRef.current = true;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      setIsActive(false);
    };
  }, [enabled, SpeechRecognitionAPI, keyword, lang]);

  return { isActive, isSupported };
}
