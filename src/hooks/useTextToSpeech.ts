import { useRef, useState, useCallback } from "react";

interface UseTTSOptions {
  apiKey: string;
  voiceId: string;
  speed?: number;
  volume?: number;
  enabled?: boolean;
}

export function useTextToSpeech({
  apiKey,
  voiceId,
  speed = 1.0,
  volume = 0.8,
  enabled = true,
}: UseTTSOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);

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
    if (mediaSourceRef.current && mediaSourceRef.current.readyState === "open") {
      try { mediaSourceRef.current.endOfStream(); } catch {}
    }
    mediaSourceRef.current = null;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Streaming ElevenLabs TTS — starts playing as chunks arrive
  const speakStreaming = useCallback(
    async (text: string) => {
      if (!enabled || !apiKey || !text.trim()) return;
      stop();

      const controller = new AbortController();
      abortRef.current = controller;
      setIsSpeaking(true);

      try {
        const resp = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": apiKey,
            },
            signal: controller.signal,
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                speed,
              },
              output_format: "mp3_44100_128",
            }),
          }
        );

        if (!resp.ok || !resp.body) {
          console.warn("ElevenLabs error:", resp.status, "— falling back to browser voice");
          setIsSpeaking(false);
          // Fallback to browser TTS
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "ru-RU";
            utterance.rate = speed;
            utterance.volume = volume;
            setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
          }
          return;
        }

        // Try MediaSource streaming (Chrome/Edge)
        if (typeof MediaSource !== "undefined" && MediaSource.isTypeSupported("audio/mpeg")) {
          await playWithMediaSource(resp.body, controller, volume);
        } else {
          // Fallback: accumulate blob then play (Safari etc.)
          await playWithBlob(resp, volume);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.warn("ElevenLabs TTS failed, falling back to browser voice:", e);
          // Fallback to browser TTS on any error
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "ru-RU";
            utterance.rate = speed;
            utterance.volume = volume;
            setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            return;
          }
        }
        setIsSpeaking(false);
      }
    },
    [apiKey, voiceId, speed, volume, enabled, stop]
  );

  // Stream audio via MediaSource — starts playing almost immediately
  const playWithMediaSource = useCallback(
    async (body: ReadableStream<Uint8Array>, controller: AbortController, vol: number) => {
      return new Promise<void>((resolve, reject) => {
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        const audio = new Audio();
        audio.src = URL.createObjectURL(mediaSource);
        audio.volume = vol;
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audio.src);
          audioRef.current = null;
          mediaSourceRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audio.src);
          audioRef.current = null;
          mediaSourceRef.current = null;
          reject(new Error("Audio playback error"));
        };

        mediaSource.addEventListener("sourceopen", async () => {
          const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
          const reader = body.getReader();
          let playStarted = false;
          const queue: Uint8Array[] = [];
          let streamDone = false;

          const appendNext = () => {
            if (sourceBuffer.updating || queue.length === 0) return;
            const chunk = queue.shift()!;
            try {
              sourceBuffer.appendBuffer(chunk);
            } catch {
              // MediaSource may have been closed
            }
          };

          sourceBuffer.addEventListener("updateend", () => {
            if (!playStarted && audio.buffered.length > 0) {
              playStarted = true;
              audio.play().catch(() => {});
            }
            if (queue.length > 0) {
              appendNext();
            } else if (streamDone && mediaSource.readyState === "open") {
              try { mediaSource.endOfStream(); } catch {}
            }
          });

          try {
            while (true) {
              if (controller.signal.aborted) break;
              const { done, value } = await reader.read();
              if (done) {
                streamDone = true;
                if (!sourceBuffer.updating && queue.length === 0 && mediaSource.readyState === "open") {
                  try { mediaSource.endOfStream(); } catch {}
                }
                break;
              }
              queue.push(value);
              appendNext();
            }
          } catch (e) {
            if ((e as Error).name !== "AbortError") {
              reject(e);
            }
          }
        });
      });
    },
    []
  );

  // Fallback: download full blob then play
  const playWithBlob = useCallback(
    async (resp: Response, vol: number) => {
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = vol;
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

      await audio.play();
    },
    []
  );

  // Fallback: browser TTS if no ElevenLabs key
  const speakBrowser = useCallback(
    (text: string) => {
      if (!enabled || !text.trim()) return;
      if (!window.speechSynthesis) return;

      stop();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ru-RU";
      utterance.rate = speed;
      utterance.volume = volume;

      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [enabled, speed, volume, stop]
  );

  const speakAuto = useCallback(
    (text: string) => {
      if (apiKey) {
        speakStreaming(text);
      } else {
        speakBrowser(text);
      }
    },
    [apiKey, speakStreaming, speakBrowser]
  );

  return { isSpeaking, speak: speakAuto, stop };
}
