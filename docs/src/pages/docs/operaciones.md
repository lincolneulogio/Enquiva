---
title: "Operaciones y Secretos"
description: "Rotación de secretos, correo en producción y tareas operativas."
layout: "../../layouts/DocLayout.astro"
---

---

## Secretos obligatorios

| Secreto | Uso | Rotación |
|---------|-----|----------|
| `BETTER_AUTH_SECRET` | Sesiones y tokens de better-auth | Invalida sesiones activas al rotar |
| `TICKET_SIGNING_KEY` | Firmas QR de tickets | Tickets emitidos antes de rotar pueden fallar validación |
| `CRON_SECRET` | Protege `/api/cron/*` | Actualizar en Vercel y en pruebas manuales |
| `DATABASE_URL` | Acceso a Postgres | Rotar credenciales en Neon/Supabase y actualizar Vercel |
| `SMTP_PASS` | Envío de correo | Depende del proveedor (API key) |

### Procedimiento de rotación

1. Genera un valor nuevo (`openssl rand -base64 32` para secrets de 32+ chars).
2. Añade el nuevo valor en Vercel (Production).
3. Redeploy o espera la próxima invocación serverless.
4. Para `TICKET_SIGNING_KEY`: planifica ventana de mantenimiento; los tickets ya emitidos pueden requerir reemisión.
5. Revoca el valor anterior en el proveedor si aplica.

`CRON_SECRET` es **obligatorio** cuando `NODE_ENV=production` (validado en `src/env.ts`).

---

## Correo transaccional

Desarrollo usa **Mailtrap** (sandbox). En producción configura SMTP real:

### Resend

```env
SMTP_HOST="smtp.resend.com"
SMTP_PORT=465
SMTP_USER="resend"
SMTP_PASS="re_xxxxxxxx"
MAIL_FROM_EMAIL="noreply@tudominio.com"
MAIL_FROM_NAME="Eventia"
```

### SendGrid

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxxxxx"
```

Verifica dominio y registros SPF/DKIM en el panel del proveedor.

---

## Backups

| Método | Cuándo usar |
|--------|-------------|
| Backups del proveedor (Neon/Supabase) | Principal en producción |
| `pnpm run db:backup` | Export JSON local o desde máquina con acceso a BD |
| Panel super admin → Exportar BD | Descarga JSON desde la UI |
| `/api/cron/backup` | Health check semanal + conteos en logs de Vercel |

Los archivos en `backups/` están en `.gitignore` — no los subas a Git.

---

## Monitoreo recomendado

- Logs de Vercel para errores 5xx en crons.
- Alertas del proveedor de Postgres (cuota, conexiones).
- Upstash Redis para rate limiting.
