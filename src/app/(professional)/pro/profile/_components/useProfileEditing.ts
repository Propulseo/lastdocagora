"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProfile } from "@/app/(professional)/_actions/profile";
import { updateProfessionalInsurances } from "@/app/(professional)/_actions/insurance";
import type { UserProfile, Professional, SectionKey } from "./profile-types";

interface UseProfileEditingParams {
  userProfile: UserProfile;
  professional: Professional;
  professionalInsuranceIds: string[];
  translations: {
    saveSuccess: string;
    saveError: string;
    saveSuccessGeocoded: string;
    saveSuccessNoGeocode: string;
  };
}

export function useProfileEditing({ userProfile, professional, professionalInsuranceIds, translations: tt }: UseProfileEditingParams) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedInsuranceIds, setSelectedInsuranceIds] = useState<string[]>(professionalInsuranceIds);

  function startEditing(section: SectionKey) {
    const values: Record<string, string> = {};
    if (section === "personal") {
      values.first_name = userProfile.first_name ?? "";
      values.last_name = userProfile.last_name ?? "";
      values.phone = userProfile.phone ?? "";
    } else if (section === "professional") {
      values.specialty = professional.specialty ?? "";
      values.registration_number = professional.registration_number ?? "";
      values.practice_type = professional.practice_type ?? "";
      values.cabinet_name = professional.cabinet_name ?? "";
      values.years_experience = professional.years_experience?.toString() ?? "";
      values.subspecialties = professional.subspecialties?.join(", ") ?? "";
      values.bio = professional.bio ?? "";
      values.bio_pt = professional.bio_pt ?? "";
      values.bio_fr = professional.bio_fr ?? "";
      values.bio_en = professional.bio_en ?? "";
    } else if (section === "location") {
      values.address = professional.address ?? "";
      values.city = professional.city ?? "";
      values.postal_code = professional.postal_code ?? "";
    } else if (section === "languages") {
      values.languages_spoken = professional.languages_spoken?.join(", ") ?? "";
    } else if (section === "insurances") {
      setSelectedInsuranceIds(professionalInsuranceIds);
    }
    setFormValues(values);
    setEditingSection(section);
  }

  function cancelEditing() {
    setEditingSection(null);
    setFormValues({});
  }

  function updateField(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!editingSection) return;

    if (editingSection === "insurances") {
      startTransition(async () => {
        const result = await updateProfessionalInsurances(selectedInsuranceIds);
        if (result.success) {
          toast.success(tt.saveSuccess);
          setEditingSection(null);
          setFormValues({});
          router.refresh();
        } else {
          toast.error(tt.saveError);
        }
      });
      return;
    }

    let input: Parameters<typeof updateProfile>[0];
    if (editingSection === "personal") {
      input = { section: "personal", first_name: formValues.first_name ?? "", last_name: formValues.last_name ?? "", phone: formValues.phone ?? "" };
    } else if (editingSection === "professional") {
      input = { section: "professional", specialty: formValues.specialty ?? "", registration_number: formValues.registration_number ?? "", practice_type: formValues.practice_type ?? "", cabinet_name: formValues.cabinet_name ?? "", years_experience: formValues.years_experience ? Number(formValues.years_experience) : undefined, subspecialties: formValues.subspecialties ?? "", bio: formValues.bio ?? "", bio_pt: formValues.bio_pt ?? "", bio_fr: formValues.bio_fr ?? "", bio_en: formValues.bio_en ?? "" };
    } else if (editingSection === "location") {
      input = { section: "location", address: formValues.address ?? "", city: formValues.city ?? "", postal_code: formValues.postal_code ?? "" };
    } else {
      input = { section: "languages", languages_spoken: formValues.languages_spoken ?? "" };
    }

    startTransition(async () => {
      const result = await updateProfile(input);
      if (result.success) {
        if (editingSection === "location") {
          toast.success(result.geocoded ? tt.saveSuccessGeocoded : tt.saveSuccessNoGeocode);
        } else {
          toast.success(tt.saveSuccess);
        }
        setEditingSection(null);
        setFormValues({});
        router.refresh();
      } else {
        toast.error(tt.saveError);
      }
    });
  }

  return { editingSection, isPending, formValues, selectedInsuranceIds, setSelectedInsuranceIds, startEditing, cancelEditing, updateField, handleSave };
}
