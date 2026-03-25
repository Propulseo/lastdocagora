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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

  const initials =
    (user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-4">
          <SheetTitle className="text-lg font-bold tracking-tight">
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
          <nav className="py-2">
            {adminNavGroups.map((group, groupIdx) => (
              <div key={group.labelKey}>
                {groupIdx > 0 && <Separator className="my-2" />}
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                        "flex h-12 w-full items-center gap-3 px-4 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      {Icon && <Icon className="size-4 shrink-0" />}
                      <span className="flex-1 text-left">
                        {t.sidebar.items[item.titleKey]}
                      </span>
                      {isSupport && openTicketCount > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          {openTicketCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="mt-auto border-t px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-sm leading-tight">
              <span className="truncate font-medium block">
                {user.first_name} {user.last_name}
              </span>
              <span className="text-muted-foreground truncate text-xs block">
                {user.email}
              </span>
            </div>
            <LanguageSwitcher locale={locale} />
          </div>
          <ThemeToggle variant="pill" />
          <button
            onClick={handleLogout}
            className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-4" />
            <span>{t.sidebar.logout}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
