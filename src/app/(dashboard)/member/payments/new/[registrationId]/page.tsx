import { redirect } from "next/navigation";
import { paymentCheckoutPath } from "@/lib/navigation/attendee-paths";

interface Props {
  params: Promise<{ registrationId: string }>;
}

/** Compat: la ruta antigua de miembro redirige al checkout neutral. */
export default async function MemberPaymentCheckoutRedirect({ params }: Props) {
  const { registrationId } = await params;
  redirect(paymentCheckoutPath(registrationId));
}
