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

  const pathname = request.nextUrl.pathname;

  // ── Fast path: fully public API routes — skip auth entirely ──
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/landing-chat") ||
    pathname.startsWith("/api/reviews/decline");

  if (isPublicApi) {
    supabaseResponse.headers.set("x-pathname", pathname);
    return supabaseResponse;
  }

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

  // ── Public pages: use getSession() (cookie-only, no server round-trip) ──
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/patient/search");

  if (isPublicPage) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Redirect authenticated users away from auth pages
    if (
      session?.user &&
      (pathname.startsWith("/login") || pathname.startsWith("/register"))
    ) {
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const authRedirect = request.nextUrl.clone();
      if (
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//")
      ) {
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

    supabaseResponse.headers.set("x-pathname", pathname);
    return supabaseResponse;
  }

  // ── Protected routes: use getUser() (validates with Supabase server) ──
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If the refresh token is stale/revoked, clear all Supabase auth cookies
  if (error && !user) {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) {
        request.cookies.delete(cookie.name);
        supabaseResponse.cookies.delete(cookie.name);
      }
    }
  }

  // Not authenticated — redirect to login
  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    const originalPath = request.nextUrl.pathname + request.nextUrl.search;
    if (originalPath !== "/") {
      redirectUrl.searchParams.set("redirect", originalPath);
    }
    return redirectWithCookies(redirectUrl, supabaseResponse);
  }

  // Role-based route enforcement + onboarding gate
  const needsRoleCheck =
    pathname.startsWith("/pro/") ||
    pathname.startsWith("/admin/") ||
    (pathname.startsWith("/patient/") &&
      !pathname.startsWith("/patient/search"));

  if (needsRoleCheck) {
    // Single query: fetch role + onboarding status via join (instead of 2 queries)
    const { data: userRow } = await supabase
      .from("users")
      .select("role, professionals(onboarding_completed)")
      .eq("id", user.id)
      .single();

    const role = userRow?.role;

    if (
      role === "patient" &&
      (pathname.startsWith("/pro/") || pathname.startsWith("/admin/"))
    ) {
      const roleRedirect = request.nextUrl.clone();
      roleRedirect.pathname = "/patient/dashboard";
      return redirectWithCookies(roleRedirect, supabaseResponse);
    }
    if (
      role === "professional" &&
      (pathname.startsWith("/patient/") || pathname.startsWith("/admin/"))
    ) {
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
      const pro = userRow?.professionals as
        | { onboarding_completed: boolean }
        | { onboarding_completed: boolean }[]
        | null;
      const onboardingCompleted = Array.isArray(pro)
        ? pro[0]?.onboarding_completed
        : pro?.onboarding_completed;

      if (onboardingCompleted === false) {
        const onboardingRedirect = request.nextUrl.clone();
        onboardingRedirect.pathname = "/pro/onboarding";
        return redirectWithCookies(onboardingRedirect, supabaseResponse);
      }
    }
  }

  supabaseResponse.headers.set("x-pathname", pathname);
  return supabaseResponse;
}
