"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateTicketStatus, replyToTicket } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  open: ["in_progress"],
  in_progress: ["awaiting_confirmation", "open"],
  awaiting_confirmation: ["in_progress"],
  resolved: [],
  closed: [],
};

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
    user_avatar_url: string | null;
  };
}

export function TicketRow({ ticket }: TicketRowProps) {
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
  const allowedNext = ALLOWED_TRANSITIONS[ticket.status] ?? [];
  const supportT = t.support as Record<string, unknown>;

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
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              {ticket.user_avatar_url && <AvatarImage src={ticket.user_avatar_url} alt={ticket.user_name} />}
              <AvatarFallback className="text-[10px] font-semibold">
                {ticket.user_name.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span>{ticket.user_name}</span>
          </div>
        </TableCell>
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
            {allowedNext.length > 0 && (
              <div className="mb-3 space-y-2">
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
                      onClick={(e) => e.stopPropagation()}
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
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30" onClick={(e) => e.stopPropagation()}>
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
            {/* Admin reply form */}
            <div className="mt-3 flex gap-2">
              <Textarea
                placeholder={t.support.replyPlaceholder}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] resize-none"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                className="shrink-0 self-end"
                disabled={sending || !replyText.trim()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReply();
                }}
              >
                <Send className="size-4 mr-1" />
                {sending ? "..." : t.support.sendButton}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
