import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify the user is a patient
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!patient) {
      return NextResponse.json({ error: "Patient only" }, { status: 403 })
    }

    // Delete only if the review belongs to this patient (RLS enforces this too)
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id)
      .eq("patient_id", patient.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[review-delete] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
