import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminTopbar } from "./_components/admin-topbar";
import { RoleBodyClass } from "@/components/role-body-class";
import { AdminI18nProvider } from "@/lib/i18n/admin/AdminI18nProvider";
import { getAdminI18n } from "@/lib/i18n/admin/getAdminI18n";

export const metadata = {
  title: "Admin - DOCAGORA",
  description: "Painel de administracao DOCAGORA",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const supabase = await createClient();

  const [{ data: profile }, { count: openTicketCount }, cookieStore] =
    await Promise.all([
      supabase
        .from("users")
        .select("first_name, last_name, email, language")
        .eq("id", user.id)
        .single(),
      supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),
      cookies(),
    ]);

  if (!profile) {
    redirect("/login");
  }

  // Language detection: cookie → user profile → fallback "pt"
  const cookieLang = cookieStore.get("docagora_lang")?.value;
  const rawLocale = cookieLang ?? profile.language ?? undefined;
  const { t, locale } = getAdminI18n(rawLocale);

  return (
    <>
      <RoleBodyClass role="role-admin" />
      <AdminI18nProvider translations={t} locale={locale}>
        <SidebarProvider>
          <AdminSidebar
            user={{
              email: profile.email,
              first_name: profile.first_name,
              last_name: profile.last_name,
            }}
            openTicketCount={openTicketCount ?? 0}
          />
          <SidebarInset>
            <AdminTopbar />
            <main className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </AdminI18nProvider>
    </>
  );
}
