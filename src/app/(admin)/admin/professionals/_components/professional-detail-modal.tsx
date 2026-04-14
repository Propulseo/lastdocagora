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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  deleteAvailabilityAdmin,
  clearAvailabilityAdmin,
  updateServiceAdmin,
} from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
}

interface ServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

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
        toast.error(result.error ?? t.common.errorUpdating);
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
        toast.error(result.error ?? t.common.errorUpdating);
      }
      setClearConfirm(false);
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
        toast.error(result.error ?? t.common.errorUpdating);
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
            </TabsList>

            <TabsContent value="availability" className="space-y-3 mt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">{t.common.processing}</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.professionals.noAvailability}</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                        <div className="text-sm">
                          <span className="font-medium">{DAY_NAMES[slot.day_of_week]}</span>
                          {" "}
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          {slot.is_recurring && (
                            <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                              recorrente
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full min-h-[44px]"
                    onClick={() => setClearConfirm(true)}
                    disabled={isPending}
                  >
                    {t.professionals.clearAllAvailability}
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="services" className="space-y-3 mt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">{t.common.processing}</p>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.professionals.noServices}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {services.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                      {editingService === svc.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="number"
                            value={editValues.duration}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, duration: e.target.value }))}
                            className="h-8 w-20"
                            min={5}
                          />
                          <span className="text-xs text-muted-foreground">min</span>
                          <Input
                            type="number"
                            value={editValues.price}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, price: e.target.value }))}
                            className="h-8 w-20"
                            min={0}
                            step={0.01}
                          />
                          <span className="text-xs text-muted-foreground">&euro;</span>
                          <Button size="sm" className="h-8" onClick={handleSaveService} disabled={isPending}>
                            {t.common.save}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingService(null)}>
                            {t.common.cancel}
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm">
                            <span className="font-medium">{svc.name}</span>
                            <span className="ml-2 text-muted-foreground">
                              {svc.duration_minutes} min &middot; {svc.price}&euro;
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => startEditService(svc)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
    </>
  );
}
