import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

/**
 * Get the current authenticated user with their role.
 * Returns null if not authenticated or user record not found.
 * Wrapped with React.cache() — duplicate calls within the same server
 * request are free after the first invocation.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
  };
});

/**
 * Get the current user's role only.
 * Returns null if not authenticated.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

/**
 * Get the professional ID for the current user.
 * Redirects to /login if not authenticated or not a professional.
 * Wrapped with React.cache() — free after the first call per request.
 */
export const getProfessionalId = cache(async (): Promise<string> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "professional" && user.role !== "admin") redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!data) redirect("/login");
  return data.id;
});

/**
 * Require a specific role. Redirects to appropriate dashboard if unauthorized.
 * Use at the top of server components or server actions to gate access.
 *
 * @param allowedRoles - one or more roles that are allowed
 * @returns The authenticated user (guaranteed to have one of the allowed roles)
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    const dashboards: Record<UserRole, string> = {
      admin: "/admin/dashboard",
      professional: "/pro/dashboard",
      patient: "/patient/dashboard",
    };
    redirect(dashboards[user.role]);
  }

  return user;
}

/**
 * Require admin role specifically. Convenience wrapper.
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole("admin");
}

/**
 * Require professional role (admin also allowed).
 */
export async function requireProfessional(): Promise<AuthUser> {
  return requireRole("professional", "admin");
}

/**
 * Require patient role (admin also allowed).
 */
export async function requirePatient(): Promise<AuthUser> {
  return requireRole("patient", "admin");
}
