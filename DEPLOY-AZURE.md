# Despliegue en Azure — SISAS ANSI

> Pensado para **Azure for Students** (+ App Service + Azure Database for PostgreSQL Flexible Server).  
> Costo estimado: **dentro del crédito de estudiante** (~100 USD) por varios meses con uso ligero.  
> Nada de esto se creó todavía — este documento es la guía ejecutable. Cuando decidas el momento, se corre paso a paso.

---

## 0. Arquitectura objetivo

```
Internet ──► App Service (Linux, Node 20/22) ──► Azure Database for PostgreSQL
              · Next.js 14 (standalone)            Flexible Server · Burstable B1ms
              · next-auth / JWT                   · Backups 7 días
              · prisma migrate deploy             · Firewall: solo App Service + tu IP
```

URLs: `https://sisas-ansi-<algo>.azurewebsites.net`

---

## 1. Requisitos

1. **Azure for Students** activado: <https://azure.microsoft.com/free/students/> con correo institucional (o crédito de patrocinio). Sin tarjeta de crédito.
2. [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli-windows) (`az`) logueado: `az login`.
3. Este repo limpio y con los **pendientes de producción** cerrados (ver sección 7).

Variables de la sesión:

```powershell
$RG="rg-sisas-prod"; $LOC="westeurope"       # elige la región más cercana con Flexible Server
$APP="sisas-ansi";   $DB="sisas-ansi-pg"
$ADMIN_DB_USER="sisasadmin"; $ADMIN_DB_PASS="<contraseña-fuerte>"
```

---

## 2. Crear el grupo de recursos y la base de datos

```bash
az group create -n $RG -l $LOC

# PostgreSQL Flexible Server (el más barato: burstable)
az postgres flexible-server create -g $RG -n $DB -l $LOC \
  --admin-user $ADMIN_DB_USER --admin-password $ADMIN_DB_PASS \
  --sku-name Standard_B1ms --tier Burstable --storage-size 32 \
  --version 16 --yes

# Crear la base de datos
az postgres flexible-server db create -g $RG -s $DB -d sisas_ansi

# Firewall: solo servicios Azure + tu IP (NUNCA abierto a 0.0.0.0/0)
az postgres flexible-server firewall-rule create -g $RG -s $DB -n allow-azure --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0   # rango especial de Azure
az postgres flexible-server firewall-rule create -g $RG -s $DB -n mi-ip --start-ip-address <TU_IP> --end-ip-address <TU_IP>
```

Cadena de conexión (guardar, no la subas a git):

```
postgresql://sisasadmin:<PASS>@sisas-ansi-pg.postgres.database.azure.com:5432/sisas_ansi?schema=public&sslmode=require
```

---

## 3. Crear el App Service y desplegar

```bash
# Plan B1 (barato, Always On opcional) — Linux
az appservice plan create -g $RG -n plan-sisas --sku B1 --is-linux

# Web App Node 20 LTS
az webapp create -g $RG -p plan-sisas -n $APP --runtime "NODE|20-lts"
```

### Variables de entorno (App Service → Configuration → Application settings)

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | la cadena de arriba (con `sslmode=require`) |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` **nuevo, no el de dev** |
| `AUTH_URL` | `https://sisas-ansi.azurewebsites.net` |
| `NEXT_PUBLIC_APP_URL` | igual |
| `NODE_ENV` | `production` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` (para que `npm install` + build corran en Azure) |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~20` |

```bash
az webapp config appsettings set -g $RG -n $APP --settings \
  DATABASE_URL="postgresql://..." AUTH_SECRET="..." AUTH_URL="https://$APP.azurewebsites.net" \
  NEXT_PUBLIC_APP_URL="https://$APP.azurewebsites.net" NODE_ENV=production \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### Deploy del código

Opción A — zip deploy (simple):

```powershell
# desde la raíz del proyecto (sin node_modules ni .next local)
Compress-Archive -Path: src, prisma, public, package.json, package-lock.json, next.config.mjs, tsconfig.json, tailwind.config.ts, postcss.config.mjs, next-env.d.ts -DestinationPath deploy.zip -Force
az webapp deploy -g $RG -n $APP --src-path deploy.zip --type zip
```

Opción B — GitHub Actions (recomendada para piloto):

1. `git init && git add . && git commit -m "SISAS ANSI" && gh repo create sisas-ansi --private --push`
2. En el Portal: **Deployment Center → GitHub** → autoriza → elige repo y rama.
3. Azure crea el workflow (o usa el de sección 5) y despliega en cada push.

### Arranque y migraciones

En **Configuration → General settings → Startup Command**:

```bash
npm run db:deploy && npm run start
```

(`db:deploy` = `prisma migrate deploy`; aplica las 2 migraciones. El seed **no** corre.)

---

## 4. Primera configuración post-deploy

1. Abre `https://<app>.azurewebsites.net/login` → debe cargar SISAS ANSI.
2. **Crea el administrador real** desde una sesión SQL (o usa el seed SOLO en un slot de staging vacío):
   - Mejor: entra con un usuario inicial creado con `az rest`/Prisma Studio contra el servidor, o temporalmente habilita acceso por tu IP y corre:
     ```bash
     npx prisma db execute --stdin <<'SQL'
     INSERT INTO "User" ("id","email","passwordHash","role","activo","createdAt","updatedAt")
     VALUES (gen_random_uuid()::text, 'admin@tu-dominio.org', '<hash-bcrypt>', 'ADMIN', true, now(), now());
     SQL
     ```
   - Genera el hash con `npx tsx -e "import('bcryptjs').then(b=>b.default.hash('TuPassFuerte',10)).then(console.log)"`.
3. Verifica login, `/api/auth/session`, y que las APIs responden 401 sin sesión.
4. Crea provincias/grupos reales (Configuración o Prisma Studio), y dirige el censo real.
5. **Cambia/elimina las cuentas demo si importaste seed** (no debes).

---

## 5. Workflow de GitHub Actions (opción B)

`.github/workflows/deploy.yml`:

```yaml
name: deploy
on: { push: { branches: [main] } }
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci && npm run typecheck && npm run lint && npm run build
      - uses: azure/webapps-deploy@v3
        with:
          app-name: sisas-ansi
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE }}
```

(El publish profile se descarga del Portal → App Service → **Get publish profile** y se guarda como secreto.)

---

## 6. Seguridad antes de exponer a internet

- [ ] `AUTH_SECRET` **nuevo** y solo en App Settings.
- [ ] Contraseña del admin **fuerte** (12+, con símbolos); 2FA en el correo del admin.
- [ ] `/login` ya no lista cuentas demo (vacía ese bloque en `src/app/(auth)/login/page.tsx`).
- [ ] Firewall PostgreSQL: solo Azure + tu IP de administración; **nunca** público.
- [ ] `npm audit` revisado; Next en la línea 14.2.x más reciente.
- [ ] Aviso de privacidad de ANSI enlazado en `/login` (obligatorio para datos de menores).
- [ ] Backups del Flexible Server verificados (retención 7–35 días).
- [ ] Alertas de presupuesto: **Cost Management → Budgets** → alerta al 50% y 90% del crédito.
- [ ] `NODE_ENV=production` (cookies `Secure` activas).
- [ ] Dominio propio + **certificado administrado** (App Service → Custom domains → Add → certificado gratuito).
- [ ] Acceso a `/admin` solo roles ADMIN/NACIONAL (ya forzado en middleware — verificar).

## 7. Pendientes del repo antes del deploy

1. `git init` + `.gitignore` (ya listo: excluye `.env`, `.postgres/`, `node_modules/`).
2. Tests mínimos (vitest) — ver DOCUMENTACION §24.
3. Quitar el bloque “Cuentas de demostración” de `/login`.
4. Rotar `AUTH_SECRET` y contraseñas de toda cuenta seed.
5. `npm run build` verde y `npm run lint` limpio (ya lo están).

## 8. Costos y límites (Azure for Students)

| Recurso | SKU | Costo aprox./mes |
|---|---|---|
| App Service Plan | B1 Linux | ~13 USD (uso bajo) |
| PostgreSQL Flexible Server | B1ms, 32 GB | ~12–15 USD |
| Almacenamiento + backups | incluido | ~1–2 USD |
| **Total** | | **~26–30 USD/mes** → varios meses con el crédito de ~100 USD |

- Sin dominio: gratis (`*.azurewebsites.net`).
- Duerme nada en B1 (sin cold start agresivo) — suficiente para un piloto.
- **Apagar fuera de horario de oficina** ahorra crédito: `az webapp stop -g $RG -n $APP` (y `az webapp start`). El servidor Postgres cobra por hora encendida; considera detenerlo también en fines de semana.

## 9. Monitoreo y operación

- **Logs**: `az webapp log tail -g $RG -n $APP` · Portal → App Service → Log stream.
- **Métricas**: CPU, memoria, peticiones, 4xx/5xx (App Service → Metrics).
- **Health check**: configurar ruta `/api/auth/session` (200/401 = vivo).
- **Backups DB**: restaurar = Point-in-Time Restore del Flexible Server (Portal).
- **Actualizar**: push a `main` → GitHub Actions redepliega; migraciones corren en el arranque.

## 10. Rollback

```bash
az webapp deployment slot list -g $RG -n $APP           # si usaste slots
az webapp deployment slot swap -g $RG -n $APP --slot staging
# o: redeploy del commit anterior desde GitHub Actions (Re-run failed jobs / git revert)
```

## 11. Apagado y borrado (fin del piloto)

```bash
az group delete -n $RG --yes --no-wait     # borra TODO (BD incluida — exporta antes con pg_dump si hace falta)
```

Exporta antes: `pg_dump "postgresql://sisasadmin:PASS@sisas-ansi-pg.postgres.database.azure.com:5432/sisas_ansi" > sisas_backup.sql`

---

**Checklist final de “listo para presentar al consejo”**
- [ ] URL pública estable y HTTPS
- [ ] Login real + 2–3 usuarios reales por rol
- [ ] Un evento real visible en el calendario
- [ ] Demo del escáner con 3 credenciales impresas
- [ ] PDF de comprobante y de asistencia generados en vivo
- [ ] Documento de privacidad disponible
