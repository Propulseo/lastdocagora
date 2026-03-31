"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  HOUR_HEIGHT,
  START_HOUR,
  END_HOUR,
  SLOT_MINUTES,
  OFF_HOURS_START,
  OFF_HOURS_END,
} from "../_lib/agenda-constants";
import type { Appointment, AvailabilitySlot, ExternalEvent } from "../_types/agenda";
import { AppointmentBlock } from "./AppointmentBlock";
import { AvailabilityBlock } from "./AvailabilityBlock";
import { DragActionSelector } from "./DragActionSelector";
import { ExternalEventOverlay } from "./ExternalEventOverlay";
import { AppointmentDetailDialog } from "./AppointmentDetailDialog";
import { useAttendanceAction } from "../_hooks/useAttendanceAction";
import { toLocalDateStr } from "../_lib/date-utils";

const hours = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i,
);

function pixelToTime(y: number): string {
  const totalMinutes = (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  const h = START_HOUR + Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function snapPixel(y: number): number {
  const totalMinutes = (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  return (snapped / 60) * HOUR_HEIGHT;
}

interface PendingDrag {
  startTime: string;
  endTime: string;
  mouseX: number;
  mouseY: number;
}

interface DayTimeGridProps {
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  availabilitySlots: AvailabilitySlot[];
  loading: boolean;
  selectedDate: string;
  onAttendanceChange: (appointmentId: string, attendanceStatus: string, appointmentStatus?: string) => void;
  onCreateAppointment: (startTime: string, endTime: string) => void;
  onCreateAvailability: (startTime: string, endTime: string) => void;
}

export function DayTimeGrid({
  appointments,
  externalEvents,
  availabilitySlots,
  loading,
  selectedDate,
  onAttendanceChange,
  onCreateAppointment,
  onCreateAvailability,
}: DayTimeGridProps) {
  const { t } = useProfessionalI18n();
  const attendance = useAttendanceAction(onAttendanceChange);

  // Drag state
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [pendingDrag, setPendingDrag] = useState<PendingDrag | null>(null);

  // Current time line
  const todayStr = toLocalDateStr(new Date());
  const isToday = selectedDate === todayStr;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [isToday]);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (!gridRef.current?.parentElement) return;
    const now = new Date();
    const currentHour = now.getHours();
    const scrollTo = Math.max(0, (currentHour - START_HOUR - 1) * HOUR_HEIGHT);
    gridRef.current.parentElement.scrollTop = scrollTo;
  }, []);

  const getGridY = useCallback((clientY: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    return Math.max(0, clientY - rect.top + gridRef.current.scrollTop);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const y = getGridY(e.clientY);
      setIsDragging(true);
      setDragStartY(snapPixel(y));
      setDragCurrentY(snapPixel(y));
    },
    [getGridY],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const y = getGridY(e.clientY);
      setDragCurrentY(snapPixel(y));
    },
    [isDragging, getGridY],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || dragStartY == null || dragCurrentY == null) {
        setIsDragging(false);
        return;
      }

      const minY = Math.min(dragStartY, dragCurrentY);
      const maxY = Math.max(dragStartY, dragCurrentY);

      const minSlotHeight = (SLOT_MINUTES / 60) * HOUR_HEIGHT;
      const finalMaxY = maxY - minY < minSlotHeight ? minY + minSlotHeight : maxY;

      const startTime = pixelToTime(minY);
      const endTime = pixelToTime(finalMaxY);

      setIsDragging(false);
      setDragStartY(null);
      setDragCurrentY(null);

      if (startTime < endTime) {
        setPendingDrag({
          startTime,
          endTime,
          mouseX: e.clientX,
          mouseY: e.clientY,
        });
      }
    },
    [isDragging, dragStartY, dragCurrentY],
  );

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartY(null);
      setDragCurrentY(null);
    }
  }, [isDragging]);

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

  const selectionTop =
    dragStartY != null && dragCurrentY != null
      ? Math.min(dragStartY, dragCurrentY)
      : 0;
  const selectionHeight =
    dragStartY != null && dragCurrentY != null
      ? Math.abs(dragCurrentY - dragStartY)
      : 0;

  // Current time position
  const now = new Date();
  const currentTimeTop =
    (now.getHours() - START_HOUR + now.getMinutes() / 60) * HOUR_HEIGHT;

  return (
    <>
      <Card>
        <CardContent className="overflow-auto min-h-[520px] max-h-[calc(100vh-260px)]">
          <div
            ref={gridRef}
            className="relative select-none"
            style={{ height: `${totalHeight}px`, cursor: isDragging ? "ns-resize" : "crosshair" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={(e) => handleMouseUp(e)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Off-hours striping */}
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

            {/* Gutter separator */}
            <div className="absolute top-0 bottom-0 left-[3.75rem] w-px bg-border pointer-events-none" />

            {/* Hour + half-hour grid lines */}
            {hours.map((hour) => {
              const top = (hour - START_HOUR) * HOUR_HEIGHT;
              return (
                <Fragment key={hour}>
                  {/* Full hour line */}
                  <div
                    className="absolute left-[3.75rem] right-0 border-t border-muted"
                    style={{ top: `${top}px` }}
                  >
                    <span className="absolute -top-3 right-full mr-1.5 text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                  {/* Half-hour line */}
                  <div
                    className="absolute left-[3.75rem] right-0 border-t border-dashed border-muted/50"
                    style={{ top: `${top + HOUR_HEIGHT / 2}px` }}
                  />
                </Fragment>
              );
            })}

            {/* Availability slots */}
            {availabilitySlots.map((slot) => (
              <AvailabilityBlock
                key={slot.id}
                slot={slot}
                onCreateAppointment={onCreateAppointment}
              />
            ))}

            {/* Appointments */}
            {appointments.map((apt) => (
              <AppointmentBlock
                key={apt.id}
                appointment={apt}
                onClick={attendance.setSelected}
              />
            ))}

            {/* External calendar events */}
            <ExternalEventOverlay
              events={externalEvents}
              selectedDate={selectedDate}
            />

            {/* Current time indicator */}
            {isToday && currentTimeTop > 0 && currentTimeTop < totalHeight && (
              <div
                className="absolute left-0 right-0 z-[30] pointer-events-none"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="relative flex items-center">
                  {/* Time label in gutter */}
                  <span className="absolute right-[calc(100%-3.5rem)] text-[10px] font-semibold text-red-500 tabular-nums whitespace-nowrap">
                    {now.getHours().toString().padStart(2, "0")}:{now.getMinutes().toString().padStart(2, "0")}
                  </span>
                  {/* Dot + line */}
                  <span className="absolute left-[3.5rem] size-2.5 -translate-y-px rounded-full bg-red-500 ring-2 ring-background" />
                  <div className="absolute left-[3.75rem] right-0 h-[2px] bg-red-500/80" />
                </div>
              </div>
            )}

            {/* Drag selection overlay */}
            {isDragging && selectionHeight > 0 && (
              <div
                className="absolute left-16 right-2 rounded-md bg-primary/20 border-2 border-primary border-dashed pointer-events-none z-[30]"
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

            {appointments.length === 0 && !isDragging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-muted-foreground">
                  {t.agenda.noAppointments}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <DragActionSelector
        open={pendingDrag !== null}
        position={{ x: pendingDrag?.mouseX ?? 0, y: pendingDrag?.mouseY ?? 0 }}
        startTime={pendingDrag?.startTime ?? ""}
        endTime={pendingDrag?.endTime ?? ""}
        onCreateAppointment={() => {
          if (pendingDrag) {
            onCreateAppointment(pendingDrag.startTime, pendingDrag.endTime);
          }
          setPendingDrag(null);
        }}
        onCreateAvailability={() => {
          if (pendingDrag) {
            onCreateAvailability(pendingDrag.startTime, pendingDrag.endTime);
          }
          setPendingDrag(null);
        }}
        onClose={() => setPendingDrag(null)}
      />

      <AppointmentDetailDialog
        selected={attendance.selected}
        onClose={() => attendance.setSelected(null)}
        onMarkAttendance={attendance.handleMarkAttendance}
        onStatusChange={attendance.handleStatusChange}
        isUpdating={attendance.isUpdating}
        showCancelDialog={attendance.showCancelDialog}
        onShowCancelDialog={attendance.setShowCancelDialog}
        onCancelAppointment={attendance.handleCancelAppointment}
        showRejectDialog={attendance.showRejectDialog}
        onShowRejectDialog={attendance.setShowRejectDialog}
        onRejectAppointment={attendance.handleRejectAppointment}
        showProposeDialog={attendance.showProposeDialog}
        onShowProposeDialog={attendance.setShowProposeDialog}
        onProposeAlternative={attendance.handleProposeAlternative}
      />
    </>
  );
}
