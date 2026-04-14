"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, UserMinus } from "lucide-react";
import { RADIUS } from "@/lib/design-tokens";
import type { PatientRow } from "../_lib/types";

export interface PatientRowActionsProps {
  patient: PatientRow;
  labels: {
    actions: string;
    editPatient: string;
    removePatient: string;
  };
  onEdit: (patient: PatientRow) => void;
  onDelete: (patient: PatientRow) => void;
}

export function PatientRowActions({
  patient,
  labels,
  onEdit,
  onDelete,
}: PatientRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">{labels.actions}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={RADIUS.element}>
        <DropdownMenuItem onClick={() => onEdit(patient)}>
          <Pencil className="mr-2 size-4" />
          {labels.editPatient}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(patient)}
        >
          <UserMinus className="mr-2 size-4" />
          {labels.removePatient}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
