"use server";

import { revalidatePath } from "next/cache";
import type { AppointmentStatus } from "@/types";
import { hasFutureAppointments } from "@/lib/admin-guards";
import { sanitizeDbError } from "@/lib/errors";
import { getAdminClient } from "./admin-crud-helpers";

export async function updateProfessionalAdmin(
  professionalId: string,
  data: {
    specialty?: string;
    registration_number?: string;
    consultation_fee?: number;
    bio?: string;
    languages_spoken?: string[];
    address?: string;
    city?: string;
    postal_code?: string;
  }
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const fields: Record<string, unknown> = {};
  if (data.specialty !== undefined) fields.specialty = data.specialty;
  if (data.registration_number !== undefined)
    fields.registration_number = data.registration_number;
  if (data.consultation_fee !== undefined)
    fields.consultation_fee = data.consultation_fee;
  if (data.bio !== undefined) fields.bio = data.bio;
  if (data.languages_spoken !== undefined)
    fields.languages_spoken = data.languages_spoken;
  if (data.address !== undefined) fields.address = data.address;
  if (data.city !== undefined) fields.city = data.city;
  if (data.postal_code !== undefined) fields.postal_code = data.postal_code;

  const { error } = await admin.supabase
    .from("professionals")
    .update(fields)
    .eq("id", professionalId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-professionals") };
  revalidatePath("/admin/professionals");
  return { success: true };
}

export async function suspendProfessional(professionalId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { error } = await admin.supabase
    .from("professionals")
    .update({ verification_status: "suspended" })
    .eq("id", professionalId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-professionals") };

  // Cascade: cancel all future confirmed/pending appointments and notify each patient
  const today = new Date().toISOString().split("T")[0];
  const { data: futureAppts } = await admin.supabase
    .from("appointments")
    .select("id, patient_user_id, appointment_date, appointment_time")
    .eq("professional_id", professionalId)
    .in("status", ["pending", "confirmed"])
    .gte("appointment_date", today);

  if (futureAppts && futureAppts.length > 0) {
    const now = new Date().toISOString();
    const apptIds = futureAppts.map((a) => a.id);

    // Bulk cancel
    await admin.supabase
      .from("appointments")
      .update({
        status: "cancelled" as AppointmentStatus,
        cancellation_reason: "professional_suspended",
        cancelled_at: now,
        cancelled_by: admin.user.id,
        updated_at: now,
      })
      .in("id", apptIds);

    // Get professional name for notifications
    const { data: proUser } = await admin.supabase
      .from("professionals")
      .select("users!professionals_user_id_fkey ( first_name, last_name )")
      .eq("id", professionalId)
      .single();
    const proData = (proUser as { users?: { first_name?: string; last_name?: string } } | null)?.users;
    const proName = proData
      ? `${proData.first_name ?? ""} ${proData.last_name ?? ""}`.trim() || "Professional"
      : "Professional";

    // Notify each patient individually
    const uniquePatientUserIds = [...new Set(futureAppts.map((a) => a.patient_user_id).filter(Boolean))] as string[];
    if (uniquePatientUserIds.length > 0) {
      const notifs = uniquePatientUserIds.map((patientUserId) => ({
        user_id: patientUserId,
        title: "Appointment cancelled",
        message: `Your appointment(s) with ${proName} have been cancelled because the professional is no longer available.`,
        type: "cancellation",
        params: { proName, reason: "professional_suspended" },
      }));
      const { error: notifError } = await admin.supabase
        .from("notifications")
        .insert(notifs);
      if (notifError) {
        console.error("[suspendProfessional] Failed to notify patients:", notifError.message);
      }

      // Send emails to affected patients
      try {
        const { data: patientUsers } = await admin.supabase
          .from("users")
          .select("id, email")
          .in("id", uniquePatientUserIds);

        if (patientUsers && patientUsers.length > 0) {
          const { sendNotificationEmail } = await import("@/lib/email/resend");
          const { appointmentCancelledEmail } = await import("@/lib/email/templates");
          for (const pu of patientUsers) {
            if (pu.email) {
              try {
                const template = appointmentCancelledEmail(proName, "Professional suspended");
                await sendNotificationEmail({ to: pu.email, ...template });
              } catch {
                // Continue sending to other patients
              }
            }
          }
        }
      } catch (emailError) {
        console.error("[suspendProfessional] Failed to send emails:", emailError);
      }
    }
  }

  revalidatePath("/admin/professionals");
  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function unsuspendProfessional(professionalId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { error } = await admin.supabase
    .from("professionals")
    .update({ verification_status: "verified" })
    .eq("id", professionalId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-professionals") };
  revalidatePath("/admin/professionals");
  return { success: true };
}

export async function deleteAvailabilityAdmin(availabilityId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { error } = await admin.supabase
    .from("availability")
    .delete()
    .eq("id", availabilityId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-professionals") };
  revalidatePath("/admin/professionals");
  return { success: true };
}

export async function clearAvailabilityAdmin(professionalId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  // Guard: block if professional has future appointments
  const hasFuture = await hasFutureAppointments("professional", professionalId, admin.supabase);
  if (hasFuture) {
    return { success: false, error: "HAS_FUTURE_APPOINTMENTS" };
  }

  const { error } = await admin.supabase
    .from("availability")
    .delete()
    .eq("professional_id", professionalId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-professionals") };
  revalidatePath("/admin/professionals");
  return { success: true };
}

export async function updateServiceAdmin(
  serviceId: string,
  data: { duration_minutes?: number; price?: number }
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const fields: Record<string, unknown> = {};
  if (data.duration_minutes !== undefined)
    fields.duration_minutes = data.duration_minutes;
  if (data.price !== undefined) fields.price = data.price;

  const { error } = await admin.supabase
    .from("services")
    .update(fields)
    .eq("id", serviceId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-professionals") };
  revalidatePath("/admin/professionals");
  return { success: true };
}
