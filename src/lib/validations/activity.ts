import { z } from "zod";

export const createActivitySchema = z.object({
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

export const updateActivitySchema = createActivitySchema.partial();

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
