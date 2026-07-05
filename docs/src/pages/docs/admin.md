---
layout: ../../layouts/DocLayout.astro
title: "Guía del Administrador"
description: "Aprende a gestionar roles de usuario, configurar accesos y permisos granulares, monitorizar métricas y realizar exportaciones en Excel/PDF."
---

Esta sección está destinada al personal directivo y de soporte técnico del sistema. Aprenderás a gestionar usuarios, roles, configurar permisos granulares, monitorizar métricas y realizar exportaciones masivas en formatos compatibles con Excel y PDF.

---

## Gestión de Usuarios y Asignación de Roles

1. Ingresa a la sección **Usuarios** de tu panel de superadministrador.
2. Verás la lista de todas las cuentas registradas en la plataforma con una estructura de tabla profesional y enriquecida:
   * **Nombre completo:** Nombre del usuario acompañado de su inicial o avatar.
   * **Correo electrónico:** Dirección de correo (adaptada de forma responsiva con ruptura de línea automática si el texto es muy largo, garantizando una vista limpia).
   * **Teléfono:** Número telefónico directo (`phone`) para gestiones rápidas de soporte o confirmación de eventos.
   * **Verificado:** Badge de seguridad en verde (*Verificado*) o gris (*Pendiente*) indicando el estado del correo electrónico.
   * **Rol:** Badge visual estilizado de alta visibilidad con icono y color oficial (turquesa para Superadministrador, rosa para Administrador, azul para Organizador, verde para Miembro).
   * **Estado:** Indicador de estado de cuenta (*Activo* en verde / *Suspendido* en rojo).
   * **Última Conexión:** Marca temporal exacta en que el usuario estuvo activo en la aplicación.
3. **Cambiar Rol:** Haz clic en el menú desplegable al lado de cualquier usuario para cambiar su rol de inmediato.
4. **Diseño Responsivo Integrado:** La tabla está equipada con un sistema de deslizamiento horizontal (`overflow-x-auto`) con ancho mínimo de `1250px` que permite deslizar cómodamente en smartphones o tablets sin deformar la interfaz.

---

## Control de Permisos Granulares

Para proteger la integridad de los datos de la organización, el sistema cuenta con un panel de control de **Permisos de Seguridad** en la barra lateral:
* Puedes activar o desactivar accesos específicos para cada rol de forma independiente (ej: habilitar/deshabilitar la capacidad de que los organizadores eliminen eventos de forma permanente).
* Esto asegura que ningún organizador pueda borrar por accidente registros históricos de otras cuentas.

---

## Analíticas del Dashboard y Exportaciones de Datos

El dashboard administrativo ofrece gráficos interactivos del comportamiento de los eventos en tiempo real:
* **Métricas Financieras Consolidadas:** Visualiza el total de ingresos recaudados y aprobados del sistema (`S/.`), la alerta animada sobre pagos pendientes de verificación manual, y el ticket promedio por transacción.
* **Métricas de Operación Logística:** Monitorea la tasa de asistencia física en puerta (*Show-up Rate*) en base al check-in por escáner QR, y el porcentaje de ocupación de buses activos (asientos reservados vs total de aforo de transporte).
* **Actividad Mensual Expandida:** Gráfica comparativa de tres variables en el tiempo: eventos creados, inscripciones concretadas y nuevos usuarios registrados en la plataforma.
* **Gráfica de Métodos de Pago:** Un donut chart que detalla la distribución de los métodos aprobados favoritos (Yape, Plin, Efectivo, etc.).
* **Estado de la Lista de Espera:** Control numérico sobre personas retenidas en cola por aforo agotado y total de entradas emitidas.

### Exportación a Excel y PDF
Para llevar un control físico o auditorías contables:
1. Dirígete a la sección **Pagos** o **Inscripciones** en tu panel administrativo.
2. Utiliza el panel superior **Exportar** para filtrar la información que necesitas por evento, categoría de evento, estado del pago (Pendiente, Pagado, Rechazado) o rango de fechas.
3. Presiona el botón verde **Excel** para descargar una hoja de cálculo estructurada con todos los detalles de los participantes, números de operación e historial.
4. Presiona el botón morado **PDF** para generar un reporte de auditoría contable formateado y listo para impresión directa.

---

## Copias de Seguridad (Database Backups)

Para garantizar la continuidad operativa y la prevención de pérdida de datos:
1. Dirígete a **Configuración** en tu panel administrativo.
2. En la sección **Copia de Seguridad de la Base de Datos**, los superadministradores pueden hacer clic en **Descargar copia de seguridad**.
3. El sistema generará una consulta agregada a todas las 11 tablas de base de datos (`users`, `events`, `registrations`, `payments`, `transportRoutes`, `transportBookings`, `categories`, `notifications`, `paymentMethods`, `rolePermissions`, `roles`) y descargará un archivo JSON estructurado e indentado con la fecha y hora exacta (ej: `sistema_events_backup_2026-05-25_14-43-12.json`).

---

## Configuración Avanzada e Identidad de la Marca

La sección **Configuración** de nivel `super_admin` cuenta con una potente consola dividida en pestañas para controlar la experiencia y la infraestructura en tiempo real:

### 1. Perfil e Identidad de la Organización
Permite cambiar la identidad y el pie de firma que viaja en todas las comunicaciones del ecosistema:
* **Nombre de la Organización:** Modifica el título principal (ej: `Eventia`) que se muestra en los correos y en el encabezado del pase de entrada digital.
* **Correo de Soporte:** Configura la dirección directa que reciben los feligreses si tienen dudas sobre sus pagos.
* Todos los cambios se persisten de manera sumamente veloz mediante operaciones seguras JSON en el servidor Next.js.

### 2. Preferencias de la Aplicación (Ajustes Rápidos)
El panel cuenta con herramientas de personalización en caliente (hot reload) sin demoras de renderizado:
* **Idioma:** Alterna instantáneamente el idioma de todo el panel entre **Español** e **Inglés**.
* **Modo Oscuro:** Ajusta el tema general de color (Claro, Oscuro, Sistema) de forma sumamente suave gracias a la sincronización con `next-themes`.
* **Esquema de Color (Accent Color):** Selección por burbujas (Ámbar original, Verde esmeralda, Rosa premium, Azul eléctrico) que reescribe dinámicamente las variables globales CSS de Tailwind. ¡El panel entero se repinta en vivo y persiste en el navegador del administrador!

### 3. Diagnóstico de SMTP y Servidor de Correo
Herramienta indispensable para el equipo de soporte técnico:
* **Estado de la Conexión:** Verifica el canal con tu host SMTP de Nodemailer al instante (mediante `transporter.verify()`), arrojando un barómetro de latencia técnica en milisegundos.
* **Correo de Diagnóstico:** Formulario integrado para disparar un correo HTML estructurado en un clic. Ideal para comprobar que los filtros de spam del receptor acepten los correos de confirmación QR del sistema sin fallas.

### 4. Alertas del Sistema (Suscripciones)
Switches premium con micro-animaciones para que el administrador decida de qué eventos ser notificado:
* **Registro de Nuevos Pagos:** Alertas por comprobantes subidos por Yape/Plin que esperan aprobación del staff.
* **Aforo Crítico de Transporte:** Avisar si un bus o línea de traslado completa el 90% de sus plazas reservadas.
* **Resumen Diario Financiero:** Un balance completo enviado a medianoche con los números y estadísticas consolidadas del día.
