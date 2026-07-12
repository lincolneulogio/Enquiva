import { redirect } from "next/navigation";

/** Compat: el layout de organizer ya muestra el modal de espera. */
export default function OrganizerPendingPage() {
  redirect("/organizer");
}
