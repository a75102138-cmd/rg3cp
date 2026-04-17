import { z } from "zod";

export const observationSchema = z.object({
  title: z.string().min(3, "Titre requis"),
  description: z.string().min(10, "Description détaillée requise"),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  category: z.string().min(2),
  zoneId: z.string().min(1),
  elementId: z.string().optional(),
  status: z.enum(["recorded", "triaged", "linked", "closed"]),
});

export type ObservationFormValues = z.infer<typeof observationSchema>;
