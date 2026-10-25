# Acciones y Vistas por Rol (actions_by_role.md)
## Sistema de Gestión y Reporte de Actividades

Este documento define la matriz de accesos, vistas principales (Home diferenciado) y acciones permitidas para cada uno de los 3 perfiles del sistema.

---

## 1. Matriz General de Roles

| Rol en Sistema (`role`) | Descripción | Home Inicial al Autenticarse |
| :--- | :--- | :--- |
| **`admin`** | Administrador del sistema | Dashboard / Home de Administrador (`/admin/dashboard`) |
| **`professor`** | Docente responsable | Panel de Supervisión de Monitores y Asistentes (`/professor/assignments`) |
| **`operational`** | Monitor o Asistente Graduado | Panel de Cursos Asignados y Registro de Tareas (`/operational/workspaces`) |

---

## 2. Detalle de Funcionalidades y Acciones por Perfil

### 2.1. Perfil Administrador (`admin`)
Para el alcance actual del proyecto, el usuario administrador **no tiene operaciones activas ni módulos de gestión/auditoría**:

- **Home de Administrador:** Vista de bienvenida / Dashboard informativo (`/admin/dashboard`).
- **Acciones Disponibles:**
  - Iniciar sesión con sus credenciales locales (`POST /auth/login`).
  - Visualizar su información de usuario, rol activo y estado de sesión.
  - Cerrar sesión (`POST /auth/logout`).
  *(No implementar módulos de usuarios, períodos, auditoría ni rectificación de horas para este alcance).*

---

### 2.2. Perfil Profesor (`professor`)
El usuario docente visualiza un Home enfocado en el seguimiento directo de su equipo de apoyo:

- **Home de Profesor:** Listado consolidado de personas a cargo para la semana activa.
- **Acciones Disponibles (Funcionalidad 2):**
  1. **Listado de Personas a Cargo:**
     - Consultar el listado de todos los monitores y asistentes graduados vinculados a sus cursos y proyectos (`GET /assignments`).
     - Ver en la tabla: Nombre de la persona, curso/proyecto asignado, rol (`MONITOR` o `GRADUATE_ASSISTANT`), y horas contratadas vs reportadas en la semana.
  2. **Detalle Semanal de Trabajo:**
     - Acceder al detalle semanal de actividades de cada persona vinculada (`GET /assignments/:id/weekly`).
     - Distinguir claramente mediante badges semánticos quién ha reportado (`badge bg-success` - `REPORTED`) y quién no (`badge bg-danger` - `NO_REPORT`).
     - Visualizar el balance de horas (horas contratadas vs horas reportadas) y el listado de tareas detalladas.
  3. **Generación y Descarga de Reportes:**
     - Disparar la generación masiva de reportes de la semana en formato PDF con IA (`POST /reports/batch`).
     - Descargar el archivo PDF individual de cada reporte (`GET /reports/:id/download`) o el paquete ZIP completo (`GET /reports/batch/:id/download`).

---

### 2.3. Perfil Operacional: Monitor o Asistente Graduado (`operational`)
El usuario operativo dispone de una interfaz simple y enfocada en sus responsabilidades semanales:

- **Home Operacional:** Listado de cursos y proyectos en los que se encuentra vinculado.
- **Acciones Disponibles (Funcionalidad 3):**
  1. **Cursos y Proyectos Asignados:**
     - Consultar los espacios (cursos/proyectos) en los que participa actualmente (`GET /workspaces`).
     - Ver información del docente responsable, rol asignado (`MONITOR` o `GRADUATE_ASSISTANT`) y horas semanales contratadas.
  2. **Registro de Tareas Semanales:**
     - Formulario para registrar actividades realizadas (`POST /tasks`).
     - Campos requeridos: Vinculación (`assignment_id`), semana en formato ISO (`week: "YYYY-Www"`), título, descripción, estado (`FINALIZADA` / `PENDIENTE`), horas dedicadas (`hours_spent: integer > 0`), observaciones y adjuntos opcionales.
     - Indicador automático de reporte a tiempo o reporte tardío (`is_late_report`).
  3. **Historial de Registros:**
     - Consultar el histórico de tareas registradas filtradas por semana y espacio (`GET /tasks?assignment_id={id}&week={week}`).
     - Visualizar horas acumuladas y el detalle de cada tarea reportada.
