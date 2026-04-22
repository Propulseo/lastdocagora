"use client";

import Link from "next/link";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { adminNavGroups } from "@/config/admin-nav";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
      <SidebarHeader className="border-b px-4 py-4">
        <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">DOCAGORA</span>
      </SidebarHeader>

      <SidebarContent>
        {adminNavGroups.map((group, groupIdx) => (
          <SidebarGroup key={group.labelKey}>
            {groupIdx > 0 && <SidebarSeparator className="mb-2" />}
            <SidebarGroupLabel>
              {t.sidebar.groups[group.labelKey]}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Link href={item.href}>
                          {Icon && <Icon className="size-4" />}
                          <span>{t.sidebar.items[item.titleKey]}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.icon === "HeadphonesIcon" &&
                        openTicketCount != null &&
                        openTicketCount > 0 && (
                          <SidebarMenuBadge>{openTicketCount}</SidebarMenuBadge>
                        )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <Avatar size="sm">
            <AvatarFallback>
              {user.first_name[0]}
              {user.last_name[0]}
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
          <ThemeToggle size="sm" lightLabel={t.common.lightMode} darkLabel={t.common.darkMode} />
          <button
            onClick={handleLogout}
            className="size-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
            aria-label={t.sidebar.logout}
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1 px-0">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle size="sm" lightLabel={t.common.lightMode} darkLabel={t.common.darkMode} />
          <button
            onClick={handleLogout}
            className="size-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
            aria-label={t.sidebar.logout}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
