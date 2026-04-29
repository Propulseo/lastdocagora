"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Languages, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setClientLocale } from "@/lib/i18n/locale-store"
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/types"
import { cn } from "@/lib/utils"
import { updateUserLocale } from "@/app/_actions/locale"

const localeLabels: Record<SupportedLocale, { short: string; full: string }> = {
  pt: { short: "PT", full: "Português" },
  fr: { short: "FR", full: "Français" },
  en: { short: "EN", full: "English" },
}

interface LanguageSwitcherProps {
  locale: string
  iconOnly?: boolean
}

export function LanguageSwitcher({ locale, iconOnly }: LanguageSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSelect = (next: SupportedLocale) => {
    if (next === locale) return
    setClientLocale(next)
    updateUserLocale(next)
    startTransition(() => {
      router.refresh()
    })
  }

  const current = localeLabels[locale as SupportedLocale] ?? localeLabels.pt

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={iconOnly ? "icon" : "sm"}
          className={cn(
            iconOnly
              ? "h-10 w-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              : "h-8 gap-1.5 px-2 text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
          disabled={isPending}
        >
          <Languages className="size-4" />
          {!iconOnly && <span>{current.short}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {SUPPORTED_LOCALES.map((loc) => {
          const label = localeLabels[loc]
          const isActive = loc === locale
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleSelect(loc)}
              className={cn("gap-2", isActive && "bg-accent")}
            >
              <Check
                className={cn(
                  "size-3.5",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="font-medium">{label.short}</span>
              <span className="text-muted-foreground">{label.full}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
