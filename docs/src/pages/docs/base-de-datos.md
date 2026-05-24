---
title: "Esquema de Base de Datos"
description: "Modelado relacional y estructuración de tablas mediante Drizzle ORM."
layout: "../../layouts/DocLayout.astro"
---

La plataforma EncuentroDeFe utiliza **PostgreSQL** administrado a través de **Drizzle ORM** para garantizar un tipado estricto (Type-Safety) desde la base de datos hasta el cliente React.

A continuación, se detalla la arquitectura de las entidades principales del ecosistema.

---

## 🏗️ Entidades Principales

El esquema se divide en tres dominios lógicos: **Autenticación**, **Transacciones** y **Logística**.

### 1. Dominio de Autenticación (`users`, `sessions`)
Manejado primariamente por `better-auth`, estas tablas almacenan la identidad y los tokens de sesión.

* **`user`**: Tabla central. Almacena `id`, `name`, `email`, `role` (Admin, Organizer, User) y `phoneNumber`.
* **`session`**: Almacena los tokens activos, fecha de expiración, IP del dispositivo e ID del usuario.

### 2. Dominio de Transacciones (`payments`, `registrations`)
El núcleo financiero de la plataforma.

* **`registrations`**: Representa la intención de asistir a un evento.
  * `status`: Puede ser `pending`, `approved`, o `rejected`.
  * `ticketNumber`: Un hash único generado al aprobarse.
* **`payments`**: Comprobantes de Yape o Plin.
  * `amount`: Valor decimal para cálculos precisos.
  * `receiptUrl`: Enlace a la imagen alojada en Uploadthing.
  * `operationNumber`: El número de celular o código de operación para evitar pagos duplicados.

### 3. Dominio de Logística (`transport_routes`, `transport_bookings`)
Gestión de cupos y movilidad hacia el evento.

* **`transport_routes`**: Las diferentes líneas de autobuses (ej. "Ruta Norte", "Ruta Sur"). Define la `capacity` máxima y el `departureTime`.
* **`transport_bookings`**: Relación Muchos-a-Muchos entre `users` y `transport_routes`. Cuando se crea, resta `-1` a la capacidad de la ruta correspondiente.

---

## 🗄️ Ejemplo de Relación Drizzle

Drizzle nos permite definir relaciones exactas. Por ejemplo, así se ve la relación entre un Pago y un Usuario en nuestro esquema:

```typescript
// schema.ts
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  receiptUrl: text('receipt_url').notNull(),
  status: paymentEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));
```

> [!TIP]
> Cualquier cambio que realices en el archivo `schema.ts` debe ir acompañado de una migración. Usa `npm run db:generate` seguido de `npm run db:push` para aplicar los cambios.
