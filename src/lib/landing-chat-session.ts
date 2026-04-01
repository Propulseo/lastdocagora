const SESSION_KEY = "docagora_anon_chat_session"
const COUNT_KEY = "docagora_anon_chat_count"
const HANDOFF_KEY = "docagora_chat_handoff"

export const MAX_FREE_MESSAGES = 3

export type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export type LandingPro = {
  id: string
  first_name: string | null
  last_name: string | null
  specialty: string
  city: string | null
  consultation_fee: number | null
  rating: number | null
  avatar_url: string | null
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    const arr = new Uint8Array(16)
    crypto.getRandomValues(arr)
    id = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("")
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function getLocalMessageCount(): number {
  if (typeof window === "undefined") return 0
  const val = localStorage.getItem(COUNT_KEY)
  return val ? parseInt(val, 10) : 0
}

export function incrementLocalCount(): number {
  const current = getLocalMessageCount() + 1
  localStorage.setItem(COUNT_KEY, String(current))
  return current
}

export function hasReachedLimit(): boolean {
  return getLocalMessageCount() >= MAX_FREE_MESSAGES
}

export function saveConversationForHandoff(
  messages: ChatMessage[],
  lastQuery: string
): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(
    HANDOFF_KEY,
    JSON.stringify({ messages, lastQuery })
  )
}

export function getHandoffConversation(): {
  messages: ChatMessage[]
  lastQuery: string
} | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(HANDOFF_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearHandoffConversation(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(HANDOFF_KEY)
}
