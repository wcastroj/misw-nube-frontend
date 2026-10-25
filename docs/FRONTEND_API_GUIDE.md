# Especificación de Funcionalidades y Endpoints por Rol (Frontend API Guide)

## 1. Información General y Autenticación

- **Base URL:** `/api/v1`
- **Mecanismo de autenticación:** Encabezado HTTP `Authorization: Bearer <token>`
- **Modelo de roles a nivel de usuario (`role`):**
  - `admin`: Administrador del sistema.
  - `professor`: Docente responsable de espacios académicos y de la supervisión de asistentes/monitores.
  - `operational`: Usuario operativo que ejecuta actividades (asistente graduado o monitor).
- **Roles de vinculación (`rol` en vinculaciones / `AssignmentRole`):**
  - `MONITOR`: Monitor de curso o proyecto.
  - `GRADUATE_ASSISTANT`: Asistente graduado.
- **Formato temporal estándar:** Semanas en formato ISO 8601 (`AAAA-Www`, ej. `2026-W42`), fechas en formato `YYYY-MM-DD`.

---

## 2. Endpoints Comunes y Autenticación

| Funcionalidad | Descripción | Método | Endpoint | Request Body / Query Params | Respuesta Exitosa |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Iniciar sesión** | Autentica con correo y contraseña. Retorna token Bearer e información del usuario. | `POST` | `/auth/login` | Body: `{ "email": string, "password": string }` | `200 OK` (Token, ID, Nombre, Rol) |
| **Cerrar sesión** | Invalida el token y finaliza la sesión activa en el servidor. | `POST` | `/auth/logout` | Ninguno (requiere Bearer Token) | `204 No Content` |
| **Consultar períodos activos** | Lista los períodos académicos habilitados (cualquier usuario autenticado). | `GET` | `/periods` | Ninguno | `200 OK` (Array de períodos) |

---

## 3. Rol: Administrador (`admin`)

El administrador gestiona usuarios, configura los períodos académicos, audita la totalidad de espacios y vinculaciones, y es el único autorizado para rectificar horas semanales contratadas.

### 3.1. Gestión de Usuarios
- **Crear usuario:**
  - **Método:** `POST`
  - **Endpoint:** `/users`
  - **Descripción:** Crea cuentas con roles `admin`, `professor` u `operational`.
  - **Body:** `{ "nombre": string, "email": string, "password": string, "role": "admin" | "professor" | "operational" }`
  - **Respuesta:** `201 Created`
- **Listar usuarios:**
  - **Método:** `GET`
  - **Endpoint:** `/users`
  - **Descripción:** Lista completa de todos los usuarios registrados en el sistema.
  - **Respuesta:** `200 OK`
- **Detalle de usuario:**
  - **Método:** `GET`
  - **Endpoint:** `/users/:id`
  - **Descripción:** Obtiene los datos detallados de un usuario específico.
  - **Respuesta:** `200 OK`

### 3.2. Gestión de Períodos Académicos
- **Crear período académico:**
  - **Método:** `POST`
  - **Endpoint:** `/periods`
  - **Descripción:** Registra un nuevo período con fechas de vigencia y fecha límite de creación de cursos.
  - **Body:** `{ "codigo": "AAAA-NN", "fechaInicio": "YYYY-MM-DD", "fechaFin": "YYYY-MM-DD", "fechaLimite": "YYYY-MM-DD" }`
  - **Respuesta:** `201 Created`
- **Listar todos los períodos:**
  - **Método:** `GET`
  - **Endpoint:** `/periods`
  - **Descripción:** El administrador puede ver tanto períodos `ACTIVO` como `CERRADO`.
  - **Respuesta:** `200 OK`

### 3.3. Auditoría y Rectificación de Espacios y Vinculaciones
- **Listar todos los espacios de trabajo (Cursos/Proyectos):**
  - **Método:** `GET`
  - **Endpoint:** `/admin/workspaces`
  - **Descripción:** Vista global con estado, fechas, profesor a cargo y período académico.
  - **Respuesta:** `200 OK`
- **Ver personas vinculadas a un curso/proyecto:**
  - **Método:** `GET`
  - **Endpoint:** `/admin/workspaces/:wId/assignments`
  - **Descripción:** Lista los monitores y asistentes asignados a un espacio específico.
  - **Respuesta:** `200 OK`
- **Ver detalle de vinculación:**
  - **Método:** `GET`
  - **Endpoint:** `/admin/assignments/:id`
  - **Descripción:** Información completa de la persona, rol asignado, horas contratadas y profesor responsable.
  - **Respuesta:** `200 OK`
- **Rectificar horas de una vinculación:**
  - **Método:** `PUT`
  - **Endpoint:** `/admin/assignments/:id`
  - **Descripción:** Única operación autorizada para corregir las horas contratadas de una vinculación (aplica validaciones de topes 22h AG / 12h Monitor / regla 40%).
  - **Body:** `{ "horas_semanales": number }`
  - **Respuesta:** `200 OK`
- **Consultar tareas de un curso o proyecto:**
  - **Método:** `GET`
  - **Endpoint:** `/admin/workspaces/:wId/tasks`
  - **Descripción:** Permite auditar las tareas registradas en un espacio.
  - **Query Params opcionales:** `?week=AAAA-Www` (filtro por semana específica).
  - **Respuesta:** `200 OK`

### 3.4. Auditoría y Descarga Global de Reportes
- **Consultar reportes semanales generados:**
  - **Método:** `GET`
  - **Endpoint:** `/reports`
  - **Descripción:** Consulta reportes generados con IA para una semana.
  - **Query Params:** `?week=AAAA-Www` (obligatorio), `?professor_id={id}` (opcional), `?person_id={id}` (opcional).
  - **Respuesta:** `200 OK`
- **Descargar PDF de un reporte:**
  - **Método:** `GET`
  - **Endpoint:** `/reports/:id/download`
  - **Respuesta:** `200 OK` (`Content-Type: application/pdf`)
- **Descargar ZIP de un lote de reportes:**
  - **Método:** `GET`
  - **Endpoint:** `/reports/batch/:id/download`
  - **Respuesta:** `200 OK` (`Content-Type: application/zip`)

---

## 4. Rol: Profesor (`professor`)

El profesor crea y administra sus propios cursos y proyectos, vincula monitores y asistentes graduados, supervisa el trabajo semanal y acumulado, y genera reportes automáticos con IA.

### 4.1. Gestión de Cursos y Proyectos
- **Crear curso o proyecto:**
  - **Método:** `POST`
  - **Endpoint:** `/workspaces`
  - **Descripción:** Crea un espacio (`CURSO` o `PROYECTO`) dentro de un período académico activo antes de la fecha límite.
  - **Body:** `{ "nombre": string, "tipo": "CURSO" | "PROYECTO", "periodo_id": number, "fechaInicio": "YYYY-MM-DD", "fechaFin": "YYYY-MM-DD", "observaciones": string }`
  - **Respuesta:** `201 Created`
- **Listar mis cursos y proyectos:**
  - **Método:** `GET`
  - **Endpoint:** `/workspaces`
  - **Descripción:** Devuelve los espacios creados por el profesor autenticado.
  - **Respuesta:** `200 OK`
- **Detalle de un curso o proyecto:**
  - **Método:** `GET`
  - **Endpoint:** `/workspaces/:id`
  - **Descripción:** Obtiene los datos detallados de un espacio propio.
  - **Respuesta:** `200 OK`
- **Cerrar curso o proyecto:**
  - **Método:** `PATCH`
  - **Endpoint:** `/workspaces/:id/close`
  - **Descripción:** Cambia el estado a `CERRADO`. No admite nuevas tareas ni vinculaciones operativas.
  - **Respuesta:** `200 OK`

### 4.2. Vinculación de Personas
- **Vincular monitor o asistente graduado:**
  - **Método:** `POST`
  - **Endpoint:** `/assignments`
  - **Descripción:** Asocia un usuario operativo a un espacio propio con rol y horas contratadas. El backend valida automáticamente:
    - Máximo 22 horas semanales como asistente graduado.
    - Máximo 12 horas semanales y máximo 3 monitorías simultáneas.
    - Si tiene ambos roles, las horas de monitoría no pueden superar el 40% (redondeado hacia arriba) de las horas de asistente.
  - **Body:** `{ "user_id": number, "workspace_id": number, "rol": "MONITOR" | "GRADUATE_ASSISTANT", "horas_semanales": number }`
  - **Respuesta:** `201 Created`

### 4.3. Seguimiento y Supervisión
- **Listar personas a cargo (Vista Principal Profesor):**
  - **Método:** `GET`
  - **Endpoint:** `/assignments`
  - **Descripción:** Retorna la lista de todas las vinculaciones activas asociadas al profesor para la semana en curso, contrastando horas contratadas vs reportadas.
  - **Respuesta:** `200 OK` (incluye `week` y lista de `assignments`)
- **Detalle de una persona a cargo:**
  - **Método:** `GET`
  - **Endpoint:** `/assignments/:id` *(donde `:id` es el ID del usuario)*
  - **Descripción:** Lista los cursos o proyectos en los que la persona participa con este profesor.
  - **Respuesta:** `200 OK`
- **Consultar trabajo semanal detallado:**
  - **Método:** `GET`
  - **Endpoint:** `/assignments/:id/weekly` *(donde `:id` es el ID de la vinculación)*
  - **Descripción:** Muestra las tareas, horas reportadas, balance y estado operacional (`REPORTED` o `NO_REPORT`) en una semana específica.
  - **Query Params opcionales:** `?week=AAAA-Www` (por defecto la semana activa).
  - **Respuesta:** `200 OK`
- **Consultar trabajo consolidado histórico:**
  - **Método:** `GET`
  - **Endpoint:** `/assignments/:id/consolidated` *(donde `:id` es el ID de la vinculación)*
  - **Descripción:** Resumen acumulado de todas las semanas del espacio: balance de horas, porcentaje de cumplimiento, desglose semanal y semanas sin reporte.
  - **Respuesta:** `200 OK`

### 4.4. Generación de Reportes con IA
- **Disparar generación de reportes por lote:**
  - **Método:** `POST`
  - **Endpoint:** `/reports/batch`
  - **Descripción:** Encola la generación asíncrona de reportes en PDF mediante IA para todos sus estudiantes en una semana cerrada.
  - **Body:** `{ "week": "AAAA-Www" }`
  - **Respuesta:** `202 Accepted` (ID de lote y estado inicial `PENDIENTE`)
- **Consultar estado del lote:**
  - **Método:** `GET`
  - **Endpoint:** `/reports/batch/:id`
  - **Descripción:** Permite hacer seguimiento del progreso (`PENDIENTE`, `COMPLETADO`, etc.) de cada reporte del lote.
  - **Respuesta:** `200 OK`
- **Listar reportes propios disponibles:**
  - **Método:** `GET`
  - **Endpoint:** `/reports`
  - **Query Params:** `?week=AAAA-Www` (obligatorio), `?person_id={id}` (opcional). *(El filtro de profesor se aplica automáticamente al usuario en sesión).*
  - **Respuesta:** `200 OK`
- **Descargar reporte individual en PDF:**
  - **Método:** `GET`
  - **Endpoint:** `/reports/:id/download`
  - **Respuesta:** `200 OK` (`Content-Type: application/pdf`)
- **Descargar paquete ZIP del lote:**
  - **Método:** `GET`
  - **Endpoint:** `/reports/batch/:id/download`
  - **Respuesta:** `200 OK` (`Content-Type: application/zip`)

---

## 5. Rol: Monitor y Asistente Graduado (`operational`)

El monitor o asistente consulta sus asignaciones y registra semanalmente su trabajo.

### 5.1. Vista Principal y Espacios
- **Listar mis cursos y proyectos asignados:**
  - **Método:** `GET`
  - **Endpoint:** `/workspaces`
  - **Descripción:** Muestra los cursos y proyectos donde el estudiante tiene una vinculación activa o cerrada, con rol asignado, horas contratadas y datos de contacto del profesor.
  - **Respuesta:** `200 OK`

### 5.2. Gestión de Tareas Semanales
- **Registrar tarea semanal:**
  - **Método:** `POST`
  - **Endpoint:** `/tasks`
  - **Descripción:** Registra una actividad realizada. Si la semana enviada ya concluyó (lunes a domingo transcurrido), el backend la marca automáticamente como reporte tardío (`is_late_report: true`). No se admiten semanas futuras ni horas fraccionadas (deben ser enteras).
  - **Body:**
    ```json
    {
      "assignment_id": 1,
      "week": "2026-W42",
      "title": "Calificación Taller 1",
      "description": "Revisión de entregas de 25 estudiantes",
      "status": "FINALIZADA",
      "observations": "Se publicaron notas en el LMS",
      "hours_spent": 4,
      "attachments": [
        { "name": "calificaciones.pdf", "url": "https://..." }
      ]
    }
    ```
  - **Respuesta:** `201 Created`
- **Listar mis tareas:**
  - **Método:** `GET`
  - **Endpoint:** `/tasks`
  - **Descripción:** Lista las tareas registradas para una vinculación y semana determinada.
  - **Query Params:** `?assignment_id={id}` (obligatorio), `?week=AAAA-Www` (opcional; por defecto la semana activa).
  - **Respuesta:** `200 OK`
- **Actualizar tarea:**
  - **Método:** `PUT`
  - **Endpoint:** `/tasks/:id`
  - **Descripción:** Modifica una tarea. **Regla clave:** Solo se permite si la semana sigue activa y el espacio no está cerrado. Tareas marcadas como reporte tardío (`late_report`) son inmutables.
  - **Body:** Campos editables (`title`, `description`, `status`, `observations`, `hours_spent`, `attachments`). Los campos `assignment_id` y `week` son inmutables.
  - **Respuesta:** `200 OK`
- **Eliminar tarea:**
  - **Método:** `DELETE`
  - **Endpoint:** `/tasks/:id`
  - **Descripción:** Elimina una tarea. Solo se permite durante la semana activa y en espacios abiertos; prohibido en reportes tardíos.
  - **Respuesta:** `200 OK`

### 5.3. Historial de Registros
- **Consultar historial semanal propio:**
  - **Método:** `GET`
  - **Endpoint:** `/tasks/history`
  - **Descripción:** Proporciona un desglose semana a semana del trabajo registrado para una vinculación, indicando horas acumuladas, cantidad de tareas, estado derivado (`REPORTED` o `NO_REPORT`) y si contiene reportes tardíos.
  - **Query Params:** `?assignment_id={id}` (obligatorio), `?start_week=AAAA-Www` (opcional), `?end_week=AAAA-Www` (opcional).
  - **Respuesta:** `200 OK`

---

## 6. Matriz de Permisos por Endpoint (Guía para Route Guards del Frontend)

| Endpoint | Método | `admin` | `professor` | `operational` |
| :--- | :---: | :---: | :---: | :---: |
| `/auth/login` | `POST` | Público | Público | Público |
| `/auth/logout` | `POST` | Sí | Sí | Sí |
| `/users` y `/users/:id` | `GET` / `POST` | Sí | No | No |
| `/periods` | `POST` | Sí | No | No |
| `/periods` | `GET` | Sí (Todos) | Sí (Activos) | Sí (Activos) |
| `/workspaces` (Creación) | `POST` | No | Sí | No |
| `/workspaces` (Mis espacios) | `GET` | No | Sí (Propios) | Sí (Asignados) |
| `/workspaces/:id` | `GET` | Sí | Sí (Propios) | No |
| `/workspaces/:id/close` | `PATCH` | No | Sí | No |
| `/assignments` (Crear vinculación) | `POST` | No | Sí | No |
| `/assignments` (Listado principal) | `GET` | No | Sí | No |
| `/assignments/:id` (Detalle persona) | `GET` | No | Sí | No |
| `/assignments/:id/weekly` | `GET` | Sí | Sí (A cargo) | No |
| `/assignments/:id/consolidated` | `GET` | Sí | Sí (A cargo) | No |
| `/admin/workspaces` | `GET` | Sí | No | No |
| `/admin/workspaces/:wId/assignments` | `GET` | Sí | No | No |
| `/admin/workspaces/:wId/tasks` | `GET` | Sí | No | No |
| `/admin/assignments/:id` | `GET` / `PUT` | Sí | No | No |
| `/tasks` | `POST` | No | No | Sí |
| `/tasks` | `GET` | No | No | Sí (Propias) |
| `/tasks/:id` | `PUT` / `DELETE` | No | No | Sí (Semana activa) |
| `/tasks/history` | `GET` | No | No | Sí (Propias) |
| `/reports/batch` | `POST` | No | Sí | No |
| `/reports/batch/:id` | `GET` | No | Sí | No |
| `/reports` | `GET` | Sí (Global) | Sí (Propios) | No |
| `/reports/:id/download` | `GET` | Sí | Sí (Propios) | No |
| `/reports/batch/:id/download` | `GET` | Sí | Sí (Propios) | No |

---

## 7. Consideraciones Clave para la UI/UX del Frontend

1. **Gestión de semanas (Lunes a Domingo):**
   - El frontend debe formatear y calcular semanas según el estándar ISO 8601 (`AAAA-Www`).
   - Al registrar una tarea en una semana pasada, advertir al usuario en la UI que quedará bloqueada como **reporte tardío**.
2. **Edición condicionada de tareas:**
   - La interfaz debe deshabilitar los botones de edición y eliminación si la tarea pertenece a una semana cerrada o si tiene la marca `is_late_report = true`.
3. **Manejo del estado derivado "Sin reporte" (`NO_REPORT`):**
   - En las vistas de profesor y en el historial de tareas, las semanas transcurridas sin registros deben resaltarse visualmente como **Sin reporte**.
4. **Validaciones en formularios de horas:**
   - El campo de tiempo invertido en tareas solo debe admitir enteros positivos (no decimales).
5. **Descarga de archivos:**
   - Las rutas de descarga (`/reports/:id/download` y `/reports/batch/:id/download`) entregan flujos binarios con cabecera `Content-Disposition`. Deben gestionarse mediante Blob/ObjectURL en el navegador.

