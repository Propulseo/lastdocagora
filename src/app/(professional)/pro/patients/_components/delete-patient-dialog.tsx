"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {pt.deletePatient}: {patientName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pt.deletePatientConfirm}
            <br />
            <span className="mt-1 block text-xs text-muted-foreground">
              {pt.deletePatientWarning}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? pt.deleting : pt.deletePatient}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
