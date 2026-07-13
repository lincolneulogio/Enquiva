"use server";

import { requireSuperAdmin } from "./users";
import { assertPermission } from "@/lib/auth/permission-guards";
import {
    getSystemSettings,
    saveSystemSettings,
    saveSmtpSettings,
    describeSettingsChanges,
    type SystemSettings,
    type SmtpSettingsInput,
} from "@/lib/settings";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { wrapInTemplate } from "@/lib/mail/templates";
import { appendEmailBrandLogoAttachment } from "@/lib/mail/brand-header";
import {
    getMailTransporter,
    getMailSender,
    getResolvedMailPublicInfo,
} from "@/lib/mail/transporter";
import { revalidatePath } from "next/cache";

/**
 * Server action to get the current system settings.
 * Accessible by authenticated admins/super_admins.
 */
export async function getSystemSettingsAction() {
    await requireSuperAdmin();
    return await getSystemSettings();
}

/**
 * Server action to save system settings.
 * Only accessible by Super Admins.
 */
export async function saveSystemSettingsAction(settings: Partial<SystemSettings>) {
    const user = await requireSuperAdmin();
    await assertPermission(user, "settings:manage");
    const before = await getSystemSettings();
    const updated = await saveSystemSettings(settings, {
        id: user.id,
        name: user.name ?? user.email,
    });

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "settings.update",
        entityType: "settings",
        entityId: "platform",
        details: describeSettingsChanges(before, updated),
    });

    revalidatePath("/admin/settings");
    revalidatePath("/superadmin/settings");
    revalidatePath("/", "layout");
    return { success: true, settings: updated };
}

/** Guarda credenciales SMTP editables (override de .env). */
export async function saveSmtpSettingsAction(input: SmtpSettingsInput) {
    const user = await requireSuperAdmin();
    await assertPermission(user, "settings:manage");
    const before = await getSystemSettings();

    const updated = await saveSmtpSettings(input, {
        id: user.id,
        name: user.name ?? user.email,
    });

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "settings.update",
        entityType: "settings",
        entityId: "platform-smtp",
        details: describeSettingsChanges(before, updated) + (input.smtpPassword?.trim() ? "; smtpPassword: (actualizada)" : ""),
    });

    revalidatePath("/admin/settings");
    revalidatePath("/superadmin/settings");
    return { success: true, settings: updated };
}

/**
 * Server action to test the SMTP transporter connection.
 * Only accessible by Super Admins.
 */
export async function testMailConnectionAction() {
    const user = await requireSuperAdmin();
    await assertPermission(user, "settings:manage");

    try {
        const start = Date.now();
        const transporter = await getMailTransporter();
        await transporter.verify();
        const info = await getResolvedMailPublicInfo();
        const duration = Date.now() - start;

        return {
            success: true,
            host: info.host,
            port: info.port,
            source: info.source,
            latencyMs: duration,
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido al conectar con el servidor SMTP.",
        };
    }
}

/**
 * Server action to send a diagnostic test email.
 * Only accessible by Super Admins.
 */
export async function sendTestEmailAction(email: string) {
    const user = await requireSuperAdmin();
    await assertPermission(user, "settings:manage");
    const settings = await getSystemSettings();
    const mailInfo = await getResolvedMailPublicInfo();

    try {
        const start = Date.now();

        const greeting = user.name ? `Hola ${user.name},` : "Hola,";
        const bodyHtml = `
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #475569; font-family: 'Outfit', sans-serif;">
                Este es un correo de prueba enviado desde el panel de diagnóstico de <strong>${settings.organizationName}</strong>.
                Si estás leyendo esto, tu servidor SMTP está correctamente configurado.
            </p>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-top: 8px;">
                <tr>
                    <td style="padding: 16px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: #64748b;"><strong>Servidor SMTP:</strong></td>
                                <td style="padding: 4px 0; font-size: 13px; color: #0f172a; text-align: right;"><code>${mailInfo.host}</code></td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: #64748b;"><strong>Puerto:</strong></td>
                                <td style="padding: 4px 0; font-size: 13px; color: #0f172a; text-align: right;"><code>${mailInfo.port}</code></td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: #64748b;"><strong>Remitente:</strong></td>
                                <td style="padding: 4px 0; font-size: 13px; color: #0f172a; text-align: right;"><code>${mailInfo.fromEmail}</code></td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: #64748b;"><strong>Origen config:</strong></td>
                                <td style="padding: 4px 0; font-size: 13px; color: #0f172a; text-align: right;"><code>${mailInfo.source}</code></td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        `;

        const html = wrapInTemplate(
            "Prueba de correo SMTP",
            greeting,
            bodyHtml,
            `Correo de diagnóstico de ${settings.organizationName}. Soporte: ${settings.supportEmail}`,
            settings.organizationName,
        );

        const transporter = await getMailTransporter();
        await transporter.sendMail({
            from: await getMailSender(),
            to: email,
            subject: `Prueba de correo SMTP — ${settings.organizationName}`,
            text: `¡Hola ${user.name}! Este es un correo de prueba SMTP exitoso de la plataforma ${settings.organizationName}. Soporte: ${settings.supportEmail}`,
            html,
            attachments: appendEmailBrandLogoAttachment(),
        });

        const latencyMs = Date.now() - start;
        return { success: true, latencyMs };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido al intentar enviar el correo de prueba.",
        };
    }
}
