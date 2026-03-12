"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { adminNav } from "@/config/admin-nav";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

export function AdminTopbar() {
  const pathname = usePathname();
  const { t } = useAdminI18n();

  const matchedItem = adminNav.find((item) =>
    pathname.startsWith(item.href),
  );
  const title = matchedItem
    ? t.sidebar.items[matchedItem.titleKey]
    : t.topbar.fallbackTitle;

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border/60 px-6">
      <SidebarTrigger className="-ml-2" aria-label={t.topbar.toggleSidebar} />
      <Separator orientation="vertical" className="h-5" />
      <h2 className="text-sm font-medium">{title}</h2>
    </header>
  );
}
