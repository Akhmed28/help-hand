import { AlertTriangle, X, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { IframeError } from "@/hooks/useIframeErrors";

interface ErrorAlertProps {
  errors: IframeError[];
  onFix: (errorSummary: string) => void;
  onDismiss: () => void;
}

const ErrorAlert = ({ errors, onFix, onDismiss }: ErrorAlertProps) => {
  const [expanded, setExpanded] = useState(false);

  if (errors.length === 0) return null;

  const latestError = errors[errors.length - 1];
  const errorSummary = errors
    .slice(-5)
    .map((e) => `[${e.type}] ${e.message}`)
    .join("\n");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg"
      >
        <div className="rounded-xl border border-orange-500/30 bg-card shadow-2xl shadow-orange-500/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-orange-500/10 border-b border-orange-500/20">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-300">
                Ошибка в превью
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {errors.length === 1
                  ? "Обнаружена 1 ошибка"
                  : `Обнаружено ${errors.length} ошибок`}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Error message */}
          <div className="px-4 py-3">
            <div className="bg-black/30 rounded-lg px-3 py-2.5 border border-border">
              <code className="text-xs text-orange-300 font-mono leading-relaxed break-all">
                {latestError.message}
              </code>
            </div>

            {/* Expandable error list */}
            {errors.length > 1 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? "Скрыть" : `Показать все ${errors.length} ошибок`}
              </button>
            )}

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                    {errors.slice(0, -1).reverse().map((err, i) => (
                      <div
                        key={i}
                        className="bg-black/20 rounded px-2.5 py-1.5 border border-border/50"
                      >
                        <code className="text-[10px] text-muted-foreground font-mono break-all">
                          [{err.type}] {err.message}
                        </code>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-4 py-3 border-t border-border bg-secondary/30">
            <Button
              onClick={() => onFix(errorSummary)}
              className="flex-1 h-9 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium gap-1.5"
            >
              <Wrench size={14} />
              Исправить ошибку
            </Button>
            <Button
              variant="ghost"
              onClick={onDismiss}
              className="h-9 text-xs text-muted-foreground hover:text-foreground px-4"
            >
              Пропустить
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorAlert;
