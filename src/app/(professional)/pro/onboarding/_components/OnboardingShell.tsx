"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { toast } from "sonner";
import { saveOnboardingStep } from "../_actions/onboarding-actions";
import { Step1Profile, type StepHandle } from "./steps/Step1Profile";
import { Step2Specialty } from "./steps/Step2Specialty";
import { Step3Services } from "./steps/Step3Services";
import { Step4Availability } from "./steps/Step4Availability";
import { Step5Address } from "./steps/Step5Address";
import { Step6Verification } from "./steps/Step6Verification";
import { Step7Complete } from "./steps/Step7Complete";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Step data callbacks
  // ---------------------------------------------------------------------------

  function handleStepData(step: number, data: unknown) {
    setStepData((prev) => ({ ...prev, [`step${step}`]: data }));
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function handleNext() {
    if (currentStep === 7) return;

    // For step 7 (complete) — no ref
    if (currentStep >= 6 && !stepRef.current) {
      advanceStep(currentStep);
      return;
    }

    if (stepRef.current) {
      const isValid = stepRef.current.submit();
      if (!isValid) return;
    }
    // submit() calls handleStepData, then we save to server
  }

  // Called after step data is collected via onSubmit callbacks
  function advanceStep(step: number) {
    const data = stepData[`step${step}`];

    // Steps that skip server save when no data
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

  // Effect: when stepData changes for current step, trigger advance
  // We handle this in onSubmit callbacks instead

  function createSubmitHandler(step: number) {
    return (data: unknown) => {
      handleStepData(step, data);
      // Trigger advance after state update
      const mergedData = data;
      startTransition(async () => {
        // Steps that skip server save when no data
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

  // ---------------------------------------------------------------------------
  // Render step
  // ---------------------------------------------------------------------------

  function renderStep() {
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
            onNavigateToStep={navigateToStep}
            onSubmit={() => createSubmitHandler(6)({})}
          />
        );
      case 7:
        return <Step7Complete />;
      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      {currentStep < 7 && (
        <div>
          {/* Mobile: text + thin bar */}
          <div className="mb-4 sm:hidden">
            <p className="text-sm font-medium text-muted-foreground">
              {ob.navigation.stepOf
                .replace("{current}", String(currentStep))
                .replace("{total}", String(TOTAL_STEPS - 1))}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(currentStep / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop: circles with labels */}
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            {stepLabels.slice(0, -1).map((label, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                        isCompleted &&
                          "border-green-500 bg-green-500 text-white",
                        isCurrent &&
                          "border-primary bg-primary text-primary-foreground",
                        !isCompleted &&
                          !isCurrent &&
                          "border-muted-foreground/30 text-muted-foreground",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="size-4" />
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] leading-tight",
                        isCurrent
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < stepLabels.length - 2 && (
                    <div
                      className={cn(
                        "mx-1 h-0.5 flex-1",
                        stepNum < currentStep ? "bg-green-500" : "bg-muted",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation buttons */}
      {currentStep < 7 && (
        <div className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isPending}
          >
            {ob.navigation.previous}
          </Button>

          <Button onClick={handleNext} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {ob.navigation.saving}
              </>
            ) : (
              ob.navigation.next
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
