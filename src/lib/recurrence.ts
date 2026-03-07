import { addDays, addWeeks, addMonths, getDay, setDay, startOfDay, startOfWeek, isBefore, isEqual } from "date-fns";

export type RecurrenceConfig = {
  interval: number;
  unit: "day" | "week" | "month";
  daysOfWeek?: number[];
  endType: "never" | "on_date" | "after_count";
  endDate?: string;
  endCount?: number;
  dayTimeSlots?: Record<number, { startTime: string; endTime: string }>;
};

export type GeneratedSession = {
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
};

const MAX_SESSIONS = 100;

/**
 * Generate sessions based on recurrence configuration (Google Calendar style).
 * Pure function — usable client-side (preview) and server-side (creation).
 */
export function generateSessions(
  startDate: Date,
  activityEndDate: Date,
  config: RecurrenceConfig,
  startTime: string,
  endTime: string
): GeneratedSession[] {
  // Normalize all dates to local midnight to avoid UTC vs local timezone mismatches
  // (new Date("2026-03-10") → UTC midnight, but date-fns functions use local time)
  startDate = startOfDay(startDate);
  activityEndDate = startOfDay(activityEndDate);

  if (activityEndDate < startDate) return [];

  // Determine the effective end date based on endType
  let effectiveEndDate = activityEndDate;
  if (config.endType === "on_date" && config.endDate) {
    const recurrenceEnd = startOfDay(new Date(config.endDate));
    if (recurrenceEnd < effectiveEndDate) {
      effectiveEndDate = recurrenceEnd;
    }
  }

  const maxCount = config.endType === "after_count" && config.endCount
    ? config.endCount
    : MAX_SESSIONS;

  const sessions: GeneratedSession[] = [];

  // Helper to resolve per-day time slots
  function getSlot(dayOfWeek: number): { st: string; et: string } {
    if (config.dayTimeSlots && config.dayTimeSlots[dayOfWeek]) {
      return { st: config.dayTimeSlots[dayOfWeek].startTime, et: config.dayTimeSlots[dayOfWeek].endTime };
    }
    return { st: startTime, et: endTime };
  }

  if (config.unit === "day") {
    let current = startDate;
    while (
      (isBefore(current, effectiveEndDate) || isEqual(current, effectiveEndDate)) &&
      sessions.length < maxCount &&
      sessions.length < MAX_SESSIONS
    ) {
      const { st, et } = getSlot(getDay(current));
      sessions.push({
        title: `Séance ${sessions.length + 1}`,
        date: new Date(current),
        startTime: st,
        endTime: et,
      });
      current = addDays(current, config.interval);
    }
  } else if (config.unit === "week") {
    const days = config.daysOfWeek ?? [getDay(startDate)];
    const sortedDays = [...days].sort((a, b) => a - b);

    // Start from the week of startDate
    let weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    let weekIndex = 0;

    while (sessions.length < maxCount && sessions.length < MAX_SESSIONS) {
      const currentWeekStart = addWeeks(weekStart, weekIndex * config.interval);

      for (const dayOfWeek of sortedDays) {
        if (sessions.length >= maxCount || sessions.length >= MAX_SESSIONS) break;

        const candidate = setDay(currentWeekStart, dayOfWeek, { weekStartsOn: 1 });

        // Skip dates before startDate
        if (isBefore(candidate, startDate)) continue;
        // Stop if past effective end date
        if (!isBefore(candidate, effectiveEndDate) && !isEqual(candidate, effectiveEndDate)) continue;

        const { st, et } = getSlot(dayOfWeek);
        sessions.push({
          title: `Séance ${sessions.length + 1}`,
          date: new Date(candidate),
          startTime: st,
          endTime: et,
        });
      }

      // Check if we've gone past the end date
      const nextWeekStart = addWeeks(currentWeekStart, config.interval);
      if (!isBefore(nextWeekStart, effectiveEndDate) && !isEqual(nextWeekStart, effectiveEndDate)) {
        // We may still have days in the current week that are past the end, so break
        break;
      }

      weekIndex++;
    }
  } else if (config.unit === "month") {
    let current = startDate;
    while (
      (isBefore(current, effectiveEndDate) || isEqual(current, effectiveEndDate)) &&
      sessions.length < maxCount &&
      sessions.length < MAX_SESSIONS
    ) {
      const { st, et } = getSlot(getDay(current));
      sessions.push({
        title: `Séance ${sessions.length + 1}`,
        date: new Date(current),
        startTime: st,
        endTime: et,
      });
      current = addMonths(current, config.interval);
    }
  }

  return sessions;
}

/**
 * Build a preset RecurrenceConfig from a frequency type.
 */
export function presetConfig(
  frequency: "DAILY" | "WEEKLY" | "MONTHLY",
  startDate: Date
): RecurrenceConfig {
  switch (frequency) {
    case "DAILY":
      return { interval: 1, unit: "day", endType: "never" };
    case "WEEKLY":
      return { interval: 1, unit: "week", daysOfWeek: [getDay(startDate)], endType: "never" };
    case "MONTHLY":
      return { interval: 1, unit: "month", endType: "never" };
  }
}
