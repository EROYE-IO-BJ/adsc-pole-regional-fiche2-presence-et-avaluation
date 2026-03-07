"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateSessions, type DaySchedule, type RecurrenceConfig } from "@/lib/recurrence";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type SessionFrequency = "UNIQUE" | "DAILY" | "WEEKLY" | "MONTHLY" | "CONFIGURABLE";

interface RecurrenceConfigProps {
  frequency: SessionFrequency;
  onFrequencyChange: (f: SessionFrequency) => void;
  daySchedule: DaySchedule;
  onDayScheduleChange: (ds: DaySchedule) => void;
  startDate: string;
  endDate: string;
}

const FREQUENCY_OPTIONS: { value: SessionFrequency; label: string }[] = [
  { value: "UNIQUE", label: "Unique" },
  { value: "DAILY", label: "Journalière" },
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "MONTHLY", label: "Mensuelle" },
  { value: "CONFIGURABLE", label: "Configurable" },
];

const WEEK_DAYS = [
  { key: "1", label: "Lun" },
  { key: "2", label: "Mar" },
  { key: "3", label: "Mer" },
  { key: "4", label: "Jeu" },
  { key: "5", label: "Ven" },
  { key: "6", label: "Sam" },
  { key: "0", label: "Dim" },
];

export function RecurrenceConfigComponent({
  frequency,
  onFrequencyChange,
  daySchedule,
  onDayScheduleChange,
  startDate,
  endDate,
}: RecurrenceConfigProps) {
  const showDayConfig = frequency === "DAILY" || frequency === "WEEKLY";
  const showMonthConfig = frequency === "MONTHLY";

  function toggleDay(key: string) {
    const next = { ...daySchedule };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = { startTime: "09:00", endTime: "17:00" };
    }
    onDayScheduleChange(next);
  }

  function updateTime(key: string, field: "startTime" | "endTime", value: string) {
    onDayScheduleChange({
      ...daySchedule,
      [key]: { ...daySchedule[key], [field]: value },
    });
  }

  // Live preview of generated sessions
  const preview = useMemo(() => {
    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(frequency)) return null;
    if (!startDate || !endDate) return null;
    if (Object.keys(daySchedule).length === 0) return null;

    const config: RecurrenceConfig = {
      mode: frequency as "DAILY" | "WEEKLY" | "MONTHLY",
      daySchedule,
    };

    try {
      return generateSessions(new Date(startDate), new Date(endDate), config);
    } catch {
      return null;
    }
  }, [frequency, startDate, endDate, daySchedule]);

  return (
    <div className="space-y-4">
      {/* Frequency selector */}
      <div className="space-y-2">
        <Label>Fréquence des séances</Label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCY_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={frequency === opt.value ? "default" : "outline"}
              onClick={() => onFrequencyChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* DAILY / WEEKLY — week day toggles */}
      {showDayConfig && (
        <div className="space-y-3">
          <Label>Jours de la semaine</Label>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((d) => (
              <Button
                key={d.key}
                type="button"
                size="sm"
                variant={daySchedule[d.key] ? "default" : "outline"}
                onClick={() => toggleDay(d.key)}
              >
                {d.label}
              </Button>
            ))}
          </div>
          {/* Time slots for selected days */}
          {WEEK_DAYS.filter((d) => daySchedule[d.key]).map((d) => (
            <div key={d.key} className="flex items-center gap-3">
              <span className="w-10 text-sm font-medium">{d.label}</span>
              <Input
                type="time"
                className="w-32"
                value={daySchedule[d.key]?.startTime ?? "09:00"}
                onChange={(e) => updateTime(d.key, "startTime", e.target.value)}
              />
              <span className="text-muted-foreground">→</span>
              <Input
                type="time"
                className="w-32"
                value={daySchedule[d.key]?.endTime ?? "17:00"}
                onChange={(e) => updateTime(d.key, "endTime", e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* MONTHLY — day-of-month grid */}
      {showMonthConfig && (
        <div className="space-y-3">
          <Label>Jours du mois</Label>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => {
              const key = String(i + 1);
              return (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={daySchedule[key] ? "default" : "outline"}
                  onClick={() => toggleDay(key)}
                  className="h-9 w-9 p-0"
                >
                  {i + 1}
                </Button>
              );
            })}
          </div>
          {/* Time slots for selected days */}
          {Array.from({ length: 31 }, (_, i) => String(i + 1))
            .filter((key) => daySchedule[key])
            .map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-10 text-sm font-medium">{key}</span>
                <Input
                  type="time"
                  className="w-32"
                  value={daySchedule[key]?.startTime ?? "09:00"}
                  onChange={(e) => updateTime(key, "startTime", e.target.value)}
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  type="time"
                  className="w-32"
                  value={daySchedule[key]?.endTime ?? "17:00"}
                  onChange={(e) => updateTime(key, "endTime", e.target.value)}
                />
              </div>
            ))}
        </div>
      )}

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="rounded-md border p-3 bg-muted/50 space-y-2">
          <p className="text-sm font-medium">
            {preview.length} séance{preview.length > 1 ? "s" : ""} seront créées
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {preview.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {s.title} — {format(s.date, "EEEE d MMMM yyyy", { locale: fr })} de {s.startTime} à {s.endTime}
              </p>
            ))}
          </div>
        </div>
      )}

      {["DAILY", "WEEKLY", "MONTHLY"].includes(frequency) &&
        Object.keys(daySchedule).length > 0 &&
        preview &&
        preview.length === 0 &&
        startDate &&
        endDate && (
          <p className="text-sm text-destructive">
            Aucune séance ne correspond à cette configuration sur la période sélectionnée.
          </p>
        )}
    </div>
  );
}
