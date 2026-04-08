"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateService } from "@/app/(professional)/_actions/services";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  duration_minutes: z.number().int().min(1).max(480),
  is_active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    name: string;
    name_pt?: string | null;
    name_fr?: string | null;
    name_en?: string | null;
    description: string | null;
    description_pt?: string | null;
    description_fr?: string | null;
    description_en?: string | null;
    duration_minutes: number;
    is_active: boolean;
    price: number;
  };
}

export function EditServiceDialog({
  open,
  onOpenChange,
  service,
}: EditServiceDialogProps) {
  const { t } = useProfessionalI18n();
  const sv = t.services;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrice, setShowPrice] = useState(service.price > 0);
  const [price, setPrice] = useState<number | null>(
    service.price > 0 ? service.price : null
  );
  const [nameFr, setNameFr] = useState(service.name_fr ?? "");
  const [nameEn, setNameEn] = useState(service.name_en ?? "");
  const [descFr, setDescFr] = useState(service.description_fr ?? "");
  const [descEn, setDescEn] = useState(service.description_en ?? "");

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service.name_pt ?? service.name,
      description: service.description_pt ?? service.description ?? "",
      duration_minutes: service.duration_minutes,
      is_active: service.is_active,
    },
  });

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true);
    const result = await updateService(service.id, {
      ...values,
      name_pt: values.name,
      name_fr: nameFr || null,
      name_en: nameEn || null,
      description_pt: values.description || null,
      description_fr: descFr || null,
      description_en: descEn || null,
      price: showPrice && price ? price : null,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success(sv.serviceUpdated);
      onOpenChange(false);
    } else {
      toast.error(sv.errorUpdating);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={RADIUS.card}>
        <DialogHeader>
          <DialogTitle>{sv.editService}</DialogTitle>
          <DialogDescription>{sv.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{sv.name}</Label>
            <Tabs defaultValue="pt" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="pt" className="flex-1">{sv.nameTabPt}</TabsTrigger>
                <TabsTrigger value="fr" className="flex-1">{sv.nameTabFr} <span className="ml-1 text-xs text-muted-foreground">{sv.nameOptional}</span></TabsTrigger>
                <TabsTrigger value="en" className="flex-1">{sv.nameTabEn} <span className="ml-1 text-xs text-muted-foreground">{sv.nameOptional}</span></TabsTrigger>
              </TabsList>
              <TabsContent value="pt">
                <Input
                  id="edit_name"
                  placeholder={sv.namePlaceholder}
                  {...form.register("name")}
                />
              </TabsContent>
              <TabsContent value="fr">
                <Input
                  id="edit_name_fr"
                  placeholder={sv.namePlaceholder}
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="en">
                <Input
                  id="edit_name_en"
                  placeholder={sv.namePlaceholder}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                />
              </TabsContent>
            </Tabs>
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{sv.descriptionField}</Label>
            <Tabs defaultValue="pt" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="pt" className="flex-1">{(sv as unknown as Record<string, string>).descTabPt ?? "PT"}</TabsTrigger>
                <TabsTrigger value="fr" className="flex-1">{(sv as unknown as Record<string, string>).descTabFr ?? "FR"} <span className="ml-1 text-xs text-muted-foreground">{sv.nameOptional}</span></TabsTrigger>
                <TabsTrigger value="en" className="flex-1">{(sv as unknown as Record<string, string>).descTabEn ?? "EN"} <span className="ml-1 text-xs text-muted-foreground">{sv.nameOptional}</span></TabsTrigger>
              </TabsList>
              <TabsContent value="pt">
                <Textarea
                  id="edit_description"
                  placeholder={sv.descriptionPlaceholder}
                  rows={3}
                  {...form.register("description")}
                />
              </TabsContent>
              <TabsContent value="fr">
                <Textarea
                  id="edit_description_fr"
                  placeholder={sv.descriptionPlaceholder}
                  rows={3}
                  value={descFr}
                  onChange={(e) => setDescFr(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="en">
                <Textarea
                  id="edit_description_en"
                  placeholder={sv.descriptionPlaceholder}
                  rows={3}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                />
              </TabsContent>
            </Tabs>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_duration">{sv.duration}</Label>
            <Input
              id="edit_duration"
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
                <Label htmlFor="edit_price">{sv.price}</Label>
                <Input
                  id="edit_price"
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
            <Label htmlFor="edit_is_active">{sv.status}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {form.watch("is_active") ? sv.active : sv.inactive}
              </span>
              <Switch
                id="edit_is_active"
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
              onClick={() => onOpenChange(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? sv.updating : sv.update}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
