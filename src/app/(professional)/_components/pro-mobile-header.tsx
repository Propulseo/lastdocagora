"use client"

import { usePathname } from "next/navigation"
import { MobileHeader } from "@/components/shared/mobile-header"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { UserAvatarMenu } from "@/components/shared/user-avatar-menu"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useProfessionalI18n } from "@/lib/i18n/pro"

interface ProMobileHeaderProps {
  user: {
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  userId: string
}

export function ProMobileHeader({ user, userId }: ProMobileHeaderProps) {
  const { t, locale } = useProfessionalI18n()
  const pathname = usePathname()

  const segment = pathname.split("/")[2] ?? ""
  const navMap = t.nav as Record<string, string>
  const title = navMap[segment] ?? ""

  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")

  return (
    <MobileHeader title={title}>
      <ThemeToggle size="sm" />
      <NotificationBell
        userId={userId}
        translations={{
          title: (t.notificationBell as Record<string, string>).title,
          markAllRead: (t.notificationBell as Record<string, string>).markAllRead,
          empty: (t.notificationBell as Record<string, string>).empty,
          markAsRead: (t.notificationBell as Record<string, string>).markAsRead,
          markAsUnread: (t.notificationBell as Record<string, string>).markAsUnread,
          justNow: (t.notificationBell as Record<string, string>).justNow,
        }}
        locale={locale}
        role="professional"
      />
      <UserAvatarMenu
        user={{ avatarUrl: user.avatarUrl, initials }}
        profileHref="/pro/profile"
        translations={{
          myProfile: t.sidebar.myProfile,
          logout: t.sidebar.logout,
        }}
      />
    </MobileHeader>
  )
}
