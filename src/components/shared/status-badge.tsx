import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";

const COLOR_MAP: Record<string, string> = {
  // green — active, verified, confirmed, completed
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  // yellow — pending, scheduled, in_progress
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  // blue — awaiting_confirmation
  awaiting_confirmation: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  // red — suspended, cancelled, rejected, closed
  suspended: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  closed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  inactive: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  // orange — no_show, open, urgent
  no_show: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  open: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  urgent: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  // neutral
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  // published
  true: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  false: "bg-muted text-muted-foreground",
  // roles
  patient: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  professional: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  admin: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
};

const DEFAULT_COLOR = "bg-muted text-muted-foreground";

const DEFAULT_LABELS: Record<string, Record<string, string>> = {
  userStatus: {
    active: "Ativo",
    inactive: "Inativo",
    suspended: "Suspenso",
  },
  role: {
    patient: "Paciente",
    professional: "Profissional",
    admin: "Administrador",
  },
  verification: {
    verified: "Verificado",
    pending: "Pendente",
    rejected: "Rejeitado",
  },
  appointment: {
    pending: "Pendente",
    scheduled: "Agendada",
    confirmed: "Confirmada",
    completed: "Concluída",
    cancelled: "Cancelada",
    rejected: "Recusada",
    no_show: "Falta",
  },
  ticket: {
    open: "Aberto",
    in_progress: "Em progresso",
    awaiting_confirmation: "Aguardando confirmação",
    resolved: "Resolvido",
    closed: "Fechado",
  },
  priority: {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente",
  },
  published: {
    true: "Publicado",
    false: "Rascunho",
  },
};

interface StatusBadgeProps {
  type: string;
  value: string | boolean | null | undefined;
  labels?: Record<string, string>;
  className?: string;
}

export function StatusBadge({ type, value, labels, className }: StatusBadgeProps) {
  const strValue = String(value ?? "");
  const colorClasses = COLOR_MAP[strValue] ?? DEFAULT_COLOR;
  const label =
    labels?.[strValue] ??
    DEFAULT_LABELS[type]?.[strValue] ??
    strValue;

  return (
    <span
      className={cn(
        "inline-block px-2.5 py-1 text-[11px] font-semibold leading-tight whitespace-nowrap",
        RADIUS.badge,
        colorClasses,
        className
      )}
    >
      {label}
    </span>
  );
}
