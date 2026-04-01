"use client"

import { useState } from "react"
import { Sparkles, Search } from "lucide-react"
import { useLandingTranslations } from "@/locales/landing-locale-context"
import { LandingChat } from "./landing-chat"
import { HeroSearchBar } from "./hero-search-bar"

type SearchMode = "ai" | "classic"

export function HeroSearchZone() {
  const { t } = useLandingTranslations()
  const [mode, setMode] = useState<SearchMode>("ai")

  return (
    <div className="w-full">
      {/* Toggle */}
      <div className="flex items-center gap-1 mb-3 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 w-fit">
        <button
          onClick={() => setMode("ai")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            mode === "ai"
              ? "bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t.hero.smartSearch}
        </button>
        <button
          onClick={() => setMode("classic")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            mode === "classic"
              ? "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          {t.hero.classicSearch}
        </button>
      </div>

      {/* Active mode */}
      {mode === "ai" ? <LandingChat compact /> : <HeroSearchBar />}
    </div>
  )
}
