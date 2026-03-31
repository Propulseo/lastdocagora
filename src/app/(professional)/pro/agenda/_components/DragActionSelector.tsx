"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus, Clock } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface DragActionSelectorProps {
  open: boolean;
  position: { x: number; y: number };
  startTime: string;
  endTime: string;
  onCreateAppointment: () => void;
  onCreateAvailability: () => void;
  onClose: () => void;
}

export function DragActionSelector({
  open,
  position,
  startTime,
  endTime,
  onCreateAppointment,
  onCreateAvailability,
  onClose,
}: DragActionSelectorProps) {
  const { t } = useProfessionalI18n();
  const ref = useRef<HTMLDivElement>(null);
  const firstBtnRef = useRef<HTMLButtonElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;

    // Clamp position within viewport bounds
    const menuW = 224; // w-56 = 14rem = 224px
    const menuH = 100; // approximate height
    const pad = 8;
    const x = Math.min(position.x, window.innerWidth - menuW - pad);
    const y = Math.min(position.y, window.innerHeight - menuH - pad);
    setAdjustedPos({ x: Math.max(pad, x), y: Math.max(pad, y) });

    // Auto-focus first button
    firstBtnRef.current?.focus();

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, position.x, position.y]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 w-56 rounded-lg border bg-popover p-2 shadow-md"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      <p className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">
        {startTime} – {endTime}
      </p>
      <button
        ref={firstBtnRef}
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
        onClick={onCreateAppointment}
      >
        <CalendarPlus className="h-4 w-4 shrink-0" />
        {t.agenda.createPatientAppointment}
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
        onClick={onCreateAvailability}
      >
        <Clock className="h-4 w-4 shrink-0" />
        {t.agenda.openAvailabilitySlot}
      </button>
    </div>
  );
}
