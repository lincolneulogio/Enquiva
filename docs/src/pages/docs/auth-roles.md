---
title: "Autenticación y Matriz de Roles"
description: "Cómo funciona Better-Auth, el inicio de sesión y los distintos niveles de permisos en la aplicación."
layout: "../../layouts/DocLayout.astro"
---

Para mantener los datos de nuestra comunidad seguros, Evora utiliza **Better-Auth**, una librería moderna para manejar sesiones mediante cookies HTTP-Only y validaciones criptográficas.

---

## Matriz de Permisos (Roles)

El sistema soporta cuatro niveles de jerarquía. Cada usuario posee un rol global en `users.role` y, si pertenece a una entidad, un rol adicional en `organization_members.role` (owner, organizer o member).

### 1. Rol: Superadministrador (`super_admin`)
Es el dueño de la plataforma SaaS.
- **Acceso:** Panel de administración total (`/admin/*`), analítica global, planes, permisos y medios de pago de plataforma.
- **Color y Badge:** Cyan con el ícono `Crown` (Corona).
- **Permisos:** Gestión de todos los roles, entidades, respaldos y métricas de toda la plataforma.

### 2. Rol: Administrador (`admin`)
Dueño o responsable de una **entidad** (organización).
- **Acceso:** Dashboard administrativo (`/admin/*`) acotado a su entidad.
- **Color y Badge:** Rosado con el ícono `ShieldCheck`.
- **Permisos:** Equipo de la entidad, eventos y pagos de su organización, exportaciones y analítica de su entidad.

### 3. Rol: Organizador (`organizer`)
Coordinador de eventos dentro de una entidad (o independiente en eventos propios).
- **Acceso:** Vistas de coordinación (`/organizer/*`).
- **Color y Badge:** Azul con el ícono `Briefcase`.
- **Permisos:** Listas de asistentes, aprobación de comprobantes, escáner QR y medios de pago del organizador.

### 4. Rol: Miembro (`member`)
Asistentes y usuarios finales.
- **Acceso:** Rutas públicas y panel privado (`/member/*` / `/profile`).
- **Color y Badge:** Verde/Esmeralda con el ícono `UserRound`.
- **Permisos:** Registro en eventos, carga de comprobantes, transporte y ticket QR personal.

---

## Inicio de sesión

La plataforma admite **correo y contraseña** como método principal. También puede configurarse verificación por OTP por correo según el despliegue.

1. El usuario ingresa email y contraseña en `/login` (o se registra en `/register`).
2. Better-Auth valida credenciales y emite una cookie de sesión firmada con `BETTER_AUTH_SECRET`.
3. Las **Server Actions** y layouts del dashboard consultan la sesión en el servidor (`auth.api.getSession`) antes de ejecutar lógica sensible.

Los guards centralizados viven en `src/lib/auth/guards.ts` (`requireAuth`, `requireOrganizerOrHigher`, `requireAdminOrHigher`, `requireSuperAdmin`, etc.) y se reutilizan en todas las acciones del servidor.

---

## Protección de rutas

La protección se aplica en **dos capas**:

### 1. Layouts por prefijo de ruta
Cada área del dashboard tiene un layout que valida sesión y rol antes de renderizar:

| Prefijo | Roles permitidos |
|---------|------------------|
| `/admin/*` | `admin`, `super_admin` |
| `/organizer/*` | `organizer`, `admin`, `super_admin` |
| `/member/*` | cualquier usuario autenticado |

Si el rol no coincide, el layout redirige al área correcta o al inicio.

### 2. Middleware (`middleware.ts`)
Comprueba la presencia de cookie de sesión en rutas protegidas. Los usuarios no autenticados son redirigidos a `/login`.

### 3. Server Actions y scope multi-tenant
Además del rol global, muchas operaciones admin aplican **scope de entidad** (`resolveAdminScope` en `src/lib/organizations/admin-scope.ts`): un `admin` solo ve datos de su organización; `super_admin` ve toda la plataforma.

---

## Sincronización de roles en entidades

Cuando un usuario pertenece a una entidad:

- `users.role` define el rol global (member, organizer, admin…).
- `organization_members.role` define su rol dentro de la entidad (owner, organizer, member).

Al cambiar roles desde el panel (promoción de equipo o asignación por super admin), el servidor mantiene ambos campos alineados mediante `OrganizationService.syncUserRoleWithOrganizationMembership`.

---

## Primer usuario y asignación automática

> [!NOTE]
> El **primer usuario** registrado en la plataforma recibe automáticamente `super_admin`. Los registros posteriores inician como `member`. Solo un super administrador puede promover roles globales desde `/admin/users`; los administradores de entidad gestionan organizer/member dentro de su equipo.
