"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { AppointmentStatus, AttendanceStatus } from "@/types";

function getServiceRoleClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function updateUserAdmin(
  userId: string,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    language?: string;
    // Professional-specific
    specialty?: string;
    registration_number?: string;
    consultation_fee?: number;
    bio?: string;
    languages_spoken?: string[];
    address?: string;
    city?: string;
    postal_code?: string;
    // Patient-specific
    insurance_provider?: string;
  }
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { supabase } = admin;

  // Update users table
  const userFields: Record<string, unknown> = {};
  if (data.first_name !== undefined) userFields.first_name = data.first_name;
  if (data.last_name !== undefined) userFields.last_name = data.last_name;
  if (data.email !== undefined) userFields.email = data.email;
  if (data.phone !== undefined) userFields.phone = data.phone;
  if (data.language !== undefined) userFields.language = data.language;

  if (Object.keys(userFields).length > 0) {
    const { error } = await supabase
      .from("users")
      .update(userFields)
      .eq("id", userId);
    if (error) return { success: false, error: error.message };
  }

  // Check role for role-specific updates
  const { data: userRecord } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userRecord?.role === "professional") {
    const proFields: Record<string, unknown> = {};
    if (data.specialty !== undefined) proFields.specialty = data.specialty;
    if (data.registration_number !== undefined)
      proFields.registration_number = data.registration_number;
    if (data.consultation_fee !== undefined)
      proFields.consultation_fee = data.consultation_fee;
    if (data.bio !== undefined) proFields.bio = data.bio;
    if (data.languages_spoken !== undefined)
      proFields.languages_spoken = data.languages_spoken;
    if (data.address !== undefined) proFields.address = data.address;
    if (data.city !== undefined) proFields.city = data.city;
    if (data.postal_code !== undefined) proFields.postal_code = data.postal_code;

    if (Object.keys(proFields).length > 0) {
      const { error } = await supabase
        .from("professionals")
        .update(proFields)
        .eq("user_id", userId);
      if (error) return { success: false, error: error.message };
    }
  }

  if (userRecord?.role === "patient") {
    const patientFields: Record<string, unknown> = {};
    if (data.insurance_provider !== undefined)
      patientFields.insurance_provider = data.insurance_provider;
    if (data.phone !== undefined) patientFields.phone = data.phone;
    if (data.address !== undefined) patientFields.address = data.address;
    if (data.city !== undefined) patientFields.city = data.city;

    if (Object.keys(patientFields).length > 0) {
      const { error } = await supabase
        .from("patients")
        .update(patientFields)
        .eq("user_id", userId);
      if (error) return { success: false, error: error.message };
    }
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function banUser(userId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  if (userId === admin.user.id)
    return { success: false, error: "cannot_ban_self" };

  const supabaseAdmin = getServiceRoleClient();

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { ban_duration: "876600h" }
  );
  if (authError) return { success: false, error: authError.message };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ status: "suspended" })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function unbanUser(userId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const supabaseAdmin = getServiceRoleClient();

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { ban_duration: "none" }
  );
  if (authError) return { success: false, error: authError.message };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ status: "active" })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function updateAppointmentStatusAdmin(
  appointmentId: string,
  status: AppointmentStatus
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { error } = await admin.supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function updateAttendanceAdmin(
  appointmentId: string,
  attendanceStatus: AttendanceStatus
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  // Get appointment info for professional_id
  const { data: appt } = await admin.supabase
    .from("appointments")
    .select("professional_id, professional_user_id")
    .eq("id", appointmentId)
    .single();

  if (!appt) return { success: false, error: "Appointment not found" };

  // Check if attendance record exists
  const { data: existing } = await admin.supabase
    .from("appointment_attendance")
    .select("id")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin.supabase
      .from("appointment_attendance")
      .update({
        status: attendanceStatus,
        marked_at: new Date().toISOString(),
        marked_by: admin.user.id,
      })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await admin.supabase
      .from("appointment_attendance")
      .insert({
        appointment_id: appointmentId,
        professional_id: appt.professional_id,
        professional_user_id: appt.professional_user_id,
        status: attendanceStatus,
        marked_at: new Date().toISOString(),
        marked_by: admin.user.id,
      });
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function updateAppointmentDateTimeAdmin(
  appointmentId: string,
  date: string,
  time: string,
  forceConflict: boolean
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  if (!forceConflict) {
    // Get appointment info
    const { data: appt } = await admin.supabase
      .from("appointments")
      .select("professional_id, duration_minutes")
      .eq("id", appointmentId)
      .single();

    if (appt) {
      // Check for conflicts
      const { data: conflicts } = await admin.supabase
        .from("appointments")
        .select("id")
        .eq("professional_id", appt.professional_id)
        .eq("appointment_date", date)
        .neq("id", appointmentId)
        .not("status", "in", '("cancelled","rejected")');

      if (conflicts && conflicts.length > 0) {
        return { success: false, error: "conflict" };
      }
    }
  }

  const { error } = await admin.supabase
    .from("appointments")
    .update({ appointment_date: date, appointment_time: time })
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function deleteAppointmentAdmin(appointmentId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const supabaseAdmin = getServiceRoleClient();

  // Delete related records
  await supabaseAdmin
    .from("appointment_attendance")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("appointment_notifications")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("consultation_notes")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("review_requests")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("reviews")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("payments")
    .delete()
    .eq("appointment_id", appointmentId);

  const { error } = await supabaseAdmin
    .from("appointments")
    .delete()
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function createAppointmentAdmin(data: {
  professionalId: string;
  patientId: string;
  serviceId: string;
  date: string;
  time: string;
  durationMinutes: number;
  notes?: string;
}) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  // Get user IDs for patient and professional
  const { data: pro } = await admin.supabase
    .from("professionals")
    .select("user_id")
    .eq("id", data.professionalId)
    .single();

  if (!pro) return { success: false, error: "Professional not found" };

  const { data: patient } = await admin.supabase
    .from("patients")
    .select("user_id")
    .eq("id", data.patientId)
    .single();

  if (!patient) return { success: false, error: "Patient not found" };

  const { error } = await admin.supabase.from("appointments").insert({
    professional_id: data.professionalId,
    patient_id: data.patientId,
    service_id: data.serviceId,
    professional_user_id: pro.user_id,
    patient_user_id: patient.user_id,
    appointment_date: data.date,
    appointment_time: data.time,
    duration_minutes: data.durationMinutes,
    status: "confirmed",
    created_via: "manual",
    notes: data.notes ?? null,
    created_by_user_id: admin.user.id,
    consultation_type: "in-person",
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Professionals
// ---------------------------------------------------------------------------

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

  if (error) return { success: false, error: error.message };
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

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/professionals");
  return { success: true };
}

export async function unsuspendProfessional(professionalId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { error } = await admin.supabase
    .from("professionals")
    .update({ verification_status: "verified" })
    .eq("id", professionalId);

  if (error) return { success: false, error: error.message };
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

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/professionals");
  return { success: true };
}

export async function clearAvailabilityAdmin(professionalId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { error } = await admin.supabase
    .from("availability")
    .delete()
    .eq("professional_id", professionalId);

  if (error) return { success: false, error: error.message };
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

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/professionals");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Support Tickets
// ---------------------------------------------------------------------------

export async function assignTicketToSelf(ticketId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { error } = await admin.supabase
    .from("support_tickets")
    .update({ status: "in_progress" })
    .eq("id", ticketId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/support");
  return { success: true };
}

export async function deleteTicket(ticketId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const supabaseAdmin = getServiceRoleClient();

  await supabaseAdmin
    .from("ticket_messages")
    .delete()
    .eq("ticket_id", ticketId);

  const { error } = await supabaseAdmin
    .from("support_tickets")
    .delete()
    .eq("id", ticketId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/support");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

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
    const { data: stats } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("professional_id", review.professional_id)
      .eq("status", "approved");

    if (stats && stats.length > 0) {
      const avg =
        stats.reduce((sum, r) => sum + r.rating, 0) / stats.length;
      await supabaseAdmin
        .from("professionals")
        .update({ rating: Math.round(avg * 10) / 10, total_reviews: stats.length })
        .eq("id", review.professional_id);
    } else {
      await supabaseAdmin
        .from("professionals")
        .update({ rating: null, total_reviews: 0 })
        .eq("id", review.professional_id);
    }
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

  const { error } = await admin.supabase
    .from("reviews")
    .update({
      status,
      moderated_at: new Date().toISOString(),
      moderated_by: admin.user.id,
    })
    .eq("id", reviewId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/reviews");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Global Search
// ---------------------------------------------------------------------------

export async function getAdminSearchResults(query: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado", data: [] };

  if (!query || query.trim().length < 2)
    return { success: true, data: [] };

  const search = query.trim();

  const { data, error } = await admin.supabase
    .from("users")
    .select("id, first_name, last_name, email, role, status, avatar_url")
    .or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
    .order("first_name")
    .limit(10);

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data ?? [] };
}
