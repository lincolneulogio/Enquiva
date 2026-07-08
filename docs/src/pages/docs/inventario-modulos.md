---
title: "Inventario de Módulos"
description: "Mapa completo de Evora: pantallas, APIs, estado y mejoras."
layout: "../../layouts/DocLayout.astro"
---

Resumen técnico del ecosistema **Evora** (actualizado desde el código).

| Métrica | Cantidad |
|---------|----------|
| Pantallas (`page.tsx`) | ~88 |
| Tablas PostgreSQL | 30 |
| Rutas API | 20 (`/api/health` incluido) |

---

## 1. Público / marketing

- **Home** — landing, carrusel destacados, eventos próximos
- **Catálogo** — `/events`, filtros, búsqueda, categorías
- **Detalle** — `/events/[slug]`, inscripción
- **Docs** — portal Astro en `/docs`

## 2. Autenticación y cuentas

- Login, registro (tabs), OTP, reset password
- Roles: `super_admin`, `admin`, `organizer`, `member`
- Perfil, avatar, RBAC granular

## 3. Eventos

- CRUD, categorías, portadas (`EventCoverFrame`), adjuntos
- Cron: eventos pasados → `completed`

## 4. Inscripciones y tickets

- Registrations, waitlist, tickets QR firmados, scanner, `/ticket/[code]`

## 5. Pagos

- Manual (Yape/Plin/efectivo), métodos por organizador, Culqi (opcional), auditoría

## 6. Transporte

- Rutas, paradas, reservas, paneles admin/organizer

## 7. Organizaciones

- Entidades, invite code, onboarding, equipo, scope por org

## 8. Planes y billing SaaS

- Planes, suscripciones, renovaciones (cron + Culqi), UI billing

## 9. Comunicaciones

- Notificaciones in-app (Pusher), broadcasts (lotes configurables), SMTP

## 10. Admin / operaciones

- Paneles superadmin, admin, organizer, member
- Auditoría, analytics, exportaciones, backup JSON v2.0

## 11. IA y extras

- IA Copilot, i18n ES/EN, Redis, Uploadthing, Docker, CI, crons Vercel

---

## Estado: firmes

| Área | Notas |
|------|--------|
| Auth + OTP + roles | better-auth, guards, registro organizador |
| Eventos públicos | Listado, detalle, portadas sin recorte |
| Inscripciones + QR | Flujo completo |
| Scanner | Check-in en puerta |
| Pagos manuales | Comprobante + aprobación |
| Organizaciones | Invite, compartir, unirse desde panel |
| Paneles por rol | `/superadmin`, `/admin`, `/organizer`, `/member` |
| Infra docs | Local vs prod, deploy, backup, CI pnpm 11 |

---

## Mejoras implementadas recientemente

- Carrusel **destacados** en home (estilo Joinnus)
- Tarjetas sin **fecha duplicada** en meta
- Onboarding organizador ampliado (4 pasos)
- `/api/health` — chequeo BD, mail, crons
- Workflow **Deploy** en GitHub Actions (requiere secrets Vercel)
- `BROADCAST_BATCH_SIZE` configurable
- Validación mail producción (alerta si Mailtrap)
- Tests: broadcasts, billing renewal, mail config
- **E2E Playwright** — registro, login, inscripción, pagos (`pnpm test:e2e`)

---

## Pendiente (roadmap)

**Alta:** SMTP Resend/SendGrid en prod, verificar crons en Vercel, Culqi en vivo, secrets deploy en GitHub.

**Media:** más tests E2E, migraciones unificadas, analytics ampliado, IA Copilot por plan.

**Baja:** transporte móvil, videotutoriales con video real, push notifications.

---

Ver también: [Despliegue](/docs/despliegue) · [Operaciones](/docs/operaciones) · [Local vs Producción](/docs/datos-local-vs-produccion)
