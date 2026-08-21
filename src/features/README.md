# Features (extracción incremental)

Enquiva hoy concentra dominio en `src/lib/*` + `src/services/*` + `src/components/*`.

## Objetivo

Mover **verticalmente por dominio** hacia `src/features/<dominio>/` sin big-bang:

```
src/features/
  registrations/   # guests, capacity, RegisterButton
  payments/        # checkout, Culqi, medios
  tickets/         # QR, check-in, TicketCard
  analytics/       # dashboards (service ya en src/services/analytics)
  transport/
  broadcast/

src/lib/           # solo infra: db, auth, redis, mail, i18n, pusher, utils
```

## Reglas

1. Un dominio a la vez; mantener alias `@/` funcionando.
2. `actions/` siguen siendo entrypoints delgados → services.
3. `lib/db/schema/` permanece centralizado.
4. No mover UI hasta que el service/lib del dominio esté estable.

## Prioridad sugerida

1. `analytics` (service facade ya existe)
2. `registrations` / guests
3. `payments`
4. `tickets`
