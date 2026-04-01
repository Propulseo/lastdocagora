"use client"

import Link from "next/link"
import { Shield, Search, CalendarCheck, Bell, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LandingTranslations } from "@/locales/landing/pt"

const benefits = [
  { icon: Search, key: "wallBenefit1" as const },
  { icon: CalendarCheck, key: "wallBenefit2" as const },
  { icon: Bell, key: "wallBenefit3" as const },
  { icon: Clock, key: "wallBenefit4" as const },
]

export function LandingChatWall({
  t,
  lastSearchQuery,
}: {
  t: LandingTranslations["chat"]
  lastSearchQuery?: string
}) {
  const redirectPath = `/patient/search${lastSearchQuery ? `?chat=1` : "?chat=1"}`
  const registerHref = `/login?redirect=${encodeURIComponent(redirectPath)}#register`
  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`

  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {t.wallTitle}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.wallDescription}
        </p>
      </div>

      <ul className="space-y-2">
        {benefits.map(({ icon: Icon, key }) => (
          <li key={key} className="flex items-center gap-2.5 text-sm text-foreground">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            {t[key]}
          </li>
        ))}
      </ul>

      <div className="space-y-2.5 pt-1">
        <Button asChild className="w-full h-11">
          <Link href={registerHref}>{t.wallCreateAccount}</Link>
        </Button>
        <Button asChild variant="outline" className="w-full h-11">
          <Link href={loginHref}>{t.wallLogin}</Link>
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        {t.wallRgpd}
      </p>
    </div>
  )
}
