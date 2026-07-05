---
title: "Registro de Cambios (Changelog)"
description: "Mantente al tanto de las últimas actualizaciones, mejoras y correcciones de la plataforma."
layout: "../../layouts/DocLayout.astro"
---

Documentamos todas las mejoras significativas en el ecosistema de Eventia. A continuación, encontrarás el registro histórico organizado por número de versión y fecha de lanzamiento.

---

## v1.3.0 - Analíticas Avanzadas, Gestión de Usuarios y Copias de Seguridad
*Lanzamiento: Mayo 2026*

**Nuevas Características:**
* **Analíticas Avanzadas y Financieras:** Rediseño completo del panel con tarjetas de ingresos totales, ticket promedio de pago, tasa de asistencia en vivo (*Show-up Rate*), ocupación de transporte y gráficos enriquecidos (donuts de métodos de pago y crecimiento de usuarios mensual).
* **Gestión Premium de Usuarios:** Renovación de la tabla de control de usuarios con colores y símbolos oficiales para roles, scroll horizontal responsivo, ajuste de ancho de celdas para correos y 4 nuevas columnas administrativas (Teléfono, Estado verificado, Estado activo/baneo, y Última conexión activa).
* **Copia de Seguridad de la Base de Datos:** Implementación de una utilidad de backup en un clic para Superadministradores, permitiendo descargar toda la información del sistema (11 tablas enlazadas) en un archivo estructurado JSON.
* **Consistencia Visual en Roles:** Estandarización de los colores de roles (Turquesa para Superadministrador, Rosa para Administrador, Azul para Organizador y Verde para Miembro) y sus iconos en las vistas de Roles, Perfil, Configuración y Usuarios.
* **Seguridad en el Registro de Usuarios:** Modificación del flujo automático de asignación de roles. Ahora solo el primer usuario del sistema recibe el rol `super_admin` de forma automática, y todos los siguientes usuarios inician como `member` (Miembro) de forma predeterminada para evitar brechas de seguridad.

---

## v1.2.0 - Optimización Documental y Búsqueda Inteligente
*Lanzamiento: Mayo 2026*

**Nuevas Características:**
* **Buscador Universal en Docs:** Implementación de un motor de búsqueda instantáneo (`Ctrl+K`) en la documentación oficial, permitiendo saltar directamente a párrafos específicos.
* **Scrollspy Mejorado:** El menú lateral ahora sigue de forma más inteligente la lectura del usuario, ajustando los márgenes para la barra superior fija.
* **Scroll-to-Top:** Añadido botón interactivo en la esquina inferior para facilitar la navegación en guías largas.

**Correcciones de Errores:**
* Corregido el salto ancla (anchor jump) que ocultaba los títulos debajo del header al navegar por el índice.

---

## v1.1.0 - Auditoría y Exportación
*Lanzamiento: Abril 2026*

**Nuevas Características:**
* **Exportación a PDF y Excel:** Los administradores ahora pueden descargar el reporte completo de pagos y asistentes desde el panel central.
* **Filtros Avanzados:** Se añadieron selectores para filtrar tickets por rango de fechas, estado de pago y tipo de transporte.
* **Validación Criptográfica QR:** El escáner de puerta fue reescrito para validar firmas digitales offline temporalmente en caso de pérdida de señal.

**Seguridad:**
* Implementado un límite de intentos (Rate Limiting) en el login por OTP para prevenir ataques de fuerza bruta.

---

## v1.0.0 - Lanzamiento Inicial (MVP)
*Lanzamiento: Febrero 2026*

**Nuevas Características:**
* Despliegue de la plataforma base construida en **Next.js 16** App Router.
* Integración de autenticación de usuarios mediante **better-auth** (Correo y OTP).
* Panel de usuario para subir comprobantes de Yape y Plin mediante **Uploadthing**.
* Panel de organizador con vistas en tiempo real sincronizadas mediante **Pusher**.
* Gestión de flotas de transporte con control de asientos y cupos en vivo.
* Generación dinámica de Tickets QR para acceso rápido a eventos físicos.
