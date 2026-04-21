"use client";

import { Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

export function AdminMobileHeader({ user, userId, onMenuOpen }: AdminMobileHeaderProps) {
  const { t, locale } = useAdminI18n();
  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "");

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 lg:hidden">
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
        <span className="text-sm font-bold tracking-tight">DOCAGORA</span>
        <Badge variant="secondary" className="text-[10px]">
          Admin
        </Badge>
      </div>

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
      <ThemeToggle size="sm" lightLabel={t.common.lightMode} darkLabel={t.common.darkMode} />

      <Avatar className="ml-1 size-8">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
    </header>
  );
}
