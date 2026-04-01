"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { useLandingTranslations } from "@/locales/landing-locale-context"
import { getSpecialtyOptions } from "@/locales/patient/specialties"

export function PublicFooter() {
  const { t, locale } = useLandingTranslations()
  const specialties = getSpecialtyOptions(locale).slice(0, 6)

  return (
    <footer className="bg-zinc-900 text-zinc-400 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="text-xl font-bold text-white">
              DOC<span className="text-[#0891B2]">AGORA</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed">{t.footer.description}</p>
          </div>

          {/* For Patients */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">
              {t.footer.forPatients}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/patient/search" className="hover:text-white transition-colors">
                  {t.footer.searchProfessional}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {t.footer.myAppointments}
                </Link>
              </li>
              <li>
                <Link href="/login#register" className="hover:text-white transition-colors">
                  {t.footer.createAccount}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Professionals */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">
              {t.footer.forProfessionals}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/login?role=professional#register"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.listPractice}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {t.footer.manageAgenda}
                </Link>
              </li>
              <li>
                <Link
                  href="/login?role=professional#register"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.joinNetwork}
                </Link>
              </li>
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">
              {t.footer.specialties}
            </h3>
            <ul className="space-y-2 text-sm">
              {specialties.map((s) => (
                <li key={s.value}>
                  <Link
                    href={`/patient/search?specialty=${s.value}`}
                    className="hover:text-white transition-colors"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">
              {t.footer.legal}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="cursor-default">{t.footer.terms}</span>
              </li>
              <li>
                <span className="cursor-default">{t.footer.privacy}</span>
              </li>
              <li>
                <span className="cursor-default">{t.footer.cookies}</span>
              </li>
              <li>
                <span className="cursor-default">{t.footer.rgpd}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-zinc-800 dark:bg-zinc-700" />

        <div className="text-center text-xs">
          &copy; {new Date().getFullYear()} {t.footer.copyright}
        </div>
      </div>
    </footer>
  )
}
