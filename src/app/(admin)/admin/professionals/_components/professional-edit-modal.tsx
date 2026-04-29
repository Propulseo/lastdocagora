"use client";

import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { updateProfessionalAdmin } from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface ProfessionalEditData {
  id: string;
  specialty: string;
  registration_number?: string | null;
  consultation_fee?: number | null;
  bio?: string | null;
  languages_spoken?: string[] | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
}

interface ProfessionalEditModalProps {
  professional: ProfessionalEditData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfessionalEditModal({
  professional,
  open,
  onOpenChange,
}: ProfessionalEditModalProps) {
  const { t } = useAdminI18n();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<Record<string, string>>({});

  function getVal(key: string, fallback: string | null | undefined) {
    return form[key] ?? fallback ?? "";
  }

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!professional) return;
    startTransition(async () => {
      const data: Record<string, unknown> = {};
      if (form.specialty !== undefined) data.specialty = form.specialty;
      if (form.registration_number !== undefined) data.registration_number = form.registration_number;
      if (form.consultation_fee !== undefined) data.consultation_fee = Number(form.consultation_fee);
      if (form.bio !== undefined) data.bio = form.bio;
      if (form.address !== undefined) data.address = form.address;
      if (form.city !== undefined) data.city = form.city;
      if (form.postal_code !== undefined) data.postal_code = form.postal_code;

      const result = await updateProfessionalAdmin(professional.id, data);
      if (result.success) {
        toast.success(t.professionals.professionalUpdated);
        onOpenChange(false);
        setForm({});
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
    });
  }

  function handleOpenChange(val: boolean) {
    if (!val) setForm({});
    onOpenChange(val);
  }

  if (!professional) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="p-6 sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.professionals.editProfessional}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{""}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.users.specialty}</Label>
              <Input value={getVal("specialty", professional.specialty)} onChange={(e) => set("specialty", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.users.registrationNumber}</Label>
              <Input value={getVal("registration_number", professional.registration_number)} onChange={(e) => set("registration_number", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.users.consultationFee}</Label>
            <Input type="number" value={getVal("consultation_fee", professional.consultation_fee?.toString())} onChange={(e) => set("consultation_fee", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t.users.bio}</Label>
            <Textarea value={getVal("bio", professional.bio)} onChange={(e) => set("bio", e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.users.address}</Label>
              <Input value={getVal("address", professional.address)} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.users.city}</Label>
              <Input value={getVal("city", professional.city)} onChange={(e) => set("city", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.users.postalCode}</Label>
            <Input value={getVal("postal_code", professional.postal_code)} onChange={(e) => set("postal_code", e.target.value)} />
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" className="min-h-[48px]" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button className="min-h-[48px]" onClick={handleSave} disabled={isPending}>
            {isPending ? t.common.saving : t.common.save}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
