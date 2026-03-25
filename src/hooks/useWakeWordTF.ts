import { useEffect, useRef, useState } from "react";

interface UseWakeWordTFOptions {
  enabled?: boolean;
  onWake?: () => void;
  threshold?: number;
  paused?: boolean;
}

export function useWakeWordTF({
  enabled = false,
  onWake,
  threshold = 0.92,
  paused = false,
}: UseWakeWordTFOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef<any>(null);
  const onWakeRef = useRef(onWake);
  onWakeRef.current = onWake;
  const cooldownRef = useRef(false);
  const streamingRef = useRef(false);

  // Load the model once
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function loadModel() {
      try {
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();
        console.log("[WakeWordTF] TF.js ready, backend:", tf.getBackend());
        const speechCommands = await import("@tensorflow-models/speech-commands");

        const recognizer = speechCommands.create("BROWSER_FFT");
        await recognizer.ensureModelLoaded();

        if (cancelled) return;

        recognizerRef.current = recognizer;
        setIsReady(true);
        console.log("[WakeWordTF] Model loaded. Labels:", recognizer.wordLabels());
      } catch (e) {
        console.error("[WakeWordTF] Failed to load model:", e);
      }
    }

    loadModel();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Start/stop listening based on enabled + ready + paused
  useEffect(() => {
    const recognizer = recognizerRef.current;
    if (!recognizer || !isReady || !enabled) return;

    if (paused) {
      if (streamingRef.current) {
        recognizer.stopListening().catch(() => {});
        streamingRef.current = false;
        setIsListening(false);
      }
      return;
    }

    // Already streaming — don't start again
    if (streamingRef.current) return;

    const triggerWords = new Set(["go", "yes"]);
    const labels = recognizer.wordLabels() as string[];

    recognizer.listen(
      (result: { scores: Float32Array }) => {
        if (cooldownRef.current) return;

        const scores = Array.from(result.scores);
        const maxIndex = scores.indexOf(Math.max(...scores));
        const maxScore = scores[maxIndex];
        const word = labels[maxIndex];

        if (maxScore >= threshold && triggerWords.has(word)) {
          console.log(`[WakeWordTF] Detected "${word}" (${(maxScore * 100).toFixed(0)}%)`);

          cooldownRef.current = true;
          setTimeout(() => {
            cooldownRef.current = false;
          }, 3000);

          onWakeRef.current?.();
        }
      },
      {
        includeSpectrogram: false,
        probabilityThreshold: threshold * 0.5,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.5,
      }
    );

    streamingRef.current = true;
    setIsListening(true);
    console.log("[WakeWordTF] Listening for wake words:", [...triggerWords].join(", "));

    return () => {
      if (streamingRef.current) {
        recognizer.stopListening().catch(() => {});
        streamingRef.current = false;
        setIsListening(false);
      }
    };
  }, [enabled, isReady, paused, threshold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingRef.current && recognizerRef.current) {
        recognizerRef.current.stopListening().catch(() => {});
        streamingRef.current = false;
      }
    };
  }, []);

  return { isReady, isListening };
}
