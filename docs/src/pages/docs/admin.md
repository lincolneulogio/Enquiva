---
layout: ../../layouts/DocLayout.astro
title: "Guía del Administrador"
description: "Aprende a gestionar roles de usuario, configurar accesos y permisos granulares, monitorizar métricas y realizar exportaciones en Excel/PDF."
---

Esta sección está destinada al personal directivo y de soporte técnico del sistema. Aprenderás a gestionar usuarios, roles, configurar permisos granulares, monitorizar métricas y realizar exportaciones masivas en formatos compatibles con Excel y PDF.

---

## Gestión de Usuarios y Asignación de Roles

1. Ingresa a la sección **Usuarios** de tu panel de superadministrador.
2. Verás la lista de todas las cuentas registradas en la plataforma con su nombre, correo y fecha de registro.
3. **Cambiar Rol:** Haz clic en el menú desplegable al lado de cualquier usuario para asignarle un rol según sus necesidades:
   * **Superadministrador:** Acceso ilimitado a todas las bases de datos, permisos y configuraciones globales.
   * **Administrador:** Gestión general de eventos, usuarios, reportes y aprobaciones.
   * **Organizador:** Limita su acceso a la creación y gestión exclusiva de sus propios eventos, transportes y validación de sus inscritos.
   * **Miembro:** Perfil por defecto de los asistentes. Solo puede buscar eventos y registrarse.

---

## Control de Permisos Granulares

Para proteger la integridad de los datos de la organización, el sistema cuenta con un panel de control de **Permisos de Seguridad** en la barra lateral:
* Puedes activar o desactivar accesos específicos para cada rol de forma independiente (ej: habilitar/deshabilitar la capacidad de que los organizadores eliminen eventos de forma permanente).
* Esto asegura que ningún organizador pueda borrar por accidente registros históricos de otras cuentas.

---

## Analíticas del Dashboard y Exportaciones de Datos

El dashboard administrativo ofrece gráficos interactivos del comportamiento de los eventos en tiempo real:
* **Métricas de Control:** Monitorea la recaudación consolidada de pagos, cantidad de registros aprobados, reservas de buses activas y la tasa de asistencia física en puerta.

### Exportación a Excel y PDF
Para llevar un control físico o auditorías contables:
1. Dirígete a la sección **Pagos** o **Inscripciones** en tu panel administrativo.
2. Utiliza el panel superior **Exportar** para filtrar la información que necesitas por evento, categoría de evento, estado del pago (Pendiente, Pagado, Rechazado) o rango de fechas.
3. Presiona el botón verde **Excel** para descargar una hoja de cálculo estructurada con todos los detalles de los participantes, números de operación e historial.
4. Presiona el botón morado **PDF** para generar un reporte de auditoría contable formateado y listo para impresión directa.
