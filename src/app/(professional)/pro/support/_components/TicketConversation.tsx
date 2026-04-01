"use client";

import { useEffect, useRef, useState } from "react";
import { Send, CheckCircle2, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { sendMessage } from "@/app/(professional)/_actions/pro-support-actions";
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

  const s = t.support as Record<string, unknown>;
  const statuses = (s.statuses ?? {}) as Record<string, string>;
  const isClosed = ticketStatus === "resolved" || ticketStatus === "closed";

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
      {!isClosed && (
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
