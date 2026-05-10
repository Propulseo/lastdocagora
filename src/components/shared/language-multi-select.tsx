"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { LANGUAGES, type LanguageCode } from "@/lib/languages"

interface LanguageMultiSelectProps {
  value: LanguageCode[]
  onChange: (value: LanguageCode[]) => void
  label?: string
  placeholder?: string
}

export function LanguageMultiSelect({
  value,
  onChange,
  label,
  placeholder,
}: LanguageMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function toggle(code: LanguageCode) {
    if (value.includes(code)) {
      if (value.length <= 1) return
      onChange(value.filter((c) => c !== code))
    } else {
      onChange([...value, code])
    }
  }

  function remove(code: LanguageCode) {
    if (value.length <= 1) return
    onChange(value.filter((c) => c !== code))
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {label && (
        <label className="text-sm font-medium leading-none">{label}</label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-[44px] w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors",
          "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "border-primary ring-2 ring-ring",
        )}
      >
        {value.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {value.map((code) => {
              const lang = LANGUAGES.find((l) => l.code === code)
              if (!lang) return null
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm text-primary"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {value.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        remove(code)
                      }}
                      className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              )
            })}
          </div>
        )}
        <ChevronDown
          className={cn(
            "ml-2 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
          {LANGUAGES.map((lang) => {
            const selected = value.includes(lang.code)
            const isLast = value.length <= 1 && selected
            return (
              <button
                key={lang.code}
                type="button"
                disabled={isLast}
                onClick={() => toggle(lang.code)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors min-h-[44px]",
                  "first:rounded-t-lg last:rounded-b-lg",
                  selected
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-accent/50 text-foreground",
                  isLast && "cursor-not-allowed opacity-60",
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                {selected && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
