import { z } from 'zod'

export const EnrichmentSchema = z.object({
  category: z.string().min(1),
  summary: z.string().min(10),
  viabilityNote: z.string().min(10),
  phases: z.array(z.object({
    phase: z.string(),
    description: z.string(),
    duration: z.string(),
  })).min(1),
  estimatedHours: z.number().positive(),
  nextSteps: z.array(z.string()).min(1),
  domainMeta: z.record(z.string(), z.unknown()).optional().default({}),
})

export const FocusRecSchema = z.object({
  focus: z.string().min(1),
  rationale: z.string().min(10),
  firstAction: z.string().min(5),
})

export type EnrichmentOutput = z.infer<typeof EnrichmentSchema>
export type FocusRecOutput = z.infer<typeof FocusRecSchema>
``