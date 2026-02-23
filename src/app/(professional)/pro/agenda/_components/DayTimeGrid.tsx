"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment, ExternalEvent } from "./AgendaClient";
import { AppointmentBlock, HOUR_HEIGHT, START_HOUR } from "./AppointmentBlock";

const END_HOUR = 20;
const SLOT_MINUTES = 30;

const hours = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i
);

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  pending: "secondary",
  completed: "outline",
  cancelled: "destructive",
  "no-show": "destructive",
};

function pixelToTime(y: number): string {
  const totalMinutes = (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  const hours = START_HOUR + Math.floor(snapped / 60);
  const minutes = snapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function snapPixel(y: number): number {
  const totalMinutes = (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  return (snapped / 60) * HOUR_HEIGHT;
}

interface DayTimeGridProps {
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  loading: boolean;
  selectedDate: string;
  onAttendanceChange: (appointmentId: string, status: string) => void;
  onCreateAppointment: (startTime: string, endTime: string) => void;
}

export function DayTimeGrid({
  appointments,
  externalEvents,
  loading,
  selectedDate,
  onAttendanceChange,
  onCreateAppointment,
}: DayTimeGridProps) {
  const { t } = useProfessionalI18n();
  const [selected, setSelected] = useState<Appointment | null>(null);

  // Drag state
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);

  const statusLabel: Record<string, string> = {
    confirmed: t.common.status.confirmed,
    pending: t.common.status.pending,
    completed: t.common.status.completed,
    cancelled: t.common.status.cancelled,
    "no-show": t.common.status.noShow,
  };

  const getGridY = useCallback((clientY: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    return Math.max(0, clientY - rect.top + gridRef.current.scrollTop);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only left click
      if (e.button !== 0) return;
      const y = getGridY(e.clientY);
      setIsDragging(true);
      setDragStartY(snapPixel(y));
      setDragCurrentY(snapPixel(y));
    },
    [getGridY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const y = getGridY(e.clientY);
      setDragCurrentY(snapPixel(y));
    },
    [isDragging, getGridY]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || dragStartY == null || dragCurrentY == null) {
      setIsDragging(false);
      return;
    }

    const minY = Math.min(dragStartY, dragCurrentY);
    const maxY = Math.max(dragStartY, dragCurrentY);

    // Enforce minimum 30-min duration (1 slot)
    const minSlotHeight = (SLOT_MINUTES / 60) * HOUR_HEIGHT;
    const finalMaxY = maxY - minY < minSlotHeight ? minY + minSlotHeight : maxY;

    const startTime = pixelToTime(minY);
    const endTime = pixelToTime(finalMaxY);

    setIsDragging(false);
    setDragStartY(null);
    setDragCurrentY(null);

    // Only open dialog if the drag produced a valid range
    if (startTime < endTime) {
      onCreateAppointment(startTime, endTime);
    }
  }, [isDragging, dragStartY, dragCurrentY, onCreateAppointment]);

  // Cancel drag if mouse leaves the grid
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
        <CardContent className="space-y-4 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

  // Selection overlay coordinates
  const selectionTop =
    dragStartY != null && dragCurrentY != null
      ? Math.min(dragStartY, dragCurrentY)
      : 0;
  const selectionHeight =
    dragStartY != null && dragCurrentY != null
      ? Math.abs(dragCurrentY - dragStartY)
      : 0;

  return (
    <>
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <div
            ref={gridRef}
            className="relative select-none"
            style={{ height: `${totalHeight}px`, cursor: isDragging ? "ns-resize" : "crosshair" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {hours.map((hour) => {
              const top = (hour - START_HOUR) * HOUR_HEIGHT;
              return (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-muted"
                  style={{ top: `${top}px` }}
                >
                  <span className="absolute -top-3 left-0 text-xs text-muted-foreground tabular-nums">
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
              );
            })}

            {appointments.map((apt) => (
              <AppointmentBlock
                key={apt.id}
                appointment={apt}
                onClick={setSelected}
                onAttendanceChange={onAttendanceChange}
              />
            ))}

            {/* External calendar events overlay */}
            {externalEvents
              .filter((ev) => {
                if (ev.all_day) return false;
                const evDate = ev.starts_at.split("T")[0];
                return evDate === selectedDate;
              })
              .map((ev) => {
                const startParts = ev.starts_at.split("T")[1];
                const endParts = ev.ends_at.split("T")[1];
                if (!startParts || !endParts) return null;

                const [sh, sm] = startParts.split(":").map(Number);
                const [eh, em] = endParts.split(":").map(Number);
                const topOffset = (sh - START_HOUR + sm / 60) * HOUR_HEIGHT;
                const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
                const height = (durationMinutes / 60) * HOUR_HEIGHT;

                if (topOffset < 0 || height <= 0) return null;

                return (
                  <div
                    key={ev.id}
                    className="absolute right-2 overflow-hidden rounded-md px-3 py-1 border-l-4 opacity-60 pointer-events-none"
                    style={{
                      top: `${topOffset}px`,
                      height: `${Math.max(height, 24)}px`,
                      left: "calc(4rem + 45%)",
                      borderColor: ev.color ?? "#9333ea",
                      backgroundColor: `${ev.color ?? "#9333ea"}20`,
                    }}
                    title={`${ev.calendar_name}: ${ev.title}`}
                  >
                    <p className="truncate text-xs font-medium" style={{ color: ev.color ?? "#9333ea" }}>
                      {ev.title}
                    </p>
                    {height >= 40 && (
                      <p className="truncate text-[10px] opacity-75" style={{ color: ev.color ?? "#9333ea" }}>
                        {startParts.slice(0, 5)} - {endParts.slice(0, 5)}
                      </p>
                    )}
                  </div>
                );
              })}

            {/* Drag selection overlay */}
            {isDragging && selectionHeight > 0 && (
              <div
                className="absolute left-16 right-2 rounded-md bg-primary/20 border-2 border-primary border-dashed pointer-events-none z-10"
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.agenda.appointmentDetails}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {selected.patients?.first_name
                    ? `${selected.patients.first_name} ${selected.patients.last_name}`
                    : selected.title || t.agenda.manualAppointment}
                </p>
                <div className="flex items-center gap-2">
                  {selected.created_via === "manual" && (
                    <Badge variant="outline">{t.agenda.manualAppointment}</Badge>
                  )}
                  <Badge variant={statusVariant[selected.status] ?? "outline"}>
                    {statusLabel[selected.status] ?? selected.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t.agenda.time}</p>
                  <p>{selected.appointment_time?.slice(0, 5)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.agenda.duration}</p>
                  <p>{selected.duration_minutes} {t.common.min}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.agenda.service}</p>
                  <p>{selected.services?.name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.agenda.type}</p>
                  <p className="capitalize">{selected.consultation_type}</p>
                </div>
              </div>
              {selected.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">{t.agenda.notes}</p>
                  <p>{selected.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
