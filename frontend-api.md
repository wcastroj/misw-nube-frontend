# API del backend — Guía para el frontend

Contrato HTTP de todos los endpoints del backend, tal como están implementados en el código. Cada endpoint indica
quién puede llamarlo, qué headers, parámetros y body recibe, qué responde si todo sale bien y **cada error que puede
devolver**, en el orden en que el backend lo evalúa (si una petición tiene varios problemas, recibe el primero de la
tabla).

## Contenido

1. [Generalidades](#1-generalidades)
2. [Índice de endpoints](#2-índice-de-endpoints)
3. [Salud](#3-salud)
4. [Autenticación y usuarios](#4-autenticación-y-usuarios)
5. [Períodos académicos](#5-períodos-académicos)
6. [Cursos y proyectos](#6-cursos-y-proyectos)
7. [Vinculaciones](#7-vinculaciones)
8. [Tareas (monitor / asistente graduado)](#8-tareas-monitor--asistente-graduado)
9. [Seguimiento (profesor / administrador)](#9-seguimiento-profesor--administrador)
10. [Reportes con IA](#10-reportes-con-ia)
11. [Anexos](#11-anexos)

---

## 1. Generalidades

### 1.1 URL base

| Entorno | URL base |
|---|---|
| GCP (VM) | `http://<IP-externa-de-la-VM>` (puerto 80) |
| Local (docker compose) | `http://localhost:8080` |

Todas las rutas, salvo `/health`, llevan el prefijo **`/api/v1`**.

### 1.2 Autenticación

1. `POST /api/v1/auth/login` devuelve `data.token`.
2. Ese token se envía en **todas** las demás rutas (salvo `/health` y el login) en el header:
   ```
   Authorization: Bearer <token>
   ```
   El prefijo `Bearer ` (con mayúscula y un espacio) es obligatorio.
3. El token no expira por tiempo: vale hasta que el usuario hace `POST /api/v1/auth/logout`. El logout cierra la
   sesión del usuario en **todos** los dispositivos, porque la sesión es una marca por usuario.
4. El rol del usuario se lee de la base de datos en cada petición, no del token.

Si el header falta, no empieza por `Bearer `, el token no se puede leer, el usuario no existe o su sesión está
cerrada, cualquier ruta protegida responde:

```json
HTTP 401
{ "error": { "code": "unauthenticated", "message": "Debes iniciar sesión" } }
```

La única excepción es el logout, que responde 400 `missing_token` (ver [4.2](#42-post-apiv1authlogout)).

### 1.3 Headers de las peticiones

| Header | Cuándo |
|---|---|
| `Authorization: Bearer <token>` | Todas las rutas protegidas |
| `Content-Type: application/json` | Las peticiones con body (`POST`, `PUT`) |
| `Origin` | Lo pone el navegador; ver CORS en [1.8](#18-cors) |

### 1.4 Formato de los errores

Todos los errores, salvo los de `/health` y los 404 de rutas inexistentes, tienen esta forma:

```json
{ "error": { "code": "codigo_en_snake_case", "message": "Mensaje en español para mostrar al usuario" } }
```

- Decide la lógica del frontend con `error.code`; `error.message` es para mostrar.
- **401 `unauthenticated`** puede salir en cualquier ruta protegida (ver [1.2](#12-autenticación)). Aparece en las
  tablas de cada endpoint como primera fila.
- **500 `internal_error`** (`"Error interno del servidor"`) puede salir en cualquier endpoint ante un fallo
  inesperado (por ejemplo, la base de datos no responde). Dos endpoints usan otro mensaje para el 500; se indica en
  su sección.
- Una ruta o un método que no existen responden **404 en texto plano** `404 page not found`, sin JSON.

### 1.5 Envoltorio de las respuestas exitosas

Las respuestas exitosas **no siguen todas el mismo formato**. Revisa la columna "Envoltorio" del
[índice](#2-índice-de-endpoints):

| Envoltorio | Ejemplo | Endpoints |
|---|---|---|
| `data` | `{ "data": { ... } }` | La mayoría |
| Arreglo sin envoltorio | `[ { ... }, { ... } ]` | `GET /users`, `GET /periods`, `GET /workspaces`, `GET /admin/workspaces`, `GET /admin/workspaces/:wId/assignments` |
| Objeto sin envoltorio | `{ ... }` | `GET /users/:id`, `GET /assignments`, `GET /assignments/:id`, `GET /health` |
| Sin cuerpo | — | `POST /auth/logout` (204) |
| Archivo binario | PDF o ZIP | `GET /reports/:id/download`, `GET /reports/batch/:id/download` |

Las listas vacías siempre se envían como `[]`, nunca como `null`.

### 1.6 Formatos

| Dato | Formato | Ejemplo |
|---|---|---|
| Fecha | `YYYY-MM-DD` | `2026-08-03` |
| Instante | RFC 3339 en UTC; algunos llevan fracción de segundo | `2026-10-31T23:30:38Z`, `2026-10-31T23:30:38.123456Z` |
| Semana ISO | `AAAA-Www`, con `W` mayúscula y dos dígitos | `2026-W44` |
| Identificadores | Entero positivo | `12` |
| Horas | Entero | `4` |

Las semanas se calculan en la zona horaria **America/Bogota**: van de lunes a domingo. La "semana actual" es la que
contiene la fecha de hoy en Bogotá. Una semana es "pasada" o "cerrada" si es anterior a la actual, y "futura" si es
posterior.

### 1.7 Valores enumerados

| Concepto | Valores |
|---|---|
| Rol de usuario | `admin`, `professor`, `operational` (monitor o asistente graduado) |
| Rol en una vinculación | `MONITOR`, `GRADUATE_ASSISTANT` |
| Tipo de espacio | `CURSO`, `PROYECTO` |
| Estado de período | `ACTIVO`, `CERRADO` |
| Estado de espacio | `ACTIVO`, `CERRADO` |
| Estado de tarea | `OPEN`, `IN_PROGRESS`, `COMPLETED` |
| Estado de una semana | `REPORTED` (hay horas o tareas), `NO_REPORT` (no hay) |
| Estado de un reporte | `PENDIENTE`, `GENERADO`, `FALLIDO` |

### 1.8 CORS

- El backend solo agrega cabeceras CORS cuando el `Origin` del navegador está en `CORS_ALLOWED_ORIGINS` (o esa
  variable es `*`). El origen se compara exacto: esquema y host, sin ruta.
- Preflight `OPTIONS` de un origen permitido → **204** con:
  - `Access-Control-Allow-Origin: <origen>` (o `*`)
  - `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers: Authorization, Content-Type`
  - `Access-Control-Max-Age: 600`
- Respuestas normales de un origen permitido: `Access-Control-Allow-Origin` y
  `Access-Control-Expose-Headers: Content-Disposition` (para leer el nombre del archivo en las descargas).
- Nunca se envía `Access-Control-Allow-Credentials`: el frontend **no** debe usar `withCredentials` /
  `credentials: 'include'`.
- Origen no permitido: sin cabeceras CORS; el preflight responde 404 y el navegador bloquea la llamada.

---

## 2. Índice de endpoints

| # | Método | Ruta | Roles permitidos | Éxito | Envoltorio |
|---|---|---|---|---|---|
| 3.1 | GET | [`/health`](#31-get-health) | Público | 200 | objeto |
| 4.1 | POST | [`/api/v1/auth/login`](#41-post-apiv1authlogin) | Público | 200 | `data` |
| 4.2 | POST | [`/api/v1/auth/logout`](#42-post-apiv1authlogout) | Cualquier sesión | 204 | sin cuerpo |
| 4.3 | POST | [`/api/v1/users`](#43-post-apiv1users) | admin | 201 | `data` |
| 4.4 | GET | [`/api/v1/users`](#44-get-apiv1users) | admin | 200 | arreglo |
| 4.5 | GET | [`/api/v1/users/:id`](#45-get-apiv1usersid) | admin | 200 | objeto |
| 5.1 | POST | [`/api/v1/periods`](#51-post-apiv1periods) | admin | 201 | `data` |
| 5.2 | GET | [`/api/v1/periods`](#52-get-apiv1periods) | Todos | 200 | arreglo |
| 6.1 | POST | [`/api/v1/workspaces`](#61-post-apiv1workspaces) | professor | 201 | `data` |
| 6.2 | GET | [`/api/v1/workspaces`](#62-get-apiv1workspaces) | professor, operational | 200 | arreglo |
| 6.3 | GET | [`/api/v1/workspaces/:id`](#63-get-apiv1workspacesid) | professor (dueño), admin | 200 | `data` |
| 6.4 | PATCH | [`/api/v1/workspaces/:id/close`](#64-patch-apiv1workspacesidclose) | professor (dueño) | 200 | `data` |
| 6.5 | GET | [`/api/v1/admin/workspaces`](#65-get-apiv1adminworkspaces) | admin | 200 | arreglo |
| 6.6 | GET | [`/api/v1/admin/workspaces/:wId/assignments`](#66-get-apiv1adminworkspaceswidassignments) | admin | 200 | arreglo |
| 6.7 | GET | [`/api/v1/admin/workspaces/:wId/tasks`](#67-get-apiv1adminworkspaceswidtasks) | admin | 200 | `data` |
| 7.1 | POST | [`/api/v1/assignments`](#71-post-apiv1assignments) | professor | 201 | `data` |
| 7.2 | GET | [`/api/v1/assignments`](#72-get-apiv1assignments) | professor | 200 | objeto |
| 7.3 | GET | [`/api/v1/assignments/:id`](#73-get-apiv1assignmentsid) | professor | 200 | objeto |
| 7.4 | PUT | [`/api/v1/admin/assignments/:id`](#74-put-apiv1adminassignmentsid) | admin | 200 | `data` |
| 7.5 | GET | [`/api/v1/admin/assignments/:id`](#75-get-apiv1adminassignmentsid) | admin | 200 | `data` |
| 8.1 | POST | [`/api/v1/tasks`](#81-post-apiv1tasks) | operational (titular) | 201 | `data` |
| 8.2 | GET | [`/api/v1/tasks`](#82-get-apiv1tasks) | operational (titular) | 200 | `data` |
| 8.3 | GET | [`/api/v1/tasks/history`](#83-get-apiv1taskshistory) | operational (titular) | 200 | `data` |
| 8.4 | PUT | [`/api/v1/tasks/:id`](#84-put-apiv1tasksid) | operational (titular) | 200 | `data` |
| 8.5 | DELETE | [`/api/v1/tasks/:id`](#85-delete-apiv1tasksid) | operational (titular) | 200 | `data` |
| 9.1 | GET | [`/api/v1/assignments/:id/consolidated`](#91-get-apiv1assignmentsidconsolidated) | professor (responsable), admin | 200 | `data` |
| 9.2 | GET | [`/api/v1/assignments/:id/weekly`](#92-get-apiv1assignmentsidweekly) | professor (responsable), admin | 200 | `data` |
| 10.1 | POST | [`/api/v1/reports/batch`](#101-post-apiv1reportsbatch) | professor | 202 | `data` |
| 10.2 | GET | [`/api/v1/reports/batch/:id`](#102-get-apiv1reportsbatchid) | professor (dueño) | 200 | `data` |
| 10.3 | GET | [`/api/v1/reports`](#103-get-apiv1reports) | professor, admin | 200 | `data` |
| 10.4 | GET | [`/api/v1/reports/:id/download`](#104-get-apiv1reportsiddownload) | professor (dueño), admin | 200 | PDF |
| 10.5 | GET | [`/api/v1/reports/batch/:id/download`](#105-get-apiv1reportsbatchiddownload) | professor (dueño), admin | 200 | ZIP |

"Titular" es el monitor o asistente dueño de la vinculación. "Responsable" es el profesor dueño del curso o proyecto.

---

## 3. Salud

### 3.1 `GET /health`

Comprueba que la API responde y que la base de datos contesta en menos de 2 segundos. No requiere token.

**Headers:** ninguno. **Path params:** ninguno. **Query params:** ninguno. **Body:** ninguno.

**Respuesta exitosa — 200**
```json
{ "status": "ok" }
```

**Errores**

| Status | Body | Cuándo |
|---|---|---|
| 503 | `{ "status": "unavailable" }` | La base de datos no respondió a tiempo |

---

## 4. Autenticación y usuarios

### 4.1 `POST /api/v1/auth/login`

Inicia sesión y devuelve el token. Público.

**Headers:** `Content-Type: application/json`.

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `email` | string | Sí | Se compara sin distinguir mayúsculas |
| `password` | string | Sí | Se compara exacta, sin recortar espacios |

```json
{ "email": "prof@example.com", "password": "prof123" }
```

**Respuesta exitosa — 200**
```json
{
  "data": {
    "token": "eyJyb2xlIjoicHJvZmVzc29yIiwidXNlcl9pZCI6Mn0=",
    "id": 2,
    "name": "Professor User",
    "email": "prof@example.com",
    "role": "professor"
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `data.token` | string | Token para `Authorization: Bearer <token>` |
| `data.id` | number | Id del usuario |
| `data.name` | string | Nombre completo |
| `data.email` | string | Email |
| `data.role` | string | `admin`, `professor` u `operational` |

El rol está en `data.role`, no hay objeto `user`.

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 400 | `invalid_credentials` | Revisa tus credenciales | El body no es un JSON válido o un campo tiene otro tipo |
| 400 | `invalid_credentials` | Revisa tus credenciales | `email` o `password` vacíos, el usuario no existe o la contraseña no coincide |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

Las credenciales incorrectas responden **400**, no 401.

---

### 4.2 `POST /api/v1/auth/logout`

Cierra la sesión del usuario del token. Es idempotente: cerrar una sesión ya cerrada también responde 204.

**Headers:** `Authorization: Bearer <token>`. **Body:** ninguno (se ignora).

**Respuesta exitosa — 204** sin cuerpo.

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 400 | `missing_token` | Falta el token de sesión | Falta `Authorization`, no empieza por `Bearer ` o el token está vacío |
| 400 | `invalid_session` | Sesión inválida | El token no se puede leer o su usuario no existe |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

Este endpoint **no** responde 401.

---

### 4.3 `POST /api/v1/users`

Crea un usuario. Solo **admin**.

**Headers:** `Authorization`, `Content-Type: application/json`.

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `name` | string | Sí | Se recortan los espacios de los extremos |
| `email` | string | Sí | Se recorta y se pasa a minúsculas. Un solo `@`, parte local no vacía, dominio con punto que no empieza ni termina en punto, sin espacios. Único |
| `password` | string | Sí | Al menos 8 caracteres. Solo espacios cuenta como vacío |
| `role` | string | Sí | `admin`, `professor` u `operational` |

El id lo asigna el sistema; cualquier otro campo se ignora.

```json
{ "name": "Ana Pérez", "email": "ana@example.com", "password": "secreta123", "role": "operational" }
```

**Respuesta exitosa — 201**
```json
{ "data": { "id": 7, "name": "Ana Pérez", "email": "ana@example.com", "role": "operational" } }
```

La contraseña nunca se devuelve.

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_role` | El rol debe ser admin, professor u operational | `role` no es un string (p. ej. un número) |
| 400 | `invalid_body` | El cuerpo de la solicitud no es un JSON válido | El body no es JSON o otro campo tiene un tipo inválido |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es admin |
| 400 | `invalid_field` | El campo `<campo>` es obligatorio | Falta un campo, en este orden: `name`, `email`, `password`, `role` |
| 400 | `invalid_email` | El email no tiene un formato válido | Email con formato inválido |
| 400 | `invalid_password` | La contraseña debe tener al menos 8 caracteres | Contraseña corta |
| 400 | `invalid_role` | El rol debe ser admin, professor u operational | `role` no es uno de los tres valores |
| 409 | `email_exists` | Ya existe un usuario con ese email | El email ya está registrado |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

Los dos errores de formato del body se evalúan antes que el rol: un no-admin con JSON inválido recibe 400.

---

### 4.4 `GET /api/v1/users`

Lista todos los usuarios, ordenados por id ascendente. Solo **admin**.

**Headers:** `Authorization`. **Query params:** ninguno (se ignoran). **Body:** ninguno.

**Respuesta exitosa — 200** (arreglo sin envoltorio)
```json
[
  { "id": 1, "name": "Admin User", "email": "admin@example.com", "role": "admin" },
  { "id": 2, "name": "Professor User", "email": "prof@example.com", "role": "professor" }
]
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es admin |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 4.5 `GET /api/v1/users/:id`

Devuelve un usuario. Solo **admin**.

**Headers:** `Authorization`.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id del usuario, mayor que 0 |

**Respuesta exitosa — 200** (objeto sin envoltorio)
```json
{ "id": 2, "name": "Professor User", "email": "prof@example.com", "role": "professor" }
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es admin |
| 400 | `invalid_user_id` | El identificador del usuario es inválido | `id` no es un entero positivo |
| 404 | `user_not_found` | El usuario no existe | No hay usuario con ese id |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

## 5. Períodos académicos

Objeto **Período** (se usa en varias respuestas):

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | Id |
| `codigo` | string | `AAAA-NN`, p. ej. `2026-02` |
| `fechaInicio` | string (fecha) | Inicio del período |
| `fechaFin` | string (fecha) | Cierre del período |
| `fechaLimite` | string (fecha) | Último día para crear cursos o proyectos |
| `estado` | string | `ACTIVO` o `CERRADO` |

### 5.1 `POST /api/v1/periods`

Crea un período académico. Queda `ACTIVO`. Solo **admin**.

**Headers:** `Authorization`, `Content-Type: application/json`.

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `codigo` | string | Sí | `AAAA-NN`. El año debe ser el de `fechaInicio`. Único |
| `fechaInicio` | string | Sí | `YYYY-MM-DD` |
| `fechaFin` | string | Sí | `YYYY-MM-DD`, posterior a `fechaInicio` |
| `fechaLimite` | string | Sí | `YYYY-MM-DD`, desde `fechaInicio` (incluida) hasta antes de `fechaFin` |

```json
{ "codigo": "2026-02", "fechaInicio": "2026-08-03", "fechaFin": "2026-11-28", "fechaLimite": "2026-08-14" }
```

**Respuesta exitosa — 201**
```json
{
  "data": {
    "id": 1,
    "codigo": "2026-02",
    "fechaInicio": "2026-08-03",
    "fechaFin": "2026-11-28",
    "fechaLimite": "2026-08-14",
    "estado": "ACTIVO"
  }
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_body` | El cuerpo de la solicitud no es un JSON válido | El body no es JSON o un campo no es string |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es admin |
| 400 | `invalid_field` | El campo `<campo>` es obligatorio | Falta un campo, en este orden: `codigo`, `fechaInicio`, `fechaFin`, `fechaLimite` |
| 400 | `invalid_field` | El campo `<campo>` debe ser una fecha válida con formato YYYY-MM-DD | Fecha inválida, en este orden: `fechaInicio`, `fechaFin`, `fechaLimite` |
| 400 | `invalid_period_code` | El código debe tener el formato AAAA-NN (ej. 2026-10) | `codigo` mal formado |
| 400 | `period_year_mismatch` | El año del código debe coincidir con el año de la fecha de inicio | Año del código ≠ año de `fechaInicio` |
| 400 | `invalid_date_range` | La fecha de cierre debe ser posterior a la fecha de inicio | `fechaFin` ≤ `fechaInicio` |
| 400 | `invalid_course_deadline` | La fecha límite debe estar entre la fecha de inicio (incluida) y la fecha de cierre (excluida) | `fechaLimite` fuera de rango |
| 409 | `period_code_exists` | Ya existe un período con el código `<codigo>` | Código repetido |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 5.2 `GET /api/v1/periods`

Lista los períodos. Cualquier usuario con sesión. El **admin** ve todos; los demás roles solo los `ACTIVO`. Orden:
`fechaInicio` más reciente primero; empate por `codigo`.

**Headers:** `Authorization`. **Query params:** ninguno (se ignoran). **Body:** ninguno.

**Respuesta exitosa — 200** (arreglo sin envoltorio de objetos Período)
```json
[
  { "id": 1, "codigo": "2026-02", "fechaInicio": "2026-08-03", "fechaFin": "2026-11-28", "fechaLimite": "2026-08-14", "estado": "ACTIVO" }
]
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

## 6. Cursos y proyectos

En el código, un curso o proyecto se llama *workspace*.

### 6.1 `POST /api/v1/workspaces`

Crea un curso o proyecto del profesor de la sesión. Queda `ACTIVO`. Solo **professor**.

**Headers:** `Authorization`, `Content-Type: application/json`.

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `nombre` | string | Sí | Se recorta. Único por profesor y período sin distinguir mayúsculas |
| `tipo` | string | Sí | `CURSO` o `PROYECTO` |
| `periodo_id` | number | Sí | Id de un período existente, `ACTIVO` |
| `fechaInicio` | string | Sí | `YYYY-MM-DD`, dentro del período |
| `fechaFin` | string | Sí | `YYYY-MM-DD`, posterior a `fechaInicio` y dentro del período |
| `observaciones` | string | **Sí** | Se recorta; no puede quedar vacío |

Además, **hoy** (en Bogotá) debe estar entre `fechaInicio` y `fechaLimite` del período, ambas incluidas. Los campos
`profesor_id` y `estado` se ignoran si se envían.

```json
{
  "nombre": "Desarrollo de Software en la Nube",
  "tipo": "CURSO",
  "periodo_id": 1,
  "fechaInicio": "2026-08-03",
  "fechaFin": "2026-11-28",
  "observaciones": "Grupo 03"
}
```

**Respuesta exitosa — 201**
```json
{
  "data": {
    "id": 4,
    "nombre": "Desarrollo de Software en la Nube",
    "tipo": "CURSO",
    "periodo_id": 1,
    "profesor_id": 2,
    "estado": "ACTIVO",
    "fechaInicio": "2026-08-03",
    "fechaFin": "2026-11-28",
    "observaciones": "Grupo 03",
    "createdAt": "2026-08-05T14:00:00Z"
  }
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_body` | El cuerpo de la solicitud no es un JSON válido | El body no es JSON o un campo tiene otro tipo (p. ej. `periodo_id` como string) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es professor |
| 400 | `invalid_field` | El campo `<campo>` es obligatorio | Falta un campo, en este orden: `nombre`, `observaciones`, `fechaInicio`, `fechaFin`, `periodo_id` (ausente o 0) |
| 400 | `invalid_field` | El campo `<campo>` debe ser una fecha válida con formato YYYY-MM-DD | Fecha inválida: `fechaInicio`, luego `fechaFin` |
| 404 | `period_not_found` | El período académico no existe | `periodo_id` no existe |
| 400 | `invalid_workspace_type` | El tipo debe ser CURSO o PROYECTO | `tipo` vacío o distinto |
| 409 | `period_not_active` | El período no está habilitado para crear cursos o proyectos | El período está `CERRADO` |
| 409 | `creation_window_closed` | El período está fuera de la ventana de creación de cursos y proyectos | Hoy está fuera de `[fechaInicio, fechaLimite]` del período |
| 400 | `invalid_date_range` | La fecha de cierre debe ser posterior a la fecha de inicio | `fechaFin` ≤ `fechaInicio` |
| 400 | `workspace_dates_out_of_period` | Las fechas del curso o proyecto deben estar dentro del período académico | Fechas fuera del período |
| 409 | `workspace_name_exists` | Ya tienes un curso o proyecto con el nombre `<nombre>` en este período | Nombre repetido para ese profesor y período |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 6.2 `GET /api/v1/workspaces`

Lista los cursos y proyectos del usuario de la sesión. La forma de cada elemento **depende del rol**:

- **professor**: los espacios de los que es responsable.
- **operational**: los espacios donde tiene una vinculación, con su rol y horas.
- **admin** y otros: 403.

Orden: primero los `ACTIVO`, luego `fechaInicio` más reciente, luego nombre y luego id.

**Headers:** `Authorization`. **Query params:** ninguno (se ignoran). **Body:** ninguno.

**Respuesta exitosa — 200 para professor** (arreglo sin envoltorio)
```json
[
  {
    "id": 4,
    "tipo": "CURSO",
    "nombre": "Desarrollo de Software en la Nube",
    "estado": "ACTIVO",
    "fechaInicio": "2026-08-03",
    "fechaFin": "2026-11-28",
    "observaciones": "Demo",
    "periodo": { "id": 1, "codigo": "2026-02" },
    "momentoCierre": null
  }
]
```

| Campo | Tipo | Descripción |
|---|---|---|
| `momentoCierre` | string \| null | Instante de cierre; `null` mientras está `ACTIVO` |

**Respuesta exitosa — 200 para operational** (arreglo sin envoltorio)
```json
[
  {
    "id": 4,
    "tipo": "CURSO",
    "nombre": "Desarrollo de Software en la Nube",
    "estado": "ACTIVO",
    "fechaInicio": "2026-08-03",
    "fechaFin": "2026-11-28",
    "observaciones": "Demo",
    "periodo": { "id": 1, "codigo": "2026-02" },
    "profesor": { "nombre": "Professor User", "email": "prof@example.com" },
    "rolVinculacion": "MONITOR",
    "horasSemanales": 10
  }
]
```

En la vista del monitor, `id` es el id del **espacio**, no el de la vinculación, y no viene `momentoCierre`.

> **Limitación actual:** ningún endpoint disponible para el rol `operational` devuelve el id de sus vinculaciones
> (`assignment_id`), que es el que piden los endpoints de la sección 8. Hoy solo lo ven el profesor
> (`GET /api/v1/assignments`) y el admin (`GET /api/v1/admin/workspaces/:wId/assignments`).

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario es admin |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 6.3 `GET /api/v1/workspaces/:id`

Detalle de un curso o proyecto con su profesor y su período completo. **professor** (solo los suyos) y **admin**.

**Headers:** `Authorization`.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id del espacio, mayor que 0 |

**Respuesta exitosa — 200**
```json
{
  "data": {
    "id": 4,
    "tipo": "CURSO",
    "nombre": "Desarrollo de Software en la Nube",
    "estado": "ACTIVO",
    "fechaInicio": "2026-08-03",
    "fechaFin": "2026-11-28",
    "observaciones": "Demo",
    "createdAt": "2026-08-05T14:00:00Z",
    "momentoCierre": null,
    "profesor": { "id": 2, "nombre": "Professor User", "email": "prof@example.com" },
    "periodo": {
      "id": 1,
      "codigo": "2026-02",
      "fechaInicio": "2026-08-03",
      "fechaFin": "2026-11-28",
      "fechaLimite": "2026-08-14",
      "estado": "ACTIVO"
    }
  }
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario es operational |
| 400 | `invalid_workspace_id` | El identificador del curso o proyecto es inválido | `id` no es un entero positivo |
| 404 | `workspace_not_found` | El curso o proyecto no existe | No existe, o es de otro profesor (para un professor) |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 6.4 `PATCH /api/v1/workspaces/:id/close`

Cierra un curso o proyecto del profesor de la sesión: pasa a `CERRADO` y guarda el instante. No cambia las fechas.
Solo **professor** dueño.

**Headers:** `Authorization`. **Body:** ninguno (se ignora).

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id del espacio, mayor que 0 |

**Respuesta exitosa — 200**
```json
{
  "data": {
    "id": 4,
    "nombre": "Desarrollo de Software en la Nube",
    "tipo": "CURSO",
    "periodo_id": 1,
    "profesor_id": 2,
    "estado": "CERRADO",
    "fechaInicio": "2026-08-03",
    "fechaFin": "2026-11-28",
    "observaciones": "Demo",
    "closedAt": "2026-10-31T23:40:00Z"
  }
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es professor |
| 400 | `invalid_workspace_id` | El identificador del curso o proyecto es inválido | `id` no es un entero positivo |
| 404 | `workspace_not_found` | El curso o proyecto no existe | No existe o es de otro profesor |
| 409 | `workspace_already_closed` | El curso o proyecto ya está cerrado | Ya estaba `CERRADO` |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 6.5 `GET /api/v1/admin/workspaces`

Lista todos los cursos y proyectos con su profesor y período. Solo **admin**. Orden: creación más reciente primero;
empate por id descendente.

**Headers:** `Authorization`. **Query params:** ninguno (se ignoran). **Body:** ninguno.

**Respuesta exitosa — 200** (arreglo sin envoltorio)
```json
[
  {
    "id": 4,
    "tipo": "CURSO",
    "nombre": "Desarrollo de Software en la Nube",
    "estado": "ACTIVO",
    "fechaInicio": "2026-08-03",
    "fechaFin": "2026-11-28",
    "observaciones": "Demo",
    "fechaCreacion": "2026-08-05T14:00:00Z",
    "profesor": { "id": 2, "nombre": "Professor User", "email": "prof@example.com" },
    "periodo": { "id": 1, "codigo": "2026-02" },
    "momentoCierre": null
  }
]
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es admin |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 6.6 `GET /api/v1/admin/workspaces/:wId/assignments`

Lista las vinculaciones de un curso o proyecto, ordenadas por id. Solo **admin**.

**Headers:** `Authorization`. **Query params:** ninguno. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `wId` | entero | Id del espacio, mayor que 0 |

**Respuesta exitosa — 200** (arreglo sin envoltorio)
```json
[
  {
    "id": 1,
    "persona": { "id": 3, "nombre": "Monitor User", "email": "monitor@example.com" },
    "rol": "MONITOR",
    "horasSemanales": 10,
    "profesor": { "id": 2, "nombre": "Professor User", "email": "prof@example.com" }
  }
]
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es admin |
| 400 | `invalid_workspace_id` | El identificador del curso o proyecto es inválido | `wId` no es un entero positivo |
| 404 | `workspace_not_found` | El curso o proyecto no existe | No hay espacio con ese id |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 6.7 `GET /api/v1/admin/workspaces/:wId/tasks`

Lista las tareas registradas en un curso o proyecto (de cualquier estado), opcionalmente de una semana. Solo
**admin**. Orden: id de tarea ascendente.

**Headers:** `Authorization`. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `wId` | entero | Id del espacio, mayor que 0 |

**Query params**

| Param | Obligatorio | Reglas |
|---|---|---|
| `week` | No | `AAAA-Www`. Sin él (o vacío) no se filtra. No se valida contra hoy ni contra las fechas del espacio: una semana futura o fuera de rango da una lista vacía. Enviarlo dos veces es formato inválido |

**Respuesta exitosa — 200**
```json
{
  "data": {
    "workspace_id": 4,
    "tasks": [
      {
        "id": 10,
        "assignment_id": 1,
        "person": { "id": 3, "full_name": "Monitor User", "role": "operational" },
        "professor": { "id": 2, "full_name": "Professor User" },
        "title": "Revisar pruebas de regresion",
        "description": "Pruebas del modulo de tareas",
        "state": "COMPLETED",
        "week": "2026-W38",
        "hours_spent": 3,
        "observations": "Sin novedades",
        "is_late_report": false,
        "attachments": [
          { "name": "evidencia-pruebas.pdf", "url": "https://example.com/evidencia-pruebas.pdf" }
        ]
      }
    ]
  }
}
```

Aquí el estado de la tarea viene en `state` (en otros endpoints se llama `status`).

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_field` | El parámetro \`workspace_id\` es obligatorio y debe ser un entero positivo. | `wId` no es un entero positivo (se evalúa antes del rol) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es admin |
| 400 | `invalid_week_format` | La semana debe tener el formato AAAA-Www (ej. 2026-W42) | `week` mal formado o repetido |
| 400 | `invalid_week` | La semana `<week>` no existe en el calendario ISO | P. ej. `2026-W60` |
| 404 | `workspace_not_found` | El workspace solicitado no existe. | No hay espacio con ese id |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

## 7. Vinculaciones

Una vinculación (*assignment*) une a una persona `operational` con un curso o proyecto, con un rol y horas semanales
contratadas.

### 7.1 `POST /api/v1/assignments`

Vincula a una persona a un curso o proyecto del profesor de la sesión. Solo **professor**.

**Headers:** `Authorization`, `Content-Type: application/json`.

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `user_id` | entero | Sí | ≥ 1. Debe existir y tener rol `operational` |
| `workspace_id` | entero | Sí | ≥ 1. Debe ser del profesor de la sesión y estar `ACTIVO` |
| `rol` | string | Sí | `MONITOR` o `GRADUATE_ASSISTANT` |
| `horas_semanales` | entero | Sí | ≥ 1 |

Reglas de carga sobre las vinculaciones activas de la persona:
- Una sola vinculación por persona y espacio.
- Como asistente graduado: máximo 22 horas semanales en total.
- Como monitor: máximo 3 monitorías simultáneas y 12 horas semanales en total.
- Si tiene horas en ambos roles, las de monitor no pueden superar el 40 % (redondeado hacia arriba) de las de
  asistente.

`id` y `professor_id` se ignoran si se envían: el profesor responsable es siempre el de la sesión.

```json
{ "user_id": 3, "workspace_id": 4, "rol": "MONITOR", "horas_semanales": 10 }
```

**Respuesta exitosa — 201**
```json
{ "data": { "id": 1, "user_id": 3, "workspace_id": 4, "rol": "MONITOR", "horas_semanales": 10, "professor_id": 2 } }
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_field` | El campo `<campo>` debe ser un número entero mayor o igual a 1 | `user_id`, `workspace_id` u `horas_semanales` no es un entero (p. ej. `"3"` o `2.5`) |
| 400 | `invalid_field` | El campo `<campo>` tiene un tipo inválido | Otro campo con tipo inválido (p. ej. `rol` numérico) |
| 400 | `invalid_body` | El cuerpo de la solicitud no es un JSON válido | El body no es JSON |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es professor |
| 400 | `invalid_field` | El campo `<campo>` es obligatorio | Falta un campo, en este orden: `user_id`, `workspace_id`, `horas_semanales`, `rol` |
| 400 | `invalid_field` | El campo `<campo>` debe ser un número entero mayor o igual a 1 | `user_id` ≤ 0, luego `workspace_id` ≤ 0 |
| 400 | `invalid_assignment_role` | El rol debe ser MONITOR o GRADUATE_ASSISTANT | `rol` inválido |
| 400 | `invalid_field` | El campo horas_semanales debe ser un número entero mayor o igual a 1 | `horas_semanales` < 1 |
| 404 | `workspace_not_found` | El curso o proyecto no existe | No existe o es de otro profesor |
| 409 | `workspace_closed` | No se pueden crear vinculaciones en un curso o proyecto cerrado | Espacio `CERRADO` |
| 404 | `user_not_found` | La persona no existe | `user_id` no existe |
| 409 | `user_not_operational` | Solo se puede vincular a monitores o asistentes graduados (usuarios operativos) | La persona no es `operational` |
| 409 | `assignment_exists` | La persona ya está vinculada a este curso o proyecto | Ya hay una vinculación con ese espacio |
| 409 | `graduate_assistant_hours_exceeded` | La persona superaría el máximo de 22 horas semanales como asistente graduado | Tope de 22 h |
| 409 | `monitorship_limit_exceeded` | La persona superaría el máximo de 3 monitorías simultáneas | Ya tiene 3 monitorías |
| 409 | `monitor_hours_exceeded` | La persona superaría el máximo de 12 horas semanales como monitor | Tope de 12 h |
| 409 | `mixed_hours_exceeded` | Las horas de monitoría superarían el 40 % de las horas como asistente graduado | Regla del 40 % |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 7.2 `GET /api/v1/assignments`

Vista principal del profesor: sus vinculaciones en espacios `ACTIVO`, con las horas reportadas **en la semana
actual**. Una fila por vinculación. Orden: nombre del espacio, nombre de la persona (sin distinguir mayúsculas) y id.
Solo **professor**.

**Headers:** `Authorization`. **Query params:** ninguno (se ignoran). **Body:** ninguno.

**Respuesta exitosa — 200** (objeto sin envoltorio)
```json
{
  "week": "2026-W44",
  "assignments": [
    {
      "id": 1,
      "user": { "id": 3, "name": "Monitor User" },
      "workspace": { "id": 4, "name": "Desarrollo de Software en la Nube", "type": "CURSO" },
      "role": "MONITOR",
      "contracted_hours": 10,
      "reported_hours": 0
    }
  ]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `week` | string | Semana actual en Bogotá; siempre presente, aunque la lista esté vacía |
| `assignments[].id` | number | Id de la vinculación (úsalo en 9.1, 9.2 y 10.x) |
| `assignments[].user.id` | number | Id de la persona (úsalo en 7.3) |
| `assignments[].contracted_hours` | number | Horas semanales contratadas |
| `assignments[].reported_hours` | number | Horas reportadas en `week` |

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es professor |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 7.3 `GET /api/v1/assignments/:id`

Ficha de una **persona** con todas sus vinculaciones con el profesor de la sesión (activas primero, luego por
nombre del espacio y id). Solo **professor**.

> **Ojo:** aquí `:id` es el **id del usuario**, no el de la vinculación.

**Headers:** `Authorization`. **Query params:** ninguno. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id de la persona, mayor que 0 |

**Respuesta exitosa — 200** (objeto sin envoltorio)
```json
{
  "id": 3,
  "nombre": "Monitor User",
  "email": "monitor@example.com",
  "rol": "operational",
  "semanaActual": "2026-W44",
  "vinculaciones": [
    {
      "id": 1,
      "rolVinculacion": "MONITOR",
      "horasSemanales": 10,
      "horasReportadasSemanaActual": 0,
      "espacio": {
        "id": 4,
        "nombre": "Desarrollo de Software en la Nube",
        "tipo": "CURSO",
        "estado": "ACTIVO",
        "periodo": { "id": 1, "codigo": "2026-02" }
      }
    }
  ]
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es professor |
| 400 | `invalid_user_id` | El identificador de la persona es inválido | `id` no es un entero positivo |
| 404 | `person_not_found` | La persona no fue encontrada | No existe o no tiene vinculaciones con este profesor |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 7.4 `PUT /api/v1/admin/assignments/:id`

Corrige las horas semanales contratadas de una vinculación. Es lo único modificable. Solo **admin**.

**Headers:** `Authorization`, `Content-Type: application/json`.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id de la vinculación, mayor que 0 |

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `horas_semanales` | entero | Sí | ≥ 1. Debe respetar los topes de horas de [7.1](#71-post-apiv1assignments) |

Cualquier otro campo se ignora.

```json
{ "horas_semanales": 8 }
```

**Respuesta exitosa — 200**
```json
{ "data": { "id": 1, "user_id": 3, "workspace_id": 4, "rol": "MONITOR", "horas_semanales": 8, "professor_id": 2 } }
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_body` | El cuerpo de la solicitud no es un JSON válido | El body no es JSON o `horas_semanales` no es un entero |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es admin |
| 400 | `invalid_assignment_id` | El identificador de la vinculación es inválido | `id` no es un entero positivo |
| 400 | `invalid_field` | El campo horas_semanales es obligatorio | Falta `horas_semanales` |
| 400 | `invalid_field` | El campo horas_semanales debe ser un número entero mayor o igual a 1 | `horas_semanales` < 1 |
| 404 | `assignment_not_found` | La vinculación no existe | No hay vinculación con ese id |
| 409 | `workspace_closed` | No se pueden corregir vinculaciones de un curso o proyecto cerrado | Espacio `CERRADO` |
| 409 | `graduate_assistant_hours_exceeded` | La persona superaría el máximo de 22 horas semanales como asistente graduado | Tope de 22 h |
| 409 | `monitor_hours_exceeded` | La persona superaría el máximo de 12 horas semanales como monitor | Tope de 12 h |
| 409 | `mixed_hours_exceeded` | Las horas de monitoría superarían el 40 % de las horas como asistente graduado | Regla del 40 % |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 7.5 `GET /api/v1/admin/assignments/:id`

Detalle de una vinculación. Solo **admin**.

**Headers:** `Authorization`. **Query params:** ninguno. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id de la vinculación |

**Respuesta exitosa — 200**
```json
{
  "data": {
    "id": 1,
    "persona": { "id": 3, "nombre": "Monitor User", "email": "monitor@example.com" },
    "cursoProyecto": { "id": 4, "nombre": "Desarrollo de Software en la Nube", "tipo": "CURSO", "estado": "ACTIVO" },
    "rol": "MONITOR",
    "horasSemanales": 10,
    "profesor": { "id": 2, "nombre": "Professor User", "email": "prof@example.com" }
  }
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es admin |
| 404 | `assignment_not_found` | La vinculación no fue encontrada | `id` no es un entero positivo **o** no existe (mismo error en ambos casos) |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

## 8. Tareas (monitor / asistente graduado)

Todos estos endpoints son solo para usuarios **operational** y sobre **sus propias** vinculaciones. Las tareas solo se
editan o borran durante su propia semana; una tarea registrada después de que terminó su semana queda marcada como
reporte tardío (`is_late_report: true`) y no se puede editar ni borrar.

Objeto **adjunto (request)**: los adjuntos son solo metadatos; el backend no recibe archivos.

### 8.1 `POST /api/v1/tasks`

Registra una tarea en una semana de una vinculación propia.

**Headers:** `Authorization`, `Content-Type: application/json`.

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `assignment_id` | entero | Sí | Id de una vinculación propia (0 cuenta como ausente) |
| `title` | string | Sí | 3 a 150 caracteres, no solo espacios |
| `description` | string | Sí | 5 a 1000 caracteres, no solo espacios |
| `status` | string | Sí* | `OPEN`, `IN_PROGRESS` o `COMPLETED` |
| `state` | string | — | Alias de `status`; se usa solo si `status` viene vacío |
| `week` | string | Sí | `AAAA-Www`; no futura; debe tocar al menos un día del espacio |
| `hours_spent` | entero | Sí | 1 a 168. Debe ser entero (`2.5` o `"2"` se rechazan) |
| `observations` | string | No | Máximo 1000 caracteres |
| `attachments` | arreglo | No | Máximo 3 |
| `attachments[].name` | string | Sí | Extensión `.pdf`, `.zip`, `.png` o `.jpg` (sin distinguir mayúsculas) |
| `attachments[].url` | string | Sí* | URL del archivo |
| `attachments[].location` | string | — | Alias de `url` si `url` viene vacío |
| `attachments[].size` | entero | No | Tamaño en bytes; máximo 10 MB (10485760) |

```json
{
  "assignment_id": 1,
  "title": "Preparar guia de laboratorio",
  "description": "Redactar la guia del laboratorio de nube",
  "status": "IN_PROGRESS",
  "week": "2026-W44",
  "hours_spent": 3,
  "observations": "Pendiente de revision",
  "attachments": [
    { "name": "guia.pdf", "url": "https://example.com/guia.pdf", "size": 204800 }
  ]
}
```

**Respuesta exitosa — 201**
```json
{ "data": { "task_id": 15, "is_late_report": false, "created_at": "2026-10-31T23:45:00Z" } }
```

| Campo | Tipo | Descripción |
|---|---|---|
| `task_id` | number | Id de la tarea creada |
| `is_late_report` | boolean | `true` si `week` es anterior a la semana actual |
| `created_at` | string | Instante de registro |

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `hours_not_integer` | El tiempo invertido debe expresarse en horas enteras | `hours_spent` no es un entero |
| 400 | `invalid_field` | El campo `<campo>` tiene un tipo inválido | Otro campo con tipo inválido (p. ej. `assignment_id` como string) |
| 400 | `invalid_body` | El cuerpo de la solicitud no es un JSON válido | El body no es JSON |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es operational |
| 400 | `invalid_field` | El campo `<campo>` es obligatorio | Falta un campo, en este orden: `assignment_id`, `title`, `description`, `status`, `week`, `hours_spent` |
| 400 | `invalid_title` | El título debe tener entre 3 y 150 caracteres | Título fuera de rango o solo espacios |
| 400 | `invalid_description` | La descripción debe tener entre 5 y 1000 caracteres | Descripción fuera de rango o solo espacios |
| 400 | `observations_too_long` | Las observaciones admiten como máximo 1000 caracteres | Observaciones largas |
| 400 | `invalid_status` | El estado debe ser OPEN, IN_PROGRESS o COMPLETED | Estado inválido |
| 400 | `hours_out_of_range` | El tiempo invertido debe estar entre 1 y 168 horas | Horas fuera de rango |
| 400 | `too_many_attachments` | Una tarea admite como máximo 3 adjuntos | Más de 3 adjuntos |
| 400 | `invalid_attachment` | El adjunto `<n>` debe tener nombre y url | Al adjunto n (desde 1) le falta `name` o `url`, **o** pesa más de 10 MB |
| 400 | `attachment_format_not_allowed` | El adjunto `<n>` (`<name>`) tiene un formato no permitido. Formatos permitidos: pdf, zip, png, jpg | Extensión no permitida |
| 400 | `invalid_week_format` | La semana debe tener el formato AAAA-Www (ej. 2026-W42) | `week` mal formado |
| 400 | `invalid_week` | La semana `<week>` no existe en el calendario ISO | P. ej. `2026-W60` |
| 400 | `future_week` | No se pueden registrar tareas para semanas futuras | `week` posterior a la actual |
| 404 | `assignment_not_found` | La vinculación no existe | `assignment_id` no existe |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | La vinculación es de otra persona |
| 409 | `workspace_closed` | El curso o proyecto está cerrado | Espacio `CERRADO` |
| 400 | `week_outside_workspace` | La semana está fuera de las fechas del curso o proyecto | La semana no toca las fechas del espacio |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

Los adjuntos se validan en orden: primero la cantidad; luego, adjunto por adjunto, nombre/url, formato y tamaño.

---

### 8.2 `GET /api/v1/tasks`

Tareas de una vinculación propia en una semana, más recientes primero. Funciona aunque el espacio esté cerrado.

**Headers:** `Authorization`. **Body:** ninguno.

**Query params**

| Param | Obligatorio | Reglas |
|---|---|---|
| `assignment_id` | Sí | Entero positivo, vinculación propia |
| `week` | No | `AAAA-Www`, no futura. Por defecto, la semana actual |

**Respuesta exitosa — 200**
```json
{
  "data": {
    "assignment_id": 1,
    "week": "2026-W40",
    "total_hours_spent": 3,
    "tasks": [
      {
        "id": 5,
        "title": "Preparar guia de laboratorio",
        "description": "Redactar la guia del laboratorio de nube",
        "status": "OPEN",
        "week": "2026-W40",
        "hours_spent": 3,
        "observations": "Pendiente de revision",
        "is_late_report": false,
        "created_at": "2026-10-01T11:00:00Z",
        "attachments": [ { "id": 2, "name": "guia.pdf", "url": "https://example.com/guia.pdf" } ]
      }
    ]
  }
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_field` | El campo assignment_id es obligatorio | Falta `assignment_id` |
| 400 | `invalid_field` | El campo assignment_id debe ser un entero positivo | `assignment_id` no es un entero positivo |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es operational |
| 404 | `assignment_not_found` | La vinculación no existe | No existe |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | La vinculación es de otra persona |
| 400 | `invalid_week_format` | La semana debe tener el formato AAAA-Www (ej. 2026-W42) | `week` mal formado |
| 400 | `invalid_week` | La semana `<week>` no existe en el calendario ISO | P. ej. `2026-W60` |
| 400 | `future_week` | No se pueden registrar tareas para semanas futuras | `week` futura (el mensaje es el mismo del registro) |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 8.3 `GET /api/v1/tasks/history`

Historial semana por semana de una vinculación propia, de la más reciente a la más antigua. Incluye las semanas sin
reporte.

**Headers:** `Authorization`. **Body:** ninguno.

**Query params**

| Param | Obligatorio | Reglas |
|---|---|---|
| `assignment_id` | Sí | Entero positivo, vinculación propia |
| `end_week` | No | `AAAA-Www`, no futura. Por defecto, la semana actual |
| `start_week` | No | `AAAA-Www`. Por defecto, la semana de inicio del espacio (o `end_week` si esa es posterior) |

`start_week` no puede ser posterior a `end_week`.

**Respuesta exitosa — 200**
```json
{
  "data": {
    "assignment_id": 1,
    "start_week": "2026-W38",
    "end_week": "2026-W40",
    "total_hours_spent": 9,
    "total_tasks": 4,
    "weeks": [
      { "week": "2026-W40", "total_hours_spent": 3, "task_count": 1, "status": "REPORTED", "has_late_reports": false },
      { "week": "2026-W39", "total_hours_spent": 0, "task_count": 0, "status": "NO_REPORT", "has_late_reports": false },
      { "week": "2026-W38", "total_hours_spent": 6, "task_count": 3, "status": "REPORTED", "has_late_reports": true }
    ]
  }
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_field` | El campo assignment_id es obligatorio | Falta `assignment_id` |
| 400 | `invalid_field` | El campo assignment_id debe ser un entero positivo | `assignment_id` no es un entero positivo |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es operational |
| 404 | `assignment_not_found` | La vinculación no existe | No existe |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | La vinculación es de otra persona |
| 400 | `invalid_week_format` | La semana debe tener el formato AAAA-Www (ej. 2026-W42) | `end_week` y luego `start_week` mal formados |
| 400 | `invalid_week` | La semana especificada no existe en el calendario ISO | `end_week` o `start_week` inexistente |
| 400 | `future_week_not_allowed` | No se permite consultar semanas futuras | `end_week` futura |
| 400 | `invalid_week_range` | La semana inicial no puede ser posterior a la semana final | `start_week` > `end_week` |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 8.4 `PUT /api/v1/tasks/:id`

Edita una tarea propia de la **semana actual**. Es un **reemplazo completo**: envía todos los campos editables.
`observations` y `attachments` omitidos quedan vacíos; `hours_spent` omitido da `hours_out_of_range`. Los adjuntos
anteriores se borran y se crean los enviados (con ids nuevos).

**Headers:** `Authorization`, `Content-Type: application/json`.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id de la tarea, mayor que 0 |

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `title` | string | Sí | 3 a 150 caracteres |
| `description` | string | Sí | 5 a 1000 caracteres |
| `status` | string | Sí* | `OPEN`, `IN_PROGRESS`, `COMPLETED`; `PENDING` se acepta como `OPEN` |
| `state` | string | — | Alias de `status` si `status` viene vacío |
| `hours_spent` | entero | Sí | 1 a 168, entero |
| `observations` | string | No | Máximo 1000 caracteres |
| `attachments` | arreglo | No | Máximo 3 |
| `attachments[].file_name` | string | Sí* | Extensión `.pdf`, `.zip`, `.png` o `.jpg` |
| `attachments[].name` | string | — | Alias de `file_name` |
| `attachments[].url` | string | Sí* | URL del archivo |
| `attachments[].location` | string | — | Alias de `url` |
| `assignment_id` | entero | No | Inmutable: si se envía, debe ser igual al actual |
| `week` | string | No | Inmutable: si se envía no vacío, debe ser igual al actual |

```json
{
  "title": "Preparar guia de laboratorio",
  "description": "Redactar la guia del laboratorio de nube",
  "status": "COMPLETED",
  "hours_spent": 4,
  "observations": "Entregada",
  "attachments": [ { "file_name": "guia.pdf", "url": "https://example.com/guia.pdf" } ]
}
```

**Respuesta exitosa — 200**
```json
{
  "data": {
    "id": 15,
    "assignment_id": 1,
    "week": "2026-W44",
    "title": "Preparar guia de laboratorio",
    "description": "Redactar la guia del laboratorio de nube",
    "status": "COMPLETED",
    "hours_spent": 4,
    "observations": "Entregada",
    "attachments": [ { "id": 9, "file_name": "guia.pdf", "url": "https://example.com/guia.pdf" } ],
    "is_late_report": false,
    "updated_at": "2026-10-31T23:50:00Z"
  }
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_field` | El parámetro de ruta id debe ser un entero positivo | `id` no es un entero positivo |
| 400 | `hours_not_integer` | El tiempo invertido debe expresarse en horas enteras | `hours_spent` no es un entero |
| 400 | `invalid_field` | El campo `<campo>` tiene un tipo inválido | Otro campo con tipo inválido |
| 400 | `invalid_body` | El cuerpo de la solicitud no es un JSON válido | El body no es JSON |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es operational |
| 404 | `task_not_found` | La tarea no existe | No hay tarea con ese id |
| 404 | `assignment_not_found` | La vinculación no existe | La vinculación de la tarea ya no existe |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | La tarea es de otra persona |
| 409 | `workspace_closed` | El curso o proyecto está cerrado | Espacio `CERRADO` |
| 400 | `immutable_field_modified` | No se pueden modificar los campos inmutables (assignment_id o week) | `assignment_id` o `week` distintos a los actuales |
| 400 | `late_report_immutable` | Los reportes tardíos son inmutables y no pueden modificarse | La tarea es un reporte tardío |
| 400 | `closed_week` | No se pueden modificar tareas de semanas cerradas | La tarea no es de la semana actual |
| 400 | `invalid_title` | El título debe tener entre 3 y 150 caracteres | Título vacío o fuera de rango |
| 400 | `invalid_description` | La descripción debe tener entre 5 y 1000 caracteres | Descripción vacía o fuera de rango |
| 400 | `observations_too_long` | Las observaciones admiten como máximo 1000 caracteres | Observaciones largas |
| 400 | `invalid_status` | El estado debe ser OPEN, IN_PROGRESS o COMPLETED | Estado vacío o inválido |
| 400 | `hours_out_of_range` | El tiempo invertido debe estar entre 1 y 168 horas | Horas omitidas o fuera de rango |
| 400 | `too_many_attachments` | Una tarea admite como máximo 3 adjuntos | Más de 3 adjuntos |
| 400 | `invalid_attachment` | El adjunto `<n>` debe tener nombre y url | Falta `file_name`/`name` o `url`/`location` |
| 400 | `attachment_format_not_allowed` | El adjunto `<n>` (`<file_name>`) tiene un formato no permitido. Formatos permitidos: pdf, zip, png, jpg | Extensión no permitida |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

En la edición, los campos vacíos no dan `invalid_field`: dan el error de validación de ese campo.

---

### 8.5 `DELETE /api/v1/tasks/:id`

Borra una tarea propia de la **semana actual** y sus adjuntos.

**Headers:** `Authorization`. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id de la tarea, mayor que 0 |

**Respuesta exitosa — 200**
```json
{ "data": { "id": 15, "message": "Tarea eliminada correctamente" } }
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_field` | El parámetro de ruta id debe ser un entero positivo | `id` no es un entero positivo |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es operational |
| 404 | `task_not_found` | La tarea no existe | No hay tarea con ese id |
| 404 | `assignment_not_found` | La vinculación no existe | La vinculación de la tarea ya no existe |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | La tarea es de otra persona |
| 409 | `workspace_closed` | El curso o proyecto está cerrado | Espacio `CERRADO` |
| 400 | `late_report_immutable` | Los reportes tardíos son inmutables y no pueden modificarse | La tarea es un reporte tardío |
| 400 | `closed_week` | No se pueden modificar tareas de semanas cerradas | La tarea no es de la semana actual |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

## 9. Seguimiento (profesor / administrador)

Ambos endpoints reciben el **id de la vinculación** (`assignments[].id` de [7.2](#72-get-apiv1assignments)). Los
puede llamar el **admin** o el **professor responsable** del espacio; cualquier otro usuario recibe 403.

> En estos dos endpoints, la vinculación se busca **antes** de revisar el rol: un id inexistente da 404 incluso para
> un usuario sin permiso.

### 9.1 `GET /api/v1/assignments/:id/consolidated`

Consolidado del trabajo de una vinculación desde la semana de inicio del espacio hasta la semana actual (o hasta la
semana de cierre, si el espacio está cerrado).

**Headers:** `Authorization`. **Query params:** ninguno. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id de la vinculación, mayor que 0 |

**Respuesta exitosa — 200**
```json
{
  "data": {
    "student": { "user_id": 3, "user_name": "Monitor User" },
    "workspace": { "workspace_id": 4, "workspace_name": "Desarrollo de Software en la Nube", "workspace_status": "ACTIVO" },
    "role": "MONITOR",
    "weekly_hours": 10,
    "summary": {
      "start_week": "2026-W32",
      "end_week": "2026-W44",
      "total_weeks_evaluated": 13,
      "reported_weeks_count": 3,
      "no_report_weeks_count": 10,
      "expected_hours": 130,
      "total_hours_spent": 14,
      "total_tasks": 5,
      "hours_balance": -116,
      "compliance_percentage": 10.8
    },
    "weeks": [
      { "week": "2026-W44", "total_hours_spent": 0, "task_count": 0, "status": "NO_REPORT", "has_late_reports": false },
      { "week": "2026-W40", "total_hours_spent": 3, "task_count": 1, "status": "REPORTED", "has_late_reports": false }
    ]
  }
}
```

| Campo | Descripción |
|---|---|
| `summary.start_week` / `end_week` | Rango evaluado (más antigua / más reciente) |
| `summary.expected_hours` | `total_weeks_evaluated × weekly_hours` |
| `summary.hours_balance` | `total_hours_spent − expected_hours` (puede ser negativo) |
| `summary.compliance_percentage` | `total_hours_spent / expected_hours × 100`, un decimal; 0 si no se esperaban horas |
| `weeks` | Una entrada por semana del rango, de la más reciente a la más antigua (el ejemplo está recortado) |
| `weeks[].status` | `REPORTED` si la semana suma horas; si no, `NO_REPORT` |
| `weeks[].has_late_reports` | `true` si alguna tarea de esa semana es reporte tardío (siempre `false` en `NO_REPORT`) |

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_field` | El identificador de vinculación es inválido | `id` no es un entero positivo |
| 404 | `assignment_not_found` | La vinculación no existe | No existe |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario es operational, o es un professor que no es el responsable |
| 500 | `internal_error` | Error interno al consultar el consolidado | Fallo inesperado |

---

### 9.2 `GET /api/v1/assignments/:id/weekly`

Detalle del trabajo de una vinculación en una semana, con sus tareas (más recientes primero).

**Headers:** `Authorization`. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | Id de la vinculación, mayor que 0 |

**Query params**

| Param | Obligatorio | Reglas |
|---|---|---|
| `week` | No | `AAAA-Www`, no futura, no anterior a la semana de inicio del espacio y, si está cerrado, no posterior a la de cierre. Por defecto, la semana actual |

**Respuesta exitosa — 200**
```json
{
  "data": {
    "student": { "user_id": 3, "user_name": "Monitor User" },
    "workspace": { "workspace_id": 4, "workspace_name": "Desarrollo de Software en la Nube", "workspace_status": "ACTIVO" },
    "role": "MONITOR",
    "weekly_hours": 10,
    "week": "2026-W39",
    "status": "REPORTED",
    "total_hours_spent": 6,
    "expected_hours": 10,
    "hours_balance": -4,
    "has_late_reports": true,
    "tasks": [
      {
        "id": 4,
        "title": "Corregir calculo de horas",
        "description": "Ajustar el calculo de horas semanales",
        "status": "COMPLETED",
        "hours_spent": 4,
        "observations": "Validado con el profesor",
        "attachments": [],
        "is_late_report": true,
        "created_at": "2026-09-29T09:00:00Z",
        "updated_at": "2026-09-29T09:00:00Z"
      }
    ]
  }
}
```

| Campo | Descripción |
|---|---|
| `status` | `REPORTED` si la semana suma horas; si no, `NO_REPORT` |
| `expected_hours` | Igual a `weekly_hours` |
| `hours_balance` | `total_hours_spent − expected_hours` |
| `tasks[].attachments[]` | `{ "id", "file_name", "url" }` |

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 400 | `invalid_field` | El identificador de vinculación es inválido | `id` no es un entero positivo |
| 404 | `assignment_not_found` | La vinculación no existe | No existe |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario es operational, o es un professor que no es el responsable |
| 400 | `invalid_field` | El formato de la semana es inválido | `week` mal formado o inexistente en el calendario ISO |
| 400 | `future_week` | No se permite consultar semanas futuras | `week` futura |
| 400 | `week_out_of_range` | La semana solicitada está fuera del rango del espacio de trabajo | Antes del inicio del espacio, o después del cierre si está cerrado |
| 500 | `internal_error` | Error interno al consultar el trabajo semanal | Fallo inesperado |

---

## 10. Reportes con IA

Flujo completo en [11.3](#113-flujo-de-reportes-para-el-frontend). Los reportes se generan en segundo plano: el POST
**no** devuelve el PDF.

Objeto **lote** (respuesta de 10.1 y 10.2):

| Campo | Tipo | Descripción |
|---|---|---|
| `batch_id` | number | Id del lote (úsalo en 10.2 y 10.5) |
| `week` | string | Semana del lote |
| `created_at` | string | Instante de creación (con microsegundos) |
| `total_reports` | number | Cantidad de reportes |
| `status_counts.pending` | number | Reportes `PENDIENTE` |
| `status_counts.generated` | number | Reportes `GENERADO` |
| `status_counts.failed` | number | Reportes `FALLIDO` |
| `reports[].report_id` | number | Id del reporte (úsalo en 10.4) |
| `reports[].assignment_id` | number | Vinculación |
| `reports[].person` | objeto | `{ "id", "full_name" }` |
| `reports[].role` | string | `MONITOR` o `GRADUATE_ASSISTANT` |
| `reports[].workspace` | objeto | `{ "id", "name", "type" }` |
| `reports[].status` | string | `PENDIENTE`, `GENERADO` o `FALLIDO` |
| `reports[].failure_reason` | string \| null | Motivo si está `FALLIDO` (ver [11.1](#111-valores-de-failure_reason)); si no, `null` |

### 10.1 `POST /api/v1/reports/batch`

Pide los reportes de una semana **cerrada** para todas las vinculaciones de los espacios del profesor (activos o
cerrados) cuyas fechas tocan esa semana. Crea un reporte `PENDIENTE` por vinculación y responde de inmediato. Solo
**professor**.

**Headers:** `Authorization`, `Content-Type: application/json`.

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `week` | string | Sí | `AAAA-Www`, anterior a la semana actual |

```json
{ "week": "2026-W40" }
```

**Respuesta exitosa — 202**
```json
{
  "data": {
    "batch_id": 7,
    "week": "2026-W40",
    "created_at": "2026-10-31T23:30:38.123456Z",
    "total_reports": 2,
    "status_counts": { "pending": 2, "generated": 0, "failed": 0 },
    "reports": [
      {
        "report_id": 19,
        "assignment_id": 1,
        "person": { "id": 3, "full_name": "Monitor User" },
        "role": "MONITOR",
        "workspace": { "id": 4, "name": "Desarrollo de Software en la Nube", "type": "CURSO" },
        "status": "PENDIENTE",
        "failure_reason": null
      },
      {
        "report_id": 20,
        "assignment_id": 2,
        "person": { "id": 5, "full_name": "Asistente Graduado" },
        "role": "GRADUATE_ASSISTANT",
        "workspace": { "id": 4, "name": "Desarrollo de Software en la Nube", "type": "CURSO" },
        "status": "PENDIENTE",
        "failure_reason": null
      }
    ]
  }
}
```

Si un reporte no se pudo encolar, ya viene `FALLIDO` con `failure_reason` "No fue posible encolar el reporte".

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es professor |
| 400 | `invalid_field` | El campo week es obligatorio | `week` ausente o vacío |
| 400 | `invalid_week_format` | La semana debe tener el formato AAAA-Www (ej. 2026-W42) | `week` mal formado, **o el body no es JSON válido** |
| 400 | `invalid_week` | La semana `<week>` no existe en el calendario ISO | P. ej. `2026-W60` |
| 400 | `week_not_closed` | La semana `<week>` aún no ha cerrado; solo se generan reportes de semanas terminadas | `week` es la actual o futura |
| 422 | `no_eligible_assignments` | No hay vinculaciones en tus cursos o proyectos para la semana `<week>` | Ninguna vinculación toca esa semana |
| 409 | `report_batch_in_progress` | Ya hay un lote en proceso para la semana `<week>` | El profesor tiene reportes `PENDIENTE` de esa semana |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 10.2 `GET /api/v1/reports/batch/:id`

Estado de un lote del profesor de la sesión. Consúltalo periódicamente hasta que `status_counts.pending` sea 0. Solo
**professor** (el admin recibe 403).

**Headers:** `Authorization`. **Query params:** ninguno. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | `batch_id` del POST, mayor que 0 |

**Respuesta exitosa — 200**: el objeto lote, con los reportes ordenados por id.
```json
{
  "data": {
    "batch_id": 7,
    "week": "2026-W40",
    "created_at": "2026-10-31T23:30:38.123456Z",
    "total_reports": 2,
    "status_counts": { "pending": 0, "generated": 1, "failed": 1 },
    "reports": [
      {
        "report_id": 19,
        "assignment_id": 1,
        "person": { "id": 3, "full_name": "Monitor User" },
        "role": "MONITOR",
        "workspace": { "id": 4, "name": "Desarrollo de Software en la Nube", "type": "CURSO" },
        "status": "GENERADO",
        "failure_reason": null
      },
      {
        "report_id": 20,
        "assignment_id": 2,
        "person": { "id": 5, "full_name": "Asistente Graduado" },
        "role": "GRADUATE_ASSISTANT",
        "workspace": { "id": 4, "name": "Desarrollo de Software en la Nube", "type": "CURSO" },
        "status": "FALLIDO",
        "failure_reason": "No fue posible generar o guardar el PDF"
      }
    ]
  }
}
```

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario no es professor |
| 400 | `invalid_field` | El identificador del lote debe ser un entero positivo | `id` no es un entero positivo |
| 404 | `report_batch_not_found` | El lote no existe | No hay lote con ese id |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El lote es de otro profesor |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 10.3 `GET /api/v1/reports`

Lista los reportes **vigentes** (`GENERADO` y no reemplazados) de una semana, incluidos los de espacios cerrados.
Orden: nombre de la persona, nombre del espacio, id. **professor** (solo los suyos) y **admin** (todos).

**Headers:** `Authorization`. **Body:** ninguno.

**Query params**

| Param | Obligatorio | Reglas |
|---|---|---|
| `week` | Sí | `AAAA-Www` |
| `person_id` | No | Entero positivo; filtra por persona |
| `professor_id` | No | Entero positivo; filtra por profesor. **Solo admin**: un professor no puede enviarlo |

**Respuesta exitosa — 200**
```json
{
  "data": {
    "week": "2026-W40",
    "total_reports": 1,
    "reports": [
      {
        "report_id": 19,
        "batch_id": 7,
        "assignment_id": 1,
        "person": { "id": 3, "full_name": "Monitor User" },
        "role": "MONITOR",
        "workspace": { "id": 4, "name": "Desarrollo de Software en la Nube", "type": "CURSO" },
        "professor": { "id": 2, "full_name": "Professor User" },
        "week": "2026-W40",
        "generated_at": "2026-10-31T23:31:02.654321Z"
      }
    ]
  }
}
```

Una persona sin reportes (o que no existe) da `reports: []`.

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario es operational |
| 400 | `invalid_field` | El campo week es obligatorio | Falta `week` |
| 400 | `invalid_week_format` | La semana debe tener el formato AAAA-Www (ej. 2026-W42) | `week` mal formado |
| 400 | `invalid_week` | La semana `<week>` no existe en el calendario ISO | P. ej. `2026-W60` |
| 400 | `invalid_field` | Como profesor no puedes filtrar por profesor; solo ves tus propios reportes | Un professor envió `professor_id` |
| 400 | `invalid_field` | El filtro person_id debe ser un entero positivo | `person_id` no es un entero positivo |
| 400 | `invalid_field` | El filtro professor_id debe ser un entero positivo | (admin) `professor_id` no es un entero positivo |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 10.4 `GET /api/v1/reports/:id/download`

Descarga el PDF de un reporte vigente. **professor** (solo los suyos) y **admin**.

**Headers:** `Authorization`. **Query params:** ninguno. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | `report_id`, mayor que 0 |

**Respuesta exitosa — 200** (binario)

| Header de respuesta | Valor |
|---|---|
| `Content-Type` | `application/pdf` |
| `Content-Disposition` | `attachment; filename="2026W40-2-reporte-19.pdf"` |
| `Cache-Control` | `no-store` |

Pídelo como blob (`responseType: 'blob'` / `res.blob()`), no como JSON. Los errores sí llegan en JSON.

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario es operational |
| 400 | `invalid_field` | El identificador del reporte debe ser un entero positivo | `id` no es un entero positivo |
| 404 | `report_not_found` | El reporte no existe | No existe |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El reporte es de otro profesor |
| 404 | `report_not_found` | El reporte no existe | El reporte fue reemplazado por uno más nuevo |
| 409 | `report_not_available` | El reporte no está disponible para descarga | Está `PENDIENTE` o `FALLIDO` |
| 500 | `report_file_unavailable` | El archivo del reporte no está disponible | No se pudo leer el PDF del almacenamiento |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

### 10.5 `GET /api/v1/reports/batch/:id/download`

Descarga un ZIP con los PDF disponibles de un lote (los `PENDIENTE`, `FALLIDO` y reemplazados se omiten, incluso si el
lote sigue en curso). **professor** (solo los suyos) y **admin**.

**Headers:** `Authorization`. **Query params:** ninguno. **Body:** ninguno.

**Path params**

| Param | Tipo | Reglas |
|---|---|---|
| `id` | entero | `batch_id`, mayor que 0 |

**Respuesta exitosa — 200** (binario)

| Header de respuesta | Valor |
|---|---|
| `Content-Type` | `application/zip` |
| `Content-Disposition` | `attachment; filename="2026W40-2-reporte.zip"` |
| `Cache-Control` | `no-store` |

Dentro del ZIP, cada PDF se llama como en [10.4](#104-get-apiv1reportsiddownload).

**Errores**

| Status | `code` | `message` | Cuándo |
|---|---|---|---|
| 401 | `unauthenticated` | Debes iniciar sesión | Ver [1.2](#12-autenticación) |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El usuario es operational |
| 400 | `invalid_field` | El identificador del lote debe ser un entero positivo | `id` no es un entero positivo |
| 404 | `report_batch_not_found` | El lote no existe | No hay lote con ese id |
| 403 | `forbidden` | No tienes permisos para realizar esta operación | El lote es de otro profesor |
| 422 | `no_available_reports` | El lote no tiene reportes disponibles para descarga | Ningún reporte del lote está disponible |
| 500 | `report_file_unavailable` | El archivo del reporte no está disponible | No se pudo leer algún PDF (no se entrega un ZIP parcial) |
| 500 | `internal_error` | Error interno del servidor | Fallo inesperado |

---

## 11. Anexos

### 11.1 Valores de `failure_reason`

| Texto | Causa |
|---|---|
| No fue posible encolar el reporte | El reporte no se pudo poner en la cola al crear el lote |
| El servicio de IA no estuvo disponible después de varios intentos | La IA falló en todos los reintentos (cuota, red, 5xx) |
| El servicio de IA rechazó la solicitud | La IA rechazó la petición (clave o modelo inválidos) |
| El servicio de IA no generó un resumen válido | La IA respondió vacío |
| No fue posible generar o guardar el PDF | Falló el PDF o su almacenamiento |

Un reporte `FALLIDO` no se reintenta solo: hay que pedir un lote nuevo para esa semana.

### 11.2 Nombres de los archivos descargados

| Archivo | Patrón | Ejemplo |
|---|---|---|
| PDF | `<semana sin guion>-<id profesor>-reporte-<id reporte>.pdf` | `2026W40-2-reporte-19.pdf` |
| ZIP | `<semana sin guion>-<id profesor>-reporte.zip` | `2026W40-2-reporte.zip` |

### 11.3 Flujo de reportes para el frontend

1. `POST /api/v1/reports/batch` con `{"week": "<semana cerrada>"}` → guardar `data.batch_id`.
2. Consultar `GET /api/v1/reports/batch/<batch_id>` cada pocos segundos hasta que `data.status_counts.pending` sea 0
   (la IA procesa unos 10 reportes por minuto).
3. Mostrar cada reporte con su `status`; para los `FALLIDO`, mostrar `failure_reason`.
4. Descargar:
   - un reporte `GENERADO`: `GET /api/v1/reports/<report_id>/download`;
   - todo el lote: `GET /api/v1/reports/batch/<batch_id>/download`.
5. Para ver reportes de semanas anteriores sin conocer el lote: `GET /api/v1/reports?week=<semana>`.
