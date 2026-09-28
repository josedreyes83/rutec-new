# Flujo de trabajo — RUTEC 2027

Ministerio del Trabajo · Dirección de Movilidad y Formación para el Trabajo (DMFT)

Este documento define cómo se integran los cambios del backlog RUTEC 2027
(4 Epics, 8 Features, 19 PBIs cargados en Azure DevOps).

---

## 1. Ramas

| Rama | Propósito | Quién escribe en ella |
|---|---|---|
| `main` | Lo que está en producción. Siempre desplegable. | Nadie directamente. Solo por merge de PR. |
| `rutec-2027` | Rama de integración del backlog 2027. | Solo por merge de PR desde ramas de historia. |
| `hu/<código>-<resumen>` | Una historia de usuario. | El desarrollador asignado. |
| `fix/<resumen>` | Corrección puntual que no corresponde a un PBI. | El desarrollador asignado. |
| `db/<NNN>-<resumen>` | Script de base de datos aislado, cuando no viaja con una historia. | El desarrollador asignado. |

Nomenclatura de las ramas de historia: el código del PBI en minúscula y con
guiones, seguido de un resumen corto.

```
hu/rutec-11-estados-del-tramite
hu/rutec-05-vigencia-y-zona-de-trabajo
hu/exp-02-novedades
fix/grupos-codigo-referencia-wizard
```

Las ramas de historia **salen de `rutec-2027`**, no de `main`, y vuelven a
`rutec-2027` por PR. `rutec-2027` se integra a `main` por PR cuando una oleada
completa está probada.

```
main
 └── rutec-2027
      ├── hu/rutec-11-estados-del-tramite
      ├── hu/rutec-02-datos-personales
      └── fix/grupos-codigo-referencia-wizard
```

Para mantener una rama de historia al día frente a `rutec-2027` se usa
`git rebase rutec-2027` mientras la rama no esté publicada o no la comparta
nadie más. Si ya hay un PR abierto con revisiones en curso, se usa `merge`
para no reescribir lo que el revisor ya leyó.

---

## 2. Commits

Formato: `<tipo>(<código del PBI>): <qué cambia>` en imperativo y en español.

```
feat(HU-RUTEC-11): agregar maquina de estados del tramite
fix(HU-RUTEC-05): corregir fecha de finalizacion en contratos indefinidos
db(HU-RUTEC-11): script 001 tabla de historial de estados
docs: flujo de trabajo de la rama rutec-2027
```

Tipos: `feat`, `fix`, `db`, `refactor`, `test`, `docs`, `chore`.

Un commit no debe mezclar cambio de esquema con cambio de aplicación. El
script SQL va en su propio commit para poder revisarlo y revertirlo aparte.

---

## 3. Pull requests

### 3.1 Cuándo se abre

Se abre el PR en cuanto la rama tiene el primer commit, marcado como
**draft**. Eso hace visible el trabajo en curso y permite comentar el diseño
antes de que esté terminado. Se pasa a *ready for review* cuando la historia
cumple sus criterios de aceptación.

### 3.2 Título y descripción

Título: `HU-RUTEC-11 · Estados del trámite y pantalla de seguimiento`

Descripción, con esta estructura:

```markdown
## Historia
HU-RUTEC-11 · <enlace al work item de Azure DevOps>

## Qué hace
<dos o tres frases>

## Criterios de aceptación cubiertos
- [x] CA-01 Guardar borrador
- [x] CA-02 Transición no permitida
- [ ] CA-04 Archivo automático — depende del job, va en PR aparte

## Cambios de base de datos
- `db/migrations/001_estados_tramite.sql` — crea tabla, columnas NULL
- `db/migrations/001_estados_tramite_rollback.sql`
- Backfill por lotes: `db/backfill/001_estados_iniciales.sql`
- Probado en: localhost (165.325 trabajadores / 249.745 contratos)

## Cómo probarlo
<pasos concretos>

## Puntos por validar (PV) que siguen abiertos
PV-01 — <qué se asumió mientras tanto>
```

### 3.3 Revisión

- Mínimo **un revisor** distinto del autor.
- Todo PR que incluya un `.sql` requiere revisión explícita del script, no
  solo del código.
- El autor no hace merge de su propio PR sin aprobación.
- Se resuelven todos los comentarios antes del merge.

### 3.4 Merge

- **Squash and merge** hacia `rutec-2027`, para que cada historia quede como
  un commit legible.
- **Merge commit** de `rutec-2027` hacia `main`, para conservar el detalle de
  la oleada.
- Se borra la rama de historia después del merge.

---

## 4. Lista de verificación antes de pedir revisión

- [ ] `dotnet build` compila sin errores ni advertencias nuevas.
- [ ] `ng build` compila la SPA sin errores.
- [ ] La aplicación arranca y la pantalla afectada funciona.
- [ ] No se commitearon secretos (ver sección 6).
- [ ] Si hay cambio de esquema, existe el script de avance **y** el de rollback.
- [ ] Los criterios de aceptación del PBI están listados y marcados.
- [ ] Se actualizó el estado del work item en Azure DevOps.

---

## 5. Cambios de base de datos

RUTEC es *database-first*: el `RutecDbContext` mapea tablas existentes y el
proyecto **no usa EF Core Migrations**. Todo cambio de esquema se hace con
scripts SQL versionados y revisables.

La base está en producción y tiene volumen real (165.325 trabajadores,
249.745 contratos). Reglas obligatorias:

1. Un script por cambio, numerado e **idempotente** (`IF NOT EXISTS`).
2. Cada script de avance tiene su script de **rollback** al lado.
3. Las columnas nuevas se agregan **siempre `NULL` y sin default**, para que
   el `ALTER TABLE` sea una operación de metadatos y no reescriba la tabla.
4. El **backfill va en un script aparte** y se ejecuta por lotes.
5. El `NOT NULL`, si aplica, es un tercer script posterior al backfill.
6. Los scripts se prueban contra la instancia local antes de proponerlos.
7. **Ningún script se ejecuta contra producción desde una rama.** Se aplica en
   una ventana acordada, después del merge y con respaldo previo.

---

## 6. Qué nunca se commitea

`appsettings.json` es una **plantilla sin secretos**. Los valores reales viven
en `appsettings.Development.json` y `appsettings.Production.json`, que están
en `.gitignore` y no se versionan.

Nunca se commitean:

- Cadenas de conexión con usuario y contraseña reales.
- Claves de firma JWT.
- Credenciales SMTP.
- Usuarios y contraseñas de prueba en código o documentación.
- Volcados de base de datos con datos personales de trabajadores.

Si un secreto entra al historial, no basta con borrarlo en un commit
posterior: hay que rotarlo.

---

## 7. Configuración pendiente en GitHub

Requiere permisos de administrador del repositorio y se hace una sola vez
desde *Settings → Branches → Add branch ruleset*:

- Proteger `main` y `rutec-2027`: prohibir push directo, exigir PR con al
  menos una aprobación y bloquear el force push.
- Exigir que las conversaciones estén resueltas antes del merge.
- Borrado automático de la rama al hacer merge
  (*Settings → General → Automatically delete head branches*).
