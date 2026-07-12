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
- **Acceso:** Panel de plataforma (`/superadmin/*`). Si visita `/admin/*`, el proxy/layout lo remapea a la ruta equivalente en `/superadmin`.
- **También:** puede usar `/organizer/*` para eventos propios de plataforma.
- **Color y Badge:** Cyan con el ícono `Crown` (Corona).
- **Permisos:** Gestión de todos los roles, entidades, planes SaaS, respaldos y métricas globales.

### 2. Rol: Administrador (`admin`)
Dueño o responsable de una **entidad** (organización).
- **Acceso:** Dashboard de entidad (`/admin/*`) acotado a su organización.
- **No** entra a `/superadmin/*` (se remapea o redirige a `/admin`).
- **Color y Badge:** Rosado con el ícono `ShieldCheck`.
- **Permisos:** Equipo de la entidad, eventos y pagos de su organización, exportaciones y analítica de su entidad.

### 3. Rol: Organizador (`organizer`)
Coordinador de eventos dentro de una entidad (o independiente en eventos propios).
- **Acceso:** Vistas de coordinación (`/organizer/*`).
- **Gates SSR:** si la membresía está pendiente → solo `/organizer/pending`; si el plan está bloqueado → solo `/organizer/billing` (hasta renovar).
- **Color y Badge:** Azul con el ícono `Briefcase`.
- **Permisos:** Listas de asistentes, aprobación de comprobantes, escáner QR y medios de pago del organizador.

### 4. Rol: Miembro (`member`)
Asistentes y usuarios finales.
- **Acceso:** Rutas públicas y panel privado (`/member/*`).
- **Color y Badge:** Verde/Esmeralda con el ícono `UserRound`.
- **Permisos:** Registro en eventos, carga de comprobantes, transporte y ticket QR personal.

---

## Inicio de sesión

La plataforma admite **correo y contraseña** como método principal. También puede configurarse verificación por OTP por correo según el despliegue.

1. El usuario ingresa email y contraseña en `/login` (o se registra en `/register`).
2. Better-Auth valida credenciales y emite una cookie de sesión firmada con `BETTER_AUTH_SECRET`.
3. El **proxy** (`src/proxy.ts`) y los layouts del dashboard consultan la sesión en el servidor (`auth.api.getSession`) antes de servir HTML del panel.

Los guards centralizados viven en `src/lib/auth/guards.ts` (`requireAuth`, `requireOrganizerOrHigher`, `requireAdminOrHigher`, `requireSuperAdmin`, etc.) y se reutilizan en todas las acciones del servidor.

---

## Protección de rutas

La protección se aplica en **tres capas**:

### 1. Proxy (`src/proxy.ts`) — borde
- Rutas públicas (landing, auth, `/events`, `/ticket`, etc.) pasan sin sesión.
- Rutas de panel: valida **sesión real** con `auth.api.getSession` (no solo presencia de cookie).
- Cuenta suspendida (`isActive === false`) → `/login?error=account_disabled`.
- Rol incorrecto para el prefijo → redirect al home de su rol (y remap `/admin` ↔ `/superadmin` cuando aplica).

### 2. Layouts por prefijo (SSR)
Cada área del dashboard vuelve a validar sesión y rol:

| Prefijo | Roles permitidos |
|---------|------------------|
| `/superadmin/*` (panel) | solo `super_admin` |
| `/admin/*` | solo `admin` (`super_admin` se remapea a `/superadmin`) |
| `/organizer/*` | `organizer`, `super_admin` |
| `/member/*` | solo `member` (staff/organizer redirigidos a su home) |

Si el rol no coincide, el layout redirige al área correcta.

### 3. Server Actions y scope multi-tenant
Además del rol global, muchas operaciones admin aplican **scope de entidad** (`resolveAdminScope` en `src/lib/organizations/admin-scope.ts`): un `admin` solo ve datos de su organización; `super_admin` ve toda la plataforma.

> [!IMPORTANT]
> Pegar una URL de panel en otro navegador **sin cookie de sesión** cae en el proxy → login. Con sesión de otro rol, proxy/layout redirigen. Los tickets públicos `/ticket/...` no usan sesión: exigen firma HMAC `?s=`.

---

## Sincronización de roles en entidades

Cuando un usuario pertenece a una entidad:

- `users.role` define el rol global (member, organizer, admin…).
- `organization_members.role` define su rol dentro de la entidad (owner, organizer, member).

Al cambiar roles desde el panel (promoción de equipo o asignación por super admin), el servidor mantiene ambos campos alineados mediante `OrganizationService.syncUserRoleWithOrganizationMembership`.

---

## Primer usuario y asignación automática

> [!NOTE]
> El **primer usuario** registrado en la plataforma recibe automáticamente `super_admin`. Los registros posteriores inician como `member`. Solo un super administrador puede promover roles globales desde `/superadmin/users` (o la ruta remapeada); los administradores de entidad gestionan organizer/member dentro de su equipo.
