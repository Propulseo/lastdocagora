"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { Bot, Sparkles, UserPlus } from "lucide-react"
import { useLandingTranslations } from "@/locales/landing-locale-context"
import { LandingChatWall } from "./landing-chat-wall"
import { LandingChatMessage } from "./landing-chat-message"
import { LandingChatInput } from "./landing-chat-input"
import {
  getOrCreateSessionId,
  getLocalMessageCount,
  incrementLocalCount,
  hasReachedLimit,
  saveConversationForHandoff,
  MAX_FREE_MESSAGES,
  type LandingPro,
  type ChatMessage,
} from "@/lib/landing-chat-session"

type ChatEntry = {
  role: "user" | "assistant"
  content: string
  professionals?: LandingPro[]
}

export function LandingChat({ compact = false }: { compact?: boolean } = {}) {
  const { t, locale } = useLandingTranslations()
  const ct = t.chat

  const [messages, setMessages] = useState<ChatEntry[]>([
    { role: "assistant", content: ct.welcome },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showWall, setShowWall] = useState(false)
  const [showSignupCta, setShowSignupCta] = useState(false)
  const [messagesUsed, setMessagesUsed] = useState(0)
  const [lastQuery, setLastQuery] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessagesUsed(getLocalMessageCount())
  }, [])

  // Re-sync welcome message when locale changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: ct.welcome }]
      }
      return prev.map((m, i) =>
        i === 0 && m.role === "assistant" ? { ...m, content: ct.welcome } : m
      )
    })
  }, [ct.welcome])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const buildHistory = useCallback((): ChatMessage[] => {
    return messages
      .filter((m) => !m.professionals)
      .map((m) => ({ role: m.role, content: m.content }))
  }, [messages])

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    if (hasReachedLimit()) {
      setShowWall(true)
      return
    }

    setInput("")
    setLastQuery(trimmed)
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setIsLoading(true)

    try {
      const sessionId = getOrCreateSessionId()
      const history = buildHistory()

      const res = await fetch("/api/landing-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          session_id: sessionId,
          locale,
        }),
      })

      if (res.status === 429) {
        setShowWall(true)
        setIsLoading(false)
        return
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: ct.errorMessage },
        ])
        setIsLoading(false)
        return
      }

      const data = await res.json()
      const newCount = incrementLocalCount()
      setMessagesUsed(newCount)

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          professionals: data.professionals?.length > 0 ? data.professionals : undefined,
        },
      ])

      if (!showSignupCta) setShowSignupCta(true)

      const allMessages: ChatMessage[] = [
        ...buildHistory(),
        { role: "user", content: trimmed },
        { role: "assistant", content: data.message },
      ]
      saveConversationForHandoff(allMessages, trimmed)

      if (data.show_wall) {
        setTimeout(() => setShowWall(true), 800)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: ct.errorMessage },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const suggestions = [ct.suggestion1, ct.suggestion2, ct.suggestion3, ct.suggestion4]
  const showSuggestions = messages.length === 1

  return (
    <div className="rounded-2xl border border-border/60 bg-background shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-none">{ct.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{ct.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">
            {MAX_FREE_MESSAGES - messagesUsed} {ct.freeSearches}
          </span>
          {Array.from({ length: MAX_FREE_MESSAGES }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i < messagesUsed
                  ? "bg-primary"
                  : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`overflow-y-auto px-4 py-4 space-y-4 ${compact ? "h-[280px]" : "h-[380px]"}`}
      >
        {messages.map((msg, i) => (
          <LandingChatMessage key={i} msg={msg} viewProfilesLabel={ct.viewProfiles} />
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {showSuggestions && !isLoading && (
          <div className="flex flex-wrap gap-2 pl-9">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted hover:border-primary/30 active:bg-muted/80"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {showSignupCta && !showWall && (
          <div className="mx-0 my-2 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <p className="text-xs text-teal-800 dark:text-teal-300 leading-snug">
                {ct.signupCtaText}
              </p>
            </div>
            <Link
              href={`/login?redirect=${encodeURIComponent("/patient/search?chat=1")}#register`}
              className="flex-shrink-0 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              {ct.signupCtaButton}
            </Link>
          </div>
        )}

        {showWall && <LandingChatWall t={ct} lastSearchQuery={lastQuery} />}
      </div>

      <LandingChatInput
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        isLoading={isLoading}
        disabled={showWall}
        placeholder={showWall ? ct.placeholderDisabled : ct.placeholder}
      />
    </div>
  )
}
