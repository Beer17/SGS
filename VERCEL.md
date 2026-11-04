# Despliegue en Vercel — SISAS ANSI (una sola base de datos)

**Estado del repo:** listo para que Vercel instale y compile (SWC por plataforma, `postinstall: prisma generate`, verify dinámica).
**Falta:** conectar la base de datos y las variables de entorno — 5 minutos en el dashboard.
**Arquitectura:** GitHub → Vercel (build en la nube) → **1× Vercel Postgres (Neon)** → env vars en Vercel. Nada local de por medio.

---

## Paso 1 — Crear LA base de datos (una sola vez)

En el dashboard de Vercel, dentro de tu proyecto **SGS**:

1. Menú lateral → **Storage** → **Create Database**
2. Elige **Postgres** (powered by Neon) → plan **Free**
3. Nombre: `sisas-ansi-pg` · Region: la más cercana (ej. Washington, D.C. — iad1) → **Create**
4. Al conectar el proyecto, Vercel **inyecta automáticamente** `DATABASE_URL` (y `PG*`) en las Environment Variables del proyecto. ✅ Esa es la única base; no crees otra.

> Si prefieres otra opción: Neon/Supabase gratis → crea el proyecto Postgres, copia su connection string y pégala como `DATABASE_URL` manualmente en el paso 2.

## Paso 2 — Variables de entorno (Production + Preview)

**Project → Settings → Environment Variables**:

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | La que Vercel inyectó (no la edites) — o tu string con `?sslmode=require` |
| `AUTH_SECRET` | **Nuevo** — generado con: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_URL` | `https://<tu-proyecto>.vercel.app` (o tu dominio propio) |
| `NEXT_PUBLIC_APP_URL` | Igual que `AUTH_URL` |

`NODE_ENV=production` lo pone Vercel solo. **No** subas `.env` (está en `.gitignore`).

## Paso 3 — Aplicar las migraciones a esa base

Opción A (recomendada, sin tocar nada local): en **Settings → General → Build & Development Settings → Build Command**, escribe:

```
prisma migrate deploy && next build
```

Así cada push aplica migraciones antes de compilar (idempotente; si no hay pendientes, no hace nada).

Opción B (una sola vez, manual): desde tu máquina con la cadena de Vercel:

```powershell
$env:DATABASE_URL="<cadena de Vercel>"; npx prisma migrate deploy
```

## Paso 4 — Desplegar y verificar

1. Push a `main` (ya lo hice) o botón **Redeploy** en Vercel.
2. Build en la nube → debe pasar: `npm install` (postinstall genera el cliente) → typecheck → `next build`.
3. Abre `https://<tu-proyecto>.vercel.app/login`
    - Login: con el usuario que crees en el paso 5.
    - Verifica `/api/auth/session`, `/api/miembros`, y la credencial pública.
4. **Admin inicial** (prod, no demo): crea el tuyo con SQL:
   ```sql
   INSERT INTO "User" ("id","email","passwordHash","role","activo","createdAt","updatedAt")
   VALUES (gen_random_uuid()::text, 'admin@tu-dominio.org', '<hash bcrypt>', 'ADMIN', true, now(), now());
   ```
   Hash: `npx tsx -e "import('bcryptjs').then(b=>b.default.hash('TuPassFuerte',10)).then(console.log)"`
5. **¿Demo pública?** (datos ficticios, permitido para presentar): ejecutando UNA vez `npm run db:seed` con `DATABASE_URL` de Vercel crea esto:
   - admin@gmail.com / admin1234 (¡cambia o borra en cuanto dejes de presentar!)
   - 44 miembros, 4 grupos, 4 eventos, etc.
   - **NO es producción real.** Si hay menores reales, no uses seed.

## Qué NO hacer

- No crees varias bases: una Postgres basta (el pool de Neon sobra para el piloto).
- No pongas `.env` en el repo.
- No dejes las credenciales demo publicadas.
- No vuelvas a agregar `@next/swc-win32-x64-msvc` a `package.json` (rompe el build en Linux).

## Si el build falla

1. **Install error EBADPLATFORM** → el repo está por atrás; asegúrate de que `main` incluya `5d9633a` o posterior.
2. **TypeScript/Prisma** → falta `postinstall` (incluido desde `df8a174`).
3. **Runtime 500 al loguear** → falta `DATABASE_URL` o `prisma migrate deploy` no se ejecutó (paso 3).
4. **Rollback instantáneo**: Deployments → el anterior → ⋯ → **Instant Rollback**.

## Costos (aprox.)

| Recurso | Plan | Costo |
|---|---|---|
| Vercel Hobby | build/hosting | $0 |
| Vercel Postgres | Free (Neon) | $0 |
| **Total piloto** | | **$0/mes** |

## Nota local

El build anónimo en local (`vercel deploy --temporary`) NO sirve aquí: tu servidor en `:3000` bloquea el DLL del cliente de Prisma. El build correcto ocurre en la nube de Vercel, en un clone fresco.
