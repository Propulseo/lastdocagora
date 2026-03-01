"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setClientLocale } from "@/lib/i18n/locale-store"
import { type SupportedLocale } from "@/lib/i18n/types"

const localeLabels: Record<string, string> = {
  pt: "PT",
  fr: "FR",
}

function getNextLocale(current: string): SupportedLocale {
  return current === "pt" ? "fr" : "pt"
}

interface LanguageSwitcherProps {
  locale: string
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const next = getNextLocale(locale)

  const handleToggle = () => {
    // 1. Instant: set cookie + notify all providers (< 5ms)
    setClientLocale(next)

    // 2. Background: refresh server components (non-blocking)
    //    Keeps old server-rendered text visible until refresh completes.
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 px-2 text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      onClick={handleToggle}
      disabled={isPending}
      title={`${localeLabels[locale]} → ${localeLabels[next]}`}
    >
      <Languages className="size-4" />
      <span>{localeLabels[locale]}</span>
    </Button>
  )
}
