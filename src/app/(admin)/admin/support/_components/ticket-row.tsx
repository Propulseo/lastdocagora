"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/client";
import { updateTicketStatus, replyToTicket } from "@/app/(admin)/_actions/admin-actions";
import { deleteTicket } from "@/app/(admin)/_actions/admin-crud-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { TicketExpandedContent } from "./TicketExpandedContent";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";
  const allowedNext = ALLOWED_TRANSITIONS[ticket.status] ?? [];

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
              <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
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
        <TicketExpandedContent
          ticketId={ticket.id}
          ticketStatus={ticket.status}
          allowedNext={allowedNext}
          messages={messages}
          loading={loading}
          dateLocale={dateLocale}
          replyText={replyText}
          setReplyText={setReplyText}
          sending={sending}
          handleReply={handleReply}
          handleStatusChange={handleStatusChange}
          pendingStatus={pendingStatus}
          setPendingStatus={setPendingStatus}
          resolutionMessage={resolutionMessage}
          setResolutionMessage={setResolutionMessage}
          handleConfirmAwaitingConfirmation={handleConfirmAwaitingConfirmation}
          setShowDeleteConfirm={setShowDeleteConfirm}
          t={t}
        />
      )}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t.support.deleteConfirmTitle}
        description={t.support.deleteConfirmDesc}
        confirmLabel={t.support.deleteTicket}
        cancelLabel={t.common.cancel}
        loadingLabel={t.common.processing}
        variant="destructive"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          const result = await deleteTicket(ticket.id);
          setDeleting(false);
          if (result.success) {
            toast.success(t.support.ticketDeleted);
            setShowDeleteConfirm(false);
          } else {
            toast.error(result.error ?? t.common.errorUpdating);
          }
        }}
      />
    </>
  );
}
