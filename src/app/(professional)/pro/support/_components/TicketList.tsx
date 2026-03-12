"use client";

import {
  LifeBuoy,
  Plus,
  Clock,
  Wrench,
  User,
  CreditCard,
  Bug,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { cn } from "@/lib/utils";
import type { TicketData } from "./SupportClient";

interface TicketListProps {
  tickets: TicketData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  unreadIds: string[];
  onNewTicket: () => void;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Problème technique": Wrench,
  "Technical issue": Wrench,
  "Problema técnico": Wrench,
  "Question sur mon profil": User,
  "Question about my profile": User,
  "Questão sobre o meu perfil": User,
  "Problème de paiement": CreditCard,
  "Payment issue": CreditCard,
  "Problema de pagamento": CreditCard,
  "Signaler un bug": Bug,
  "Report a bug": Bug,
  "Reportar um bug": Bug,
};

const statusDot: Record<string, string> = {
  open: "bg-amber-500",
  in_progress: "bg-blue-500",
  resolved: "bg-emerald-500",
  closed: "bg-muted-foreground/40",
};

function formatRelativeDate(dateStr: string, todayLabel: string, yesterdayLabel: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return todayLabel;
  if (diffDays === 1) return yesterdayLabel;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function TicketList({
  tickets,
  selectedId,
  onSelect,
  unreadIds,
  onNewTicket,
}: TicketListProps) {
  const { t } = useProfessionalI18n();
  const s = t.support as Record<string, unknown>;
  const statuses = (s.statuses ?? {}) as Record<string, string>;
  const todayLabel = (s.today as string) ?? "Today";
  const yesterdayLabel = (s.yesterday as string) ?? "Yesterday";

  return (
    <div className="flex flex-col rounded-xl border border-border/40 bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <span className="text-sm font-semibold">
          {(s.title as string)} ({tickets.length})
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onNewTicket}
        >
          <Plus className="size-3" />
          {s.newTicket as string}
        </Button>
      </div>

      {/* Ticket list or empty */}
      {tickets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted/30">
            <LifeBuoy className="size-5 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm font-medium">{s.emptyTitle as string}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.emptyDescription as string}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/50">
              {s.emptyHint as string}
            </p>
          </div>
          <Button size="sm" className="mt-2 gap-1.5" onClick={onNewTicket}>
            <Plus className="size-3" />
            {s.newTicket as string}
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {tickets.map((ticket) => {
            const isUnread = unreadIds.includes(ticket.id);
            const isSelected = ticket.id === selectedId;
            const IconComp = categoryIcons[ticket.subject] ?? HelpCircle;
            const relDate = formatRelativeDate(
              ticket.updated_at ?? ticket.created_at ?? "",
              todayLabel,
              yesterdayLabel
            );

            return (
              <button
                key={ticket.id}
                onClick={() => onSelect(ticket.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border/20 px-4 py-3 text-left transition-colors hover:bg-accent/40",
                  isSelected && "bg-accent/60 border-l-2 border-l-primary"
                )}
              >
                {/* Category icon */}
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/30">
                  <IconComp className="size-3.5 text-muted-foreground" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <span
                      className={cn(
                        "truncate text-sm",
                        isUnread ? "font-semibold" : "font-medium"
                      )}
                    >
                      {ticket.subject}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {ticket.description}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {/* Status dot + label */}
                    <span className="flex items-center gap-1">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          statusDot[ticket.status] ?? "bg-muted"
                        )}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {statuses[ticket.status] ?? ticket.status}
                      </span>
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    {/* Date */}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      <Clock className="size-2.5" />
                      {relDate}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
