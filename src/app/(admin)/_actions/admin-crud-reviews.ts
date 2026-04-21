"use server";

import { revalidatePath } from "next/cache";
import { recalculateProfessionalRating } from "@/lib/admin-guards";
import { getServiceRoleClient, getAdminClient } from "./admin-crud-helpers";

export async function deleteReview(reviewId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const supabaseAdmin = getServiceRoleClient();

  // Get review to find appointment_id for cleanup
  const { data: review } = await supabaseAdmin
    .from("reviews")
    .select("appointment_id, professional_id")
    .eq("id", reviewId)
    .single();

  if (review?.appointment_id) {
    await supabaseAdmin
      .from("review_requests")
      .delete()
      .eq("appointment_id", review.appointment_id);
  }

  const { error } = await supabaseAdmin
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) return { success: false, error: error.message };

  // Recalculate professional rating
  if (review?.professional_id) {
    await recalculateProfessionalRating(review.professional_id, supabaseAdmin);
  }

  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function updateReviewStatus(
  reviewId: string,
  status: "approved" | "rejected" | "pending"
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  // Fetch review for integrity check + rating recalc
  const { data: review } = await admin.supabase
    .from("reviews")
    .select("appointment_id, patient_id, professional_id")
    .eq("id", reviewId)
    .single();

  if (!review) return { success: false, error: "Review not found" };

  // Guard: verify appointment exists and patient matches when approving
  if (status === "approved" && review.appointment_id) {
    const { data: apptCheck } = await admin.supabase
      .from("appointments")
      .select("id, patient_id")
      .eq("id", review.appointment_id)
      .single();
    if (!apptCheck) return { success: false, error: "APPOINTMENT_NOT_FOUND" };
    if (review.patient_id && apptCheck.patient_id !== review.patient_id) {
      return { success: false, error: "PATIENT_MISMATCH" };
    }
  }

  const { error } = await admin.supabase
    .from("reviews")
    .update({
      status,
      moderated_at: new Date().toISOString(),
      moderated_by: admin.user.id,
    })
    .eq("id", reviewId);

  if (error) return { success: false, error: error.message };

  // Recalculate professional rating after status change
  if (review.professional_id) {
    await recalculateProfessionalRating(review.professional_id, admin.supabase);
  }

  revalidatePath("/admin/reviews");
  return { success: true };
}
