---
title: "Autenticación y Matriz de Roles"
description: "Cómo funciona Better-Auth y los distintos niveles de permisos en la aplicación."
layout: "../../layouts/DocLayout.astro"
---

Para mantener los datos de nuestra comunidad seguros, EncuentroDeFe utiliza **Better-Auth**, una librería moderna y extremadamente segura para manejar sesiones mediante cookies HTTP-Only y validaciones criptográficas.

---

## Matriz de Permisos (Roles)

El sistema soporta cuatro niveles de jerarquía rígidos. Cada usuario posee un rol definido en la base de datos que determina a qué páginas y APIs puede acceder, acompañado de una estética visual premium y distintiva.

### 1. Rol: Superadministrador (`super_admin`)
Es el creador principal o dueño supremo de la plataforma.
- **Acceso:** Panel de Administración Total (`/admin/*`).
- **Color y Badge:** Cyan (`text-cyan-400 bg-cyan-400/10 border-cyan-400/20`) con el ícono `Crown` (Corona).
- **Permisos Exclusivos:** Gestión total de todos los roles de la base de datos, incluyendo la promoción o degradación de otros administradores. Acceso completo a los respaldos de la base de datos y todas las métricas analíticas.

### 2. Rol: Administrador (`admin`)
Personal administrativo encargado de gestionar y supervisar las operaciones globales.
- **Acceso:** Dashboard Administrativo (`/admin/*`).
- **Color y Badge:** Rosado (`text-rose-400 bg-rose-400/10 border-rose-400/20`) con el ícono `ShieldCheck` (Escudo verificado).
- **Permisos:** Puede asignar roles de menor nivel (como Organizador o Miembro), exportar respaldos de base de datos a JSON, y visualizar la recaudación financiera y analíticas avanzadas.

### 3. Rol: Organizador (`organizer`)
Personal del equipo de staff, logística o coordinadores de eventos.
- **Acceso:** Vistas de coordinación y escaneo (`/organizer/*`).
- **Color y Badge:** Azul (`text-blue-400 bg-blue-400/10 border-blue-400/20`) con el ícono `Briefcase` (Portafolio).
- **Permisos Exclusivos:** Visualización de listas de asistentes, aprobación/rechazo de comprobantes de pago (Yape/Plin/Transferencias), y acceso al **Escáner QR** en tiempo real para control de accesos.

### 4. Rol: Miembro (`member`)
Asistentes, feligreses o usuarios finales de la plataforma.
- **Acceso:** Rutas públicas y su panel privado (`/member/*` / `/profile`).
- **Color y Badge:** Verde/Esmeralda (`text-emerald-400 bg-emerald-400/10 border-emerald-400/20`) con el ícono `UserRound` (Usuario).
- **Permisos:** Registro en eventos, carga de sus comprobantes de pago, selección de rutas de transporte y visualización/descarga de su Ticket QR personal de acceso.

---

## Flujo de Inicio de Sesión (OTP)

Dado que es una plataforma enfocada en la facilidad de uso y alta seguridad, **no usamos contraseñas tradicionales opcionales** (aunque están disponibles). Hemos implementado un flujo de verificación de correo seguro:

1. El usuario se registra con su Email.
2. Better-Auth envía un código OTP (One-Time Password) de 6 dígitos a su correo.
3. El usuario ingresa el código.
4. El servidor valida el código e inyecta una Cookie `Set-Cookie` cifrada con el `BETTER_AUTH_SECRET`.

### Protección de Rutas (Middleware)

Next.js protege las rutas mediante su archivo `middleware.ts`. Si un usuario con rol `member` intenta acceder a `/admin`, el middleware interceptará la petición en el borde (Edge) y lo redirigirá a la página de inicio en menos de 10 milisegundos, antes de siquiera cargar la página.

```typescript
// Ejemplo simplificado de protección de rutas
if (request.nextUrl.pathname.startsWith('/admin')) {
  const session = await getSession(request);
  if (session?.user.role !== 'admin' && session?.user.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
```

> [!NOTE]
> **Asignación Automática de Seguridad:** El primer usuario que se registre en la plataforma (tanto en desarrollo local como en producción) recibirá automáticamente el rol de `super_admin` por parte del servidor. A partir de ese momento, cualquier otro usuario que se registre de forma regular iniciará estrictamente como `member` (Miembro). El `super_admin` es el único facultado para promover o cambiar los roles de los usuarios desde la interfaz en la sección de gestión de usuarios.
