"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, LifeBuoy, AlertCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { TicketMessageBubble } from "./ticket-message-bubble";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
};

export const statusBadgeStyles: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  awaiting_confirmation: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-muted/50 text-muted-foreground border-border/40",
};

interface TicketMessageListProps {
  messages: Message[];
  userId: string;
  ticketStatus: string;
  isClosed: boolean;
  isAwaitingConfirmation: boolean;
  confirming: boolean;
  reopenDialogOpen: boolean;
  setReopenDialogOpen: (open: boolean) => void;
  reopenReason: string;
  setReopenReason: (reason: string) => void;
  reopening: boolean;
  onConfirmResolved: () => void;
  onReopen: () => void;
  s: Record<string, unknown>;
  awaitingT: Record<string, string>;
  commonT: Record<string, unknown>;
}

export function TicketMessageList({
  messages,
  userId,
  ticketStatus,
  isClosed,
  isAwaitingConfirmation,
  confirming,
  reopenDialogOpen,
  setReopenDialogOpen,
  reopenReason,
  setReopenReason,
  reopening,
  onConfirmResolved,
  onReopen,
  s,
  awaitingT,
  commonT,
}: TicketMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <>
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
                  onClick={onConfirmResolved}
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
            <DialogContent className={RADIUS.card}>
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
                  {commonT.cancel as string ?? "Cancel"}
                </Button>
                <Button
                  onClick={onReopen}
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
    </>
  );
}
