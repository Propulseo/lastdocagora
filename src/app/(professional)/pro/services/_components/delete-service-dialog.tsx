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
import { deleteService } from "@/app/(professional)/_actions/services";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

interface DeleteServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceName: string;
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  serviceId,
  serviceName,
}: DeleteServiceDialogProps) {
  const { t } = useProfessionalI18n();
  const sv = t.services;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteService(serviceId);
    setIsDeleting(false);
    if (result.success) {
      toast.success(sv.serviceDeleted);
      onOpenChange(false);
    } else if (result.error?.startsWith("APPOINTMENTS_LINKED:")) {
      const count = result.error.split(":")[1];
      toast.error(
        `Impossible de supprimer : ${count} consultation(s) utilisent ce service. Désactivez-le à la place.`,
      );
    } else {
      toast.error(sv.errorDeleting);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {sv.deleteService}: {serviceName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {sv.deleteServiceConfirm}
            <br />
            <span className="mt-1 block text-xs text-muted-foreground">
              {sv.deleteServiceWarning}
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
            {isDeleting ? sv.deleting : sv.deleteService}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
