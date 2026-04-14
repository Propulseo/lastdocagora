import type {
  AdminSidebarGroupKey,
  AdminSidebarItemKey,
} from "@/lib/i18n/admin";

export interface AdminNavItem {
  titleKey: AdminSidebarItemKey;
  href: string;
  icon: string;
}

export interface AdminNavGroup {
  labelKey: AdminSidebarGroupKey;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    labelKey: "general",
    items: [
      { titleKey: "dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    labelKey: "management",
    items: [
      { titleKey: "users", href: "/admin/users", icon: "Users" },
      { titleKey: "professionals", href: "/admin/professionals", icon: "Stethoscope" },
      { titleKey: "appointments", href: "/admin/appointments", icon: "Calendar" },
      { titleKey: "reviews", href: "/admin/reviews", icon: "Star" },
      { titleKey: "statistics", href: "/admin/statistics", icon: "BarChart2" },
    ],
  },
  {
    labelKey: "platform",
    items: [
      { titleKey: "content", href: "/admin/content", icon: "FileText" },
      { titleKey: "support", href: "/admin/support", icon: "HeadphonesIcon" },
      { titleKey: "settings", href: "/admin/settings", icon: "Settings" },
    ],
  },
];

export const adminNav = adminNavGroups.flatMap((g) => [...g.items]);
