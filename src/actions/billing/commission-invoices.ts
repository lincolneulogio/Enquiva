"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { assertPermission } from "@/lib/auth/permission-guards";
import { CommissionInvoiceService } from "@/lib/billing/commission-invoice.service";

export async function issueCommissionInvoice(input: {
  organizerId: string;
  notes?: string;
  sendEmail?: boolean;
}) {
  const user = await requireSuperAdmin();
  await assertPermission(user, "platform:billing:view");

  const invoice = await CommissionInvoiceService.issueForOrganizer({
    organizerId: input.organizerId,
    createdBy: user.id,
    notes: input.notes,
    sendEmail: input.sendEmail,
  });

  revalidatePath("/superadmin/billing");
  return { success: true as const, invoice };
}

export async function markCommissionInvoicePaid(invoiceId: string) {
  const user = await requireSuperAdmin();
  await assertPermission(user, "platform:billing:view");

  const invoice = await CommissionInvoiceService.markPaid(invoiceId);
  revalidatePath("/superadmin/billing");
  return { success: true as const, invoice };
}

export async function listCommissionInvoices() {
  const user = await requireSuperAdmin();
  await assertPermission(user, "platform:billing:view");
  return CommissionInvoiceService.listRecent();
}
