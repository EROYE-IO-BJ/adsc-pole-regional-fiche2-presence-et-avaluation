import { z } from "zod";

const activityBaseSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  location: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).default("ACTIVE"),
  type: z.enum(["FORMATION", "SERVICE"]).default("FORMATION"),
  requiresRegistration: z.boolean().default(false),
  intervenantId: z.string().optional(),
  programId: z.string().optional(),
});

export const createActivitySchema = activityBaseSchema.refine(
  (data) => data.type !== "FORMATION" || (data.programId && data.programId.length > 0),
  { message: "Le programme est requis pour une formation", path: ["programId"] }
);

export const updateActivitySchema = activityBaseSchema.partial();

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
