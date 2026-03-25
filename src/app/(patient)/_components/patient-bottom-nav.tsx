"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Calendar, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePatientTranslations } from "@/locales/locale-context"

const navItems = [
  { key: "home" as const, href: "/patient/dashboard", icon: Home },
  { key: "search" as const, href: "/patient/search", icon: Search },
  { key: "appointments" as const, href: "/patient/appointments", icon: Calendar },
  { key: "messages" as const, href: "/patient/notifications", icon: MessageSquare },
  { key: "profile" as const, href: "/patient/profile", icon: User },
]

export function PatientBottomNav() {
  const pathname = usePathname()
  const { t } = usePatientTranslations()

  const isNavActive = (href: string) => {
    if (href === "/patient/dashboard") return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const active = isNavActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5",
                active ? "text-[#3da4ab] font-medium" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="text-[10px]">{t.mobileNav[item.key]}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
