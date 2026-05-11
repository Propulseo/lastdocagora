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
import { updateService } from "@/app/(professional)/_actions/services";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

const LOCALES = ["pt", "fr", "en"] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_LABEL_KEY: Record<Locale, "nameTabPt" | "nameTabFr" | "nameTabEn"> = {
  pt: "nameTabPt",
  fr: "nameTabFr",
  en: "nameTabEn",
};

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

function getSourceName(
  service: EditServiceDialogProps["service"],
  locale: Locale
): string {
  if (locale === "fr") return service.name_fr ?? service.name_pt ?? service.name;
  if (locale === "en") return service.name_en ?? service.name_pt ?? service.name;
  return service.name_pt ?? service.name;
}

function getSourceDescription(
  service: EditServiceDialogProps["service"],
  locale: Locale
): string {
  if (locale === "fr")
    return service.description_fr ?? service.description_pt ?? service.description ?? "";
  if (locale === "en")
    return service.description_en ?? service.description_pt ?? service.description ?? "";
  return service.description_pt ?? service.description ?? "";
}

function getLocaleNameValue(
  service: EditServiceDialogProps["service"],
  locale: Locale
): string {
  if (locale === "pt") return service.name_pt ?? "";
  if (locale === "fr") return service.name_fr ?? "";
  return service.name_en ?? "";
}

function getLocaleDescValue(
  service: EditServiceDialogProps["service"],
  locale: Locale
): string {
  if (locale === "pt") return service.description_pt ?? "";
  if (locale === "fr") return service.description_fr ?? "";
  return service.description_en ?? "";
}

export function EditServiceDialog({
  open,
  onOpenChange,
  service,
}: EditServiceDialogProps) {
  const { t, locale } = useProfessionalI18n();
  const sv = t.services;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrice, setShowPrice] = useState(service.price > 0);
  const [price, setPrice] = useState<number | null>(
    service.price > 0 ? service.price : null
  );
  const [showTranslations, setShowTranslations] = useState(false);

  const otherLocales = LOCALES.filter((l) => l !== locale);

  const [translationNames, setTranslationNames] = useState<Record<Locale, string>>(() => ({
    pt: getLocaleNameValue(service, "pt"),
    fr: getLocaleNameValue(service, "fr"),
    en: getLocaleNameValue(service, "en"),
  }));

  const [translationDescs, setTranslationDescs] = useState<Record<Locale, string>>(() => ({
    pt: getLocaleDescValue(service, "pt"),
    fr: getLocaleDescValue(service, "fr"),
    en: getLocaleDescValue(service, "en"),
  }));

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: getSourceName(service, locale),
      description: getSourceDescription(service, locale),
      duration_minutes: service.duration_minutes,
      is_active: service.is_active,
    },
  });

  const setTranslationName = (l: Locale, value: string) => {
    setTranslationNames((prev) => ({ ...prev, [l]: value }));
  };

  const setTranslationDesc = (l: Locale, value: string) => {
    setTranslationDescs((prev) => ({ ...prev, [l]: value }));
  };

  const buildLocaleNames = (sourceName: string) => {
    const names: { name_pt?: string | null; name_fr?: string | null; name_en?: string | null } = {};
    // Source locale gets the main field value
    if (locale === "pt") names.name_pt = sourceName;
    else names.name_pt = translationNames.pt || null;
    if (locale === "fr") names.name_fr = sourceName;
    else names.name_fr = translationNames.fr || null;
    if (locale === "en") names.name_en = sourceName;
    else names.name_en = translationNames.en || null;
    return names;
  };

  const buildLocaleDescs = (sourceDesc: string | undefined) => {
    const descs: { description_pt?: string | null; description_fr?: string | null; description_en?: string | null } = {};
    if (locale === "pt") descs.description_pt = sourceDesc || null;
    else descs.description_pt = translationDescs.pt || null;
    if (locale === "fr") descs.description_fr = sourceDesc || null;
    else descs.description_fr = translationDescs.fr || null;
    if (locale === "en") descs.description_en = sourceDesc || null;
    else descs.description_en = translationDescs.en || null;
    return descs;
  };

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true);

    const result = await updateService(service.id, {
      ...values,
      ...buildLocaleNames(values.name),
      ...buildLocaleDescs(values.description),
      price: showPrice && price ? price : null,
      sourceLocale: locale,
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
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="edit_name">{sv.name}</Label>
            <Input
              id="edit_name"
              placeholder={sv.namePlaceholder}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{sv.autoTranslated}</p>
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="edit_description">{sv.descriptionField}</Label>
            <Textarea
              id="edit_description"
              placeholder={sv.descriptionPlaceholder}
              rows={3}
              {...form.register("description")}
            />
          </div>

          {/* Translation toggle */}
          <button
            type="button"
            className="text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => setShowTranslations((prev) => !prev)}
          >
            {showTranslations ? sv.hideTranslations : sv.editTranslations}
          </button>

          {/* Translation override fields */}
          {showTranslations && (
            <div className="space-y-3 rounded-md border p-3">
              {otherLocales.map((l) => (
                <div key={l} className="space-y-2">
                  <Label htmlFor={`edit_name_${l}`}>
                    {sv[LOCALE_LABEL_KEY[l]]}
                  </Label>
                  <Input
                    id={`edit_name_${l}`}
                    placeholder={sv.namePlaceholder}
                    value={translationNames[l]}
                    onChange={(e) => setTranslationName(l, e.target.value)}
                  />
                  <Textarea
                    id={`edit_desc_${l}`}
                    placeholder={sv.descriptionPlaceholder}
                    rows={2}
                    value={translationDescs[l]}
                    onChange={(e) => setTranslationDesc(l, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

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
