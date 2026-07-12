---
title: "Guía de Despliegue"
description: "Desplegar Evora en Vercel con PostgreSQL en Neon o Supabase."
layout: "../../layouts/DocLayout.astro"
---

El repositorio incluye CI (typecheck, lint) pero **no** despliega automáticamente. Sigue estos pasos para publicar en producción.

---

## 1. Base de datos (Neon o Supabase)

### Neon (recomendado con Vercel)

1. Crea un proyecto en [neon.tech](https://neon.tech).
2. Copia la connection string (`postgresql://...?sslmode=require`).
3. En local, una vez: `pnpm run db:migrate` contra esa URL para crear/actualizar tablas (fuente de verdad: `drizzle/`).
4. Tras el primer deploy: `pnpm run db:migrate` y `pnpm run db:sync:plans` en la BD de producción (sincroniza Free/Pro/Enterprise, incluido `feature_culqi`). También puedes abrir Admin → Planes (dispara el mismo upsert).

> **Gate pre-prod:** en staging corre `pnpm run staging:gate` (seed + smoke registro→pago→QR→check-in). Ver [Staging pre-producción](/docs/staging-pre-prod).

### Supabase

1. Crea proyecto en [supabase.com](https://supabase.com).
2. Settings → Database → Connection string (URI).
3. Misma lógica: `pnpm run db:migrate` contra la URL remota.

> Neon y Supabase incluyen **backups automáticos**. Actívalos en el panel del proveedor.

---

## 2. Vercel

1. Importa el repo en [vercel.com](https://vercel.com).
2. Framework: **Next.js** (detectado automáticamente).
3. Build: `pnpm run build` · Install: `pnpm install`.
4. Añade todas las variables de `.env.example` en **Settings → Environment Variables**.

### Variables críticas en producción

| Variable | Notas |
|----------|--------|
| `DATABASE_URL` | Postgres remoto (SSL) |
| `BETTER_AUTH_SECRET` | ≥32 caracteres, único por entorno |
| `TICKET_SIGNING_KEY` | ≥32 caracteres, único por entorno |
| `CRON_SECRET` | **Obligatorio** en producción (≥16 caracteres) |
| `NEXT_PUBLIC_APP_URL` | `https://tudominio.com` |
| SMTP | Resend, SendGrid o similar (no Mailtrap) |
| `CULQI_SECRET_KEY` / `NEXT_PUBLIC_CULQI_PUBLIC_KEY` | Cobros de **licencias** (plataforma). Distintos a las llaves del organizador. |
| `CULQI_WEBHOOK_SECRET` | Firma del webhook `/api/webhooks/culqi` (obligatorio en prod si Culqi está activo) |

---

## 3. Crons en producción

El archivo `vercel.json` en la raíz programa:

| Ruta | Horario (UTC) | Función |
|------|---------------|---------|
| `/api/cron/events` | 03:00 diario | Marcar eventos pasados como completados |
| `/api/cron/subscriptions` | 04:00 diario | Renovaciones y ciclo de planes |
| `/api/cron/broadcasts` | Cada 15 min | Cola de emails masivos |
| `/api/cron/backup` | 05:00 domingos | Verificación y conteo de tablas |

Vercel envía `Authorization: Bearer <CRON_SECRET>` en las invocaciones programadas.

Prueba manual:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" https://tudominio.com/api/cron/events
```

---

## 4. Post-deploy

1. Registra el primer super admin (flujo de registro + asignación de rol `super_admin` en BD o botón **Inicializar roles** en superadmin).
2. `pnpm run db:sync:plans` (o Admin → Planes) para asegurar `feature_culqi` en Free/Pro/Enterprise.
3. Activa Culqi de plataforma en **Admin → Medios de pago** (cobros de suscripción).
4. Verifica correo OTP con SMTP de producción.
5. Revisa logs de Vercel: busca el prefijo `[culqi]` en fallos de orden/confirm/webhook.
6. Configura dominio personalizado en Vercel.
7. Comprueba salud: `GET https://tudominio.com/api/health`

---

## 5. Deploy automático (GitHub Actions)

El workflow `.github/workflows/deploy.yml` ejecuta typecheck y despliega a Vercel en push a `main`.

Secrets requeridos en GitHub → Settings → Secrets:

| Secret | Dónde obtenerlo |
|--------|-----------------|
| `VERCEL_TOKEN` | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | Vercel → Project → Settings → General |
| `VERCEL_PROJECT_ID` | Idem |

Si prefieres deploy solo desde el dashboard de Vercel, puedes desactivar este workflow.

---

## 6. Documentación (opcional)

El sitio Astro en `/docs` puede desplegarse por separado o servirse en `NEXT_PUBLIC_DOCS_URL`.
