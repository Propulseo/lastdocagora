"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
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
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface TicketMessage {
  id: string;
  content: string;
  created_at: string | null;
  sender_id: string | null;
}

interface TicketRowProps {
  ticket: {
    id: string;
    subject: string;
    status: string;
    priority: string | null;
    updated_at: string | null;
    created_at: string | null;
    user_email: string;
    user_name: string;
  };
}

export function TicketRow({ ticket }: TicketRowProps) {
  const { t } = useAdminI18n();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";

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

  const priority = ticket.priority ?? "medium";

  return (
    <>
      <TableRow className="cursor-pointer" onClick={toggleExpand}>
        <TableCell className="w-8">
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </TableCell>
        <TableCell className="font-medium">{ticket.subject}</TableCell>
        <TableCell>{ticket.user_name}</TableCell>
        <TableCell>
          <StatusBadge
            type="ticket"
            value={ticket.status}
            labels={t.statuses.ticket}
          />
        </TableCell>
        <TableCell>
          <StatusBadge
            type="priority"
            value={priority}
            labels={t.statuses.priority}
          />
        </TableCell>
        <TableCell>
          {ticket.updated_at
            ? new Date(ticket.updated_at).toLocaleDateString(dateLocale)
            : "—"}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2">
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
                  onClick={(e) => e.stopPropagation()}
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
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
