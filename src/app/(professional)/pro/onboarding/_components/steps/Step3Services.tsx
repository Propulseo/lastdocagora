"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { ServiceFormFields, type ServiceDraft } from "./ServiceFormFields";
import type { StepHandle } from "./Step1Profile";

interface ExistingService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  consultation_type: string | null;
  is_active: boolean;
}

interface Step3Props {
  existingServices: ExistingService[];
  onSubmit: (data: {
    services: {
      name: string;
      name_fr?: string;
      name_en?: string;
      description: string;
      duration_minutes: number;
      price: number;
    }[];
  }) => void;
}

let nextId = 0;
function genId() {
  return `new-${++nextId}`;
}

export const Step3Services = forwardRef<StepHandle, Step3Props>(
  function Step3Services({ existingServices, onSubmit }, ref) {
    const { t } = useProfessionalI18n();
    const ob = t.onboarding;

    const sv = t.services;

    const [drafts, setDrafts] = useState<ServiceDraft[]>(() => {
      if (existingServices.length > 0) return [];
      return [
        {
          id: genId(),
          name: "",
          name_fr: "",
          name_en: "",
          description: "",
          duration_minutes: 30,
          price: 0,
        },
      ];
    });
    const [error, setError] = useState("");

    function addDraft() {
      setDrafts((prev) => [
        ...prev,
        { id: genId(), name: "", name_fr: "", name_en: "", description: "", duration_minutes: 30, price: 0 },
      ]);
    }

    function removeDraft(id: string) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    }

    function updateDraft(id: string, field: keyof Omit<ServiceDraft, "id">, value: string | number) {
      setDrafts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
      );
    }

    const durations = ob.step3.durations;

    useImperativeHandle(ref, () => ({
      submit() {
        const validDrafts = drafts.filter((d) => d.name.trim());
        const total = existingServices.length + validDrafts.length;
        if (total === 0) {
          setError(ob.step3.minOneService);
          return false;
        }
        setError("");

        if (validDrafts.length > 0) {
          onSubmit({
            services: validDrafts.map((d) => ({
              name: d.name.trim(),
              name_fr: d.name_fr.trim() || undefined,
              name_en: d.name_en.trim() || undefined,
              description: d.description.trim(),
              duration_minutes: d.duration_minutes,
              price: d.price,
            })),
          });
        } else {
          // No new services to add, just advance
          onSubmit({ services: [] });
        }
        return true;
      },
    }));

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{ob.step3.title}</h2>
          <p className="text-sm text-muted-foreground">{ob.step3.subtitle}</p>
        </div>

        {/* Existing services (readonly) */}
        {existingServices.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">{ob.step3.existingServices}</Label>
            {existingServices.map((svc) => (
              <Card key={svc.id} className="bg-muted/50">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {svc.duration_minutes} min — {svc.price > 0 ? `${svc.price}€` : "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* New services */}
        <div className="space-y-3">
          {drafts.length > 0 && (
            <Label className="text-sm font-medium">{ob.step3.newServices}</Label>
          )}
          {drafts.map((draft) => (
            <ServiceFormFields
              key={draft.id}
              draft={draft}
              onUpdate={updateDraft}
              onRemove={removeDraft}
              durations={durations}
              labels={{
                serviceName: ob.step3.serviceName,
                serviceNamePlaceholder: ob.step3.serviceNamePlaceholder,
                serviceDescription: ob.step3.serviceDescription,
                serviceDescriptionPlaceholder: ob.step3.serviceDescriptionPlaceholder,
                serviceDuration: ob.step3.serviceDuration,
                servicePrice: ob.step3.servicePrice,
                servicePricePlaceholder: ob.step3.servicePricePlaceholder,
                nameTabPt: sv.nameTabPt,
                nameTabFr: sv.nameTabFr,
                nameTabEn: sv.nameTabEn,
                nameOptional: sv.nameOptional,
              }}
            />
          ))}
        </div>

        <Button variant="outline" onClick={addDraft} className="gap-2">
          <Plus className="size-4" />
          {ob.step3.addService}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);
