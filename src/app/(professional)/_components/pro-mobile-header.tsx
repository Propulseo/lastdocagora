"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { NotificationBell } from "@/components/shared/NotificationBell";

interface ProMobileHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  userId: string;
}

export function ProMobileHeader({ user, userId }: ProMobileHeaderProps) {
  const { t, locale } = useProfessionalI18n();
  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "");

  const nb = t.notificationBell as Record<string, string>;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border/60 bg-background px-4 lg:hidden">
      <SidebarTrigger className="-ml-1 mr-2" />
      <span className="text-sm font-bold">DOCAGORA</span>
      <span className="mx-auto max-w-[200px] truncate text-center text-sm font-medium">
        {user.firstName} {user.lastName}
      </span>
      <NotificationBell
        userId={userId}
        translations={{
          title: nb.title,
          markAllRead: nb.markAllRead,
          empty: nb.empty,
          markAsRead: nb.markAsRead,
          markAsUnread: nb.markAsUnread,
          justNow: nb.justNow,
        }}
        contentTranslations={{
          new_booking: { title: nb.notifNewBookingTitle, message: nb.notifNewBookingMessage },
          ticket_reply: { title: nb.notifTicketReplyTitle, message: nb.notifTicketReplyMessage },
          ticket_resolved: { title: nb.notifTicketResolvedTitle, message: nb.notifTicketResolvedMessage },
          ticket_updated: { title: nb.notifTicketUpdatedTitle, message: nb.notifTicketUpdatedMessage },
          system: { title: nb.notifReopenedTitle, message: nb.notifReopenedMessage },
        }}
        locale={locale}
        role="professional"
      />
      <LanguageSwitcher locale={locale} />
      <ThemeToggle size="sm" lightLabel={t.common.lightMode} darkLabel={t.common.darkMode} />
      <Avatar className="ml-2 size-8">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={initials} />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
    </header>
  );
}
