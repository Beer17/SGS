# SISAS ANSI — Documentación técnica completa

> Sistema de Información Scout y Administración de Secciones
> Portal nacional de la **Asociación Nacional de Scouts Independientes (ANSI)**

**Stack:** Next.js 14.2 · React 18 · TypeScript (strict) · Auth.js v5 (beta) · Prisma 5.22 · PostgreSQL 18 (embebido en dev) · Tailwind CSS 3 · PWA · @react-pdf/renderer · qrcode.react · lucide-react

**Última actualización:** 4 de noviembre de 2026 · Estado: **verificado y funcional en local** (build verde, lint limpio, typecheck limpio, APIs y PDF probados en vivo).

---

## Tabla de contenidos

1. [Visión general](#1--visión-general)
2. [Estado de verificación (qué se probó y resultado)](#2--estado-de-verificación)
3. [Stack y versiones](#3--stack-y-versiones)
4. [Scripts npm y comandos de operación](#4--scripts-npm-y-comandos-de-operación)
5. [Estructura de carpetas](#5--estructura-de-carpetas)
6. [Archivos de configuración raíz](#6--archivos-de-configuración-raíz)
7. [Base de datos — Prisma](#7--base-de-datos--prisma)
8. [Datos de demostración (seed)](#8--datos-de-demostración-seed)
9. [Autenticación y sesiones (Auth.js v5)](#9--autenticación-y-sesiones-authjs-v5)
10. [Control de acceso RBAC — matriz de permisos](#10--control-de-acceso-rbac--matriz-de-permisos)
11. [Código del servidor (`src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`, `src/lib/*`)](#11--código-del-servidor)
12. [Tipos y constantes (`src/types/*`)](#12--tipos-y-constantes)
13. [App Router — Layouts y páginas](#13--app-router--layouts-y-páginas)
14. [API — Referencia de endpoints](#14--api--referencia-de-endpoints)
15. [Componentes](#15--componentes)
16. [Hooks](#16--hooks)
17. [PWA — manifest, service worker e iconos](#17--pwa)
18. [Scripts auxiliares (`scripts/`)](#18--scripts-auxiliares)
19. [Flujos clave paso a paso](#19--flujos-clave-paso-a-paso)
20. [Seguridad y protección de datos de menores](#20--seguridad-y-protección-de-datos-de-menores)
21. [Variables de entorno](#21--variables-de-entorno)
22. [Modelo de datos para Azure / producción](#22--modelo-de-datos-para-azure--producción)
23. [Estado real vs. las 5 fases del proyecto](#23--estado-real-vs-las-5-fases-del-proyecto)
24. [Pendientes conocidos](#24--pendientes-conocidos)

---

## 1 — Visión general

SISAS ANSI centraliza la administración de la asociación:

- **Censo nacional** de miembros (jóvenes y adultos) por sección, grupo y provincia.
- **Expediente y ficha médica** por miembro (alergias, restricciones, contactos de emergencia, autorización parental) con auditoría de accesos.
- **Credencial digital** con QR verificable públicamente sin filtrar datos médicos.
- **Finanzas**: estado de cuenta por miembro, cuotas de ciclo, ingresos/egresos, comprobantes PDF y recordatorios in-app por vencer/vencidas.
- **Eventos y logística**: campamentos, reuniones, capacitaciones; inscripciones con cupo y responsiva; escáner QR con cámara real y **cola offline**; lista de asistencia exportable a CSV/PDF.
- **Progresión scout**: etapas por sección, aprobación con sello y notificación, catálogo de insignias.
- **Notificaciones in-app** generadas de forma perezosa (sin cron externo).
- **Vista de padre/tutor**: solo expedientes vinculados.
- **Carga masiva** del censo por CSV con reporte de errores por fila.

## 2 — Estado de verificación

Ejecutado el 3-4 de noviembre de 2026 sobre Windows 11 + Node 26.7 + PostgreSQL 18.6 embebido:

| Prueba | Resultado |
|---|---|
| `npm run build` (Next 14.2.35) | ✅ 39 páginas + 26 API routes compiladas |
| `npm run typecheck` (tsc --noEmit) | ✅ sin errores |
| `npm run lint` (next lint + .eslintrc) | ✅ 0 errores, 0 warnings |
| `npm run db:migrate` | ✅ `20261104032340_init`, `20261104033249_evento_cancelado` aplicadas |
| `npm run db:seed` | ✅ 44 miembros, 4 grupos, 3 provincias, 6 usuarios, 60 cuotas, 4 eventos, 10 insignias, 12 ítems |
| Login Auth.js (CSRF → credentials → JWT) | ✅ `admin@gmail.com` / `admin1234` → sesión `role=ADMIN` |
| Middleware sin sesión | ✅ `/` → 307 `/login`; APIs → 401 |
| Aislamiento Tutor | ✅ `/api/miembros` → 1 resultado (su vinculado); cuotas → solo las suyas; movimientos/inventario/detalle de evento/asistencia → 403 |
| Admin | ✅ `/api/miembros` → 44; detalle de evento → 200 |
| PDF comprobante de pago | ✅ HTTP 200 `application/pdf` (firma `%PDF`) |
| PDF/CSV lista de asistencia | ✅ 200 `application/pdf` / `text/csv` |
| Recordatorios in-app perezosos | ✅ generados al consultar `/api/notificaciones` (7 no leídas para admin tras seed) |
| Headers de seguridad | ✅ X-Frame-Options DENY, CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy |
| PWA | ✅ manifest.json válido, SW v2, iconos 192/512/maskable/apple-touch |

Cómo repetir: `npm run db:up` (terminal 1) · `npm run build && npm run start` · luego las rutas de la sección 19.

## 3 — Stack y versiones

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Framework | Next.js | ^14.2.35 | App Router, SSR/SSG, Route Handlers, Middleware |
| UI | React | ^18.3.1 | Componentes |
| Lenguaje | TypeScript | ^5.7.2 (strict) | `target: ES2020`, paths `@/*` → `src/*` |
| Auth | next-auth (Auth.js) | 5.0.0-beta.32 | Sesiones JWT, Credentials provider, split config edge-safe |
| ORM | Prisma | ^5.22.0 | Schema, migraciones, cliente con singleton global |
| BD | PostgreSQL | 18.6 (embebido) | `embedded-postgres` para dev, sin instalación del SO |
| Estilos | Tailwind CSS | ^3.4.16 | Tokens propios (ink/moss/fern/citrus/paper/clay) |
| PDF | @react-pdf/renderer | ^4.9.0 | Comprobantes y asistencia |
| QR | qrcode.react (SVG) · jsQR | ^4.1.0 · ^1.4.0 | Credencial y escáner |
| Validación | zod | ^3.25.76 | Esquemas de entrada en todas las APIs |
| Passwords | bcryptjs | ^3.0.3 | Hash cost 10 |
| Iconos | lucide-react | ^0.468.0 | UI |
| Tests | vitest | ^5.1.0 | (config aún no creada — ver sección 24) |
| PWA | manifest + SW propio | — | Offline básico del shell |

Node.js: **v26.7.0** (probado) · npm **11.19.0** · Windows 11.

## 4 — Scripts npm y comandos de operación

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (hot reload) en :3000 |
| `npm run build` / `npm run start` | Build de producción / servir el build |
| `npm run lint` | ESLint (`next/core-web-vitals`) — sin errores/warnings |
| `npm run typecheck` | `tsc --noEmit` — sin errores |
| `npm run test` | `vitest run` (aún sin tests — sección 24) |
| `npm run db:up` | **Levanta PostgreSQL embebido** en :5432 (dejar en terminal 1). Crea la BD `sisas_ansi` la primera vez |
| `npm run db:migrate` | `prisma migrate dev` (desarrollo) |
| `npm run db:deploy` | `prisma migrate deploy` (producción/Azure) |
| `npm run db:seed` | Repuebla datos demo (**destructivo**: borra y recrea) |
| `npm run db:push` | `prisma db push` (sin migraciones; solo prototipos) |
| `npm run db:generate` | Regenera el cliente Prisma |
| `npm run db:seed` → `node scripts/db-check.mjs` | Verificación rápida de conteos y credencial de prueba |
| `node scripts/generate-icons.mjs` | Regenera los PNG de la PWA (sin dependencias nativas) |

Arranque limpio desde cero:

```bash
npm install
npm run db:up        # terminal 1 (permanente)
npm run db:migrate   # terminal 2
npm run db:seed
npm run dev          # o build + start
```

Puerto 3000 ocupado → `npm run start -- -p 3100`.

## 5 — Estructura de carpetas

```
SGS/
├── prisma/
│   ├── schema.prisma            # 18 modelos, 8 enums
│   ├── migrations/              # init + evento_cancelado
│   └── seed.ts                  # datos demo deterministas
├── public/
│   ├── icons/                   # icon-192/512, maskable-512, apple-touch-icon
│   ├── manifest.json            # PWA
│   └── sw.js                    # Service Worker v2 (network-first, sin /api)
├── scripts/
│   ├── db-up.mjs                # PostgreSQL embebido (init/start/create-db)
│   ├── db-check.mjs             # conteo rápido (lectura)
│   └── generate-icons.mjs       # PNG PWA sin dependencias nativas
├── src/
│   ├── auth.ts                  # NextAuth completo (Credentials + bcrypt + rate limit)
│   ├── auth.config.ts           # Split config edge-safe (sin Prisma/bcrypt) → middleware
│   ├── middleware.ts            # Guard global: sesión + rol /admin
│   ├── app/
│   │   ├── layout.tsx           # Root layout (lang, metadata, icons, Providers, PWA)
│   │   ├── providers.tsx        # SessionProvider (Auth.js)
│   │   ├── globals.css
│   │   ├── (auth)/login|register/   # públicas
│   │   ├── (dashboard)/             # protegidas: panel administrativo y vista tutor
│   │   └── api/                     # 26 route handlers (REST)
│   ├── components/                # layout, members, eventos, dashboard, credencial, AdminOnly
│   ├── hooks/                     # useSession (fachada Auth.js), useNotificaciones (polling 60s)
│   ├── lib/                       # db, auth (RBAC server), validations (zod), api (audit), csv, reminders…
│   └── types/                     # enums TS + next-auth.d.ts (augmentación de sesión)
├── .env / .env.example            # DATABASE_URL, AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL
├── .eslintrc.json                 # next/core-web-vitals
├── next.config.mjs                # headers de seguridad + CSP
├── tailwind.config.ts / tsconfig.json / postcss.config.mjs
└── package.json                   # scripts + prisma.seed
```

## 6 — Archivos de configuración raíz

| Archivo | Propósito |
|---|---|
| `package.json` | Dependencias y scripts (arriba); `prisma.seed = tsx prisma/seed.ts`; `allowScripts` aprueba build scripts de prisma/esbuild/embedded-postgres |
| `tsconfig.json` | `strict`, `target ES2020`, `paths @/*`, plugin de Next |
| `next.config.mjs` | `reactStrictMode`, `poweredByHeader: false`, headers: `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy`, `Permissions-Policy camera=(self)`, HSTS, CSP (`default-src 'self'`, `frame-ancestors 'none'`) |
| `.eslintrc.json` | `next/core-web-vitals` |
| `.gitignore` | node_modules, .next, .env, **.postgres/**, *.tsbuildinfo |
| `.env` | Local (no se sube): `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sisas_ansi`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL` |
| `.env.example` | Plantilla con los mismos nombres y valores de ejemplo |
| `tailwind.config.ts` | Tokens: ink `#17241f`, moss `#2b6a50`, fern `#e7f1e8`, citrus `#f2c94c`, paper `#f7f8f3`, clay `#c96b4b`; sombras `shadow-soft`; fuentes Manrope/Space Grotesk |
| `postcss.config.mjs` | Tailwind + autoprefixer |
| `next-env.d.ts` | Generado por Next (no editar) |

## 7 — Base de datos — Prisma

Proveedor: **PostgreSQL** (`DATABASE_URL`). Migraciones: `20261104032340_init`, `20261104033249_evento_cancelado`.

### Enums (8)

| Enum | Valores |
|---|---|
| `Role` | ADMIN · NACIONAL · PROVINCIA · GRUPO · SECCION · MIEMBRO_TUTOR |
| `Seccion` | MANADA · TROPA · COMUNIDAD · CLAN · JEFATURA |
| `EstatusRegistro` | ACTIVO · PENDIENTE · VENCIDO · BAJA |
| `TipoEvento` | NACIONAL · REGIONAL · GRUPO · CAMPAMENTO · REUNION · CAPACITACION |
| `TipoMovimiento` | INGRESO · EGRESO |
| `TipoCuota` | MEMBRESIA · EVENTO · OTRO |
| `EstatusCuota` | PAGADA · PENDIENTE · VENCIDA · EXENTA |
| `EstadoItem` | DISPONIBLE · PRESTADO · MANTENIMIENTO · **DANADO** (sin Ñ: Prisma exige ASCII) · BAJA |
| `TipoNotificacion` | CUOTA_VENCIMIENTO · EVENTO_RECORDATORIO · PROGRESION_APROBADA · SISTEMA · MENSAJE |

### Modelos (18)

**Usuarios y autenticación**
- `User` — id uuid, email único, passwordHash (bcrypt), role, activo, emailVerified, lastLogin. Relaciones: scoutProfile 1-1, progresionesAprobadas, cuotasRegistradas, movimientosRegistrados, notificaciones, auditLogs.
- `Provincia` — nombre, region; tiene grupos y scouts.
- `GrupoScout` — `@@unique([provinciaId, numeroGrupo])`; tiene scouts, eventos, inventario, movimientos.

**Miembros**
- `ScoutProfile` — nombres, apellidos, curp (único), fechaNacimiento, telefono, foto, seccion, grupoId, provinciaId, estatusRegistro (default PENDIENTE), codigoCredencialQR (uuid único → QR), cicloActivo, userId (opcional, vincula cuenta). Índices: curp, código QR, (grupoId, seccion), estatusRegistro, (apellidos, nombres).
- `FichaMedica` — 1-1 con ScoutProfile (cascade): tipoSangre, alergias, padecimientos, medicamentos, tratamientoActual, restriccionesActividad, seguMedico, nombreMedico, telefonoMedico, **contactoEmergenciaNombre/Tel (+parentesco) y 2.º contacto**, autorizacionActividades.
- `ProgresionScout` — etapas por sección con aprobadaPorId → User, fechaAprobacion, evidencia.
- `Insignia` — catálogo (seccion?, categoria, imagen). `InsigniaObtenida` — `@@unique([scoutProfileId, insigniaId])`.

**Eventos**
- `Evento` — nombre, tipo, fechaInicio/Fin, cupoMaximo, requiereAutorizacion, **cancelado** (baja lógica), grupoId?. Índices por fechas/tipo/grupo.
- `InscripcionEvento` — `@@unique([eventoId, scoutProfileId])`, autorizacionParental, pagoCuota, observaciones.
- `LogisticaEvento` — 1-1 con Evento: transporteInfo, lugarCampamento, equipoRequerido (JSON texto), presupuesto (Decimal), notas.
- `Asistencia` — `@@unique([eventoId, scoutProfileId])`, horaEscaneo, sincronizadoOffline, registradoPorId.

**Finanzas**
- `Cuota` — scoutProfileId, tipo, concepto, monto Decimal(10,2), ciclo ("2026-2027"), estatus, fechaVencimiento/Pago, comprobante, registradoPorId, notas. Índices: (scoutProfileId, ciclo), estatus, fechaVencimiento.
- `MovimientoFinanciero` — grupoId, tipo, concepto, monto, fecha, categoria, registradoPorId.

**Inventario**
- `ItemInventario` — grupoId, nombre, categoria, cantidad, estado, ubicacion, valorUnitario, fechaAdquisicion.
- `PrestamoInventario` — itemId, prestatarioNombre, fechaPrestamo/Devolucion, devuelto.

**Notificaciones y auditoría**
- `Notificacion` — destinatarioId → User, tipo, titulo, mensaje, leida, accionUrl, **dedupeKey @unique** (idempotencia de recordatorios automáticos).
- `AuditLog` — userId, accion, entidad, entidadId, datosAntes/Despues (Json), ip. Índices: (userId, createdAt), (entidad, entidadId). Lo escriben: altas/bajas/edición de miembros, consultas y ediciones de ficha médica, cobros, generación de cuotas, aprobaciones, préstamos, cancelaciones, cambios de usuario/password, importaciones.

## 8 — Datos de demostración (seed)

`npm run db:seed` (**borra y recrea** todo). Determinista (PRNG mulberry32 semilla 20261103).

- **Territorio**: 3 provincias (Querétaro–Bajío, Puebla–Centro, Jalisco–Occidente), 4 grupos (G12 Halcones, G25 Águilas, G04 Centauros, G21 Volcán).
- **Usuarios demo** (contraseña entre paréntesis, entorno local):

| Cuenta | Rol | Nota |
|---|---|---|
| `admin@gmail.com` | ADMIN | **admin1234** (pedida por el usuario para la demo) |
| `nacional@sisas.ansi` | NACIONAL | Nacional2026! |
| `provincia@sisas.ansi` | PROVINCIA | Provincia2026! |
| `jefe@sisas.ansi` | GRUPO | Jefe2026! |
| `scouter@sisas.ansi` | SECCION | Scouter2026! |
| `tutor@sisas.ansi` | MIEMBRO_TUTOR | Tutor2026! → vinculado al expediente de Andrea Hernández Vargas (Tropa, G12) |

- **44 miembros** (11 por grupo: 4 manada, 3 tropa, 2 comunidad, 2 clan), CURPs ficticias válidas en formato, fechas de nacimiento coherentes con la edad de su sección, ~90% ACTIVO, resto PENDIENTE/VENCIDO.
- **44 fichas médicas** (algunos con alergias/padecimientos/restricciones → mosaico de "alertas médicas"), ~85% con autorización parental.
- **Progresión**: 4-5 etapas por miembro con avance aleatorio aprobado por jefe/scouter.
- **Insignias**: catálogo de 10 (Servicio/Naturaleza/Aventura/Destreza) otorgadas al azar (0-3 por miembro).
- **Eventos**: "Campamento Nacional de Invierno 2026" (18–21 dic, Valle de Bravo, responsiva, cupo 120, con logística y presupuesto), Reunión de Jefatura, Taller de Primeros Auxilios, Jornada de Limpieza del Río (pasada, con asistencias).
- **16 inscripciones** al campamento; **cuotas** MEMBRESIA 850 MXN del ciclo 2026-2027 (~68% pagadas; resto pendiente/vencida) + cuota de evento 1,500 para inscritos.
- **Movimientos** del Grupo 12 (ingresos/egresos reales del trimestre) e **inventario** del G12 (12 ítems: 2 prestados, 1 en mantenimiento, 1 dañado).
- **Notificaciones** de bienvenida por rol (incl. dedupeKeys `seed:*`).

## 9 — Autenticación y sesiones (Auth.js v5)

- **Split config** (patrón oficial Auth.js): `src/auth.config.ts` (edge-safe: `pages.signIn=/login`, sesión JWT 8 h, callbacks jwt/session) + `src/auth.ts` (Credentials + bcrypt + **rate limit en memoria**: 5 fallos / 5 min por email+IP).
- **Flujo**: `GET /api/auth/csrf` → `POST /api/auth/callback/credentials` (form-encoded) → cookie de sesión JWT firmada (httpOnly, SameSite=Lax, 8 h) → `GET /api/auth/session`.
- La sesión expone `user: { id, email, role }` (augmentación en `src/types/next-auth.d.ts`).
- Cambio de contraseña propia: `POST /api/usuarios/password` (verifica la actual). Gestión de cuentas (alta/baja/rol) solo ADMIN: `/api/usuarios`.
- Login devuelve 302 (Auth.js); el cliente (`signIn('credentials', { redirect: false })`) navega a `callbackUrl` o `/`.
- El middleware (`src/middleware.ts`) usa `NextAuth(authConfig).auth(...)`: rutas públicas restringidas a `/login`, `/register`, `/api/auth/*`, `/api/credencial/verify`, assets; `/admin/*` exige rol ADMIN/NACIONAL; todo lo demás exige sesión; APIs devuelven **401** sin sesión y páginas redirigen a `/login`.
- `/login` muestra las cuentas demo (pensado para la presentación) — cámbialas o elimínalas en producción.
- **Nunca** exponer `AUTH_SECRET`. Rotarlo invalida todas las sesiones.

## 10 — Control de acceso RBAC — matriz de permisos

Roles: `ADMIN` (todo) · `NACIONAL` · `PROVINCIA` · `GRUPO` · `SECCION` · `MIEMBRO_TUTOR`.

Helpers del servidor (`src/lib/auth.ts`): `getSession()`, `requireApiRole(roles?)` → `{ session } | { error: NextResponse }` (401/403), `canOperate()` (staff operativo), `canManageFinances()` (ADMIN/NACIONAL/GRUPO), `canManageMembers()` (+PROVINCIA), `canViewMedical()` (staff, **nunca tutor ajeno**), `isAdmin()`. Páginas usan `getSession()` + redirect.

| Recurso / acción | ADMIN | NACIONAL | PROVINCIA | GRUPO | SECCION | MIEMBRO_TUTOR |
|---|---|---|---|---|---|---|
| Ver censo (listado) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **solo sus vinculados** |
| Alta/edición/baja de miembros | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Detalle expediente (`/api/miembros/[id]`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **solo vinculado** |
| Ficha médica (ver/editar) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (403); propio vinculado: solo ver página ficha |
| Cuotas: ver | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **solo las de sus vinculados** |
| Cuotas: cobrar/generar/crear | ✅ | ✅ | ❌* | ✅ | ❌ | ❌ |
| Movimientos financieros ver/registrar | ✅ | ✅ | ✅ (ver) | ✅ | ✅ (ver)** | ❌ 403 |
| Eventos: crear/editar/cancelar | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Eventos: inscribir/desinscribir | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Detalle evento (nombres de inscritos) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ 403 |
| Asistencia: registrar (escáner) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (voluntario en puerta) |
| Asistencia: ver lista / exportar CSV·PDF | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ 403 |
| Progresión: aprobar etapas | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Insignias: crear/otorgar | ✅/✅ | ✅/✅ | ❌/✅ | ❌/✅ | ❌/✅ | ❌/❌ |
| Inventario: ver / prestar / devolver | ✅/✅/✅ | ✅/✅/✅ | ✅/✅/✅*** | ✅/✅/✅ | ✅/❌/❌ | ❌ 403 |
| Cuentas de usuario (alta/baja/rol/activo) | ✅ | ver lista | ❌ | ❌ | ❌ | ❌ |
| Importar censo CSV | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/admin/*` (Editor del portal) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

\* PROVINCIA puede cobrar solo si se le agrega a `canManageFinances()` — hoy no.
\** SECCION ve movimientos (lectura) — decisión de producto; si no aplica a tu operación, quítalo en `canOperate` del endpoint.
*** PROVINCIA prest/devolver permitido (logística multi-grupo); restringible en `/api/inventario/[id]/prestar`.

**Reglas de oro implementadas en servidor** (no en cliente):
- CURP enmascarada en listados (`maskCurp`); completa solo en el detalle con permiso.
- `MIEMBRO_TUTOR` en `/api/miembros`, `/api/progresion`, `/ficha/[id]`, `/credencial/[id]`, `/api/finanzas/cuotas` → filtrado `userId = session.id` en SQL.
- Auditoría (`AuditLog`) en toda consulta/edición de ficha médica, cobros, altas/bajas, aprobaciones.

## 11 — Código del servidor

### `src/auth.ts` — NextAuth (Node runtime)
Credentials provider: valida `LoginSchema` (email+password ≥8), normaliza email a minúsculas, **rate limit** por email+IP (5 fallos/5 min), `bcrypt.compare`, actualiza `lastLogin`, devuelve `{ id, email, role }`. Exporta `handlers` (GET/POST `[...nextauth]`), `auth`, `signIn`, `signOut`.

### `src/auth.config.ts` — Edge-safe
`pages.signIn='/login'`, sesión JWT `maxAge` 8 h, callbacks `jwt` (siembra `id`/`role` desde `user`) y `session` (los publica). **Sin imports de Prisma/bcrypt** (por eso el middleware no revienta en edge).

### `src/middleware.ts`
`NextAuth(authConfig).auth((req) => …)`; rutas públicas: `/login`, `/register`, `/api/credencial/verify`, `/api/auth/*`, `_next`, assets (regex `\.[a-z0-9]{2,5}$`), manifest/sw/icons. Si hay sesión en `/login` → redirect `/`. `/admin*` exige ADMIN/NACIONAL. Sin sesión: páginas → 307 `/login?callbackUrl=…`; APIs → 401 JSON.

### `src/lib/db.ts`
Singleton `PrismaClient` en `global.prisma` (evita fugas en dev hot-reload).

### `src/lib/auth.ts`
`SessionUser`, `getSession()` (vía `auth()`), `requireApiRole(roles?)` con respuestas 401/403 listas para `return`, `canAccess`, `requireRole` (lanza), `isAdmin`, `canManageFinances` (ADMIN/NACIONAL/GRUPO), `canManageMembers` (+PROVINCIA), `canOperate` (+SECCION), `canViewMedical`.

### `src/lib/api.ts`
`audit({ userId, accion, entidad, entidadId, datosAntes?, datosDespues? })` (nunca lanza), `maskCurp()` (`GODL••••••…`), `toNumber()`.

### `src/lib/reminders.ts` — recordatorios perezosos
`ensureReminders(session)` se invoca en `GET /api/notificaciones`. Crea (con `createMany skipDuplicates` + `dedupeKey` único) notificaciones para: cuotas VENCIDA o PENDIENTE con vencimiento ≤ 7 días (roles con visión financiera) y eventos que inician ≤ 7 días (staff operativo). Tope 25 por llamada. Idempotente; 0 para tutores/miembros.

### `src/lib/attendance.ts`
`extractCredentialCode(raw)` — acepta código crudo, URL completa de verificación (`…?code=`) o fragmento `?code=`; devuelve el UUID o `null`. Usado por escáner y por `POST /api/asistencia`.

### `src/lib/csv.ts`
Parser CSV propio: autodetección `,`/`;`, BOM, CRLF/LF, comillas con escape `""`, encabezados normalizados (minúsculas, sin acentos, espacios→`_`). `rowToObject()`. Testeable y sin dependencias.

### `src/lib/validations.ts`
Zod para todas las entradas: Login, Register, ScoutProfile, FichaMedica, Evento, Inscripcion, **AsistenciaSchema** (máx 500 registros), **LogisticaEventoSchema**, Cuota, Movimiento, InventarioItem, Prestamo, Progresión, Insignias, GrupoScout.

### `src/lib/utils.ts`
`cn()`, `formatDate` (es-MX), `formatCurrency` (MXN), `calcularEdad()`, `estatusCuotaColor`, `estatusRegistroColor`, `estadoItemColor`, `tipoMovimientoColor/Prefix`, `getInitials`.

### `src/lib/labels.ts`
Etiquetas es-MX: `ROLE_LABELS`, `TIPO_EVENTO_LABELS`, `TIPO_NOTIFICACION_LABELS`.

## 12 — Tipos y constantes

`src/types/index.ts` — `Role`, `Seccion`, `RegistroStatus`, `TipoEvento`, enums de cuotas/inventario/notificaciones; `ROLES`, `SECTIONS`, `SECTION_LABELS`, `SECTION_AGES`, `PERMISSIONS`, `ROLE_PERMISSIONS`, `hasPermission()`; interfaces `ScoutSummary`, `ScoutProfileFull`, `FichaMedicaForm`, `CuotaItem`, `MovimientoItem`, `InventarioItem`, `NotificacionItem`, `DashboardMetrics`.
`src/types/next-auth.d.ts` — `Session.user.{id,role}` y `JWT.{id,role}` para Auth.js.

## 13 — App Router — Layouts y páginas

### Layouts y shell
| Ruta/archivo | Qué es |
|---|---|
| `src/app/layout.tsx` | `<html lang="es">`, metadata (título, manifest, iconos), viewport `themeColor #2b6a50`, monta `<Providers>` (SessionProvider) y `<PwaRegistration>` |
| `src/app/providers.tsx` | `SessionProvider` de next-auth/react (cliente) |
| `src/app/(dashboard)/layout.tsx` | Grid 2 columnas: `<Sidebar>` (fija) + columna con `<Topbar>` y `{children}` |
| `src/app/(auth)/…` | Grupo de ruta pública (no afecta URL) |
| `src/app/(dashboard)/…` | Grupo de ruta protegido por middleware + `getSession()` |

### Páginas (todas verificadas en build)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/login` | `(auth)/login/page.tsx` | Formulario; `signIn('credentials', {redirect:false})`; muestra cuentas demo; respeta `?callbackUrl=` |
| `/register` | `(auth)/register/page.tsx` | Solicitud de acceso (validación en provincia); sin backend — intencional |
| `/` | `(dashboard)/page.tsx` | **Servidor.** Staff: KPIs reales (miembros activos, grupos, alertas médicas, próximos eventos), balance del mes, actividad reciente (AuditLog), próximo evento con cuenta regresiva. Tutor: `<TutorDashboard>` (expediente vinculado, cuotas, inscripciones) |
| `/censo` | `(dashboard)/censo/page.tsx` | Cliente; `?q/seccion/estatus/grupoId`; tabla paginada; filtros; enlaces a ficha/edición |
| `/censo/nuevo` | `(dashboard)/censo/nuevo/page.tsx` | Alta con `<MemberForm mode="create">` |
| `/censo/[id]/editar` | `(dashboard)/censo/[id]/editar/page.tsx` | Edición con `<MemberForm mode="edit">` |
| `/ficha/[id]` | `(dashboard)/ficha/[id]/page.tsx` | **Servidor.** Expediente completo: datos, edad, CURP enmascarada, alerta médica global, ficha médica (si permiso), progresión, insignias; auditoría `CONSULTA_FICHA_MEDICA`; impresión limpia (PRINT_CSS); `MemberActions` (credencial/editar/baja con confirmación). Tutor: solo su vinculado |
| `/credencial/[id]` | `(dashboard)/credencial/[id]/page.tsx` | **Servidor.** `CredencialCard` con QR real (`codigoCredencialQR`) + estado; tipo de sangre solo jefatura/propio; CSS de impresión |
| `/secciones` | `(dashboard)/secciones/page.tsx` | **Servidor.** Conteos reales por sección (tutor: solo sus vinculados) |
| `/secciones/[section]` | `(dashboard)/secciones/[section]/page.tsx` | **Servidor.** Slug MANADA…JEFATURA; cards de miembros → ficha |
| `/grupos` | `(dashboard)/grupos/page.tsx` | Cliente; grupos por provincia con conteos; `<NuevoGrupoModal>` (ADMIN/NACIONAL/PROVINCIA) |
| `/progresion` | `(dashboard)/progresion/page.tsx` | Cliente; busca miembro; etapas con **Aprobar**; catálogo de insignias con **Otorgar**; modal “+ Etapa” |
| `/finanzas` | `(dashboard)/finanzas/page.tsx` | Cliente; selector de grupo; resumen (recaudado, pendientes, balance); tabla con **Cobrar** (abre comprobante PDF) y estado; movimientos con modal; **Generar cuotas del ciclo** (masivo) |
| `/inventario` | `(dashboard)/inventario/page.tsx` | Cliente; selector de grupo; filtros por estado; chips de resumen; **Prestar/Devolver** con modales; alerta de préstamos > 7 días; alta de ítem |
| `/eventos` | `(dashboard)/eventos/page.tsx` | Cliente; crear (modal completo); tarjetas con cupo/inscritos/asistencias; panel por evento: asistencia (CSV/PDF/Escáner), **InscribirMiembro** (búsqueda, responsiva opcional), logística editable, cancelar/eliminar según rol |
| `/eventos/escaner` | `(dashboard)/eventos/escaner/page.tsx` | **jsQR + getUserMedia**; selector de evento; contador en vivo; captura manual alternativa; cola offline en `localStorage` con auto-sync al volver la red; dedupe de lecturas (4 s) |
| `/calendario` | `(dashboard)/calendario/page.tsx` | Cliente; grid de mes real (eventos multi-día); panel lateral con del día/próximos |
| `/carga` | `(dashboard)/carga/page.tsx` | CSV de censo: plantilla descargable, preview, importación con reporte de creados/errores por fila |
| `/notificaciones` | `(dashboard)/notificaciones/page.tsx` | Cliente; filtros, marcar leída/todas; enlaces a `accionUrl` |
| `/perfil` | `(dashboard)/perfil/page.tsx` | Cuenta propia + **cambio de contraseña** (`/api/usuarios/password`) |
| `/configuracion` | `(dashboard)/configuracion/page.tsx` | Cuentas (admin: activar/desactivar/crear), roles explicados |
| `/admin/editor` | `(dashboard)/admin/editor/page.tsx` | CMS de contenido institucional; guardado local (demo); protegido por `AdminOnly` + middleware `/admin` |
| `/inventario` y demás | — | ver secciones arriba |

### Componentes clave
`components/members/MemberForm.tsx` (alta/edición compartida) · `MemberActions.tsx` (baja lógica con doble confirmación) · `PrintButton.tsx` · `components/eventos/NuevoEventoModal.tsx` · `InscribirMiembro.tsx` (debounce, confirmación de responsiva) · `components/dashboard/TutorDashboard.tsx` (servidor; vista padre) · `components/layout/Sidebar.tsx` (cliente; nav activa, usuario real, logout) · `Topbar.tsx` (búsqueda → `/censo?q=`, campana con contador y dropdown, menú móvil) · `nav-links.ts` (fuente única de navegación) · `PrintCss.ts` (`@media print`) · `AdminOnly.tsx` (gate visual, la seguridad real está en servidor) · `PwaRegistration.tsx` · `CredencialCard.tsx` (QR SVG verificable).

## 14 — API — Referencia de endpoints

Convenio: sesión requerida salvo donde se indica; errores JSON `{ error, details? }`; roles en corchetes. `401` sin sesión · `403` sin permiso · `400` validación (zod `flatten()`) · `404` no encontrado · `409` conflicto de negocio/unicidad.

| Endpoint | Roles | Descripción |
|---|---|---|
| `GET /api/auth/[...nextauth]` · `GET/POST /api/auth/*` | público | Auth.js (csrf, callback, session, signout) |
| `GET /api/miembros?q&seccion&estatus&grupoId&page&limit` | todos* | Lista paginada (tutor: solo sus vinculados) |
| `POST /api/miembros` | ADMIN NACIONAL PROVINCIA GRUPO | Alta (zod), CURP→UPPERCASE, audit `CREAR_MIEMBRO` |
| `GET/PATCH/DELETE /api/miembros/[id]` | ver / editar / baja | Detalle (ficha médica solo staff) CURP enmascarada · baja lógica `BAJA` |
| `GET/PUT /api/miembros/[id]/ficha-medica` | staff | Upsert ficha; audit `CONSULTA/EDITAR_FICHA_MEDICA` |
| `POST /api/miembros/import` + `GET …/plantilla` | staff gestor | Importa CSV (≤500 filas, activos como PENDIENTE); plantilla descargable |
| `GET/POST /api/eventos` | ver / [ADMIN NACIONAL PROVINCIA GRUPO] | Lista (sin cancelados por defecto, `?cancelados=1`) · crear con validación de fechas |
| `GET/PATCH/DELETE /api/eventos/[id]` | staff / gestión / solo ADMIN | Detalle con inscritos+cupo / editar / eliminar (bloqueado si hay inscritos → cancelar) |
| `POST/DELETE /api/eventos/[id]/inscribir` | staff+SECCION | Cupo máximo, responsiva obligatoria si `requiereAutorizacion`, miembro activo; duplicado→409 |
| `PUT /api/eventos/[id]/logistica` | gestión | Transporte, campamento, equipo, presupuesto |
| `GET /api/eventos/[id]/asistencia?format=json\|csv\|pdf` | staff | Lista con nombres; export CSV (Excel-compatible, BOM) y PDF (lista firmable) |
| `POST /api/asistencia` | todos | Escáner: valida evento (existe, no cancelado) y credencial (extrae `code=` de URLs); upsert por (evento, miembro); reporta aceptadas/rechazadas |
| `GET /api/asistencia?eventoId=` | staff | Total + lista (contador en vivo del escáner) |
| `GET/POST /api/finanzas/cuotas?ciclo&estatus&grupoId&scoutProfileId` | ver todos* / gestión | Tutor: solo sus vinculados; `POST` registra cuota |
| `POST /api/finanzas/cuotas/generar` | gestión | **Masiva**: crea PENDIENTE para ACTIVOS sin MEMBRESIA del mismo ciclo (`dedupe` natural) |
| `POST /api/finanzas/cuotas/[id]/pagar` | gestión | Marca PAGADA + fecha; audit `COBRAR_CUOTA` |
| `GET /api/finanzas/cuotas/[id]/comprobante` | gestión | **PDF** comprobante (folio `SISAS-XXXXXXXX`, desglose, importe) |
| `GET/POST /api/finanzas/movimientos` | staff / gestión | Balance por grupo (ingresos/egresos/categorías) |
| `GET/POST /api/progresion` · `POST /api/progresion/[id]/aprobar` | ver/alta staff | Aprobación con sello + notificación al expediente vinculado + audit |
| `GET/POST /api/insignias` · `POST /api/insignias/otorgar` | ver / crear [ADMIN NACIONAL] / otorgar staff+SECCION | Otorgar notifica al vinculado (dedupe `insignia:*`) |
| `GET/POST /api/inventario` · `POST …/[id]/prestar` · `POST …/[id]/devolver` | staff / [NACIONAL PROVINCIA GRUPO ADMIN] | Transacción préstamo↔estado del ítem; devolución con estado final (DISPONIBLE/MANTENIMIENTO/DANADO) |
| `GET/POST /api/notificaciones` · `POST/PATCH …/[id]/leer` | todas | `GET` genera recordatorios perezosos (dedupe) y lista (no leídas primero) |
| `GET /api/provincias` | todos | Catálogo territorial (para altas) |
| `GET/POST/PATCH /api/usuarios` · `POST /api/usuarios/password` | [ADMIN, lista también NACIONAL] / propia | Alta/baja/rol/activo; no puedes desactivarte |
| `GET /api/credencial/verify?code=` | **público** | Validez de credencial (nombre, sección, grupo, estatus). **Sin datos médicos** (decisión de privacidad) |
| `GET /api/grupos` · `GET/POST /api/provincias` | todos / [ADMIN NACIONAL PROVINCIA] | Listado y alta de grupo |

\* “todos” = cualquier rol autenticado; el filtrado por tutor se aplica en la consulta.

## 15 — Componentes

Ver tabla en sección 13. Reglas: los componentes cliente llevan `'use client'`; el acceso a datos desde componentes de servidor va directo a Prisma con guardia `getSession()` (nunca exponer `DATABASE_URL`); ningún componente decide permisos de seguridad — solo UI.

## 16 — Hooks

| Hook | Función |
|---|---|
| `useSession()` (`src/hooks/useSession.ts`) | Fachada del `SessionProvider`: `{ user: {id,email,role}, loading, logout() }` (logout = `signOut({redirectTo:'/login'})`) |
| `useNotificaciones()` (`src/hooks/useNotificaciones.ts`) | `{ items, noLeidas, marcarLeida(id), refetch() }`; polling cada 60 s; tolerante a offline |

## 17 — PWA

- `public/manifest.json` — nombre, `theme_color #2b6a50`, `background #f7f8f3`, `display standalone`, `lang es-MX`, **iconos 192/512 any + maskable**, `start_url /`.
- `public/sw.js` — **v2** (`sisas-ansi-v2`): install cachea app shell (`/`, manifest, iconos); activate purga cachés viejas; fetch = network-first con fallback a caché (solo GET; **nunca `/api/*`**); al navegar offline sirve el shell cacheado.
- Iconos generados por `scripts/generate-icons.mjs` (estrella scout lima sobre verde, anillo crema). `apple-touch-icon.png` 180 px.
- `PwaRegistration` registra el SW al montar; `PrintCss.ts` da impresión limpia (expediente, listas).

## 18 — Scripts auxiliares

| Script | Acción |
|---|---|
| `scripts/db-up.mjs` | Crea/arranca el cluster en `.postgres/` (primer arranque ~10 s); crea BD `sisas_ansi` si no existe; muestra `DATABASE_URL`; detiene con Ctrl+C (`pg.stop()`) |
| `scripts/db-check.mjs` | Imprime credencial de prueba y conteos (solo lectura) |
| `scripts/generate-icons.mjs` | Genera `public/icons/*.png` (encoder PNG propio con zlib; sin ImageMagick/sharp) |

## 19 — Flujos clave paso a paso

1. **Login**: `/login` → `signIn('credentials')` → cookie JWT → `/`. En servidor, `auth()` en cada page/API. Rate limit tras 5 fallos (5 min).
2. **Alta de miembro**: `/censo` → Nuevo miembro → `MemberForm` → `POST /api/miembros` (zod; CURP normalizada; grupo fija `provinciaId`) → queda en **PENDIENTE** → jefatura valida documentos → ACTIVO desde la ficha (`estatusRegistro`) → audit `CREAR_MIEMBRO`.
3. **Cobro**: `/finanzas` → fila PENDIENTE → **Cobrar** → `POST .../pagar` (transacción + audit) → se abre `GET .../comprobante` (PDF con folio). `totalRecaudado` y pendientes se refrescan.
4. **Cuotas del ciclo**: “Generar cuotas del ciclo” → `POST /api/finanzas/cuotas/generar` → crea solo ACTIVOS sin MEMBRESIA/{ciclo} → minutos después aparecen avisos en campanita (recordatorio perezoso si vencen ≤7 días).
5. **Campamento**: `/eventos` → Nuevo (tipo CAMPAMENTO, `requiereAutorizacion`, cupo) → en la tarjeta: **InscribirMiembro** (si exige responsiva, pide confirmación “¿Responsiva firmada?”), lista de inscritos con chips (Responsiva ✓ / Sin firma / Pagó / Adeudo) → exporta **CSV/PDF** de asistencia.
6. **Día del evento — escáner**: `/eventos/escaner` → selecciona evento → cámara (jsQR) o captura manual → si online: `POST /api/asistencia` (upsert por evento+miembro; doble escaneo no duplica) ; si offline: cola `sisas:attendance:pending` + badge; al volver la red se vacía sola (botón “Sincronizar” manual también) → contador en vivo.
7. **Verificación pública**: cualquiera escanea el QR de la credencial → `GET /api/credencial/verify?code=…` → “{Nombre} · sección · Grupo N — vigente/no vigente”. Sin CURP, sin datos médicos.
8. **Progresión**: `/progresion` → busca al miembro → **Aprobar** (sello con tu usuario) → notificación al tutor vinculado → etapa verde. Insignias: “Otorgar”.
9. **Carga masiva**: `/carga` → descarga plantilla → llena CSV → preview → “Importar censo” → reporte `{creados, errores[]}` con fila y motivo; quedan PENDIENTE.
10. **Tutor abre el panel**: ve solo su expediente vinculado; cuotas de su hijo/a; sus inscripciones; sin movimientos ni inventario.

## 20 — Seguridad y protección de datos de menores

- **Sesión**: JWT firmado (AUTH_SECRET), httpOnly, SameSite=Lax, 8 h, cookies vía Auth.js (no manuales). Contraseña bcrypt (cost 10). Rate limit login.
- **Middleware** global + **verificación de rol en cada Route Handler** (defensa en profundidad; el cliente nunca es fuente de verdad).
- **Menores**: CURP enmascarada en listados; ficha médica restringida a staff; CURP y datos de salud nunca en endpoint público (`/api/credencial/verify` omite todo lo sensible); listados de inscritos/asistencia solo staff; tutor aislado por `userId` en SQL.
- **Auditoría completa** de lecturas/modificaciones médicas y cobros (`AuditLog` con email de actor, fecha, entidad).
- **Headers**: CSP estricta (`default-src 'self'`, `frame-ancestors 'none'`), HSTS, nosniff, DENY framing, Permissions-Policy (cámara solo self — necesaria para el escáner).
- **Autorización parental**: `autorizacionActividades` visible en expediente; campamentos exigen responsiva confirmada al inscribir.
- **Sesiones de demo**: las cuentas seed son públicas en `/login` — **eliminarlas o cambiar contraseñas antes de producción** (ver DEPLOY-AZURE.md).
- Dependencias con avisos de `npm audit` (23 incl. 1 crítica): la mayoría en devDependencies de tooling; `next` 14.2.35 está parcheado a la línea más reciente del 14.x. Ejecutar `npm audit` y actualizar con criterio antes de exponer a internet.

**Si manejas datos reales**: registra el tratamiento en el aviso de privacidad del grupo, define responsables distintos para cobro (mínimo 2), y revisa el diseño con un abogado o el área de protección de datos de ANSI. Esta app es una herramienta, no un dictamen legal.

## 21 — Variables de entorno

| Variable | Uso | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión Prisma | `postgresql://postgres:postgres@localhost:5432/sisas_ansi?schema=public` (dev) · Azure: servidor Flexible |
| `AUTH_SECRET` | Firma de JWT | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_URL` | URL canónica (Auth.js) | `http://localhost:3100` dev · `https://<app>.azurewebsites.net` prod |
| `NEXT_PUBLIC_APP_URL` | Enlaces en QR de credencial | misma que AUTH_URL |
| `NODE_ENV` | `production` en Azure | la define el runtime de Azure |

`.env` está en `.gitignore`. Nunca commitearlo. `.env.example` documenta el resto.

## 22 — Modelo de datos para Azure / producción

Mapeo directo de dev → Azure (ver `DEPLOY-AZURE.md`):

| Dev (local) | Producción (Azure for Students) |
|---|---|
| PostgreSQL 18 embebido (`.postgres/`) | **Azure Database for PostgreSQL Flexible Server** (Burstable B1ms, ~32 GB) |
| `npm run db:up` | (el servidor gestionado siempre está arriba) |
| Migración manual `db:migrate` | `prisma migrate deploy` en el arranque del App Service |
| `next start -p 3100` | **Azure App Service — Linux, Node 20/22**, `.next` + `node scripts .next` vía `npm run start` |
| Datos seed demo | **Nunca** correr seed con datos reales; crear admin real + provincias/grupos reales |
| AUTH_SECRET local | Secreto en App Service → Configuration → Application settings |
| Backups manuales | Flexible Server backups automáticos (7 días, retención configurable) |

## 23 — Estado real vs las 5 fases del proyecto

| Fase | Estado |
|---|---|
| **Fase 1** — Alcance, módulos, modelo de datos, wireframes | ✅ Hecha (schema 18 modelos, este documento, matriz RBAC) |
| **Fase 2** — Repo, backend, RBAC, APIs principales | ✅ Hecha (Next.js full-stack, 26 endpoints REST, Auth.js, auditoría) — **falta `git init`** (pendiente 24) |
| **Fase 3** — Frontend + dashboards + automatizaciones | ✅ Hecha (dashboard real staff/tutor, PDF comprobantes y asistencia, recordatorios in-app) — falta correo/WhatsApp por decisión del usuario (solo in-app) |
| **Fase 4** — Pruebas y despliegue | 🟡 Parcial: pruebas manuales completas (sección 2) ✅; **tests automatizados y deploy** pendientes (24) |
| **Fase 5** — Piloto y capacitación | 🟡 Documentación lista (`MANUAL_USUARIO.md`); falta elegir grupo piloto y fecha |

## 24 — Pendientes conocidos

1. **Tests automatizados** (vitest): cubrir `csv.ts`, `attendance.ts`, `validations.ts`, `extractCredentialCode`, flujo cobro→PDF. (Config no creada aún.)
2. **`git init` + primer commit** (Fase 2 lo exige): no hay repo aún. Al crear: `.gitignore` ya preparado (excluye .env y .postgres).
3. **Deploy Azure**: `DEPLOY-AZURE.md` listo para ejecutar cuando digas (usa tu suscripción Azure for Students; costo estimado dentro del crédito).
4. **Cuentas demo**: rotar/eliminar antes de producción; cambiar `AUTH_SECRET`.
5. **Notificaciones por correo/WhatsApp**: descartado por decisión (solo in-app); retomar cuando lo pidas (nodemailer fue retirado; usar `@auth/core`-compatible o proveedor SMTP directo).
6. **`npm audit`**: 23 avisos (tooling); revisar antes de publicar.
7. **`/register`**: hoy es decorativo (sin persistencia); enchufar a un flujo de aprobación real si se necesita.
8. **Editor del portal** (`/admin/editor`): gestor de contenido en memoria (demo); persistir si ANSI lo usará para comunicados.

## Apéndice — Mapa de APIs por método

```
GET    /api/auth/[...nextauth]           público     sesión
POST   /api/auth/callback/credentials    público     alta de sesión
GET    /api/credencial/verify            público     validar credencial

GET    /api/miembros                     todos*      lista paginada
POST   /api/miembros                     gestión     alta
GET    /api/miembros/[id]                todos*      detalle (médico: staff)
PATCH  /api/miembros/[id]                gestión     edición
DELETE /api/miembros/[id]                gestión     baja (BAJA)
GET    /api/miembros/[id]/ficha-medica   staff       ver (auditoría)
PUT    /api/miembros/[id]/ficha-medica   staff       upsert (auditoría)
POST   /api/miembros/import              gestión     CSV masivo
GET    /api/miembros/import/plantilla    todos       CSV plantilla

GET    /api/grupos                       todos       lista con provincia y conteo
POST   /api/grupos                       ADMIN NACIONAL PROVINCIA
GET    /api/provincias                   todos

GET    /api/eventos                      todos       sin cancelados
POST   /api/eventos                      gestión     crear
GET    /api/eventos/[id]                 staff       detalle + inscritos
PATCH  /api/eventos/[id]                 gestión     editar / cancelar
DELETE /api/eventos/[id]                 ADMIN       solo sin inscritos
POST   /api/eventos/[id]/inscribir       staff+SECCION
DELETE /api/eventos/[id]/inscribir       staff+SECCION
PUT    /api/eventos/[id]/logistica       gestión
GET    /api/eventos/[id]/asistencia      staff       json|csv|pdf

POST   /api/asistencia                   todos       alta por escaneo
GET    /api/asistencia?eventoId=         staff

GET    /api/finanzas/cuotas              todos*      tutor: solo las suyas
POST   /api/finanzas/cuotas              gestión     una cuota
POST   /api/finanzas/cuotas/generar      gestión     masiva del ciclo
POST   /api/finanzas/cuotas/[id]/pagar   gestión     marcar pagada
GET    /api/finanzas/cuotas/[id]/comprobante  gestión  PDF
GET    /api/finanzas/movimientos         staff
POST   /api/finanzas/movimientos         gestión

GET    /api/progresion?scoutId=          todos*      tutor: solo la suya
POST   /api/progresion                   staff
POST   /api/progresion/[id]/aprobar      staff

GET    /api/insignias?seccion=           todos
POST   /api/insignias                    ADMIN NACIONAL
POST   /api/insignias/otorgar            staff+SECCION

GET    /api/inventario?grupoId=          staff
POST   /api/inventario                   gestión
POST   /api/inventario/[id]/prestar      gestión+PROVINCIA
POST   /api/inventario/[id]/devolver     gestión+PROVINCIA

GET    /api/notificaciones               todos       genera recordatorios (dedupe)
POST   /api/notificaciones/[id]/leer     todas       marcar leída
PATCH  /api/notificaciones/[id]/leer     todas

GET    /api/usuarios                     ADMIN + NACIONAL (lista)
POST   /api/usuarios                     ADMIN
PATCH  /api/usuarios                     ADMIN       activo/rol (no auto-desactivación)
POST   /api/usuarios/password            propia
```

## Apéndice — Errores comunes y solución

| Síntoma | Causa / solución |
|---|---|
| `EADDRINUSE :::3000` | Otro proceso ocupa el puerto → `npm run start -- -p 3100` o identifica el PID (`Get-NetTCPConnection -LocalPort 3000`) |
| `P1001 Can't reach database server` | `npm run db:up` no está corriendo → iniciarlo y verificar :5432 |
| `P2021 table does not exist` | Falta migración → `npm run db:migrate` |
| `Credencial no encontrada` en escáner | Código de otro sistema o QR truncado → capturar de nuevo o usar captura manual |
| Sesión “No autenticado” tras redeploy | `AUTH_SECRET` cambió → volver a iniciar sesión |
| Email seed no ingresa | Es demo; el hash bcrypt se regeneró en el último `db:seed` |
| `Module not found: bcryptjs/zod` | `npm install` (ya incluido en package.json) |

---

**Fin del documento.** Mantenerlo actualizado en cada release. Los datos demo son ficticios; no usar en producción.

