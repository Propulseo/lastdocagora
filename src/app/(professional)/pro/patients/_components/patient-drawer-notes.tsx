"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Pencil,
  X,
  Check,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";

export interface ConsultationNote {
  id: string;
  content: string;
  follow_up_needed: boolean;
  follow_up_suggested_date: string | null;
  created_at: string;
  updated_at: string;
  appointment_id: string;
  appointment_date: string | null;
  appointment_time: string | null;
}

interface PatientDrawerNotesProps {
  notes: ConsultationNote[];
  dateLocale: "pt-PT" | "fr-FR" | "en-GB";
  onNoteUpdated: (noteId: string, newContent: string) => void;
}

function formatDate(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(isoStr: string, locale: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export function PatientDrawerNotes({
  notes,
  dateLocale,
  onNoteUpdated,
}: PatientDrawerNotesProps) {
  const { t } = useProfessionalI18n();
  const dt = t.patients.drawer;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  function handleStartEdit(note: ConsultationNote) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  async function handleSaveEdit(noteId: string) {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase.from as unknown as (table: string) => ReturnType<typeof supabase.from>)("consultation_notes")
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", noteId);

      if (error) {
        toast.error(dt.noteSaveError);
        return;
      }
      toast.success(dt.noteUpdated);
      onNoteUpdated(noteId, editContent.trim());
      setEditingId(null);
      setEditContent("");
    } catch {
      toast.error(dt.noteSaveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <FileText className="size-4 text-muted-foreground" />
          {dt.consultationNotes}
        </h4>

        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {dt.noConsultationNotes}
          </p>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => {
              const isEditing = editingId === note.id;

              return (
                <div
                  key={note.id}
                  className="rounded-lg border bg-muted/30 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>
                        {dt.noteWrittenAt}{" "}
                        {formatDateTime(note.created_at, dateLocale)}
                      </span>
                      {note.appointment_date && (
                        <span className="text-muted-foreground/60">
                          ({formatDate(note.appointment_date, dateLocale)}
                          {note.appointment_time &&
                            ` ${formatTime(note.appointment_time)}`})
                        </span>
                      )}
                      {note.follow_up_needed && (
                        <Badge
                          variant="outline"
                          className="text-xs gap-1 border-amber-300 text-amber-600 dark:text-amber-400"
                        >
                          <CalendarClock className="size-3" />
                          {dt.followUp}
                          {note.follow_up_suggested_date &&
                            ` ${formatDate(note.follow_up_suggested_date, dateLocale)}`}
                        </Badge>
                      )}
                    </div>

                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => handleStartEdit(note)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px] resize-y text-sm"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          <X className="size-3.5 mr-1" />
                          {dt.cancelButton}
                        </Button>
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={saving || !editContent.trim()}
                        >
                          {saving ? (
                            <Loader2 className="size-3.5 mr-1 animate-spin" />
                          ) : (
                            <Check className="size-3.5 mr-1" />
                          )}
                          {dt.saveButton}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
