import { z } from "zod";

const formationFeedbackSchema = z.object({
  feedbackType: z.literal("FORMATION").optional().default("FORMATION"),
  overallRating: z.number().min(1).max(5),
  contentRating: z.number().min(1).max(5),
  organizationRating: z.number().min(1).max(5),
  comment: z.string().optional(),
  suggestions: z.string().optional(),
  wouldRecommend: z.boolean().default(true),
  participantName: z.string().optional(),
  participantEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  accessToken: z.string().min(1, "Token d'accès requis"),
  // Not used in FORMATION but allow for union
  satisfactionRating: z.number().min(1).max(5).optional(),
  informationClarity: z.boolean().optional(),
  improvementSuggestion: z.string().optional(),
});

const serviceFeedbackSchema = z.object({
  feedbackType: z.literal("SERVICE"),
  satisfactionRating: z.number().min(1).max(5),
  informationClarity: z.boolean(),
  improvementSuggestion: z.string().optional(),
  participantName: z.string().optional(),
  participantEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  accessToken: z.string().min(1, "Token d'accès requis"),
  // Not used in SERVICE but allow for union
  overallRating: z.number().min(1).max(5).optional(),
  contentRating: z.number().min(1).max(5).optional(),
  organizationRating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  suggestions: z.string().optional(),
  wouldRecommend: z.boolean().optional(),
});

export const createFeedbackSchema = z.discriminatedUnion("feedbackType", [
  formationFeedbackSchema,
  serviceFeedbackSchema,
]);

// Backward-compatible schema that defaults to FORMATION
export const createFeedbackSchemaLegacy = formationFeedbackSchema;

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
