"use server";

import { db } from "@/lib/db";
import { newsletterSubscribers, type NewsletterSubscriber } from "@/lib/db/schema/marketing";
import { users } from "@/lib/db/schema/auth";
import { eq, and, ilike, desc, count, inArray, type SQL } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { wrapInTemplate } from "@/lib/mail/templates";
import {
  getMailTransporter,
  getMailSender,
  resolveMailConfig,
} from "@/lib/mail/transporter";
import { isResendConfig, sendMailViaResendApi } from "@/lib/mail/resend-sender";

export type NewsletterStats = {
  total: number;
  active: number;
  unsubscribed: number;
};

export type GetSubscribersResult = {
  subscribers: NewsletterSubscriber[];
  total: number;
  totalPages: number;
  stats: NewsletterStats;
};

export async function getAdminNewsletterSubscribersAction(params?: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<GetSubscribersResult> {
  await requireSuperAdmin();

  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params?.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];

  if (params?.search && params.search.trim()) {
    conditions.push(ilike(newsletterSubscribers.email, `%${params.search.trim()}%`));
  }

  if (params?.status && params.status !== "all") {
    conditions.push(eq(newsletterSubscribers.status, params.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalFilteredRes, allStatsRes, subscribers] = await Promise.all([
    db.select({ count: count() }).from(newsletterSubscribers).where(whereClause),
    db.select({
      status: newsletterSubscribers.status,
      count: count(),
    }).from(newsletterSubscribers).groupBy(newsletterSubscribers.status),
    db
      .select()
      .from(newsletterSubscribers)
      .where(whereClause)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const totalFiltered = Number(totalFilteredRes[0]?.count ?? 0);
  let totalActive = 0;
  let totalUnsubscribed = 0;
  let grandTotal = 0;

  for (const s of allStatsRes) {
    const c = Number(s.count);
    grandTotal += c;
    if (s.status === "active") totalActive += c;
    else if (s.status === "unsubscribed") totalUnsubscribed += c;
  }

  return {
    subscribers,
    total: totalFiltered,
    totalPages: Math.max(1, Math.ceil(totalFiltered / pageSize)),
    stats: {
      total: grandTotal,
      active: totalActive,
      unsubscribed: totalUnsubscribed,
    },
  };
}

export async function toggleSubscriberStatusAction(id: string, status: "active" | "unsubscribed") {
  await requireSuperAdmin();

  await db
    .update(newsletterSubscribers)
    .set({ status, updatedAt: new Date() })
    .where(eq(newsletterSubscribers.id, id));

  revalidatePath("/superadmin/newsletter");
  return { success: true, status };
}

export async function deleteSubscriberAction(id: string) {
  await requireSuperAdmin();

  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));

  revalidatePath("/superadmin/newsletter");
  return { success: true };
}

export async function exportNewsletterSubscribersCsvAction(): Promise<string> {
  await requireSuperAdmin();

  const allSubscribers = await db
    .select()
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.createdAt));

  const headers = ["ID", "Email", "Estado", "Origen", "Fecha de Registro"];
  const rows = allSubscribers.map((s) => [
    s.id,
    `"${s.email.replace(/"/g, '""')}"`,
    s.status,
    s.source,
    `"${s.createdAt.toISOString()}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// ─── Helpers privados para el broadcast personalizado ─────────────────────────

/** Extrae el primer nombre de un nombre completo, o usa la parte local del email como fallback */
function extractFirstName(fullName: string | null | undefined, email: string): string {
  if (fullName?.trim()) {
    return fullName.trim().split(" ")[0];
  }
  return email.split("@")[0];
}

/** Construye el HTML completo del boletín personalizado para un suscriptor */
function buildNewsletterHtml(
  subject: string,
  recipientFirstName: string,
  sanitizedMessage: string,
  imageUrl?: string,
): string {
  const greeting = `Hola, <strong>${recipientFirstName}</strong>:`;

  const imageBlock = imageUrl
    ? `
    <!-- Featured image -->
    <div style="margin-bottom: 24px; border-radius: 14px; overflow: hidden; line-height: 0;">
      <img src="${imageUrl}" alt="Imagen del comunicado" width="100%" style="display: block; width: 100%; max-width: 600px; height: auto; border-radius: 14px;" />
    </div>
`
    : "";

  const body = `
    <!-- Announcement badge -->
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 1px solid rgba(109,40,217,0.15); border-radius: 100px; padding: 6px 16px; font-size: 11px; font-weight: 700; color: #5b21b6; text-transform: uppercase; letter-spacing: 1px; font-family: 'Outfit', sans-serif;">
        Comunicado Oficial
      </span>
    </div>

    <!-- Decorative divider -->
    <div style="height: 3px; background: linear-gradient(90deg, #4b1ab5 0%, #7c3aed 50%, #a78bfa 100%); border-radius: 4px; margin-bottom: 20px; opacity: 0.7;"></div>
${imageBlock}
    <!-- Message body -->
    <div style="font-size: 15px; color: #334155; line-height: 1.75; font-family: 'Outfit', sans-serif; white-space: pre-wrap; margin-bottom: 20px; word-break: break-word;">${sanitizedMessage}</div>

    <!-- Subtle bottom divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin-bottom: 20px;"></div>

    <!-- Community callout -->
    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%); border: 1px solid rgba(109,40,217,0.12); border-radius: 18px; padding: 16px 18px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-size: 13px; color: #5b21b6; line-height: 1.6; font-weight: 500; font-family: 'Outfit', sans-serif;">
            Mantente al tanto de todos los próximos eventos, novedades y ofertas exclusivas de <strong>Enquiva</strong>. ¡Gracias por ser parte de nuestra comunidad!
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapInTemplate(
    subject,
    greeting,
    body,
    "Recibes este correo porque te suscribiste al boletín de novedades de Enquiva. Si no deseas seguir recibiéndolo, responde este correo con el asunto \"Cancelar suscripción\".",
    "Enquiva"
  );
}

// ─── Acción principal ─────────────────────────────────────────────────────────

export async function sendNewsletterBroadcastAction(input: {
  subject: string;
  message: string;
  imageUrl?: string;
}): Promise<{ success: boolean; recipientCount: number; error?: string }> {
  await requireSuperAdmin();

  if (!input.subject.trim() || !input.message.trim()) {
    return { success: false, recipientCount: 0, error: "El asunto y el mensaje son requeridos." };
  }

  // 1. Obtener todos los suscriptores activos
  const activeSubscribers = await db
    .select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "active"));

  if (activeSubscribers.length === 0) {
    return { success: false, recipientCount: 0, error: "No hay suscriptores activos para enviar." };
  }

  try {
    const config = await resolveMailConfig();
    const sender = await getMailSender();

    // 2. Buscar nombres en la tabla users con una sola query (IN de emails)
    const emailList = activeSubscribers.map((s) => s.email);
    const registeredUsers = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(inArray(users.email, emailList));

    // Mapa O(1): email → nombre completo
    const nameByEmail = new Map<string, string>(
      registeredUsers.map((u) => [u.email, u.name])
    );

    // 3. Sanitizar el mensaje una sola vez (es idéntico para todos)
    const sanitizedMessage = input.message
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 4. Función de envío individual con nombre personalizado
    const sendOne = async (email: string): Promise<void> => {
      const firstName = extractFirstName(nameByEmail.get(email) ?? null, email);
      const html = buildNewsletterHtml(input.subject, firstName, sanitizedMessage, input.imageUrl);

      const mailOptions = {
        from: sender,
        to: email,
        subject: input.subject,
        html,
      };

      if (isResendConfig(config)) {
        await sendMailViaResendApi(config, mailOptions);
      } else {
        const transporter = await getMailTransporter();
        await transporter.sendMail(mailOptions);
      }
    };

    // 5. Enviar en lotes de 10 (concurrentes dentro del lote, secuenciales entre lotes)
    const BATCH_SIZE = 10;
    for (let i = 0; i < activeSubscribers.length; i += BATCH_SIZE) {
      const batch = activeSubscribers.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((s) => sendOne(s.email)));
    }

    return { success: true, recipientCount: activeSubscribers.length };
  } catch (error) {
    console.error("[newsletter-broadcast] Error sending personalized broadcast:", error);
    return {
      success: false,
      recipientCount: 0,
      error: error instanceof Error ? error.message : "Error al enviar el comunicado por correo.",
    };
  }
}
