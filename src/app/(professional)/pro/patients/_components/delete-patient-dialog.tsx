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
import { removePatient } from "@/app/(professional)/_actions/patients";
import { RADIUS, SPACING } from "@/lib/design-tokens";
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
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    const result = await removePatient(patientId);
    setIsRemoving(false);
    if (result.success) {
      toast.success(pt.patientRemoved);
      onOpenChange(false);
    } else if (result.error === "linked_data") {
      toast.error(pt.removeErrorLinkedData);
    } else if (result.error === "permission_denied") {
      toast.error(pt.removeErrorPermission);
    } else if (result.error === "not_owned") {
      toast.error(pt.removeErrorNotOwned);
    } else {
      toast.error(pt.errorRemoving);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={`${SPACING.card} ${RADIUS.card}`}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {pt.removePatient}: {patientName}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {pt.removePatientConfirm}
            <br />
            <span className="mt-1 block text-xs text-muted-foreground">
              {pt.removePatientWarning}
            </span>
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleRemove}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? pt.removing : pt.removePatient}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
