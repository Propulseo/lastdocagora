import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import { ReviewsClient } from "./_components/ReviewsClient";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  patient_id: string;
  patients: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export default async function ReviewsPage() {
  const professionalId = await getProfessionalId();
  const supabase = await createClient();

  const { data: rawReviews } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, patient_id, patients(first_name, last_name)"
    )
    .eq("professional_id", professionalId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const reviews = ((rawReviews ?? []) as unknown as ReviewRow[]).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? "",
    createdAt: r.created_at ?? "",
    patientInitials: r.patients
      ? `${(r.patients.first_name ?? "")[0] ?? ""}${(r.patients.last_name ?? "")[0] ?? ""}`.toUpperCase() || "?"
      : "?",
  }));

  return <ReviewsClient reviews={reviews} />;
}
