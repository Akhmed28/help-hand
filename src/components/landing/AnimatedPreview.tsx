import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const lines = [
  { type: "nav", delay: 0.5 },
  { type: "hero", delay: 1.2 },
  { type: "cards", delay: 2.0 },
  { type: "footer", delay: 2.8 },
];

const AnimatedPreview = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typedText, setTypedText] = useState("");
  const fullText = "Создай лендинг для кофейни с тёмной темой...";

  useEffect(() => {
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);
    return () => clearInterval(typeInterval);
  }, []);

  useEffect(() => {
    const timers = lines.map((line, idx) =>
      setTimeout(() => setVisibleCount(idx + 1), line.delay * 1000 + 2000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="py-16 md:py-32 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-2xl md:text-5xl font-bold text-center mb-4 md:mb-5 tracking-tight">Как это работает</h2>
          <p className="text-center text-muted-foreground text-base md:text-lg mb-8 md:mb-14">Вы пишете — ИИ создаёт</p>

          <div className="glass-strong rounded-3xl overflow-hidden glow-purple-lg hover:shadow-[0_0_100px_-20px_hsl(263_84%_55%_/_0.5)] transition-shadow duration-700">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-4">
                <div className="glass rounded-lg px-4 py-1.5 text-xs text-muted-foreground max-w-xs mx-auto text-center">
                  helphand.app/preview
                </div>
              </div>
            </div>

            {/* Prompt area */}
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-white/5">
              <div className="glass rounded-xl px-5 py-3 text-sm text-muted-foreground">
                {typedText}
                <span className="animate-pulse text-primary">|</span>
              </div>
            </div>

            {/* Generated sections */}
            <div className="p-4 md:p-6 space-y-4 min-h-[200px] md:min-h-[260px]">
              {visibleCount >= 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg h-10 flex items-center px-4">
                  <div className="w-16 h-3 rounded bg-primary/40" />
                  <div className="ml-auto flex gap-3">
                    <div className="w-10 h-2 rounded bg-white/20" />
                    <div className="w-10 h-2 rounded bg-white/20" />
                    <div className="w-10 h-2 rounded bg-white/20" />
                  </div>
                </motion.div>
              )}
              {visibleCount >= 2 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-6 text-center">
                  <div className="w-48 h-4 rounded bg-white/20 mx-auto mb-3" />
                  <div className="w-64 h-2 rounded bg-white/10 mx-auto mb-2" />
                  <div className="w-24 h-8 rounded-lg bg-primary/50 mx-auto mt-4" />
                </motion.div>
              )}
              {visibleCount >= 3 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-lg p-3">
                      <div className="w-full h-12 rounded bg-white/5 mb-2" />
                      <div className="w-3/4 h-2 rounded bg-white/10" />
                    </div>
                  ))}
                </motion.div>
              )}
              {visibleCount >= 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg h-8 flex items-center justify-center">
                  <div className="w-32 h-2 rounded bg-white/10" />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AnimatedPreview;
