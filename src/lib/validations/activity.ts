import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const recurrenceConfigSchema = z
  .object({
    interval: z.number().int().min(1).max(99),
    unit: z.enum(["day", "week", "month"]),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).optional(),
    endType: z.enum(["never", "on_date", "after_count"]),
    endDate: z.string().optional(),
    endCount: z.number().int().min(1).max(365).optional(),
  })
  .refine(
    (data) => {
      if (data.unit === "week") return data.daysOfWeek !== undefined && data.daysOfWeek.length > 0;
      return true;
    },
    { message: "Les jours de la semaine sont requis pour une récurrence hebdomadaire", path: ["daysOfWeek"] }
  )
  .refine(
    (data) => {
      if (data.endType === "on_date") return data.endDate !== undefined && data.endDate.length > 0;
      return true;
    },
    { message: "La date de fin est requise", path: ["endDate"] }
  )
  .refine(
    (data) => {
      if (data.endType === "after_count") return data.endCount !== undefined && data.endCount > 0;
      return true;
    },
    { message: "Le nombre d'occurrences est requis", path: ["endCount"] }
  );

const sessionFrequencyEnum = z.enum([
  "UNIQUE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "CONFIGURABLE",
  "CUSTOM",
]);

const activityBaseSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  location: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).default("ACTIVE"),
  type: z.enum(["FORMATION", "SERVICE"]).default("FORMATION"),
  requiresRegistration: z.boolean().default(false),
  intervenantId: z.string().optional(),
  programId: z.string().min(1, "Le programme est requis"),
  sessionFrequency: sessionFrequencyEnum.default("UNIQUE"),
  recurrenceConfig: recurrenceConfigSchema.optional(),
  startTime: z.string().regex(timeRegex, "Format HH:mm requis").optional(),
  endTime: z.string().regex(timeRegex, "Format HH:mm requis").optional(),
});

export const createActivitySchema = activityBaseSchema
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: "La date de fin doit être après la date de début", path: ["endDate"] }
  )
  .refine(
    (data) => {
      if (data.type === "SERVICE") {
        return data.sessionFrequency === "UNIQUE";
      }
      return true;
    },
    { message: "Les activités de type SERVICE doivent avoir une fréquence UNIQUE", path: ["sessionFrequency"] }
  )
  .refine(
    (data) => {
      if (["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(data.sessionFrequency)) {
        return data.recurrenceConfig !== undefined;
      }
      return true;
    },
    { message: "La configuration de récurrence est requise pour cette fréquence", path: ["recurrenceConfig"] }
  )
  .refine(
    (data) => {
      if (["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(data.sessionFrequency)) {
        return data.startTime !== undefined && data.startTime.length > 0;
      }
      return true;
    },
    { message: "L'heure de début est requise pour les séances récurrentes", path: ["startTime"] }
  )
  .refine(
    (data) => {
      if (["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(data.sessionFrequency)) {
        return data.endTime !== undefined && data.endTime.length > 0;
      }
      return true;
    },
    { message: "L'heure de fin est requise pour les séances récurrentes", path: ["endTime"] }
  )
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    { message: "L'heure de fin doit être après l'heure de début", path: ["endTime"] }
  );

export const updateActivitySchema = activityBaseSchema.partial().refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  { message: "La date de fin doit être après la date de début", path: ["endDate"] }
);

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
