import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(["PARTICIPANT", "INTERVENANT", "RESPONSABLE_SERVICE", "ADMIN"]).default("PARTICIPANT"),
  serviceId: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  email: z.string().email("Email invalide").optional(),
  role: z.enum(["PARTICIPANT", "INTERVENANT", "RESPONSABLE_SERVICE", "ADMIN"]).optional(),
  serviceId: z.string().nullable().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
