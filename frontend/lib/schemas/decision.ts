import { z } from "zod";

export const decisionSchema = z.object({
  title: z.string().min(3),
  decisionType: z.string().min(2),
  doctrinalPrinciples: z.array(z.string()).min(1, "Sélectionnez au moins un principe doctrinal"),
  justification: z.string().min(20),
  zoneId: z.string().min(1),
  observationId: z.string().min(1),
  pathologyId: z.string().optional(),
  validationStatus: z.enum(["draft", "under_review", "validated", "rejected"]),
  decidedBy: z.string().min(2),
  decisionDate: z.string().min(1),
});

export type DecisionFormValues = z.infer<typeof decisionSchema>;
