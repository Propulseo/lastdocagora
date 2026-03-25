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
  Briefcase,
  Bell,
  HeadphonesIcon,
  User,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro";
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
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5",
                  active ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                <span className="text-[10px]">{t.mobileNav[tab.key]}</span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5",
              isMoreActive || moreOpen
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="size-5" />
            <span className="text-[10px]">{t.mobileNav.more}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[60vh] px-0">
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
                  className="flex h-14 items-center gap-3 px-4 transition-colors hover:bg-accent/50"
                >
                  <Icon className="size-5 text-muted-foreground" />
                  <span className="flex-1 text-left text-sm font-medium">
                    {t.mobileNav[item.key]}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
