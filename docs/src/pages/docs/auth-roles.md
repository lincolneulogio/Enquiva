---
title: "Autenticación y Matriz de Roles"
description: "Cómo funciona Better-Auth y los distintos niveles de permisos en la aplicación."
layout: "../../layouts/DocLayout.astro"
---

Para mantener los datos de nuestra comunidad seguros, EncuentroDeFe utiliza **Better-Auth**, una librería moderna y extremadamente segura para manejar sesiones mediante cookies HTTP-Only y validaciones criptográficas.

---

## 🛡️ Matriz de Permisos (Roles)

El sistema soporta tres niveles de jerarquía rígidos. Cada usuario posee un rol definido en la base de datos que determina a qué páginas y APIs puede acceder.

### 1. Rol: Administrador (`admin`)
Es el creador o dueño del sistema. Tiene acceso irrestricto.
- **Acceso:** Puede entrar al Dashboard de Analíticas (`/admin/*`).
- **Permisos Exclusivos:** Puede asignar roles a otros usuarios (convertir a alguien en Organizador). Puede exportar bases de datos a Excel/PDF. Puede ver la recaudación financiera total.

### 2. Rol: Organizador (`organizer`)
Parte del equipo de staff o logística del evento.
- **Acceso:** Puede entrar a las vistas de coordinación (`/organizer/*`).
- **Permisos Exclusivos:** Puede ver el listado de asistentes, aprobar o rechazar capturas de Yape/Plin, y tiene permisos para usar el **Escáner QR** en la puerta para validar el ingreso de las personas.

### 3. Rol: Miembro (`user`)
El asistente o feligrés normal.
- **Acceso:** Rutas públicas y su panel privado (`/member/*`).
- **Permisos Exclusivos:** Puede registrarse a eventos, subir sus propios comprobantes de pago y visualizar/descargar su Ticket QR personal. No tiene visión de los datos de otras personas.

---

## 🔒 Flujo de Inicio de Sesión (OTP)

Dado que es una plataforma enfocada en la facilidad de uso y alta seguridad, **no usamos contraseñas tradicionales opcionales** (aunque están disponibles). Hemos implementado un flujo de verificación de correo seguro:

1. El usuario se registra con su Email.
2. Better-Auth envía un código OTP (One-Time Password) de 6 dígitos a su correo.
3. El usuario ingresa el código.
4. El servidor valida el código e inyecta una Cookie `Set-Cookie` cifrada con el `BETTER_AUTH_SECRET`.

### Protección de Rutas (Middleware)

Next.js protege las rutas mediante su archivo `middleware.ts`. Si un usuario con rol `user` intenta acceder a `/admin`, el middleware interceptará la petición en el borde (Edge) y lo redirigirá a la página de inicio en menos de 10 milisegundos, antes de siquiera cargar la página.

```typescript
// Ejemplo simplificado de protección de rutas
if (request.nextUrl.pathname.startsWith('/admin')) {
  const session = await getSession(request);
  if (session?.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
```

> [!WARNING]
> Si estás desarrollando en local, asegúrate de cambiar manualmente tu rol a `admin` directamente en la base de datos (Postgres) la primera vez, ya que no hay una interfaz pública para auto-hacerse administrador.
