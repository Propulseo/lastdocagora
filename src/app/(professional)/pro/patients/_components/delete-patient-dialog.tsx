"use client";

import { useState } from "react";
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
import { deletePatient } from "@/app/(professional)/_actions/patients";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

interface DeletePatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
}

export function DeletePatientDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
}: DeletePatientDialogProps) {
  const { t } = useProfessionalI18n();
  const pt = t.patients;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deletePatient(patientId);
    setIsDeleting(false);
    if (result.success) {
      toast.success(pt.patientDeleted);
      onOpenChange(false);
    } else {
      toast.error(pt.errorDeleting);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="p-6">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {pt.deletePatient}: {patientName}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {pt.deletePatientConfirm}
            <br />
            <span className="mt-1 block text-xs text-muted-foreground">
              {pt.deletePatientWarning}
            </span>
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? pt.deleting : pt.deletePatient}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
