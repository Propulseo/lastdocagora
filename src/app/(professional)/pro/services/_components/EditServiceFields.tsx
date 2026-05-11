/**
 * @deprecated This component is no longer used.
 * The edit-service-dialog now inlines the Option B pattern
 * (single field + translation toggle) directly.
 * Kept for reference — safe to delete during cleanup.
 */
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UseFormReturn } from "react-hook-form";

interface ServiceFormValues {
  name: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
}

interface EditServiceFieldsProps {
  form: UseFormReturn<ServiceFormValues>;
  nameFr: string;
  nameEn: string;
  descFr: string;
  descEn: string;
  onNameFrChange: (value: string) => void;
  onNameEnChange: (value: string) => void;
  onDescFrChange: (value: string) => void;
  onDescEnChange: (value: string) => void;
  labels: {
    name: string;
    nameTabPt: string;
    nameTabFr: string;
    nameTabEn: string;
    nameOptional: string;
    namePlaceholder: string;
    descriptionField: string;
    descTabPt: string;
    descTabFr: string;
    descTabEn: string;
    descriptionPlaceholder: string;
  };
}

export function EditServiceFields({
  form,
  nameFr,
  nameEn,
  descFr,
  descEn,
  onNameFrChange,
  onNameEnChange,
  onDescFrChange,
  onDescEnChange,
  labels,
}: EditServiceFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>{labels.name}</Label>
        <Input
          id="edit_name"
          placeholder={labels.namePlaceholder}
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label>{labels.descriptionField}</Label>
        <Textarea
          id="edit_description"
          placeholder={labels.descriptionPlaceholder}
          rows={3}
          {...form.register("description")}
        />
      </div>
      <div className="space-y-2">
        <Label>{labels.nameTabFr}</Label>
        <Input
          id="edit_name_fr"
          placeholder={labels.namePlaceholder}
          value={nameFr}
          onChange={(e) => onNameFrChange(e.target.value)}
        />
        <Textarea
          id="edit_description_fr"
          placeholder={labels.descriptionPlaceholder}
          rows={2}
          value={descFr}
          onChange={(e) => onDescFrChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>{labels.nameTabEn}</Label>
        <Input
          id="edit_name_en"
          placeholder={labels.namePlaceholder}
          value={nameEn}
          onChange={(e) => onNameEnChange(e.target.value)}
        />
        <Textarea
          id="edit_description_en"
          placeholder={labels.descriptionPlaceholder}
          rows={2}
          value={descEn}
          onChange={(e) => onDescEnChange(e.target.value)}
        />
      </div>
    </>
  );
}
