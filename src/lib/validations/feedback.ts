import { z } from "zod";

export const createFeedbackSchema = z.object({
  overallRating: z.number().min(1).max(5),
  contentRating: z.number().min(1).max(5),
  organizationRating: z.number().min(1).max(5),
  comment: z.string().optional(),
  suggestions: z.string().optional(),
  wouldRecommend: z.boolean().default(true),
  participantName: z.string().optional(),
  participantEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  accessToken: z.string().min(1, "Token d'accès requis"),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
