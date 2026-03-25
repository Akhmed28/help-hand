import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const examples = [
  "Лендинг для кофейни",
  "Сайт строительной компании",
  "Интернет-магазин",
  "Блог о путешествиях",
];

const stats = [
  { value: "1 000+", label: "сайтов создано" },
  { value: "50+", label: "шаблонов" },
  { value: "30 сек", label: "среднее время" },
];

const HeroSection = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechRecognition({
      onResult: (text) => setPrompt((prev) => (prev ? prev + " " + text : text)),
    });

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleGenerate = () => {
    navigate("/editor", { state: { prompt } });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12 overflow-hidden">
      {/* Radial gradient overlays */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] md:w-[800px] md:h-[800px] rounded-full bg-primary/8 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[200px] h-[200px] md:w-[400px] md:h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-full glass text-xs text-muted-foreground mb-6 md:mb-10 tracking-wide uppercase">
            <Sparkles size={14} className="text-primary" />
            Конструктор сайтов на базе ИИ
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] mb-5 md:mb-8 text-gradient-hero max-w-5xl mx-auto tracking-tight">
            Создайте сайт за 30 секунд с помощью ИИ
          </h1>

          <p className="text-base md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 md:mb-14 leading-relaxed">
            Опишите свой проект — и получите готовый сайт. Без кода, без дизайнера, без ожидания.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative glass-strong rounded-2xl p-2 glow-accent">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={isListening && transcript ? transcript : prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Опишите сайт, который хотите создать..."
                  className="flex-1 bg-transparent border-none outline-none px-5 py-5 text-foreground placeholder:text-muted-foreground text-sm md:text-base"
                />
                {isSupported && (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isListening
                        ? "bg-red-500/20 text-red-400 pulse-recording"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    }`}
                    title={isListening ? "Остановить запись" : "Голосовой ввод"}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                )}
                <Button size="lg" className="rounded-xl shrink-0 btn-premium px-6" onClick={handleGenerate}>
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex justify-center mt-6 md:mt-8"
          >
            <Button
              onClick={handleGenerate}
              className="w-full md:w-auto text-lg md:text-xl py-5 px-10 md:py-6 md:px-14 rounded-2xl btn-premium glow-purple font-bold tracking-wide h-auto"
            >
              Начать создавать
              <ArrowRight size={22} className="ml-2" />
            </Button>
          </motion.div>

          <div className="flex overflow-x-auto hide-scrollbar md:flex-wrap justify-start md:justify-center gap-2.5 mt-6 md:mt-8 pb-2 md:pb-0">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="text-xs px-4 py-2.5 rounded-full glass hover:bg-white/10 hover:border-primary/20 text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="flex justify-center items-center gap-6 md:gap-12 mt-10 md:mt-16">
            {stats.map((s, i) => (
              <div key={s.label} className="text-center flex items-center gap-6 md:gap-12">
                <div>
                  <p className="text-xl md:text-4xl font-bold text-primary tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 tracking-wide uppercase">{s.label}</p>
                </div>
                {i < stats.length - 1 && (
                  <div className="w-px h-10 bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
