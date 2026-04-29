"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart2,
  MoreHorizontal,
  ListChecks,
  Briefcase,
  Bell,
  HeadphonesIcon,
  User,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { useProNotificationsStore } from "@/stores/pro-notifications-store";
import { createClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const primaryTabs = [
  { key: "dashboard" as const, href: "/pro/dashboard", icon: LayoutDashboard },
  { key: "agenda" as const, href: "/pro/agenda", icon: Calendar },
  { key: "patients" as const, href: "/pro/patients", icon: Users },
  { key: "statistics" as const, href: "/pro/statistics", icon: BarChart2 },
] as const;

const secondaryItems = [
  { key: "today" as const, href: "/pro/today", icon: ListChecks },
  { key: "services" as const, href: "/pro/services", icon: Briefcase },
  { key: "reminders" as const, href: "/pro/reminders", icon: Bell },
  { key: "support" as const, href: "/pro/support", icon: HeadphonesIcon },
  { key: "profile" as const, href: "/pro/profile", icon: User },
  { key: "settings" as const, href: "/pro/settings", icon: Settings },
] as const;

export function ProBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useProfessionalI18n();
  const [moreOpen, setMoreOpen] = useState(false);
  const pendingCount = useProNotificationsStore((s) => s.pendingCount);

  const handleLogout = async () => {
    setMoreOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/pro/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const isMoreActive = secondaryItems.some((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex h-16 items-center justify-around">
          {primaryTabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            const isAgenda = tab.key === "agenda";

            if (isAgenda && pendingCount > 0) {
              return (
                <div
                  key={tab.href}
                  className={cn(
                    "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5",
                    active ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  <Link href={tab.href} prefetch={true} className="flex flex-col items-center active:scale-90 transition-transform">
                    <Icon className="size-6" />
                    <span className="text-[10px]">{t.mobileNav[tab.key]}</span>
                  </Link>
                  <Link
                    href="/pro/agenda?status=pending&view=day"
                    prefetch={true}
                    className={cn(
                      "absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white",
                      pendingCount >= 4 ? "bg-red-500 active:bg-red-600" : "bg-amber-500 active:bg-amber-600"
                    )}
                  >
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch={true}
                className={cn(
                  "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform",
                  active ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <Icon className="size-6" />
                <span className="text-[10px]">{t.mobileNav[tab.key]}</span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform",
              isMoreActive || moreOpen
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="size-6" />
            <span className="text-[10px]">{t.mobileNav.more}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[60vh] px-0 pb-safe">
          <SheetHeader className="px-4 pb-2">
            <SheetTitle>{t.mobileNav.more}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    setMoreOpen(false);
                    router.push(item.href);
                  }}
                  className="flex h-14 items-center gap-3 px-4 transition-all hover:bg-accent/50 active:scale-[0.98]"
                >
                  <Icon className="size-5 text-muted-foreground" />
                  <span className="flex-1 text-left text-sm font-medium">
                    {t.mobileNav[item.key]}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              );
            })}
            <Separator className="my-1" />
            <button
              onClick={handleLogout}
              className="flex h-14 items-center gap-3 px-4 text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
            >
              <LogOut className="size-5" />
              <span className="flex-1 text-left text-sm font-medium">
                {t.sidebar.logout}
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
