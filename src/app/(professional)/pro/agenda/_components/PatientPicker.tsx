"use client";

import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Search, User, UserPlus } from "lucide-react";
import type { useProfessionalI18n } from "@/lib/i18n/pro";
import type { PatientOption, PatientMode } from "../_types/manual-appointment";

interface PatientPickerProps {
  patientMode: PatientMode;
  onToggleMode: () => void;
  // Select mode
  loadingPatients: boolean;
  proPatients: PatientOption[];
  filteredPatients: PatientOption[];
  selectedPatient: PatientOption | null;
  onSelectPatient: (patient: PatientOption | null) => void;
  patientFilter: string;
  onFilterChange: (value: string) => void;
  // New mode
  newFirstName: string;
  onFirstNameChange: (value: string) => void;
  newLastName: string;
  onLastNameChange: (value: string) => void;
  newEmail: string;
  onEmailChange: (value: string) => void;
  newPhone: string;
  onPhoneChange: (value: string) => void;
  t: ReturnType<typeof useProfessionalI18n>["t"];
}

export function PatientPicker({
  patientMode,
  onToggleMode,
  loadingPatients,
  proPatients,
  filteredPatients,
  selectedPatient,
  onSelectPatient,
  patientFilter,
  onFilterChange,
  newFirstName,
  onFirstNameChange,
  newLastName,
  onLastNameChange,
  newEmail,
  onEmailChange,
  newPhone,
  onPhoneChange,
  t,
}: PatientPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          {patientMode === "select" ? t.agenda.myPatients : t.agenda.newPatient}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onToggleMode}
        >
          {patientMode === "select" ? (
            <>
              <UserPlus className="h-3.5 w-3.5" />
              {t.agenda.newPatient}
            </>
          ) : (
            <>
              <User className="h-3.5 w-3.5" />
              {t.agenda.myPatients}
            </>
          )}
        </Button>
      </div>

      {patientMode === "select" ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.agenda.selectPatient}
              value={patientFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className={`max-h-40 overflow-y-auto ${RADIUS.element} border`}>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                !selectedPatient && "bg-accent",
              )}
              onClick={() => onSelectPatient(null)}
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  !selectedPatient ? "opacity-100" : "opacity-0",
                )}
              />
              <span className="text-muted-foreground italic">
                {t.agenda.withoutPatient}
              </span>
            </button>

            {loadingPatients ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t.agenda.loadingPatients}
              </div>
            ) : filteredPatients.length === 0 && proPatients.length > 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t.patients.noResults}
              </div>
            ) : proPatients.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t.agenda.noPatientYet}
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                    selectedPatient?.id === patient.id && "bg-accent",
                  )}
                  onClick={() => onSelectPatient(patient)}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      selectedPatient?.id === patient.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">
                      {patient.first_name} {patient.last_name}
                    </span>
                    {patient.email && (
                      <span className="ml-2 text-xs text-muted-foreground truncate">
                        {patient.email}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className={`space-y-3 ${RADIUS.element} border p-3 bg-muted/30`}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-first-name" className="text-xs">
                {t.agenda.firstName} *
              </Label>
              <Input
                id="new-first-name"
                value={newFirstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-last-name" className="text-xs">
                {t.agenda.lastName} *
              </Label>
              <Input
                id="new-last-name"
                value={newLastName}
                onChange={(e) => onLastNameChange(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-email" className="text-xs">
              {t.agenda.email} *
            </Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-phone" className="text-xs">
              {t.agenda.phone}
            </Label>
            <Input
              id="new-phone"
              type="tel"
              value={newPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
