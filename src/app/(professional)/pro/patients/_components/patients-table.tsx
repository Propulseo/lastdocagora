"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, UserX, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { EditPatientDialog } from "./edit-patient-dialog";
import { DeletePatientDialog } from "./delete-patient-dialog";
import { PatientDrawer } from "./patient-drawer";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

export interface PatientRow {
  patient_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  insurance_provider: string | null;
  last_appointment: string | null;
  total_appointments: number;
}

interface PatientsTableProps {
  patients: PatientRow[];
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const { t } = useProfessionalI18n();
  const pt = t.patients;
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";

  const [search, setSearch] = useState("");
  const [editPatient, setEditPatient] = useState<PatientRow | null>(null);
  const [deletePatient, setDeletePatient] = useState<PatientRow | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const filtered = search.trim()
    ? patients.filter((p) => {
        const fullName =
          `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
        return fullName.includes(search.toLowerCase().trim());
      })
    : patients;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                {pt.patientList}
              </CardTitle>
              <CardDescription>
                {filtered.length}{" "}
                {filtered.length !== 1
                  ? pt.patientsFoundPlural
                  : pt.patientsFoundSingular}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={pt.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={UserX}
              title={search ? pt.noResults : pt.noPatients}
              description={
                search ? pt.noPatientFound : pt.noPatientRegistered
              }
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{pt.patient}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {pt.email}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {pt.phone}
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      {pt.insurance}
                    </TableHead>
                    <TableHead>{pt.lastAppointment}</TableHead>
                    <TableHead className="text-right">
                      {pt.appointments}
                    </TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">{pt.actions}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const initials =
                      (p.first_name?.[0] ?? "") + (p.last_name?.[0] ?? "");
                    return (
                      <TableRow
                        key={p.patient_id}
                        className="cursor-pointer"
                        onClick={() => setSelectedPatientId(p.patient_id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                {initials || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {p.first_name} {p.last_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {p.email ?? "-"}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {p.phone ?? "-"}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {p.insurance_provider
                            ? ((pt.insuranceLabels as Record<string, string>)?.[p.insurance_provider] ?? p.insurance_provider)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {p.last_appointment
                            ? new Date(
                                p.last_appointment
                              ).toLocaleDateString(dateLocale)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {p.total_appointments}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">{pt.actions}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditPatient(p)}
                              >
                                <Pencil className="mr-2 size-4" />
                                {pt.editPatient}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeletePatient(p)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                {pt.deletePatient}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editPatient && (
        <EditPatientDialog
          open={!!editPatient}
          onOpenChange={(open) => !open && setEditPatient(null)}
          patient={editPatient}
        />
      )}

      {deletePatient && (
        <DeletePatientDialog
          open={!!deletePatient}
          onOpenChange={(open) => !open && setDeletePatient(null)}
          patientId={deletePatient.patient_id}
          patientName={`${deletePatient.first_name ?? ""} ${deletePatient.last_name ?? ""}`.trim()}
        />
      )}

      <PatientDrawer
        patientId={selectedPatientId}
        patientName={
          selectedPatientId
            ? `${patients.find((p) => p.patient_id === selectedPatientId)?.first_name ?? ""} ${patients.find((p) => p.patient_id === selectedPatientId)?.last_name ?? ""}`.trim()
            : ""
        }
        onClose={() => setSelectedPatientId(null)}
      />
    </>
  );
}
