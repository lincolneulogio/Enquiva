---
title: "Estrategia de Migraciones"
description: "Cómo evolucionar el esquema con Drizzle: db:push, generate y migrate."
layout: "../../layouts/DocLayout.astro"
---

Evora usa **Drizzle** como vía única para el esquema. Los scripts históricos `migrate-*.ts` ya no forman parte del repo.

---

## Métodos actuales

| Método | Comando / ubicación | Uso recomendado |
|--------|---------------------|-----------------|
| **Drizzle push** | `pnpm run db:push` | Desarrollo local, prototipos |
| **Drizzle generate/migrate** | `db:generate`, `db:migrate` | Producción con carpetas `drizzle/` versionadas |
| **SQL versionado** | `drizzle/*.sql` | Cambios revisados en PR |
| **Scripts de ops** | `scripts/` (seed, backup, jobs, staging) | Arranque y operación, no DDL |

---

## Flujo recomendado para cambios nuevos

1. Edita esquema en `src/lib/db/schema/*.ts`.
2. En local: `pnpm run db:push` y prueba la app.
3. Para producción: `pnpm run db:generate` → revisa SQL → `pnpm run db:migrate` en deploy.
4. Si necesitas un backfill puntual, añade un script idempotente en `scripts/` y un comando npm temporal; elimínalo cuando ya no sirva.

---

## Restaurar desde cero

```bash
pnpm run db:fresh
```

Eso hace: `db:reset` → `db:push` → `db:seed:bootstrap` (roles + Free + Plan Plataforma).

Planes SaaS comerciales adicionales: el superadmin los crea en el panel. Para dejar solo canónicos: `pnpm db:sync:plans`.

---

## Producción

1. Backup (`pnpm run db:backup` o snapshot del proveedor).
2. Aplicar migración en ventana de bajo tráfico.
3. Verificar con smoke test (`pnpm run staging:gate` en staging).
4. No uses `db:push` destructivo contra producción sin revisar el diff de Drizzle.
