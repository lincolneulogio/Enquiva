# Enquiva

**Plataforma integral de gestión de eventos, pagos y asistentes — diseñada para organizadores en Perú.**

> **Producción:** [enquiva.site](https://enquiva.site) · **Stack:** Next.js 16 · TypeScript · PostgreSQL · Drizzle ORM · Tailwind CSS 4 · Better Auth · Cloudinary · Pusher · Culqi

---

## ¿Qué es Enquiva?

Enquiva es una plataforma SaaS multi-rol para la creación, publicación y gestión de eventos con venta de entradas. Cubre todo el ciclo: desde que el organizador crea un evento hasta que el asistente recibe su ticket QR, paga, aborda su transporte asignado y obtiene su certificado de participación.

---

## Índice

- [Tech Stack](#tech-stack)
- [Roles y permisos](#roles-y-permisos)
- [Arquitectura general](#arquitectura-general)
- [Módulos — diagnóstico completo](#módulos--diagnóstico-completo)
- [Esquema de base de datos](#esquema-de-base-de-datos)
- [API Routes](#api-routes)
- [Variables de entorno](#variables-de-entorno)
- [Desarrollo local](#desarrollo-local)
- [Scripts de base de datos](#scripts-de-base-de-datos)
- [Tests](#tests)
- [Deploy (Railway)](#deploy-railway)

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Lenguaje | TypeScript 6 |
| Estilos | Tailwind CSS 4 + Radix UI |
| Base de datos | PostgreSQL (Neon / Railway) |
| ORM | Drizzle ORM |
| Auth | Better Auth v1 |
| Pagos | Culqi (tarjeta, Yape via pasarela) |
| Imagenes | Cloudinary (prod) / almacenamiento local (dev) |
| Tiempo real | Pusher |
| Cache / Rate-limit | Upstash Redis |
| Email | Nodemailer (SMTP) |
| Push notifications | Web Push (VAPID) |
| IA / Chat | Vercel AI SDK — Google Gemini + OpenRouter |
| Editor de texto | Tiptap (rich-text) |
| Mapas | Leaflet + React-Leaflet |
| PDF / Excel | jsPDF + jsPDF-autotable + XLSX |
| Animaciones | AOS + Lenis (smooth scroll) |
| Graficas | Recharts |
| Validacion | Zod v4 + React Hook Form |
| Testing | Vitest (unit + integracion) + Playwright (e2e) |
| CI/CD | GitHub Actions |
| Package manager | pnpm 11 |

---

## Roles y permisos

| Rol | Descripcion |
|-----|-------------|
| `member` | Usuario estandar: se registra en eventos, paga, ve sus tickets |
| `organizer` | Crea y gestiona sus propios eventos, ve asistentes y pagos de esos eventos |
| `admin` | Gestion operativa de toda la plataforma (eventos, pagos, usuarios) |
| `super_admin` | Control total: plans, billing, configuracion de plataforma, audit log |
| `scanner` | Solo puede hacer check-in QR; sin acceso a datos sensibles |

---

## Arquitectura general

```
src/
├── app/                    # Next.js App Router (paginas y API routes)
│   ├── (auth)/             # Login, registro, recuperacion de contraseña
│   ├── (dashboard)/        # Dashboards protegidos por rol
│   │   ├── admin/          # Panel administrador
│   │   ├── organizer/      # Panel organizador
│   │   ├── member/         # Panel miembro
│   │   ├── scanner/        # Vista check-in QR
│   │   └── superadmin/     # Panel superadmin
│   ├── events/             # Catalogo publico + detalle de evento
│   ├── checkout/           # Flujo de pago
│   ├── attendee/           # Portal del asistente (ticket, estado)
│   ├── ticket/             # Visualizacion y descarga de ticket
│   ├── verify/             # Verificacion de email
│   └── api/                # API Routes (auth, pagos, webhooks, etc.)
├── actions/                # Server Actions de Next.js (mutaciones)
├── services/               # Logica de negocio (separada de la UI)
│   ├── events/             # Creacion, catalogo, spotlight, discovery
│   ├── payments/           # Checkout, submission, status, queries
│   ├── registrations/      # Inscripcion, waitlist, check-in
│   ├── transport/          # Rutas, reservas, manifiesto
│   ├── booking/            # Orquestador de flujo completo de reserva
│   ├── admin/              # Operaciones administrativas
│   ├── analytics/          # Metricas y reportes
│   └── route/              # Servicio de rutas utilitarias
├── lib/                    # Librerias y utilidades cross-cutting
│   ├── auth/               # Configuracion Better Auth
│   ├── db/                 # Drizzle + esquema PostgreSQL
│   ├── cloudinary/         # Upload server/client + componentes dropzone
│   ├── culqi/              # Integracion pasarela de pagos Culqi
│   ├── pusher/             # Broadcast tiempo real
│   ├── redis/              # Cache con Upstash Redis
│   ├── mail/               # Templates y envio de emails
│   ├── notifications/      # In-app + Web Push
│   ├── tickets/            # Firma HMAC + generacion QR
│   ├── certificates/       # Generacion PDF certificados
│   ├── export/             # Exportacion PDF/Excel de asistentes
│   ├── i18n/               # Español / Ingles (locales completos)
│   ├── billing/            # Logica de planes y suscripciones
│   ├── chat/               # Persistencia conversaciones IA
│   ├── cron/               # Tareas programadas
│   ├── analytics/          # Tracking de vistas y metricas
│   ├── geo/                # Geolocalizacion
│   └── validations/        # Schemas Zod compartidos
└── components/             # Componentes React reutilizables
```

---

## Modulos — diagnostico completo

### 1. Landing publica

**Ruta:** `/`

La pagina de inicio presenta la plataforma con secciones animadas (AOS + Lenis):

- **Hero** con CTA de registro/explorar eventos
- **EventsCatalogSection** — muestra los ultimos eventos publicados con filtros de categoria, modalidad, precio y fecha
- **PremierExperiencesSection** — destaca eventos premium (`isFeatured = true`)
- **UpcomingLaunchesSection** — proximos estrenos de eventos
- **EventSpotlightBanner** — banner superior dinamico configurable (modo automatico o evento fijado por admin)
- **PlatformAnnouncementBanner** — banner de avisos globales (info/warning/critical)
- Secciones de testimonios, newsletter y equipo (datos en BD, editables desde Superadmin)

**Paginas legales:** `/about`, `/contact`, `/terms`, `/privacy`, `/pricing` — contenido gestionado desde la BD mediante `platform_settings` y `pages`.

---

### 2. Autenticacion

**Rutas:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify`

Implementado con **Better Auth v1**. Soporta:

- Email + contraseña (con hash bcrypt)
- OAuth Google (opcional; se activa con `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`)
- Verificacion de email por enlace (token en BD)
- Recuperacion de contraseña por email
- Sesion basada en cookies HTTP-only

**API:** `/api/auth/[...all]` — proxy estandar de Better Auth.

---

### 3. Catalogo de eventos

**Rutas:** `/events`, `/events/[slug]`

- Listado con paginacion, filtros (categoria, modalidad, precio, fecha, estado)
- Vista de detalle con galeria, descripcion enriquecida (Tiptap HTML), mapa Leaflet, horarios multiples, informacion de transporte disponible
- SEO completo: `title`, `description`, `og:image`, JSON-LD `Event`
- Contador de vistas (`viewCount`) actualizado de forma no bloqueante
- Compartir en redes sociales
- Logica de cierre de ventas: `salesCutoffHoursBefore`

---

### 4. Registro e inscripcion

**Rutas:** `/events/[slug]` (formulario) → `/attendee/[registrationId]`

**Flujo:**
1. Usuario autenticado hace clic en "Inscribirse"
2. `BookingService.createBooking()` valida capacidad, estado del evento, cierre de ventas
3. Crea `Registration` en estado `registered`
4. Si el evento tiene precio — redirige al checkout
5. Si es gratuito — genera ticket inmediatamente
6. **Waitlist**: si el evento esta lleno, la inscripcion queda en `waitlisted`; al liberar un cupo, `BookingService.promoteFromWaitlist()` notifica al siguiente
7. **Invitados** (sin cuenta): el titular puede registrar acompañantes con nombre + telefono; se crean como `registrationGuests` vinculados al registro padre
8. **Hold de cupo**: el registro ocupa un cupo temporalmente (configurable por evento: `holdMinutesCard` / `holdHoursManual`); un cron libera cupos caducados

---

### 5. Pagos

**Rutas:** `/checkout/[registrationId]`

**Metodos de pago:**

| Tipo | Descripcion |
|------|-------------|
| `culqi` | Tarjeta de credito/debito + Yape via Culqi; flujo automatico con webhook |
| `cash` | Pago en efectivo; el organizador aprueba manualmente |
| `yape` / `plin` | Legacy — solo datos historicos; nuevos eventos usan Culqi |

**Flujo Culqi:**
1. Frontend crea un `Culqi Source` (token de tarjeta) o una `Culqi Order` (Yape)
2. Server Action llama a `POST /api/payments/culqi/charge` o `/culqi/order`
3. Culqi notifica resultado via webhook `POST /api/webhooks/culqi`
4. El webhook aprueba el pago, genera el ticket, envia email y notificacion push

**Flujo manual (efectivo):**
1. Asistente sube comprobante desde `/attendee/[registrationId]`
2. Organizador ve el pago pendiente y lo aprueba/rechaza
3. Al aprobar: genera ticket + notificacion

**Comisiones de plataforma:** Se calcula un `platformFee` por cada pago aprobado segun el plan del organizador. Queda registrado en `platform_transactions`.

---

### 6. Tickets y check-in QR

**Rutas:** `/ticket/[ticketId]`, `/attendee/[registrationId]`

- Ticket firmado con HMAC-SHA256 usando `TICKET_SIGNING_KEY`; URL a prueba de falsificacion
- QR generado con la libreria `qrcode`
- Pagina de verificacion publica: muestra nombre del asistente, evento, horario y estado
- **Check-in QR** (`/scanner/` o `/organizer/scan`): scanner de camara (`@yudiel/react-qr-scanner`) que valida el QR y marca `checked_in`
- Los tickets de **invitados** se generan individualmente
- Estado del ticket: `active` → `used` (tras check-in) o `cancelled`

---

### 7. Transporte

**Rutas:** `/organizer/transport`, `/admin/transport`, `/checkout/[registrationId]`

El organizador puede agregar rutas de transporte a su evento:

- Define `transportRoutes`: nombre, punto de salida, hora de partida/regreso, precio/asiento, conductor, placa
- Agrega **paradas** (`transportStops`) dentro de la ruta
- En el checkout, el asistente reserva asientos (`transportBookings`)
- El pago del transporte se incluye en el mismo `Payment`
- Exportacion del **manifiesto de pasajeros** en PDF/Excel
- Cron libera bookings pendientes sin pago al vencer el hold

---

### 8. Certificados

Los eventos pueden activar `hasCertificate`:

- El asistente descarga su certificado desde `/attendee/[registrationId]`
- Generado en PDF con **jsPDF** usando `certificateTitle` configurado por el organizador
- `certificatePrice`: gratuito (0) o de pago adicional
- Imagen del sello configurable (subida a Cloudinary)

---

### 9. Panel Organizador

**Ruta base:** `/organizer/`

| Seccion | Descripcion |
|---------|-------------|
| **Dashboard** | KPIs: total eventos, asistentes, ingresos, tasa de ocupacion; grafica de ingresos por mes |
| **Mis Eventos** | CRUD completo con formulario multi-paso (Tiptap editor, Leaflet map, Cloudinary dropzone) |
| **Asistentes** | Lista de inscritos por evento; busqueda, filtros, check-in manual, exportacion PDF/Excel |
| **Pagos** | Lista de pagos; aprobacion/rechazo manual; visualizacion de comprobantes |
| **Metodos de pago** | Configura que metodos acepta (Culqi, efectivo, QR Yape/Plin) |
| **Transporte** | Gestion de rutas y reservas |
| **Broadcasts** | Envio masivo de emails a todos los inscritos de un evento |
| **Analytics** | Metricas de vistas, clics y conversiones por evento |
| **Exportaciones** | Descarga listas de asistentes en PDF o Excel |
| **Notificaciones** | Centro de notificaciones in-app |
| **Perfil** | Edicion de nombre, bio, avatar |
| **Plan** | Informacion del plan activo y limites |
| **Pending** | Pantalla de espera si la solicitud de organizador esta en revision |

**Limites por plan:** `maxActiveEvents`, `maxAttendeesPerEvent`, `canFeature` y `maxBroadcastsPerMonth`.

---

### 10. Panel Admin

**Ruta base:** `/admin/`

| Seccion | Descripcion |
|---------|-------------|
| **Dashboard** | KPIs globales: ingresos totales, nuevos usuarios, eventos activos |
| **Eventos** | Lista, edicion y moderacion de todos los eventos |
| **Registraciones** | Todas las inscripciones de la plataforma con filtros avanzados |
| **Pagos** | Todos los pagos; aprobacion/rechazo masivo |
| **Usuarios** | Gestion de cuentas: cambio de rol, bloqueo, notas |
| **Roles** | Solicitudes de rol organizador (aprobar/rechazar) |
| **Transporte** | Supervision de todas las rutas de transporte |
| **Categorias** | CRUD de categorias de eventos |
| **Tipos de evento** | CRUD de tipos de evento (taxonomia secundaria) |
| **Broadcasts** | Envio de emails a inscritos de cualquier evento |
| **Analytics** | Metricas globales y por evento |
| **Billing** | Gestion de planes y suscripciones |
| **Audit Log** | Registro de todas las acciones criticas |
| **Onboarding** | Guia de primeros pasos para la configuracion |

---

### 11. Panel Superadmin

**Ruta base:** `/superadmin/`

Agrega a las capacidades de Admin:

| Seccion | Descripcion |
|---------|-------------|
| **Planes** | CRUD completo: precio mensual, limites, comisiones, moneda |
| **Billing** | Pagos de suscripciones, transacciones de plataforma, facturas |
| **Configuracion global** | Emails, redes sociales, SMTP personalizado, zona horaria, idioma |
| **Modo mantenimiento** | Activar/desactivar con mensaje y ventana programada |
| **Announcement banner** | Banner de avisos globales con severidad y fechas |
| **Event Spotlight banner** | Banner de evento destacado en la landing |
| **Testimonios** | CRUD de testimonios de la landing |
| **Newsletter** | Lista de suscriptores |
| **Terminos / Privacidad / Acerca / Contacto** | Edicion de paginas legales desde la BD |
| **Equipo** | CRUD de miembros del equipo mostrados en `/about` |

---

### 12. Panel Miembro

**Ruta base:** `/member/`

| Seccion | Descripcion |
|---------|-------------|
| **Dashboard** | Resumen: proximos eventos, historial |
| **Mis eventos registrados** | Lista con tickets y estado de pago |
| **Mis pagos** | Historial de pagos y comprobantes |
| **Scan** | Si tiene rol scanner, accede al lector QR |
| **Notificaciones** | Centro de notificaciones |
| **Perfil** | Edicion de datos personales y avatar |
| **Configuracion** | Preferencias, cambio de contraseña |

---

### 13. Notificaciones (In-app + Push)

**Tipos:** `event_published`, `registration_confirmed`, `event_cancelled`, `event_updated`, `event_reminder`, `waitlist_promoted`, `payment_submitted`, `payment_status_updated`, `organizer_request`, `organizer_approved`, `organizer_rejected`, `subscription_alert`, `transport_alert`, `finance_digest`

- **In-app:** Tabla `notifications` en BD; marcas de lectura; burbuja de contador en tiempo real via Pusher
- **Web Push:** Claves VAPID; subscripciones en `push_subscriptions`; envio asincrono
- **Email:** Cada evento critico dispara un email via Nodemailer con templates HTML

---

### 14. Broadcasts por email

- Organizador redacta mensaje (subject + body con Tiptap)
- Sistema crea un `BroadcastJob` con estado `pending`
- Cron lo procesa en lotes (`BROADCAST_BATCH_SIZE`, default 10)
- Limite mensual por plan (`maxBroadcastsPerMonth`)
- Registro en `broadcast_logs`

---

### 15. Chat IA (EnquivaBot)

**API:** `/api/chat`

- Chat contextual por ruta
- Multi-proveedor: **Google Gemini** (primario) + **OpenRouter** (fallback)
- Conversaciones persistidas en BD (`chat_conversations`, `chat_messages`)
- Rate limiting por usuario via Upstash Redis
- Limite mensual por plan (`maxAiMessagesPerMonth`)
- Streaming de respuestas (Vercel AI SDK)

---

### 16. Billing y planes

**Tablas:** `plans`, `subscriptions`, `subscription_payments`, `platform_transactions`, `commission_invoices`

**Planes configurables:**
- `priceMonthly` en PEN
- `maxActiveEvents` — limite de eventos publicados simultaneos
- `maxAttendeesPerEvent` — limite de asistentes por evento
- `commissionPercent` — % de comision sobre cada pago aprobado
- `commissionPerRegistration` — monto fijo por asistente confirmado
- `maxBroadcastsPerMonth` — broadcasts de email incluidos
- `maxAiMessagesPerMonth` — mensajes de IA incluidos
- `canFeatureEvents` — puede destacar eventos en la landing
- `hasCustomBranding` — branding personalizado

---

### 17. Analytics

- Tracking de `viewCount` por evento (incremento atomico en BD)
- Metricas del organizador: inscritos/dia, ingresos/mes, eventos activos vs. completados
- Metricas de admin: totales de plataforma por periodo
- Datos presentados con **Recharts** (graficas de barras, lineas, area)
- Exportacion de datos en Excel

---

### 18. Cron jobs

**API:** `/api/cron/[job]` — protegida con `Authorization: Bearer {CRON_SECRET}`

| Job | Frecuencia | Accion |
|-----|-----------|--------|
| `release-holds` | Cada 5-15 min | Libera cupos sin pago que vencieron |
| `release-transport-holds` | Cada 15 min | Libera reservas de transporte caducadas |
| `process-broadcasts` | Cada 2-5 min | Procesa lotes de broadcast jobs pendientes |
| `event-reminders` | Cada hora | Envia recordatorios por email/push |
| `subscription-lifecycle` | Diario | Renueva/vence suscripciones; genera facturas |

---

### 19. Audit log

**Tabla:** `activity_logs`

Registro inmutable de: cambios de rol, creacion/edicion/eliminacion de eventos, aprobacion/rechazo de pagos, cambios en planes, acciones de configuracion.

Cada entrada: `actorId`, `actorName`, `action` (ej. `payment.approve`), `entityType`, `entityId`, `ipAddress`, `userAgent`, `createdAt`.

Visible en `/admin/audit` y `/superadmin/audit`.

---

### 20. Marketing

- **Newsletter:** Suscripcion desde el footer; gestion con exportacion en Superadmin
- **Testimonios:** Tarjetas en la landing; gestionados con avatar (Cloudinary), rating y sortOrder

---

### 21. Configuracion de plataforma

**Tabla:** `platform_settings` (singleton `id = 'default'`)

Editable desde Superadmin en tiempo real, sin redeployar:
- Datos de contacto y redes sociales
- SMTP personalizado
- Zona horaria e idioma por defecto
- Modo mantenimiento y announcement banner
- Event Spotlight banner
- Color de acento de la plataforma

---

### 22. Internacionalizacion (i18n)

Soporte completo en **espanol** (es) e **ingles** (en). Seleccion almacenada en cookie. Idioma por defecto configurable desde Superadmin.

- Locales en `src/lib/i18n/locales/{es,en}/index.ts`
- Hook `useTranslation()` / funcion `t()` para cliente y servidor
- Formularios, errores de validacion, emails y notificaciones traducidos

---

### 23. Subida de archivos (Cloudinary / local)

**Modo produccion:** Cloudinary — firma HMAC generada en servidor via `/api/cloudinary/sign`; el navegador sube directo a Cloudinary.

| Endpoint | Carpeta | Uso |
|----------|---------|-----|
| `eventCoverImage` | `enquiva/events/{slug}/` | Portada de evento |
| `profileAvatar` | `enquiva/avatars/` | Avatar de usuario |
| `eventAttachment` | `enquiva/attachments/` | Adjuntos del evento |
| `paymentReceipt` | `enquiva/receipts/` | Comprobantes de pago |
| `testimonialAvatar` | `enquiva/testimonials/` | Avatars de testimonios |
| `certificateSealImage` | `enquiva/seal/` | Sello de certificado |
| `teamMemberPhoto` | `enquiva/team/` | Fotos del equipo |
| `paymentQr` | `enquiva/payment-qrs/` | QR de metodos de pago |
| `signature` | `enquiva/signatures/` | Firma del organizador |

**Modo desarrollo:** `UPLOAD_STORAGE=local` (predeterminado) — archivos en `public/uploads/`, servidos como rutas estaticas.

---

### 24. Tiempo real (Pusher)

**API:** `/api/pusher/auth`

| Canal | Evento | Proposito |
|-------|--------|-----------|
| `private-user-{userId}` | `notification` | Notificacion in-app en tiempo real |
| `private-event-{eventId}` | `attendee-updated` | Actualiza contador de asistentes en vivo |
| `private-admin` | `table-refresh` | Refresca tablas de admin automaticamente |
| `private-organizer-{userId}` | `payment-received` | Alerta al organizador de nuevo pago |

---

### 25. Cache (Upstash Redis)

- **Cache de queries lentas:** eventos destacados, catalogo publico, spotlight, analytics — TTL configurable por tipo
- **Rate limiting:** chat, sign de Cloudinary, webhooks — `@upstash/ratelimit` con sliding window
- **Invalidacion explicita:** `invalidateCache(key)` / `invalidateCachePattern(pattern)` tras cada mutacion relevante

---

## Esquema de base de datos

```
users                    # Better Auth — cuentas y sesiones
organizations            # Organizacion del organizador
events                   # Eventos (draft / published / cancelled / completed)
event_types              # Taxonomia secundaria de eventos
event_attachments        # Archivos adjuntos de eventos
registrations            # Inscripciones de usuarios a eventos
registration_guests      # Perfiles de invitados (sin cuenta)
payments                 # Pagos (manual, Culqi, efectivo)
payment_methods          # Metodos de pago configurados por organizador
event_payment_methods    # Relacion evento - metodos de pago
transport_routes         # Rutas de transporte de un evento
transport_stops          # Paradas dentro de una ruta
transport_bookings       # Reservas de asientos
tickets                  # Tickets generados y firmados
notifications            # Notificaciones in-app
push_subscriptions       # Suscripciones Web Push
broadcast_logs           # Registro de broadcasts enviados
broadcast_jobs           # Cola de jobs de broadcast
activity_logs            # Audit log de acciones
chat_conversations       # Conversaciones del chat IA
chat_messages            # Mensajes individuales del chat
plans                    # Planes de suscripcion
subscriptions            # Suscripciones activas de organizadores
subscription_payments    # Pagos de suscripcion
platform_transactions    # Comisiones e ingresos de plataforma
commission_invoices      # Facturas de comision
platform_settings        # Configuracion global (singleton)
pages                    # Contenido de paginas legales/estaticas
newsletter_subscribers   # Suscriptores del newsletter
testimonials             # Testimonios de la landing
team_members             # Equipo mostrado en /about
```

---

## API Routes

| Ruta | Metodo | Descripcion |
|------|--------|-------------|
| `/api/auth/[...all]` | ALL | Better Auth handler |
| `/api/cloudinary/sign` | POST | Genera firma para upload directo a Cloudinary |
| `/api/upload/local` | POST | Upload a disco local (solo desarrollo) |
| `/api/payments/culqi/charge` | POST | Crea cargo con tarjeta via Culqi |
| `/api/payments/culqi/order` | POST | Crea orden Culqi (Yape) |
| `/api/webhooks/culqi` | POST | Webhook de confirmacion de pagos Culqi |
| `/api/pusher/auth` | POST | Autenticacion de canales privados Pusher |
| `/api/chat` | POST | Streaming de respuestas del chat IA |
| `/api/tickets/[ticketId]/verify` | GET | Verifica validez de un ticket QR |
| `/api/tickets/[ticketId]/checkin` | POST | Hace check-in de un ticket |
| `/api/cron/release-holds` | GET | Libera cupos caducados |
| `/api/cron/process-broadcasts` | GET | Procesa broadcasts pendientes |
| `/api/cron/event-reminders` | GET | Envia recordatorios de eventos |
| `/api/billing/[...]` | POST | Gestion de suscripciones |
| `/api/health` | GET | Health check de la app |

---

## Variables de entorno

Todas se validan en tiempo de arranque con Zod. Un error de validacion muestra exactamente que variable falta.

```env
# Base de datos
DATABASE_URL=postgresql://...

# Autenticacion
BETTER_AUTH_SECRET=...           # min. 32 caracteres
TICKET_SIGNING_KEY=...           # min. 32 caracteres

# URL publica
NEXT_PUBLIC_APP_URL=https://enquiva.site

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM_EMAIL=noreply@enquiva.site
MAIL_FROM_NAME=Enquiva

# Pusher
PUSHER_APP_ID=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Upstash Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# IA (al menos uno)
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
AI_PROVIDER=google               # google | openrouter

# Culqi (opcional si no se usa Culqi)
CULQI_SECRET_KEY=...
CULQI_WEBHOOK_SECRET=...         # Obligatorio en prod si CULQI_SECRET_KEY esta
NEXT_PUBLIC_CULQI_PUBLIC_KEY=...

# Seguridad (obligatorios en produccion)
CRON_SECRET=...                  # min. 16 caracteres
PLATFORM_BOOTSTRAP_SECRET=...   # min. 16 caracteres

# Web Push (opcional)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:soporte@enquiva.site

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true

# Configuracion opcional
PLATFORM_FEE_PERCENT=5
BROADCAST_BATCH_SIZE=10
UPLOAD_STORAGE=local             # local | cloudinary (default: cloudinary en prod)
```

---

## Desarrollo local

### Requisitos

- Node.js >= 20
- pnpm 11 (`npm i -g pnpm`)
- PostgreSQL local o Neon/Supabase
- Redis (Upstash o Redis local)
- Pusher (cuenta gratuita en pusher.com)

### Setup

```bash
# 1. Clonar
git clone https://github.com/lincolneulogio/Enquiva.git
cd Enquiva

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp .env.production .env.local
# Editar .env.local con tus valores

# 4. Push del esquema a la BD
pnpm db:push

# 5. Seed inicial (superadmin + plan gratuito)
pnpm db:seed:bootstrap

# 6. Iniciar servidor de desarrollo
pnpm dev
```

> **Imagenes en dev:** Por defecto `UPLOAD_STORAGE=local`. Las imagenes se guardan en `public/uploads/`. No necesitas cuenta de Cloudinary para desarrollar.

---

## Scripts de base de datos

```bash
pnpm db:generate         # Genera migraciones Drizzle
pnpm db:migrate          # Aplica migraciones
pnpm db:push             # Push directo del schema (sin migraciones — solo dev)
pnpm db:studio           # Abre Drizzle Studio (explorador visual)
pnpm db:reset            # Borra todas las tablas
pnpm db:fresh            # reset + push + seed (entorno limpio)
pnpm db:sync:plans       # Sincroniza planes por defecto
pnpm db:backup           # Backup en JSON local
pnpm jobs:subscriptions  # Procesa ciclo de vida de suscripciones manualmente
```

---

## Tests

```bash
# Unit + integracion (Vitest)
pnpm test
pnpm test:watch

# Integracion de servicios (requiere BD real)
pnpm test:services:integration

# E2E (Playwright)
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:critical

# Staging gate (seed + smoke critico)
pnpm staging:gate
```

---

## Deploy (Railway)

1. Conectar el repositorio GitHub a Railway
2. Configurar todas las variables de entorno en el panel de Railway
3. Railway ejecuta `pnpm build` y luego `pnpm start`
4. Configurar los **cron jobs** externos:

| URL | Frecuencia | Header |
|-----|-----------|--------|
| `GET /api/cron/release-holds` | Cada 10 min | `Authorization: Bearer {CRON_SECRET}` |
| `GET /api/cron/process-broadcasts` | Cada 3 min | `Authorization: Bearer {CRON_SECRET}` |
| `GET /api/cron/event-reminders` | Cada hora | `Authorization: Bearer {CRON_SECRET}` |

> **Nota:** El build omite la validacion de env vars (`NEXT_PHASE=phase-production-build`). La validacion ocurre al arrancar. Si falta una variable, el log muestra exactamente cual gracias al handler en `src/env.ts`.

---

## Estructura de ramas

| Rama | Proposito |
|------|-----------|
| `main` | Produccion — deploy automatico en Railway |
| `developer` | Desarrollo activo — PRs se mergean aqui primero |

---

*Ultima actualizacion: octubre 2026*
