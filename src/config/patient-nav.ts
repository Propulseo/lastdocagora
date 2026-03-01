export const patientNav = [
  { key: "dashboard" as const, href: "/patient/dashboard", icon: "LayoutDashboard" },
  { key: "search" as const, href: "/patient/search", icon: "Search" },
  { key: "appointments" as const, href: "/patient/appointments", icon: "Calendar" },
  { key: "profile" as const, href: "/patient/profile", icon: "UserCircle" },
  { key: "messages" as const, href: "/patient/messages", icon: "MessageSquare" },
  { key: "settings" as const, href: "/patient/settings", icon: "Settings" },
] as const
