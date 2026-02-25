import { z } from "zod";

export const createAttendanceSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  organization: z.string().optional(),
  signature: z.string().optional(),
  accessToken: z.string().min(1, "Token d'accès requis"),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
