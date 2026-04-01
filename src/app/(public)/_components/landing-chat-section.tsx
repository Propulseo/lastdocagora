"use client"

import { useLandingTranslations } from "@/locales/landing-locale-context"
import { LandingChat } from "./landing-chat"

export function LandingChatSection() {
  const { t } = useLandingTranslations()

  return (
    <section className="py-12 bg-muted/30 dark:bg-muted/10">
      <div className="max-w-2xl mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-4">
          {t.chat.sectionIntro}
        </p>
        <LandingChat />
      </div>
    </section>
  )
}
