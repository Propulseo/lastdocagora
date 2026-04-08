"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { RADIUS } from "@/lib/design-tokens";
import { HOUR_HEIGHT, START_HOUR, END_HOUR, SLOT_MINUTES, OFF_HOURS_START, OFF_HOURS_END, HIDDEN_APPOINTMENT_STATUSES } from "../_lib/agenda-constants";
import type { Appointment, AvailabilitySlot, ExternalEvent } from "../_types/agenda";
import { AppointmentBlock } from "./AppointmentBlock";
import { AvailabilityBlock } from "./AvailabilityBlock";
import { DragActionSelector } from "./DragActionSelector";
import { ExternalEventOverlay } from "./ExternalEventOverlay";
import { AppointmentDetailDialog } from "./AppointmentDetailDialog";
import { useAttendanceAction } from "../_hooks/useAttendanceAction";
import { toLocalDateStr, parseLocalDate } from "../_lib/date-utils";
import { deleteAllDayAvailability } from "@/app/(professional)/_actions/availability";

const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

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

interface PendingDrag { startTime: string; endTime: string }

interface DayTimeGridProps {
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  availabilitySlots: AvailabilitySlot[];
  loading: boolean;
  selectedDate: string;
  professionalId: string;
  onAttendanceChange: (appointmentId: string, attendanceStatus: string, appointmentStatus?: string) => void;
  onCreateAppointment: (startTime: string, endTime: string) => void;
  onCreateAvailability: (startTime: string, endTime: string) => void;
  onAvailabilityDeleted: () => void;
  highlightedAppointmentId?: string | null;
}

export function DayTimeGrid({
  appointments,
  externalEvents,
  availabilitySlots,
  loading,
  selectedDate,
  professionalId,
  onAttendanceChange,
  onCreateAppointment,
  onCreateAvailability,
  onAvailabilityDeleted,
  highlightedAppointmentId,
}: DayTimeGridProps) {
  const { t } = useProfessionalI18n();
  const attendance = useAttendanceAction(onAttendanceChange);
  const visible = appointments.filter(
    (a) => !(HIDDEN_APPOINTMENT_STATUSES as readonly string[]).includes(a.status),
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [pendingDrag, setPendingDrag] = useState<PendingDrag | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const todayStr = toLocalDateStr(new Date());
  const isToday = selectedDate === todayStr;
  const [, setTick] = useState(0);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [isToday]);

  useEffect(() => {
    if (highlightedAppointmentId) return; // Skip auto-scroll when navigating to a specific appointment
    if (!gridRef.current?.parentElement) return;
    const now = new Date();
    const currentHour = now.getHours();
    const scrollTo = Math.max(0, (currentHour - START_HOUR - 1) * HOUR_HEIGHT);
    gridRef.current.parentElement.scrollTop = scrollTo;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to highlighted appointment
  useEffect(() => {
    if (!highlightedAppointmentId || !highlightRef.current) return;
    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightedAppointmentId, appointments]);

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
    () => {
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
        setPendingDrag({ startTime, endTime });
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
  const hasDrag = dragStartY != null && dragCurrentY != null;
  const selectionTop = hasDrag ? Math.min(dragStartY, dragCurrentY) : 0;
  const selectionHeight = hasDrag ? Math.abs(dragCurrentY - dragStartY) : 0;
  const now = new Date();
  const currentTimeTop = (now.getHours() - START_HOUR + now.getMinutes() / 60) * HOUR_HEIGHT;

  const handleBatchDelete = async () => {
    setIsBatchDeleting(true);
    const d = parseLocalDate(selectedDate);
    const result = await deleteAllDayAvailability(
      professionalId,
      d.getDay(),
      selectedDate,
    );
    if (result.success) {
      toast.success(t.agenda.clearDaySuccess);
      onAvailabilityDeleted();
    } else {
      toast.error(result.error ?? t.agenda.deleteSlotError);
    }
    setIsBatchDeleting(false);
  };

  const dateForDisplay = (() => {
    const d = parseLocalDate(selectedDate);
    const dayName = t.agenda.daysFull[d.getDay()];
    const day = d.getDate();
    const month = t.agenda.months[d.getMonth()];
    return `${dayName}, ${day} ${month}`;
  })();

  return (
    <>
      <Card>
        {/* Batch delete bar — only when availability slots exist */}
        {availabilitySlots.length > 0 && (
          <div className="flex items-center justify-end px-4 pt-3 pb-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t.agenda.clearDayButton}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={RADIUS.card}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.agenda.clearDayTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {(t.agenda.clearDayDescription as string).replace(
                      "{{date}}",
                      dateForDisplay,
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isBatchDeleting}>
                    {t.common.cancel}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBatchDelete}
                    disabled={isBatchDeleting}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {isBatchDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t.agenda.clearDayConfirm
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        <CardContent className="overflow-auto min-h-[520px] max-h-[calc(100vh-260px)]">
          <div
            ref={gridRef}
            className="relative select-none"
            style={{ height: `${totalHeight}px`, cursor: isDragging ? "ns-resize" : "crosshair" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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

            {availabilitySlots.map((slot) => (
              <AvailabilityBlock
                key={slot.id}
                slot={slot}
                onCreateAppointment={onCreateAppointment}
                onDeleted={onAvailabilityDeleted}
              />
            ))}

            {visible.map((apt) => (
              <div
                key={apt.id}
                ref={apt.id === highlightedAppointmentId ? highlightRef : null}
              >
                <AppointmentBlock
                  appointment={apt}
                  onClick={attendance.setSelected}
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
      </Card>

      <DragActionSelector
        open={pendingDrag !== null}
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
