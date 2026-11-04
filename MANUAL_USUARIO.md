# Manual de usuario — SISAS ANSI (guía para scouters y jefatura)

> Para usar el sistema en la vida real del grupo. Lenguaje simple, sin tecnicismos.

---

## 1. Entrar al sistema

1. Abre el portal en tu navegador: `http://localhost:3000` (o la dirección que te dé la coordinación).
2. Escribe tu correo y contraseña → **Ingresar al panel**.
3. Si eres padre/tutor, solo verás el expediente de tu hijo/a. Si eres jefatura, verás todo tu grupo.

**¿Olvidaste la contraseña?** Pide al administrador que te asigne una nueva (Configuración → Cuentas → Nueva cuenta) o cambia la tuya en **Mi perfil → Cambiar contraseña**.

**Cuentas de demostración** (solo en este servidor de pruebas):

| Quién | Correo | Contraseña |
|---|---|---|
| Administrador | admin@gmail.com | admin1234 |
| Jefe de grupo | jefe@sisas.ansi | Jefe2026! |
| Scouter | scouter@sisas.ansi | Scouter2026! |
| Padre/Tutor | tutor@sisas.ansi | Tutor2026! |

---

## 2. El panel principal (Resumen)

Arriba verás 4 tarjetas: **miembros activos · grupos · alertas médicas · próximos eventos**, el balance del mes y la actividad reciente. Si eres tutor, verás solo lo de tu hijo/a.

## 3. Dar de alta a un miembro

1. Menú **Censo scout** → botón **Nuevo miembro**.
2. Llena: nombres, apellidos, fecha de nacimiento, sección y grupo. CURP es opcional (si la capturas, 18 caracteres).
3. **Registrar miembro** → el expediente queda como **PENDIENTE**.
4. Cuando llegues la documentación (acta, CURP, ficha médica, responsiva), abre su ficha y corrige el estatus a **ACTIVO** (botón **Editar**).

> Los miembros nuevos **no** cuentan como activos hasta validar documentos.

## 4. La ficha del miembro (donde vive todo)

- **Datos personales** con edad calculada y CURP enmascarada.
- **⚠️ Caja amarilla**: aparece sola si el miembro tiene alergias, padecimientos o restricciones. **Revísala antes de TODA salida o campamento.**
- **Ficha médica y emergencia**: tipo de sangre grande, seguro, médico tratante, alergias, contacto(s) de emergencia y si la responsiva está firmada.
- **Progresión** (barra) y **insignias**.
- Botones: **Credencial** (QR para imprimir) · **Editar** · **Dar de baja** (pide confirmación; nunca borra el historial).

**Imprimir**: botón **Imprimir / PDF** → sale limpia para tu carpeta de campo.

## 5. Cobrar cuotas (y entregar comprobante)

1. Menú **Finanzas y Cuotas**.
2. Elige tu grupo arriba a la derecha.
3. En la tabla verás quién debe: **PENDIENTE** (aún no vence) o **VENCIDA** (ya venció).
4. Botón **Cobrar** en su fila → queda **PAGADA** y se abre el **comprobante PDF** para imprimir/entregar.
5. ¿Cuota de todo el grupo? **Generar cuotas del ciclo** → crea las pendientes de todos los activos (no duplica).
6. Registra otros ingresos/egresos con **Registrar movimiento**.

## 6. Crear un evento y abrirlo a inscripciones

1. Menú **Eventos** → **Nuevo evento**: nombre, tipo (Campamento/Reunión/Capacitación…), fechas, lugar, cupo y si pide responsiva.
2. En la tarjeta del evento, **Gestionar** →
   - **InscribirMiembro**: busca por nombre → ➕
   - Si el evento pide responsiva, te confirma “¿Responsiva firmada?” → **Sí** (sin firma no inscribe).
   - Verás en la lista quién debe cuota/responsiva.
   - **CSV** / **PDF** = lista de asistencia lista para el campo.
   - **Logística**: transporte, campamento, equipo y presupuesto (editable).
   - **Cancelar evento**: si algo se cae, se cancela sin borrar nada.

## 7. Pase de lista con el escáner (día del evento)

1. Menú **Escáner de campo**.
2. **Selecciona el evento** arriba.
3. **Tocar para activar la cámara** → apunta al QR de la credencial (20 cm, con buena luz).
4. Si todo va bien, verás **“Asistencia registrada ✓”** y sube el contador del evento.
5. **¿Sin señal?** Sigue escaneando: todo queda guardado en este dispositivo (contador “lectura(s) pendiente(s)”). Cuando vuelva la red, se envían solas (o pulsa **Sincronizar**).
6. **¿QR dañado?** Escribe/pega el código en la casilla “captura manual” → **Registrar**.

> El escáner puede pedir permiso de cámara la primera vez — **Permitir**.

## 8. Aprobar avances (progresión e insignias)

1. Menú **Progresión**.
2. Busca al miembro → verás sus etapas: las pendientes tienen botón **Aprobar** (queda tu nombre y la fecha).
3. En **Insignias**, pulsa **Otorgar** en el catálogo → se le notifica a la familia.

## 9. Avisos (campana 🔔)

Te avisa de: **cuota por vencer/vencida**, **evento próximo**, **etapa aprobada**, **insignia obtenida**. Toca una para ir a la pantalla correspondiente; **Marcar todas** para limpiar.

## 10. Importar muchos miembros de golpe

1. Menú **Carga de datos** → **Descargar plantilla CSV**.
2. Llena en Excel: nombres, apellidos, fecha de nacimiento (AAAA-MM-DD), sección, número de grupo y provincia.
3. Guarda como **CSV UTF-8** → arrástralo a la zona punteada → **Importar censo**.
4. Revisa el reporte: “creados / errores por fila”. Los importados quedan **PENDIENTE**.

**Errores típicos**: provincia mal escrita · grupo inexistente en esa provincia · CURP repetida · fecha con otro formato.

## 11. Roles — qué puede hacer cada quien

| Rol | Puede |
|---|---|
| Jefe de grupo / Nacional / Admin | Todo lo del grupo/país: altas, cobros, eventos, aprobación |
| Scouter | Ver censo, registrar asistencia, aprobar etapas de su sección |
| Padre/Tutor | Solo expediente, credencial, cuotas y progresión **de sus vinculados** |
| Admin | Cuentas, configuración, todo |

## 12. Si algo sale mal

| Síntoma | Qué hacer |
|---|---|
| “No autenticado” al abrir | Vuelve a entrar (la sesión dura 8 h) |
| La cámara no abre | Permiso de cámara del navegador → permitir; o usa captura manual |
| “Evento lleno” | Aumenta el cupo (Editar evento) o da de baja otro inscrito |
| Importación con errores | Corrige las filas indicadas y reintenta (no duplica) |
| Pantalla en blanco tras mucho uso | Recarga con Ctrl+Shift+R |

---

**Recursos**: `DOCUMENTACION_SISAS_ANSI.md` (técnica) · soporte: administrador del sistema ANSI.
*Datos de demostración — no son información real.*
