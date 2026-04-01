"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  stepOfLabel: string;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabels,
  stepOfLabel,
}: OnboardingProgressProps) {
  return (
    <div>
      <div className="mb-4 sm:hidden">
        <p className="text-sm font-medium text-muted-foreground">
          {stepOfLabel
            .replace("{current}", String(currentStep))
            .replace("{total}", String(totalSteps - 1))}
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

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
  );
}
