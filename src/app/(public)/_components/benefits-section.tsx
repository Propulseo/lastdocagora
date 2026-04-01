"use client"

import { Calendar, MessageSquare, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLandingTranslations } from "@/locales/landing-locale-context"

export function BenefitsSection() {
  const { t } = useLandingTranslations()

  const cards = [
    {
      icon: Calendar,
      title: t.benefits.card1Title,
      description: t.benefits.card1Description,
    },
    {
      icon: MessageSquare,
      title: t.benefits.card2Title,
      description: t.benefits.card2Description,
    },
    {
      icon: ShieldCheck,
      title: t.benefits.card3Title,
      description: t.benefits.card3Description,
    },
  ]

  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {t.benefits.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
            {t.benefits.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card
              key={card.title}
              className="group border-transparent bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0891B2]/30 hover:shadow-md dark:bg-zinc-900"
            >
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[#0891B2]/10 text-[#0891B2] transition-colors group-hover:bg-[#0891B2]/20">
                  <card.icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
