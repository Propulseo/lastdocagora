"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  Briefcase,
  BarChart3,
  UserCircle,
  Settings,
  LogOut,
  LifeBuoy,
  ListChecks,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { professionalNav, navGroups } from "@/config/professional-nav";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useProNotificationsStore } from "@/stores/pro-notifications-store";

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  Briefcase,
  BarChart3,
  UserCircle,
  Settings,
  LifeBuoy,
  ListChecks,
};

interface ProSidebarProps {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  openTicketCount?: number;
  userId: string;
}

export function ProSidebar({ user, openTicketCount, userId }: ProSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useProfessionalI18n();
  const pendingCount = useProNotificationsStore((s) => s.pendingCount);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "");

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          DOCAGORA
        </span>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navGroups.map((group, groupIndex) => {
          const items = professionalNav.filter((n) => n.group === group.key);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.key}>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
                {t.navGroups[group.translationKey as keyof typeof t.navGroups] ?? group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    const label = t.nav[item.translationKey as keyof typeof t.nav] ?? item.title;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={label}
                        >
                          <Link href={item.href}>
                            {Icon && <Icon className="size-5" strokeWidth={1.5} />}
                            <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.icon === "Calendar" &&
                          pendingCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href="/pro/agenda?status=pending&view=day"
                                  onClick={(e) => e.stopPropagation()}
                                  className={cn(
                                    "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-bold tabular-nums transition-colors",
                                    "peer-data-[size=default]/menu-button:top-1.5",
                                    "group-data-[collapsible=icon]:hidden",
                                    pendingCount >= 4
                                      ? "bg-red-500 text-white hover:bg-red-600"
                                      : "bg-amber-400 text-amber-950 hover:bg-amber-500"
                                  )}
                                >
                                  {pendingCount}
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {(t.sidebar.pendingBadgeTooltip as string).replace("{count}", String(pendingCount))}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        {item.icon === "LifeBuoy" &&
                          openTicketCount != null &&
                          openTicketCount > 0 && (
                            <SidebarMenuBadge>{openTicketCount}</SidebarMenuBadge>
                          )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
              {groupIndex < navGroups.length - 1 && <SidebarSeparator className="my-1" />}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-8 ring-2 ring-sidebar-border">
            <AvatarImage
              src={user.avatarUrl ?? undefined}
              alt={user.firstName}
            />
            <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/50">
              {user.email}
            </p>
          </div>
          <LanguageSwitcher locale={locale} />
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={handleLogout}
            title={t.sidebar.logout}
          >
            <LogOut className="size-5" strokeWidth={1.5} />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
