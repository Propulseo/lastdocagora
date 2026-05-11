"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import {
  fetchFeedbackMessages,
  fetchConversationMessages,
} from "@/app/(admin)/_actions/admin-ai-chat"
import type { AdminTranslations } from "@/lib/i18n/admin"

type FeedbackMessage = Awaited<ReturnType<typeof fetchFeedbackMessages>>[number]
type ConversationMessage = Awaited<
  ReturnType<typeof fetchConversationMessages>
>[number]

interface AIChatFeedbackReviewProps {
  ct: AdminTranslations["aiChat"]
}

export function AIChatFeedbackReview({ ct }: AIChatFeedbackReviewProps) {
  const [negativeOnly, setNegativeOnly] = useState(false)
  const [messages, setMessages] = useState<FeedbackMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<
    ConversationMessage[]
  >([])
  const [conversationLoading, setConversationLoading] = useState(false)

  const loadFeedback = useCallback(async (negative: boolean) => {
    setLoading(true)
    try {
      const data = await fetchFeedbackMessages(negative)
      setMessages(data)
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeedback(negativeOnly)
  }, [negativeOnly, loadFeedback])

  const openConversation = async (conversationId: string) => {
    setDialogOpen(true)
    setConversationLoading(true)
    try {
      const data = await fetchConversationMessages(conversationId)
      setConversationMessages(data)
    } catch {
      setConversationMessages([])
    } finally {
      setConversationLoading(false)
    }
  }

  const fallbackLabel = (level: number | null): string => {
    if (level === 1) return "L1"
    if (level === 2) return "L2"
    if (level === 3) return "L3"
    if (level === 4) return "L4"
    return "-"
  }

  const fallbackVariant = (
    level: number | null
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (level === 1) return "default"
    if (level === 2) return "secondary"
    if (level === 3 || level === 4) return "destructive"
    return "outline"
  }

  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{ct.feedbackReview.title}</h2>
        <div className="flex items-center gap-3">
          <label
            htmlFor="negative-only-switch"
            className="text-sm text-muted-foreground"
          >
            {ct.feedbackReview.negativeOnly}
          </label>
          <Switch
            id="negative-only-switch"
            checked={negativeOnly}
            onCheckedChange={setNegativeOnly}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          ...
        </div>
      )}

      {/* Empty state */}
      {!loading && messages.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {ct.feedbackReview.noFeedback}
        </div>
      )}

      {/* Feedback list */}
      {!loading && messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="line-clamp-2 text-sm font-normal leading-relaxed">
                    {msg.content}
                  </CardTitle>
                  <div className="flex shrink-0 items-center gap-2">
                    {msg.feedback_rating === 1 ? (
                      <Badge
                        variant="default"
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <ThumbsUp className="mr-1 h-3 w-3" />
                        +1
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <ThumbsDown className="mr-1 h-3 w-3" />
                        -1
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Comment */}
                {msg.feedback_comment && (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm italic text-muted-foreground">
                    &ldquo;{msg.feedback_comment}&rdquo;
                  </p>
                )}

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {/* Fallback level */}
                  <Badge variant={fallbackVariant(msg.fallback_level)}>
                    Fallback {fallbackLabel(msg.fallback_level)}
                  </Badge>

                  {/* Results count */}
                  {msg.results_count !== null && (
                    <span>
                      {ct.feedbackReview.results}: {msg.results_count}
                    </span>
                  )}

                  {/* Date */}
                  <span>
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Filters extracted */}
                {msg.filters_extracted && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {ct.feedbackReview.filters}
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
                      {JSON.stringify(msg.filters_extracted, null, 2)}
                    </pre>
                  </div>
                )}

                {/* View conversation button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openConversation(msg.conversation_id)}
                >
                  {ct.feedbackReview.conversation}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conversation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{ct.feedbackReview.conversation}</DialogTitle>
          </DialogHeader>

          {conversationLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              ...
            </div>
          )}

          {!conversationLoading && conversationMessages.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              -
            </div>
          )}

          {!conversationLoading && conversationMessages.length > 0 && (
            <div className="space-y-3">
              {conversationMessages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-3 text-sm ${
                    m.role === "user"
                      ? "ml-8 bg-primary/10"
                      : m.role === "assistant"
                        ? "mr-8 bg-muted"
                        : "bg-muted/50 text-xs italic"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {m.role}
                    </span>
                    <div className="flex items-center gap-2">
                      {m.feedback_rating === 1 && (
                        <ThumbsUp className="h-3 w-3 text-emerald-500" />
                      )}
                      {m.feedback_rating === -1 && (
                        <ThumbsDown className="h-3 w-3 text-rose-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.feedback_comment && (
                    <p className="mt-2 rounded bg-background px-2 py-1 text-xs italic text-muted-foreground">
                      &ldquo;{m.feedback_comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
