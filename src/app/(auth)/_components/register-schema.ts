import { z } from "zod/v4"

export const registerSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
    specialty: z.string().optional(),
    orderNumber: z.string().optional(),
    terms: z.literal(true),
    privacy: z.literal(true),
    healthData: z.literal(true),
    marketing: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type RegisterValues = z.infer<typeof registerSchema>

export function getPasswordStrength(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
