# Evora

Plataforma de gestión de eventos, inscripciones, pagos (Yape/Plin), transporte y control de acceso QR.

## Local vs producción

| Aspecto | Local | Producción |
|--------|--------|------------|
| **Código** | Este repositorio | Mismo repo (Vercel u otro host) |
| **Base de datos** | Docker Postgres en `localhost:15432` | Neon, Supabase o Vercel Postgres |
| **Datos** | Aislados en volumen Docker | BD remota propia del deploy |
| **Git push** | Solo sube código, no eventos | Igual: los eventos viven en PostgreSQL |

Los eventos **no están en Git**. Si ves eventos en [evora.app](https://evora.app), están en la `DATABASE_URL` de producción.

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
pnpm run dev
```

App: `http://localhost:3000`

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run db:push` | Sincronizar esquema Drizzle |
| `pnpm run db:reset` | Borrar todas las tablas (empezar de cero) |
| `pnpm run db:fresh` | Reset + schema + roles + Free + Plan Plataforma |
| `pnpm run db:seed:bootstrap` | Roles + Free + Plan Plataforma |
| `pnpm run db:sync:plans` | Deja solo planes canónicos (Free + Plan Plataforma) |
| `pnpm run db:backup` | Export JSON completo a `backups/` |
| `pnpm run typecheck` | Verificación TypeScript |

## Despliegue

1. Crear proyecto en Vercel conectado al repo.
2. Crear Postgres en Neon o Supabase; copiar `DATABASE_URL`.
3. Configurar variables de `.env.example` en Vercel (incluye `CRON_SECRET` obligatorio).
4. `vercel.json` define crons para eventos, suscripciones, broadcasts y verificación de backup.

## Licencia

Privado — uso del propietario del repositorio.
