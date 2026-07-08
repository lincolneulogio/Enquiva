---
title: "Local vs Producción"
description: "Dónde viven los datos, cómo se aíslan los entornos y por qué Git no sube eventos."
layout: "../../layouts/DocLayout.astro"
---

Evora separa **código** (Git) y **datos** (PostgreSQL). Entender esta diferencia evita confusiones al ver eventos en tu dominio que no existen en tu máquina local.

---

## ¿Dónde están los eventos?

Los eventos, usuarios, pagos e inscripciones están en tablas PostgreSQL (`events`, `users`, `registrations`, etc.). **No** están en el repositorio de GitHub.

| Pregunta | Respuesta |
|----------|-----------|
| ¿Los eventos están en el código? | No, están en PostgreSQL |
| ¿GitHub los sube a internet? | No, solo sube código |
| ¿Por qué hay eventos en mi dominio? | Producción usa su propia `DATABASE_URL` |
| ¿Local y web comparten datos? | Solo si apuntan a la misma `DATABASE_URL` |

---

## Entorno local (desarrollo)

- **Postgres en Docker** (`docker compose up -d`): puerto **15432**, base `eventia`, usuario `events_user`.
- Volumen `postgres_data`: los datos persisten entre reinicios del contenedor.
- `.env` típico: `DATABASE_URL=postgresql://events_user:events_password@localhost:15432/eventia`
- La BD local empieza vacía tras `pnpm run db:push`. No hay datos ficticios en el repositorio.

---

## Entorno de producción

- Host (p. ej. Vercel) ejecuta el mismo código que el repo.
- `DATABASE_URL` apunta a un Postgres gestionado (Neon, Supabase, etc.).
- Variables distintas: `NEXT_PUBLIC_APP_URL`, SMTP real, `CRON_SECRET`, etc.
- Los datos de producción **no** se mezclan con Docker local salvo que configures la misma URL remota (no recomendado para desarrollo).

---

## Buenas prácticas

1. **Nunca** uses la `DATABASE_URL` de producción en local para pruebas destructivas.
2. Usa `pnpm run db:backup` o el panel super admin para export JSON antes de migraciones arriesgadas.
3. Confía en los backups automáticos del proveedor (Neon PITR, Supabase backups) como respaldo principal.
4. El cron semanal `/api/cron/backup` verifica conectividad y conteos de tablas en producción.

---

## Diagrama

```mermaid
flowchart LR
  subgraph local [Local]
    Dev[pnpm dev]
    Docker[(Postgres :15432)]
    Dev --> Docker
  end
  subgraph prod [Producción]
    Vercel[Vercel]
    Neon[(Neon / Supabase)]
    Vercel --> Neon
  end
  Git[GitHub - solo código] --> Dev
  Git --> Vercel
```
