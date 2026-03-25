"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePatient } from "@/app/(professional)/_actions/patients";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

const patientSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.email().optional(),
  phone: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface EditPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: {
    patient_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export function EditPatientDialog({
  open,
  onOpenChange,
  patient,
}: EditPatientDialogProps) {
  const { t } = useProfessionalI18n();
  const pt = t.patients;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: patient.first_name ?? "",
      last_name: patient.last_name ?? "",
      email: patient.email ?? "",
      phone: patient.phone ?? "",
    },
  });

  const onSubmit = async (values: PatientFormValues) => {
    setIsSubmitting(true);
    const result = await updatePatient(patient.patient_id, values);
    setIsSubmitting(false);
    if (result.success) {
      toast.success(pt.patientUpdated);
      onOpenChange(false);
    } else {
      toast.error(pt.errorUpdating);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="p-6">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{pt.editPatient}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{pt.description}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_first_name">{pt.firstName}</Label>
              <Input
                id="edit_first_name"
                placeholder={pt.firstNamePlaceholder}
                {...form.register("first_name")}
              />
              {form.formState.errors.first_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.first_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_last_name">{pt.lastName}</Label>
              <Input
                id="edit_last_name"
                placeholder={pt.lastNamePlaceholder}
                {...form.register("last_name")}
              />
              {form.formState.errors.last_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_email">{pt.email}</Label>
            <Input
              id="edit_email"
              type="email"
              placeholder={pt.emailPlaceholder}
              {...form.register("email")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_phone">{pt.phone}</Label>
            <Input
              id="edit_phone"
              placeholder={pt.phonePlaceholder}
              {...form.register("phone")}
            />
          </div>
          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? pt.updating : pt.update}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
