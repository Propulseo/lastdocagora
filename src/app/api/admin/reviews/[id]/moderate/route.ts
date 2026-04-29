import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { status, reason } = await req.json()

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Status must be 'approved' or 'rejected'" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify admin role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    // Use service role for update (admin policy uses is_admin() function)
    const { createClient: createAdminClient } = await import("@supabase/supabase-js")
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: updated, error } = await supabaseAdmin
      .from("reviews")
      .update({
        status,
        moderated_at: new Date().toISOString(),
        moderated_by: user.id,
        updated_at: new Date().toISOString(),
        ...(reason ? { moderation_reason: reason } : {}),
      })
      .eq("id", id)
      .select(`
        id, rating, comment, status, created_at, moderated_at,
        patients(users!patients_user_id_fkey(first_name, last_name)),
        professionals(users!professionals_user_id_fkey(first_name, last_name))
      `)
      .single()

    if (error) {
      console.error("[admin-moderate-review]", error.code)
      return NextResponse.json({ error: "operation_failed" }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error("[admin-moderate-review] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
