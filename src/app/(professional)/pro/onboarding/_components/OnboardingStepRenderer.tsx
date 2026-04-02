"use client";

import type { RefObject } from "react";
import { Step1Profile, type StepHandle } from "./steps/Step1Profile";
import { Step2Specialty } from "./steps/Step2Specialty";
import { Step3Services } from "./steps/Step3Services";
import { Step4Availability } from "./steps/Step4Availability";
import { Step5Address } from "./steps/Step5Address";
import { Step6Verification } from "./steps/Step6Verification";
import { Step7Complete } from "./steps/Step7Complete";

interface OnboardingStepRendererProps {
  currentStep: number;
  stepRef: RefObject<StepHandle | null>;
  userId: string;
  userProfile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  professional: {
    id: string;
    specialty: string | null;
    registration_number: string | null;
    practice_type: string | null;
    cabinet_name: string | null;
    years_experience: number | null;
    subspecialties: string[] | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    languages_spoken: string[] | null;
    bio: string | null;
    bio_pt: string | null;
    bio_fr: string | null;
    bio_en: string | null;
    consultation_fee: number | null;
    third_party_payment: boolean | null;
    insurances_accepted: string[] | null;
  };
  existingServices: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    consultation_type: string | null;
    is_active: boolean;
  }[];
  existingAvailability: {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_recurring: boolean;
  }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stepData: Record<string, any>;
  onNavigateToStep: (step: number) => void;
  createSubmitHandler: (step: number) => (data: unknown) => void;
}

export function OnboardingStepRenderer({
  currentStep,
  stepRef,
  userId,
  userProfile,
  professional,
  existingServices,
  existingAvailability,
  stepData,
  onNavigateToStep,
  createSubmitHandler,
}: OnboardingStepRendererProps) {
  switch (currentStep) {
    case 1:
      return (
        <Step1Profile
          ref={stepRef}
          userId={userId}
          initialData={{
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            avatar_url: userProfile.avatar_url,
            bio: professional.bio,
            bio_pt: professional.bio_pt,
            bio_fr: professional.bio_fr,
            bio_en: professional.bio_en,
            registration_number: professional.registration_number,
            languages_spoken: professional.languages_spoken,
          }}
          onSubmit={createSubmitHandler(1)}
        />
      );
    case 2:
      return (
        <Step2Specialty
          ref={stepRef}
          initialData={{
            specialty: professional.specialty,
            subspecialties: professional.subspecialties,
            years_experience: professional.years_experience,
            practice_type: professional.practice_type,
            consultation_fee: professional.consultation_fee,
            third_party_payment: professional.third_party_payment,
            insurances_accepted: professional.insurances_accepted,
          }}
          onSubmit={createSubmitHandler(2)}
        />
      );
    case 3:
      return (
        <Step3Services
          ref={stepRef}
          existingServices={existingServices}
          onSubmit={createSubmitHandler(3)}
        />
      );
    case 4:
      return (
        <Step4Availability
          ref={stepRef}
          existingAvailability={existingAvailability}
          onSubmit={createSubmitHandler(4)}
        />
      );
    case 5:
      return (
        <Step5Address
          ref={stepRef}
          initialData={{
            cabinet_name: professional.cabinet_name,
            address: professional.address,
            city: professional.city,
            postal_code: professional.postal_code,
          }}
          onSubmit={createSubmitHandler(5)}
        />
      );
    case 6:
      return (
        <Step6Verification
          ref={stepRef}
          userId={userId}
          stepData={stepData}
          userProfile={userProfile}
          professional={professional}
          existingServicesCount={existingServices.length}
          existingSlotsCount={existingAvailability.length}
          onNavigateToStep={onNavigateToStep}
          onSubmit={() => createSubmitHandler(6)({})}
        />
      );
    case 7:
      return <Step7Complete />;
    default:
      return null;
  }
}
