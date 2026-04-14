"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { AppointmentCreateModal } from "./appointment-create-modal";

export function AppointmentsHeaderAction() {
  const { t } = useAdminI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="min-h-[44px]">
        <Plus className="size-4 mr-2" />
        {t.appointments.createAppointment}
      </Button>
      <AppointmentCreateModal open={open} onOpenChange={setOpen} />
    </>
  );
}
