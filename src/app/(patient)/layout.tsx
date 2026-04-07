import { redirect } from "next/navigation"
import { headers } from "next/headers"
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
import { PublicSearchHeader } from "./_components/public-search-header"
import { PatientNotificationBell } from "./_components/PatientNotificationBell"
import type { PatientNotification } from "./_components/PatientNotificationBell"

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""

  // Anonymous users on search pages get a minimal public layout
  const isPublicSearch = !user && pathname.startsWith("/patient/search")

  if (!user && !isPublicSearch) {
    redirect("/login")
  }

  if (user && user.role !== "patient" && user.role !== "admin") {
    redirect("/login")
  }

  if (isPublicSearch) {
    const locale = await getLocale()
    return (
      <PatientLocaleProvider locale={locale}>
        <PublicSearchHeader />
        <div className="w-full flex-1 overflow-auto px-4 pt-6 pb-20 md:px-10 lg:px-12 lg:pb-6">
          {children}
        </div>
      </PatientLocaleProvider>
    )
  }

  // Authenticated patient layout
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [{ data: profile }, { data: initialNotifications }, locale] = await Promise.all(
    [
      supabase
        .from("users")
        .select("first_name, last_name, email, avatar_url")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("notifications")
        .select("id, user_id, title, message, type, is_read, related_id, created_at, params")
        .eq("user_id", user!.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(50),
      getLocale(),
    ]
  )

  const t = getPatientTranslations(locale)

  const userInfo = {
    name: profile
      ? `${profile.first_name} ${profile.last_name}`
      : user!.email ?? t.common.patient,
    email: profile?.email ?? user!.email ?? "",
    avatarUrl: profile?.avatar_url ?? undefined,
    initials: profile
      ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
      : "P",
  }

  const patientNotifs = (initialNotifications ?? []) as PatientNotification[]
  const notificationCount = patientNotifs.filter((n) => !n.is_read).length

  return (
    <>
      <PatientRealtimeNotifier userId={user!.id} />
      <RoleBodyClass role="role-patient" />
      <ThemeSync userId={user!.id} target="patient_settings" />
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
              <div className="ml-auto flex items-center gap-2">
                <PatientNotificationBell
                  userId={user!.id}
                  initialNotifications={patientNotifs}
                  initialUnreadCount={notificationCount}
                />
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
