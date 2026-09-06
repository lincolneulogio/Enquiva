---
name: "source-command-audit-enquiva"
description: "Migrated source command `audit-enquiva`"
---

# source-command-audit-enquiva

Use this skill when the user asks to run the migrated source command `audit-enquiva`.

## Command Template

# Enquiva Full Audit

Audita esta funcionalidad utilizando las Rules relevantes del proyecto.

Como mínimo considera:

1. code-quality
2. architecture
3. security
4. testing
5. performance
6. database
7. api-design
8. error-handling
9. Laravel
10. Next.js
11. React
12. TypeScript
13. Enquiva domain
14. multi-tenancy
15. RBAC
16. payments
17. tickets
18. QR
19. check-in
20. registrations
21. transportation
22. notifications

Selecciona y aplica únicamente las Rules que sean relevantes
para el código que estás auditando.

No modifiques código.

Quiero un informe con:

- bugs
- vulnerabilidades
- problemas de arquitectura
- problemas de rendimiento
- problemas de autorización
- problemas de autenticación
- problemas de lógica de negocio
- problemas de multi-tenancy
- problemas de base de datos
- problemas de API
- problemas de pagos
- problemas de webhooks
- problemas de tickets
- problemas de QR
- problemas de check-in
- problemas de concurrencia
- problemas de validación
- problemas de manejo de errores
- problemas de testing
- deuda técnica relevante

Clasifica cada hallazgo como:

- CRITICAL
- HIGH
- MEDIUM
- LOW
- INFO

Para cada hallazgo indica:

- Severidad.
- Archivo.
- Línea o ubicación.
- Problema.
- Evidencia.
- Impacto.
- Condición necesaria para reproducirlo.
- Solución recomendada.

No inventes problemas.

Diferencia claramente:

- CONFIRMED
- POTENTIAL
- RECOMMENDATION

No consideres una preferencia personal como una vulnerabilidad.

Al finalizar incluye:

## Resumen

CRITICAL: X
HIGH: X
MEDIUM: X
LOW: X
INFO: X

## Seguridad

Authentication: PASS/FAIL
Authorization: PASS/FAIL
Multi-tenancy: PASS/FAIL
Input validation: PASS/FAIL
Injection protection: PASS/FAIL
Secrets: PASS/FAIL
CSRF: PASS/FAIL
Rate limiting: PASS/FAIL

## Enquiva

Payments: PASS/FAIL
Webhooks: PASS/FAIL
Registrations: PASS/FAIL
Tickets: PASS/FAIL
QR: PASS/FAIL
Check-in: PASS/FAIL
Transportation: PASS/FAIL
RBAC: PASS/FAIL

## Calidad

Architecture: PASS/FAIL
Code quality: PASS/FAIL
Performance: PASS/FAIL
Database: PASS/FAIL
Testing: PASS/FAIL

## Production readiness

READY / READY WITH WARNINGS / NOT READY
