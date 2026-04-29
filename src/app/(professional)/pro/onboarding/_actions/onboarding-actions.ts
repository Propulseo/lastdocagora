"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeDbError } from "@/lib/errors";
import {
  handleStep1,
  handleStep2,
  handleStep3,
  handleStep4,
  handleStep5,
  handleStep6,
} from "./onboarding-steps";

type ActionResult =
  | { success: true; geocoded?: boolean }
  | { success: false; error: string };

async function getAuthenticatedProfessional() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "professional" && user.role !== "admin")) {
    return null;
  }

  const supabase = await createClient();
  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return null;
  return { user, pro, supabase };
}

export async function saveOnboardingStep(
  step: number,
  data: unknown,
): Promise<ActionResult> {
  const auth = await getAuthenticatedProfessional();
  if (!auth) return { success: false, error: "unauthorized" };

  const { user, pro, supabase } = auth;

  try {
    let result: ActionResult;

    if (step === 1) result = await handleStep1(data, user.id, pro.id, supabase);
    else if (step === 2) result = await handleStep2(data, pro.id, supabase);
    else if (step === 3) result = await handleStep3(data, pro.id, user.id, supabase);
    else if (step === 4) result = await handleStep4(data, pro.id, user.id, supabase);
    else if (step === 5) result = await handleStep5(data, pro.id, supabase);
    else if (step === 6) result = await handleStep6(pro.id, supabase);
    else result = { success: true };

    revalidatePath("/pro/onboarding");
    return result;
  } catch {
    return { success: false, error: "operation_failed" };
  }
}

export async function completeOnboarding(): Promise<ActionResult> {
  const auth = await getAuthenticatedProfessional();
  if (!auth) return { success: false, error: "unauthorized" };

  const { pro, supabase } = auth;

  const { error } = await supabase
    .from("professionals")
    .update({
      onboarding_completed: true,
      onboarding_step: 7,
    })
    .eq("id", pro.id);

  if (error) return { success: false, error: sanitizeDbError(error, "onboarding") };

  revalidatePath("/pro");
  return { success: true };
}
