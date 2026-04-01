import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getLocale } from "@/locales/patient"
import { PatientLocaleProvider } from "@/locales/locale-context"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  }

  const locale = await getLocale()

  return (
    <PatientLocaleProvider locale={locale}>
      {children}
    </PatientLocaleProvider>
  )
}
