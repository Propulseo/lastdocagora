"use client";

import { Send } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { assignTicketToSelf } from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";

interface TicketMessage {
  id: string;
  content: string;
  created_at: string | null;
  sender_id: string | null;
}

export interface TicketExpandedContentProps {
  ticketId: string;
  ticketStatus: string;
  allowedNext: string[];
  messages: TicketMessage[];
  loading: boolean;
  dateLocale: "pt-PT" | "fr-FR";
  replyText: string;
  setReplyText: (v: string) => void;
  sending: boolean;
  handleReply: () => void;
  handleStatusChange: (newStatus: string) => void;
  pendingStatus: string | null;
  setPendingStatus: (v: string | null) => void;
  resolutionMessage: string;
  setResolutionMessage: (v: string) => void;
  handleConfirmAwaitingConfirmation: () => void;
  setShowDeleteConfirm: (v: boolean) => void;
  t: {
    support: Record<string, unknown>;
    statuses: { ticket: Record<string, string> };
    common: Record<string, unknown>;
  };
}

export function TicketExpandedContent({
  ticketId,
  ticketStatus,
  allowedNext,
  messages,
  loading,
  dateLocale,
  replyText,
  setReplyText,
  sending,
  handleReply,
  handleStatusChange,
  pendingStatus,
  setPendingStatus,
  resolutionMessage,
  setResolutionMessage,
  handleConfirmAwaitingConfirmation,
  setShowDeleteConfirm,
  t,
}: TicketExpandedContentProps) {
  const supportT = t.support;

  return (
    <TableRow>
      <TableCell colSpan={6} className="bg-muted/30 p-4">
        {allowedNext.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {t.support.changeStatus as string}
              </span>
              <Select
                value=""
                onValueChange={handleStatusChange}
              >
                <SelectTrigger
                  className="w-[200px]"
                  aria-label={t.support.changeStatusLabel as string}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue placeholder={t.support.changeStatus as string} />
                </SelectTrigger>
                <SelectContent>
                  {allowedNext.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t.statuses.ticket[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pendingStatus === "awaiting_confirmation" && (
              <div className="rounded-md border border-border bg-muted/30 p-3" onClick={(e) => e.stopPropagation()}>
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
                    {t.common.cancel as string}
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
            {t.support.noMessages as string}
          </p>
        )}
        {/* Admin quick actions */}
        <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {ticketStatus === "open" && (
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px]"
              onClick={async () => {
                const result = await assignTicketToSelf(ticketId);
                if (result.success) toast.success(t.support.assigned as string);
                else toast.error((result.error ?? t.common.errorUpdating) as string);
              }}
            >
              {t.support.assignToSelf as string}
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="min-h-[44px]"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t.support.deleteTicket as string}
          </Button>
        </div>

        {/* Admin reply form */}
        <div className="mt-3 flex gap-2">
          <Textarea
            placeholder={t.support.replyPlaceholder as string}
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
            {sending ? "..." : (t.support.sendButton as string)}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
