import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ProfileClient } from "./_components/ProfileClient";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: userProfile }, { data: professional }, { data: ratings }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, email, phone, avatar_url, language")
      .eq("id", user.id)
      .single(),
    supabase
      .from("professionals")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("professional_ratings_detail")
      .select("id, rating, comment, created_at, appointment_date, service_name, patient_first_name, patient_last_name")
      .eq("professional_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!professional || !userProfile) redirect("/login");

  const recentRatings = (ratings ?? []) as Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    appointment_date: string;
    service_name: string | null;
    patient_first_name: string | null;
    patient_last_name: string | null;
  }>;

  return (
    <ProfileClient
      userId={user.id}
      userProfile={userProfile}
      professional={professional}
      recentRatings={recentRatings}
    />
  );
}
