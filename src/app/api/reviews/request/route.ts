import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { reviewRequestEmail } from "@/lib/email/templates"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { appointment_id } = await req.json()
    if (!appointment_id) {
      return NextResponse.json({ error: "appointment_id required" }, { status: 400 })
    }

    // Fetch appointment with patient + professional details
    const { data: appointment, error: aptErr } = await supabaseAdmin
      .from("appointments")
      .select(`
        id, appointment_date, patient_id,
        appointment_attendance(status),
        patients(id, user_id, users!patients_user_id_fkey(email, first_name, preferred_language)),
        professionals(id, specialty, users!professionals_user_id_fkey(first_name, last_name))
      `)
      .eq("id", appointment_id)
      .single()

    if (aptErr || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Verify attendance is "present" or "late"
    const attendance = appointment.appointment_attendance as { status: string }[] | null
    const attStatus = attendance?.[0]?.status
    if (attStatus !== "present" && attStatus !== "late") {
      return NextResponse.json({ error: "Patient must be marked as present" }, { status: 400 })
    }

    // Check no existing review_request
    const { data: existing } = await supabaseAdmin
      .from("review_requests")
      .select("id")
      .eq("appointment_id", appointment_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Review request already sent" }, { status: 409 })
    }

    const patient = appointment.patients as unknown as {
      id: string
      user_id: string
      users: { email: string | null; first_name: string | null; preferred_language: string | null } | null
    } | null
    const professional = appointment.professionals as unknown as {
      id: string
      specialty: string | null
      users: { first_name: string | null; last_name: string | null } | null
    } | null

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Insert review_request
    const { data: reviewRequest, error: insertErr } = await supabaseAdmin
      .from("review_requests")
      .insert({
        appointment_id,
        patient_id: patient.id,
      })
      .select("token")
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // Send email with 24h delay via Resend scheduledAt
    const patientEmail = patient.users?.email
    if (patientEmail) {
      const proName = professional?.users
        ? `${professional.users.first_name ?? ""} ${professional.users.last_name ?? ""}`.trim()
        : "Seu profissional"
      const lang = (patient.users?.preferred_language as "pt" | "fr" | "en") || "pt"
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const reviewUrl = `${appUrl}/patient/review?token=${reviewRequest.token}`
      const declineUrl = `${appUrl}/api/reviews/decline?token=${reviewRequest.token}`

      const template = reviewRequestEmail({
        proName,
        specialty: professional?.specialty ?? "",
        appointmentDate: appointment.appointment_date,
        reviewUrl,
        declineUrl,
        lang,
      })

      try {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: "DocAgora <noreply@docagora.com>",
          to: patientEmail,
          subject: template.subject,
          html: template.html,
          scheduledAt,
        })
      } catch (emailErr) {
        console.error("[review-request] Email scheduling failed:", emailErr)
        // Don't fail the request — email is non-critical
      }
    }

    return NextResponse.json({ token: reviewRequest.token }, { status: 200 })
  } catch (err) {
    console.error("[review-request] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
