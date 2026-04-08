"use client";

import { useState } from "react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { Button } from "@/components/ui/button";
import {
  LifeBuoy,
  Plus,
  Ticket,
  CircleDot,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { TicketList } from "./TicketList";
import { TicketConversation } from "./TicketConversation";
import { NewTicketDialog } from "./NewTicketDialog";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

export type TicketData = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string | null;
  created_at: string | null;
  updated_at: string | null;
};

interface SupportClientProps {
  tickets: TicketData[];
  unreadIds: string[];
  userId: string;
  kpi: { total: number; open: number; resolved: number };
}

export function SupportClient({
  tickets,
  unreadIds,
  userId,
  kpi,
}: SupportClientProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { t } = useProfessionalI18n();

  const s = t.support as Record<string, unknown>;
  const kpiT = (s.kpi ?? {}) as Record<string, string>;
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  return (
    <div className="space-y-5 [&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-2 [&>*]:duration-300 [&>*:nth-child(1)]:delay-0 [&>*:nth-child(2)]:delay-[50ms] [&>*:nth-child(3)]:delay-[100ms]">
      {/* Header — compact, matches dashboard style */}
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex size-9 items-center justify-center ${RADIUS.element} bg-primary/10`}>
            <LifeBuoy className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {s.title as string}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {s.description as string}
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5" />
          {s.newTicket as string}
        </Button>
      </div>

      {/* KPI Strip — same style as dashboard */}
      <div className={`flex h-16 items-stretch overflow-x-auto ${RADIUS.card} ${SHADOW.card} border border-border/40 bg-card/50`}>
        <KpiMetric
          icon={<Ticket className="size-4" />}
          label={kpiT.total}
          value={kpi.total}
        />
        <KpiMetric
          icon={<CircleDot className="size-4" />}
          label={kpiT.open}
          value={kpi.open}
          accent={kpi.open > 0 ? "amber" : undefined}
        />
        <KpiMetric
          icon={<CheckCircle2 className="size-4" />}
          label={kpiT.resolved}
          value={kpi.resolved}
          accent={kpi.resolved > 0 ? "emerald" : undefined}
          isLast
        />
      </div>

      {/* Main split layout */}
      <div className="grid min-h-[540px] items-stretch gap-4 grid-cols-1 lg:grid-cols-[340px_1fr]">
        <TicketList
          tickets={tickets}
          selectedId={selectedTicketId}
          onSelect={setSelectedTicketId}
          unreadIds={unreadIds}
          onNewTicket={() => setDialogOpen(true)}
        />

        {selectedTicket ? (
          <TicketConversation
            ticketId={selectedTicket.id}
            userId={userId}
            ticketStatus={selectedTicket.status}
            ticketSubject={selectedTicket.subject}
          />
        ) : (
          <div className={`flex flex-col items-center justify-center ${RADIUS.card} ${SHADOW.card} border border-border/40 bg-card/50 p-8 text-center`}>
            <div className="flex size-14 items-center justify-center rounded-full bg-muted/30">
              <MessageSquare className="size-6 text-muted-foreground/50" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {s.selectTicket as string}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {s.selectTicketHint as string}
            </p>
          </div>
        )}
      </div>

      <NewTicketDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

/* ─── KPI Metric inline ─── */
function KpiMetric({
  icon,
  label,
  value,
  accent,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "amber" | "emerald";
  isLast?: boolean;
}) {
  const accentClass = accent === "amber"
    ? "text-amber-400"
    : accent === "emerald"
      ? "text-emerald-400"
      : "";
  return (
    <div
      className={`flex items-center gap-3 px-5 py-2 ${!isLast ? "border-r border-border/40" : ""}`}
    >
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={`text-2xl font-bold tabular-nums leading-none ${accentClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
