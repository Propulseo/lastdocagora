"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationBell } from "@/components/shared/NotificationBell";

interface AdminMobileHeaderProps {
  user: {
    firstName: string;
    lastName: string;
  };
  userId: string;
  onMenuOpen: () => void;
}

export function AdminMobileHeader({
  user,
  userId,
  onMenuOpen,
}: AdminMobileHeaderProps) {
  const { t, locale } = useAdminI18n();

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border bg-background px-3 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="min-h-[44px] min-w-[44px]"
        onClick={onMenuOpen}
        aria-label={t.mobile.openMenu}
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex flex-1 items-center justify-center gap-1.5">
        <span className="text-sm font-semibold tracking-tight">DOCAGORA</span>
        <span className="text-[10px] font-medium text-muted-foreground">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-0.5">
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
          size="sm"
          lightLabel={t.common.lightMode}
          darkLabel={t.common.darkMode}
        />
      </div>
    </header>
  );
}
