"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  fetchAIChatConversations,
  fetchConversationMessages,
} from "@/app/(admin)/_actions/admin-ai-chat"
import type { AdminTranslations } from "@/lib/i18n/admin"

type Conversation = Awaited<
  ReturnType<typeof fetchAIChatConversations>
>["conversations"][number]

type Message = Awaited<ReturnType<typeof fetchConversationMessages>>[number]

interface AIChatConversationsProps {
  ct: AdminTranslations["aiChat"]
}

const PAGE_SIZE = 10

export function AIChatConversations({ ct }: AIChatConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [sessionType, setSessionType] = useState<
    "landing" | "patient" | "all"
  >("all")
  const [locale, setLocale] = useState<string>("all")
  const [hasNegativeFeedback, setHasNegativeFeedback] = useState(false)

  // Dialog
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)

  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchAIChatConversations({
        page,
        pageSize: PAGE_SIZE,
        sessionType: sessionType === "all" ? undefined : sessionType,
        locale: locale === "all" ? undefined : locale,
        hasNegativeFeedback: hasNegativeFeedback || undefined,
      })
      setConversations(result.conversations)
      setTotal(result.total)
    } catch {
      setConversations([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, sessionType, locale, hasNegativeFeedback])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [sessionType, locale, hasNegativeFeedback])

  const openTranscript = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setDialogOpen(true)
    setMessagesLoading(true)
    try {
      const data = await fetchConversationMessages(conversation.id)
      setMessages(data)
    } catch {
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {ct.conversations.filters}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* Session Type */}
            <Select
              value={sessionType}
              onValueChange={(v) =>
                setSessionType(v as "landing" | "patient" | "all")
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={ct.conversations.type} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ct.conversations.type}</SelectItem>
                <SelectItem value="landing">
                  {ct.conversations.landing}
                </SelectItem>
                <SelectItem value="patient">
                  {ct.conversations.patient}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Locale */}
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={ct.conversations.locale} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ct.conversations.locale}</SelectItem>
                <SelectItem value="pt">PT</SelectItem>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="en">EN</SelectItem>
              </SelectContent>
            </Select>

            {/* Negative Feedback */}
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={hasNegativeFeedback}
                onCheckedChange={(checked) =>
                  setHasNegativeFeedback(checked === true)
                }
              />
              <span className="text-muted-foreground">
                {ct.conversations.hasNegativeFeedback}
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              ...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              {ct.conversations.noConversations}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {ct.conversations.date}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {ct.conversations.type}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {ct.conversations.locale}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {ct.conversations.messageCount}
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {ct.conversations.feedback}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.map((conv) => (
                      <tr
                        key={conv.id}
                        className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                        onClick={() => openTranscript(conv)}
                      >
                        <td className="px-4 py-3">
                          {formatDate(conv.started_at)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {conv.session_type === "landing"
                              ? ct.conversations.landing
                              : ct.conversations.patient}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 uppercase">
                          {conv.locale}
                        </td>
                        <td className="px-4 py-3">{conv.message_count}</td>
                        <td className="px-4 py-3">-</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm">
                            {ct.conversations.viewDetails}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 p-4 sm:hidden">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/30"
                    onClick={() => openTranscript(conv)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(conv.started_at)}
                      </span>
                      <Badge variant="outline">
                        {conv.session_type === "landing"
                          ? ct.conversations.landing
                          : ct.conversations.patient}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {ct.conversations.messageCount}: {conv.message_count}
                      </span>
                      <span className="uppercase text-muted-foreground">
                        {conv.locale}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  {page * PAGE_SIZE + 1}-
                  {Math.min((page + 1) * PAGE_SIZE, total)} / {total}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    &larr;
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    &rarr;
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ct.conversations.transcript}</DialogTitle>
          </DialogHeader>

          {messagesLoading ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              ...
            </div>
          ) : (
            <div className="space-y-4">
              {selectedConversation && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    {selectedConversation.session_type === "landing"
                      ? ct.conversations.landing
                      : ct.conversations.patient}
                  </Badge>
                  <Badge variant="outline" className="uppercase">
                    {selectedConversation.locale}
                  </Badge>
                  <span>{formatDate(selectedConversation.started_at)}</span>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border p-3 ${
                    msg.role === "user"
                      ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
                      : "border-muted bg-muted/30"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      {msg.role === "user"
                        ? ct.conversations.user
                        : ct.conversations.assistant}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>

                  {/* Metadata */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.filters_extracted && (
                      <Badge variant="secondary" className="text-xs">
                        {JSON.stringify(msg.filters_extracted)}
                      </Badge>
                    )}
                    {msg.fallback_level !== null &&
                      msg.fallback_level !== undefined && (
                        <Badge
                          variant={
                            msg.fallback_level >= 3 ? "destructive" : "outline"
                          }
                          className="text-xs"
                        >
                          Fallback L{msg.fallback_level}
                        </Badge>
                      )}
                    {msg.feedback_rating !== null &&
                      msg.feedback_rating !== undefined && (
                        <Badge
                          variant={
                            msg.feedback_rating === 1
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {msg.feedback_rating === 1 ? "+1" : "-1"}
                        </Badge>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
