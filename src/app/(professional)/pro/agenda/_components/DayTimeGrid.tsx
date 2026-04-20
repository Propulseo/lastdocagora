"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HOUR_HEIGHT, START_HOUR, SLOT_MINUTES } from "../_lib/agenda-constants";
import type { Appointment, AvailabilitySlot, ExternalEvent } from "../_types/agenda";
import { DragActionSelector } from "./DragActionSelector";
import { AppointmentDetailDialog } from "./AppointmentDetailDialog";
import { useAttendanceAction } from "../_hooks/useAttendanceAction";
import { toLocalDateStr } from "../_lib/date-utils";
import { PasteAvailabilityDialog } from "./PasteAvailabilityDialog";
import { TimeGridToolbar } from "./TimeGridToolbar";
import { TimeGridCanvas } from "./TimeGridCanvas";

export type ClipboardData = {
  slots: { start_time: string; end_time: string }[];
  sourceDate: string;
};

function snapPixel(y: number): number {
  const totalMinutes = (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  return (snapped / 60) * HOUR_HEIGHT;
}

function pixelToTime(y: number): string {
  const totalMinutes = (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  const h = START_HOUR + Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
  recentlyAddedSlotId?: string | null;
  highlightedAppointmentId?: string | null;
  clipboard: ClipboardData | null;
  onCopy: (data: ClipboardData) => void;
}

export function DayTimeGrid({
  appointments, externalEvents, availabilitySlots, loading,
  selectedDate, professionalId, onAttendanceChange,
  onCreateAppointment, onCreateAvailability, onAvailabilityDeleted,
  recentlyAddedSlotId, highlightedAppointmentId, clipboard, onCopy,
}: DayTimeGridProps) {
  const attendance = useAttendanceAction(onAttendanceChange);
  const gridRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [pendingDrag, setPendingDrag] = useState<PendingDrag | null>(null);
  const todayStr = toLocalDateStr(new Date());
  const isToday = selectedDate === todayStr;
  const isPast = selectedDate < todayStr;
  const [, setTick] = useState(0);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [isToday]);

  useEffect(() => {
    if (highlightedAppointmentId) return;
    if (!gridRef.current?.parentElement) return;
    const now = new Date();
    const scrollTo = Math.max(0, (now.getHours() - START_HOUR - 1) * HOUR_HEIGHT);
    gridRef.current.parentElement.scrollTop = scrollTo;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!highlightedAppointmentId || !highlightRef.current) return;
    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightedAppointmentId, appointments]);

  const getGridY = useCallback((clientY: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    return Math.max(0, clientY - rect.top + gridRef.current.scrollTop);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const y = getGridY(e.clientY);
    setIsDragging(true);
    setDragStartY(snapPixel(y));
    setDragCurrentY(snapPixel(y));
  }, [getGridY]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setDragCurrentY(snapPixel(getGridY(e.clientY)));
  }, [isDragging, getGridY]);

  const handleMouseUp = useCallback(() => {
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
    if (startTime < endTime) setPendingDrag({ startTime, endTime });
  }, [isDragging, dragStartY, dragCurrentY]);

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

  return (
    <>
      <Card>
        <TimeGridToolbar
          availabilitySlots={availabilitySlots}
          clipboard={clipboard}
          selectedDate={selectedDate}
          professionalId={professionalId}
          justCopied={justCopied}
          isBatchDeleting={isBatchDeleting}
          onCopy={onCopy}
          onJustCopiedChange={setJustCopied}
          onBatchDeletingChange={setIsBatchDeleting}
          onAvailabilityDeleted={onAvailabilityDeleted}
          onPasteOpen={() => setPasteDialogOpen(true)}
        />
        <TimeGridCanvas
          gridRef={gridRef}
          highlightRef={highlightRef}
          appointments={appointments}
          availabilitySlots={availabilitySlots}
          externalEvents={externalEvents}
          selectedDate={selectedDate}
          isToday={isToday}
          isPast={isPast}
          isDragging={isDragging}
          dragStartY={dragStartY}
          dragCurrentY={dragCurrentY}
          recentlyAddedSlotId={recentlyAddedSlotId}
          highlightedAppointmentId={highlightedAppointmentId}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onCreateAppointment={onCreateAppointment}
          onAvailabilityDeleted={onAvailabilityDeleted}
          onAppointmentClick={attendance.setSelected}
        />
      </Card>

      <DragActionSelector
        open={pendingDrag !== null}
        startTime={pendingDrag?.startTime ?? ""}
        endTime={pendingDrag?.endTime ?? ""}
        onCreateAppointment={() => {
          if (pendingDrag) onCreateAppointment(pendingDrag.startTime, pendingDrag.endTime);
          setPendingDrag(null);
        }}
        onCreateAvailability={() => {
          if (pendingDrag) onCreateAvailability(pendingDrag.startTime, pendingDrag.endTime);
          setPendingDrag(null);
        }}
        onClose={() => setPendingDrag(null)}
      />

      <PasteAvailabilityDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        clipboard={clipboard}
        targetDate={selectedDate}
        existingCount={availabilitySlots.length}
        professionalId={professionalId}
        onPasted={onAvailabilityDeleted}
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
