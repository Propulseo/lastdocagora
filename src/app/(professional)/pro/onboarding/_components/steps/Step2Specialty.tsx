"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { getSpecialtyOptions } from "@/locales/patient/specialties";
import type { StepHandle } from "./Step1Profile";

type InsuranceProvider = { id: string; name: string; slug: string };

interface Step2Props {
  initialData: {
    specialty: string | null;
    subspecialties: string[] | null;
    years_experience: number | null;
    practice_type: string | null;
    consultation_fee: number | null;
    third_party_payment: boolean | null;
    insurances_accepted: string[] | null;
    insurance_provider_ids?: string[];
  };
  onSubmit: (data: {
    specialty: string;
    subspecialties: string;
    years_experience?: number;
    practice_type: string;
    consultation_types: string[];
    consultation_fee?: number;
    third_party_payment: boolean;
    insurance_provider_ids: string[];
  }) => void;
}

export const Step2Specialty = forwardRef<StepHandle, Step2Props>(
  function Step2Specialty({ initialData, onSubmit }, ref) {
    const { t, locale } = useProfessionalI18n();
    const ob = t.onboarding;

    const [specialty, setSpecialty] = useState(initialData.specialty ?? "");
    const [subspecialties, setSubspecialties] = useState(
      initialData.subspecialties?.join(", ") ?? "",
    );
    const [yearsExp, setYearsExp] = useState(initialData.years_experience?.toString() ?? "");
    const [practiceType, setPracticeType] = useState(initialData.practice_type ?? "");
    const [consultTypes, setConsultTypes] = useState<string[]>(["in-person"]);
    const [fee, setFee] = useState(initialData.consultation_fee?.toString() ?? "");
    const [thirdParty, setThirdParty] = useState(initialData.third_party_payment ?? false);
    const [selectedInsuranceIds, setSelectedInsuranceIds] = useState<string[]>(
      initialData.insurance_provider_ids ?? [],
    );
    const [insuranceProviders, setInsuranceProviders] = useState<InsuranceProvider[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
      const supabase = createClient();
      supabase
        .from("insurance_providers")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("display_order")
        .then(({ data }) => {
          if (data) setInsuranceProviders(data);
        });
    }, []);

    function toggleInsurance(id: string) {
      setSelectedInsuranceIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    }

    function toggleConsultType(type: string) {
      setConsultTypes((prev) =>
        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
      );
    }

    useImperativeHandle(ref, () => ({
      submit() {
        const errs: Record<string, string> = {};
        if (!specialty) errs.specialty = ob.errors.specialtyRequired;
        setErrors(errs);
        if (Object.keys(errs).length > 0) return false;

        onSubmit({
          specialty,
          subspecialties,
          years_experience: yearsExp ? Number(yearsExp) : undefined,
          practice_type: practiceType,
          consultation_types: consultTypes,
          consultation_fee: fee ? Number(fee) : undefined,
          third_party_payment: thirdParty,
          insurance_provider_ids: selectedInsuranceIds,
        });
        return true;
      },
    }));

    const specialtyOptions = getSpecialtyOptions(locale);
    const practiceTypes = ob.step2.practiceTypes;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{ob.step2.title}</h2>
          <p className="text-sm text-muted-foreground">{ob.step2.subtitle}</p>
        </div>

        <div className="space-y-2">
          <Label>{ob.step2.specialty} *</Label>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder={ob.step2.specialtyPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {specialtyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.specialty && (
            <p className="text-xs text-destructive">{errors.specialty}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{ob.step2.subspecialties}</Label>
          <Input
            value={subspecialties}
            onChange={(e) => setSubspecialties(e.target.value)}
            placeholder={ob.step2.subspecialtiesPlaceholder}
          />
          <p className="text-xs text-muted-foreground">{ob.step2.subspecialtiesHint}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{ob.step2.yearsExperience}</Label>
            <Input
              type="number"
              value={yearsExp}
              onChange={(e) => setYearsExp(e.target.value)}
              placeholder={ob.step2.yearsExperiencePlaceholder}
              min={0}
              max={80}
            />
          </div>
          <div className="space-y-2">
            <Label>{ob.step2.practiceType}</Label>
            <Select value={practiceType} onValueChange={setPracticeType}>
              <SelectTrigger>
                <SelectValue placeholder={ob.step2.practiceTypePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(practiceTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>{ob.step2.consultationTypes}</Label>
          <div className="flex flex-wrap gap-4">
            {[
              { key: "in-person", label: ob.step2.inPerson },
              { key: "teleconsultation", label: ob.step2.teleconsultation },
              { key: "home-visit", label: ob.step2.homeVisit },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={consultTypes.includes(key)}
                  onCheckedChange={() => toggleConsultType(key)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{ob.step2.consultationFee}</Label>
            <Input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder={ob.step2.consultationFeePlaceholder}
              min={0}
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={thirdParty} onCheckedChange={setThirdParty} />
            <Label className="cursor-pointer">{ob.step2.thirdPartyPayment}</Label>
          </div>
        </div>

        <div className="space-y-3">
          <Label>{ob.step2.insurancesMultiSelect ?? ob.step2.insurances}</Label>
          <div className="flex flex-wrap gap-2">
            {insuranceProviders.map((provider) => {
              const selected = selectedInsuranceIds.includes(provider.id);
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => toggleInsurance(provider.id)}
                  className="min-h-[44px]"
                >
                  <Badge
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
                  >
                    {provider.name}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);
