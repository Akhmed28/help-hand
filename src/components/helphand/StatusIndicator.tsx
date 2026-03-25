import type { HelpHandStatus } from "@/hooks/useHelpHand";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusIndicatorProps {
  status: HelpHandStatus;
}

const statusConfig: Record<HelpHandStatus, { color: string; pulse: boolean; label: string }> = {
  active: {
    color: "bg-emerald-400",
    pulse: false,
    label: "HelpHand наблюдает",
  },
  thinking: {
    color: "bg-yellow-400",
    pulse: true,
    label: "HelpHand думает...",
  },
  off: {
    color: "bg-gray-500",
    pulse: false,
    label: "HelpHand выключен",
  },
};

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  const config = statusConfig[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative flex items-center justify-center w-5 h-5 cursor-default">
          <span
            className={`block w-2.5 h-2.5 rounded-full ${config.color} ${
              config.pulse ? "animate-pulse" : ""
            }`}
          />
          {config.pulse && (
            <span
              className={`absolute w-2.5 h-2.5 rounded-full ${config.color} animate-ping opacity-40`}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {config.label}
      </TooltipContent>
    </Tooltip>
  );
};

export default StatusIndicator;
