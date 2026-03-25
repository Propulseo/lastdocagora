"use client";

import { Menu, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AdminMobileHeaderProps {
  user: {
    firstName: string;
    lastName: string;
  };
  onMenuOpen: () => void;
}

export function AdminMobileHeader({ user, onMenuOpen }: AdminMobileHeaderProps) {
  const { t } = useAdminI18n();
  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "");

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border/60 bg-background px-4 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="min-h-[44px] min-w-[44px]"
        onClick={onMenuOpen}
        aria-label={t.mobile.openMenu}
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex flex-1 items-center justify-center gap-1.5">
        <span className="text-sm font-bold tracking-tight">DOCAGORA</span>
        <Badge variant="secondary" className="text-[10px]">
          Admin
        </Badge>
      </div>

      <ThemeToggle size="sm" />
      <Button
        variant="ghost"
        size="icon"
        className="min-h-[44px] min-w-[44px]"
        aria-label={t.mobile.notifications}
      >
        <Bell className="size-5" />
      </Button>

      <Avatar className="ml-1 size-8">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
    </header>
  );
}
