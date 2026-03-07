"use client";

import { Check } from "lucide-react";

interface WizardStepperProps {
  currentStep: number;
  steps: { label: string }[];
}

export function WizardStepper({ currentStep, steps }: WizardStepperProps) {
  return (
    <>
      {/* Mobile: text only */}
      <div className="sm:hidden text-sm text-muted-foreground font-medium">
        Étape {currentStep + 1}/{steps.length} — {steps[currentStep].label}
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-center gap-2">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 ${
                    isCompleted ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium border-2 transition-colors ${
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary text-primary"
                        : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
