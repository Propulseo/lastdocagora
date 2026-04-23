"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { adminNav } from "@/config/admin-nav";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AdminGlobalSearch } from "./admin-global-search";
import { NotificationBell } from "@/components/shared/NotificationBell";

interface AdminTopbarProps {
  userId: string;
}

export function AdminTopbar({ userId }: AdminTopbarProps) {
  const pathname = usePathname();
  const { t, locale } = useAdminI18n();

  const matchedItem = adminNav.find((item) =>
    pathname.startsWith(item.href),
  );
  const title = matchedItem
    ? t.sidebar.items[matchedItem.titleKey]
    : t.topbar.fallbackTitle;

  return (
    <header className="hidden lg:flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-6">
      <SidebarTrigger
        className="-ml-2 size-7 text-muted-foreground/60 transition-colors duration-100 hover:text-foreground"
        aria-label={t.topbar.toggleSidebar}
      />
      <Separator orientation="vertical" className="h-4" />
      <h2 className="text-sm font-medium">{title}</h2>

      <div className="ml-6 flex-1 max-w-sm">
        <AdminGlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <NotificationBell
          userId={userId}
          translations={{
            title: t.notifications.title,
            markAllRead: t.notifications.markAllRead,
            empty: t.notifications.empty,
            markAsRead: t.notifications.markAsRead,
            markAsUnread: t.notifications.markAsUnread,
            justNow: t.notifications.justNow,
          }}
          locale={locale}
          role="admin"
        />
        <ThemeToggle
          lightLabel={t.common.lightMode}
          darkLabel={t.common.darkMode}
        />
      </div>
    </header>
  );
}
