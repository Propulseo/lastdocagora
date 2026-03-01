import { getCurrentUser, getProfessionalId } from "@/lib/auth";
import { AgendaClient } from "./_components/AgendaClient";

export default async function AgendaPage() {
  const [user, professionalId] = await Promise.all([
    getCurrentUser(),
    getProfessionalId(),
  ]);

  return <AgendaClient professionalId={professionalId} userId={user!.id} />;
}
