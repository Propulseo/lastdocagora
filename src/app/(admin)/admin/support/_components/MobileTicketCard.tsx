"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateTicketStatus, replyToTicket } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { MobileTicketMessages, type TicketMessage } from "./MobileTicketMessages";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  open: ["in_progress"],
  in_progress: ["awaiting_confirmation", "open"],
  awaiting_confirmation: ["in_progress"],
  resolved: [],
  closed: [],
};

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
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [resolutionMessage, setResolutionMessage] = useState("");
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";
  const priority = ticket.priority ?? "medium";
  const allowedNext = ALLOWED_TRANSITIONS[ticket.status] ?? [];
  const supportT = t.support as Record<string, unknown>;

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
    if (newStatus === "awaiting_confirmation") {
      setPendingStatus(newStatus);
      return;
    }
    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, newStatus);
      if (result.success) {
        toast.success(t.support.statusUpdated);
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
      }
    });
  }

  function handleConfirmAwaitingConfirmation() {
    startTransition(async () => {
      const result = await updateTicketStatus(
        ticket.id,
        "awaiting_confirmation",
        resolutionMessage || undefined
      );
      if (result.success) {
        toast.success(t.support.statusUpdated);
        setPendingStatus(null);
        setResolutionMessage("");
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
      }
    });
  }

  return (
    <div className="rounded-xl border border-border/60 transition-shadow duration-150 hover:shadow-sm">
      <button
        onClick={toggleExpand}
        className="flex w-full items-start gap-3 p-3 text-left transition-colors duration-150 hover:bg-accent/30 rounded-t-xl"
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
          {allowedNext.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {t.support.changeStatus}
                </span>
                <Select
                  value=""
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger
                    className="w-[200px]"
                    aria-label={t.support.changeStatusLabel}
                  >
                    <SelectValue placeholder={t.support.changeStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedNext.map((s) => (
                      <SelectItem key={s} value={s}>
                        {(t.statuses.ticket as Record<string, string>)[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {pendingStatus === "awaiting_confirmation" && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                  <Textarea
                    placeholder={(supportT.resolutionPlaceholder as string) ?? "Summary of what was done..."}
                    value={resolutionMessage}
                    onChange={(e) => setResolutionMessage(e.target.value)}
                    className="mb-2 min-h-[60px] resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleConfirmAwaitingConfirmation}
                    >
                      {(supportT.sendToConfirmation as string) ?? "Send for confirmation"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPendingStatus(null);
                        setResolutionMessage("");
                      }}
                    >
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <MobileTicketMessages
            messages={messages}
            loading={loading}
            replyText={replyText}
            onReplyTextChange={setReplyText}
            sending={sending}
            onReply={handleReply}
            dateLocale={dateLocale}
            t={{
              noMessages: t.support.noMessages,
              replyPlaceholder: t.support.replyPlaceholder,
              sendButton: t.support.sendButton,
            }}
          />
        </div>
      )}
    </div>
  );
}
