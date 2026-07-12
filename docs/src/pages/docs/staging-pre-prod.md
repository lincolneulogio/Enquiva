---
title: "Staging pre-producción"
description: "Validar registro → pago → QR → check-in (cash + Culqi TEST) antes de promover a prod."
layout: "../../layouts/DocLayout.astro"
---

Antes de producción, corre este gate en **staging** (preview Vercel o local contra BD remota de staging).

---

## 1. Preparar fixtures

```bash
pnpm run seed:staging
```

Crea/actualiza:

| Recurso | Default |
|---------|---------|
| Organizer | `e2e-organizer@example.com` / `E2eTest123!@#` |
| Member | `e2e-member@example.com` / `E2eTest123!@#` |
| Evento pago | `/events/staging-pago-cash` (S/ 25, cash) |
| Evento gratis | `/events/staging-gratis` |

Overrides vía env: `E2E_ORGANIZER_EMAIL`, `E2E_MEMBER_EMAIL`, `E2E_*_PASSWORD`, `E2E_PAID_EVENT_SLUG`, `E2E_FREE_EVENT_SLUG`.

Escribe `e2e/.staging-fixtures.json` (gitignored).

---

## 2. Smoke del flujo crítico (obligatorio)

Ejecuta la lógica de negocio end-to-end **sin browser**:

```bash
pnpm run smoke:critical
```

Cubre:

1. Registro en evento de pago  
2. Pago **cash** → pending  
3. Aprobación organizer → ticket HMAC  
4. Check-in por código  
5. Registro en evento gratis → ticket inmediato  

Con Culqi TEST en env:

```bash
SMOKE_CULQI=1 pnpm run smoke:critical
```

Valida `sk_test_` / `pk_test_` y webhook secret (no cobra).

---

## 3. E2E UI (recomendado)

Con la app en marcha (`pnpm dev` o staging URL):

```bash
# local
pnpm run test:e2e:critical

# contra staging desplegado
PLAYWRIGHT_BASE_URL=https://tu-staging.vercel.app pnpm run test:e2e:critical
```

Comprueba catálogo, login member/organizer, pagos y scanner.

---

## 4. Culqi TEST — cobro real en browser (manual)

1. En staging: `CULQI_SECRET_KEY=sk_test_…` y `NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_test_…`
2. Webhook: URL `https://staging…/api/webhooks/culqi?token=CULQI_WEBHOOK_SECRET` (o HMAC del body)
3. Organizer → Medios de pago → Culqi con llaves **test**
4. Asocia Culqi al evento (además o en lugar de cash)
5. Member se inscribe → checkout Culqi → tarjeta de prueba Culqi  
6. Confirma ticket en `/member/tickets` y URL `/ticket/{code}?s=…` **sin login**
7. Organizer → Scan (o Express check-in) → entrada OK

Tarjetas de prueba: [docs Culqi](https://docs.culqi.com/).

---

## 5. Checklist go / no-go

| Check | Cómo |
|-------|------|
| `pnpm run smoke:critical` verde | Gate automático |
| Ticket público sin sesión | Abrir URL del smoke en incógnito |
| SMTP real en staging | OTP / ticket email |
| Culqi solo `*_test_` | `SMOKE_CULQI=1` |
| Crons con `CRON_SECRET` | `curl -H "Authorization: Bearer …" /api/cron/events` |
| `/api/health` OK | GET |

Si todo pasa → merge a `main` / promote a producción con llaves **live** y secretos nuevos (no reutilices `sk_test_`).

---

## 6. Comandos rápidos

```bash
pnpm run seed:staging
pnpm run smoke:critical
SMOKE_CULQI=1 pnpm run smoke:critical
pnpm run test:e2e:critical
```
