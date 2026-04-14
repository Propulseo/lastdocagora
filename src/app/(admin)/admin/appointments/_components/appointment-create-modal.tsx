"use client";

import { useState, useTransition, useEffect } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
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
import { createAppointmentAdmin } from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { createClient } from "@/lib/supabase/client";

interface SimpleRecord {
  id: string;
  label: string;
}

interface ServiceRecord {
  id: string;
  label: string;
  professional_id: string;
  duration_minutes: number;
}

interface AppointmentCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentCreateModal({
  open,
  onOpenChange,
}: AppointmentCreateModalProps) {
  const { t } = useAdminI18n();
  const [isPending, startTransition] = useTransition();

  const [patients, setPatients] = useState<SimpleRecord[]>([]);
  const [professionals, setProfessionals] = useState<SimpleRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);

  const [patientId, setPatientId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");

  // Load data on open
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();

    supabase
      .from("patients")
      .select("id, first_name, last_name")
      .order("first_name")
      .limit(200)
      .then(({ data }) => {
        setPatients(
          (data ?? []).map((p) => ({
            id: p.id,
            label: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id.slice(-5),
          }))
        );
      });

    supabase
      .from("professionals")
      .select("id, users!professionals_user_id_fkey(first_name, last_name)")
      .eq("verification_status", "verified")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setProfessionals(
          (data ?? []).map((p) => {
            const u = p.users as unknown as { first_name: string; last_name: string } | null;
            return {
              id: p.id,
              label: u ? `${u.first_name} ${u.last_name}` : p.id.slice(-5),
            };
          })
        );
      });

    supabase
      .from("services")
      .select("id, name, professional_id, duration_minutes")
      .eq("is_active", true)
      .order("name")
      .limit(500)
      .then(({ data }) => {
        setServices(
          (data ?? []).map((s) => ({
            id: s.id,
            label: s.name,
            professional_id: s.professional_id,
            duration_minutes: s.duration_minutes,
          }))
        );
      });
  }, [open]);

  const filteredServices = professionalId
    ? services.filter((s) => s.professional_id === professionalId)
    : services;

  function handleServiceChange(sid: string) {
    setServiceId(sid);
    const svc = services.find((s) => s.id === sid);
    if (svc) setDuration(String(svc.duration_minutes));
  }

  function resetForm() {
    setPatientId("");
    setProfessionalId("");
    setServiceId("");
    setDate("");
    setTime("");
    setDuration("30");
    setNotes("");
  }

  function handleOpenChange(val: boolean) {
    if (!val) resetForm();
    onOpenChange(val);
  }

  function handleCreate() {
    if (!patientId || !professionalId || !serviceId || !date || !time) return;
    startTransition(async () => {
      const result = await createAppointmentAdmin({
        professionalId,
        patientId,
        serviceId,
        date,
        time,
        durationMinutes: Number(duration),
        notes: notes || undefined,
      });
      if (result.success) {
        toast.success(t.appointments.appointmentCreated);
        handleOpenChange(false);
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
      }
    });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="p-6 sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.appointments.createAppointment}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{""}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>{t.appointments.selectPatient}</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder={t.appointments.selectPatient} /></SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.appointments.selectProfessional}</Label>
            <Select value={professionalId} onValueChange={(v) => { setProfessionalId(v); setServiceId(""); }}>
              <SelectTrigger><SelectValue placeholder={t.appointments.selectProfessional} /></SelectTrigger>
              <SelectContent>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.appointments.selectService}</Label>
            <Select value={serviceId} onValueChange={handleServiceChange}>
              <SelectTrigger><SelectValue placeholder={t.appointments.selectService} /></SelectTrigger>
              <SelectContent>
                {filteredServices.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.appointments.date}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.appointments.time}</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.appointments.duration}</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={5} step={5} />
          </div>

          <div className="space-y-2">
            <Label>{t.appointments.notes}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" className="min-h-[48px]" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button
            className="min-h-[48px]"
            onClick={handleCreate}
            disabled={isPending || !patientId || !professionalId || !serviceId || !date || !time}
          >
            {isPending ? t.common.saving : t.appointments.createAppointment}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
