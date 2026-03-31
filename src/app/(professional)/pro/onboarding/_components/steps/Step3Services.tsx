"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { StepHandle } from "./Step1Profile";

interface ServiceDraft {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

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

    const [drafts, setDrafts] = useState<ServiceDraft[]>(() => {
      if (existingServices.length > 0) return [];
      return [
        {
          id: genId(),
          name: "",
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
        { id: genId(), name: "", description: "", duration_minutes: 30, price: 0 },
      ]);
    }

    function removeDraft(id: string) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    }

    function updateDraft(id: string, field: keyof ServiceDraft, value: string | number) {
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
            <Card key={draft.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{ob.step3.serviceName} *</Label>
                    <Input
                      value={draft.name}
                      onChange={(e) => updateDraft(draft.id, "name", e.target.value)}
                      placeholder={ob.step3.serviceNamePlaceholder}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{ob.step3.serviceDescription}</Label>
                    <Input
                      value={draft.description}
                      onChange={(e) =>
                        updateDraft(draft.id, "description", e.target.value)
                      }
                      placeholder={ob.step3.serviceDescriptionPlaceholder}
                    />
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">{ob.step3.serviceDuration}</Label>
                    <Select
                      value={String(draft.duration_minutes)}
                      onValueChange={(v) =>
                        updateDraft(draft.id, "duration_minutes", Number(v))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(durations).map(([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">{ob.step3.servicePrice}</Label>
                    <Input
                      type="number"
                      value={draft.price || ""}
                      onChange={(e) =>
                        updateDraft(draft.id, "price", Number(e.target.value) || 0)
                      }
                      placeholder={ob.step3.servicePricePlaceholder}
                      min={0}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeDraft(draft.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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
