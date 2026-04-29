import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified")

    if (error) {
      return NextResponse.json(
        { status: "error", error: "database_check_failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: "ok",
      verified_professionals_count: count ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: "error", error: "health_check_failed" },
      { status: 500 }
    )
  }
}
