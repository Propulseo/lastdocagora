"use client";

import { useState, useEffect, useTransition } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  deleteAvailabilityAdmin,
  clearAvailabilityAdmin,
  updateServiceAdmin,
} from "@/app/(admin)/_actions/admin-crud-actions";
import { bulkCancelProfessionalDay } from "@/app/(admin)/_actions/admin-bulk-cancel";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { format } from "date-fns";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import {
  AvailabilityList,
  ServicesList,
  type AvailabilitySlot,
  type ServiceItem,
} from "./ProfessionalDetailSections";

interface ProfessionalDetailModalProps {
  professionalId: string | null;
  professionalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfessionalDetailModal({
  professionalId,
  professionalName,
  open,
  onOpenChange,
}: ProfessionalDetailModalProps) {
  const { t } = useAdminI18n();
  const [isPending, startTransition] = useTransition();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [bulkCancelConfirm, setBulkCancelConfirm] = useState(false);
  const [bulkCancelDate, setBulkCancelDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ duration: string; price: string }>({ duration: "", price: "" });

  useEffect(() => {
    if (!open || !professionalId) return;
    let cancelled = false;
    const supabase = createClient();

    Promise.all([
      supabase
        .from("availability")
        .select("id, day_of_week, start_time, end_time, is_recurring")
        .eq("professional_id", professionalId)
        .order("day_of_week"),
      supabase
        .from("services")
        .select("id, name, duration_minutes, price")
        .eq("professional_id", professionalId)
        .order("name"),
    ]).then(([avail, svc]) => {
      if (cancelled) return;
      setSlots((avail.data ?? []) as AvailabilitySlot[]);
      setServices((svc.data ?? []) as ServiceItem[]);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [open, professionalId]);

  function handleDeleteSlot(slotId: string) {
    startTransition(async () => {
      const result = await deleteAvailabilityAdmin(slotId);
      if (result.success) {
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
        toast.success(t.professionals.availabilityDeleted);
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
    });
  }

  function handleClearAll() {
    if (!professionalId) return;
    startTransition(async () => {
      const result = await clearAvailabilityAdmin(professionalId);
      if (result.success) {
        setSlots([]);
        toast.success(t.professionals.allAvailabilityCleared);
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
      setClearConfirm(false);
    });
  }

  function handleBulkCancel() {
    if (!professionalId) return;
    startTransition(async () => {
      const result = await bulkCancelProfessionalDay(professionalId, bulkCancelDate);
      if (result.success) {
        if (result.cancelledCount === 0) {
          toast.info(t.professionals.bulkCancelNone);
        } else {
          toast.success(t.professionals.bulkCancelSuccess.replace("{count}", String(result.cancelledCount)));
        }
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
      setBulkCancelConfirm(false);
    });
  }

  function startEditService(svc: ServiceItem) {
    setEditingService(svc.id);
    setEditValues({ duration: String(svc.duration_minutes), price: String(svc.price) });
  }

  function handleSaveService() {
    if (!editingService) return;
    startTransition(async () => {
      const result = await updateServiceAdmin(editingService, {
        duration_minutes: Number(editValues.duration),
        price: Number(editValues.price),
      });
      if (result.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === editingService
              ? { ...s, duration_minutes: Number(editValues.duration), price: Number(editValues.price) }
              : s
          )
        );
        toast.success(t.professionals.serviceUpdated);
        setEditingService(null);
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
    });
  }

  return (
    <>
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent className="p-6 sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{professionalName}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{""}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <Tabs defaultValue="availability" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="availability" className="flex-1">{t.professionals.viewAvailability}</TabsTrigger>
              <TabsTrigger value="services" className="flex-1">{t.professionals.viewServices}</TabsTrigger>
              <TabsTrigger value="emergency" className="flex-1">{t.professionals.bulkCancelDay}</TabsTrigger>
            </TabsList>

            <TabsContent value="availability" className="space-y-3 mt-4">
              <AvailabilityList
                slots={slots}
                loading={loading}
                isPending={isPending}
                onDeleteSlot={handleDeleteSlot}
                onClearAll={() => setClearConfirm(true)}
                t={{
                  processing: t.common.processing,
                  noAvailability: t.professionals.noAvailability,
                  clearAllAvailability: t.professionals.clearAllAvailability,
                }}
              />
            </TabsContent>

            <TabsContent value="services" className="space-y-3 mt-4">
              <ServicesList
                services={services}
                loading={loading}
                isPending={isPending}
                editingService={editingService}
                editValues={editValues}
                onEditValuesChange={setEditValues}
                onStartEdit={startEditService}
                onSaveEdit={handleSaveService}
                onCancelEdit={() => setEditingService(null)}
                t={{
                  processing: t.common.processing,
                  noServices: t.professionals.noServices,
                  save: t.common.save,
                  cancel: t.common.cancel,
                }}
              />
            </TabsContent>

            <TabsContent value="emergency" className="space-y-3 mt-4">
              <label className="text-sm font-medium">{t.appointments.date}</label>
              <input type="date" value={bulkCancelDate} onChange={(e) => setBulkCancelDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px]" />
              <Button variant="destructive" className="w-full min-h-[44px]" onClick={() => setBulkCancelConfirm(true)} disabled={isPending || !bulkCancelDate}>
                {t.professionals.bulkCancelDay}
              </Button>
            </TabsContent>
          </Tabs>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ConfirmDialog
        open={clearConfirm}
        onOpenChange={setClearConfirm}
        title={t.professionals.clearConfirmTitle}
        description={t.professionals.clearConfirmDescription}
        confirmLabel={t.professionals.clearAllAvailability}
        cancelLabel={t.common.cancel}
        loadingLabel={t.common.processing}
        variant="destructive"
        loading={isPending}
        onConfirm={handleClearAll}
      />

      <ConfirmDialog
        open={bulkCancelConfirm}
        onOpenChange={setBulkCancelConfirm}
        title={t.professionals.bulkCancelTitle}
        description={t.professionals.bulkCancelDescription.replace("{date}", bulkCancelDate)}
        confirmLabel={t.professionals.bulkCancelDay}
        cancelLabel={t.common.cancel}
        loadingLabel={t.common.processing}
        variant="destructive"
        loading={isPending}
        onConfirm={handleBulkCancel}
      />
    </>
  );
}
