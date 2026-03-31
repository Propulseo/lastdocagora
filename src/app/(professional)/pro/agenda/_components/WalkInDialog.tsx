"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
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
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { createWalkIn } from "@/app/(professional)/_actions/walkins";

interface ServiceOption {
  id: string;
  name: string;
}

interface WalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  onCreated: () => void;
}

export function WalkInDialog({
  open,
  onOpenChange,
  professionalId,
  onCreated,
}: WalkInDialogProps) {
  const { t } = useProfessionalI18n();
  const walkInT = t.agenda.walkIn as Record<string, string>;
  const supabase = useMemo(() => createClient(), []);

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [patientName, setPatientName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Load services and reset form on open
  useEffect(() => {
    if (!open) return;

    const now = new Date();
    setTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    );
    setPatientName("");
    setServiceId("");
    setPhone("");
    setEmail("");
    setNotes("");

    async function loadServices() {
      const { data } = await supabase
        .from("services")
        .select("id, name")
        .eq("professional_id", professionalId)
        .eq("is_active", true)
        .order("name");
      setServices(data ?? []);
    }

    loadServices();
  }, [open, professionalId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim() || !serviceId) return;

    setSaving(true);
    const result = await createWalkIn({
      patientName: patientName.trim(),
      serviceId,
      scheduledTime: time,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);

    if (result.success) {
      toast.success(walkInT.success);
      onOpenChange(false);
      onCreated();
    } else {
      toast.error(walkInT.error);
    }
  }

  const canSubmit = patientName.trim() && serviceId && !saving;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md p-6">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-amber-600" />
            {walkInT.dialogTitle}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient name */}
          <div className="space-y-1.5">
            <Label>{walkInT.patientName}</Label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder={walkInT.patientNamePlaceholder}
              autoFocus
            />
          </div>

          {/* Service */}
          <div className="space-y-1.5">
            <Label>{walkInT.service}</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
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

          {/* Time */}
          <div className="space-y-1.5">
            <Label>{walkInT.time}</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Phone + Email in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{walkInT.phone}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={walkInT.phonePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{walkInT.email}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={walkInT.emailPlaceholder}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>{walkInT.notes}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={walkInT.notesPlaceholder}
              rows={2}
            />
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {walkInT.submit}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
