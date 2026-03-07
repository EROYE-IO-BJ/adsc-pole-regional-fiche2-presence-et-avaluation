import { z } from "zod";

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
});

export const createActivitySchema = activityBaseSchema
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: "La date de fin doit être après la date de début", path: ["endDate"] }
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
