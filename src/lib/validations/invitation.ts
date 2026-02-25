import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["INTERVENANT", "RESPONSABLE_SERVICE", "ADMIN"]),
  serviceId: z.string().optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token requis"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
