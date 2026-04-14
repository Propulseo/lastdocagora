export const professionalNav = [
  { title: "Dashboard", href: "/pro/dashboard", icon: "LayoutDashboard", group: "main", translationKey: "dashboard" },
  { title: "Agenda", href: "/pro/agenda", icon: "Calendar", group: "main", translationKey: "agenda" },
  { title: "Hoje", href: "/pro/today", icon: "ListChecks", group: "main", translationKey: "today" },
  { title: "Pacientes", href: "/pro/patients", icon: "Users", group: "main", translationKey: "patients" },
  { title: "Lembretes", href: "/pro/reminders", icon: "Bell", group: "manage", translationKey: "reminders" },
  { title: "Serviços", href: "/pro/services", icon: "Briefcase", group: "manage", translationKey: "services" },
  { title: "Avaliações", href: "/pro/reviews", icon: "Star", group: "manage", translationKey: "reviews" },
  { title: "Estatísticas", href: "/pro/statistics", icon: "BarChart3", group: "manage", translationKey: "statistics" },
  { title: "Suporte", href: "/pro/support", icon: "LifeBuoy", group: "account", translationKey: "support" },
  { title: "Meu Perfil", href: "/pro/profile", icon: "UserCircle", group: "account", translationKey: "profile" },
  { title: "Configurações", href: "/pro/settings", icon: "Settings", group: "account", translationKey: "settings" },
] as const;

export type ProfessionalNavItem = (typeof professionalNav)[number];

export const navGroups = [
  { key: "main", label: "Principal", translationKey: "main" },
  { key: "manage", label: "Gestão", translationKey: "manage" },
  { key: "account", label: "Conta", translationKey: "account" },
] as const;
