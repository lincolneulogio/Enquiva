"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizerOrHigherWithHeaders } from "@/lib/auth/guards";
import { authorize } from "@/lib/auth/authorize";
import { loadPaymentAuthResource } from "@/lib/auth/load-resource";
import { CulqiRefundService } from "@/lib/culqi/refund.service";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";

export async function initiatePaymentRefund(input: {
  paymentId: string;
  amount?: number;
  reason?: string;
}) {
  const { user } = await requireOrganizerOrHigherWithHeaders();
  await authorize({
    user,
    permissions: ["payments:update:own", "payments:update:org"],
    resource: await loadPaymentAuthResource(input.paymentId),
  });

  const result = await CulqiRefundService.initiateRefund({
    actorId: user.id,
    actorRole: user.role ?? "member",
    paymentId: input.paymentId,
    amount: input.amount,
    reason: input.reason,
  });

  revalidatePath("/organizer/payments");
  revalidatePath("/admin/payments");
  revalidatePath("/superadmin/payments");
  await broadcastTableRefresh({ resource: "payments", userId: user.id });
  return result;
}
