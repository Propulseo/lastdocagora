"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown } from "lucide-react";
import type { PatientDetailEnhanced } from "@/app/(professional)/_actions/patients";
import { STATUS_VARIANT, ATTENDANCE_COLORS } from "./patient-drawer-helpers";

type AppointmentItem = PatientDetailEnhanced["allAppointments"][number];

export interface AppointmentTimelineItemProps {
  apt: AppointmentItem;
  dateLocale: "pt-PT" | "fr-FR" | "en-GB";
  statusLabels: Record<string, string>;
  attendanceLabels: Record<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
  editingNotes: string;
  setEditingNotes: (notes: string) => void;
  savingNotes: boolean;
  onSaveNotes: () => void;
  savingLabel: string;
  saveNotesLabel: string;
  notesPlaceholder: string;
}

export function AppointmentTimelineItem({
  apt,
  dateLocale,
  statusLabels,
  attendanceLabels,
  isExpanded,
  onToggle,
  editingNotes,
  setEditingNotes,
  savingNotes,
  onSaveNotes,
  savingLabel,
  saveNotesLabel,
  notesPlaceholder,
}: AppointmentTimelineItemProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        type="button"
        className="flex w-full items-start justify-between p-3 text-left hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {new Date(apt.date).toLocaleDateString(dateLocale)}{" "}
              <span className="font-normal text-muted-foreground">
                {apt.time.slice(0, 5)}
              </span>
            </p>
            {apt.attendanceStatus && (
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ATTENDANCE_COLORS[apt.attendanceStatus] ?? ""}`}
              >
                {attendanceLabels[apt.attendanceStatus] ?? apt.attendanceStatus}
              </span>
            )}
          </div>
          {apt.serviceName && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {apt.serviceName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          <Badge variant={STATUS_VARIANT[apt.status] ?? "outline"} className="text-xs">
            {statusLabels[apt.status] ?? apt.status}
          </Badge>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {isExpanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          <Textarea
            value={editingNotes}
            onChange={(e) => setEditingNotes(e.target.value)}
            placeholder={notesPlaceholder}
            rows={3}
            className="text-sm"
          />
          <Button size="sm" disabled={savingNotes} onClick={onSaveNotes}>
            {savingNotes ? savingLabel : saveNotesLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
