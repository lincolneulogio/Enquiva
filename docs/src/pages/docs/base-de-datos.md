---
title: "Esquema de Base de Datos"
description: "Modelado relacional, tablas Drizzle ORM y respaldos del sistema."
layout: "../../layouts/DocLayout.astro"
---

La plataforma Evora utiliza **PostgreSQL** administrado a través de **Drizzle ORM** para garantizar tipado estricto desde la base de datos hasta el cliente React.

---

## Resumen (~30 tablas)

| Dominio | Tablas |
|---------|--------|
| **Cuentas y auth** | `users`, `sessions`, `accounts`, `verifications` |
| **Roles** | `roles`, `role_permissions` |
| **Organizaciones** | `organizations`, `organization_members` |
| **Eventos** | `events`, `event_attachments`, `categories` |
| **Inscripciones** | `registrations`, `notifications`, `tickets`, `ticket_scan_logs` |
| **Pagos** | `payments`, `payment_methods`, `event_payment_methods` |
| **Transporte** | `transport_routes`, `transport_stops`, `transport_bookings` |
| **Facturación** | `plans`, `subscriptions`, `subscription_payments`, `platform_transactions` |
| **Logs y notificaciones** | `activity_logs`, `broadcast_logs`, `broadcast_jobs`, `push_subscriptions` |
| **Plataforma** | `platform_settings` |

Definiciones en `src/lib/db/schema/`.

---

## Entidades principales

### `users`
Perfil central: `email`, `role` (super_admin, admin, organizer, member), `organizationId`, `phone`, OTP (`emailVerified`), etc.

### `events`
Eventos con `organizerId`, `organizationId`, `slug`, fechas, `status` (draft, published, cancelled, completed), `price`, `hasTransport`, `viewCount`.

### `registrations` / `tickets`
Inscripción usuario-evento; tickets con firma criptográfica (`TICKET_SIGNING_KEY`) y logs de escaneo.

### `organizations`
Entidades multi-tenant con `inviteCode` para que organizadores se unan desde registro o panel.

### `subscriptions` / `plans`
Planes SaaS por organizador o entidad; renovaciones vía cron `/api/cron/subscriptions`.

---

## Relaciones Drizzle

```typescript
export const paymentsRelations = relations(payments, ({ one }) => ({
  registration: one(registrations, {
    fields: [payments.registrationId],
    references: [registrations.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));
```

---

## Export y backup JSON (v2.0)

`exportFullDatabase` (panel super admin y `pnpm run db:backup`) incluye **todas** las tablas listadas arriba.

```json
{
  "timestamp": "2026-07-06T12:00:00.000Z",
  "version": "2.0",
  "data": {
    "users": [],
    "events": [],
    "organizations": []
  }
}
```

Implementación: `src/lib/db/export-full-database.ts`.

---

## Migraciones

Ver [Estrategia de migraciones](/docs/migraciones) para `db:push` y `db:migrate`.
