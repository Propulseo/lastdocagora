"use client";

import { cn } from "@/lib/utils";

interface TicketMessageBubbleProps {
  content: string;
  createdAt: string;
  isOwn: boolean;
  showDateSeparator: boolean;
  youLabel: string;
  adminLabel: string;
}

export function TicketMessageBubble({
  content,
  createdAt,
  isOwn,
  showDateSeparator,
  youLabel,
  adminLabel,
}: TicketMessageBubbleProps) {
  const time = new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      {showDateSeparator && (
        <div className="my-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/30" />
          <span className="text-[10px] text-muted-foreground/40">
            {new Date(createdAt).toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
          <div className="h-px flex-1 bg-border/30" />
        </div>
      )}

      <div
        className={cn(
          "flex",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        <div className="flex max-w-[75%] flex-col gap-0.5">
          <span
            className={cn(
              "text-[10px] font-medium",
              isOwn
                ? "text-right text-muted-foreground/50"
                : "text-primary/70"
            )}
          >
            {isOwn ? youLabel : adminLabel}
          </span>
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              isOwn
                ? "rounded-br-md bg-primary text-primary-foreground"
                : "rounded-bl-md bg-muted/60"
            )}
          >
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
          <span
            className={cn(
              "text-[10px] text-muted-foreground/40",
              isOwn ? "text-right" : "text-left"
            )}
          >
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
