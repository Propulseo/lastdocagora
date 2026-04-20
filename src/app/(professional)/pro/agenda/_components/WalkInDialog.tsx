"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { UserPlus } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { RADIUS } from "@/lib/design-tokens";
import { WalkInForm } from "./WalkInForm";

export interface WalkInCreatedData {
  appointmentId: string;
  patientId: string | null;
  patientName: string;
}

interface WalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  onCreated: (data: WalkInCreatedData) => void;
  preselectedTime?: string;
}

export function WalkInDialog({
  open,
  onOpenChange,
  professionalId,
  onCreated,
  preselectedTime,
}: WalkInDialogProps) {
  const { t } = useProfessionalI18n();
  const walkInT = t.agenda.walkIn as Record<string, string>;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={`sm:max-w-lg p-6 ${RADIUS.card}`}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-amber-600" />
            {walkInT.dialogTitle}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        {open && (
          <WalkInForm
            walkInT={walkInT}
            professionalId={professionalId}
            preselectedTime={preselectedTime}
            onOpenChange={onOpenChange}
            onCreated={onCreated}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
