"use client";

import Link from "next/link";
import Image from "next/image";
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
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

interface AdminSidebarProps {
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
  openTicketCount?: number;
}

export function AdminSidebar({ user, openTicketCount }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useAdminI18n();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-0 py-0 overflow-hidden group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Image src="/logo.png" alt="DocAgora" width={480} height={320} className="h-[5.5rem] w-auto object-contain mx-auto -my-4" />
          <span className="text-[10px] font-medium text-muted-foreground">Admin</span>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex justify-center">
          <Image src="/logo-icon.png" alt="DocAgora" width={160} height={160} className="size-8 object-contain" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1 group-data-[collapsible=icon]:pt-2">
        {adminNavGroups.map((group, groupIdx) => (
          <SidebarGroup key={group.labelKey} className="py-0">
            {groupIdx > 0 && <SidebarSeparator className="mx-2 mb-1" />}
            <SidebarGroupLabel className="mb-0 px-3 pt-1 pb-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
              {t.sidebar.groups[group.labelKey]}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive = pathname.startsWith(item.href);
                  const hasTickets =
                    item.icon === "HeadphonesIcon" &&
                    openTicketCount != null &&
                    openTicketCount > 0;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "transition-colors duration-100",
                          isActive && "font-medium"
                        )}
                      >
                        <Link href={item.href}>
                          {Icon && (
                            <Icon
                              className={cn(
                                "size-4",
                                isActive
                                  ? "text-foreground"
                                  : "text-muted-foreground/60"
                              )}
                            />
                          )}
                          <span>{t.sidebar.items[item.titleKey]}</span>
                        </Link>
                      </SidebarMenuButton>
                      {hasTickets && (
                        <SidebarMenuBadge className="bg-foreground text-background text-[10px] font-medium min-w-5 justify-center">
                          {openTicketCount}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {/* Expanded */}
        <div className="space-y-2 group-data-[collapsible=icon]:hidden">
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
            <div className="flex-1" />
            <button
              onClick={handleLogout}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground/60 transition-colors duration-100 hover:text-foreground"
              aria-label={t.sidebar.logout}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        {/* Collapsed */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1">
          <LanguageSwitcher locale={locale} iconOnly />
          <ThemeToggle
            size="sm"
            lightLabel={t.common.lightMode}
            darkLabel={t.common.darkMode}
          />
          <button
            onClick={handleLogout}
            className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t.sidebar.logout}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
