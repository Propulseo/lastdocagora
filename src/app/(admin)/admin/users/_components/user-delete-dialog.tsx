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
import { deleteUser } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface UserDeleteDialogProps {
  userId: string;
  fullName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDeleteDialog({
  userId,
  fullName,
  open,
  onOpenChange,
}: UserDeleteDialogProps) {
  const { t } = useAdminI18n();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmName, setConfirmName] = useState("");
  const [isPending, startTransition] = useTransition();

  const namesMatch =
    confirmName.trim().toLowerCase() === fullName.trim().toLowerCase();

  function handleOpenChange(val: boolean) {
    if (!val) {
      setStep(1);
      setConfirmName("");
    }
    onOpenChange(val);
  }

  function handleStep1Confirm() {
    setStep(2);
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success(t.users.userDeleted);
        handleOpenChange(false);
      } else if (result.error === "self_deletion") {
        toast.error(t.users.cannotDeleteSelf);
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
      }
    });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="p-6">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {step === 1
              ? t.users.deleteConfirmTitle
              : t.users.deleteStep2Title}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {step === 1
              ? t.users.deleteConfirmDescription
              : ""}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {step === 2 && (
          <div className="space-y-3 py-4">
            <Label className="text-sm font-medium">{fullName}</Label>
            <Input
              placeholder={t.users.deleteStep2Placeholder}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoFocus
            />
            {confirmName.length > 0 && !namesMatch && (
              <p className="text-sm text-destructive">
                {t.users.deleteStep2Mismatch}
              </p>
            )}
          </div>
        )}

        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            className="min-h-[48px]"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {t.common.cancel}
          </Button>
          {step === 1 ? (
            <Button
              variant="destructive"
              className="min-h-[48px]"
              onClick={handleStep1Confirm}
            >
              {t.common.confirm}
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="min-h-[48px]"
              onClick={handleDelete}
              disabled={!namesMatch || isPending}
            >
              {isPending ? t.common.processing : t.users.delete}
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
