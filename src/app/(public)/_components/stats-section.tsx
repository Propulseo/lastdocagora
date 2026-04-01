"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useLandingTranslations } from "@/locales/landing-locale-context"

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const start = useCallback(() => setStarted(true), [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [start])

  useEffect(() => {
    if (!started) return

    const startTime = performance.now()
    let animationId: number

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))

      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [started, end, duration])

  return { count, ref }
}

export function StatsSection() {
  const { t } = useLandingTranslations()

  const satisfaction = useCountUp(96, 2000)
  const patients = useCountUp(10000, 2500)
  const professionals = useCountUp(500, 2000)

  const stats = [
    {
      ref: satisfaction.ref,
      value: `${satisfaction.count}%`,
      label: t.stats.satisfactionLabel,
    },
    {
      ref: patients.ref,
      value: `${patients.count.toLocaleString("pt-PT")}+`,
      label: t.stats.patientsLabel,
    },
    {
      ref: professionals.ref,
      value: `${professionals.count}+`,
      label: t.stats.professionalsLabel,
    },
  ]

  return (
    <section className="bg-white py-16 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              ref={stat.ref}
              className="text-center"
            >
              <div className="text-4xl font-extrabold text-[#0891B2] sm:text-5xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
