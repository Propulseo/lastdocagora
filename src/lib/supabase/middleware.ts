import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/register", "/"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If authenticated, fetch role and enforce route access
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role;

    // Redirect from auth pages to dashboard
    if (isPublicRoute && pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin/dashboard" : role === "professional" ? "/pro/dashboard" : "/patient/dashboard";
      return NextResponse.redirect(url);
    }

    // Enforce role-based route access
    if (pathname.startsWith("/admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "professional" ? "/pro/dashboard" : "/patient/dashboard";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/pro") && role !== "professional" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin/dashboard" : "/patient/dashboard";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/patient") && role !== "patient" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin/dashboard" : "/pro/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
