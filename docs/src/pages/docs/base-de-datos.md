---
title: "Esquema de Base de Datos"
description: "Modelado relacional, estructuración de tablas mediante Drizzle ORM y respaldos del sistema."
layout: "../../layouts/DocLayout.astro"
---

La plataforma EncuentroDeFe utiliza **PostgreSQL** administrado a través de **Drizzle ORM** para garantizar un tipado estricto (Type-Safety) desde la base de datos hasta el cliente React.

A continuación, se detalla la arquitectura de las entidades principales del ecosistema y la estructura del motor de copias de seguridad.

---

## Esquema y Entidades Completas (11 Tablas)

El modelo relacional está compuesto por 11 tablas estrechamente vinculadas mediante claves foráneas y relaciones indexadas para velocidad máxima de consulta:

### 1. Dominio de Cuentas y Seguridad
* **`users`**: Almacena el perfil central de cada usuario. Atributos: `id` (PK), `name`, `email`, `phone`, `emailVerified` (OTP), `image` (avatar), `role` (super_admin, admin, organizer, member), `bio`, `isActive` (estado de cuenta), `lastSeenAt` y `createdAt`.
* **`sessions`**: Registro de tokens de sesión activos creados por `better-auth`. Atributos: `id`, `expiresAt`, `token`, `ipAddress`, `userAgent` y `userId` (FK).
* **`accounts`**: Vinculaciones OAuth o métodos de inicio de sesión adicionales.
* **`verifications`**: Almacena los tokens OTP temporales de 6 dígitos enviados por correo para registro o reinicio de contraseña.

### 2. Dominio de Permisos y Roles
* **`roles`**: Configuración dinámica de perfiles de usuario. Atributos: `name` (PK, ej: `super_admin`), `label`, `description`, `color` (mapeado visual) y `updatedAt`.
* **`role_permissions`**: Matriz de seguridad que controla los privilegios granulares. Atributos: `id` (PK), `roleName` (FK a `roles`), `permission` (ej: `events:create`), `allowed` (boolean), `updatedBy` (FK) y `updatedAt`.

### 3. Dominio de Eventos y Categorías
* **`events`**: Registro principal de eventos. Atributos: `id` (PK), `organizerId` (FK), `title`, `slug`, `description`, `coverImage`, `category`, `date`, `endDate`, `location`, `isVirtual`, `virtualLink`, `capacity`, `status` (draft, published, cancelled, completed), `isFeatured`, `price` y `hasTransport`.
* **`categories`**: Tabla administrativa de etiquetas de eventos. Atributos: `id`, `slug`, `label`, `description`, `colorClass`, `isActive`, `sortOrder`, `createdAt` y `createdBy` (FK).

### 4. Dominio de Inscripciones y Control de Acceso
* **`registrations`**: El ticket de inscripción que vincula un usuario con un evento. Atributos: `id` (PK), `eventId` (FK), `userId` (FK), `status` (registered, waitlisted, checked_in, cancelled), `contactPhone`, `qrCode`, `notes`, `registeredAt` y `checkedInAt`.
* **`tickets`**: Boleto digital final con firma criptográfica. Atributos: `id`, `registrationId` (FK), `code` (Unique), `qrCode` (URL/data), `signature`, `status` (active, used, cancelled), `issuedAt` y `checkedInAt`.
* **`ticket_scan_logs`**: Auditoría de escaneo de entradas en puerta. Atributos: `id`, `ticketId` (FK), `scannedBy` (FK), `ipAddress`, `userAgent`, `result` y `createdAt`.

### 5. Dominio Financiero y Métodos de Pago
* **`payments`**: Transacciones de pago consolidadas. Atributos: `id` (PK), `registrationId` (FK), `userId` (FK), `amount` (numeric), `transportBookingId` (FK opcional), `currency` (`PEN`), `method` (`yape`, `plin`, `cash`, `manual`), `reference`, `status` (pending, approved, rejected), `receiptUrl`, `receiptFileName`, `notes`, `verifiedBy` (FK), `verifiedAt`, `createdAt` y `updatedAt`.
* **`payment_methods`**: Cuentas receptoras Yape/Plin configuradas por los organizadores. Atributos: `id`, `type` (yape, plin, cash), `label`, `qrCodeUrl`, `phone`, `holderName` e `isActive`.
* **`event_payment_methods`**: Relación Muchos-a-Muchos que vincula qué medios de pago aplican a cada evento.

### 6. Dominio de Transporte y Logística
* **`transport_routes`**: Flotas de autobuses. Atributos: `id` (PK), `eventId` (FK), `name`, `departurePoint`, `departureTime`, `returnTime`, `pricePerSeat`, `totalSeats`, `description`, `isActive` y `createdAt`.
* **`transport_bookings`**: Reserva de asientos de transporte. Atributos: `id` (PK), `routeId` (FK), `registrationId` (FK), `userId` (FK), `seats` (cantidad de pasajes), `status` (pending, confirmed, cancelled), `notes` y `bookedAt`.

---

## Ejemplo de Relación Drizzle (Type-Safe)

Drizzle nos permite definir relaciones exactas y mapeos en cascada. Por ejemplo, así se definen las relaciones entre un Pago, una Inscripción, una Reserva y un Usuario:

```typescript
export const paymentsRelations = relations(payments, ({ one }) => ({
  registration: one(registrations, {
    fields: [payments.registrationId],
    references: [registrations.id],
  }),
  transportBooking: one(transportBookings, {
    fields: [payments.transportBookingId],
    references: [transportBookings.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));
```

---

## Formato de Respaldo de Base de Datos (Backup JSON)

El sistema de copia de seguridad extrae la información consolidada en un único archivo JSON estructurado de forma jerárquica:

```json
{
  "timestamp": "2026-05-25T19:43:12.456Z",
  "version": "1.0",
  "data": {
    "users": [...],
    "events": [...],
    "registrations": [...],
    "payments": [...],
    "transportRoutes": [...],
    "transportBookings": [...],
    "categories": [...],
    "notifications": [...],
    "paymentMethods": [...],
    "rolePermissions": [...],
    "roles": [...]
  }
}
```
Este archivo estructurado permite una reconstrucción o migración completa de los datos en entornos de staging o producción de forma segura y portable.

> [!TIP]
> Cualquier cambio que realices en los esquemas de `src/lib/db/schema/` debe ir acompañado de una migración. Usa `npm run db:push` para sincronizar tu base de datos PostgreSQL local en segundos.
