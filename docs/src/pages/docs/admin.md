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
