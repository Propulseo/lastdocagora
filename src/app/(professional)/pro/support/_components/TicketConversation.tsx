"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  sendMessage,
  confirmTicketResolved,
  reopenTicket,
} from "@/app/(professional)/_actions/pro-support-actions";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS } from "@/lib/design-tokens";
import { TicketMessageList, statusBadgeStyles } from "./TicketMessageList";

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
};

interface TicketConversationProps {
  ticketId: string;
  userId: string;
  ticketStatus: string;
  ticketSubject: string;
}

export function TicketConversation({
  ticketId,
  userId,
  ticketStatus,
  ticketSubject,
}: TicketConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const { t } = useProfessionalI18n();

  const [confirming, setConfirming] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopening, setReopening] = useState(false);

  const s = t.support as Record<string, unknown>;
  const awaitingT = (s.awaitingConfirmation ?? {}) as Record<string, string>;
  const statuses = (s.statuses ?? {}) as Record<string, string>;
  const isClosed = ticketStatus === "resolved" || ticketStatus === "closed";
  const isAwaitingConfirmation = ticketStatus === "awaiting_confirmation";
  const inputDisabled = isClosed || isAwaitingConfirmation;

  // Fetch messages + realtime
  useEffect(() => {
    const supabase = createClient();

    async function fetchMessages() {
      const { data } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    }

    fetchMessages();

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  async function handleSend() {
    if (!reply.trim() || sending) return;
    setSending(true);
    const result = await sendMessage(ticketId, reply.trim());
    setSending(false);

    if (result.success) {
      setReply("");
    } else {
      toast.error(
        (s.errorSending as string) ?? "Error sending message"
      );
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleConfirmResolved() {
    setConfirming(true);
    const result = await confirmTicketResolved(ticketId);
    setConfirming(false);
    if (result.success) {
      toast.success(awaitingT.confirm ?? "Issue resolved");
    } else {
      toast.error((s.errorSending as string) ?? "Error");
    }
  }

  async function handleReopen() {
    if (reopenReason.trim().length < 10) return;
    setReopening(true);
    const result = await reopenTicket(ticketId, reopenReason.trim());
    setReopening(false);
    if (result.success) {
      setReopenDialogOpen(false);
      setReopenReason("");
      toast.success(awaitingT.reopen ?? "Ticket reopened");
    } else {
      toast.error((s.errorSending as string) ?? "Error");
    }
  }

  return (
    <div className={`flex flex-col ${RADIUS.card} ${SHADOW.card} border border-border/40 bg-card/50`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <h3 className="min-w-0 truncate text-sm font-semibold">
          {ticketSubject}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
            statusBadgeStyles[ticketStatus] ?? statusBadgeStyles.open
          )}
        >
          {statuses[ticketStatus] ?? ticketStatus}
        </span>
      </div>

      <TicketMessageList
        messages={messages}
        userId={userId}
        ticketStatus={ticketStatus}
        isClosed={isClosed}
        isAwaitingConfirmation={isAwaitingConfirmation}
        confirming={confirming}
        reopenDialogOpen={reopenDialogOpen}
        setReopenDialogOpen={setReopenDialogOpen}
        reopenReason={reopenReason}
        setReopenReason={setReopenReason}
        reopening={reopening}
        onConfirmResolved={handleConfirmResolved}
        onReopen={handleReopen}
        s={s}
        awaitingT={awaitingT}
        commonT={t.common as Record<string, unknown>}
      />

      {/* Input area */}
      {!inputDisabled && (
        <div className="border-t border-border/30 p-3">
          <div className="flex items-end gap-2 rounded-xl bg-muted/20 p-1.5">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                (s.replyPlaceholder as string) ?? "Write your reply..."
              }
              rows={1}
              className="min-h-[36px] resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
            />
            <Button
              size="icon"
              className={`size-8 shrink-0 ${RADIUS.sm}`}
              onClick={handleSend}
              disabled={!reply.trim() || sending}
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
