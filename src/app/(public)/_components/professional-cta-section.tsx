"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLandingTranslations } from "@/locales/landing-locale-context"

export function ProfessionalCtaSection() {
  const { t } = useLandingTranslations()

  const benefits = [
    t.proCta.benefit1,
    t.proCta.benefit2,
    t.proCta.benefit3,
    t.proCta.benefit4,
  ]

  return (
    <section className="bg-zinc-900 py-20 text-white dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">{t.proCta.title}</h2>
            <p className="mt-4 text-lg text-zinc-400">{t.proCta.subtitle}</p>

            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0891B2]">
                    <Check className="size-3 text-white" />
                  </div>
                  <span className="text-sm text-zinc-300">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="mt-8 bg-[#0891B2] text-white hover:bg-[#0891B2]/90"
              asChild
            >
              <Link href="/login?role=professional#register">
                {t.proCta.button} &rarr;
              </Link>
            </Button>
          </div>

          {/* Right decorative element */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-32 w-32 items-center justify-center rounded-2xl bg-zinc-800 dark:bg-zinc-800/50"
                >
                  <div className="size-8 rounded-lg bg-[#0891B2]/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
