import { redirect } from "next/navigation";
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
import { ProThemeToggle } from "@/components/pro-theme-toggle";
import { ProThemeSync } from "@/components/pro-theme-sync";

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

  const [{ data: userProfile }, { locale, t }, { data: ticketsWithMessages }] =
    await Promise.all([
      supabase
        .from("users")
        .select("first_name, last_name, email, avatar_url, language")
        .eq("id", user.id)
        .single(),
      getProfessionalI18n(),
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
    ]);

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

  if (!userProfile) {
    redirect("/login");
  }

  const sidebarUser = {
    email: userProfile.email,
    firstName: userProfile.first_name,
    lastName: userProfile.last_name,
    avatarUrl: userProfile.avatar_url,
  };

  return (
    <>
      <RoleBodyClass role="role-professional" />
      <ProThemeSync userId={user.id} />
      <ProfessionalI18nProvider translations={t} locale={locale}>
        <SidebarProvider>
          <ProSidebar user={sidebarUser} openTicketCount={unreadCount} />
          <SidebarInset>
            <header className="flex h-14 items-center border-b border-border/60 px-6">
              <SidebarTrigger className="-ml-2" />
              <Separator orientation="vertical" className="mx-3 h-4" />
              <ProLayoutHeaderTitle />
              <div className="ml-auto">
                <ProThemeToggle />
              </div>
            </header>
            <main className="pro-dashboard w-full flex-1 overflow-auto px-4 pt-6 pb-6 md:px-10 lg:px-12">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ProfessionalI18nProvider>
    </>
  );
}
