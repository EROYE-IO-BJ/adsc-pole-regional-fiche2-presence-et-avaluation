const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Format a date range for display.
 * Same day: "15 juin 2025"
 * Different days: "15 juin - 30 août 2025"
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);

  if (s.toDateString() === e.toDateString()) {
    return dateFormatter.format(s);
  }

  const sYear = s.getFullYear();
  const eYear = e.getFullYear();

  if (sYear === eYear) {
    const startShort = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
    }).format(s);
    return `${startShort} - ${dateFormatter.format(e)}`;
  }

  return `${dateFormatter.format(s)} - ${dateFormatter.format(e)}`;
}

/**
 * Format a session date with optional time range.
 * "15 juin 2025" or "15 juin 2025, 09:00 - 17:00"
 */
export function formatSessionDateTime(
  startDate: Date | string,
  startTime?: string | null,
  endTime?: string | null
): string {
  const dateStr = dateFormatter.format(new Date(startDate));

  if (startTime && endTime) {
    return `${dateStr}, ${startTime} - ${endTime}`;
  }
  if (startTime) {
    return `${dateStr}, ${startTime}`;
  }
  return dateStr;
}
