"use client";

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface DashboardHeroProps {
  firstName: string;
  pendingVerifications: number;
  openTickets: number;
}

function getGreeting(t: {
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
}) {
  const h = new Date().getHours();
  if (h < 12) return t.greetingMorning;
  if (h < 18) return t.greetingAfternoon;
  return t.greetingEvening;
}

export function DashboardHero({
  firstName,
  pendingVerifications,
  openTickets,
}: DashboardHeroProps) {
  const { t } = useAdminI18n();
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR" | "en-GB";

  const greeting = getGreeting(t.dashboard);
  const today = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const indicators = [
    pendingVerifications > 0 && `${pendingVerifications} ${t.dashboard.quickStatPending}`,
    openTickets > 0 && `${openTickets} ${t.dashboard.quickStatTickets}`,
  ].filter(Boolean);

  return (
    <div
      className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"
      style={{
        animation: "admin-fade-up 0.4s ease-out both",
      }}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">
          {today}
        </p>
      </div>

      {indicators.length > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {indicators.join(" · ")}
        </p>
      )}
    </div>
  );
}
