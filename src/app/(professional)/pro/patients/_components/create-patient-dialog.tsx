"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPatient } from "@/app/(professional)/_actions/patients";
import { RADIUS, SPACING } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

const patientSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.email(),
  phone: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export function CreatePatientDialog() {
  const [open, setOpen] = useState(false);
  const { t } = useProfessionalI18n();
  const pt = t.patients;

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { first_name: "", last_name: "", email: "", phone: "" },
  });

  const onSubmit = async (values: PatientFormValues) => {
    const result = await createPatient(values);
    if (result.success) {
      if (result.data?.already_exists) {
        toast.info(pt.patientAlreadyExists);
      } else {
        toast.success(pt.patientCreated);
      }
      form.reset();
      setOpen(false);
    } else {
      toast.error(pt.errorCreating);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          {pt.addPatient}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className={`${SPACING.card} ${RADIUS.card}`}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{pt.addPatient}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{pt.description}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{pt.firstName}</Label>
              <Input
                id="first_name"
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
              <Label htmlFor="last_name">{pt.lastName}</Label>
              <Input
                id="last_name"
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
            <Label htmlFor="email">{pt.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder={pt.emailPlaceholder}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{pt.phone}</Label>
            <Input
              id="phone"
              placeholder={pt.phonePlaceholder}
              {...form.register("phone")}
            />
          </div>
          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? pt.creating : pt.create}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
