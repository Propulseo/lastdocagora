"use client";

import { useEffect, useRef, useState } from "react";
import { Send, CheckCircle2, LifeBuoy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  sendMessage,
  confirmTicketResolved,
  reopenTicket,
} from "@/app/(professional)/_actions/pro-support-actions";
import { cn } from "@/lib/utils";
import { TicketMessageBubble } from "./ticket-message-bubble";

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

const statusBadgeStyles: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  awaiting_confirmation: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-muted/50 text-muted-foreground border-border/40",
};

export function TicketConversation({
  ticketId,
  userId,
  ticketStatus,
  ticketSubject,
}: TicketConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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
    <div className="flex flex-col rounded-xl border border-border/40 bg-card/50">
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

      {/* Resolved/Closed banner */}
      {isClosed && (
        <div className="flex items-center gap-2 border-b border-border/20 bg-emerald-500/5 px-4 py-2 text-xs text-emerald-400">
          <CheckCircle2 className="size-3.5" />
          {ticketStatus === "resolved"
            ? (s.resolved as string)
            : (s.closed as string)}
        </div>
      )}

      {/* Awaiting confirmation banner */}
      {isAwaitingConfirmation && (
        <div className="border-b border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                {awaitingT.title ?? "Your issue has been addressed"}
              </p>
              <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300">
                {awaitingT.description ?? "The DocAgora team responded to your ticket. Was the issue resolved?"}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  className="min-h-[36px] bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleConfirmResolved}
                  disabled={confirming}
                >
                  {confirming ? "..." : awaitingT.confirm ?? "Yes, issue resolved"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-[36px] border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  onClick={() => setReopenDialogOpen(true)}
                >
                  {awaitingT.reopen ?? "No, reopen"}
                </Button>
              </div>
            </div>
          </div>

          {/* Reopen dialog */}
          <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {awaitingT.reopenTitle ?? "Reopen ticket"}
                </DialogTitle>
                <DialogDescription>
                  {awaitingT.reopenDescription ?? "Briefly describe why the issue is not resolved."}
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder={awaitingT.reopenPlaceholder ?? "E.g.: The issue persists..."}
                className="min-h-[80px]"
              />
              {reopenReason.trim().length > 0 && reopenReason.trim().length < 10 && (
                <p className="text-xs text-destructive">
                  {awaitingT.reopenMinLength ?? "Minimum 10 characters"}
                </p>
              )}
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setReopenDialogOpen(false)}
                >
                  {(t.common as Record<string, unknown>).cancel as string ?? "Cancel"}
                </Button>
                <Button
                  onClick={handleReopen}
                  disabled={reopening || reopenReason.trim().length < 10}
                >
                  {reopening ? "..." : awaitingT.reopenButton ?? "Reopen ticket"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
        style={{ maxHeight: 460, minHeight: 300 }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <LifeBuoy className="size-5 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/50">
              {s.noMessages as string}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const prevMsg = messages[i - 1];
            const msgDate = new Date(msg.created_at).toLocaleDateString();
            const prevDate = prevMsg
              ? new Date(prevMsg.created_at).toLocaleDateString()
              : null;

            return (
              <TicketMessageBubble
                key={msg.id}
                content={msg.content}
                createdAt={msg.created_at}
                isOwn={msg.sender_id === userId}
                showDateSeparator={msgDate !== prevDate}
                youLabel={s.you as string}
                adminLabel={s.adminLabel as string}
              />
            );
          })
        )}
      </div>

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
              className="size-8 shrink-0 rounded-lg"
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
