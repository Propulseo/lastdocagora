"use client"

import { useState } from "react"
import { User, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ChatMessageBubble({
  role,
  content,
  suggestions,
  onSuggestionClick,
  messageId,
  showFeedback = false,
  onFeedback,
  feedbackThanks,
}: {
  role: "user" | "assistant"
  content: string
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  messageId?: string
  showFeedback?: boolean
  onFeedback?: (messageId: string, rating: -1 | 1) => void
  feedbackThanks?: string
}) {
  const isUser = role === "user"
  const [feedbackGiven, setFeedbackGiven] = useState<-1 | 1 | null>(null)

  function handleFeedback(rating: -1 | 1) {
    if (!messageId || !onFeedback || feedbackGiven !== null) return
    setFeedbackGiven(rating)
    onFeedback(messageId, rating)
  }

  return (
    <div
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {content}
        </div>
        {showFeedback && !isUser && (
          <div className="flex items-center gap-1 pt-0.5">
            {feedbackGiven !== null ? (
              <span className="text-xs text-muted-foreground">{feedbackThanks}</span>
            ) : (
              <>
                <button
                  onClick={() => handleFeedback(1)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Thumbs up"
                >
                  <ThumbsUp className="size-3.5" />
                </button>
                <button
                  onClick={() => handleFeedback(-1)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Thumbs down"
                >
                  <ThumbsDown className="size-3.5" />
                </button>
              </>
            )}
          </div>
        )}
        {suggestions && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="h-auto rounded-full px-3 py-1 text-xs"
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
