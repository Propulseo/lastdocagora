"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  FileText,
  HeadphonesIcon,
  Settings,
  BarChart2,
  Star,
  LogOut,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { adminNavGroups } from "@/config/admin-nav";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  FileText,
  HeadphonesIcon,
  Settings,
  BarChart2,
  Star,
};

interface AdminMobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
  openTicketCount: number;
}

export function AdminMobileNav({
  open,
  onOpenChange,
  user,
  openTicketCount,
}: AdminMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useAdminI18n();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  function navigate(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[272px] p-0 flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <SheetTitle className="text-sm font-semibold tracking-tight">
            DOCAGORA
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => onOpenChange(false)}
            aria-label={t.mobile.closeMenu}
          >
            <X className="size-5" />
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <nav className="px-2 py-2">
            {adminNavGroups.map((group, groupIdx) => (
              <div key={group.labelKey} className="mb-1">
                {groupIdx > 0 && <Separator className="mx-2 my-2" />}
                <p className="mb-0.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  {t.sidebar.groups[group.labelKey]}
                </p>
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive = pathname.startsWith(item.href);
                  const isSupport = item.icon === "HeadphonesIcon";
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors duration-100",
                        isActive
                          ? "bg-accent font-medium"
                          : "text-foreground hover:bg-accent/50"
                      )}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            "size-4 shrink-0",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground/60"
                          )}
                        />
                      )}
                      <span className="flex-1 text-left">
                        {t.sidebar.items[item.titleKey]}
                      </span>
                      {isSupport && openTicketCount > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-md bg-foreground text-[10px] font-medium text-background">
                          {openTicketCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-border p-3 space-y-2">
          <div className="px-1">
            <p className="truncate text-sm font-medium leading-tight">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-1 px-0.5">
            <LanguageSwitcher locale={locale} />
            <ThemeToggle
              size="sm"
              lightLabel={t.common.lightMode}
              darkLabel={t.common.darkMode}
            />
          </div>

          <button
            onClick={handleLogout}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors duration-100 hover:text-foreground"
          >
            <LogOut className="size-4" />
            <span>{t.sidebar.logout}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
