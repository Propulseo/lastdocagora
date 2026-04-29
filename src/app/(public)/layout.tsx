import { Montserrat } from "next/font/google"
import type { Metadata } from "next"
import { getLocale } from "@/locales/landing"
import { LandingLocaleProvider } from "@/locales/landing-locale-context"

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "DOCAGORA - Encontre o seu medico em Portugal",
  description:
    "Plataforma de marcacao de consultas medicas em Portugal. Encontre profissionais de saude, compare disponibilidades e marque consultas presenciais ou teleconsulta.",
  keywords: [
    "medico",
    "consulta",
    "Portugal",
    "saude",
    "marcacao",
    "teleconsulta",
    "DOCAGORA",
  ],
  openGraph: {
    title: "DOCAGORA - Encontre o seu medico em Portugal",
    description:
      "Marque consultas com os melhores profissionais de saude em Portugal. Rapido, simples e seguro.",
    locale: "pt_PT",
    type: "website",
    siteName: "DOCAGORA",
    images: [{ url: "/logo-icon.png", width: 512, height: 512 }],
  },
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <div
      className={`${montserrat.variable} font-[family-name:var(--font-montserrat)]`}
    >
      <LandingLocaleProvider locale={locale}>{children}</LandingLocaleProvider>
    </div>
  )
}
