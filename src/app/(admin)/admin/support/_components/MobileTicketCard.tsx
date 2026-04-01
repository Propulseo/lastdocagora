"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ChevronDown, ChevronRight, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { updateTicketStatus, replyToTicket } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

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

interface MobileTicketCardProps {
  ticket: MappedTicket;
}

export function MobileTicketCard({ ticket }: MobileTicketCardProps) {
  const { t } = useAdminI18n();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";
  const priority = ticket.priority ?? "medium";

  async function handleReply() {
    if (!replyText.trim()) return;
    setSending(true);
    const result = await replyToTicket(ticket.id, replyText);
    setSending(false);
    if (result.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content: replyText.trim(),
          created_at: new Date().toISOString(),
          sender_id: "admin",
        },
      ]);
      setReplyText("");
      toast.success(t.support.replySent);
    } else {
      toast.error(result.error ?? t.support.replyError);
    }
  }

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
            <span>&middot;</span>
            <span>
              {ticket.updated_at
                ? new Date(ticket.updated_at).toLocaleDateString(dateLocale)
                : "\u2014"}
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
          <div className="flex gap-2">
            <Textarea
              placeholder={t.support.replyPlaceholder}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[60px] resize-none"
            />
            <Button
              size="sm"
              className="shrink-0 self-end"
              disabled={sending || !replyText.trim()}
              onClick={handleReply}
            >
              <Send className="size-4 mr-1" />
              {sending ? "..." : t.support.sendButton}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
