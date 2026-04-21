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
import { NotificationBell } from "@/components/shared/NotificationBell"

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

  const [{ data: profile }, locale] = await Promise.all(
    [
      supabase
        .from("users")
        .select("first_name, last_name, email, avatar_url")
        .eq("id", user!.id)
        .single(),
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

  return (
    <>
      <PatientRealtimeNotifier userId={user!.id} />
      <RoleBodyClass role="role-patient" />
      <ThemeSync userId={user!.id} target="patient_settings" />
      <SidebarProvider>
        <PatientLocaleProvider locale={locale}>
            <div className="hidden lg:contents">
              <PatientSidebar user={userInfo} locale={locale} />
            </div>
            <SidebarInset className="max-h-svh overflow-hidden">
              <header className="flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur-sm px-4">
                <div className="hidden lg:flex lg:items-center">
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="mr-2 ml-2 h-4" />
                </div>
                <PatientLayoutHeader />
                <div className="ml-auto flex items-center gap-2">
                  <NotificationBell
                    userId={user!.id}
                    translations={{
                      title: t.messages.title,
                      markAllRead: t.messages.markAllRead,
                      empty: t.messages.emptyTitle,
                      markAsRead: t.messages.markOneRead,
                      markAsUnread: t.messages.markOneUnread,
                      justNow: t.messages.justNow,
                    }}
                    locale={locale}
                    role="patient"
                  />
                  <ThemeToggle size="sm" lightLabel={t.common.lightMode} darkLabel={t.common.darkMode} />
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
