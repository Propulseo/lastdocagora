import { redirect } from "next/navigation";

export default function NewAppointmentPage() {
  redirect("/pro/agenda?create=true");
}
