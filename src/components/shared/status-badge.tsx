const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  // green — active, verified, confirmed, completed
  active: { bg: "#dcfce7", text: "#15803d" },
  verified: { bg: "#dcfce7", text: "#15803d" },
  confirmed: { bg: "#dcfce7", text: "#15803d" },
  completed: { bg: "#dcfce7", text: "#15803d" },
  resolved: { bg: "#dcfce7", text: "#15803d" },
  // yellow — pending, scheduled, in_progress
  pending: { bg: "#fef9c3", text: "#854d0e" },
  scheduled: { bg: "#fef9c3", text: "#854d0e" },
  in_progress: { bg: "#fef9c3", text: "#854d0e" },
  // blue — awaiting_confirmation
  awaiting_confirmation: { bg: "#dbeafe", text: "#1d4ed8" },
  // red — suspended, cancelled, rejected, closed
  suspended: { bg: "#fee2e2", text: "#dc2626" },
  cancelled: { bg: "#fee2e2", text: "#dc2626" },
  rejected: { bg: "#fee2e2", text: "#dc2626" },
  closed: { bg: "#fee2e2", text: "#dc2626" },
  inactive: { bg: "#fee2e2", text: "#dc2626" },
  // orange — no_show, open, urgent
  no_show: { bg: "#ffedd5", text: "#c2410c" },
  open: { bg: "#ffedd5", text: "#c2410c" },
  urgent: { bg: "#ffedd5", text: "#c2410c" },
  high: { bg: "#ffedd5", text: "#c2410c" },
  // neutral
  low: { bg: "#f3f4f6", text: "#374151" },
  medium: { bg: "#fef9c3", text: "#854d0e" },
  // published
  true: { bg: "#dcfce7", text: "#15803d" },
  false: { bg: "#f3f4f6", text: "#374151" },
  // roles
  patient: { bg: "#eff6ff", text: "#1d4ed8" },
  professional: { bg: "#f5f3ff", text: "#6d28d9" },
  admin: { bg: "#fef2f2", text: "#991b1b" },
};

const DEFAULT_COLOR = { bg: "#f3f4f6", text: "#374151" };

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
  const color = COLOR_MAP[strValue] ?? DEFAULT_COLOR;
  const label =
    labels?.[strValue] ??
    DEFAULT_LABELS[type]?.[strValue] ??
    strValue;

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        borderRadius: "9999px",
        padding: "4px 10px",
        fontSize: "11px",
        fontWeight: 600,
        lineHeight: "1.2",
        backgroundColor: color.bg,
        color: color.text,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
