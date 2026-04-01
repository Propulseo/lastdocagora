"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { PatientRow } from "../_lib/types";

export interface PatientRowActionsProps {
  patient: PatientRow;
  labels: {
    actions: string;
    editPatient: string;
    deletePatient: string;
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
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(patient)}>
          <Pencil className="mr-2 size-4" />
          {labels.editPatient}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(patient)}
        >
          <Trash2 className="mr-2 size-4" />
          {labels.deletePatient}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
