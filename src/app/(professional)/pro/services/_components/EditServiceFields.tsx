"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UseFormReturn } from "react-hook-form";

interface ServiceFormValues {
  name: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
}

interface EditServiceFieldsProps {
  form: UseFormReturn<ServiceFormValues>;
  nameFr: string;
  nameEn: string;
  descFr: string;
  descEn: string;
  onNameFrChange: (value: string) => void;
  onNameEnChange: (value: string) => void;
  onDescFrChange: (value: string) => void;
  onDescEnChange: (value: string) => void;
  labels: {
    name: string;
    nameTabPt: string;
    nameTabFr: string;
    nameTabEn: string;
    nameOptional: string;
    namePlaceholder: string;
    descriptionField: string;
    descTabPt: string;
    descTabFr: string;
    descTabEn: string;
    descriptionPlaceholder: string;
  };
}

export function EditServiceFields({
  form,
  nameFr,
  nameEn,
  descFr,
  descEn,
  onNameFrChange,
  onNameEnChange,
  onDescFrChange,
  onDescEnChange,
  labels,
}: EditServiceFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>{labels.name}</Label>
        <Tabs defaultValue="pt" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="pt" className="flex-1">{labels.nameTabPt}</TabsTrigger>
            <TabsTrigger value="fr" className="flex-1">{labels.nameTabFr} <span className="ml-1 text-xs text-muted-foreground">{labels.nameOptional}</span></TabsTrigger>
            <TabsTrigger value="en" className="flex-1">{labels.nameTabEn} <span className="ml-1 text-xs text-muted-foreground">{labels.nameOptional}</span></TabsTrigger>
          </TabsList>
          <TabsContent value="pt">
            <Input
              id="edit_name"
              placeholder={labels.namePlaceholder}
              {...form.register("name")}
            />
          </TabsContent>
          <TabsContent value="fr">
            <Input
              id="edit_name_fr"
              placeholder={labels.namePlaceholder}
              value={nameFr}
              onChange={(e) => onNameFrChange(e.target.value)}
            />
          </TabsContent>
          <TabsContent value="en">
            <Input
              id="edit_name_en"
              placeholder={labels.namePlaceholder}
              value={nameEn}
              onChange={(e) => onNameEnChange(e.target.value)}
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
        <Label>{labels.descriptionField}</Label>
        <Tabs defaultValue="pt" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="pt" className="flex-1">{labels.descTabPt}</TabsTrigger>
            <TabsTrigger value="fr" className="flex-1">{labels.descTabFr} <span className="ml-1 text-xs text-muted-foreground">{labels.nameOptional}</span></TabsTrigger>
            <TabsTrigger value="en" className="flex-1">{labels.descTabEn} <span className="ml-1 text-xs text-muted-foreground">{labels.nameOptional}</span></TabsTrigger>
          </TabsList>
          <TabsContent value="pt">
            <Textarea
              id="edit_description"
              placeholder={labels.descriptionPlaceholder}
              rows={3}
              {...form.register("description")}
            />
          </TabsContent>
          <TabsContent value="fr">
            <Textarea
              id="edit_description_fr"
              placeholder={labels.descriptionPlaceholder}
              rows={3}
              value={descFr}
              onChange={(e) => onDescFrChange(e.target.value)}
            />
          </TabsContent>
          <TabsContent value="en">
            <Textarea
              id="edit_description_en"
              placeholder={labels.descriptionPlaceholder}
              rows={3}
              value={descEn}
              onChange={(e) => onDescEnChange(e.target.value)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
