"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useProfessionalI18n } from "@/lib/i18n/pro";

export interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string | null;
  duration_minutes: number | null;
  status: string | null;
  consultation_type: string | null;
  patients: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  services: { name: string } | null;
}

export interface RecentPatient {
  id: string;
  firstName: string;
  lastName: string;
  lastVisit: string;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface DashboardProps {
  firstName: string;
  onboardingCompleted: boolean;
  todayAppointments: Appointment[];
  yesterdayCount: number;
  totalPatients: number;
  pendingCount: number;
  attendanceRate: number;
  dailyCounts: DailyCount[];
  thisWeekCount: number;
  lastWeekCount: number;
  upcomingAppointments: Appointment[];
  recentPatients: RecentPatient[];
  tomorrowCount: number;
  unconfirmedNext24h: number;
  noShowRate: number;
  nextAvailableSlot: string | null;
}

export function useDashboardData(props: DashboardProps) {
  const { t, locale } = useProfessionalI18n();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);

  // Update current time every minute for "now" indicator
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const dateLocale = t.common.dateLocale as string;

  const formattedDate = useMemo(
    () =>
      currentTime.toLocaleDateString(dateLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [currentTime, dateLocale]
  );

  const currentTimeStr = format(currentTime, "HH:mm");

  // Determine if within office hours (8-20)
  const currentHour = currentTime.getHours();
  const isOfficeHours = currentHour >= 8 && currentHour < 20;

  // KPI deltas
  const todayCount = props.todayAppointments.length;
  const todayDelta = todayCount - props.yesterdayCount;
  const weekDelta = props.thisWeekCount - props.lastWeekCount;

  // No-show gauge color
  const noShowColor: "emerald" | "amber" | "red" =
    props.noShowRate < 5
      ? "emerald"
      : props.noShowRate <= 15
        ? "amber"
        : "red";

  // Classify today's appointments as past/future
  const classifiedAppointments = useMemo(() => {
    return props.todayAppointments.map((apt) => {
      const isPast = apt.appointment_time
        ? apt.appointment_time.slice(0, 5) < currentTimeStr
        : false;
      return { ...apt, isPast };
    });
  }, [props.todayAppointments, currentTimeStr]);

  return {
    t,
    locale,
    currentTime,
    currentTimeStr,
    formattedDate,
    isOfficeHours,
    todayCount,
    todayDelta,
    weekDelta,
    noShowColor,
    classifiedAppointments,
    profileBannerDismissed,
    setProfileBannerDismissed,
    ...props,
  };
}

export type DashboardData = ReturnType<typeof useDashboardData>;
