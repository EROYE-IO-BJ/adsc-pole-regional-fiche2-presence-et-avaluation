import { eachDayOfInterval, getDay, getDate } from "date-fns";

export type DaySchedule = Record<string, { startTime: string; endTime: string }>;

export type RecurrenceConfig = {
  mode: "DAILY" | "WEEKLY" | "MONTHLY";
  daySchedule: DaySchedule;
};

export type GeneratedSession = {
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
};

const MAX_SESSIONS = 365;

/**
 * Generate sessions based on recurrence configuration.
 * Pure function — usable client-side (preview) and server-side (creation).
 */
export function generateSessions(
  startDate: Date,
  endDate: Date,
  config: RecurrenceConfig
): GeneratedSession[] {
  if (endDate < startDate) return [];

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const sessions: GeneratedSession[] = [];

  for (const day of days) {
    if (sessions.length >= MAX_SESSIONS) break;

    let key: string;
    if (config.mode === "MONTHLY") {
      key = String(getDate(day));
    } else {
      // DAILY and WEEKLY both use day-of-week keys
      key = String(getDay(day));
    }

    const schedule = config.daySchedule[key];
    if (!schedule) continue;

    sessions.push({
      title: `Séance ${sessions.length + 1}`,
      date: day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
  }

  return sessions;
}
