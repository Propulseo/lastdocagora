"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "./admin-crud-helpers";

type BulkCancelResult =
  | { success: true; cancelledCount: number }
  | { success: false; error: string };

export async function bulkCancelProfessionalDay(
  professionalId: string,
  date: string
): Promise<BulkCancelResult> {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Unauthorized" };

  // Fetch all pending/confirmed appointments for this professional on this date
  const { data: appts, error: fetchErr } = await admin.supabase
    .from("appointments")
    .select("id")
    .eq("professional_id", professionalId)
    .eq("appointment_date", date)
    .in("status", ["pending", "confirmed"]);

  if (fetchErr) return { success: false, error: fetchErr.message };
  if (!appts || appts.length === 0) {
    return { success: true, cancelledCount: 0 };
  }

  const now = new Date().toISOString();
  const apptIds = appts.map((a) => a.id);

  // Bulk cancel
  const { error: updateErr } = await admin.supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancellation_reason: "professional_emergency",
      cancelled_at: now,
      cancelled_by: admin.user.id,
      updated_at: now,
    })
    .in("id", apptIds);

  if (updateErr) return { success: false, error: updateErr.message };

  revalidatePath("/admin/appointments");
  revalidatePath("/admin/professionals");
  return { success: true, cancelledCount: appts.length };
}
