"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateSessions, presetConfig, type RecurrenceConfig } from "@/lib/recurrence";
import { format, getDay, getDate } from "date-fns";
import { fr } from "date-fns/locale";

type SessionFrequency = "UNIQUE" | "DAILY" | "WEEKLY" | "MONTHLY" | "CONFIGURABLE" | "CUSTOM";

interface RecurrenceConfigProps {
  frequency: SessionFrequency;
  onFrequencyChange: (f: SessionFrequency) => void;
  recurrenceConfig: RecurrenceConfig;
  onRecurrenceConfigChange: (config: RecurrenceConfig) => void;
  startTime: string;
  onStartTimeChange: (t: string) => void;
  endTime: string;
  onEndTimeChange: (t: string) => void;
  startDate: string;
  endDate: string;
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAY_LABELS_FULL: Record<number, string> = {
  0: "dimanche",
  1: "lundi",
  2: "mardi",
  3: "mercredi",
  4: "jeudi",
  5: "vendredi",
  6: "samedi",
};

// Ordered Mon→Sun for toggle buttons
const WEEK_DAYS_ORDERED = [1, 2, 3, 4, 5, 6, 0];

function getFrequencyOptions(startDate: string) {
  const options: { value: SessionFrequency; label: string }[] = [
    { value: "UNIQUE", label: "Ne se répète pas" },
    { value: "DAILY", label: "Tous les jours" },
  ];

  if (startDate) {
    const d = new Date(startDate);
    const dayName = DAY_LABELS_FULL[getDay(d)];
    const dayOfMonth = getDate(d);
    options.push({ value: "WEEKLY", label: `Toutes les semaines le ${dayName}` });
    options.push({ value: "MONTHLY", label: `Tous les mois le ${dayOfMonth}` });
  } else {
    options.push({ value: "WEEKLY", label: "Toutes les semaines" });
    options.push({ value: "MONTHLY", label: "Tous les mois" });
  }

  options.push({ value: "CONFIGURABLE", label: "Configurable (ajout libre)" });
  options.push({ value: "CUSTOM", label: "Personnalisé..." });

  return options;
}

const UNIT_OPTIONS = [
  { value: "day", label: "jour(s)" },
  { value: "week", label: "semaine(s)" },
  { value: "month", label: "mois" },
];

export function RecurrenceConfigComponent({
  frequency,
  onFrequencyChange,
  recurrenceConfig,
  onRecurrenceConfigChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  startDate,
  endDate,
}: RecurrenceConfigProps) {
  const frequencyOptions = useMemo(() => getFrequencyOptions(startDate), [startDate]);

  const isRecurrent = ["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(frequency);

  function updateConfig(partial: Partial<RecurrenceConfig>) {
    onRecurrenceConfigChange({ ...recurrenceConfig, ...partial });
  }

  function toggleDayOfWeek(day: number) {
    const current = recurrenceConfig.daysOfWeek ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    updateConfig({ daysOfWeek: next });
  }

  // Live preview
  const preview = useMemo(() => {
    if (!isRecurrent) return null;
    if (!startDate || !endDate) return null;
    if (!startTime || !endTime) return null;

    try {
      const config: RecurrenceConfig =
        frequency === "CUSTOM"
          ? recurrenceConfig
          : presetConfig(frequency as "DAILY" | "WEEKLY" | "MONTHLY", new Date(startDate));

      return generateSessions(new Date(startDate), new Date(endDate), config, startTime, endTime);
    } catch {
      return null;
    }
  }, [frequency, startDate, endDate, startTime, endTime, recurrenceConfig, isRecurrent]);

  return (
    <div className="space-y-4">
      {/* Frequency selector — Select dropdown */}
      <div className="space-y-2">
        <Label>Fréquence des séances</Label>
        <Select
          value={frequency}
          onValueChange={(v) => onFrequencyChange(v as SessionFrequency)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frequencyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time slot — shown for all recurrent frequencies */}
      {isRecurrent && (
        <div className="space-y-2">
          <Label>Créneau horaire</Label>
          <div className="flex items-center gap-3">
            <Input
              type="time"
              className="w-36"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
            />
            <span className="text-muted-foreground">→</span>
            <Input
              type="time"
              className="w-36"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Custom config — only for CUSTOM */}
      {frequency === "CUSTOM" && (
        <div className="rounded-md border p-4 space-y-4 bg-muted/30">
          {/* Interval + Unit */}
          <div className="space-y-2">
            <Label>Répétition</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm">Tous les</span>
              <Input
                type="number"
                min={1}
                max={99}
                className="w-20"
                value={recurrenceConfig.interval}
                onChange={(e) => updateConfig({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
              />
              <Select
                value={recurrenceConfig.unit}
                onValueChange={(v) => {
                  const unit = v as "day" | "week" | "month";
                  const updates: Partial<RecurrenceConfig> = { unit };
                  if (unit === "week" && (!recurrenceConfig.daysOfWeek || recurrenceConfig.daysOfWeek.length === 0)) {
                    updates.daysOfWeek = startDate ? [getDay(new Date(startDate))] : [1];
                  }
                  updateConfig(updates);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Days of week toggle — only for unit=week */}
          {recurrenceConfig.unit === "week" && (
            <div className="space-y-2">
              <Label>Jours</Label>
              <div className="flex flex-wrap gap-1">
                {WEEK_DAYS_ORDERED.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    size="sm"
                    variant={recurrenceConfig.daysOfWeek?.includes(day) ? "default" : "outline"}
                    onClick={() => toggleDayOfWeek(day)}
                    className="h-9 w-11 p-0"
                  >
                    {DAY_LABELS[day]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* End type */}
          <div className="space-y-2">
            <Label>Se termine</Label>
            <RadioGroup
              value={recurrenceConfig.endType}
              onValueChange={(v) => updateConfig({ endType: v as RecurrenceConfig["endType"] })}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="never" id="end-never" />
                <Label htmlFor="end-never" className="cursor-pointer font-normal">Jamais</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="on_date" id="end-date" />
                <Label htmlFor="end-date" className="cursor-pointer font-normal">Le</Label>
                <Input
                  type="date"
                  className="w-44"
                  value={recurrenceConfig.endDate ?? ""}
                  onChange={(e) => updateConfig({ endDate: e.target.value, endType: "on_date" })}
                  disabled={recurrenceConfig.endType !== "on_date"}
                />
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="after_count" id="end-count" />
                <Label htmlFor="end-count" className="cursor-pointer font-normal">Après</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  className="w-20"
                  value={recurrenceConfig.endCount ?? ""}
                  onChange={(e) =>
                    updateConfig({
                      endCount: Math.max(1, parseInt(e.target.value) || 1),
                      endType: "after_count",
                    })
                  }
                  disabled={recurrenceConfig.endType !== "after_count"}
                />
                <span className="text-sm">occurrences</span>
              </div>
            </RadioGroup>
          </div>
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

      {isRecurrent &&
        startTime &&
        endTime &&
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
