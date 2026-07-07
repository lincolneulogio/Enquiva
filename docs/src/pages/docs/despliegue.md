---
title: "Guía de Despliegue"
description: "Desplegar Eventia en Vercel con PostgreSQL en Neon o Supabase."
layout: "../../layouts/DocLayout.astro"
---

El repositorio incluye CI (typecheck, tests, lint) pero **no** despliega automáticamente. Sigue estos pasos para publicar en producción.

---

## 1. Base de datos (Neon o Supabase)

### Neon (recomendado con Vercel)

1. Crea un proyecto en [neon.tech](https://neon.tech).
2. Copia la connection string (`postgresql://...?sslmode=require`).
3. En local, una vez: `pnpm run db:push` contra esa URL (o ejecuta migraciones) para crear tablas.
4. Tras el primer deploy: `pnpm run db:push` en la BD de producción (o desde CI). Inicializa roles desde superadmin y planes desde Admin → Planes.

### Supabase

1. Crea proyecto en [supabase.com](https://supabase.com).
2. Settings → Database → Connection string (URI).
3. Misma lógica: `db:push` o migraciones contra la URL remota.

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
2. Verifica correo OTP con SMTP de producción.
3. Revisa logs de Vercel tras el primer cron.
4. Configura dominio personalizado en Vercel.
5. Comprueba salud: `GET https://tudominio.com/api/health`

---

## 5. Deploy automático (GitHub Actions)

El workflow `.github/workflows/deploy.yml` ejecuta typecheck, tests y despliega a Vercel en push a `main`.

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
