"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SupportFilters } from "./support-filters";
import { TicketRow } from "./ticket-row";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { updateTicketStatus } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransition } from "react";

interface MappedTicket {
  id: string;
  subject: string;
  status: string;
  priority: string | null;
  updated_at: string | null;
  created_at: string | null;
  user_email: string;
  user_name: string;
  user_avatar_url: string | null;
}

interface TicketMessage {
  id: string;
  content: string;
  created_at: string | null;
  sender_id: string | null;
}

interface SupportClientProps {
  tickets: MappedTicket[];
  count: number;
  pageSize: number;
}

function MobileTicketCard({ ticket }: { ticket: MappedTicket }) {
  const { t } = useAdminI18n();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";
  const priority = ticket.priority ?? "medium";

  async function toggleExpand() {
    if (!expanded && messages.length === 0) {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("ticket_messages")
        .select("id, content, created_at, sender_id")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
      setLoading(false);
    }
    setExpanded(!expanded);
  }

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, newStatus);
      if (result.success) {
        toast.success(t.support.statusUpdated);
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
      }
    });
  }

  return (
    <div className="rounded-lg border">
      <button
        onClick={toggleExpand}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <div className="mt-0.5 shrink-0">
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium line-clamp-2">{ticket.subject}</p>
            <StatusBadge
              type="priority"
              value={priority}
              labels={t.statuses.priority}
            />
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{ticket.user_name}</span>
            <span>·</span>
            <span>
              {ticket.updated_at
                ? new Date(ticket.updated_at).toLocaleDateString(dateLocale)
                : "—"}
            </span>
            <StatusBadge
              type="ticket"
              value={ticket.status}
              labels={t.statuses.ticket}
            />
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t bg-muted/30 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {t.support.changeStatus}
            </span>
            <Select
              defaultValue={ticket.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger
                className="w-[160px]"
                aria-label={t.support.changeStatusLabel}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">
                  {t.statuses.ticket.open}
                </SelectItem>
                <SelectItem value="in_progress">
                  {t.statuses.ticket.in_progress}
                </SelectItem>
                <SelectItem value="resolved">
                  {t.statuses.ticket.resolved}
                </SelectItem>
                <SelectItem value="closed">
                  {t.statuses.ticket.closed}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-card rounded-md border p-3 text-sm"
                >
                  <p>{msg.content}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleString(dateLocale)
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t.support.noMessages}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function SupportClient({
  tickets,
  count,
  pageSize,
}: SupportClientProps) {
  const { t } = useAdminI18n();

  return (
    <div className="space-y-6">
      <AdminPageHeader section="support" />

      <SupportFilters />

      {tickets.length > 0 ? (
        <>
          {/* Mobile card list */}
          <div className="space-y-2 sm:hidden">
            {tickets.map((ticket) => (
              <MobileTicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="w-8" />
                  <TableHead scope="col">{t.support.tableSubject}</TableHead>
                  <TableHead scope="col">{t.support.tableUser}</TableHead>
                  <TableHead scope="col">{t.common.status}</TableHead>
                  <TableHead scope="col">{t.support.tablePriority}</TableHead>
                  <TableHead scope="col">{t.support.tableUpdatedAt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <EmptyState
          title={t.support.emptyTitle}
          description={t.common.noResultsHint}
        />
      )}

      <Pagination total={count} pageSize={pageSize} />
    </div>
  );
}
