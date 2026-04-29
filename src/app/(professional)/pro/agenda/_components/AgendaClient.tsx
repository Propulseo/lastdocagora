"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useIsMobileLg } from "@/hooks/use-mobile-lg";
import { useAgendaData } from "../_hooks/useAgendaData";
import { AgendaControlBar } from "./AgendaControlBar";
import { AttendanceStats } from "./AttendanceStats";
import { AttendanceRate } from "./AttendanceRate";
import { DayTimeGrid, type ClipboardData } from "./DayTimeGrid";
import { WeekTimeGrid } from "./WeekTimeGrid";
import { MonthGrid } from "./MonthGrid";
import { NewAvailabilityModal } from "./NewAvailabilityModal";
import { CreateManualAppointmentDialog } from "./CreateManualAppointmentDialog";
import { CalendarIntegrationDialog } from "./CalendarIntegrationDialog";
import { WalkInDialog } from "./WalkInDialog";
import { PendingBanner } from "./PendingBanner";

// Re-export types for backward compat (consumed by page.tsx)
export type { Appointment, ExternalEvent } from "../_types/agenda";

interface AgendaClientProps {
  professionalId: string;
  userId: string;
}

export function AgendaClient({ professionalId, userId }: AgendaClientProps) {
  const agenda = useAgendaData({ professionalId, userId });
  const isMobile = useIsMobileLg();
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  useEffect(() => {
    if (isMobile && agenda.periodFilter !== "day") {
      agenda.setPeriodFilter("day");
    }
  }, [isMobile, agenda.periodFilter]);

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader
        title={agenda.t.agenda.title}
        description={agenda.t.agenda.description}
        action={
          <div className="hidden gap-2 sm:flex">
            <Button
              variant="outline"
              className="border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950 gap-2"
              onClick={() => setWalkInDialogOpen(true)}
            >
              <UserPlus className="size-4" />
              {(agenda.t.agenda.walkIn as Record<string, string>).button}
            </Button>
            <Button
              variant="outline"
              onClick={() => agenda.setCalendarDialogOpen(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {agenda.t.agenda.externalCalendars}
            </Button>
            <Button onClick={() => agenda.setModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {agenda.t.agenda.newSlot}
            </Button>
          </div>
        }
      />

      <AgendaControlBar
        periodFilter={agenda.periodFilter}
        onPeriodChange={agenda.setPeriodFilter}
        statusFilters={agenda.statusFilters}
        onStatusChange={agenda.setStatusFilters}
        selectedDate={agenda.selectedDate}
        onDateChange={agenda.setSelectedDate}
      />

      <PendingBanner
        professionalId={professionalId}
        onStatusChanged={agenda.refresh}
        onAppointmentUpdate={agenda.handleAttendanceChange}
      />

      <AttendanceStats stats={agenda.stats} />
      <AttendanceRate stats={agenda.stats} />

      {agenda.periodFilter === "day" && (
        <DayTimeGrid
          appointments={agenda.appointments}
          externalEvents={agenda.externalEvents}
          availabilitySlots={agenda.availabilitySlots}
          loading={agenda.loading}
          selectedDate={agenda.selectedDate}
          professionalId={professionalId}
          onAttendanceChange={agenda.handleAttendanceChange}
          onCreateAppointment={agenda.openCreateDialog}
          onCreateAvailability={agenda.openAvailabilityModal}
          onAvailabilityDeleted={agenda.refreshAvailability}
          recentlyAddedSlotId={agenda.recentlyAddedSlotId}
          highlightedAppointmentId={agenda.highlightedAppointmentId}
          clipboard={clipboard}
          onCopy={setClipboard}
        />
      )}

      {agenda.periodFilter === "week" && (
        <WeekTimeGrid
          appointments={agenda.appointments}
          externalEvents={agenda.externalEvents}
          loading={agenda.loading}
          selectedDate={agenda.selectedDate}
          onAttendanceChange={agenda.handleAttendanceChange}
        />
      )}

      {agenda.periodFilter === "month" && (
        <MonthGrid
          appointments={agenda.appointments}
          externalEvents={agenda.externalEvents}
          loading={agenda.loading}
          selectedDate={agenda.selectedDate}
          onDayClick={(date) => {
            agenda.setSelectedDate(date);
            agenda.setPeriodFilter("day");
          }}
          onAttendanceChange={agenda.handleAttendanceChange}
        />
      )}

      <CreateManualAppointmentDialog
        open={agenda.createDialogOpen}
        onOpenChange={agenda.setCreateDialogOpen}
        professionalId={professionalId}
        userId={userId}
        selectedDate={agenda.selectedDate}
        startTime={agenda.createStartTime}
        endTime={agenda.createEndTime}
        appointments={agenda.appointments}
        onCreated={agenda.refresh}
      />

      <NewAvailabilityModal
        open={agenda.modalOpen}
        onOpenChange={agenda.setModalOpen}
        professionalId={professionalId}
        userId={userId}
        onCreated={agenda.refreshAvailability}
        initialStartTime={agenda.modalStartTime}
        initialEndTime={agenda.modalEndTime}
        initialDate={agenda.selectedDate}
      />

      <CalendarIntegrationDialog
        open={agenda.calendarDialogOpen}
        onOpenChange={agenda.setCalendarDialogOpen}
        onSyncComplete={agenda.refreshExternalEvents}
      />

      <WalkInDialog
        open={walkInDialogOpen}
        onOpenChange={setWalkInDialogOpen}
        professionalId={professionalId}
        onCreated={() => agenda.refresh()}
      />

      {/* Mobile FAB for walk-ins */}
      <button
        className="fixed bottom-36 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg active:scale-95 transition-transform lg:hidden"
        onClick={() => setWalkInDialogOpen(true)}
      >
        <UserPlus className="size-5" />
      </button>

      {/* Mobile FAB for creating appointments */}
      <button
        className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform lg:hidden"
        onClick={() => agenda.setCreateDialogOpen(true)}
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
