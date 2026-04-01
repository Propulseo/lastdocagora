"use client"

import { Star, Smartphone } from "lucide-react"
import { useLandingTranslations } from "@/locales/landing-locale-context"

export function MobileAppSection() {
  const { t } = useLandingTranslations()

  return (
    <section className="bg-gradient-to-br from-[#0e7490] to-[#164e63] py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left text */}
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">{t.mobileApp.title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">
              {t.mobileApp.subtitle}
            </p>

            <div className="mt-6 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4].map((i) => (
                  <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                ))}
                <Star className="size-4 fill-amber-400/50 text-amber-400" />
              </div>
              <span className="text-sm text-white/70">{t.mobileApp.rating}</span>
            </div>

            <p className="mt-6 text-sm font-medium text-white/60">
              {t.mobileApp.comingSoon}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled
                className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-white/60 backdrop-blur-sm"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                {t.mobileApp.appStore}
              </button>
              <button
                type="button"
                disabled
                className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-white/60 backdrop-blur-sm"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.73c.44.47 1.15.47 1.59 0L12 16.5l7.23 7.23c.44.47 1.15.47 1.59 0 .44-.44.44-1.15 0-1.59L12 13.5l-8.82 8.64c-.44.44-.44 1.15 0 1.59zM12 .75L1.61 11.14c-.44.44-.44 1.15 0 1.59.44.44 1.15.44 1.59 0L12 3.93l8.8 8.8c.44.44 1.15.44 1.59 0 .44-.44.44-1.15 0-1.59L12 .75z" />
                </svg>
                {t.mobileApp.googlePlay}
              </button>
            </div>
          </div>

          {/* Right phone mockup */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="h-[420px] w-[210px] rounded-[2.5rem] border-4 border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-[2rem] bg-white/5">
                  <Smartphone className="size-12 text-white/30" />
                  <p className="mt-3 text-xs text-white/40">DOCAGORA App</p>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-white/5 blur-xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
