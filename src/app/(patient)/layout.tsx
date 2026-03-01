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
import { getLocale } from "@/locales/patient"
import { PatientLocaleProvider } from "@/locales/locale-context"
import { RoleBodyClass } from "@/components/role-body-class"
import { PatientLayoutHeader } from "./_components/patient-layout-header"

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

  const userInfo = {
    name: profile
      ? `${profile.first_name} ${profile.last_name}`
      : user.email ?? "Paciente",
    email: profile?.email ?? user.email ?? "",
    avatarUrl: profile?.avatar_url ?? undefined,
    initials: profile
      ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
      : "P",
  }

  const notificationCount = unreadCount ?? 0

  return (
    <>
      <RoleBodyClass role="role-patient" />
      <SidebarProvider>
        <PatientLocaleProvider locale={locale}>
          <PatientSidebar user={userInfo} unreadCount={notificationCount} locale={locale} />
          <SidebarInset>
            <header className="flex h-14 items-center border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 ml-2 h-4" />
              <PatientLayoutHeader notificationCount={notificationCount} />
            </header>
            <div className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-6 md:p-8">
              {children}
            </div>
          </SidebarInset>
        </PatientLocaleProvider>
      </SidebarProvider>
    </>
  )
}
