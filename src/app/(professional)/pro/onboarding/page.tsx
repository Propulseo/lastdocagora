import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingShell } from "./_components/OnboardingShell";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "professional" && user.role !== "admin")) {
    redirect("/login");
  }

  const supabase = await createClient();

  const [{ data: userProfile }, { data: professional }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, email, phone, avatar_url, language")
      .eq("id", user.id)
      .single(),
    supabase
      .from("professionals")
      .select(
        "id, specialty, registration_number, practice_type, cabinet_name, years_experience, subspecialties, address, city, postal_code, latitude, longitude, languages_spoken, bio, bio_pt, bio_fr, bio_en, consultation_fee, third_party_payment, insurances_accepted, onboarding_completed, onboarding_step",
      )
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!userProfile || !professional) {
    redirect("/login");
  }

  if (professional.onboarding_completed) {
    redirect("/pro/dashboard");
  }

  // Fetch existing services and availability for resume scenario
  const [{ data: existingServices }, { data: existingAvailability }] =
    await Promise.all([
      supabase
        .from("services")
        .select("id, name, description, duration_minutes, price, consultation_type, is_active")
        .eq("professional_id", professional.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("availability")
        .select("id, day_of_week, start_time, end_time, is_recurring")
        .eq("professional_id", professional.id)
        .eq("is_recurring", true)
        .order("day_of_week", { ascending: true }),
    ]);

  return (
    <OnboardingShell
      userId={user.id}
      professionalId={professional.id}
      initialStep={professional.onboarding_step ?? 1}
      userProfile={{
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        email: userProfile.email,
        phone: userProfile.phone,
        avatar_url: userProfile.avatar_url,
      }}
      professional={{
        id: professional.id,
        specialty: professional.specialty,
        registration_number: professional.registration_number,
        practice_type: professional.practice_type,
        cabinet_name: professional.cabinet_name,
        years_experience: professional.years_experience,
        subspecialties: professional.subspecialties,
        address: professional.address,
        city: professional.city,
        postal_code: professional.postal_code,
        languages_spoken: professional.languages_spoken,
        bio: professional.bio,
        bio_pt: professional.bio_pt,
        bio_fr: professional.bio_fr,
        bio_en: professional.bio_en,
        consultation_fee: professional.consultation_fee,
        third_party_payment: professional.third_party_payment,
        insurances_accepted: professional.insurances_accepted,
      }}
      existingServices={(existingServices ?? []).map((s) => ({
        ...s,
        is_active: s.is_active ?? true,
        consultation_type: s.consultation_type ?? null,
      }))}
      existingAvailability={(existingAvailability ?? []).map((a) => ({
        ...a,
        is_recurring: a.is_recurring ?? true,
      }))}
    />
  );
}
