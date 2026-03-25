import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  onToggleMic: () => void;
  onToggleMute: () => void;
  isSupported: boolean;
}

const VoiceButton = ({
  isListening,
  isSpeaking,
  isMuted,
  onToggleMic,
  onToggleMute,
  isSupported,
}: VoiceButtonProps) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const wasDraggedRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      wasDraggedRef.current = false;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        wasDraggedRef.current = true;
      }

      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.startPosX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.startPosY + dy)),
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMicClick = () => {
    if (wasDraggedRef.current) return;
    onToggleMic();
  };

  if (!isSupported) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-2"
      style={{
        left: position.x,
        bottom: position.y,
        touchAction: "none",
      }}
    >
      {/* Main mic button */}
      <motion.button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleMicClick}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors select-none ${
          isListening
            ? "bg-red-500 text-white helphand-pulse-red"
            : isSpeaking
            ? "bg-purple-500 text-white helphand-pulse-purple"
            : "bg-purple-600 text-white hover:bg-purple-500"
        }`}
        whileHover={!isDragging ? { scale: 1.05 } : undefined}
        whileTap={!isDragging ? { scale: 0.95 } : undefined}
        title={isListening ? "Остановить запись" : "Голосовой ввод"}
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}

        {/* Pulsing ring when speaking */}
        {isSpeaking && (
          <span className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-30" />
        )}
      </motion.button>

      {/* Mute button */}
      <motion.button
        onClick={onToggleMute}
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
          isMuted
            ? "bg-gray-600 text-gray-300"
            : "bg-purple-600/80 text-white hover:bg-purple-500/80"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isMuted ? "Включить голос" : "Выключить голос"}
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </motion.button>
    </div>
  );
};

export default VoiceButton;
