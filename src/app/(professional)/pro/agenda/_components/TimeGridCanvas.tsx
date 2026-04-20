"use client";

import { Fragment, type RefObject } from "react";
import { CardContent } from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { RADIUS } from "@/lib/design-tokens";
import { HOUR_HEIGHT, START_HOUR, END_HOUR, SLOT_MINUTES, OFF_HOURS_START, OFF_HOURS_END, HIDDEN_APPOINTMENT_STATUSES } from "../_lib/agenda-constants";
import type { Appointment, AvailabilitySlot, ExternalEvent } from "../_types/agenda";
import { AppointmentBlock } from "./AppointmentBlock";
import { AvailabilityBlock } from "./AvailabilityBlock";
import { ExternalEventOverlay } from "./ExternalEventOverlay";

const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function pixelToTime(y: number): string {
  const totalMinutes = (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  const h = START_HOUR + Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface TimeGridCanvasProps {
  gridRef: RefObject<HTMLDivElement | null>;
  highlightRef: RefObject<HTMLDivElement | null>;
  appointments: Appointment[];
  availabilitySlots: AvailabilitySlot[];
  externalEvents: ExternalEvent[];
  selectedDate: string;
  isToday: boolean;
  isPast: boolean;
  isDragging: boolean;
  dragStartY: number | null;
  dragCurrentY: number | null;
  recentlyAddedSlotId?: string | null;
  highlightedAppointmentId?: string | null;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onCreateAppointment: (startTime: string, endTime: string) => void;
  onAvailabilityDeleted: () => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

export function TimeGridCanvas({
  gridRef,
  highlightRef,
  appointments,
  availabilitySlots,
  externalEvents,
  selectedDate,
  isToday,
  isPast,
  isDragging,
  dragStartY,
  dragCurrentY,
  recentlyAddedSlotId,
  highlightedAppointmentId,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onCreateAppointment,
  onAvailabilityDeleted,
  onAppointmentClick,
}: TimeGridCanvasProps) {
  const { t } = useProfessionalI18n();

  const visible = appointments.filter(
    (a) => !(HIDDEN_APPOINTMENT_STATUSES as readonly string[]).includes(a.status),
  );

  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;
  const hasDrag = dragStartY != null && dragCurrentY != null;
  const selectionTop = hasDrag ? Math.min(dragStartY, dragCurrentY) : 0;
  const selectionHeight = hasDrag ? Math.abs(dragCurrentY - dragStartY) : 0;
  const now = new Date();
  const currentTimeTop = (now.getHours() - START_HOUR + now.getMinutes() / 60) * HOUR_HEIGHT;

  return (
    <CardContent className="overflow-auto min-h-[520px] max-h-[calc(100vh-260px)]">
      <div
        ref={gridRef}
        className="relative select-none"
        style={{ height: `${totalHeight}px`, cursor: isDragging ? "ns-resize" : "crosshair" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {OFF_HOURS_START > START_HOUR && (
          <div
            className="absolute left-[3.75rem] right-0 bg-muted/20 pointer-events-none"
            style={{
              top: 0,
              height: `${(OFF_HOURS_START - START_HOUR) * HOUR_HEIGHT}px`,
            }}
          />
        )}
        {OFF_HOURS_END <= END_HOUR && (
          <div
            className="absolute left-[3.75rem] right-0 bg-muted/20 pointer-events-none"
            style={{
              top: `${(OFF_HOURS_END - START_HOUR) * HOUR_HEIGHT}px`,
              height: `${(END_HOUR - OFF_HOURS_END + 1) * HOUR_HEIGHT}px`,
            }}
          />
        )}

        <div className="absolute top-0 bottom-0 left-[3.75rem] w-px bg-border pointer-events-none" />
        {hours.map((hour) => {
          const top = (hour - START_HOUR) * HOUR_HEIGHT;
          return (
            <Fragment key={hour}>
              <div
                className="absolute left-[3.75rem] right-0 border-t border-muted"
                style={{ top: `${top}px` }}
              >
                <span className="absolute -top-3 right-full mr-1.5 text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
              <div
                className="absolute left-[3.75rem] right-0 border-t border-dashed border-muted/50"
                style={{ top: `${top + HOUR_HEIGHT / 2}px` }}
              />
            </Fragment>
          );
        })}

        {availabilitySlots
          .filter((slot) => {
            // Past days: hide all availability slots
            if (isPast) return false;
            // Today: hide slots whose end_time has passed
            if (isToday) {
              const slotEnd = new Date(`${selectedDate}T${slot.end_time}`);
              return slotEnd > now;
            }
            // Future days: show all
            return true;
          })
          .map((slot) => (
            <AvailabilityBlock
              key={slot.id}
              slot={slot}
              onCreateAppointment={onCreateAppointment}
              onDeleted={onAvailabilityDeleted}
              isRecentlyAdded={slot.id === recentlyAddedSlotId}
            />
          ))}

        {visible.map((apt) => (
          <div
            key={apt.id}
            ref={apt.id === highlightedAppointmentId ? highlightRef : null}
          >
            <AppointmentBlock
              appointment={apt}
              onClick={onAppointmentClick}
              isHighlighted={apt.id === highlightedAppointmentId}
            />
          </div>
        ))}

        <ExternalEventOverlay
          events={externalEvents}
          selectedDate={selectedDate}
        />

        {isToday && currentTimeTop > 0 && currentTimeTop < totalHeight && (
          <div className="absolute left-0 right-0 z-[30] pointer-events-none" style={{ top: `${currentTimeTop}px` }}>
            <div className="relative flex items-center">
              <span className="absolute right-[calc(100%-3.5rem)] text-[10px] font-semibold text-red-500 tabular-nums whitespace-nowrap">
                {now.getHours().toString().padStart(2, "0")}:{now.getMinutes().toString().padStart(2, "0")}
              </span>
              <span className="absolute left-[3.5rem] size-2.5 -translate-y-px rounded-full bg-red-500 ring-2 ring-background" />
              <div className="absolute left-[3.75rem] right-0 h-[2px] bg-red-500/80" />
            </div>
          </div>
        )}

        {isDragging && selectionHeight > 0 && (
          <div
            className={`absolute left-16 right-2 ${RADIUS.sm} bg-primary/20 border-2 border-primary border-dashed pointer-events-none z-[30]`}
            style={{
              top: `${selectionTop}px`,
              height: `${selectionHeight}px`,
            }}
          >
            <span className="absolute top-1 left-2 text-xs font-medium text-primary">
              {pixelToTime(selectionTop)} - {pixelToTime(selectionTop + selectionHeight)}
            </span>
          </div>
        )}

        {visible.length === 0 && !isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground">
              {t.agenda.noAppointments}
            </p>
          </div>
        )}
      </div>
    </CardContent>
  );
}
