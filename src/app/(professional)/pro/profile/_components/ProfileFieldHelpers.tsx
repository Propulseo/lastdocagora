"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, X, Loader2 } from "lucide-react";
import type { SectionKey } from "./profile-types";

interface DisplayFieldProps { label: string; value: string | null | undefined; fallback: string }

export function DisplayField({ label, value, fallback }: DisplayFieldProps) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value || fallback}</span>
    </div>
  );
}

interface EditFieldProps { label: string; value: string; onChange: (value: string) => void; placeholder?: string }

export function EditField({ label, value, onChange, placeholder }: EditFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
      <label className="shrink-0 text-sm text-muted-foreground sm:w-40">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1" />
    </div>
  );
}

interface EditTextareaProps { label: string; value: string; onChange: (value: string) => void; placeholder?: string }

export function EditTextarea({ label, value, onChange, placeholder }: EditTextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-muted-foreground">{label}</label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} />
    </div>
  );
}

interface SectionCardHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sectionKey: SectionKey;
  editingSection: SectionKey | null;
  onEdit: (key: SectionKey) => void;
  onCancel: () => void;
  isPending: boolean;
  editLabel: string;
}

export function SectionCardHeader({ icon: Icon, title, sectionKey, editingSection, onEdit, onCancel, isPending, editLabel }: SectionCardHeaderProps) {
  const isEditing = editingSection === sectionKey;
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onEdit(sectionKey)} disabled={editingSection !== null && editingSection !== sectionKey}>
            <Pencil className="size-3" />
            {editLabel}
          </Button>
        )}
        {isEditing && (
          <Button variant="ghost" size="icon" className="size-8" onClick={onCancel} disabled={isPending}>
            <X className="size-4" />
          </Button>
        )}
      </div>
    </CardHeader>
  );
}

interface SectionCardFooterProps { onCancel: () => void; onSave: () => void; isPending: boolean; cancelLabel: string; saveLabel: string; savingLabel: string }

export function SectionCardFooter({ onCancel, onSave, isPending, cancelLabel, saveLabel, savingLabel }: SectionCardFooterProps) {
  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>{cancelLabel}</Button>
      <Button size="sm" onClick={onSave} disabled={isPending}>
        {isPending ? (<><Loader2 className="size-3 animate-spin" />{savingLabel}</>) : saveLabel}
      </Button>
    </div>
  );
}
