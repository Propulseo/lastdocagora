"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface OnboardingNavProps {
  currentStep: number;
  isPending: boolean;
  onPrevious: () => void;
  onNext: () => void;
  previousLabel: string;
  nextLabel: string;
  savingLabel: string;
}

export function OnboardingNav({
  currentStep,
  isPending,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  savingLabel,
}: OnboardingNavProps) {
  return (
    <div className="flex justify-between border-t pt-4">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1 || isPending}
      >
        {previousLabel}
      </Button>

      <Button onClick={onNext} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {savingLabel}
          </>
        ) : (
          nextLabel
        )}
      </Button>
    </div>
  );
}
