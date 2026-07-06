---
title: "Setup Local y Entorno de Desarrollo"
description: "Guía paso a paso para clonar, configurar y ejecutar Eventia en tu máquina local."
layout: "../../layouts/DocLayout.astro"
---

Esta guía está diseñada para desarrolladores que desean contribuir al código base de Eventia. El proyecto utiliza **Next.js 16**, **Drizzle ORM**, **pnpm 11** y **PostgreSQL en Docker**.

---

## 1. Requisitos previos

* **Node.js** 20 o superior
* **pnpm** 11.10.0 (`corepack enable`)
* **Docker** y Docker Compose (Postgres local)
* Cuentas en **Pusher**, **Uploadthing** y **Upstash Redis** (ver `.env.example`)

## 2. Clonación e instalación

```bash
git clone https://github.com/LincolEulogio/SistemaEventsFIN.git
cd SistemaEventsFIN
pnpm install
```

## 3. Base de datos con Docker

Levanta Postgres aislado para desarrollo (puerto **15432**, no 5432):

```bash
docker compose up -d
```

Esto crea la base `eventia` con usuario `events_user` / contraseña `events_password`. Los datos viven en el volumen Docker `postgres_data` y **no** se mezclan con producción.

## 4. Variables de entorno

```bash
cp .env.example .env
```

### Variables obligatorias (extracto)

```env
DATABASE_URL="postgresql://events_user:events_password@localhost:15432/eventia"

BETTER_AUTH_SECRET="genera-al-menos-32-caracteres-aleatorios"
TICKET_SIGNING_KEY="otro-string-de-al-menos-32-caracteres"

SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT=2525
# ... resto según .env.example

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> `CRON_SECRET` es opcional en local; **obligatorio** en producción.

## 5. Inicializar esquema y datos demo

```bash
pnpm run db:push
pnpm run db:seed:all
```

`db:seed:all` carga roles, categorías, planes y eventos de demostración con portadas locales en `/public/images/event-covers/`.

## 6. Levantar la aplicación

```bash
pnpm run dev
```

* App: `http://localhost:3000`
* Documentación (opcional): `cd docs && pnpm install && pnpm run dev` → `http://localhost:4321`

## 7. Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm run db:studio` | UI Drizzle para inspeccionar tablas |
| `pnpm run db:backup` | Export JSON a carpeta `backups/` |
| `pnpm test` | Tests unitarios |
| `pnpm run typecheck` | Verificación TypeScript |

---

## Solución de problemas

- **"relation does not exist"**: ejecuta `pnpm run db:push` y verifica `DATABASE_URL` (puerto **15432**).
- **No conecta a Postgres**: `docker compose ps` — el contenedor debe estar `healthy`.
- **Puerto 5432 vs 15432**: el proyecto usa **15432** en Docker para no chocar con Postgres del sistema.
- **Eventos en producción pero no en local**: son bases distintas; ver [Local vs Producción](/docs/datos-local-vs-produccion).

---

## Siguiente lectura

* [Local vs Producción](/docs/datos-local-vs-produccion)
* [Despliegue](/docs/despliegue)
* [Migraciones](/docs/migraciones)
