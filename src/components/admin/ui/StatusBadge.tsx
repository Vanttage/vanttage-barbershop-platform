import type { AppointmentStatus } from "@/src/types";

const STATUS_CLASSES: Record<AppointmentStatus, { dot: string; badge: string; label: string }> = {
  confirmed:   { dot: "bg-emerald-400",  badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",  label: "Confirmada"  },
  pending:     { dot: "bg-gold",         badge: "text-gold bg-gold-subtle border-gold/20",                   label: "Pendiente"   },
  in_progress: { dot: "bg-blue-400",     badge: "text-blue-400 bg-blue-400/10 border-blue-400/20",           label: "En proceso"  },
  completed:   { dot: "bg-zinc-500",     badge: "text-zinc-400 bg-zinc-800/60 border-white/[0.08]",          label: "Completada"  },
  cancelled:   { dot: "bg-red-400",      badge: "text-red-400 bg-red-400/10 border-red-400/20",              label: "Cancelada"   },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  showDot?: boolean;
}

export default function StatusBadge({ status, showDot = false }: StatusBadgeProps) {
  const cfg = STATUS_CLASSES[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${cfg.badge}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}

export { STATUS_CLASSES };
