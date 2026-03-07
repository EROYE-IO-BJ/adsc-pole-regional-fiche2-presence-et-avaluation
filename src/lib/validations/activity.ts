import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeSlotSchema = z.object({
  startTime: z.string().regex(timeRegex, "Format HH:mm requis"),
  endTime: z.string().regex(timeRegex, "Format HH:mm requis"),
});

const dayScheduleSchema = z
  .record(z.string(), timeSlotSchema)
  .refine((obj) => Object.keys(obj).length >= 1, {
    message: "Au moins 1 jour doit être sélectionné",
  })
  .refine(
    (obj) =>
      Object.values(obj).every((slot) => slot.endTime > slot.startTime),
    { message: "L'heure de fin doit être après l'heure de début pour chaque jour" }
  );

const weekDayScheduleSchema = dayScheduleSchema.refine(
  (obj) => Object.keys(obj).every((k) => Number(k) >= 0 && Number(k) <= 6),
  { message: "Les clés doivent être entre 0 et 6 (jours de la semaine)" }
);

const monthDayScheduleSchema = dayScheduleSchema.refine(
  (obj) => Object.keys(obj).every((k) => Number(k) >= 1 && Number(k) <= 31),
  { message: "Les clés doivent être entre 1 et 31 (jours du mois)" }
);

export const recurrenceConfigSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("DAILY"), daySchedule: weekDayScheduleSchema }),
  z.object({ mode: z.literal("WEEKLY"), daySchedule: weekDayScheduleSchema }),
  z.object({ mode: z.literal("MONTHLY"), daySchedule: monthDayScheduleSchema }),
]);

const sessionFrequencyEnum = z.enum([
  "UNIQUE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "CONFIGURABLE",
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
      if (["DAILY", "WEEKLY", "MONTHLY"].includes(data.sessionFrequency)) {
        return data.recurrenceConfig !== undefined;
      }
      return true;
    },
    { message: "La configuration de récurrence est requise pour cette fréquence", path: ["recurrenceConfig"] }
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
