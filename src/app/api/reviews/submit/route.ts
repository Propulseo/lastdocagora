import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, rating, rating_punctuality, rating_listening, rating_clarity, comment, is_anonymous } = body

    if (!token || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // Validate sub-ratings if provided
    for (const sub of [rating_punctuality, rating_listening, rating_clarity]) {
      if (sub !== undefined && sub !== null && (sub < 1 || sub > 5)) {
        return NextResponse.json({ error: "Sub-ratings must be between 1 and 5" }, { status: 400 })
      }
    }

    if (comment && comment.length > 1000) {
      return NextResponse.json({ error: "Comment too long (max 1000)" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is authenticated as patient
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get patient id
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Validate token — use service role to bypass RLS
    const { createClient: createAdminClient } = await import("@supabase/supabase-js")
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: reviewRequest, error: tokenErr } = await supabaseAdmin
      .from("review_requests")
      .select("id, appointment_id, patient_id, created_at")
      .eq("token", token)
      .eq("declined", false)
      .single()

    if (tokenErr || !reviewRequest) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 })
    }

    // Check token expiry (7 days from creation)
    const createdAt = new Date(reviewRequest.created_at)
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    if (new Date() > expiresAt) {
      return NextResponse.json({ error: "Token expired" }, { status: 410 })
    }

    // Verify the authenticated patient matches the review request
    if (reviewRequest.patient_id !== patient.id) {
      return NextResponse.json({ error: "Token does not match your account" }, { status: 403 })
    }

    // Check no existing review for this appointment
    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("appointment_id", reviewRequest.appointment_id)
      .eq("patient_id", patient.id)
      .maybeSingle()

    if (existingReview) {
      return NextResponse.json({ error: "Review already submitted" }, { status: 409 })
    }

    // Get appointment to find professional_id
    const { data: appointment } = await supabaseAdmin
      .from("appointments")
      .select("professional_id")
      .eq("id", reviewRequest.appointment_id)
      .single()

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Insert review
    const { error: insertErr } = await supabaseAdmin
      .from("reviews")
      .insert({
        appointment_id: reviewRequest.appointment_id,
        patient_id: patient.id,
        patient_user_id: user.id,
        professional_id: appointment.professional_id,
        rating,
        rating_punctuality: rating_punctuality ?? null,
        rating_listening: rating_listening ?? null,
        rating_clarity: rating_clarity ?? null,
        comment: comment?.trim() || null,
        is_anonymous: is_anonymous ?? false,
        status: "pending",
      })

    if (insertErr) {
      console.error("[review-submit] insert error:", insertErr.code)
      return NextResponse.json({ error: "operation_failed" }, { status: 500 })
    }

    // Update opened_at if not set
    await supabaseAdmin
      .from("review_requests")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", reviewRequest.id)
      .is("opened_at", null)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error("[review-submit] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
