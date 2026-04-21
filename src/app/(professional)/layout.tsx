import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ProSidebar } from "./pro-sidebar";
import { getProfessionalI18n } from "@/lib/i18n/pro/server";
import { ProfessionalI18nProvider } from "@/lib/i18n/pro";
import { ProLayoutHeaderTitle } from "./_components/pro-layout-header-title";
import { ProHeaderUserMenu } from "./_components/pro-header-user-menu";
import { RoleBodyClass } from "@/components/role-body-class";
import { ThemeSync } from "@/components/theme-sync";
import { ProBottomNav } from "./_components/pro-bottom-nav";
import { ProMobileHeader } from "./_components/pro-mobile-header";
import { ProRealtimeNotifier } from "./_components/pro-realtime-notifier";
import { NotificationBell } from "@/components/shared/NotificationBell";

export const metadata = {
  title: "DOCAGORA - Painel Profissional",
  description: "Painel de gestao para profissionais de saude",
};

export default async function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "professional") {
    redirect("/login");
  }

  const supabase = await createClient();

  const [{ data: userProfile }, { data: ticketsWithMessages }, { data: proRecord }] =
    await Promise.all([
      supabase
        .from("users")
        .select("first_name, last_name, email, avatar_url, language")
        .eq("id", user.id)
        .single(),
      supabase
        .from("support_tickets")
        .select("id, ticket_messages(sender_id, created_at)")
        .eq("user_id", user.id)
        .in("status", ["open", "in_progress"])
        .order("created_at", {
          referencedTable: "ticket_messages",
          ascending: false,
        })
        .limit(1, { referencedTable: "ticket_messages" }),
      supabase
        .from("professionals")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single(),
    ]);

  if (!userProfile) {
    redirect("/login");
  }

  const { locale, t } = await getProfessionalI18n(userProfile.language);

  let unreadCount = 0;
  if (ticketsWithMessages) {
    for (const tk of ticketsWithMessages) {
      const msgs = tk.ticket_messages as {
        sender_id: string | null;
        created_at: string;
      }[];
      if (msgs?.length > 0 && msgs[0].sender_id !== user.id) {
        unreadCount++;
      }
    }
  }

  const onboardingCompleted = proRecord?.onboarding_completed === true;

  const sidebarUser = {
    email: userProfile.email,
    firstName: userProfile.first_name,
    lastName: userProfile.last_name,
    avatarUrl: userProfile.avatar_url,
  };

  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  // Minimal shell during onboarding — no sidebar, no bottom nav
  if (!onboardingCompleted) {
    return (
      <>
        <RoleBodyClass role="role-professional" />
        <ProfessionalI18nProvider translations={t} locale={locale}>
          <div className="min-h-screen bg-background">{children}</div>
        </ProfessionalI18nProvider>
      </>
    );
  }

  return (
    <>
      <RoleBodyClass role="role-professional" />
      <ThemeSync userId={user.id} target="professional_settings" />
      <ProfessionalI18nProvider translations={t} locale={locale}>
          <ProRealtimeNotifier professionalUserId={user.id} />
          <SidebarProvider defaultOpen={sidebarOpen}>
            <ProSidebar openTicketCount={unreadCount} />
            <SidebarInset className="max-h-svh overflow-hidden">
              <ProMobileHeader user={sidebarUser} userId={user.id} />
              <header className="hidden lg:flex h-14 shrink-0 items-center border-b border-border/40 bg-background/95 backdrop-blur-sm px-6">
                <SidebarTrigger className="-ml-2" />
                <Separator orientation="vertical" className="mx-3 h-4" />
                <ProLayoutHeaderTitle />
                <div className="ml-auto flex items-center gap-3">
                  <NotificationBell
                    userId={user.id}
                    translations={{
                      title: (t.notificationBell as Record<string, string>).title,
                      markAllRead: (t.notificationBell as Record<string, string>).markAllRead,
                      empty: (t.notificationBell as Record<string, string>).empty,
                      markAsRead: (t.notificationBell as Record<string, string>).markAsRead,
                      markAsUnread: (t.notificationBell as Record<string, string>).markAsUnread,
                      justNow: (t.notificationBell as Record<string, string>).justNow,
                    }}
                    locale={locale}
                    role="professional"
                  />
                  <Separator orientation="vertical" className="h-6" />
                  <ProHeaderUserMenu user={sidebarUser} />
                </div>
              </header>
              <main className="pro-dashboard w-full flex-1 overflow-auto bg-muted/30 px-4 pt-6 pb-20 md:px-10 lg:px-12 lg:pb-8">
                {children}
              </main>
            </SidebarInset>
            <ProBottomNav />
          </SidebarProvider>
      </ProfessionalI18nProvider>
    </>
  );
}
