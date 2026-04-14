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
import { RoleBodyClass } from "@/components/role-body-class";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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

  const nb = t.notificationBell as Record<string, string>;
  const notifTranslations = {
    title: nb.title,
    markAllRead: nb.markAllRead,
    empty: nb.empty,
    markAsRead: nb.markAsRead,
    markAsUnread: nb.markAsUnread,
    justNow: nb.justNow,
  };
  const notifContent = {
    new_booking: { title: nb.notifNewBookingTitle, message: nb.notifNewBookingMessage },
    ticket_reply: { title: nb.notifTicketReplyTitle, message: nb.notifTicketReplyMessage },
    ticket_resolved: { title: nb.notifTicketResolvedTitle, message: nb.notifTicketResolvedMessage },
    ticket_updated: { title: nb.notifTicketUpdatedTitle, message: nb.notifTicketUpdatedMessage },
    system: { title: nb.notifReopenedTitle, message: nb.notifReopenedMessage },
  };

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
          <ProSidebar user={sidebarUser} openTicketCount={unreadCount} userId={user.id} />
          <SidebarInset>
            <ProMobileHeader user={sidebarUser} userId={user.id} />
            <header className="hidden lg:flex h-14 items-center border-b border-border/40 px-6">
              <SidebarTrigger className="-ml-2" />
              <Separator orientation="vertical" className="mx-3 h-4" />
              <ProLayoutHeaderTitle />
              <div className="ml-auto flex items-center gap-2">
                <NotificationBell
                  userId={user.id}
                  translations={notifTranslations}
                  contentTranslations={notifContent}
                  locale={locale}
                  role="professional"
                />
                <ThemeToggle lightLabel={t.common.lightMode} darkLabel={t.common.darkMode} />
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
