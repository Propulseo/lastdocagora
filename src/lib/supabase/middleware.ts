import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Create a redirect response that carries over all cookies from supabaseResponse.
 * This is CRITICAL: supabaseResponse may contain refreshed session tokens set
 * by the setAll callback. Returning a new NextResponse.redirect() without these
 * cookies causes the browser to lose the refreshed tokens, leading to
 * "Invalid Refresh Token: Refresh Token Not Found" on the next request.
 */
function redirectWithCookies(
  url: URL,
  supabaseResponse: NextResponse
): NextResponse {
  const redirect = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value);
  });
  return redirect;
}

export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, anonKey, {
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
  });

  // IMPORTANT: Do not run code between createServerClient and getUser().
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
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/landing-chat") ||
    pathname.startsWith("/api/reviews/decline");

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    // Preserve original URL so the user returns after login
    const originalPath = request.nextUrl.pathname + request.nextUrl.search;
    if (originalPath !== "/") {
      redirectUrl.searchParams.set("redirect", originalPath);
    }
    return redirectWithCookies(redirectUrl, supabaseResponse);
  }

  // If authenticated on auth pages, redirect to the redirect param or root
  if (
    user &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const authRedirect = request.nextUrl.clone();
    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      authRedirect.pathname = redirectParam.split("?")[0];
      const redirectQuery = redirectParam.split("?")[1];
      if (redirectQuery) {
        const params = new URLSearchParams(redirectQuery);
        params.forEach((value, key) =>
          authRedirect.searchParams.set(key, value)
        );
      }
    } else {
      authRedirect.pathname = "/";
    }
    return redirectWithCookies(authRedirect, supabaseResponse);
  }

  // Role-based route enforcement + onboarding gate
  const needsRoleCheck =
    pathname.startsWith("/pro/") ||
    pathname.startsWith("/admin/") ||
    (pathname.startsWith("/patient/") && !pathname.startsWith("/patient/search"));

  if (user && needsRoleCheck) {
    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userRow?.role;

    // Block patients from accessing /pro/* and /admin/*
    // Block professionals from accessing /patient/* (except search) and /admin/*
    // Block admins from accessing /pro/* (admins can access /admin/* and /patient/*)
    if (role === "patient" && (pathname.startsWith("/pro/") || pathname.startsWith("/admin/"))) {
      const roleRedirect = request.nextUrl.clone();
      roleRedirect.pathname = "/patient/dashboard";
      return redirectWithCookies(roleRedirect, supabaseResponse);
    }
    if (role === "professional" && (pathname.startsWith("/patient/") || pathname.startsWith("/admin/"))) {
      const roleRedirect = request.nextUrl.clone();
      roleRedirect.pathname = "/pro/dashboard";
      return redirectWithCookies(roleRedirect, supabaseResponse);
    }

    // Onboarding gate for professionals
    if (
      role === "professional" &&
      pathname.startsWith("/pro/") &&
      !pathname.startsWith("/pro/onboarding")
    ) {
      const { data: pro } = await supabase
        .from("professionals")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (pro && !pro.onboarding_completed) {
        const onboardingRedirect = request.nextUrl.clone();
        onboardingRedirect.pathname = "/pro/onboarding";
        return redirectWithCookies(onboardingRedirect, supabaseResponse);
      }
    }
  }

  supabaseResponse.headers.set("x-pathname", pathname);
  return supabaseResponse;
}
