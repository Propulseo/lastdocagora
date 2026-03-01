import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const statusConfig: Record<
  string,
  Record<string, { label: string; variant: BadgeVariant }>
> = {
  userStatus: {
    active: { label: "Ativo", variant: "default" },
    inactive: { label: "Inativo", variant: "secondary" },
    suspended: { label: "Suspenso", variant: "destructive" },
  },
  role: {
    patient: { label: "Paciente", variant: "outline" },
    professional: { label: "Profissional", variant: "outline" },
    admin: { label: "Administrador", variant: "secondary" },
  },
  verification: {
    verified: { label: "Verificado", variant: "default" },
    pending: { label: "Pendente", variant: "outline" },
    rejected: { label: "Rejeitado", variant: "destructive" },
  },
  appointment: {
    pending: { label: "Pendente", variant: "outline" },
    scheduled: { label: "Agendada", variant: "outline" },
    confirmed: { label: "Confirmada", variant: "default" },
    completed: { label: "Concluida", variant: "secondary" },
    cancelled: { label: "Cancelada", variant: "destructive" },
    no_show: { label: "Falta", variant: "destructive" },
  },
  ticket: {
    open: { label: "Aberto", variant: "destructive" },
    in_progress: { label: "Em progresso", variant: "outline" },
    resolved: { label: "Resolvido", variant: "default" },
    closed: { label: "Fechado", variant: "secondary" },
  },
  priority: {
    low: { label: "Baixa", variant: "secondary" },
    medium: { label: "Media", variant: "outline" },
    high: { label: "Alta", variant: "default" },
    urgent: { label: "Urgente", variant: "destructive" },
  },
  published: {
    true: { label: "Publicado", variant: "default" },
    false: { label: "Rascunho", variant: "secondary" },
  },
};

interface StatusBadgeProps {
  type: keyof typeof statusConfig;
  value: string | boolean | null | undefined;
  /** Optional translated labels keyed by status value. Overrides default PT labels. */
  labels?: Record<string, string>;
}

export function StatusBadge({ type, value, labels }: StatusBadgeProps) {
  const strValue = String(value ?? "");
  const config = statusConfig[type]?.[strValue];
  return (
    <Badge variant={config?.variant ?? "outline"}>
      {labels?.[strValue] ?? config?.label ?? strValue}
    </Badge>
  );
}
