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
  ChevronsUpDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePatientTranslations } from "@/locales/locale-context"
import { LanguageSwitcher } from "@/components/shared/language-switcher"

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

      <SidebarFooter className="border-t p-2">
        <div className="flex items-center justify-end group-data-[collapsible=icon]:hidden">
          <LanguageSwitcher locale={locale} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full transition-colors duration-150"
            >
              <Avatar size="sm">
                {user.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                )}
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden text-left group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/patient/profile">
                  <UserCircle className="size-4" />
                  {t.common.myProfile}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/patient/settings">
                  <Settings className="size-4" />
                  {t.common.settings}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              {t.common.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
