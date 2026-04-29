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
import { updateUserAdmin } from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { UserRow } from "./users-table";

interface UserEditModalProps {
  user: (UserRow & {
    phone?: string | null;
    language?: string | null;
    role: string;
    // Professional fields
    specialty?: string | null;
    registration_number?: string | null;
    consultation_fee?: number | null;
    bio?: string | null;
    languages_spoken?: string[] | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
    // Patient fields
    insurance_provider?: string | null;
  }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserEditModal({ user, open, onOpenChange }: UserEditModalProps) {
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
    if (!user) return;
    startTransition(async () => {
      const data: Record<string, unknown> = {};
      if (form.first_name !== undefined) data.first_name = form.first_name;
      if (form.last_name !== undefined) data.last_name = form.last_name;
      if (form.email !== undefined) data.email = form.email;
      if (form.phone !== undefined) data.phone = form.phone;
      if (form.language !== undefined) data.language = form.language;
      // Pro fields
      if (form.specialty !== undefined) data.specialty = form.specialty;
      if (form.registration_number !== undefined) data.registration_number = form.registration_number;
      if (form.consultation_fee !== undefined) data.consultation_fee = Number(form.consultation_fee);
      if (form.bio !== undefined) data.bio = form.bio;
      if (form.address !== undefined) data.address = form.address;
      if (form.city !== undefined) data.city = form.city;
      if (form.postal_code !== undefined) data.postal_code = form.postal_code;
      // Patient fields
      if (form.insurance_provider !== undefined) data.insurance_provider = form.insurance_provider;

      const result = await updateUserAdmin(user.id, data);
      if (result.success) {
        toast.success(t.users.userUpdated);
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

  if (!user) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="p-6 sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.users.editUser}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t.users.editUserDescription}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.users.firstName}</Label>
              <Input value={getVal("first_name", user.first_name)} onChange={(e) => set("first_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.users.lastName}</Label>
              <Input value={getVal("last_name", user.last_name)} onChange={(e) => set("last_name", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.users.email}</Label>
            <Input type="email" value={getVal("email", user.email)} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.users.phone}</Label>
              <Input value={getVal("phone", user.phone)} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.users.language}</Label>
              <Input value={getVal("language", user.language)} onChange={(e) => set("language", e.target.value)} />
            </div>
          </div>

          {user.role === "professional" && (
            <>
              <hr className="my-2" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.users.specialty}</Label>
                  <Input value={getVal("specialty", user.specialty)} onChange={(e) => set("specialty", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t.users.registrationNumber}</Label>
                  <Input value={getVal("registration_number", user.registration_number)} onChange={(e) => set("registration_number", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.users.consultationFee}</Label>
                <Input type="number" value={getVal("consultation_fee", user.consultation_fee?.toString())} onChange={(e) => set("consultation_fee", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.users.bio}</Label>
                <Textarea value={getVal("bio", user.bio)} onChange={(e) => set("bio", e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.users.address}</Label>
                  <Input value={getVal("address", user.address)} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t.users.city}</Label>
                  <Input value={getVal("city", user.city)} onChange={(e) => set("city", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.users.postalCode}</Label>
                <Input value={getVal("postal_code", user.postal_code)} onChange={(e) => set("postal_code", e.target.value)} />
              </div>
            </>
          )}

          {user.role === "patient" && (
            <>
              <hr className="my-2" />
              <div className="space-y-2">
                <Label>{t.users.insurance}</Label>
                <Input value={getVal("insurance_provider", user.insurance_provider)} onChange={(e) => set("insurance_provider", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.users.address}</Label>
                  <Input value={getVal("address", user.address)} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t.users.city}</Label>
                  <Input value={getVal("city", user.city)} onChange={(e) => set("city", e.target.value)} />
                </div>
              </div>
            </>
          )}
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
