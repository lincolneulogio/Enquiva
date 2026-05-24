---
title: "Eventos en Tiempo Real (WebSockets)"
description: "Sincronización instantánea de pagos y escaneos de puerta usando Pusher."
layout: "../../layouts/DocLayout.astro"
---

Para ofrecer una experiencia inmersiva y evitar que los organizadores tengan que recargar la página constantemente, EncuentroDeFe utiliza **Pusher** (WebSockets) para transmitir eventos críticos en milisegundos.

---

## ⚡ Canales (Channels) y Eventos

Actualmente, el sistema emite eventos desde el servidor (Server Actions de Next.js) hacia los clientes suscritos.

### Canal: `admin-dashboard`
Suscrito por los usuarios con rol `admin` y `organizer` que tienen abierta la pantalla de pagos o el dashboard de inicio.

* **Evento: `payment-uploaded`**
  * **Emisor:** Un usuario sube un comprobante de Yape/Plin.
  * **Acción Cliente:** Muestra una notificación Toast (ej: "¡Nuevo pago de Juan Pérez pendiente de revisión!") y actualiza la tabla de pagos automáticamente sin recargar.

* **Evento: `payment-audited`**
  * **Emisor:** Un organizador aprueba o rechaza un pago.
  * **Acción Cliente:** Remueve el pago de la cola de pendientes para el resto del equipo, evitando que dos organizadores intenten verificar el mismo pago simultáneamente.

### Canal: `door-scanner`
Utilizado en la vista móvil de los organizadores que están en la puerta del evento con el escáner QR.

* **Evento: `ticket-scanned`**
  * **Emisor:** El celular del organizador lee un QR válido y lo reporta a la base de datos.
  * **Acción Cliente:** Suma `+1` al contador global de "Asistentes en Sala" en el Dashboard de los administradores en tiempo real.

---

## 🛠️ Cómo suscribirse en el Frontend

Si estás desarrollando una nueva pantalla y necesitas escuchar eventos, puedes usar el cliente de Pusher preconfigurado en el frontend de React.

```tsx
'use client';
import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusher'; // Instancia cliente

export default function ContadorEnVivo() {
  useEffect(() => {
    // 1. Suscribirse al canal
    const channel = pusherClient.subscribe('door-scanner');

    // 2. Escuchar un evento específico
    channel.bind('ticket-scanned', (data: { name: string, time: string }) => {
      console.log(`${data.name} acaba de entrar al auditorio a las ${data.time}`);
      // Actualizar estado de React aquí...
    });

    // 3. Limpiar suscripción al desmontar
    return () => {
      pusherClient.unsubscribe('door-scanner');
    };
  }, []);

  return <div>Monitoreando entrada...</div>;
}
```

> [!NOTE]  
> Pusher tiene cuotas gratuitas (hasta 200,000 mensajes diarios). Para la escala de una iglesia o comunidad local, la capa gratuita (Sandbox) es más que suficiente.
