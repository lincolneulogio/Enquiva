"use server";

import { requireSuperAdmin } from "./users";
import { getSystemSettings, saveSystemSettings, describeSettingsChanges, type SystemSettings } from "@/lib/settings";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { wrapInTemplate } from "@/lib/mail/templates";
import { appendEmailBrandLogoAttachment } from "@/lib/mail/brand-header";
import { transporter, sender } from "@/lib/mail/transporter";
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import { BRAND } from "@/lib/brand";

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
    return { success: true, settings: updated };
}

/**
 * Server action to test the SMTP transporter connection.
 * Only accessible by Super Admins.
 */
export async function testMailConnectionAction() {
    await requireSuperAdmin();
    
    try {
        const start = Date.now();
        await transporter.verify();
        const duration = Date.now() - start;
        
        return { 
            success: true, 
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            latencyMs: duration
        };
    } catch (error: any) {
        return { 
            success: false, 
            error: error?.message ?? "Error desconocido al conectar con el servidor SMTP." 
        };
    }
}

/**
 * Server action to send a diagnostic test email.
 * Only accessible by Super Admins.
 */
export async function sendTestEmailAction(email: string) {
    const user = await requireSuperAdmin();
    const settings = await getSystemSettings();
    
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
                                <td style="padding: 4px 0; font-size: 13px; color: #0f172a; text-align: right;"><code>${env.SMTP_HOST}</code></td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: #64748b;"><strong>Puerto:</strong></td>
                                <td style="padding: 4px 0; font-size: 13px; color: #0f172a; text-align: right;"><code>${env.SMTP_PORT}</code></td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-size: 13px; color: #64748b;"><strong>Remitente:</strong></td>
                                <td style="padding: 4px 0; font-size: 13px; color: #0f172a; text-align: right;"><code>${env.MAIL_FROM_EMAIL}</code></td>
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
            `Correo de diagnóstico de ${BRAND.name}.`,
            settings.organizationName,
        );
        
        await transporter.sendMail({
            from: sender(),
            to: email,
            subject: `Prueba de correo SMTP — ${BRAND.name}`,
            text: `¡Hola ${user.name}! Este es un correo de prueba SMTP exitoso de la plataforma ${settings.organizationName}.`,
            html,
            attachments: appendEmailBrandLogoAttachment(),
        });
        
        const latencyMs = Date.now() - start;
        return { success: true, latencyMs };
    } catch (error: any) {
        return { 
            success: false, 
            error: error?.message ?? "Error desconocido al intentar enviar el correo de prueba." 
        };
    }
}
