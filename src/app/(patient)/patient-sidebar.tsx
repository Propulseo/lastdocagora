"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Search,
  Calendar,
  UserCircle,
  Bell,
  Settings,
  LogOut,
  Heart,
} from "lucide-react"
import { patientNav } from "@/config/patient-nav"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { usePatientTranslations } from "@/locales/locale-context"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

const iconMap = {
  LayoutDashboard,
  Search,
  Calendar,
  UserCircle,
  Bell,
  Settings,
  Heart,
} as const

type UserInfo = {
  name: string
  email: string
  avatarUrl?: string
  initials: string
}

type PatientSidebarProps = {
  user: UserInfo
  unreadCount?: number
  locale: string
}

export function PatientSidebar({ user, unreadCount = 0, locale }: PatientSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = usePatientTranslations()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const isNavActive = (href: string) => {
    if (href === "/patient/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
          DOCAGORA
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {patientNav.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap]
                const isActive = isNavActive(item.href)
                const isMessages = item.icon === "Bell"
                const label = t.nav[item.key]
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                      className="transition-colors duration-150"
                    >
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{label}</span>
                        {isMessages && unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto size-5 p-0 text-[10px]"
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <Avatar size="sm">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            )}
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-sm leading-tight">
            <span className="truncate font-medium block">
              {user.name}
            </span>
            <span className="text-muted-foreground truncate text-xs block">
              {user.email}
            </span>
          </div>
          <LanguageSwitcher locale={locale} />
          <ThemeToggle size="sm" lightLabel={t.common.lightMode} darkLabel={t.common.darkMode} />
          <button
            onClick={handleLogout}
            className="size-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t.common.logout}
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1 px-0">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle size="sm" lightLabel={t.common.lightMode} darkLabel={t.common.darkMode} />
          <button
            onClick={handleLogout}
            className="size-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t.common.logout}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
