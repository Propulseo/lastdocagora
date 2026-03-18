"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useAgendaData } from "../_hooks/useAgendaData";
import { AgendaControlBar } from "./AgendaControlBar";
import { AttendanceStats } from "./AttendanceStats";
import { AttendanceRate } from "./AttendanceRate";
import { DayTimeGrid } from "./DayTimeGrid";
import { WeekTimeGrid } from "./WeekTimeGrid";
import { MonthGrid } from "./MonthGrid";
import { NewAvailabilityModal } from "./NewAvailabilityModal";
import { CreateManualAppointmentDialog } from "./CreateManualAppointmentDialog";
import { CalendarIntegrationDialog } from "./CalendarIntegrationDialog";

// Re-export types for backward compat (consumed by page.tsx)
export type { Appointment, ExternalEvent } from "../_types/agenda";

interface AgendaClientProps {
  professionalId: string;
  userId: string;
}

export function AgendaClient({ professionalId, userId }: AgendaClientProps) {
  const agenda = useAgendaData({ professionalId, userId });

  return (
    <div className="space-y-5">
      <PageHeader
        title={agenda.t.agenda.title}
        description={agenda.t.agenda.description}
        action={
          <div className="flex gap-2">
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

      <AttendanceStats stats={agenda.stats} />
      <AttendanceRate stats={agenda.stats} />

      {agenda.periodFilter === "day" && (
        <DayTimeGrid
          appointments={agenda.appointments}
          externalEvents={agenda.externalEvents}
          availabilitySlots={agenda.availabilitySlots}
          loading={agenda.loading}
          selectedDate={agenda.selectedDate}
          onAttendanceChange={agenda.handleAttendanceChange}
          onCreateAppointment={agenda.openCreateDialog}
          onCreateAvailability={agenda.createAvailabilitySlot}
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
        onCreated={agenda.refresh}
      />

      <CalendarIntegrationDialog
        open={agenda.calendarDialogOpen}
        onOpenChange={agenda.setCalendarDialogOpen}
        onSyncComplete={agenda.refreshExternalEvents}
      />
    </div>
  );
}
