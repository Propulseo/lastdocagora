"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Search, Calendar, MessageSquare, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePatientTranslations } from "@/locales/locale-context"
import { createClient } from "@/lib/supabase/client"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const navItems = [
  { key: "home" as const, href: "/patient/dashboard", icon: Home },
  { key: "search" as const, href: "/patient/search", icon: Search },
  { key: "appointments" as const, href: "/patient/appointments", icon: Calendar },
  { key: "messages" as const, href: "/patient/notifications", icon: MessageSquare },
]

export function PatientBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = usePatientTranslations()
  const [profileOpen, setProfileOpen] = useState(false)

  const isNavActive = (href: string) => {
    if (href === "/patient/dashboard") return pathname === href
    return pathname.startsWith(href)
  }

  const isProfileActive = pathname.startsWith("/patient/profile")

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const active = isNavActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform",
                  active ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <Icon className="size-6" />
                <span className="text-[10px]">{t.mobileNav[item.key]}</span>
              </Link>
            )
          })}

          <button
            onClick={() => setProfileOpen(true)}
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform",
              isProfileActive || profileOpen
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            <User className="size-6" />
            <span className="text-[10px]">{t.mobileNav.profile}</span>
          </button>
        </div>
      </nav>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="bottom" className="max-h-[40vh] px-0 pb-safe">
          <SheetHeader className="px-4 pb-2">
            <SheetTitle>{t.mobileNav.profile}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col">
            <button
              onClick={() => {
                setProfileOpen(false)
                router.push("/patient/profile")
              }}
              className="flex h-14 items-center gap-3 px-4 transition-all hover:bg-accent/50 active:scale-[0.98]"
            >
              <User className="size-5 text-muted-foreground" />
              <span className="flex-1 text-left text-sm font-medium">
                {t.common.myProfile}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="flex h-14 items-center gap-3 px-4 text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
            >
              <LogOut className="size-5" />
              <span className="flex-1 text-left text-sm font-medium">
                {t.common.logout}
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
