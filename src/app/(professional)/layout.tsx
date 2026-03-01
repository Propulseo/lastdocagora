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

  const [{ data: userProfile }, { locale, t }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, email, avatar_url, language")
      .eq("id", user.id)
      .single(),
    getProfessionalI18n(),
  ]);

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
      <ProfessionalI18nProvider translations={t} locale={locale}>
        <SidebarProvider>
          <ProSidebar user={sidebarUser} />
          <SidebarInset>
            <header className="flex h-14 items-center border-b border-border/60 px-6">
              <SidebarTrigger className="-ml-2" />
              <Separator orientation="vertical" className="mx-3 h-4" />
              <ProLayoutHeaderTitle />
            </header>
            <main className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-6 md:p-8">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ProfessionalI18nProvider>
    </>
  );
}
