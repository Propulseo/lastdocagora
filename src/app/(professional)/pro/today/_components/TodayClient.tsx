"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { markAttendance } from "@/app/(professional)/_actions/attendance";
import { PatientDrawer } from "@/app/(professional)/pro/patients/_components/patient-drawer";
import { WalkInDialog } from "@/app/(professional)/pro/agenda/_components/WalkInDialog";
import { useTodayData, type TodayFilter } from "../_hooks/useTodayData";
import { RADIUS } from "@/lib/design-tokens";
import { TodayAppointmentCard } from "./TodayAppointmentCard";
import { TodayStickyHeader } from "./TodayStickyHeader";
import { PostConsultationModal } from "./PostConsultationModal";

interface TodayClientProps {
  professionalId: string;
  userId: string;
}

export function TodayClient({ professionalId, userId }: TodayClientProps) {
  const { t, locale } = useProfessionalI18n();
  const todayT = t.today as Record<string, unknown>;
  const filtersT = todayT.filters as Record<string, string>;
  const statsT = todayT.stats as Record<string, string>;
  const attendanceT = t.agenda.attendance;
  const dateLocale = t.common.dateLocale as string;

  // Day navigation
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateStr = selectedDate.toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = dateStr === todayStr;
  const maxFuture = new Date();
  maxFuture.setDate(maxFuture.getDate() + 7);
  const isMaxFuture = dateStr >= maxFuture.toISOString().slice(0, 10);

  const onPrevDay = useCallback(() => {
    setSelectedDate((d) => { const p = new Date(d); p.setDate(p.getDate() - 1); return p; });
  }, []);
  const onNextDay = useCallback(() => {
    setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }, []);
  const onGoToday = useCallback(() => setSelectedDate(new Date()), []);

  const {
    appointments,
    loading,
    filter,
    setFilter,
    stats,
    currentAppointmentId,
    handleAttendanceChange,
    refresh,
  } = useTodayData({ professionalId, dateStr });

  const [walkInOpen, setWalkInOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");

  // Post-consultation modal state
  const [postConsultOpen, setPostConsultOpen] = useState(false);
  const [postConsultAppointmentId, setPostConsultAppointmentId] = useState("");
  const [postConsultPatientId, setPostConsultPatientId] = useState("");
  const [postConsultPatientName, setPostConsultPatientName] = useState("");

  const currentRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!loading && currentRef.current && !hasScrolled.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      hasScrolled.current = true;
    }
  }, [loading]);

  const displayDate = selectedDate.toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const filterKeys: TodayFilter[] = ["all", "pending", "confirmed", "present", "absent"];

  const isPast = (time: string, duration: number) => {
    if (!isToday) return false;
    const now = new Date();
    const [h, m] = time.split(":").map(Number);
    const endMinutes = h * 60 + m + (duration || 30);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return endMinutes <= currentMinutes;
  };

  async function handleMarkAttendance(
    appointmentId: string,
    status: "present" | "absent" | "late"
  ) {
    const result = await markAttendance(appointmentId, status);
    if (result.success) {
      handleAttendanceChange(appointmentId, status, result.appointmentStatus);
      toast.success(attendanceT.updated);

      // Open post-consultation modal for "present" or "late"
      if (status === "present" || status === "late") {
        const apt = appointments.find((a) => a.id === appointmentId);
        if (apt) {
          const name = [apt.patient_first_name, apt.patient_last_name]
            .filter(Boolean)
            .join(" ") || apt.title || "";
          setPostConsultAppointmentId(appointmentId);
          setPostConsultPatientId(apt.patient_id ?? "");
          setPostConsultPatientName(name);
          setPostConsultOpen(true);
        }
      }
    } else {
      toast.error(
        result.error === "ATTENDANCE_LOCKED_PRESENT"
          ? attendanceT.lockedPresent
          : result.error === "ABSENT_TOO_EARLY"
            ? attendanceT.absentTooEarly
            : result.error === "LATE_TOO_EARLY"
              ? attendanceT.lateTooEarly
              : attendanceT.error,
      );
    }
  }

  const cardTranslations = {
    currentAppointment: todayT.currentAppointment as string,
    viewDetails: todayT.viewDetails as string,
    attendance: attendanceT as TodayCardAttendanceT,
    commonStatus: t.common.status as unknown as Record<string, string>,
    commonMin: t.common.min,
    locale,
  };

  return (
    <div className="flex flex-col h-full">
      <TodayStickyHeader
        title={todayT.title as string}
        todayDate={displayDate}
        walkInButtonLabel={(t.agenda.walkIn as Record<string, string>).button}
        onWalkInClick={() => setWalkInOpen(true)}
        stats={stats}
        statsLabels={statsT}
        filter={filter}
        filterKeys={filterKeys}
        filterLabels={filtersT}
        onFilterChange={setFilter}
        isToday={isToday}
        isMaxFuture={isMaxFuture}
        onPrevDay={onPrevDay}
        onNextDay={onNextDay}
        onGoToday={onGoToday}
        todayButtonLabel={todayT.todayButton as string}
        walkInTodayOnlyLabel={todayT.walkInTodayOnly as string}
      />

      <div className={`flex-1 overflow-y-auto py-4 space-y-3 pb-20 lg:pb-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
        {loading && appointments.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`h-28 ${RADIUS.card}`} />
          ))
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {isToday ? (todayT.noAppointments as string) : (todayT.noAppointmentsDate as string)}
            </p>
          </div>
        ) : (
          appointments.map((apt) => (
            <TodayAppointmentCard
              key={apt.id}
              apt={apt}
              isCurrent={isToday && apt.id === currentAppointmentId}
              isPast={isPast(apt.appointment_time, apt.duration_minutes)}
              currentRef={isToday && apt.id === currentAppointmentId ? currentRef : undefined}
              onMarkAttendance={handleMarkAttendance}
              onViewPatient={(patientId, name) => {
                setSelectedPatientId(patientId);
                setSelectedPatientName(name);
              }}
              translations={cardTranslations}
            />
          ))
        )}
      </div>

      {isToday && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 lg:hidden">
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
            onClick={() => setWalkInOpen(true)}
          >
            <UserPlus className="size-4" />
            Walk-in
          </Button>
        </div>
      )}

      <WalkInDialog
        open={walkInOpen}
        onOpenChange={setWalkInOpen}
        professionalId={professionalId}
        onCreated={refresh}
      />

      <PatientDrawer
        patientId={selectedPatientId}
        patientName={selectedPatientName}
        onClose={() => setSelectedPatientId(null)}
      />

      <PostConsultationModal
        appointmentId={postConsultAppointmentId}
        patientId={postConsultPatientId}
        patientName={postConsultPatientName}
        professionalId={professionalId}
        open={postConsultOpen}
        onClose={() => setPostConsultOpen(false)}
      />
    </div>
  );
}

type TodayCardAttendanceT = {
  statusPresent: string;
  statusAbsent: string;
  statusLate: string;
  absentTooEarly: string;
  lateTooEarly: string;
  [key: string]: string;
};
