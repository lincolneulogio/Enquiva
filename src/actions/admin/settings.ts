"use server";

import { requireSuperAdmin } from "./users";
import { getSystemSettings, saveSystemSettings, type SystemSettings } from "@/lib/settings";
import { transporter, sender } from "@/lib/mail/transporter";
import { revalidatePath } from "next/cache";
import { env } from "@/env";

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
    await requireSuperAdmin();
    const updated = await saveSystemSettings(settings);
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
        
        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <title>Prueba de Correo SMTP</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 40px 10px; background-color: #faf9ff; font-family: 'Outfit', sans-serif;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(75, 26, 181, 0.05); border: 1px solid rgba(75, 26, 181, 0.08);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #4b1ab5 0%, #eb2e7a 100%); padding: 30px; text-align: center; color: #ffffff;">
                            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🧪</span>
                            <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Diagnóstico del Servidor SMTP</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px; color: #334155;">
                            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; font-weight: 500;">
                                ¡Hola, <strong>${user.name}</strong>!
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                                Este es un correo de prueba enviado desde el panel de diagnóstico de <strong>${settings.organizationName}</strong>. Si estás leyendo esto, significa que tu servidor SMTP de Nodemailer está correctamente configurado y listo para despachar correos en tiempo real.
                            </p>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; padding: 16px;">
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
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                    &copy; ${new Date().getFullYear()} ${settings.organizationName}. Todos los derechos reservados.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;
        
        await transporter.sendMail({
            from: sender(),
            to: email,
            subject: `🧪 Test de Correo SMTP — ${settings.organizationName}`,
            text: `¡Hola ${user.name}! Este es un correo de prueba SMTP exitoso de la plataforma ${settings.organizationName}.`,
            html
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
