"use client"

import { usePathname } from "next/navigation"
import { usePatientTranslations } from "@/locales/locale-context"
import { MobileHeader } from "@/components/shared/mobile-header"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { UserAvatarMenu } from "@/components/shared/user-avatar-menu"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

interface PatientMobileHeaderProps {
  userId: string
  user: {
    avatarUrl?: string | null
    initials: string
  }
  locale: string
}

export function PatientMobileHeader({ userId, user, locale }: PatientMobileHeaderProps) {
  const { t } = usePatientTranslations()
  const pathname = usePathname()

  const segment = pathname.split("/")[2] ?? ""
  const navMap = t.nav as Record<string, string>
  const title = navMap[segment] ?? ""

  return (
    <MobileHeader title={title}>
      <ThemeToggle size="sm" />
      <NotificationBell
        userId={userId}
        translations={{
          title: t.messages.title,
          markAllRead: t.messages.markAllRead,
          empty: t.messages.emptyTitle,
          markAsRead: t.messages.markOneRead,
          markAsUnread: t.messages.markOneUnread,
          justNow: t.messages.justNow,
        }}
        locale={locale}
        role="patient"
      />
      <UserAvatarMenu
        user={user}
        profileHref="/patient/profile"
        translations={{
          myProfile: t.common.myProfile,
          logout: t.common.logout,
        }}
      />
    </MobileHeader>
  )
}
