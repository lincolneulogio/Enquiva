# Eventia

Plataforma de gestión de eventos, inscripciones, pagos (Yape/Plin), transporte y control de acceso QR.

## Local vs producción

| Aspecto | Local | Producción |
|--------|--------|------------|
| **Código** | Este repositorio | Mismo repo (Vercel u otro host) |
| **Base de datos** | Docker Postgres en `localhost:15432` | Neon, Supabase o Vercel Postgres |
| **Datos** | Aislados en volumen Docker | BD remota propia del deploy |
| **Git push** | Solo sube código, no eventos | Igual: los eventos viven en PostgreSQL |

Los eventos **no están en Git**. Si ves eventos en [eventia.app](https://eventia.app), están en la `DATABASE_URL` de producción.

## Requisitos

- Node.js 20+
- pnpm 11.10.0 (`corepack enable`)
- Docker (recomendado para Postgres local)

## Inicio rápido

```bash
git clone https://github.com/LincolEulogio/SistemaEventsFIN.git
cd SistemaEventsFIN
pnpm install
cp .env.example .env
docker compose up -d
pnpm run db:push
pnpm run db:seed:all
pnpm run dev
```

App: `http://localhost:3000` · Docs: `cd docs && pnpm run dev` → `http://localhost:4321`

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run db:push` | Sincronizar esquema Drizzle |
| `pnpm run db:seed:all` | Roles, categorías, planes y eventos demo |
| `pnpm run db:backup` | Export JSON completo a `backups/` |
| `pnpm test` | Tests unitarios |
| `pnpm run typecheck` | Verificación TypeScript |

## Despliegue

Ver [docs/src/pages/docs/despliegue.md](docs/src/pages/docs/despliegue.md) o la documentación publicada en `/docs/despliegue`.

Resumen:

1. Crear proyecto en Vercel conectado al repo.
2. Crear Postgres en Neon o Supabase; copiar `DATABASE_URL`.
3. Configurar variables de `.env.example` en Vercel (incluye `CRON_SECRET` obligatorio).
4. `vercel.json` define crons para eventos, suscripciones, broadcasts y verificación de backup.

## Documentación

- [Setup local](docs/src/pages/docs/setup-local.md)
- [Local vs producción](docs/src/pages/docs/datos-local-vs-produccion.md)
- [Despliegue](docs/src/pages/docs/despliegue.md)
- [Operaciones y secretos](docs/src/pages/docs/operaciones.md)
- [Migraciones](docs/src/pages/docs/migraciones.md)
- [Esquema de BD](docs/src/pages/docs/base-de-datos.md)

## Licencia

Privado — uso del propietario del repositorio.
