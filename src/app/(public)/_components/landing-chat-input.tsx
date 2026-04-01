"use client"

import { useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface LandingChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSend: (text: string) => void
  isLoading: boolean
  disabled: boolean
  placeholder: string
}

export function LandingChatInput({
  input,
  onInputChange,
  onSend,
  isLoading,
  disabled,
  placeholder,
}: LandingChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="border-t border-border/40 p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSend(input)
        }}
        className="flex gap-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          maxLength={500}
          className="flex-1 rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 transition-all"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim() || disabled}
          className="shrink-0 rounded-xl h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
