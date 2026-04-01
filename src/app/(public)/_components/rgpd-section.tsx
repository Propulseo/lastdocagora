"use client"

import { ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLandingTranslations } from "@/locales/landing-locale-context"

export function RgpdSection() {
  const { t } = useLandingTranslations()

  return (
    <section className="bg-white py-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-5">
          {/* Left image placeholder */}
          <div className="flex items-center justify-center lg:col-span-2">
            <div className="flex h-64 w-full max-w-sm items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
              <div className="flex size-20 items-center justify-center rounded-full bg-[#0891B2]/10">
                <ShieldCheck className="size-10 text-[#0891B2]" />
              </div>
            </div>
          </div>

          {/* Right text */}
          <div className="lg:col-span-3">
            <Badge
              variant="secondary"
              className="mb-4 bg-[#0891B2]/10 text-[#0891B2] hover:bg-[#0891B2]/10"
            >
              {t.rgpd.badge}
            </Badge>
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-50">
              {t.rgpd.title}
            </h2>
            <p className="mt-3 text-lg font-medium text-zinc-600 dark:text-zinc-400">
              {t.rgpd.subtitle}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t.rgpd.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
