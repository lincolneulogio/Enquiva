---
title: "Inventario de Módulos"
description: "Mapa completo de Evora: pantallas, APIs, estado y mejoras."
layout: "../../layouts/DocLayout.astro"
---

Resumen técnico del ecosistema **Evora** (actualizado desde el código, modelo Culqi-first).

| Métrica | Cantidad |
|---------|----------|
| Pantallas (`page.tsx`) | ~90 |
| Tablas PostgreSQL | 30+ |
| Rutas API | 20+ (`/api/health` incluido) |

---

## 1. Público / marketing

- **Home** — landing, carrusel destacados, eventos próximos
- **Catálogo** — `/events`, filtros, búsqueda, categorías
- **Detalle** — `/events/[slug]`, inscripción
- **Checkout** — `/checkout/[registrationId]` (cualquier rol autenticado)
- **Asistente (staff)** — `/attendee/tickets`, `/attendee/payments`
- **Docs** — portal Astro en `/docs`

## 2. Autenticación y cuentas

- Login, registro (tabs), OTP, reset password
- Roles: `super_admin`, `admin`, `organizer`, `member`
- Perfil, avatar, RBAC granular

## 3. Eventos

- CRUD, categorías, portadas (`EventCoverFrame`), adjuntos
- Cron: eventos pasados → `completed`

## 4. Inscripciones y tickets

- Registrations (titular + invitados vía `parent_registration_id`), waitlist
- Tickets QR firmados, scanner, `/ticket/[code]`

## 5. Pagos (Culqi-first)

- **Primario:** Culqi en `/checkout/[registrationId]` (tarjeta, Yape y billeteras vía pasarela)
- **Efectivo:** pago en puerta + aprobación del organizador
- **Legacy residual:** Yape/Plin manual solo si aún están vinculados al evento (no se crean nuevos)
- Métodos: Culqi **organizador** (eventos) ≠ Culqi **plataforma** (planes SaaS)
- Planes/suscripciones: cobro automática vía Culqi (`/organizer/billing`, `/admin/plan`)

## 6. Transporte

- Rutas, paradas, reservas, paneles admin/organizer

## 7. Organizaciones

- Entidades, invite code, onboarding, equipo, scope por org

## 8. Planes y billing SaaS

- Planes, suscripciones, renovaciones (cron + Culqi), UI billing
- Features de plan: Culqi, transporte, IA, exports (branding personalizado reservado / no vendido aún)

## 9. Comunicaciones

- Notificaciones in-app (Pusher), broadcasts (lotes configurables), SMTP
- Web push opcional (requiere VAPID); sin claves se muestra aviso claro

## 10. Admin / operaciones

- Paneles superadmin, admin, organizer, member
- Auditoría, analytics (vistas reales; sin tráfico inventado), exportaciones, backup JSON
- Mantenimiento programado + banner de anuncio

## 11. IA y extras

- IA Copilot (paths actualizados a Culqi + `/checkout` + `/attendee`), i18n ES/EN, Redis, Uploadthing, Docker, CI, crons Vercel

---

## Estado: firmes

| Área | Notas |
|------|--------|
| Auth + OTP + roles | better-auth, guards, registro organizador |
| Eventos públicos | Listado, detalle, portadas |
| Inscripciones + QR | Flujo completo; invitados con FK |
| Scanner | Check-in en puerta |
| **Pagos Culqi + cash** | Checkout neutral; legacy residual opcional |
| Organizaciones | Invite, compartir, unirse desde panel |
| Paneles por rol | `/superadmin`, `/admin`, `/organizer`, `/member`, `/attendee` |
| Infra docs | Local vs prod, deploy, backup, CI pnpm |

---

## Pendiente (roadmap)

**Alta:** SMTP Resend/SendGrid en prod, verificar crons en Vercel, Culqi en vivo, secrets deploy.

**Media:** branding por organización (feature de plan), analytics de vistas más rico.

**Baja:** videotutoriales con video real (hoy placeholder “Próximamente”), push VAPID en todos los entornos.

---

Ver también: [Despliegue](/docs/despliegue) · [Operaciones](/docs/operaciones) · [Local vs Producción](/docs/datos-local-vs-produccion)
