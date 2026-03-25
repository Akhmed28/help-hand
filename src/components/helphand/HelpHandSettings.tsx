import { X, Brain, Volume2, Timer, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { HelpHandSettings as Settings, AutonomyLevel } from "@/hooks/useHelpHandSettings";

interface HelpHandSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onClearMemory?: () => void;
  hasMemory?: boolean;
}

const autonomyLevels: { value: AutonomyLevel; label: string; desc: string }[] = [
  { value: "advisor", label: "Советник", desc: "Только наблюдает и предлагает. Ничего не меняет без разрешения." },
  { value: "partner", label: "Напарник", desc: "Может сам исправлять мелкие баги. Крупные изменения — с разрешения." },
  { value: "cofounder", label: "Сооснователь", desc: "Делает всё, что считает нужным. Можно откатить любое действие." },
];

const languages = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "kk", label: "Қазақша" },
];

const HelpHandSettingsModal = ({
  open,
  onClose,
  settings,
  onUpdate,
  onReset,
  onClearMemory,
  hasMemory,
}: HelpHandSettingsProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
              <h2 className="text-sm font-semibold text-foreground">Настройки HelpHand</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">HelpHand включён</p>
                  <p className="text-[10px] text-muted-foreground">Проактивный AI-партнёр</p>
                </div>
                <button
                  onClick={() => onUpdate({ enabled: !settings.enabled })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    settings.enabled ? "bg-purple-500" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      settings.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Autonomy Level */}
              <Section icon={Brain} title="Уровень автономии">
                <div className="space-y-2">
                  {autonomyLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => onUpdate({ autonomyLevel: level.value })}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                        settings.autonomyLevel === level.value
                          ? "bg-purple-500/15 border border-purple-500/30"
                          : "bg-secondary/50 border border-border hover:border-border/80"
                      }`}
                    >
                      <p className={`text-xs font-medium ${
                        settings.autonomyLevel === level.value ? "text-purple-400" : "text-foreground"
                      }`}>
                        {level.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Voice */}
              <Section icon={Volume2} title="Голос">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">Голосовой вывод</p>
                    <button
                      onClick={() => onUpdate({ voiceEnabled: !settings.voiceEnabled })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        settings.voiceEnabled ? "bg-purple-500" : "bg-secondary"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          settings.voiceEnabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      Скорость: {settings.voiceSpeed.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={settings.voiceSpeed}
                      onChange={(e) => onUpdate({ voiceSpeed: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500 h-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      Громкость: {Math.round(settings.voiceVolume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.voiceVolume}
                      onChange={(e) => onUpdate({ voiceVolume: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500 h-1"
                    />
                  </div>
                </div>
              </Section>

              {/* Analysis Frequency */}
              <Section icon={Timer} title="Частота анализа">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">
                    Каждые {settings.analysisIntervalMinutes} мин
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={settings.analysisIntervalMinutes}
                    onChange={(e) =>
                      onUpdate({ analysisIntervalMinutes: parseInt(e.target.value) })
                    }
                    className="w-full accent-purple-500 h-1"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                    <span>1 мин</span>
                    <span>15 мин</span>
                    <span>30 мин</span>
                  </div>
                </div>
              </Section>

              {/* Language */}
              <Section icon={Globe} title="Язык общения">
                <div className="flex gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => onUpdate({ language: lang.value })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                        settings.language === lang.value
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-secondary text-muted-foreground border border-border"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Memory & Reset */}
              <div className="pt-2 border-t border-border space-y-1">
                {hasMemory && onClearMemory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-orange-400 hover:text-orange-300 w-full justify-start"
                    onClick={onClearMemory}
                  >
                    <Brain size={12} className="mr-1.5" /> Очистить память сессий
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive w-full justify-start"
                  onClick={onReset}
                >
                  Сбросить настройки
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="text-purple-400" />
        <h3 className="text-xs font-medium text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default HelpHandSettingsModal;
