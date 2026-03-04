import { z } from "zod";

export const createSessionSchema = z.object({
  title: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  location: z.string().optional(),
  intervenantId: z.string().optional(),
  activityId: z.string().min(1, "L'ID de l'activité est requis"),
});

export const updateSessionSchema = createSessionSchema.partial();

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
