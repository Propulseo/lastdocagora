import { getCurrentUser, getProfessionalId } from "@/lib/auth";
import { TodayClient } from "./_components/TodayClient";

export default async function TodayPage() {
  const [user, professionalId] = await Promise.all([
    getCurrentUser(),
    getProfessionalId(),
  ]);

  return <TodayClient professionalId={professionalId} userId={user!.id} />;
}
