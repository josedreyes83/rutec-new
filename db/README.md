# Scripts de base de datos — RUTEC

RUTEC es *database-first*: `RutecDbContext` mapea tablas que ya existen y el
proyecto **no usa EF Core Migrations**. Todo cambio de esquema se hace con los
scripts de esta carpeta.

La base de producción tiene volumen real — 165.325 trabajadores y 249.745
contratos — así que un `ALTER TABLE` mal planteado bloquea la tabla el tiempo
que tarde en reescribirla. Las reglas de abajo existen por eso.

---

## 1. Estructura

```
db/
  migrations/   Cambios de esquema. Se aplican una sola vez, en orden.
  backfill/     Relleno de datos de columnas nuevas. Se ejecuta por lotes.
  rollback/     Un script por cada migración, mismo número.
  _control/     Creación de la tabla de control. Se aplica una sola vez.
```

## 2. Nombre de los archivos

```
migrations/NNN_descripcion.sql
rollback/NNN_descripcion_rollback.sql
backfill/NNN_descripcion.sql
```

`NNN` es un consecutivo de tres dígitos. **No se reutiliza ni se reordena un
número ya mergeado**: el historial aplicado en producción quedaría inconsistente
con el repositorio. Si dos ramas toman el mismo número, la segunda en mergear lo
cambia.

## 3. Reglas obligatorias

1. **Idempotente.** Todo script se puede correr dos veces sin fallar ni
   duplicar. Usar `IF NOT EXISTS` / `IF COL_LENGTH(...) IS NULL`.
2. **Rollback siempre.** Ninguna migración se propone sin su script inverso.
   Si el cambio es irreversible (borrado de datos), el rollback documenta por
   qué y qué respaldo se necesita.
3. **Columnas nuevas `NULL` y sin `DEFAULT`.** Así el `ALTER TABLE` es una
   operación de metadatos y termina en milisegundos. Con `NOT NULL` o con
   `DEFAULT`, SQL Server reescribe las 250 mil filas con la tabla bloqueada.
4. **El backfill va aparte y por lotes.** Nunca dentro de la migración. Lotes
   de 5.000 filas con `WAITFOR DELAY` entre uno y otro para no sostener el
   bloqueo ni inflar el log de transacciones.
5. **El `NOT NULL` es un tercer script**, posterior al backfill, y solo si el
   requerimiento lo exige.
6. **Índices nuevos con `ONLINE = ON`** cuando la edición de SQL Server lo
   permita. Verificar con `SELECT SERVERPROPERTY('EditionID')` antes de asumirlo.
7. **Probado en local antes de proponerlo.** El PR indica contra qué instancia
   se probó.
8. **Ningún script se ejecuta contra producción desde una rama.** Se aplica en
   ventana acordada, después del merge y con respaldo previo.

## 4. Cómo se aplica

Cada script se envuelve en el bloque de control que registra su ejecución.
Hay tres plantillas, según el caso: [`_plantilla.sql`](_plantilla.sql),
[`_plantilla_backfill.sql`](_plantilla_backfill.sql) y
[`_plantilla_rollback.sql`](_plantilla_rollback.sql). Se copian y se llenan;
el bloque de control no se modifica.

El bloque hace tres cosas: sale sin hacer nada si el script ya se aplicó,
ejecuta el cambio dentro de una transacción con `XACT_ABORT ON`, y deja
constancia en `dbo.CONTROL_MIGRACION`. Si algo falla a mitad, la transacción
revierte entera y la tabla de control no registra nada — la instancia queda
como estaba y el script se puede volver a correr.

Antes de aplicar nada, crear la tabla de control una sola vez por instancia:

```
sqlcmd -S <servidor> -d RUTEC -C -i db/_control/000_control_migracion.sql
```

Luego, cada script en orden de número:

```
sqlcmd -S <servidor> -d RUTEC -C -i db/migrations/001_log_correo.sql
```

Para consultar qué hay aplicado:

```sql
SELECT NUMERO, NOMBRE, TIPO, FECHA_APLICADO, APLICADO_POR
FROM   dbo.CONTROL_MIGRACION ORDER BY NUMERO, ID;
```

Un avance se registra una sola vez — lo garantiza un índice único. Los
rollbacks sí se acumulan: aplicar → revertir → aplicar → revertir es una
secuencia válida y cada reversa queda como un hecho aparte en la bitácora.

### `QUOTED_IDENTIFIER`, obligatorio

Las plantillas abren con `SET QUOTED_IDENTIFIER ON` y `SET ANSI_NULLS ON`
y eso no es decorativo. `sqlcmd` entra con `QUOTED_IDENTIFIER` **apagado**,
y cualquier tabla con índice filtrado —`CONTROL_MIGRACION` y `TB_LOG_CORREO`
lo tienen— rechaza `CREATE INDEX`, `INSERT`, `UPDATE` y `DELETE` si la opción
está en `OFF`. El error (`Msg 1934`) no dice nada sobre la causa real.

Para consultas sueltas desde `sqlcmd`, agregar `-I`:

```
sqlcmd -S <servidor> -d RUTEC -C -I -Q "DELETE FROM dbo.TB_LOG_CORREO WHERE ..."
```

Desde la aplicación no hay problema: `SqlClient` la trae en `ON`.

## 5. Orden de un cambio típico

Agregar una columna obligatoria a una tabla con datos exige tres pasos
separados, en tres despliegues distintos:

| Paso | Script | Qué hace | Bloqueo |
|---|---|---|---|
| 1 | `migrations/NNN_...` | `ADD COLUMN ... NULL` | metadatos, instantáneo |
| 2 | `backfill/NNN_...` | `UPDATE` por lotes | por lote, corto |
| 3 | `migrations/NNN+k_...` | `ALTER COLUMN ... NOT NULL` | recorre la tabla |

El código de la aplicación debe tolerar el `NULL` entre el paso 1 y el 3.
