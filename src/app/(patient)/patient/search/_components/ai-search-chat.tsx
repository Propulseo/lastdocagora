"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessageBubble } from "./chat-message"
import { ProfessionalGrid } from "./professional-grid"
import { aiSearch } from "@/app/(patient)/_actions/ai-search"
import type { ProfessionalResult } from "./professional-card"
import type { PatientTranslations } from "@/locales/patient"

type ChatEntry = {
  role: "user" | "assistant"
  content: string
  suggestions?: string[]
  professionals?: ProfessionalResult[]
  isSearchResult?: boolean
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
  const [isPending, startTransition] = useTransition()
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
      // Remove ?chat=1 from URL
      const url = new URL(window.location.href)
      url.searchParams.delete("chat")
      window.history.replaceState({}, "", url.pathname + url.search)
    })
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isPending])

  function buildHistory() {
    return messages
      .filter((m) => !m.professionals && !m.isSearchResult)
      .map((m) => ({ role: m.role, content: m.content }))
  }

  function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isPending) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])

    startTransition(async () => {
      const history = buildHistory()
      const result = await aiSearch({
        message: trimmed,
        history,
        locale,
      })

      if (!result.success) {
        const errorMessages: Record<string, string> = {
          not_authenticated: t.aiErrorAuth,
          invalid_input: t.aiErrorInput,
          ai_service_error: t.aiErrorService,
          ai_invalid_output: t.aiErrorRephrase,
        }
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: errorMessages[result.error] ?? t.aiError,
          },
        ])
        return
      }

      const data = result.data
      if (data.type === "clarification") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            suggestions: data.suggested_options ?? undefined,
          },
        ])
      } else {
        const profs = data.professionals ?? []
        const level = data.fallback_level ?? 1

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
        } else {
          resultMessage = t.aiNoResults
          emptySuggestions = [
            t.aiSuggestion1,
            t.aiSuggestAll,
          ]
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: resultMessage,
            professionals: profs.length > 0 ? profs : undefined,
            suggestions: emptySuggestions,
            isSearchResult: true,
          },
        ])
      }

      inputRef.current?.focus()
    })
  }

  return (
    <div className="flex h-[600px] flex-col">
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.map((msg, i) => (
            <div key={i} className="space-y-3">
              <ChatMessageBubble
                role={msg.role}
                content={msg.content}
                suggestions={msg.suggestions}
                onSuggestionClick={handleSend}
              />
              {msg.professionals && msg.professionals.length > 0 && (
                <div className="pl-11">
                  <ProfessionalGrid
                    professionals={msg.professionals}
                    locale={locale}
                    t={t}
                  />
                </div>
              )}
            </div>
          ))}
          {isPending && (
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
            disabled={isPending}
            className="rounded-xl"
            maxLength={500}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !input.trim()}
            className="shrink-0 rounded-xl"
          >
            {isPending ? (
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
