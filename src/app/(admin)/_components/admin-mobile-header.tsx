"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileHeader } from "@/components/shared/mobile-header"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { UserAvatarMenu } from "@/components/shared/user-avatar-menu"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n"

interface AdminMobileHeaderProps {
  user: {
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  userId: string
  onMenuOpen: () => void
}

export function AdminMobileHeader({
  user,
  userId,
  onMenuOpen,
}: AdminMobileHeaderProps) {
  const { t, locale } = useAdminI18n()
  const pathname = usePathname()

  const segment = pathname.split("/")[2] ?? ""
  const itemsMap = t.sidebar.items as Record<string, string>
  const title = itemsMap[segment] ?? ""

  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")

  return (
    <MobileHeader
      title={title}
      leftAction={
        <Button
          variant="ghost"
          size="icon"
          className="size-9 min-h-[44px] min-w-[44px]"
          onClick={onMenuOpen}
          aria-label={t.mobile.openMenu}
        >
          <Menu className="size-5" />
        </Button>
      }
    >
      <ThemeToggle size="sm" />
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
      <UserAvatarMenu
        user={{ avatarUrl: user.avatarUrl, initials }}
        profileHref="/admin/settings"
        translations={{
          myProfile: t.sidebar.myProfile,
          logout: t.sidebar.logout,
        }}
      />
    </MobileHeader>
  )
}
