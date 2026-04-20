"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceOption {
  id: string;
  name: string;
}

export interface WalkInPatientFieldsProps {
  walkInT: Record<string, string>;
  services: ServiceOption[];
  patientName: string;
  serviceId: string;
  phone: string;
  email: string;
  notes: string;
  onPatientNameChange: (value: string) => void;
  onServiceIdChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

export function WalkInPatientFields({
  walkInT,
  services,
  patientName,
  serviceId,
  phone,
  email,
  notes,
  onPatientNameChange,
  onServiceIdChange,
  onPhoneChange,
  onEmailChange,
  onNotesChange,
}: WalkInPatientFieldsProps) {
  return (
    <>
      {/* Patient name */}
      <div className="space-y-1.5">
        <Label>{walkInT.patientName}</Label>
        <Input
          value={patientName}
          onChange={(e) => onPatientNameChange(e.target.value)}
          placeholder={walkInT.patientNamePlaceholder}
          autoFocus
        />
      </div>

      {/* Service */}
      <div className="space-y-1.5">
        <Label>{walkInT.service}</Label>
        <Select value={serviceId} onValueChange={onServiceIdChange}>
          <SelectTrigger>
            <SelectValue placeholder={walkInT.servicePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Phone + Email in a row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{walkInT.phone}</Label>
          <Input
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={walkInT.phonePlaceholder}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{walkInT.email}</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder={walkInT.emailPlaceholder}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>{walkInT.notes}</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={walkInT.notesPlaceholder}
          rows={2}
        />
      </div>
    </>
  );
}
