# SISAS ANSI

**Sistema de Información Scout y Administración de Secciones** — Portal de la Asociación Nacional de Scouts Independientes (ANSI).

Censo nacional · Expedientes y fichas médicas · Credencial digital con QR verificable · Finanzas y comprobantes PDF · Eventos, campamentos y escáner de asistencia con cola offline · Progresión e insignias · Notificaciones · Vista de padre/tutor.

> **Estado:** funcional y verificado en local (build, lint, typecheck y pruebas HTTP en vivo). Detalle completo: **[DOCUMENTACION_SISAS_ANSI.md](DOCUMENTACION_SISAS_ANSI.md)** · Guía para scouters: **[MANUAL_USUARIO.md](MANUAL_USUARIO.md)** · Despliegue Azure: **[DEPLOY-AZURE.md](DEPLOY-AZURE.md)**

## Requisitos

- Node.js **≥ 20** (probado con v26) · npm ≥ 10
- Windows/macOS/Linux · no requiere PostgreSQL instalado (usa **PostgreSQL embebido**)

## Arranque rápido

```bash
npm install
npm run db:up        # terminal 1 — PostgreSQL embebido (déjala abierta)
npm run db:migrate   # terminal 2
npm run db:seed      # datos de demostración (¡borra y recrea!)
npm run dev          # http://localhost:3000
```

Producción local: `npm run build && npm run start` (o `npm run start -- -p 3100`).

## Cuentas de demostración

| Cuenta                | Rol                                    | Contraseña      |
| --------------------- | -------------------------------------- | --------------- |
| `admin@gmail.com`     | Administrador                          | `admin1234`     |
| `nacional@sisas.ansi` | Nacional                               | `Nacional2026!` |
| `jefe@sisas.ansi`     | Jefe de grupo                          | `Jefe2026!`     |
| `scouter@sisas.ansi`  | Scouter                                | `Scouter2026!`  |
| `tutor@sisas.ansi`    | Padre/Tutor (vinculado a 1 expediente) | `Tutor2026!`    |

Cambia o elimina estas cuentas antes de exponer el sistema.

## Qué incluye

- **Membresía**: censo con CURP, expediente, ficha médica auditada, credencial QR verificable públicamente (sin datos médicos).
- **Finanzas**: estado de cuenta por miembro, generación masiva del ciclo, cobro en 1 clic con **comprobante PDF**, ingresos/egresos, balance.
- **Eventos**: creación, inscripciones con cupo y responsiva parental, escáner QR (cámara) con **cola offline**, lista de asistencia **CSV/PDF**, logística (transporte/presupuesto).
- **Progresión**: aprobación de etapas, insignias por catálogo.
- **Seguridad**: Auth.js (JWT firmado), RBAC en servidor en cada API, CURP enmascarada, auditoría de accesos médicos, headers de seguridad, aislamiento del rol Tutor.
- **PWA**: instalable, offline básico.

## Estructura

```
prisma/      schema + migraciones + seed
public/      PWA (manifest, sw.js, icons)
scripts/     db-up.mjs (postgres embebido), db-check.mjs, generate-icons.mjs
src/app/     (auth) login/register · (dashboard) páginas · api/ 26 endpoints
src/components · src/lib · src/hooks · src/types
```

## Scripts

`dev` · `build` · `start` · `lint` · `typecheck` · `db:up` · `db:migrate` · `db:deploy` · `db:seed` · `db:generate`

## Datos y privacidad

Datos de demostración 100% ficticios. CURP enmascarada fuera del expediente; fichas médicas solo jefatura/coordinación; accesos auditados (`AuditLog`). La credencial pública no expone datos de salud. Ver sección 20 de la documentación.

## Licencia / uso

Proyecto interno de ANSI. Antes de un piloto real: cambiar contraseñas, rotar `AUTH_SECRET` y revisar avisos de privacidad (ver DEPLOY-AZURE.md).

Propiedad de miguel beer
