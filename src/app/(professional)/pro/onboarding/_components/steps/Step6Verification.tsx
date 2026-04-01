"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  User,
  Stethoscope,
  Briefcase,
  Calendar,
  MapPin,
} from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { translateSpecialty } from "@/locales/patient/specialties";
import type { StepHandle } from "./Step1Profile";
import { SummaryCard } from "./SummaryCard";
import { DocumentUploadCard } from "./DocumentUploadCard";

interface Step6Props {
  userId: string;
  stepData: {
    step1?: {
      first_name: string;
      last_name: string;
      bio: string;
      registration_number: string;
      languages_spoken: string;
    };
    step2?: {
      specialty: string;
      subspecialties: string;
      years_experience?: number;
      practice_type: string;
    };
    step3?: { services: { name: string; duration_minutes: number; price: number }[] };
    step4?: { slots: { day_of_week: number; start_time: string; end_time: string }[] };
    step5?: { cabinet_name: string; address: string; city: string; postal_code: string };
  };
  userProfile: {
    first_name: string | null;
    last_name: string | null;
  };
  professional: {
    specialty: string | null;
    registration_number: string | null;
    cabinet_name: string | null;
    address: string | null;
    city: string | null;
  };
  existingServicesCount: number;
  existingSlotsCount: number;
  onNavigateToStep: (step: number) => void;
  onSubmit: () => void;
}

export const Step6Verification = forwardRef<StepHandle, Step6Props>(
  function Step6Verification(
    {
      userId,
      stepData,
      userProfile,
      professional,
      existingServicesCount,
      existingSlotsCount,
      onNavigateToStep,
      onSubmit,
    },
    ref,
  ) {
    const { t, locale } = useProfessionalI18n();
    const ob = t.onboarding;

    useImperativeHandle(ref, () => ({
      submit() {
        onSubmit();
        return true;
      },
    }));

    const name =
      stepData.step1
        ? `${stepData.step1.first_name} ${stepData.step1.last_name}`
        : `${userProfile.first_name ?? ""} ${userProfile.last_name ?? ""}`.trim();

    const specialty = stepData.step2?.specialty ?? professional.specialty;
    const regNumber =
      stepData.step1?.registration_number ?? professional.registration_number;

    const newServicesCount = stepData.step3?.services?.length ?? 0;
    const totalServices = existingServicesCount + newServicesCount;

    const newSlotsCount = stepData.step4?.slots?.length ?? 0;
    const totalSlots = existingSlotsCount + newSlotsCount;

    const addr = stepData.step5
      ? [stepData.step5.address, stepData.step5.city].filter(Boolean).join(", ")
      : [professional.address, professional.city].filter(Boolean).join(", ");

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{ob.step6.title}</h2>
          <p className="text-sm text-muted-foreground">{ob.step6.subtitle}</p>
        </div>

        <div className="space-y-3">
          <SummaryCard
            icon={User}
            title={ob.step6.summary.profile}
            value={name || ob.step6.notDefined}
            sub={regNumber ?? undefined}
            onEdit={() => onNavigateToStep(1)}
            editLabel={ob.step6.summary.edit}
          />
          <SummaryCard
            icon={Stethoscope}
            title={ob.step6.summary.specialty}
            value={translateSpecialty(specialty, locale) ?? ob.step6.notDefined}
            onEdit={() => onNavigateToStep(2)}
            editLabel={ob.step6.summary.edit}
          />
          <SummaryCard
            icon={Briefcase}
            title={ob.step6.summary.services}
            value={ob.step6.servicesCount.replace("{count}", String(totalServices))}
            onEdit={() => onNavigateToStep(3)}
            editLabel={ob.step6.summary.edit}
          />
          <SummaryCard
            icon={Calendar}
            title={ob.step6.summary.availability}
            value={ob.step6.slotsCount.replace("{count}", String(totalSlots))}
            onEdit={() => onNavigateToStep(4)}
            editLabel={ob.step6.summary.edit}
          />
          <SummaryCard
            icon={MapPin}
            title={ob.step6.summary.address}
            value={addr || ob.step6.notDefined}
            onEdit={() => onNavigateToStep(5)}
            editLabel={ob.step6.summary.edit}
          />
        </div>

        <DocumentUploadCard
          userId={userId}
          labels={{
            documents: ob.step6.documents,
            license: ob.step6.license,
            diploma: ob.step6.diploma,
            uploadHint: ob.step6.uploadHint,
            upload: ob.step6.upload,
            uploaded: ob.step6.uploaded,
            verificationNote: ob.step6.verificationNote,
            invalidFormat: ob.errors.invalidFormat,
            fileTooLarge: ob.errors.fileTooLarge,
            uploadError: ob.errors.uploadError,
          }}
        />
      </div>
    );
  },
);
