---
layout: ../../layouts/DocLayout.astro
title: "¡Bienvenido a Evora Docs!"
description: "Guía y portal de documentación oficial para usuarios, organizadores y administradores de Evora."
---

**Evora** es una plataforma premium y autogestionable de gestión de eventos, control de asistencia e integración de transporte, diseñada para organizadores, empresas, asociaciones y comunidades de todo tipo.

Este portal de documentación te guiará paso a paso sobre cómo interactuar con el sistema según tu rol, ya seas un **asistente** que busca registrarse en eventos, un **organizador** logístico que gestiona transporte y pagos, o un **administrador** que supervisa la seguridad y analíticas de la plataforma.

---

## Módulos Clave del Ecosistema

El sistema está compuesto por herramientas integradas de última generación:

1. **Pasarela de Pago Manual Unidispositivo:** Un flujo optimizado para realizar transferencias vía **Yape** o **Plin** utilizando únicamente tu teléfono móvil, reduciendo la fricción a cero.
2. **Control de Acceso Seguro (Scanner QR):** Validación en puerta en tiempo real mediante la lectura de firmas criptográficas de tickets digitales con la cámara de cualquier celular.
3. **Gestión de Transporte Integrado:** Reservas y asignación de asientos de autobuses ida y vuelta vinculados directamente a la inscripción de los eventos.
4. **Historial de Auditoría Inalterable:** Un registro cronológico de comprobantes que permite a los organizadores verificar de forma segura e histórica cada reenvío y nota de pago.

---

## Primeros Pasos: Crear y Confirmar tu Cuenta

Para comenzar a interactuar con la plataforma, cada usuario debe registrar su perfil de forma segura:

### 1. Registro de Perfil
* Ingresa a la página de **Registro** e ingresa tu nombre completo, correo electrónico y una contraseña segura (mínimo 8 caracteres, incluyendo una mayúscula y un número).
* Asegúrate de confirmar tu número de teléfono de contacto en formato internacional (`+519XXXXXXXX` para Perú) si planeas reservar autobuses.

### 2. Verificación de Seguridad (OTP)
> **¡IMPORTANTE!** Evora utiliza un sistema de verificación de doble factor (OTP) mediante correo electrónico para mantener las cuentas libres de spam y asegurar la autenticidad de los registros.

* Al registrarte, recibirás un correo electrónico con un **código de seguridad único de 6 dígitos**.
* La aplicación te redirigirá a una pantalla de verificación. Digita el código de 6 dígitos para activar tu cuenta de inmediato.
* Si no recibes el código en tu bandeja de entrada en menos de 1 minuto, verifica la carpeta de *Spam* o presiona el botón **Reenviar código**.

Una vez confirmado, podrás iniciar sesión de inmediato y acceder a tu panel de control personalizado según los privilegios de tu cuenta.

---

## ¿Cómo navegar esta documentación?

Usa el menú lateral: solo verás las guías disponibles para **tu rol activo**. Las secciones compartidas (FAQ, videotutoriales, soporte y changelog) están disponibles para todos los usuarios autenticados.

<div data-docs-perm="docs:view:member">
* **Guía del Miembro:** comprar entradas, pagar, ticket QR y transporte.
</div>

<div data-docs-perm="docs:view:organizer">
* **Guía del Organizador:** publicar eventos, pagos, buses, escaneo QR y comprobantes.
</div>

<div data-docs-perm="docs:view:admin">
* **Guía del Administrador:** usuarios, roles del sistema y métricas/exportaciones.
</div>

<div data-docs-perm="docs:view:dev">
* **Arquitectura Técnica y Desarrolladores:** stack, despliegue, BD, permisos y tiempo real.
</div>
