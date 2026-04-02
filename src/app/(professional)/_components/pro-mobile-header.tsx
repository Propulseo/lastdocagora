"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { ProNotificationBell } from "./ProNotificationBell";
import type { ProNotification } from "../_actions/notification-actions";

interface ProMobileHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  userId: string;
  initialNotifications: ProNotification[];
  initialUnreadNotifCount: number;
}

export function ProMobileHeader({ user, userId, initialNotifications, initialUnreadNotifCount }: ProMobileHeaderProps) {
  const { locale } = useProfessionalI18n();
  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "");

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border/60 bg-background px-4 lg:hidden">
      <span className="text-sm font-bold">DOCAGORA</span>
      <span className="mx-auto max-w-[200px] truncate text-center text-sm font-medium">
        {user.firstName} {user.lastName}
      </span>
      <ProNotificationBell
        userId={userId}
        initialNotifications={initialNotifications}
        initialUnreadCount={initialUnreadNotifCount}
      />
      <LanguageSwitcher locale={locale} />
      <ThemeToggle size="sm" />
      <Avatar className="ml-2 size-8">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={initials} />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
    </header>
  );
}
