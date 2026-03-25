import { Check, X, Undo2, Lightbulb, AlertTriangle, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { AutonomyLevel } from "@/hooks/useHelpHandSettings";

interface ActionCardProps {
  id: string;
  description: string;
  code?: string;
  type: "observation" | "suggestion" | "warning" | "idea";
  autonomyLevel: AutonomyLevel;
  onExecute: (id: string) => void;
  onDismiss: (id: string) => void;
  onRevert?: (id: string) => void;
  executed?: boolean;
}

const typeConfig = {
  observation: { icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  suggestion: { icon: Lightbulb, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  warning: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  idea: { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

const ActionCard = ({
  id,
  description,
  code,
  type,
  autonomyLevel,
  onExecute,
  onDismiss,
  onRevert,
  executed,
}: ActionCardProps) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      className={`rounded-lg border ${config.border} ${config.bg} p-3 space-y-2`}
    >
      <div className="flex items-start gap-2">
        <Icon size={16} className={`${config.color} shrink-0 mt-0.5`} />
        <p className="text-xs text-foreground leading-relaxed break-words min-w-0">{description}</p>
      </div>

      {code && (
        <pre className="text-[10px] bg-black/30 rounded p-2 overflow-x-auto text-muted-foreground font-mono">
          {code.length > 200 ? code.slice(0, 200) + "..." : code}
        </pre>
      )}

      <div className="flex gap-2 pt-1">
        {executed ? (
          // Already executed (auto or manual) — show status + revert
          <>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Check size={12} /> Выполнено автоматически
            </span>
            {onRevert && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-orange-400 hover:text-orange-300 px-2"
                onClick={() => onRevert(id)}
              >
                <Undo2 size={12} className="mr-1" /> Откатить
              </Button>
            )}
          </>
        ) : autonomyLevel === "cofounder" ? (
          // Cofounder level: AI already did it, show revert only
          <>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Check size={12} /> Выполнено
            </span>
            {onRevert && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-orange-400 hover:text-orange-300 px-2"
                onClick={() => onRevert(id)}
              >
                <Undo2 size={12} className="mr-1" /> Откатить
              </Button>
            )}
          </>
        ) : (
          // Advisor / Partner level: show Do it / Skip
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
              onClick={() => onExecute(id)}
            >
              <Check size={12} className="mr-1" /> Сделай
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
              onClick={() => onDismiss(id)}
            >
              <X size={12} className="mr-1" /> Не надо
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ActionCard;
