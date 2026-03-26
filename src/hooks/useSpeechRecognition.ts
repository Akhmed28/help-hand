import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionOptions {
  onResult?: (text: string) => void;
  lang?: string;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

const OPENAI_WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";

function getOpenAIKey(): string {
  return (
    import.meta.env.VITE_OPENAI_CODE_KEY ||
    import.meta.env.VITE_HELPHAND_OPENAI_KEY ||
    ""
  );
}

export function useSpeechRecognition({
  onResult,
  lang = "ru",
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Fallback refs for Web Speech API
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const apiKey = getOpenAIKey();

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  // Whisper is supported if we have an API key + getUserMedia
  const whisperSupported = !!apiKey && typeof navigator?.mediaDevices?.getUserMedia === "function";
  const browserSTTSupported = !!SpeechRecognitionAPI;
  const isSupported = whisperSupported || browserSTTSupported;

  const stopListening = useCallback(() => {
    // Stop Whisper recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    // Stop browser STT
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const transcribeWithWhisper = useCallback(
    async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("model", "whisper-1");
      formData.append("language", lang);

      try {
        const resp = await fetch(OPENAI_WHISPER_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
        });

        if (!resp.ok) {
          console.warn("Whisper API error:", resp.status);
          return;
        }

        const data = await resp.json();
        const text = data.text?.trim();
        if (text) {
          setTranscript(text);
          onResultRef.current?.(text);
          setTranscript("");
        }
      } catch (e) {
        console.warn("Whisper transcription failed:", e);
      }
    },
    [apiKey, lang]
  );

  const startWhisper = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Release mic
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setTranscript("...");
          await transcribeWithWhisper(blob);
        }
        setIsListening(false);
      };

      mediaRecorder.start();
      setIsListening(true);
      setTranscript("");
    } catch (e) {
      console.warn("Mic access failed:", e);
      setIsListening(false);
    }
  }, [transcribeWithWhisper]);

  const startBrowserSTT = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang === "ru" ? "ru-RU" : lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const current = finalTranscript || interimTranscript;
      setTranscript(current);

      if (finalTranscript) {
        onResultRef.current?.(finalTranscript);
        setTranscript("");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognitionAPI, lang]);

  const startListening = useCallback(() => {
    if (whisperSupported) {
      startWhisper();
    } else if (browserSTTSupported) {
      startBrowserSTT();
    }
  }, [whisperSupported, browserSTTSupported, startWhisper, startBrowserSTT]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  return { isListening, transcript, startListening, stopListening, isSupported };
}
