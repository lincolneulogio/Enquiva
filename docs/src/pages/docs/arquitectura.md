---
layout: ../../layouts/DocLayout.astro
title: "Arquitectura Técnica (Desarrolladores)"
description: "Documentación técnica detallada de EncuentroDeFe: stack principal, base de datos, relaciones de Drizzle ORM y revalidación de caché."
---

Esta sección describe la arquitectura técnica, el modelo de base de datos relacional y las políticas de sincronización de caché en el servidor de **EncuentroDeFe** para facilitar el mantenimiento y la extensión del código por parte de nuevos desarrolladores.

---

## Stack Tecnológico Principal

El proyecto utiliza un stack de última generación optimizado para velocidad extrema, respuestas instantáneas y tipado estático seguro de extremo a extremo:

* **Framework:** Next.js 15.1 (App Router) con Server Actions y componentes de servidor optimizados.
* **Librería de Interfaz:** React 19 y Tailwind CSS v4 para diseño web ultra veloz.
* **Base de Datos & ORM:** Drizzle ORM conectado a una base de datos PostgreSQL de alto rendimiento.
* **Autenticación:** `better-auth` v1.1.11, que maneja sesiones seguras basadas en cookies con compatibilidad nativa para middleware de Next.js.
* **Sincronización en Tiempo Real:** **Pusher** para transmisiones WebSocket bidireccionales en tiempo real (notificaciones de pagos y cambios de asistencia en el scanner).
* **Carga de Archivos:** **Uploadthing** v7 para subida directa y segura de comprobantes de pago de los asistentes a la nube.

---

## Modelo de Datos Relacional (Base de Datos)

El esquema de base de datos (`src/lib/db/schema/`) está diseñado bajo relaciones estrictas de integridad y consistencia. Las tablas principales involucradas en el flujo de pagos y transporte son:

### 1. Tabla de Pagos (`payments`)
Almacena el registro consolidado de cobro de entradas y transporte para un asistente.
* `id` (UUID - Primary Key): Identificador del pago.
* `registrationId` (UUID): Relación de clave foránea con la inscripción del evento (`registrations`).
* `userId` (TEXT): Relación de clave foránea con el participante (`users`).
* `amount` (NUMERIC): Costo total.
* `currency` (TEXT): Divisa predeterminada (`PEN` - Soles Peruanos).
* `method` (TEXT): Método elegido (`yape`, `plin` o `cash`).
* `reference` (TEXT): Número de operación / Referencia del voucher.
* `status` (ENUM): Estado actual del pago (`pending`, `approved`, `rejected`).
* `receiptUrl` (TEXT): Dirección URL del comprobante guardado en la nube.
* `notes` (TEXT): Historial completo de observaciones y capturas de pantalla de auditoría concatenadas de forma cronológica.

### 2. Tabla de Reservas de Transporte (`transport_bookings`)
* Gestiona los asientos reservados para el autobús y está vinculada a un registro de pago.
* Al ser rechazada una transacción en `payments`, se dispara un efecto en cascada que actualiza el estado de esta reserva a `cancelled` para liberar los asientos del autobús de forma inmediata.

---

## Políticas de Revalidación de Caché en el Servidor

Para garantizar que los usuarios visualicen los cambios de inmediato en su panel sin necesidad de recargar la página web de forma manual, utilizamos **Server-Side Revalidation (`revalidatePath`)**:

### Registro de Pago
Al registrar una transferencia en el Server Action `createPayment`:
```typescript
export async function createPayment(input: CreatePaymentInput) {
  const { user } = await requireAuthWithHeaders();
  const validated = createPaymentSchema.parse(input);

  const result = await PaymentService.createPayment(user.id, validated);

  // Invalida la caché en el servidor
  revalidatePath("/member/payments");
  revalidatePath(`/member/payments/new/${validated.registrationId}`);

  return result;
}
```
* Esto purga la caché de Next.js de manera inteligente. Cuando el usuario es redirigido a `/member/payments`, el servidor genera la página con la información fresca de la base de datos de inmediato.

### Auditoría del Organizador
Cuando un organizador aprueba o rechaza una transferencia:
```typescript
revalidatePath("/admin/payments");
revalidatePath("/organizer/transport");
```
* Esto limpia las vistas de administración al instante para que todo el equipo de coordinación trabaje sincronizado sobre los mismos datos sin desfases de tiempo.
