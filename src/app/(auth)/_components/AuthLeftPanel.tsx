import { Users, Calendar, ShieldCheck } from "lucide-react"
import { getPatientTranslations, type Locale } from "@/locales/patient"

export function AuthLeftPanel({ locale }: { locale: Locale }) {
  const t = getPatientTranslations(locale)

  const stats = [
    { icon: Users, label: t.auth.leftPanelStat1 },
    { icon: Calendar, label: t.auth.leftPanelStat2 },
    { icon: ShieldCheck, label: t.auth.leftPanelStat3 },
  ]

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0A3D52] p-10 xl:p-14">
      {/* Decorative circles */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#0891B2]/10" />
      <div className="absolute top-1/2 -right-16 h-56 w-56 rounded-full bg-[#0891B2]/[0.07]" />
      <div className="absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-[#0891B2]/5" />

      {/* Top: Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#0891B2]" />
          <span className="text-lg font-bold tracking-wide text-white">
            DOCAGORA
          </span>
        </div>
        <p className="mt-1.5 text-sm text-white/40">
          {t.auth.leftPanelSubtitle}
        </p>
      </div>

      {/* Center: Tagline + stats */}
      <div className="relative z-10 max-w-[360px]">
        <h2 className="text-[28px] font-semibold leading-tight text-white">
          {t.auth.leftPanelTagline}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/50">
          {t.auth.leftPanelDescription}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl bg-[#0891B2]/[0.12] px-4 py-3"
            >
              <stat.icon className="h-5 w-5 text-[#0891B2]" />
              <span className="text-sm font-medium text-white/80">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Copyright */}
      <p className="relative z-10 text-xs text-white/25">
        {t.auth.leftPanelCopyright}
      </p>
    </div>
  )
}
