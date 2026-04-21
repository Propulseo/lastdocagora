"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface RequestFieldChangeInput {
  professionalId: string;
  fieldName: string;
  currentValue: string;
  requestedValue: string;
  reason?: string;
}

type ActionResult = { success: true } | { success: false; error: string };

export async function requestFieldChange(
  input: RequestFieldChangeInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "professional") {
    return { success: false, error: "unauthorized" };
  }

  const supabase = await createClient();

  // Structured description — admin reads raw field data, no i18n needed
  const description = [
    `Field: ${input.fieldName}`,
    `Current value: ${input.currentValue || "—"}`,
    `Requested value: ${input.requestedValue}`,
    input.reason ? `Reason: ${input.reason}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await supabase.from("support_tickets").insert({
    user_id: user.id,
    subject: `Profile change request: ${input.fieldName}`,
    description,
    status: "open",
    priority: "medium",
    ticket_type: "profile_change_request",
    metadata: {
      professional_id: input.professionalId,
      field_name: input.fieldName,
      current_value: input.currentValue,
      requested_value: input.requestedValue,
    },
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/pro/support");
  return { success: true };
}
