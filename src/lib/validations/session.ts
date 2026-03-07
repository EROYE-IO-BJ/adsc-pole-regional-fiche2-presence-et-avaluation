import { z } from "zod";

export const createSessionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  intervenantId: z.string().optional(),
  activityId: z.string().min(1, "L'ID de l'activité est requis"),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  { message: "L'heure de fin doit être après l'heure de début", path: ["endTime"] }
);

export const updateSessionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  intervenantId: z.string().optional(),
  activityId: z.string().optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  { message: "L'heure de fin doit être après l'heure de début", path: ["endTime"] }
);

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
