"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { createService } from "@/app/(professional)/_actions/services";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  duration_minutes: z.number().int().min(1).max(480),
  is_active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export function CreateServiceDialog() {
  const [open, setOpen] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const { t } = useProfessionalI18n();
  const sv = t.services;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_minutes: 30,
      is_active: true,
    },
  });

  const onSubmit = async (values: ServiceFormValues) => {
    const result = await createService({
      ...values,
      price: showPrice && price ? price : null,
    });
    if (result.success) {
      toast.success(sv.serviceCreated);
      form.reset();
      setShowPrice(false);
      setPrice(null);
      setOpen(false);
    } else {
      toast.error(sv.errorCreating);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          {sv.addService}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sv.addService}</DialogTitle>
          <DialogDescription>{sv.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{sv.name}</Label>
            <Input
              id="name"
              placeholder={sv.namePlaceholder}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{sv.descriptionField}</Label>
            <Textarea
              id="description"
              placeholder={sv.descriptionPlaceholder}
              rows={3}
              {...form.register("description")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">{sv.duration}</Label>
            <Input
              id="duration_minutes"
              type="number"
              min={1}
              max={480}
              placeholder={sv.durationPlaceholder}
              {...form.register("duration_minutes", { valueAsNumber: true })}
            />
            {form.formState.errors.duration_minutes && (
              <p className="text-sm text-destructive">
                {form.formState.errors.duration_minutes.message}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={showPrice}
                onCheckedChange={(checked) => {
                  setShowPrice(!!checked);
                  if (!checked) setPrice(null);
                }}
              />
              <span className="text-sm font-medium">{sv.showPrice}</span>
            </label>
            {showPrice && (
              <div className="space-y-2">
                <Label htmlFor="price">{sv.price}</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={sv.pricePlaceholder}
                  value={price ?? ""}
                  onChange={(e) =>
                    setPrice(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">{sv.status}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {form.watch("is_active") ? sv.active : sv.inactive}
              </span>
              <Switch
                id="is_active"
                checked={form.watch("is_active")}
                onCheckedChange={(checked) =>
                  form.setValue("is_active", checked)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? sv.creating : sv.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
