"use client";

import { useState, Suspense } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserX, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS } from "@/lib/design-tokens";
import { EditPatientDialog } from "./edit-patient-dialog";
import { DeletePatientDialog } from "./delete-patient-dialog";
import { PatientDrawer } from "./patient-drawer";
import { PatientRowActions } from "./patient-row-actions";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import type { PatientRow } from "../_lib/types";

const PAGE_SIZE = 20;

interface PatientsTableProps {
  patients: PatientRow[];
  totalUnfiltered: number;
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default", inactive: "secondary", new: "outline",
};

export function PatientsTable({ patients, totalUnfiltered }: PatientsTableProps) {
  const { t } = useProfessionalI18n();
  const pt = t.patients;
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR" | "en-GB";
  const statusLabels = (pt.statusBadge ?? {}) as Record<string, string>;

  const [editPatient, setEditPatient] = useState<PatientRow | null>(null);
  const [deletePatient, setDeletePatient] = useState<PatientRow | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );

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
                {totalUnfiltered}{" "}
                {totalUnfiltered !== 1
                  ? pt.patientsFoundPlural
                  : pt.patientsFoundSingular}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {patients.length === 0 ? (
            <EmptyState
              icon={UserX}
              title={pt.noResults}
              description={pt.noPatientFound}
            />
          ) : (
            <>
              {/* Mobile card list */}
              <div className="space-y-2 lg:hidden">
                {patients.map((patient) => (
                  <button
                    key={patient.patient_id}
                    onClick={() => setSelectedPatientId(patient.patient_id)}
                    className={cn("flex w-full items-center gap-3 border p-3 text-left transition-colors hover:bg-accent/50", RADIUS.sm)}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold uppercase text-primary">
                      {(patient.first_name?.[0] ?? "") + (patient.last_name?.[0] ?? "")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{patient.first_name} {patient.last_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{patient.email || patient.phone || ""}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block">
                <div className={cn("bg-card overflow-hidden", RADIUS.card, SHADOW.card)}>
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
                        <TableHead className="hidden xl:table-cell">
                          {(pt.filters as Record<string, string>)?.statusLabel ?? "Status"}
                        </TableHead>
                        <TableHead className="w-10">
                          <span className="sr-only">{pt.actions}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((p) => {
                        const initials =
                          (p.first_name?.[0] ?? "") +
                          (p.last_name?.[0] ?? "");
                        return (
                          <TableRow
                            key={p.patient_id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() =>
                              setSelectedPatientId(p.patient_id)
                            }
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
                                ? ((pt.insuranceLabels as Record<string, string>)?.[
                                    p.insurance_provider
                                  ] ?? p.insurance_provider)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {p.last_appointment
                                ? new Date(
                                    p.last_appointment,
                                  ).toLocaleDateString(dateLocale)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              {p.total_appointments}
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <Badge
                                variant={
                                  STATUS_BADGE_VARIANT[p.status] ?? "secondary"
                                }
                                className="text-xs"
                              >
                                {statusLabels[p.status] ?? p.status}
                              </Badge>
                            </TableCell>
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                            >
                              <PatientRowActions
                                patient={p}
                                labels={{
                                  actions: pt.actions,
                                  editPatient: pt.editPatient,
                                  deletePatient: pt.deletePatient,
                                }}
                                onEdit={setEditPatient}
                                onDelete={setDeletePatient}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Suspense>
                <Pagination total={totalUnfiltered} pageSize={PAGE_SIZE} />
              </Suspense>
            </>
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
        patientName={(() => {
          const sp = patients.find((p) => p.patient_id === selectedPatientId);
          return sp ? `${sp.first_name ?? ""} ${sp.last_name ?? ""}`.trim() : "";
        })()}
        onClose={() => setSelectedPatientId(null)}
      />
    </>
  );
}
