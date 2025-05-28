import { cn } from "../../lib/utils";
import { ServiceStatus } from "../../types";

interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
}

const statusConfig = {
  [ServiceStatus.OPERATIONAL]: {
    color: "bg-green-500/20 text-green-700",
    label: "Operational",
  },
  [ServiceStatus.DEGRADED]: {
    color: "bg-yellow-500/20 text-yellow-700",
    label: "Degraded",
  },
  [ServiceStatus.PARTIAL_OUTAGE]: {
    color: "bg-orange-500/20 text-orange-700",
    label: "Partial Outage",
  },
  [ServiceStatus.MAJOR_OUTAGE]: {
    color: "bg-red-500/20 text-red-700",
    label: "Major Outage",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color,
        className
      )}
    >
      <span className="mr-1">●</span>
      {config.label}
    </span>
  );
}
