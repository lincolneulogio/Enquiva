---
layout: ../../layouts/DocLayout.astro
title: "Guía del Organizador"
description: "Publica eventos, configura Efectivo o Culqi, administra transporte y concilia pagos."
---

Esta sección está dedicada a los coordinadores y organizadores de eventos: publicar eventos, movilidad, escanear QR y revisar pagos.

---

## Medios de pago (Efectivo y Culqi)

1. Ve a **Medios de pago** en el menú.
2. Crea **Efectivo** (cobro en puerta) y/o **Tarjeta (Culqi)** con las llaves de **tu comercio** en [panel.culqi.com](https://panel.culqi.com) (`pk_test_`/`sk_test_` o `pk_live_`/`sk_live_`, mismo entorno).
3. Con un solo medio Culqi, los asistentes pagan con **tarjeta, Yape o billeteras** en el checkout de Culqi. El dinero va a tu cuenta Culqi, no a la de Evora.
4. En cada evento con precio, **activa** los medios que quieres ofrecer.

### Un solo Culqi por cuenta

Solo puedes tener **un** medio Culqi activo. Si lo **eliminas**:

- Se desvincula automáticamente de todos los eventos (cascade).
- Esos eventos dejan de ofrecer tarjeta/Yape hasta que crees Culqi de nuevo y lo asignes en el formulario del evento.

### Yape / Plin manuales (legacy)

Ya no se pueden crear. Si tienes medios antiguos:

- Aparecen como **Legacy** (solo eliminar).
- Usa **Quitar de eventos** para dejar de ofrecerlos en eventos activos.
- Migra a Culqi para cobros instantáneos.

---

## Creación de eventos

1. **Crear evento** → título, categoría, fecha, lugar o enlace, precio.
2. Si el precio es &gt; 0, elige los medios (Efectivo / Culqi).
3. Opcional: **Ofrecer transporte** y configura rutas.

---

## Pagos de asistentes

- **Culqi:** aprobación automática al confirmar el pago; el ticket QR se emite al instante.
- **Efectivo:** queda pendiente hasta que confirmes el pago en puerta (Pagos → marcar Pagado).
- **Legacy Yape/Plin:** el asistente sube comprobante; tú lo apruebas o rechazas en **Pagos**.

---

## Control de Acceso: Scanner QR

1. **Escanear QR** → permiso de cámara.
2. **ACCESO AUTORIZADO** / **TICKET YA UTILIZADO** / **ACCESO DENEGADO** según la firma del ticket.
