"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { StepHandle } from "./Step1Profile";

interface Step5Props {
  initialData: {
    cabinet_name: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
  };
  onSubmit: (data: {
    cabinet_name: string;
    address: string;
    city: string;
    postal_code: string;
  }) => void;
}

export const Step5Address = forwardRef<StepHandle, Step5Props>(
  function Step5Address({ initialData, onSubmit }, ref) {
    const { t } = useProfessionalI18n();
    const ob = t.onboarding;

    const [cabinetName, setCabinetName] = useState(initialData.cabinet_name ?? "");
    const [address, setAddress] = useState(initialData.address ?? "");
    const [city, setCity] = useState(initialData.city ?? "");
    const [postalCode, setPostalCode] = useState(initialData.postal_code ?? "");

    useImperativeHandle(ref, () => ({
      submit() {
        // This step is optional — always valid
        onSubmit({
          cabinet_name: cabinetName.trim(),
          address: address.trim(),
          city: city.trim(),
          postal_code: postalCode.trim(),
        });
        return true;
      },
    }));

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{ob.step5.title}</h2>
          <p className="text-sm text-muted-foreground">{ob.step5.subtitle}</p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {ob.step5.optional}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{ob.step5.cabinetName}</Label>
          <Input
            value={cabinetName}
            onChange={(e) => setCabinetName(e.target.value)}
            placeholder={ob.step5.cabinetNamePlaceholder}
          />
        </div>

        <div className="space-y-2">
          <Label>{ob.step5.address}</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={ob.step5.addressPlaceholder}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{ob.step5.city}</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={ob.step5.cityPlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label>{ob.step5.postalCode}</Label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder={ob.step5.postalCodePlaceholder}
            />
          </div>
        </div>
      </div>
    );
  },
);
