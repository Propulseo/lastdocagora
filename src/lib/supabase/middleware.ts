import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    url,
    anonKey,
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

  // Mandatory: refresh session cookie on every request
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If the refresh token is stale/revoked, clear all Supabase auth cookies
  // so the browser stops retrying with the same invalid token.
  if (error && !user) {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) {
        request.cookies.delete(cookie.name);
        supabaseResponse.cookies.delete(cookie.name);
      }
    }
  }

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/patient/search") ||
    pathname.startsWith("/api/auth/callback") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/landing-chat");

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Carry over cookie deletions to the redirect response
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) {
        redirectResponse.cookies.delete(cookie.name);
      }
    }
    return redirectResponse;
  }

  // If authenticated on auth pages, redirect to the redirect param or root
  if (user && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const authRedirect = request.nextUrl.clone();
    if (redirectParam && redirectParam.startsWith("/")) {
      authRedirect.pathname = redirectParam.split("?")[0];
      const redirectQuery = redirectParam.split("?")[1];
      if (redirectQuery) {
        const params = new URLSearchParams(redirectQuery);
        params.forEach((value, key) => authRedirect.searchParams.set(key, value));
      }
    } else {
      authRedirect.pathname = "/";
    }
    return NextResponse.redirect(authRedirect);
  }

  // Onboarding gate: redirect professionals who haven't completed onboarding
  if (
    user &&
    pathname.startsWith("/pro/") &&
    !pathname.startsWith("/pro/onboarding")
  ) {
    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userRow?.role === "professional") {
      const { data: pro } = await supabase
        .from("professionals")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (pro && !pro.onboarding_completed) {
        const onboardingRedirect = request.nextUrl.clone();
        onboardingRedirect.pathname = "/pro/onboarding";
        return NextResponse.redirect(onboardingRedirect);
      }
    }
  }

  supabaseResponse.headers.set("x-pathname", pathname);
  return supabaseResponse;
}
