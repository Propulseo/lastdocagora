"use client"

import { useLandingTranslations } from "@/locales/landing-locale-context"
import { HeroSearchZone } from "./hero-search-zone"

export function HeroSection() {
  const { t } = useLandingTranslations()

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-[#EFF8FB] via-[#F0FAFB] to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left — title + classic search fallback */}
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
              {t.hero.title}{" "}
              <span className="text-[#0891B2]">{t.hero.titleHighlight}</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t.hero.subtitle}
            </p>
            {/* Search zone on mobile (below lg) */}
            <div className="mt-8 lg:hidden">
              <HeroSearchZone />
            </div>
            <p className="mt-6 text-sm text-zinc-400 dark:text-zinc-500">{t.hero.trustedBy}</p>
          </div>

          {/* Right — chatbot (desktop) */}
          <div className="hidden lg:block">
            <HeroSearchZone />
          </div>
        </div>
      </div>
    </section>
  )
}
