"use server";

import { revalidatePath } from "next/cache";
import {
  createPaymentSchema,
  updatePaymentStatusSchema,
  type CreatePaymentInput,
  type UpdatePaymentStatusInput,
} from "@/lib/validations";
import { PaymentService } from "@/services/payments/payment.service";
import { LogService } from "@/lib/analytics/audit";
import {
  requireAuthWithHeaders,
  requireOrganizerOrHigherWithHeaders,
  requireAdminOrHigherWithHeaders,
} from "@/lib/auth/guards";
import { resolveAdminScopeForUser } from "@/lib/organizations/admin-scope";

/**
 * Controller Server Action: Registra la información de un pago pendiente.
 */
export async function createPayment(input: CreatePaymentInput) {
  const { user } = await requireAuthWithHeaders();
  const validated = createPaymentSchema.parse(input);

  const result = await PaymentService.createPayment(user.id, validated);

  // Revalidate relevant member dashboard paths on the server
  revalidatePath("/member/payments");
  revalidatePath(`/member/payments/new/${validated.registrationId}`);
  revalidatePath("/organizer/payments");
  revalidatePath("/admin/payments");

  return result;
}

/**
 * Controller Server Action: Obtiene el contexto del checkout de pago para un registro.
 */
export async function getPaymentCheckoutContext(registrationId: string) {
  const { user } = await requireAuthWithHeaders();

  return PaymentService.getPaymentCheckoutContext(user.id, registrationId);
}

/**
 * Controller Server Action: Actualiza el estado de un pago (Aprobación/Rechazo).
 */
export async function updatePaymentStatus(input: UpdatePaymentStatusInput) {
  const { user, headers: hdrs } = await requireOrganizerOrHigherWithHeaders();
  const validated = updatePaymentStatusSchema.parse(input);

  const result = await PaymentService.updatePaymentStatus(
    user.id,
    user.role ?? "member",
    validated
  );

  const ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

  await LogService.log({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "payment.status_update",
    entityType: "payment",
    entityId: validated.paymentId,
    details: `Pago de S/. ${result.payment.amount} marcado como: ${validated.status}. Notas: ${validated.notes || "ninguna"}`,
    ipAddress,
    userAgent,
  });

  // Revalidación de caché en la capa web/controlador
  // Obtenemos los detalles de la inscripción vinculada para saber el slug
  const context = await PaymentService.getPaymentCheckoutContext(paymentUserIdOrSimulated(result.payment.userId), result.payment.registrationId);
  revalidatePath(`/events/${context.event.slug}`);
  revalidatePath("/organizer/payments");
  revalidatePath("/admin/payments");
  revalidatePath("/member/payments");

  return result;
}

// Función auxiliar para tipado seguro/compatibilidad
function paymentUserIdOrSimulated(id: string | null): string {
  return id ?? "";
}

/**
 * Controller Server Action: Obtiene los pagos del usuario logueado.
 */
export async function getUserPayments() {
  const { user } = await requireAuthWithHeaders();

  return PaymentService.getUserPayments(user.id);
}

/**
 * Controller Server Action: Obtiene los pagos de los eventos del organizador.
 */
export async function getOrganizerPayments() {
  const { user } = await requireOrganizerOrHigherWithHeaders();

  return PaymentService.getOrganizerPayments(user.id);
}

/**
 * Controller Server Action: Obtiene todos los pagos (Admin).
 */
export async function getAdminPayments() {
  const { user } = await requireAdminOrHigherWithHeaders();
  const scope = await resolveAdminScopeForUser(user.id, user.role);

  return PaymentService.getAdminPayments(scope);
}

/**
 * Controller Server Action: Obtiene pagos paginados para administración.
 */
export async function getAdminPaymentsPaginated(page = 1, limit = 10) {
  const { user } = await requireAdminOrHigherWithHeaders();
  const scope = await resolveAdminScopeForUser(user.id, user.role);

  return PaymentService.getAdminPaymentsPaginated(scope, page, limit);
}
