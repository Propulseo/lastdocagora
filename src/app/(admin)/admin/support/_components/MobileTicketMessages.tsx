import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TicketMessage {
  id: string;
  content: string;
  created_at: string | null;
  sender_id: string | null;
}

interface MobileTicketMessagesProps {
  messages: TicketMessage[];
  loading: boolean;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  sending: boolean;
  onReply: () => void;
  dateLocale: string;
  t: { noMessages: string; replyPlaceholder: string; sendButton: string };
}

export function MobileTicketMessages({
  messages,
  loading,
  replyText,
  onReplyTextChange,
  sending,
  onReply,
  dateLocale,
  t,
}: MobileTicketMessagesProps) {
  return (
    <>
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
          {t.noMessages}
        </p>
      )}
      <div className="flex gap-2">
        <Textarea
          placeholder={t.replyPlaceholder}
          value={replyText}
          onChange={(e) => onReplyTextChange(e.target.value)}
          className="min-h-[60px] resize-none"
        />
        <Button
          size="sm"
          className="shrink-0 self-end"
          disabled={sending || !replyText.trim()}
          onClick={onReply}
        >
          <Send className="size-4 mr-1" />
          {sending ? "..." : t.sendButton}
        </Button>
      </div>
    </>
  );
}

export type { TicketMessage };
