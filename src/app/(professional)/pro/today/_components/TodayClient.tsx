"use client";

import { useEffect, useRef, useState } from "react";
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

  const [walkInOpen, setWalkInOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");

  const currentRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!loading && currentRef.current && !hasScrolled.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      hasScrolled.current = true;
    }
  }, [loading]);

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
        todayDate={todayDate}
        walkInButtonLabel={(t.agenda.walkIn as Record<string, string>).button}
        onWalkInClick={() => setWalkInOpen(true)}
        stats={stats}
        statsLabels={statsT}
        filter={filter}
        filterKeys={filterKeys}
        filterLabels={filtersT}
        onFilterChange={setFilter}
      />

      <div className="flex-1 overflow-y-auto py-4 space-y-3 pb-20 lg:pb-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`h-28 ${RADIUS.card}`} />
          ))
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">{todayT.noAppointments as string}</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <TodayAppointmentCard
              key={apt.id}
              apt={apt}
              isCurrent={apt.id === currentAppointmentId}
              isPast={isPast(apt.appointment_time, apt.duration_minutes)}
              currentRef={apt.id === currentAppointmentId ? currentRef : undefined}
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

      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 lg:hidden">
        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
          onClick={() => setWalkInOpen(true)}
        >
          <UserPlus className="size-4" />
          Walk-in
        </Button>
      </div>

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
    </div>
  );
}

type TodayCardAttendanceT = {
  statusPresent: string;
  statusAbsent: string;
  statusLate: string;
  [key: string]: string;
};
