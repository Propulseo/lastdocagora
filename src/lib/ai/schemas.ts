import { z } from "zod"

export const aiSearchFiltersSchema = z.object({
  specialty: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  name: z.string().optional(),
  languages_spoken: z.array(z.string()).optional(),
  insurances_accepted: z.array(z.string()).optional(),
  third_party_payment: z.boolean().optional(),
  max_consultation_fee: z.number().optional(),
  min_rating: z.number().min(0).max(5).optional(),
  min_years_experience: z.number().optional(),
  practice_type: z.string().optional(),
  sort_by: z
    .enum(["rating", "consultation_fee", "years_experience"])
    .optional(),
  limit: z.number().min(1).max(50).optional(),
  requested_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  requested_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

export type AISearchFilters = z.infer<typeof aiSearchFiltersSchema>

export const aiOutputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("clarification"),
    message: z.string(),
    suggested_options: z.array(z.string()).max(5).optional(),
  }),
  z.object({
    type: z.literal("search"),
    message: z.string(),
    filters: aiSearchFiltersSchema,
  }),
])

export type AIOutput = z.infer<typeof aiOutputSchema>

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})

export const aiSearchInputSchema = z.object({
  message: z.string().min(1, "A mensagem não pode estar vazia.").max(500, "A mensagem não pode exceder 500 caracteres."),
  history: z.array(chatMessageSchema).max(20, "Histórico demasiado longo.").default([]),
  locale: z.enum(["pt", "fr", "en"]).optional().default("pt"),
})

export type AISearchInput = z.infer<typeof aiSearchInputSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
