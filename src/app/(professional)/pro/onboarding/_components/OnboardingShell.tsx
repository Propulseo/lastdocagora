"use client";

import { useRef, useState, useTransition } from "react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { toast } from "sonner";
import { saveOnboardingStep } from "../_actions/onboarding-actions";
import type { StepHandle } from "./steps/Step1Profile";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingNav } from "./OnboardingNav";
import { OnboardingStepRenderer } from "./OnboardingStepRenderer";

interface OnboardingShellProps {
  userId: string;
  professionalId: string;
  initialStep: number;
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
}

const TOTAL_STEPS = 7;

export function OnboardingShell({
  userId,
  professionalId,
  initialStep,
  userProfile,
  professional,
  existingServices,
  existingAvailability,
}: OnboardingShellProps) {
  const { t } = useProfessionalI18n();
  const ob = t.onboarding;

  const [currentStep, setCurrentStep] = useState(
    Math.min(Math.max(initialStep, 1), TOTAL_STEPS),
  );
  const [isPending, startTransition] = useTransition();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stepData, setStepData] = useState<Record<string, any>>({});

  const stepRef = useRef<StepHandle>(null);

  const stepLabels = [
    ob.steps.profile,
    ob.steps.specialty,
    ob.steps.services,
    ob.steps.availability,
    ob.steps.address,
    ob.steps.verification,
    ob.steps.complete,
  ];

  function handleStepData(step: number, data: unknown) {
    setStepData((prev) => ({ ...prev, [`step${step}`]: data }));
  }

  function handleNext() {
    if (currentStep === 7) return;

    if (currentStep >= 6 && !stepRef.current) {
      advanceStep(currentStep);
      return;
    }

    if (stepRef.current) {
      const isValid = stepRef.current.submit();
      if (!isValid) return;
    }
  }

  function advanceStep(step: number) {
    const data = stepData[`step${step}`];

    if (step === 3 && data?.services?.length === 0) {
      setCurrentStep(step + 1);
      return;
    }
    if (step === 4 && data?.slots?.length === 0) {
      setCurrentStep(step + 1);
      return;
    }

    startTransition(async () => {
      const result = await saveOnboardingStep(step, data);
      if (result.success) {
        setCurrentStep(step + 1);
      } else {
        toast.error(ob.errors.saveError);
      }
    });
  }

  function handlePrevious() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  function navigateToStep(step: number) {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }

  function createSubmitHandler(step: number) {
    return (data: unknown) => {
      handleStepData(step, data);
      const mergedData = data;
      startTransition(async () => {
        if (
          step === 3 &&
          (mergedData as { services: unknown[] })?.services?.length === 0
        ) {
          setCurrentStep(step + 1);
          return;
        }
        if (
          step === 4 &&
          (mergedData as { slots: unknown[] })?.slots?.length === 0
        ) {
          setCurrentStep(step + 1);
          return;
        }

        const result = await saveOnboardingStep(step, mergedData);
        if (result.success) {
          setCurrentStep(step + 1);
        } else {
          toast.error(ob.errors.saveError);
        }
      });
    };
  }

  return (
    <div className="space-y-8">
      {currentStep < 7 && (
        <OnboardingProgress
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={stepLabels}
          stepOfLabel={ob.navigation.stepOf}
        />
      )}

      <div className="min-h-[400px]">
        <OnboardingStepRenderer
          currentStep={currentStep}
          stepRef={stepRef}
          userId={userId}
          userProfile={userProfile}
          professional={professional}
          existingServices={existingServices}
          existingAvailability={existingAvailability}
          stepData={stepData}
          onNavigateToStep={navigateToStep}
          createSubmitHandler={createSubmitHandler}
        />
      </div>

      {currentStep < 7 && (
        <OnboardingNav
          currentStep={currentStep}
          isPending={isPending}
          onPrevious={handlePrevious}
          onNext={handleNext}
          previousLabel={ob.navigation.previous}
          nextLabel={ob.navigation.next}
          savingLabel={ob.navigation.saving}
        />
      )}
    </div>
  );
}
