"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  CalendarDays,
  ListChecks,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { markAttendance } from "@/app/(professional)/_actions/attendance";
import {
  ATTENDANCE_BADGE_COLORS,
  STATUS_PILL_COLORS,
} from "@/app/(professional)/pro/agenda/_lib/agenda-constants";
import { PatientDrawer } from "@/app/(professional)/pro/patients/_components/patient-drawer";
import { WalkInDialog } from "@/app/(professional)/pro/agenda/_components/WalkInDialog";
import {
  useTodayData,
  type TodayFilter,
} from "../_hooks/useTodayData";

interface TodayClientProps {
  professionalId: string;
  userId: string;
}

export function TodayClient({ professionalId, userId }: TodayClientProps) {
  const { t } = useProfessionalI18n();
  const todayT = t.today as Record<string, unknown>;
  const filtersT = todayT.filters as Record<string, string>;
  const statsT = todayT.stats as Record<string, string>;
  const attendanceT = t.agenda.attendance;
  const dateLocale = t.common.dateLocale as string;

  const {
    appointments,
    loading,
    filter,
    setFilter,
    stats,
    currentAppointmentId,
    handleAttendanceChange,
    refresh,
  } = useTodayData({ professionalId });

  // Walk-in dialog state
  const [walkInOpen, setWalkInOpen] = useState(false);

  // Patient drawer state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");

  // Auto-scroll to current appointment
  const currentRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!loading && currentRef.current && !hasScrolled.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      hasScrolled.current = true;
    }
  }, [loading]);

  // Format today's date
  const todayDate = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const filterKeys: TodayFilter[] = ["all", "pending", "confirmed", "present", "absent"];

  const isPast = (time: string, duration: number) => {
    const now = new Date();
    const [h, m] = time.split(":").map(Number);
    const endMinutes = h * 60 + m + (duration || 30);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return endMinutes <= currentMinutes;
  };

  const formatTimeRange = (time: string, duration: number) => {
    const [h, m] = time.split(":").map(Number);
    const endTotal = h * 60 + m + (duration || 30);
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    return `${time.slice(0, 5)} → ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  async function handleMarkAttendance(
    appointmentId: string,
    status: "present" | "absent" | "late"
  ) {
    const result = await markAttendance(appointmentId, status);
    if (result.success) {
      handleAttendanceChange(appointmentId, status, result.appointmentStatus);
      toast.success(attendanceT.updated);
    } else {
      toast.error(attendanceT.error);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4 sm:px-6">
          {/* Title + date */}
          <div className="flex items-center gap-3 mb-3">
            <ListChecks className="size-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{todayT.title as string}</h1>
              <p className="text-sm text-muted-foreground capitalize">{todayDate}</p>
            </div>
          </div>

          {/* Walk-in button */}
          <div className="mb-3">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950 gap-2"
              onClick={() => setWalkInOpen(true)}
            >
              <UserPlus className="size-4" />
              {(t.agenda.walkIn as Record<string, string>).button}
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mb-3 text-sm">
            <span className="font-semibold tabular-nums">
              {stats.total} <span className="font-normal text-muted-foreground">{statsT.total}</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.confirmed} <span className="font-normal">{statsT.confirmed}</span>
            </span>
            <span className="text-blue-600 dark:text-blue-400 tabular-nums">
              {stats.present} <span className="font-normal">{statsT.present}</span>
            </span>
            <span className="text-orange-600 dark:text-orange-400 tabular-nums">
              {stats.pending} <span className="font-normal">{statsT.pending}</span>
            </span>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterKeys.map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  filter === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {filtersT[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-3 pb-20 lg:pb-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">{todayT.noAppointments as string}</p>
          </div>
        ) : (
          appointments.map((apt) => {
            const isCurrent = apt.id === currentAppointmentId;
            const past = isPast(apt.appointment_time, apt.duration_minutes);
            const patientName = [apt.patient_first_name, apt.patient_last_name].filter(Boolean).join(" ") || apt.title || "—";
            const initials = `${apt.patient_first_name?.[0] ?? ""}${apt.patient_last_name?.[0] ?? ""}`.toUpperCase() || "?";

            return (
              <div
                key={apt.id}
                ref={isCurrent ? currentRef : undefined}
                className={cn(
                  "rounded-xl border-2 p-4 transition-all",
                  isCurrent && "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20",
                  past && !isCurrent && "opacity-60"
                )}
              >
                {/* Current badge */}
                {isCurrent && (
                  <Badge className="mb-2 bg-primary text-primary-foreground text-[10px]">
                    {todayT.currentAppointment as string}
                  </Badge>
                )}

                <div className="flex items-start gap-3">
                  {/* Time column */}
                  <div className="shrink-0 text-right w-20">
                    <p className="text-2xl font-bold tabular-nums leading-tight text-primary">
                      {apt.appointment_time.slice(0, 5)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeRange(apt.appointment_time, apt.duration_minutes)}
                    </p>
                  </div>

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="size-12">
                        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-lg">{patientName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {apt.service_name ?? apt.consultation_type ?? ""}{" "}
                          {apt.duration_minutes ? `• ${apt.duration_minutes} ${t.common.min}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Status pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {apt.created_via === "walk_in" && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                          Walk-in
                        </Badge>
                      )}
                      {apt.attendance_status && apt.attendance_status !== "waiting" && (
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", ATTENDANCE_BADGE_COLORS[apt.attendance_status])}>
                          {attendanceT[`status${apt.attendance_status.charAt(0).toUpperCase() + apt.attendance_status.slice(1)}` as keyof typeof attendanceT] ?? apt.attendance_status}
                        </span>
                      )}
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", STATUS_PILL_COLORS[apt.status])}>
                        {t.common.status[apt.status as keyof typeof t.common.status] ?? apt.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 h-8 text-xs"
                    onClick={() => handleMarkAttendance(apt.id, "present")}
                    disabled={apt.attendance_status === "present"}
                  >
                    <CheckCircle className="size-3.5 mr-1" />
                    {attendanceT.statusPresent}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950 h-8 text-xs"
                    onClick={() => handleMarkAttendance(apt.id, "absent")}
                    disabled={apt.attendance_status === "absent"}
                  >
                    <XCircle className="size-3.5 mr-1" />
                    {attendanceT.statusAbsent}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 h-8 text-xs"
                    onClick={() => handleMarkAttendance(apt.id, "late")}
                    disabled={apt.attendance_status === "late"}
                  >
                    <Clock className="size-3.5 mr-1" />
                    {attendanceT.statusLate}
                  </Button>
                  {apt.patient_id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-8 text-xs"
                      onClick={() => {
                        setSelectedPatientId(apt.patient_id);
                        setSelectedPatientName(patientName);
                      }}
                    >
                      {todayT.viewDetails as string}
                      <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile walk-in button */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 lg:hidden">
        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
          onClick={() => setWalkInOpen(true)}
        >
          <UserPlus className="size-4" />
          Walk-in
        </Button>
      </div>

      {/* Walk-in dialog */}
      <WalkInDialog
        open={walkInOpen}
        onOpenChange={setWalkInOpen}
        professionalId={professionalId}
        onCreated={refresh}
      />

      {/* Patient drawer */}
      <PatientDrawer
        patientId={selectedPatientId}
        patientName={selectedPatientName}
        onClose={() => setSelectedPatientId(null)}
      />
    </div>
  );
}
