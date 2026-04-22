import { createClient } from "@supabase/supabase-js";
import { ReviewsClient } from "./_components/ReviewsClient";
import { getAdminI18nServer } from "@/lib/i18n/admin/server";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string | null;
  would_recommend: boolean | null;
  patient_name: string;
  professional_name: string;
}

export default async function ReviewsPage() {
  const { locale } = await getAdminI18nServer();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: rawReviews } = await supabaseAdmin
    .from("reviews")
    .select(`
      id, rating, comment, comment_pt, comment_fr, comment_en, status, created_at, would_recommend, patient_id,
      patients(users!patients_user_id_fkey(first_name, last_name)),
      professionals(users!professionals_user_id_fkey(first_name, last_name))
    `)
    .order("created_at", { ascending: false });

  const reviews: ReviewRow[] = (rawReviews ?? []).map((r) => {
    const proData = r.professionals as unknown as {
      users: { first_name: string; last_name: string } | null;
    } | null;
    const proUser = proData?.users;

    // Pick localized comment, fallback to original
    const localizedComment =
      (locale === "fr" ? r.comment_fr : locale === "en" ? r.comment_en : r.comment_pt)
      ?? r.comment
      ?? null;

    return {
      id: r.id,
      rating: r.rating,
      comment: localizedComment,
      status: (r as Record<string, unknown>).status as string ?? "pending",
      created_at: r.created_at,
      would_recommend: r.would_recommend ?? null,
      patient_name: r.patient_id
        ? `Patient #${(r.patient_id as string).slice(-5)}`
        : "---",
      professional_name: proUser
        ? `${proUser.first_name} ${proUser.last_name}`
        : "---",
    };
  });

  // Sort: pending first, then approved, then rejected
  const statusOrder: Record<string, number> = {
    pending: 0,
    approved: 1,
    rejected: 2,
  };
  reviews.sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 1;
    const orderB = statusOrder[b.status] ?? 1;
    if (orderA !== orderB) return orderA - orderB;
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return <ReviewsClient reviews={reviews} pendingCount={pendingCount} />;
}
