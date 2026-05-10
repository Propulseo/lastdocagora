"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
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
import {
  deleteService,
  getServiceLinkedCount,
} from "@/app/(professional)/_actions/services";
import { RADIUS } from "@/lib/design-tokens";
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
  const [linkedCount, setLinkedCount] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setLinkedCount(null);
      getServiceLinkedCount(serviceId).then(setLinkedCount);
    }
  }, [open, serviceId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteService(serviceId);
    setIsDeleting(false);
    if (result.success) {
      toast.success(sv.serviceDeleted);
      onOpenChange(false);
    } else {
      toast.error(sv.errorDeleting);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={RADIUS.card}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {sv.deleteService}: {serviceName}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {sv.deleteServiceConfirm}
              {linkedCount !== null && linkedCount > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <span className="text-xs">
                    {sv.cannotDeleteLinked.replace("{count}", String(linkedCount))}
                    {" "}{sv.deleteServiceLinkedInfo}
                  </span>
                </div>
              )}
              <span className="mt-2 block text-xs text-muted-foreground">
                {sv.deleteServiceWarning}
              </span>
            </div>
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
