# Propuesta de Endpoints REST

> En la presente sección se define la estructura de endpoints REST del sistema, organizada por paquete Go y alineada con el product backlog, los requerimientos funcionales (RF) y las reglas de negocio (RN).

Prefijo base de la API: `/api/v1`

---

## 1. Autenticación y Usuarios — `internal/auth`

### 1.1 Sesiones

| #  | Método | Ruta             | Rol         | Backlog / RF                        |
|----|--------|------------------|-------------|-------------------------------------|
| 01 | POST   | `/auth/login`    | Público     | Iniciar sesión (RF-01.1)            |
| 02 | POST   | `/auth/logout`   | Autenticado | Cerrar sesión (RF-01.1)             |

- **Login** devuelve un token Bearer + datos básicos del usuario (id, nombre, email, rol).
- **Logout** invalida la sesión server-side (tabla `sessions`).
- Como el usuario tiene un **único rol**, no hay selección de contexto post-login.

### 1.2 Gestión de usuarios (Admin)

| #  | Método | Ruta               | Rol   | Backlog / RF                         |
|----|--------|--------------------|-------|--------------------------------------|
| 03 | POST   | `/users`           | Admin | Crear usuario (RF-02.1, RF-15.2)     |
| 04 | GET    | `/users`           | Admin | Listar usuarios (RF-02.3)            |
| 05 | GET    | `/users/{id}`      | Admin | Ver detalle de usuario (RF-02.3)     |
| 06 | PUT    | `/users/{id}/role` | Admin | Asignar rol a un usuario (RF-02.2)   |

> `PUT /users/{id}/role` asigna o cambia el rol único del usuario. Body: `{ "role": "professor" }`.
> Valores válidos de rol: `professor`, `monitor`, `graduate_assistant`, `admin`.

---

## 2. Gestión Académica — `internal/academic`

### 2.1 Períodos académicos

| #  | Método | Ruta        | Rol   | Backlog / RF                      |
|----|--------|-------------|-------|-----------------------------------|
| 07 | POST   | `/periods`  | Admin | Crear período académico (RF-03.2) |
| 08 | GET    | `/periods`  | Admin | Listar períodos (RF-03.2)         |

### 2.2 Workspaces — Profesor y Monitor/GA

| #  | Método | Ruta                       | Rol                   | Backlog / RF                                      |
|----|--------|----------------------------|-----------------------|---------------------------------------------------|
| 09 | POST   | `/workspaces`              | Professor             | Crear curso o proyecto (RF-03.1)                  |
| 10 | GET    | `/workspaces`              | Professor, Monitor/GA | Listar mis cursos y proyectos (RF-03.4, RF-11.1)  |
| 11 | GET    | `/workspaces/{id}`         | Professor, Admin      | Ver detalle de curso o proyecto (RF-03.4)         |
| 12 | PATCH  | `/workspaces/{id}/close`   | Professor             | Cerrar curso o proyecto (RF-03.5)                 |

> `GET /workspaces` filtra automáticamente según el rol del token:
> - **Professor** → workspaces donde es responsable.
> - **Monitor/GA** → workspaces donde tiene vinculación activa.

### 2.3 Vinculaciones — Profesor

| #  | Método | Ruta                                 | Rol       | Backlog / RF                             |
|----|--------|--------------------------------------|-----------|------------------------------------------|
| 13 | POST   | `/workspaces/{wId}/assignments`      | Professor | Crear vinculación (RF-04.1)              |
| 14 | GET    | `/assignments`                       | Professor | Listar personas a cargo (RF-10.1)        |
| 15 | GET    | `/assignments/{aId}`                 | Professor | Ver detalle de persona a cargo (RF-10.2) |

- **`POST`** valida reglas de horas (RN-14 a RN-19) vía `domain/hoursengine` antes de persistir.
- **`GET /assignments`** devuelve todas las personas vinculadas a cualquier workspace del profesor autenticado. Soporta `?workspace_id={wId}` para filtrar por workspace específico.
- **`GET /assignments/{aId}`** incluye info de la persona, workspace, rol, horas contratadas.

### 2.4 Workspaces y Vinculaciones — Admin (rutas separadas)

| #  | Método | Ruta                                    | Rol   | Backlog / RF                                  |
|----|--------|-----------------------------------------|-------|-----------------------------------------------|
| 16 | GET    | `/admin/workspaces`                     | Admin | Listar cursos y proyectos (RF-15.1)           |
| 17 | GET    | `/admin/workspaces/{wId}/assignments`   | Admin | Ver personas vinculadas a un curso (RF-15.1)  |
| 18 | GET    | `/admin/assignments/{aId}`              | Admin | Ver detalle de vinculación (RF-15.1)          |
| 19 | PUT    | `/admin/assignments/{aId}`              | Admin | Actualizar vinculación (RF-04.5, RF-15.3)     |

> `PUT /admin/assignments/{aId}` es la **única vía** para rectificar horas contratadas (RN-12 + RF-04.5). El profesor **no** puede modificar horas una vez creada la vinculación.

---

## 3. Tareas y Seguimiento — `internal/tracking`

### 3.1 CRUD de Tareas — Monitor / Asistente Graduado

| #  | Método | Ruta                                    | Rol        | Backlog / RF                             |
|----|--------|-----------------------------------------|------------|------------------------------------------|
| 20 | POST   | `/assignments/{aId}/tasks`              | Monitor/GA | Crear tarea (RF-06.1)                    |
| 21 | GET    | `/assignments/{aId}/tasks`              | Monitor/GA | Listar mis tareas de la semana (RF-11.2) |
| 22 | PUT    | `/assignments/{aId}/tasks/{tId}`        | Monitor/GA | Actualizar tarea (RF-06.7, RF-07.2)      |
| 23 | DELETE | `/assignments/{aId}/tasks/{tId}`        | Monitor/GA | Eliminar tarea (RF-06.8)                 |

**Query params de `GET /assignments/{aId}/tasks`:**

| Param  | Tipo   | Ejemplo    | Descripción                     |
|--------|--------|------------|---------------------------------|
| `week` | string | `2026-W42` | Filtra por semana ISO (RF-08.1) |

- Sin `week` → devuelve tareas de la **semana activa**.
- La creación para semanas pasadas marca automáticamente `late_report = true` (RN-32).
- Tareas con `late_report = true` rechazan PUT y DELETE (RN-33).

### 3.2 Historial — Monitor / Asistente Graduado

| #  | Método | Ruta                                       | Rol        | Backlog / RF                                         |
|----|--------|--------------------------------------------|------------|------------------------------------------------------|
| 24 | GET    | `/assignments/{aId}/tasks/history`         | Monitor/GA | Consultar historial de registros semanales (RF-11.3)  |

Devuelve un listado paginado de semanas con resumen (total horas, cantidad de tareas, estado: reportado / tardío / sin reporte).

### 3.3 Vistas del Profesor — Seguimiento

| #  | Método | Ruta                                        | Rol       | Backlog / RF                                 |
|----|--------|---------------------------------------------|-----------|----------------------------------------------|
| 25 | GET    | `/assignments/{aId}/weekly-summary`         | Professor | Ver trabajo semanal de una persona (RF-10.3)  |
| 26 | GET    | `/assignments/{aId}/summary`                | Professor | Ver trabajo consolidado (RF-10.4)             |
| 27 | GET    | `/assignments/{aId}/hours`                  | Professor | Ver horas reportadas vs contratadas (RF-10.6) |

**Query params de `GET /assignments/{aId}/weekly-summary`:**

| Param  | Tipo   | Ejemplo    | Descripción                                |
|--------|--------|------------|--------------------------------------------|
| `week` | string | `2026-W42` | Semana a consultar (default: semana actual) |

- **`/summary`** devuelve acumulado de todas las semanas: total horas, tareas por estado, semanas con/sin reporte.
- **`/hours`** devuelve por semana: `{ week, contracted_hours, reported_hours, delta }`.

### 3.4 Tareas — Admin

| #  | Método | Ruta                                       | Rol   | Backlog / RF                                            |
|----|--------|--------------------------------------------|-------|---------------------------------------------------------|
| 28 | GET    | `/admin/workspaces/{wId}/tasks`            | Admin | Consultar tareas registradas de un proyecto (RF-15.1)   |

**Query params:**

| Param  | Tipo   | Ejemplo    | Descripción                              |
|--------|--------|------------|------------------------------------------|
| `week` | string | `2026-W42` | Filtrar tareas por semana de un proyecto  |

---

## 4. Reportes — `internal/reporting`

| #  | Método | Ruta                          | Rol              | Backlog / RF                                 |
|----|--------|-------------------------------|------------------|----------------------------------------------|
| 29 | POST   | `/reports/batch`              | Professor        | Crear reportes semanales por lotes (RF-14.1)  |
| 30 | GET    | `/reports`                    | Professor, Admin | Listar reportes generados                     |
| 31 | GET    | `/reports/{id}/download`      | Professor, Admin | Descargar reporte PDF (RF-14.6)               |

**Body de `POST /reports/batch`:**

```json
{
  "week": "2026-W42"
}
```

Genera un reporte PDF individual por cada persona vinculada a **todos** los workspaces del profesor para esa semana (RN-41, RN-42). El proceso es asíncrono vía Asynq.

**Query params de `GET /reports`:**

| Param  | Tipo   | Ejemplo    | Descripción        |
|--------|--------|------------|--------------------|
| `week` | string | `2026-W42` | Filtrar por semana  |

---

## Resumen: Conteo por paquete

| Paquete              | Endpoints | Backlog items cubiertos                                  |
|----------------------|-----------|----------------------------------------------------------|
| `internal/auth`      | 6         | Login, logout, CRUD users, asignar rol                   |
| `internal/academic`  | 11        | Períodos, workspaces, vinculaciones profesor + admin      |
| `internal/tracking`  | 9         | Tareas CRUD, historial, vistas profesor, tareas admin     |
| `internal/reporting` | 3         | Batch reportes, listado, descarga PDF                    |
| **Total**            | **29**    |                                                          |

---

## Convenciones

1. **IDs en ruta** usan el patrón `:id` de Gin (e.g. `c.Param("id")`).
2. **Semanas** siguen formato ISO 8601: `YYYY-Www` (e.g. `2026-W42`).
3. **Paginación** en listados: `?page=1&page_size=20` (defaults: page=1, page_size=20).
4. **Responses** siguen estructura uniforme:
   - Éxito: `{ "data": ... }` o `{ "data": [...], "meta": { "page", "page_size", "total" } }`
   - Error: `{ "error": { "code": "...", "message": "..." } }`
5. **Autorización** resuelta en middleware (`auth/middleware.go`); rutas `/admin/*` verifican `role == admin`.

