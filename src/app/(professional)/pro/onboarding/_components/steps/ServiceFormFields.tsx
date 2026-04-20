"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2 } from "lucide-react";

interface ServiceDraft {
  id: string;
  name: string;
  name_fr: string;
  name_en: string;
  description: string;
  duration_minutes: number;
  price: number;
}

interface ServiceFormFieldsProps {
  draft: ServiceDraft;
  onUpdate: (id: string, field: keyof Omit<ServiceDraft, "id">, value: string | number) => void;
  onRemove: (id: string) => void;
  durations: Record<string, string>;
  labels: {
    serviceName: string;
    serviceNamePlaceholder: string;
    serviceDescription: string;
    serviceDescriptionPlaceholder: string;
    serviceDuration: string;
    servicePrice: string;
    servicePricePlaceholder: string;
    nameTabPt: string;
    nameTabFr: string;
    nameTabEn: string;
    nameOptional: string;
  };
}

export type { ServiceDraft };

export function ServiceFormFields({
  draft,
  onUpdate,
  onRemove,
  durations,
  labels,
}: ServiceFormFieldsProps) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="space-y-1">
          <Label className="text-xs">{labels.serviceName} *</Label>
          <Tabs defaultValue="pt" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="pt" className="flex-1">{labels.nameTabPt}</TabsTrigger>
              <TabsTrigger value="fr" className="flex-1">{labels.nameTabFr} <span className="ml-1 text-xs text-muted-foreground">{labels.nameOptional}</span></TabsTrigger>
              <TabsTrigger value="en" className="flex-1">{labels.nameTabEn} <span className="ml-1 text-xs text-muted-foreground">{labels.nameOptional}</span></TabsTrigger>
            </TabsList>
            <TabsContent value="pt">
              <Input
                value={draft.name}
                onChange={(e) => onUpdate(draft.id, "name", e.target.value)}
                placeholder={labels.serviceNamePlaceholder}
              />
            </TabsContent>
            <TabsContent value="fr">
              <Input
                value={draft.name_fr}
                onChange={(e) => onUpdate(draft.id, "name_fr", e.target.value)}
                placeholder={labels.serviceNamePlaceholder}
              />
            </TabsContent>
            <TabsContent value="en">
              <Input
                value={draft.name_en}
                onChange={(e) => onUpdate(draft.id, "name_en", e.target.value)}
                placeholder={labels.serviceNamePlaceholder}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">{labels.serviceDescription}</Label>
            <Input
              value={draft.description}
              onChange={(e) =>
                onUpdate(draft.id, "description", e.target.value)
              }
              placeholder={labels.serviceDescriptionPlaceholder}
            />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">{labels.serviceDuration}</Label>
            <Select
              value={String(draft.duration_minutes)}
              onValueChange={(v) =>
                onUpdate(draft.id, "duration_minutes", Number(v))
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
            <Label className="text-xs">{labels.servicePrice}</Label>
            <Input
              type="number"
              value={draft.price || ""}
              onChange={(e) =>
                onUpdate(draft.id, "price", Number(e.target.value) || 0)
              }
              placeholder={labels.servicePricePlaceholder}
              min={0}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive hover:text-destructive"
            onClick={() => onRemove(draft.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
