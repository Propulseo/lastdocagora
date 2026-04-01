"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarPlus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { saveAppointmentNotes } from "@/app/(professional)/_actions/attendance";
import type { PatientDetailEnhanced } from "@/app/(professional)/_actions/patients";
import { STATUS_VARIANT } from "./patient-drawer-helpers";
import { AppointmentTimelineItem } from "./appointment-timeline-item";

type UpcomingItem = PatientDetailEnhanced["upcomingAppointments"][number];

interface DrawerAppointmentsTranslations {
  upcomingAppointments: string;
  allAppointments: string;
  noAppointments: string;
  newAppointment: string;
  notesPlaceholder?: string;
  notesSaved?: string;
  notesError?: string;
  saveNotes?: string;
  status: Record<string, string>;
  attendance?: Record<string, string>;
}

interface PatientDrawerAppointmentsProps {
  data: PatientDetailEnhanced;
  dt: DrawerAppointmentsTranslations;
  dateLocale: "pt-PT" | "fr-FR" | "en-GB";
  savingLabel: string;
  expandedAptId: string | null;
  setExpandedAptId: (id: string | null) => void;
  editingNotes: string;
  setEditingNotes: (notes: string) => void;
  savingNotes: boolean;
  setSavingNotes: (saving: boolean) => void;
  setData: Dispatch<SetStateAction<PatientDetailEnhanced | null>>;
}

function UpcomingAppointmentCard({
  apt,
  dateLocale,
  statusLabels,
}: {
  apt: UpcomingItem;
  dateLocale: "pt-PT" | "fr-FR" | "en-GB";
  statusLabels: Record<string, string>;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {new Date(apt.date).toLocaleDateString(dateLocale)}{" "}
          <span className="font-normal text-muted-foreground">
            {apt.time.slice(0, 5)}
          </span>
        </p>
        {apt.serviceName && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {apt.serviceName}
          </p>
        )}
      </div>
      <Badge
        variant={STATUS_VARIANT[apt.status] ?? "outline"}
        className="ml-2 shrink-0 text-xs"
      >
        {statusLabels[apt.status] ?? apt.status}
      </Badge>
    </div>
  );
}

export function PatientDrawerAppointments({
  data,
  dt,
  dateLocale,
  savingLabel,
  expandedAptId,
  setExpandedAptId,
  editingNotes,
  setEditingNotes,
  savingNotes,
  setSavingNotes,
  setData,
}: PatientDrawerAppointmentsProps) {
  const statusLabels = dt.status;
  const attendanceLabels = dt.attendance ?? {};

  async function handleSaveNotes(aptId: string) {
    setSavingNotes(true);
    const result = await saveAppointmentNotes(aptId, editingNotes);
    setSavingNotes(false);
    if (result.success) {
      toast.success(dt.notesSaved ?? "");
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          allAppointments: prev.allAppointments.map((a) =>
            a.id === aptId ? { ...a, notes: editingNotes.trim() || null } : a
          ),
        };
      });
    } else {
      toast.error(dt.notesError ?? "");
    }
  }

  return (
    <>
      {data.upcomingAppointments.length > 0 && (
        <>
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <CalendarPlus className="size-4 text-muted-foreground" />
              {dt.upcomingAppointments}
            </h4>
            <div className="space-y-2">
              {data.upcomingAppointments.map((apt, i) => (
                <UpcomingAppointmentCard
                  key={i}
                  apt={apt}
                  dateLocale={dateLocale}
                  statusLabels={statusLabels}
                />
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <ClipboardList className="size-4 text-muted-foreground" />
          {dt.allAppointments}
        </h4>
        {data.allAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dt.noAppointments}</p>
        ) : (
          <div className="space-y-2">
            {data.allAppointments.map((apt) => (
              <AppointmentTimelineItem
                key={apt.id}
                apt={apt}
                dateLocale={dateLocale}
                statusLabels={statusLabels}
                attendanceLabels={attendanceLabels}
                isExpanded={expandedAptId === apt.id}
                onToggle={() => {
                  if (expandedAptId === apt.id) {
                    setExpandedAptId(null);
                  } else {
                    setExpandedAptId(apt.id);
                    setEditingNotes(apt.notes ?? "");
                  }
                }}
                editingNotes={editingNotes}
                setEditingNotes={setEditingNotes}
                savingNotes={savingNotes}
                onSaveNotes={() => handleSaveNotes(apt.id)}
                savingLabel={savingLabel}
                saveNotesLabel={dt.saveNotes ?? ""}
                notesPlaceholder={dt.notesPlaceholder ?? ""}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href="/pro/agenda">
            <CalendarPlus className="mr-2 size-4" />
            {dt.newAppointment}
          </Link>
        </Button>
      </div>
    </>
  );
}
