---
title: "Registro de Cambios (Changelog)"
description: "Mantente al tanto de las últimas actualizaciones, mejoras y correcciones de la plataforma."
layout: "../../layouts/DocLayout.astro"
---

Documentamos todas las mejoras significativas en el ecosistema de EncuentroDeFe. A continuación, encontrarás el registro histórico organizado por número de versión y fecha de lanzamiento.

---

## v1.2.0 - Optimización Documental y Búsqueda Inteligente
*Lanzamiento: Mayo 2026*

**✨ Nuevas Características:**
* **Buscador Universal en Docs:** Implementación de un motor de búsqueda instantáneo (`Ctrl+K`) en la documentación oficial, permitiendo saltar directamente a párrafos específicos.
* **Scrollspy Mejorado:** El menú lateral ahora sigue de forma más inteligente la lectura del usuario, ajustando los márgenes para la barra superior fija.
* **Scroll-to-Top:** Añadido botón interactivo en la esquina inferior para facilitar la navegación en guías largas.

**🐛 Correcciones de Errores:**
* Corregido el salto ancla (anchor jump) que ocultaba los títulos debajo del header al navegar por el índice.

---

## v1.1.0 - Auditoría y Exportación
*Lanzamiento: Abril 2026*

**✨ Nuevas Características:**
* **Exportación a PDF y Excel:** Los administradores ahora pueden descargar el reporte completo de pagos y asistentes desde el panel central.
* **Filtros Avanzados:** Se añadieron selectores para filtrar tickets por rango de fechas, estado de pago y tipo de transporte.
* **Validación Criptográfica QR:** El escáner de puerta fue reescrito para validar firmas digitales offline temporalmente en caso de pérdida de señal.

**🔒 Seguridad:**
* Implementado un límite de intentos (Rate Limiting) en el login por OTP para prevenir ataques de fuerza bruta.

---

## v1.0.0 - Lanzamiento Inicial (MVP)
*Lanzamiento: Febrero 2026*

**✨ Nuevas Características:**
* Despliegue de la plataforma base construida en **Next.js 16** App Router.
* Integración de autenticación de usuarios mediante **better-auth** (Correo y OTP).
* Panel de usuario para subir comprobantes de Yape y Plin mediante **Uploadthing**.
* Panel de organizador con vistas en tiempo real sincronizadas mediante **Pusher**.
* Gestión de flotas de transporte con control de asientos y cupos en vivo.
* Generación dinámica de Tickets QR para acceso rápido a eventos físicos.
