import { z } from "zod";

export const createRegistrationSchema = z.object({
  activityId: z.string().min(1, "L'activité est requise"),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
