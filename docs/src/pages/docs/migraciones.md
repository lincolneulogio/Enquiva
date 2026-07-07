---
title: "Estrategia de Migraciones"
description: "Cómo evolucionar el esquema: db:push, drizzle-kit y scripts migrate-*.ts."
layout: "../../layouts/DocLayout.astro"
---

Eventia acumuló varios métodos de migración. Esta guía unifica el criterio para nuevos cambios.

---

## Métodos actuales

| Método | Comando / ubicación | Uso recomendado |
|--------|---------------------|-----------------|
| **Drizzle push** | `pnpm run db:push` | Desarrollo local, prototipos |
| **Drizzle generate/migrate** | `db:generate`, `db:migrate` | Producción cuando existan carpetas `drizzle/` versionadas |
| **Scripts TS** | `scripts/migrate-*.ts` | Migraciones de datos o DDL puntual ya existente |
| **SQL manual** | `drizzle/*.sql` (si aplica) | Cambios revisados en PR |

---

## Flujo recomendado para cambios nuevos

1. Edita esquema en `src/lib/db/schema/*.ts`.
2. En local: `pnpm run db:push` y prueba la app.
3. Para producción estable: `pnpm run db:generate` → revisa SQL → `pnpm run db:migrate` en deploy o pipeline.
4. Si hay **transformación de datos** (backfill), añade `scripts/migrate-descripcion.ts` idempotente y documenta aquí.

---

## Scripts históricos (`package.json`)

Ejemplos ya registrados:

- `db:migrate:payment-methods`
- `db:migrate:subscriptions-organization`
- `db:migrate:events-view-count`

Si restauras desde cero:

```bash
pnpm run db:reset
pnpm run db:push
```

---

## Producción

1. Backup (`pnpm run db:backup` o snapshot del proveedor).
2. Aplicar migración en ventana de bajo tráfico.
3. Verificar con smoke test manual.
4. No uses `db:push` destructivo contra producción sin revisar el diff de Drizzle.

---

## Reset local

```bash
docker compose down -v
docker compose up -d
pnpm run db:push
```
