"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

type ValidationResult = {
  status: "ready" | "invalid" | "already_submitted" | "expired"
}

const TOKEN_EXPIRY_DAYS = 7

export async function validateReviewToken(
  token: string
): Promise<ValidationResult> {
  try {
    // Verify the user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { status: "invalid" }

    // Use service role to read review_requests (not in generated types)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: reviewRequest, error } = await supabaseAdmin
      .from("review_requests")
      .select("id, appointment_id, patient_id, declined, created_at")
      .eq("token", token)
      .single()

    if (error || !reviewRequest || reviewRequest.declined) {
      return { status: "invalid" }
    }

    // Check token expiry (7 days from creation)
    const createdAt = new Date(reviewRequest.created_at)
    const expiresAt = new Date(createdAt.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    if (new Date() > expiresAt) {
      return { status: "expired" }
    }

    // Verify the patient matches the authenticated user
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!patient || patient.id !== reviewRequest.patient_id) {
      return { status: "invalid" }
    }

    // Check if review already submitted for this appointment
    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("appointment_id", reviewRequest.appointment_id)
      .eq("patient_id", patient.id)
      .maybeSingle()

    if (existingReview) {
      return { status: "already_submitted" }
    }

    return { status: "ready" }
  } catch {
    return { status: "invalid" }
  }
}
