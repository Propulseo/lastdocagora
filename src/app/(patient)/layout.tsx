import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { PatientSidebar } from "./patient-sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { getLocale, getPatientTranslations } from "@/locales/patient"
import { PatientLocaleProvider } from "@/locales/locale-context"
import { RoleBodyClass } from "@/components/role-body-class"
import { ThemeSync } from "@/components/theme-sync"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { PatientLayoutHeader } from "./_components/patient-layout-header"
import { PatientBottomNav } from "./_components/patient-bottom-nav"
import { PatientRealtimeNotifier } from "./_components/patient-realtime-notifier"

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || (user.role !== "patient" && user.role !== "admin")) {
    redirect("/login")
  }

  const supabase = await createClient()

  const [{ data: profile }, { count: unreadCount }, locale] = await Promise.all(
    [
      supabase
        .from("users")
        .select("first_name, last_name, email, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
      getLocale(),
    ]
  )

  const t = getPatientTranslations(locale)

  const userInfo = {
    name: profile
      ? `${profile.first_name} ${profile.last_name}`
      : user.email ?? t.common.patient,
    email: profile?.email ?? user.email ?? "",
    avatarUrl: profile?.avatar_url ?? undefined,
    initials: profile
      ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
      : "P",
  }

  const notificationCount = unreadCount ?? 0

  return (
    <>
      <PatientRealtimeNotifier userId={user.id} />
      <RoleBodyClass role="role-patient" />
      <ThemeSync userId={user.id} target="patient_settings" />
      <SidebarProvider>
        <PatientLocaleProvider locale={locale}>
          <div className="hidden lg:contents">
            <PatientSidebar user={userInfo} unreadCount={notificationCount} locale={locale} />
          </div>
          <SidebarInset>
            <header className="flex h-14 items-center border-b px-4">
              <div className="hidden lg:flex lg:items-center">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 ml-2 h-4" />
              </div>
              <PatientLayoutHeader />
              <div className="ml-auto">
                <ThemeToggle size="sm" />
              </div>
            </header>
            <div className="w-full flex-1 overflow-auto px-4 pt-6 pb-20 md:px-10 lg:px-12 lg:pb-6">
              {children}
            </div>
          </SidebarInset>
          <PatientBottomNav />
        </PatientLocaleProvider>
      </SidebarProvider>
    </>
  )
}
