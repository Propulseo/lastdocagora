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
  Star,
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
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
  Star,
};

interface ProSidebarProps {
  openTicketCount?: number;
}

export function ProSidebar({ openTicketCount }: ProSidebarProps) {
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary">
            <span className="text-sm font-bold text-primary-foreground">D</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            DOCAGORA
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navGroups.map((group, groupIndex) => {
          const items = professionalNav.filter((n) => n.group === group.key);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.key}>
              <SidebarGroupLabel className="px-5 pt-5 pb-2 text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
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
                          className={cn(
                            "mx-2 rounded-xl px-4 py-2.5 transition-all duration-150",
                            isActive && "border-l-2 border-l-primary shadow-sm"
                          )}
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
                                    "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums transition-colors",
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

      <SidebarFooter className="border-t px-4 py-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-0">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle size="sm" lightLabel={t.common.lightMode} darkLabel={t.common.darkMode} />
          <button
            onClick={handleLogout}
            className="size-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t.sidebar.logout}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
