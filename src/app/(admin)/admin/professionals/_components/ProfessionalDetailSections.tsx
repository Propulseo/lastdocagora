import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil } from "lucide-react";

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

interface AvailabilityListProps {
  slots: AvailabilitySlot[];
  loading: boolean;
  isPending: boolean;
  onDeleteSlot: (slotId: string) => void;
  onClearAll: () => void;
  t: { processing: string; noAvailability: string; clearAllAvailability: string };
}

export function AvailabilityList({
  slots,
  loading,
  isPending,
  onDeleteSlot,
  onClearAll,
  t,
}: AvailabilityListProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">{t.processing}</p>;
  }
  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.noAvailability}</p>;
  }
  return (
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
              onClick={() => onDeleteSlot(slot.id)}
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
        onClick={onClearAll}
        disabled={isPending}
      >
        {t.clearAllAvailability}
      </Button>
    </>
  );
}

interface ServicesListProps {
  services: ServiceItem[];
  loading: boolean;
  isPending: boolean;
  editingService: string | null;
  editValues: { duration: string; price: string };
  onEditValuesChange: (values: { duration: string; price: string }) => void;
  onStartEdit: (svc: ServiceItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  t: { processing: string; noServices: string; save: string; cancel: string };
}

export function ServicesList({
  services,
  loading,
  isPending,
  editingService,
  editValues,
  onEditValuesChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  t,
}: ServicesListProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">{t.processing}</p>;
  }
  if (services.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.noServices}</p>;
  }
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {services.map((svc) => (
        <div key={svc.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
          {editingService === svc.id ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                value={editValues.duration}
                onChange={(e) => onEditValuesChange({ ...editValues, duration: e.target.value })}
                className="h-8 w-20"
                min={5}
              />
              <span className="text-xs text-muted-foreground">min</span>
              <Input
                type="number"
                value={editValues.price}
                onChange={(e) => onEditValuesChange({ ...editValues, price: e.target.value })}
                className="h-8 w-20"
                min={0}
                step={0.01}
              />
              <span className="text-xs text-muted-foreground">&euro;</span>
              <Button size="sm" className="h-8" onClick={onSaveEdit} disabled={isPending}>
                {t.save}
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={onCancelEdit}>
                {t.cancel}
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
                onClick={() => onStartEdit(svc)}
              >
                <Pencil className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export type { AvailabilitySlot, ServiceItem };
