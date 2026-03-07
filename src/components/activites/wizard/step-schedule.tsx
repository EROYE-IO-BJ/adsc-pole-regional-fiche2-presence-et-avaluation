"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { RecurrenceConfigComponent } from "@/components/activites/recurrence-config";
import { generateSessions, presetConfig, type RecurrenceConfig } from "@/lib/recurrence";
import type { WizardFormData } from "./activity-wizard";

type SessionFrequency = WizardFormData["sessionFrequency"];

interface StepScheduleProps {
  data: WizardFormData;
  onChange: (partial: Partial<WizardFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  errors: Record<string, string>;
}

export function StepSchedule({
  data,
  onChange,
  onNext,
  onPrev,
  errors,
}: StepScheduleProps) {
  const isRecurrent = ["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(data.sessionFrequency);

  // Quick session count preview
  const sessionCount = useMemo(() => {
    if (!isRecurrent) return data.sessionFrequency === "UNIQUE" ? 1 : 0;
    if (!data.startDate || !data.endDate) return 0;

    const hasDaySlots = data.usePerDaySlots && data.recurrenceConfig.dayTimeSlots &&
      Object.keys(data.recurrenceConfig.dayTimeSlots).length > 0;
    if (!hasDaySlots && (!data.startTime || !data.endTime)) return 0;

    try {
      const config: RecurrenceConfig =
        data.sessionFrequency === "CUSTOM"
          ? data.recurrenceConfig
          : { ...presetConfig(data.sessionFrequency as "DAILY" | "WEEKLY" | "MONTHLY", new Date(data.startDate)), dayTimeSlots: data.recurrenceConfig.dayTimeSlots };

      const sessions = generateSessions(
        new Date(data.startDate),
        new Date(data.endDate),
        config,
        data.startTime || "00:00",
        data.endTime || "23:59"
      );
      return sessions.length;
    } catch {
      return 0;
    }
  }, [data.sessionFrequency, data.startDate, data.endDate, data.startTime, data.endTime, data.recurrenceConfig, data.usePerDaySlots, isRecurrent]);

  return (
    <div className="space-y-4">
      <RecurrenceConfigComponent
        frequency={data.sessionFrequency}
        onFrequencyChange={(f) => onChange({ sessionFrequency: f as SessionFrequency })}
        recurrenceConfig={data.recurrenceConfig}
        onRecurrenceConfigChange={(config) => onChange({ recurrenceConfig: config })}
        startTime={data.startTime}
        onStartTimeChange={(t) => onChange({ startTime: t })}
        endTime={data.endTime}
        onEndTimeChange={(t) => onChange({ endTime: t })}
        startDate={data.startDate}
        endDate={data.endDate}
        usePerDaySlots={data.usePerDaySlots}
        onUsePerDaySlotsChange={(v) => onChange({ usePerDaySlots: v })}
      />

      {/* Quick count */}
      {sessionCount > 0 && (
        <p className="text-sm text-muted-foreground font-medium">
          {sessionCount} séance{sessionCount > 1 ? "s" : ""} seront créées
        </p>
      )}

      {errors.startTime && <p className="text-sm text-destructive">{errors.startTime}</p>}
      {errors.endTime && <p className="text-sm text-destructive">{errors.endTime}</p>}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onPrev} className="w-full sm:w-auto">
          &larr; Précédent
        </Button>
        <Button type="button" onClick={onNext} className="w-full sm:w-auto">
          Suivant &rarr;
        </Button>
      </div>
    </div>
  );
}
