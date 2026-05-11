"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessageBubble } from "./chat-message"
import { ProfessionalCardHorizontal } from "./professional-card-horizontal"
import { SkeletonProfessionalCards } from "@/components/ui/skeleton-professional-card"
import { submitChatFeedback } from "@/app/(patient)/_actions/ai-search/feedback"
import type { ProfessionalResult } from "./professional-card"
import type { PatientTranslations } from "@/locales/patient"
import type { SessionContext } from "@/lib/ai/system-prompt"
import { getRelatedSpecialties } from "@/app/(patient)/_actions/ai-search/related-specialties"

type ChatEntry = {
  role: "user" | "assistant"
  content: string
  suggestions?: string[]
  professionals?: ProfessionalResult[]
  isSearchResult?: boolean
  messageId?: string
}

export function AISearchChat({
  locale,
  t,
}: {
  locale: string
  t: PatientTranslations["search"]
}) {
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      role: "assistant",
      content: t.aiWelcome,
      suggestions: [t.aiSuggestion1, t.aiSuggestion2, t.aiSuggestion3, t.aiSuggestion4],
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProfessionals, setLoadingProfessionals] = useState(false)
  const [sessionContext, setSessionContext] = useState<SessionContext>({ message_count: 0 })
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Restore conversation from landing page handoff
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("chat") !== "1") return

    import("@/lib/landing-chat-session").then(({ getHandoffConversation, clearHandoffConversation }) => {
      const handoff = getHandoffConversation()
      if (handoff && handoff.messages.length > 0) {
        const restored: ChatEntry[] = handoff.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
        setMessages((prev) => [...prev, ...restored])
        clearHandoffConversation()
      }
      const url = new URL(window.location.href)
      url.searchParams.delete("chat")
      window.history.replaceState({}, "", url.pathname + url.search)
    })
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  function handleFeedback(messageId: string, rating: -1 | 1) {
    submitChatFeedback(messageId, rating).catch(console.error)
  }

  const buildHistory = useCallback(() => {
    return messages
      .filter((m) => !m.professionals && !m.isSearchResult)
      .map((m) => ({ role: m.role, content: m.content }))
  }, [messages])

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setIsLoading(true)

    try {
      const history = buildHistory()

      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, locale, sessionContext }),
      })

      if (res.status === 401) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: t.aiErrorAuth },
        ])
        setIsLoading(false)
        return
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: t.aiError },
        ])
        setIsLoading(false)
        return
      }

      // Read NDJSON stream
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let messageShown = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split("\n")
        buffer = lines.pop()!

        for (const line of lines) {
          if (!line.trim()) continue
          const chunk = JSON.parse(line)

          if (chunk.error) {
            const errorMessages: Record<string, string> = {
              not_authenticated: t.aiErrorAuth,
              invalid_input: t.aiErrorInput,
              ai_service_error: t.aiErrorService,
              ai_invalid_output: t.aiErrorRephrase,
            }
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: errorMessages[chunk.error] ?? t.aiError },
            ])
            setIsLoading(false)
            return
          }

          if (chunk.type === "message") {
            // Show AI message immediately + skeleton cards while professionals load
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: chunk.message },
            ])
            messageShown = true
            setIsLoading(false)
            setLoadingProfessionals(true)
          }

          if (chunk.type === "complete") {
            const data = chunk.data
            const msgId = data.message_id as string | undefined

            if (data.type === "clarification") {
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: data.message,
                  suggestions: data.suggested_options ?? undefined,
                  messageId: msgId,
                },
              ])
              setIsLoading(false)
            } else {
              const profs = data.professionals ?? []
              const level = data.fallback_level ?? 1
              const filters = data.filters_extracted

              // Update session context with last search filters
              if (filters) {
                setSessionContext((prev) => ({
                  ...prev,
                  message_count: prev.message_count + 1,
                  last_specialty: filters.specialty ?? prev.last_specialty,
                  last_city: filters.city ?? prev.last_city,
                  last_neighborhood: filters.neighborhood ?? prev.last_neighborhood,
                  last_languages: filters.languages_spoken ?? prev.last_languages,
                  last_insurance: filters.insurances_accepted ?? prev.last_insurance,
                  last_date: filters.requested_date ?? prev.last_date,
                }))
              }

              let resultMessage: string
              let emptySuggestions: string[] | undefined

              if (profs.length > 0) {
                const count = String(profs.length)
                if (level === 1) {
                  resultMessage = t.aiResultsFound.replace("{count}", count)
                } else if (level === 2) {
                  resultMessage = t.aiResultsRelaxed.replace("{count}", count)
                } else if (level === 3) {
                  resultMessage = t.aiResultsSpecialtyOnly.replace("{count}", count)
                } else {
                  resultMessage = t.aiResultsTopRated
                }
              } else if (data.requested_date) {
                resultMessage = t.noAvailability
                emptySuggestions = [t.aiSuggestOtherDate, t.aiSuggestAll]
              } else {
                resultMessage = t.aiNoResults
                emptySuggestions = [t.aiSuggestion1, t.aiSuggestAll]
              }

              // Build dynamic recovery suggestions for fallback levels 2+
              const removedFilters = data.removed_filters as string[] | undefined
              if (level >= 2 && profs.length > 0) {
                const dynamicSuggestions: string[] = []
                if (removedFilters?.includes("city") || level >= 3) {
                  dynamicSuggestions.push(t.aiSuggestBroaderArea)
                }
                if (removedFilters?.includes("insurances_accepted")) {
                  dynamicSuggestions.push(t.aiSuggestRemoveInsurance)
                }
                dynamicSuggestions.push(t.aiSuggestBestRated)
                if (filters?.specialty) {
                  const related = getRelatedSpecialties(filters.specialty)
                  if (related.length > 0) {
                    dynamicSuggestions.push(
                      t.aiSuggestRelated.replace("{specialty}", related[0])
                    )
                  }
                }
                emptySuggestions = dynamicSuggestions
              }

              if (messageShown) {
                setMessages((prev) => {
                  const updated = [...prev]
                  const lastIdx = updated.length - 1
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: resultMessage,
                      professionals: profs.length > 0 ? profs : undefined,
                      suggestions: emptySuggestions,
                      isSearchResult: true,
                      messageId: msgId,
                    }
                  }
                  return updated
                })
              } else {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: resultMessage,
                    professionals: profs.length > 0 ? profs : undefined,
                    suggestions: emptySuggestions,
                    isSearchResult: true,
                    messageId: msgId,
                  },
                ])
              }
              setIsLoading(false)
              setLoadingProfessionals(false)
            }
          }
        }
      }

      inputRef.current?.focus()
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t.aiError },
      ])
    } finally {
      setIsLoading(false)
      setLoadingProfessionals(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[600px] flex-col">
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.map((msg, i) => (
            <div key={i} className="space-y-3">
              <ChatMessageBubble
                role={msg.role}
                content={msg.content}
                suggestions={msg.suggestions}
                onSuggestionClick={handleSend}
                messageId={msg.messageId}
                showFeedback={!!msg.messageId && msg.role === "assistant" && i > 0}
                onFeedback={handleFeedback}
                feedbackThanks={t.aiFeedbackThanks}
              />
              {msg.professionals && msg.professionals.length > 0 && (
                <div className="space-y-3 pl-11">
                  {msg.professionals.map((prof) => (
                    <ProfessionalCardHorizontal
                      key={prof.id}
                      prof={prof}
                      locale={locale}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {loadingProfessionals && <SkeletonProfessionalCards count={3} />}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t.aiThinking}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend(input)
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.aiPlaceholder}
            disabled={isLoading}
            className="rounded-xl"
            maxLength={500}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="shrink-0 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
