import { z } from "zod/v4";

export const step1Schema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  bio: z.string().max(500).optional().or(z.literal("")),
  bio_pt: z.string().max(500).optional().or(z.literal("")),
  bio_fr: z.string().max(500).optional().or(z.literal("")),
  bio_en: z.string().max(500).optional().or(z.literal("")),
  registration_number: z.string().min(1).max(50),
  languages_spoken: z.string().max(500).optional().or(z.literal("")),
});

export const step2Schema = z.object({
  specialty: z.string().min(1).max(100),
  subspecialties: z.string().max(500).optional().or(z.literal("")),
  years_experience: z.coerce.number().int().min(0).max(80).optional(),
  practice_type: z.string().max(50).optional().or(z.literal("")),
  consultation_types: z.array(z.string()).optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  third_party_payment: z.boolean().optional(),
  insurance_provider_ids: z.array(z.string()).optional(),
});

export const step3ServiceSchema = z.object({
  name: z.string().min(1).max(200),
  name_fr: z.string().max(200).optional().or(z.literal("")),
  name_en: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  price: z.coerce.number().min(0),
  consultation_type: z.string().optional(),
});

export const step3Schema = z.object({
  services: z.array(step3ServiceSchema).min(1),
});

export const step4SlotSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

export const step4Schema = z.object({
  slots: z.array(step4SlotSchema).min(1),
});

export const step5Schema = z.object({
  cabinet_name: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  postal_code: z.string().max(20).optional().or(z.literal("")),
});
