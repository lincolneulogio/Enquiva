---
layout: ../../layouts/DocLayout.astro
title: "Guía del Organizador"
description: "Aprende a publicar eventos, configurar las cuentas receptoras de Yape/Plin, administrar buses y realizar conciliación de pagos con el historial de auditoría."
---

Esta sección está dedicada a los coordinadores y organizadores de eventos. Aquí aprenderás a publicar eventos, configurar las rutas de movilidad, escanear entradas QR en puerta y auditar los pagos de los asistentes con nuestro sistema de historial seguro.

---

## Creación de Eventos y Métodos de Pago

1. Ingresa a tu panel de organizador y haz clic en **Crear evento**.
2. Completa los datos obligatorios del evento: Título, Categoría (Adoración, Retiro, Juventud, etc.), Fecha, Dirección o enlace de reunión si es virtual, y precio de la entrada.
3. Habilita las opciones **Ofrecer transporte** si organizarás buses.
4. **Habilitar Medios de Pago:** En la sección *Medios de Pago*, configura las cuentas receptoras. Digita el nombre del titular de la cuenta, el número de teléfono, y **sube la imagen de tu código QR de Yape o Plin** para que los asistentes lo descarguen al pagar.

---

## Configuración de Rutas de Transporte

Si tu evento ofrece transporte, debes crear las rutas correspondientes:
* Dirígete a la pestaña **Transporte** y presiona **Nueva ruta**.
* Define el nombre de la ruta (ej: *Bus Centro Histórico*), la dirección exacta del punto de encuentro, la hora de salida de ida, la hora de retorno, la capacidad máxima de asientos del autobús y el precio por asiento.
* Los participantes registrados en tu evento verán esta ruta en sus paneles de miembro y podrán reservar pasajes.

---

## Bandeja de Auditoría de Pagos e Historial de Rechazos

Cuando un participante registra un pago vía Yape/Plin, este entra en estado **PENDIENTE**. Para conciliarlo:
1. Dirígete a la sección **Pagos** de tu panel de organizador. Verás el listado de todos los pagos pendientes de revisión con el monto y el método usado.
2. Abre tu aplicación bancaria (Yape o Plin) en tu celular y corrobora que el monto ingresado realmente figure en tu saldo disponible.

### Uso del Modal de Auditoría de Historial
> **¡CONSEJO PRO!** Los usuarios a veces cometen errores al subir comprobantes o intentan reutilizar capturas antiguas. El sistema registra un historial inalterable para proteger las finanzas de tu evento.

* Junto a cada pago verás el botón **Ver Historial** o **Ver Notas** en la columna *Comprobante*.
* Haz clic en él para abrir una ventana emergente interactiva de auditoría.
* **Comprobante Actual:** En la parte superior del modal, verás la captura del recibo actual subida por el usuario con opciones para abrirla a pantalla completa y hacer zoom.
* **Historial de Reenvíos:** En la parte inferior, verás un bloque de texto que detalla de forma cronológica cuántas veces ha intentado pagar este usuario, qué capturas subió antes, la fecha/hora exacta y **los motivos de rechazo previos**.
* **Acciones de Aprobación/Rechazo:**
  * **Aprobar:** Si el dinero está en tu cuenta, selecciona **Pagado** en el menú de *Actualizar*. El sistema enviará el boleto QR por correo al asistente automáticamente.
  * **Rechazar:** Si el comprobante es falso o el monto está incompleto, selecciona **Rechazado** en el menú desplegable. El sistema te pedirá escribir el motivo del rechazo (ej: *"El comprobante es por S/. 1.00 en vez de S/. 50.00"*). El usuario recibirá la notificación para volver a subir el comprobante correcto y las capturas antiguas quedarán congeladas en el historial como evidencia.

---

## Control de Acceso: Scanner QR en Puerta

El día del evento, puedes validar las entradas de los asistentes de forma instantánea usando la cámara de tu teléfono móvil o laptop:
1. Ingresa a la sección **Escanear QR** en el menú lateral.
2. Otorga permisos de acceso a la cámara de tu dispositivo.
3. Apunta la cámara hacia el código QR de la entrada del asistente.
4. El escáner verificará la firma digital criptográfica de la entrada en la base de datos en menos de 1 segundo:

### Respuestas del Escáner
* **ACCESO AUTORIZADO (Verde):** La entrada es legítima, no ha sido usada y el check-in del participante se registra con éxito en la base de datos de asistencia.
* **TICKET YA UTILIZADO (Rojo):** La entrada es válida pero ya fue escaneada previamente. El sistema te mostrará la hora exacta del primer ingreso para evitar duplicaciones o fraude por reventa de entradas.
* **ACCESO DENEGADO (Negro):** El código QR escaneado es inválido, manipulado o no pertenece al evento.
