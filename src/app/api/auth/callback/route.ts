import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Read and clear the portal role cookie
        const cookieStore = await cookies()
        const portalRole = cookieStore.get("auth_portal_role")?.value as
          | "patient"
          | "professional"
          | undefined
        cookieStore.delete("auth_portal_role")

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        const userRole = userData?.role

        // Check role mismatch (admins bypass, new users without role bypass)
        if (portalRole && userRole && userRole !== "admin") {
          if (userRole === "professional" && portalRole === "patient") {
            await supabase.auth.signOut()
            return NextResponse.redirect(
              `${origin}/login?error=wrong_portal_pro`
            )
          }
          if (userRole === "patient" && portalRole === "professional") {
            await supabase.auth.signOut()
            return NextResponse.redirect(
              `${origin}/login?error=wrong_portal_patient`
            )
          }
        }

        // Redirect based on role
        if (userRole === "admin")
          return NextResponse.redirect(`${origin}/admin/dashboard`)
        if (userRole === "professional")
          return NextResponse.redirect(`${origin}/pro/dashboard`)
        return NextResponse.redirect(`${origin}/patient/dashboard`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
