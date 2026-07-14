"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizerOrHigherWithHeaders } from "@/lib/auth/guards";
import { assertAnyPermission } from "@/lib/auth/permission-guards";
import { CulqiRefundService } from "@/lib/culqi/refund.service";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";

export async function initiatePaymentRefund(input: {
  paymentId: string;
  amount?: number;
  reason?: string;
}) {
  const { user } = await requireOrganizerOrHigherWithHeaders();
  await assertAnyPermission(user, ["payments:update:own", "payments:update:any"]);

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
