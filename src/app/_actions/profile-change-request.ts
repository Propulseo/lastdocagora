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

  const description = [
    `Campo: ${input.fieldName}`,
    `Valor atual: ${input.currentValue || "—"}`,
    `Novo valor: ${input.requestedValue}`,
    input.reason ? `Motivo: ${input.reason}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await supabase.from("support_tickets").insert({
    user_id: user.id,
    subject: `Pedido de alteração: ${input.fieldName}`,
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

  // Notify admins
  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .eq("role", "admin");

  if (admins && admins.length > 0) {
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      title: "Novo pedido de alteração de perfil",
      message: `Profissional solicitou alteração do campo "${input.fieldName}"`,
      type: "system" as const,
      read: false,
    }));

    await supabase.from("notifications").insert(notifications);
  }

  revalidatePath("/pro/support");
  return { success: true };
}
