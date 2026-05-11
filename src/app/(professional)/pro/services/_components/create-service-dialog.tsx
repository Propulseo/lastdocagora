"use client";

import { useState, useMemo } from "react";
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
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import type { SupportedLocale } from "@/lib/i18n/types";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  pt: "Português",
  fr: "Français",
  en: "English",
};

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
  const [showTranslations, setShowTranslations] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [nameFr, setNameFr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [namePt, setNamePt] = useState("");
  const [descFr, setDescFr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descPt, setDescPt] = useState("");
  const { t, locale } = useProfessionalI18n();
  const sv = t.services;

  const otherLocales = useMemo(
    () =>
      (["pt", "fr", "en"] as const).filter((l) => l !== locale),
    [locale]
  );

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_minutes: 30,
      is_active: true,
    },
  });

  const getManualName = (l: SupportedLocale): string => {
    if (l === "pt") return namePt;
    if (l === "fr") return nameFr;
    return nameEn;
  };

  const getManualDesc = (l: SupportedLocale): string => {
    if (l === "pt") return descPt;
    if (l === "fr") return descFr;
    return descEn;
  };

  const setManualName = (l: SupportedLocale, v: string) => {
    if (l === "pt") setNamePt(v);
    else if (l === "fr") setNameFr(v);
    else setNameEn(v);
  };

  const setManualDesc = (l: SupportedLocale, v: string) => {
    if (l === "pt") setDescPt(v);
    else if (l === "fr") setDescFr(v);
    else setDescEn(v);
  };

  const onSubmit = async (values: ServiceFormValues) => {
    const result = await createService({
      ...values,
      name_pt: locale === "pt" ? values.name : namePt || null,
      name_fr: locale === "fr" ? values.name : nameFr || null,
      name_en: locale === "en" ? values.name : nameEn || null,
      description_pt: locale === "pt" ? values.description || null : descPt || null,
      description_fr: locale === "fr" ? values.description || null : descFr || null,
      description_en: locale === "en" ? values.description || null : descEn || null,
      price: showPrice && price ? price : null,
      sourceLocale: locale,
    });
    if (result.success) {
      toast.success(sv.serviceCreated);
      form.reset();
      setNamePt("");
      setNameFr("");
      setNameEn("");
      setDescPt("");
      setDescFr("");
      setDescEn("");
      setShowPrice(false);
      setShowTranslations(false);
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
      <DialogContent className={RADIUS.card}>
        <DialogHeader>
          <DialogTitle>{sv.addService}</DialogTitle>
          <DialogDescription>{sv.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* --- Name (source locale) --- */}
          <div className="space-y-2">
            <Label>{sv.name}</Label>
            <Input
              id="name"
              placeholder={sv.namePlaceholder}
              {...form.register("name")}
            />
            <p className="text-xs text-muted-foreground">
              {sv.autoTranslated}
            </p>
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          {/* --- Description (source locale) --- */}
          <div className="space-y-2">
            <Label>{sv.descriptionField}</Label>
            <Textarea
              id="description"
              placeholder={sv.descriptionPlaceholder}
              rows={3}
              {...form.register("description")}
            />
          </div>
          {/* --- Toggle translations --- */}
          <button
            type="button"
            className="min-h-[44px] text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => setShowTranslations((prev) => !prev)}
          >
            {showTranslations ? sv.hideTranslations : sv.editTranslations}
          </button>
          {/* --- Manual translation override fields --- */}
          {showTranslations && (
            <div className="space-y-4 rounded-md border p-3">
              {otherLocales.map((l) => (
                <div key={`name-${l}`} className="space-y-2">
                  <Label>
                    {sv.name} — {LOCALE_LABELS[l]}{" "}
                    <span className="text-xs text-muted-foreground">
                      {sv.nameOptional}
                    </span>
                  </Label>
                  <Input
                    placeholder={sv.namePlaceholder}
                    value={getManualName(l)}
                    onChange={(e) => setManualName(l, e.target.value)}
                  />
                </div>
              ))}
              {otherLocales.map((l) => (
                <div key={`desc-${l}`} className="space-y-2">
                  <Label>
                    {sv.descriptionField} — {LOCALE_LABELS[l]}{" "}
                    <span className="text-xs text-muted-foreground">
                      {sv.nameOptional}
                    </span>
                  </Label>
                  <Textarea
                    placeholder={sv.descriptionPlaceholder}
                    rows={2}
                    value={getManualDesc(l)}
                    onChange={(e) => setManualDesc(l, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
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
