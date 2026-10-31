# Plan de Arquitectura y Diseño Técnico: MVP Frontend
## Sistema de Gestión y Reporte de Actividades

---

## 1. Introducción y Alineación Constitucional

El presente documento establece el plan de arquitectura, diseño de componentes, enrutamiento, servicios, decisiones técnicas y estrategia de pruebas para la implementación del **MVP Frontend**. Este diseño se fundamenta estrictamente en la especificación funcional (`specs/001-frontend-mvp/spec.md`), la guía de endpoints (`docs/FRONTEND_API_GUIDE.md`, `docs/ENDPOINTS_BACKEND.md`), la matriz de acciones por rol (`docs/ACTIONS_BY_ROLE.md`) y las directrices inmutables definidas en la constitución del proyecto (`docs/constitution.md`).

### 1.1. Matriz de Cumplimiento de Principios Constitucionales

| # | Principio Constitucional | Implementación en este Plan de Arquitectura |
|---|---|---|
| **1** | **Stack minimalista** | Uso exclusivo de Angular 17+ (Standalone Components), Bootstrap 5 (CSS utilitario, tarjetas, tablas y modales nativos) y `ngx-toastr`. Cero librerías de UI pesadas (sin Angular Material, PrimeNG, Tailwind ni NgRx). |
| **2** | **Cero estados de carga** | Prohibición absoluta de variables `loading`, `isLoading`, `isSubmitting`, spinners (`spinner-border`), skeletons o barras de progreso. Las llamadas HTTP resuelven y renderizan directamente el estado del DOM. |
| **3** | **Fidelidad a la especificación** | Nombres de campos de API, parámetros de consulta (`query params`), códigos de respuesta y DTOs mapeados con precisión milimétrica a `FRONTEND_API_GUIDE.md`. |
| **4** | **Separación lógica/vista** | Componentes delgados orientados exclusivamente a la presentación visual. Toda interacción HTTP, transformación de datos y manejo de sesión se delega en servicios de Angular. |
| **5** | **Manejo centralizado de errores** | Todo error HTTP (4xx / 5xx) o de red es interceptado de manera global por `error.interceptor.ts`, notificando al usuario mediante `ToastrService` (`toastr.error(...)`). Cero alertas intrusivas en el DOM o banners de error salvo validaciones nativas de formulario. |
| **6** | **Bilingüismo normativo** | Código fuente, nombres de variables, métodos, clases, interfaces, rutas y comentarios en **inglés**. Interfaz gráfica, etiquetas de formularios, textos visibles y mensajes de notificación emergente al usuario en **español**. |
| **7** | **Política de pruebas** | Cobertura de pruebas unitarias directas y sin sobre-ingeniería para cada servicio HTTP, Route Guard, interceptor, pipe y componente principal utilizando Jasmine y `HttpTestingController`. |
| **8** | **Claridad para juniors** | Arquitectura plana, jerarquía de carpetas legible, tipado explícito en TypeScript, flujos de datos unidireccionales y eliminación de abstracciones prematuras. |

---

## 2. Estructura del Proyecto Orientada por Rol y Feature

La estructura de carpetas de la aplicación se organiza bajo el principio de diseño modular por rol y funcionalidad (*role-and-feature-based*), manteniendo una jerarquía limpia y plana:

```text
src/
├── app/
│   ├── core/                                   # Elementos transversales de infraestructura singleton
│   │   ├── guards/
│   │   │   ├── auth.guard.ts                   # Protección de sesión activa [RF-01, RF-04]
│   │   │   ├── role.guard.ts                   # Control de acceso por rol [RF-02, RF-04]
│   │   │   ├── auth.guard.spec.ts
│   │   │   └── role.guard.spec.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts             # Inyección de Bearer Token [RF-01, RF-04]
│   │   │   ├── error.interceptor.ts            # Captura global de errores HTTP + Toastr [RF-01, RF-03, RF-04, RF-09]
│   │   │   ├── auth.interceptor.spec.ts
│   │   │   └── error.interceptor.spec.ts
│   │   ├── models/                             # Modelos e interfaces TypeScript del dominio
│   │   │   ├── auth.model.ts                   # Credenciales, Token y Sesión [RF-01, RF-03]
│   │   │   ├── user.model.ts                   # Entidad Usuario y Roles de Sistema [RF-01, RF-05]
│   │   │   ├── period.model.ts                 # Períodos académicos [Soporte transversal]
│   │   │   ├── workspace.model.ts              # Cursos y Proyectos [RF-06, RF-10]
│   │   │   ├── assignment.model.ts             # Vinculaciones operativas y balances [RF-06, RF-07, RF-08, RF-10]
│   │   │   ├── task.model.ts                   # Tareas, estados y reportes semanales [RF-07, RF-11, RF-12, RF-13]
│   │   │   └── report.model.ts                 # Lotes y reportes PDF [RF-09]
│   │   └── services/                           # Servicios HTTP que encapsulan la API
│   │       ├── auth.service.ts                 # Autenticación y sesión [RF-01, RF-02, RF-03, RF-04, RF-05]
│   │       ├── assignment.service.ts           # Supervisión del docente [RF-06, RF-07, RF-08]
│   │       ├── workspace.service.ts            # Espacios del rol operacional [RF-10]
│   │       ├── task.service.ts                 # CRUD e historial de tareas [RF-07, RF-11, RF-12, RF-13]
│   │       ├── report.service.ts               # Reportes IA y descargas binarias [RF-09]
│   │       ├── auth.service.spec.ts
│   │       ├── assignment.service.spec.ts
│   │       ├── workspace.service.spec.ts
│   │       ├── task.service.spec.ts
│   │       └── report.service.spec.ts
│   ├── features/                               # Vistas y componentes funcionales clasificados por rol
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts          # Pantalla de inicio de sesión [RF-01, RF-02]
│   │   │   │   ├── login.component.html
│   │   │   │   ├── login.component.scss
│   │   │   │   └── login.component.spec.ts
│   │   │   └── unauthorized/
│   │   │       ├── unauthorized.component.ts   # Pantalla intermedia de acceso no autorizado [RF-04]
│   │   │       ├── unauthorized.component.html
│   │   │       └── unauthorized.component.spec.ts
│   │   ├── admin/
│   │   │   └── dashboard/
│   │   │       ├── admin-dashboard.component.ts # Home informativo minimalista del Administrador [RF-02, RF-05]
│   │   │       ├── admin-dashboard.component.html
│   │   │       └── admin-dashboard.component.spec.ts
│   │   ├── professor/
│   │   │   ├── assignments/
│   │   │   │   ├── professor-assignments.component.ts # Home Docente: Personas a cargo [RF-02, RF-06]
│   │   │   │   ├── professor-assignments.component.html
│   │   │   │   └── professor-assignments.component.spec.ts
│   │   │   ├── weekly-detail/
│   │   │   │   ├── professor-weekly-detail.component.ts # Detalle semanal de trabajo de estudiante [RF-07]
│   │   │   │   ├── professor-weekly-detail.component.html
│   │   │   │   └── professor-weekly-detail.component.spec.ts
│   │   │   ├── consolidated-detail/
│   │   │   │   ├── professor-consolidated-detail.component.ts # Consolidado acumulado [RF-08]
│   │   │   │   ├── professor-consolidated-detail.component.html
│   │   │   │   └── professor-consolidated-detail.component.spec.ts
│   │   │   └── reports/
│   │   │       ├── professor-reports.component.ts # Generación y descarga de reportes PDF/ZIP [RF-09]
│   │   │       ├── professor-reports.component.html
│   │   │       └── professor-reports.component.spec.ts
│   │   └── operational/
│   │       ├── workspaces/
│   │       │   ├── operational-workspaces.component.ts # Home Operacional: Cursos y proyectos [RF-02, RF-10]
│   │       │   ├── operational-workspaces.component.html
│   │       │   └── operational-workspaces.component.spec.ts
│   │       ├── tasks/
│   │       │   ├── operational-tasks.component.ts # CRUD de tareas y modal de registro [RF-11, RF-12]
│   │       │   ├── operational-tasks.component.html
│   │       │   └── operational-tasks.component.spec.ts
│   │       └── history/
│   │           ├── operational-history.component.ts # Historial semanal detallado [RF-13]
│   │           ├── operational-history.component.html
│   │           └── operational-history.component.spec.ts
│   ├── shared/                                 # Componentes y pipes reutilizables
│   │   ├── components/
│   │   │   ├── navbar/
│   │   │   │   ├── navbar.component.ts         # Encabezado con datos de sesión y logout [RF-01, RF-03, RF-05]
│   │   │   │   ├── navbar.component.html
│   │   │   │   └── navbar.component.spec.ts
│   │   │   └── empty-state/
│   │   │       ├── empty-state.component.ts    # Presentación limpia de estados vacíos [RF-06, RF-10, RF-13]
│   │   │       ├── empty-state.component.html
│   │   │       └── empty-state.component.spec.ts
│   │   └── pipes/
│   │       ├── iso-week.pipe.ts                # Formateador legible para AAAA-Www [RNF-05]
│   │       └── iso-week.pipe.spec.ts
│   ├── app.component.ts                        # Contenedor raíz con router-outlet y navbar condicional
│   ├── app.component.html
│   ├── app.config.ts                           # Proveedores globales (HttpClient, Interceptors, Router, Toastr)
│   └── app.routes.ts                           # Configuración declarativa de rutas y guards
└── environments/
    ├── environment.ts                          # Variables de entorno (apiUrl: '/api/v1')
    └── environment.prod.ts
```

---

## 3. Estructura de Componentes, Rutas y Servicios

### 3.1. Matriz de Rutas y Route Guards

| Ruta | Componente | Guards de Protección | Roles Permitidos | Requisitos Funcionales Cubiertos |
|---|---|---|:---:|:---:|
| `/login` | `LoginComponent` | Ninguno (Ruta Pública) | Todos | **RF-01**, **RF-02** |
| `/unauthorized` | `UnauthorizedComponent` | `AuthGuard` | Todos (Autenticados) | **RF-04** (EARS-04.2) |
| `/admin/dashboard` | `AdminDashboardComponent` | `AuthGuard`, `RoleGuard` | `admin` | **RF-02**, **RF-05** |
| `/professor/assignments` | `ProfessorAssignmentsComponent` | `AuthGuard`, `RoleGuard` | `professor` | **RF-02**, **RF-06** |
| `/professor/assignments/:id/weekly` | `ProfessorWeeklyDetailComponent` | `AuthGuard`, `RoleGuard` | `professor` | **RF-07** |
| `/professor/assignments/:id/consolidated` | `ProfessorConsolidatedDetailComponent` | `AuthGuard`, `RoleGuard` | `professor` | **RF-08** |
| `/professor/reports` | `ProfessorReportsComponent` | `AuthGuard`, `RoleGuard` | `professor` | **RF-09** |
| `/operational/workspaces` | `OperationalWorkspacesComponent` | `AuthGuard`, `RoleGuard` | `operational` | **RF-02**, **RF-10** |
| `/operational/workspaces/:assignmentId/tasks` | `OperationalTasksComponent` | `AuthGuard`, `RoleGuard` | `operational` | **RF-11**, **RF-12** |
| `/operational/workspaces/:assignmentId/history` | `OperationalHistoryComponent` | `AuthGuard`, `RoleGuard` | `operational` | **RF-13** |
| `''` (Ruta raíz) | Redirección calculada según rol activo mediante callback/guard | `AuthGuard` | Todos | **RF-02** |
| `**` (Ruta no encontrada) | Redirección a `/login` si es anónimo o al panel de su rol si está autenticado | Ninguno | Todos | **RF-04** |

---

### 3.2. Detalle de Componentes

#### 3.2.1. `LoginComponent` (`features/auth/login`)
- **Propósito:** Proveer el formulario de acceso mediante correo electrónico y contraseña.
- **RF Cubiertos:** **RF-01** (Autenticación Local), **RF-02** (Enrutamiento Inicial por Rol).
- **Entradas / Salidas:** Ninguna (Componente de página).
- **Estado Local:** `loginForm: FormGroup` (campos `email` con validador de email y `password` con validador de requerido).
- **Comportamiento Clave:**
  - Al enviar: valida formulario; si es inválido, marca campos como tocados (`markAllAsTouched()`) activando clases visuales `is-invalid` de Bootstrap sin realizar petición HTTP (EARS-01.3).
  - Si es válido: invoca `authService.login(credentials)`. En `next`, redirige al usuario según su rol mediante `authService.redirectByRole(user.role)` (EARS-01.1, EARS-02.1, EARS-02.2, EARS-02.3).
  - Si las credenciales fallan: el `error.interceptor` captura el 401 y muestra `toastr.error('Credenciales incorrectas')`, manteniendo al usuario en la vista (EARS-01.2).
  - **Sin variables de carga (`loading`)**.

#### 3.2.2. `UnauthorizedComponent` (`features/auth/unauthorized`)
- **Propósito:** Pantalla intermedia amigable cuando un usuario autenticado intenta acceder a una sección restringida para su rol.
- **RF Cubiertos:** **RF-04** (Protección de Rutas y Control de Expiración - EARS-04.2).
- **Comportamiento Clave:** Muestra mensaje explicativo en español: *"Acceso No Autorizado: No dispones de los permisos requeridos para ingresar a esta sección."* y un botón primario *"Regresar a mi Panel Principal"* que ejecuta `authService.redirectByRole()`.

#### 3.2.3. `AdminDashboardComponent` (`features/admin/dashboard`)
- **Propósito:** Panel informativo minimalista para el Administrador del Sistema.
- **RF Cubiertos:** **RF-02** (Home Admin), **RF-05** (Panel de Inicio del Administrador).
- **Estado Local:** `currentUser: User | null` obtenido directamente desde `authService.getCurrentUser()`.
- **Comportamiento Clave:** Renderiza una tarjeta Bootstrap (`card shadow-sm border-0`) presentando nombre completo, correo institucional, rol activo (`admin`) y estado de la sesión (`Activa`). Excluye expresamente cualquier control operativo o botón de gestión (EARS-05.1, EARS-05.2).

#### 3.2.4. `ProfessorAssignmentsComponent` (`features/professor/assignments`)
- **Propósito:** Home principal del docente. Supervisión en tiempo real de su equipo de apoyo para la semana activa.
- **RF Cubiertos:** **RF-02** (Home Profesor), **RF-06** (Consulta de Personas Vinculadas a Cargo).
- **Estado Local:** `assignments: AssignmentSummary[] = []`, `currentWeek: string = ''`.
- **Comportamiento Clave:**
  - En `ngOnInit`: llama a `assignmentService.getAssignments()`. Al resolver, actualiza `assignments` y `currentWeek`.
  - Renderiza una tabla con columnas: Persona, Curso/Proyecto, Rol (`Monitor` o `Asistente Graduado`), Horas Contratadas vs Reportadas, Estado del Reporte (Badge verde `bg-success` *"Reportado"* si tiene tareas, Badge rojo `bg-danger` *"Sin reporte"* si tiene 0 horas/sin tareas) (EARS-06.1, EARS-06.2, EARS-06.3).
  - Si no existen vinculaciones registradas, muestra el componente `<app-empty-state>` con el mensaje *"No cuentas con monitores o asistentes vinculados a tus espacios académicos."* (EARS-06.4).
  - Botones de acción por fila: *"Ver Detalle Semanal"* (navega a `/professor/assignments/:id/weekly`) y *"Ver Histórico"* (navega a `/professor/assignments/:id/consolidated`).

#### 3.2.5. `ProfessorWeeklyDetailComponent` (`features/professor/weekly-detail`)
- **Propósito:** Desglose semanal de trabajo realizado por un estudiante vinculado.
- **RF Cubiertos:** **RF-07** (Detalle Semanal de Trabajo de una Persona Vinculada).
- **Estado Local:** `weeklyDetail: WeeklyWorkDetail | null = null`, `selectedWeek: string = ''`, `availableWeeks: string[] = []`.
- **Comportamiento Clave:**
  - Obtiene el parámetro de ruta `:id` (ID de la vinculación).
  - Llama a `assignmentService.getWeeklyDetail(assignmentId, selectedWeek)` (EARS-07.1).
  - Selector temporal de semanas: al cambiar de semana en el dropdown, recarga inmediatamente los datos llamando al servicio con `?week=AAAA-Www` (EARS-07.2).
  - Balance de horas: si `reported_hours > contracted_hours`, resalta un badge de advertencia `badge bg-warning text-dark` con *"Sobrecumplimiento: X horas adicionales"* (EARS-07.3).
  - Lista de tareas: tabla con Título, Descripción, Horas invertidas, Estado (Badge `FINALIZADA` verde o `PENDIENTE` amarillo), Observaciones y Badge *"Tardío"* si `is_late_report` es verdadero (EARS-07.4).

#### 3.2.6. `ProfessorConsolidatedDetailComponent` (`features/professor/consolidated-detail`)
- **Propósito:** Resumen acumulado de desempeño a lo largo del período académico.
- **RF Cubiertos:** **RF-08** (Consolidado Histórico Acumulado de la Vinculación).
- **Estado Local:** `consolidated: ConsolidatedSummary | null = null`.
- **Comportamiento Clave:**
  - Llama a `assignmentService.getConsolidatedDetail(assignmentId)` (EARS-08.1).
  - Muestra tarjetas de resumen: Total de horas reportadas vs contratadas acumuladas, Porcentaje de cumplimiento global, Cantidad de semanas sin reporte.
  - Tabla cronológica semana a semana: las semanas transcurridas sin reporte de tareas se destacan visualmente con badge `badge bg-danger` *"Sin reporte"* (EARS-08.2).

#### 3.2.7. `ProfessorReportsComponent` (`features/professor/reports`)
- **Propósito:** Generación asíncrona de reportes PDF por lote y descarga de archivos individuales o comprimidos en ZIP.
- **RF Cubiertos:** **RF-09** (Generación y Descarga de Reportes en PDF).
- **Estado Local:** `closedWeeks: string[] = []`, `selectedWeek: string = ''`, `reports: ReportSummary[] = []`.
- **Comportamiento Clave:**
  - Selector de semanas: lista únicamente **semanas cerradas** (concluidas) del período académico (EARS-09.1).
  - Validación de estado: si la semana seleccionada es la semana en curso o futura, el botón *"Generar Reportes por Lote"* permanece deshabilitado (`disabled`) (EARS-09.2).
  - Disparo de lote: al pulsar el botón, llama a `reportService.triggerBatchReport(selectedWeek)`. Al resolver `202 Accepted`, emite `toastr.success('La generación del lote de reportes ha sido iniciada exitosamente.')` (EARS-09.3).
  - Descarga individual: botón *"Descargar PDF"* por estudiante que invoca `reportService.downloadReportPdf(reportId)` recibiendo un `Blob` y forzando la descarga transparente sin recargar la página (EARS-09.4, RNF-06).
  - Descarga global: botón *"Descargar Lote (ZIP)"* que invoca `reportService.downloadBatchZip(batchId)` (EARS-09.5).
  - Errores de generación o descarga son capturados por el interceptor y mostrados vía Toastr manteniendo la pantalla activa (EARS-09.6).

#### 3.2.8. `OperationalWorkspacesComponent` (`features/operational/workspaces`)
- **Propósito:** Home del usuario operativo (Monitor / Asistente Graduado). Consulta de espacios asignados.
- **RF Cubiertos:** **RF-02** (Home Operacional), **RF-10** (Consulta de Espacios de Trabajo Asignados).
- **Estado Local:** `workspaces: OperationalWorkspace[] = []`.
- **Comportamiento Clave:**
  - En `ngOnInit`: llama a `workspaceService.getMyWorkspaces()`.
  - Renderiza tarjetas o tabla con: Nombre del curso/proyecto, Docente responsable, Rol asignado (`MONITOR` o `GRADUATE_ASSISTANT`), Horas semanales contratadas y Estado (`ACTIVO` - badge verde o `CERRADO` - badge secundario) (EARS-10.1).
  - Si no tiene cursos vinculados, renderiza `<app-empty-state>` con *"No tienes cursos ni proyectos asignados en el período actual."* (EARS-10.2).
  - Botones de acción por espacio: *"Gestionar Tareas"* (navega a `/operational/workspaces/:assignmentId/tasks`) e *"Historial"* (navega a `/operational/workspaces/:assignmentId/history`).

#### 3.2.9. `OperationalTasksComponent` (`features/operational/tasks`)
- **Propósito:** Registro, edición y eliminación de tareas semanales para la vinculación activa.
- **RF Cubiertos:** **RF-11** (Registro de Tareas Semanales), **RF-12** (Edición y Eliminación de Tareas).
- **Estado Local:** `tasks: Task[] = []`, `assignment: OperationalWorkspace | null = null`, `taskForm: FormGroup`, `isEditing: boolean = false`, `editingTaskId: number | null = null`, `isLateReportWarning: boolean = false`, `currentIsoWeek: string = ''`.
- **Comportamiento Clave:**
  - Formulario de Registro (Modal o tarjeta colapsable): campos de Espacio asociado (fijo/solo lectura), Semana (`week: string`), Título (`title`), Descripción (`description`), Estado (`status`: `FINALIZADA` o `PENDIENTE`), Horas invertidas (`hours_spent: integer > 0`), Observaciones (`observations`) (EARS-11.1). Sin campo de adjuntos (EARS-11.2).
  - Restricción de semanas futuras: el selector de semanas bloquea valores posteriores a la semana actual (EARS-11.3).
  - Advertencia reactiva de reporte tardío: cuando el control `week` cambia a una semana pasada concluida, se activa la alerta visual `isLateReportWarning = true` advirtiendo que la tarea quedará marcada como *"Reporte Tardío"* y será inmutable (EARS-11.4).
  - Validación de horas enteras: el validador síncrono rechaza decimales, ceros o valores negativos: `Validators.pattern('^[1-9][0-9]*$')` (EARS-11.7).
  - Creación exitosa: `taskService.createTask(payload)`. Emite `toastr.success('Tarea registrada exitosamente.')`, resetea el formulario y recarga la lista de inmediato (EARS-11.5).
  - Sobrecumplimiento de horas: permite registrar la tarea incluso si excede las horas contratadas, actualizando el balance visible (EARS-11.6).
  - Edición y Borrado condicionado: botones de editar y eliminar habilitados **únicamente** si: la tarea pertenece a la semana activa, el espacio está abierto y `is_late_report === false` (EARS-12.1). Si es tardía, semana concluida o espacio cerrado, los controles se ocultan o deshabilitan mostrando la tarea en modo solo lectura (EARS-12.2).
  - Confirmación de borrado: modal de confirmación antes de llamar a `taskService.deleteTask(id)` (EARS-12.3).
  - Éxito en borrado/actualización: emite `toastr.success(...)` y refresca el listado (EARS-12.4).

#### 3.2.10. `OperationalHistoryComponent` (`features/operational/history`)
- **Propósito:** Inspección cronológica del desempeño histórico semana a semana del estudiante operativo.
- **RF Cubiertos:** **RF-13** (Historial de Registros Semanales).
- **Estado Local:** `historyWeeks: WeeklyHistoryItem[] = []`, `expandedWeek: string | null = null`, `expandedWeekTasks: Task[] = []`.
- **Comportamiento Clave:**
  - Llama a `taskService.getTaskHistory(assignmentId)`.
  - Presenta tabla semana a semana con: Identificación de semana ISO (`AAAA-Www`), Horas acumuladas, Cantidad de tareas, Estado (`Reportado` o `Sin reporte`) y Badge de alerta si contiene reportes tardíos (EARS-13.1).
  - Acordeón o fila expandible: al hacer click en una semana, expande el listado de tareas registradas para esa semana específica (EARS-13.2).

#### 3.2.11. `NavbarComponent` (`shared/components/navbar`)
- **Propósito:** Barra superior persistente y limpia de la aplicación.
- **RF Cubiertos:** **RF-01**, **RF-03** (Cierre de Sesión Seguro), **RF-05** (Datos de Usuario).
- **Comportamiento Clave:**
  - Consume `authService.currentUser$` reactivamente.
  - Muestra nombre del usuario autenticado y su rol con formato amigable en español (*Administrador*, *Docente*, *Monitor / Asistente*).
  - Botón de cierre de sesión: llama a `authService.logout()`. Ejecuta `POST /auth/logout`, elimina sesión en el navegador, limpia `localStorage` y redirige a `/login` emitiendo `toastr.info('Has cerrado sesión correctamente.')` (EARS-03.1). Si hay fallo de red, fuerza igualmente la limpieza local y redirección (EARS-03.2).

---

### 3.3. Detalle de Servicios HTTP

Todos los servicios implementan inyección de dependencias moderna mediante `inject(HttpClient)` y retornan Observables fuertemente tipados. Los errores HTTP no se capturan localmente con callbacks `error:`; fluyen automáticamente hacia `error.interceptor.ts`.

#### 3.3.1. `AuthService` (`core/services/auth.service.ts`)
- **RF Cubiertos:** **RF-01**, **RF-02**, **RF-03**, **RF-04**, **RF-05**.
- **Endpoints Consumidos:**
  - `POST /auth/login` (Body: `{ email, password }` -> Retorna: `{ token, user: { id, nombre, email, role } }`)
  - `POST /auth/logout` (Header: `Bearer <token>` -> Retorna: `204 No Content`)
- **Métodos Públicos:**
  - `login(credentials: LoginRequest): Observable<LoginResponse>`: Almacena token y usuario en `localStorage`, actualiza el `BehaviorSubject<User | null>`.
  - `logout(): Observable<void>`: Dispara llamada al endpoint, limpia `localStorage`, emite `null` en el subject y redirige a `/login`.
  - `clearSession(): void`: Limpieza sincrónica del almacenamiento local y redirección a `/login` (utilizado ante 401 por el interceptor).
  - `getToken(): string | null`: Obtiene el token JWT/Bearer almacenado.
  - `getCurrentUser(): User | null`: Obtiene el usuario activo actual.
  - `isAuthenticated(): boolean`: Retorna `true` si existe un token vigente en almacenamiento.
  - `getRole(): UserRole | null`: Retorna el rol del usuario autenticado (`admin`, `professor`, `operational`).
  - `redirectByRole(role?: UserRole): void`: Centraliza la lógica de redirección inicial tras login o navegación a raíz:
    - `admin` -> `/admin/dashboard`
    - `professor` -> `/professor/assignments`
    - `operational` -> `/operational/workspaces`

#### 3.3.2. `AssignmentService` (`core/services/assignment.service.ts`)
- **RF Cubiertos:** **RF-06**, **RF-07**, **RF-08**.
- **Endpoints Consumidos:**
  - `GET /assignments` -> Lista consolidada de vinculaciones a cargo del profesor en la semana activa.
  - `GET /assignments/:id/weekly?week=AAAA-Www` -> Detalle semanal de tareas y balance de horas de una persona vinculada.
  - `GET /assignments/:id/consolidated` -> Consolidado histórico acumulado de horas y semanas sin reporte.
- **Métodos Públicos:**
  - `getAssignments(): Observable<AssignmentsResponse>`
  - `getWeeklyDetail(assignmentId: number, week?: string): Observable<WeeklyWorkDetail>`
  - `getConsolidatedDetail(assignmentId: number): Observable<ConsolidatedSummary>`

#### 3.3.3. `WorkspaceService` (`core/services/workspace.service.ts`)
- **RF Cubiertos:** **RF-10**.
- **Endpoints Consumidos:**
  - `GET /workspaces` -> Retorna los cursos y proyectos asignados al usuario operativo en sesión.
- **Métodos Públicos:**
  - `getMyWorkspaces(): Observable<OperationalWorkspace[]>`

#### 3.3.4. `TaskService` (`core/services/task.service.ts`)
- **RF Cubiertos:** **RF-07**, **RF-11**, **RF-12**, **RF-13**.
- **Endpoints Consumidos:**
  - `POST /tasks` -> Creación de tarea semanal. Body: `{ assignment_id, week, title, description, status, observations, hours_spent }`.
  - `GET /tasks?assignment_id={id}&week={week}` -> Lista de tareas para una asignación y semana específica.
  - `PUT /tasks/:id` -> Actualización de tarea elegible.
  - `DELETE /tasks/:id` -> Eliminación de tarea elegible.
  - `GET /tasks/history?assignment_id={id}` -> Historial acumulado semana a semana.
- **Métodos Públicos:**
  - `createTask(payload: CreateTaskRequest): Observable<Task>`
  - `getTasks(assignmentId: number, week?: string): Observable<Task[]>`
  - `updateTask(taskId: number, payload: UpdateTaskRequest): Observable<Task>`
  - `deleteTask(taskId: number): Observable<void>`
  - `getTaskHistory(assignmentId: number): Observable<WeeklyHistoryItem[]>`

#### 3.3.5. `ReportService` (`core/services/report.service.ts`)
- **RF Cubiertos:** **RF-09**, **RNF-06**.
- **Endpoints Consumidos:**
  - `POST /reports/batch` -> Dispara generación de reportes por lote para semana concluida (Body: `{ week: string }`). Retorna `202 Accepted`.
  - `GET /reports?week=AAAA-Www` -> Lista reportes disponibles de la semana.
  - `GET /reports/:id/download` -> Descarga individual de reporte PDF (`Content-Type: application/pdf`).
  - `GET /reports/batch/:id/download` -> Descarga de lote comprimido (`Content-Type: application/zip`).
- **Métodos Públicos:**
  - `triggerBatchReport(week: string): Observable<BatchReportResponse>`
  - `getReports(week: string): Observable<ReportSummary[]>`
  - `downloadReportPdf(reportId: number, filename?: string): Observable<Blob>`: Solicita el recurso con `responseType: 'blob'` y ejecuta el helper de descarga en el navegador.
  - `downloadBatchZip(batchId: number, filename?: string): Observable<Blob>`: Solicita el archivo ZIP como `Blob` y ejecuta el helper de guardado.

---

### 3.4. Detalle de Guards e Interceptores

#### 3.4.1. `AuthGuard` (`core/guards/auth.guard.ts`)
- **RF Cubiertos:** **RF-01**, **RF-04** (EARS-04.1).
- **Lógica:** Implementado como `CanActivateFn`. Inyecta `AuthService` y `Router`. Verifica si `authService.isAuthenticated()` es verdadero.
- **Flujo:**
  - Si está autenticado: retorna `true`.
  - Si no está autenticado: redirige a `/login` y retorna `false`.

#### 3.4.2. `RoleGuard` (`core/guards/role.guard.ts`)
- **RF Cubiertos:** **RF-02**, **RF-04** (EARS-04.2).
- **Lógica:** Implementado como `CanActivateFn`. Lee el arreglo de roles permitidos desde `route.data['roles']`. Compara con `authService.getRole()`.
- **Flujo:**
  - Si el rol del usuario está incluido en los roles permitidos: retorna `true`.
  - Si el rol no coincide: redirige a `/unauthorized` y retorna `false`.

#### 3.4.3. `AuthInterceptor` (`core/interceptors/auth.interceptor.ts`)
- **RF Cubiertos:** **RF-01**, **RF-04**.
- **Lógica:** Implementado como `HttpInterceptorFn`. Inyecta `AuthService`.
- **Flujo:** Extrae el token mediante `authService.getToken()`. Si existe, clona la solicitud HTTP agregando el encabezado `Authorization: Bearer <token>`. Si no existe token, deja fluir la solicitud intacta (ej. `/auth/login`).

#### 3.4.4. `ErrorInterceptor` (`core/interceptors/error.interceptor.ts`)
- **RF Cubiertos:** **RF-01**, **RF-03**, **RF-04** (EARS-04.3), **RF-09** (EARS-09.6), **RNF-02**.
- **Lógica:** Implementado como `HttpInterceptorFn`. Inyecta `ToastrService`, `AuthService` y `Router`.
- **Flujo:**
  - Captura excepciones mediante el operador RxJS `catchError`.
  - **401 Unauthorized:** Limpia sesión local (`authService.clearSession()`), redirige a `/login` y emite `toastr.error('Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.', 'Sesión Expirada')`.
  - **403 Forbidden:** Emite `toastr.error('No dispones de permisos suficientes para realizar esta acción.', 'Acceso Denegado')`.
  - **404 Not Found:** Emite `toastr.error('El recurso solicitado no fue encontrado.', 'No Encontrado')`.
  - **400 / 422 Bad Request / Unprocessable:** Extrae mensaje de error enviado por el backend (`error.error.message` o `error.error`) y emite `toastr.error(mensaje, 'Error de Validación')`.
  - **500+ Internal Server Error:** Emite `toastr.error('Ocurrió un error interno en el servidor. Inténtalo de nuevo más tarde.', 'Error del Servidor')`.
  - **Error de red / Conectividad:** Emite `toastr.error('No se pudo establecer conexión con el servidor.', 'Error de Conexión')`.
  - Re-lanza el error con `throwError(() => error)` para que el flujo RxJS finalice limpiamente sin requerir manejo manual de alertas en los componentes.

---

## 4. Decisiones Técnicas Justificadas y Alternativas Descartadas

| Decisión Técnica Adoptada | Justificación Técnica | Alternativa Descartada | Justificación de Descarte | RF / RNF Relacionado |
|---|---|---|---|:---:|
| **1. Arquitectura Angular Standalone Components (Angular 17+)** | Elimina la sobrecarga de `NgModule`, reduce el tamaño de los bundles, facilita el *tree-shaking*, agiliza la configuración declarativa de rutas y simplifica la legibilidad para cualquier desarrollador. | Módulos tradicionales de Angular (`NgModules`) con módulos de enrutamiento separados. | Mayor boilerplate innecesario, configuración verbosa y arquitectura obsoleta desaconsejada en las versiones modernas de Angular. | **Todos los RF**, RNF-04 |
| **2. Bootstrap 5 Nativo con utilidades semánticas y CSS utilitario** | Cumple estrictamente con la Constitución (Principio 1). Provee un diseño limpio, profesional y consistente mediante tarjetas (`card`), tablas limpias (`table table-hover align-middle`), badges semánticos (`bg-success`, `bg-danger`, `bg-warning`) y modales sin agregar librerías externas. | Angular Material, PrimeNG, Tailwind CSS. | Violación flagrante de la Constitución (Principio 1). Introducen abstracciones complejas, dependencias pesadas, incompatibilidades de estilos y sobre-ingeniería en un MVP de alcance acotado. | **Todos los RF**, RNF-04 |
| **3. Cero Estados de Carga (Zero Loading State)** | Cumple con la regla constitucional inmutable 2 y RNF-01. Elimina variables redundantes (`loading`, `isLoading`, `isSubmitting`), previene condiciones de carrera en el estado de la UI y ofrece una interacción directa e inmediata. El DOM renderiza los datos tan pronto como el Observable resuelve. | Spinners giratorios de Bootstrap (`spinner-border`), esqueletos visuales (skeletons), librerías tipo `ngx-spinner`. | Prohibido expresamente por la Constitución del proyecto. Introduce sobre-diseño y complejidad innecesaria en la sincronización de estados reactivos. | **RNF-01**, RF-06 a RF-13 |
| **4. Manejo Global de Errores con `error.interceptor` y `ToastrService`** | Cumple con la Constitución (Principio 5) y RNF-02. Centraliza la captura de todos los fallos HTTP (4xx / 5xx) y de red en un único punto, garantizando mensajes amigables y no intrusivos al usuario sin ensuciar los componentes con bloques `try/catch` o callbacks de error. | Manejo local en cada componente mediante bloques `<div class="alert alert-danger">` en el template o modales emergentes de bloqueo. | Código duplicado (*anti-patrón DRY*), inconsistencia visual de mensajes de error y sobrecarga innecesaria en el estado y template de cada vista. | **RNF-02**, RF-01, RF-04, RF-09 |
| **5. Estado de Sesión en Servicio Reactivo Ligero (`BehaviorSubject`)** | Mantiene un flujo reactivo unidireccional y simple para la sesión y el usuario autenticado (`currentUser$`). Se sincroniza con `localStorage` de manera síncrona y transparente. Claridad absoluta para desarrolladores juniors. | Implementación de stores globales complejos como NgRx Store, NgRx ComponentStore o Akita. | Sobre-ingeniería desmedida. Para un MVP sin sincronización compleja en tiempo real ni múltiples fuentes de mutación, NgRx añade docenas de acciones, reducers, effects y selectores totalmente innecesarios. | **Principio 8**, RF-01 a RF-05 |
| **6. Formularios Reactivos (`ReactiveFormsModule`) para Entradas de Datos** | Ofrece validación síncrona fuertemente tipada, desacoplamiento entre validación y presentación, y capacidad de escuchar cambios de controles en tiempo real (ej. detectar selección de semana pasada para disparar la advertencia de reporte tardío en RF-11). Permite validar enteros positivos mediante `Validators.pattern('^[1-9][0-9]*$')`. | Formularios dirigidos por plantilla (*Template-Driven Forms* con `[(ngModel)]`). | Dificultad para pruebas unitarias de validación, lógica de negocio acoplada a la vista HTML y menor control sobre eventos reactivos de cambio de estado. | **RF-01**, **RF-11**, **RF-12** |
| **7. Descargas de Archivos Binarios mediante Flujo `Blob` y `URL.createObjectURL`** | Permite inyectar de manera segura el encabezado `Authorization: Bearer <token>` en las peticiones a `/reports/:id/download` y `/reports/batch/:id/download`, gestionando la descarga de forma transparente en el cliente (RNF-06). En caso de fallo (404/500), el error es atrapado por el interceptor sin desorientar al usuario ni abrir pestañas en blanco. | Abrir la URL directamente con `window.open(url)` o enlaces `<a href="...">`. | Los enlaces directos o `window.open` no permiten inyectar cabeceras HTTP de autorización Bearer de forma estándar, dejando expuesto el endpoint o requiriendo tokens en query strings (vulnerabilidad de seguridad). Además, si el backend falla, se abre una pestaña en blanco con un JSON de error. | **RF-09**, **RNF-06** |
| **8. Bilingüismo Normativo por Convención de Código** | Cumple con la Constitución (Principio 6) y RNF-03. Código, identificadores, DTOs, comentarios y commits en inglés; interfaces de usuario, etiquetas, mensajes de validación y toasts íntegramente en español. Implementado directamente en templates y constantes sin sobrecarga de librerías. | Librerías dinámicas de traducción como `@angular/localize` o `ngx-translate`. | Complejidad injustificada para un MVP que solo requiere soporte de interfaz en idioma español institucional. | **RNF-03**, Principio 6 |

---

## 5. Estrategia de Pruebas Unitarias

La política de pruebas se rige por el Principio 7 de la Constitución: *"Cada servicio y flujo principal debe contar con pruebas unitarias simples y directas"*. Las pruebas se implementarán en Jasmine/Karma utilizando el entorno moderno de pruebas de Angular (`provideHttpClientTesting`, `HttpTestingController`).

### 5.1. Pruebas de Servicios HTTP (`core/services`)

| Archivo de Prueba | Casos de Prueba Principales a Cubrir | RF / RNF Cubierto |
|---|---|:---:|
| `auth.service.spec.ts` | 1. `login`: emite petición `POST /auth/login`, persiste token y usuario en `localStorage`, actualiza `currentUser$`.<br>2. `logout`: emite `POST /auth/logout`, limpia `localStorage` y redirige a `/login`.<br>3. `clearSession`: limpia almacenamiento sincrónicamente.<br>4. `isAuthenticated` y `getRole`: validan correctamente estados según token en almacenamiento.<br>5. `redirectByRole`: navega a la ruta esperada para cada uno de los 3 roles. | **RF-01**, **RF-02**, **RF-03**, **RF-04**, **RF-05** |
| `assignment.service.spec.ts` | 1. `getAssignments`: emite `GET /assignments` y mapea lista de personas a cargo.<br>2. `getWeeklyDetail`: emite `GET /assignments/:id/weekly` con y sin query param `?week=`.<br>3. `getConsolidatedDetail`: emite `GET /assignments/:id/consolidated` y mapea resumen histórico. | **RF-06**, **RF-07**, **RF-08** |
| `workspace.service.spec.ts` | 1. `getMyWorkspaces`: emite `GET /workspaces` y retorna espacios asignados al monitor/asistente. | **RF-10** |
| `task.service.spec.ts` | 1. `createTask`: emite `POST /tasks` con payload completo de tarea.<br>2. `getTasks`: emite `GET /tasks` filtrando por `assignment_id` y `week`.<br>3. `updateTask`: emite `PUT /tasks/:id` con datos editados.<br>4. `deleteTask`: emite `DELETE /tasks/:id`.<br>5. `getTaskHistory`: emite `GET /tasks/history` con parámetro de vinculación. | **RF-07**, **RF-11**, **RF-12**, **RF-13** |
| `report.service.spec.ts` | 1. `triggerBatchReport`: emite `POST /reports/batch` con semana cerrada.<br>2. `getReports`: emite `GET /reports?week=`.<br>3. `downloadReportPdf`: emite `GET /reports/:id/download` con `responseType: 'blob'`.<br>4. `downloadBatchZip`: emite `GET /reports/batch/:id/download` con `responseType: 'blob'`. | **RF-09**, **RNF-06** |

### 5.2. Pruebas de Guards e Interceptores (`core/guards` y `core/interceptors`)

| Archivo de Prueba | Casos de Prueba Principales a Cubrir | RF / RNF Cubierto |
|---|---|:---:|
| `auth.guard.spec.ts` | 1. Permite navegación (`true`) si `authService.isAuthenticated()` retorna `true`.<br>2. Bloquea navegación (`false`) y redirige a `/login` si no hay sesión activa. | **RF-04** (EARS-04.1) |
| `role.guard.spec.ts` | 1. Permite navegación (`true`) si el rol del usuario coincide con los roles definidos en la ruta.<br>2. Bloquea navegación (`false`) y redirige a `/unauthorized` si el rol no tiene privilegios. | **RF-02**, **RF-04** (EARS-04.2) |
| `auth.interceptor.spec.ts` | 1. Agrega el encabezado `Authorization: Bearer <token>` cuando el token existe en sesión.<br>2. No altera los encabezados cuando el token es nulo (rutas públicas). | **RF-01**, **RF-04** |
| `error.interceptor.spec.ts` | 1. Captura error 401: invoca `authService.clearSession()`, redirige a `/login` y emite `toastr.error(...)`.<br>2. Captura error 403: emite `toastr.error('No dispones de permisos...')`.<br>3. Captura error 404: emite `toastr.error(...)`.<br>4. Captura error 500: emite `toastr.error('Error interno...')`.<br>5. Propaga el error hacia el suscriptor (`throwError`). | **RF-01**, **RF-03**, **RF-04**, **RF-09**, **RNF-02** |

### 5.3. Pruebas de Pipes y Utilidades (`shared/pipes`)

| Archivo de Prueba | Casos de Prueba Principales a Cubrir | RF / RNF Cubierto |
|---|---|:---:|
| `iso-week.pipe.spec.ts` | 1. Formatea una cadena ISO tipo `2026-W42` a formato legible en español (*"Semana 42, 2026"*).<br>2. Maneja valores nulos, vacíos o mal formateados retornando cadena vacía o valor original seguro. | **RNF-05**, **RF-07**, **RF-09**, **RF-13** |

### 5.4. Pruebas de Componentes Principales (`features/*`)

| Archivo de Prueba | Casos de Prueba Principales a Cubrir | RF Cubierto |
|---|---|:---:|
| `login.component.spec.ts` | 1. Inicializa formulario con campos vacíos e inválidos.<br>2. Previene envío y marca controles como inválidos si los campos están incompletos.<br>3. Llama a `authService.login` y ejecuta `redirectByRole` tras respuesta exitosa.<br>4. Mantiene al usuario en la vista si el servicio rechaza la solicitud. | **RF-01**, **RF-02** |
| `admin-dashboard.component.spec.ts` | 1. Renderiza los datos de sesión del usuario (nombre, correo, rol activo).<br>2. Verifica la ausencia estricta de botones de gestión académica o auditoría. | **RF-05** |
| `professor-assignments.component.spec.ts` | 1. Carga y despliega en tabla la lista de personas a cargo.<br>2. Renderiza badge verde *"Reportado"* para personas con horas reportadas.<br>3. Renderiza badge rojo *"Sin reporte"* para personas con 0 horas.<br>4. Muestra componente de estado vacío si la lista de asignaciones viene vacía. | **RF-06** |
| `professor-weekly-detail.component.spec.ts` | 1. Carga detalle semanal y lista de tareas.<br>2. Dispara recarga de datos al modificar el selector de semana.<br>3. Destaca badge de sobrecumplimiento cuando las horas reportadas superan las contratadas.<br>4. Muestra badge de *"Tardío"* en tareas marcadas con `is_late_report: true`. | **RF-07** |
| `professor-reports.component.spec.ts` | 1. Deshabilita el botón de generación de lote si se selecciona la semana activa o una semana futura.<br>2. Habilita botón de generación para semanas concluidas y emite llamada `triggerBatchReport`.<br>3. Invoca la descarga de archivo individual en PDF y lote comprimido en ZIP. | **RF-09** |
| `operational-workspaces.component.spec.ts` | 1. Lista cursos y proyectos asignados con su estado y profesor responsable.<br>2. Muestra mensaje de estado vacío si el estudiante no tiene vinculaciones activas. | **RF-10** |
| `operational-tasks.component.spec.ts` | 1. Valida que el campo de horas solo acepte enteros estrictamente mayores a cero.<br>2. Activa bandera de advertencia de reporte tardío al seleccionar una semana pasada en el formulario.<br>3. Bloquea botones de edición y eliminación si la tarea es un reporte tardío o si el curso está cerrado.<br>4. Permite edición y eliminación en tareas de semana activa en cursos abiertos. | **RF-11**, **RF-12** |
| `operational-history.component.spec.ts` | 1. Lista las semanas históricas con conteo de tareas, horas acumuladas y estado derivado.<br>2. Expande las tareas individuales al seleccionar una semana específica. | **RF-13** |

---

## 6. Matriz de Trazabilidad de Requisitos Funcionales y No Funcionales

A continuación se presenta la correlación exhaustiva entre cada requerimiento de la especificación y los artefactos de diseño arquitectónico que garantizan su cobertura integral:

| Código | Requisito Funcional / No Funcional | Componente(s) Responsable(s) | Servicio(s) / Interceptor / Guard | Archivos de Prueba Unitarios |
|:---:|---|---|---|---|
| **RF-01** | Autenticación Local de Usuarios | `LoginComponent`, `NavbarComponent` | `AuthService`, `AuthInterceptor`, `ErrorInterceptor` | `login.component.spec.ts`, `auth.service.spec.ts`, `auth.interceptor.spec.ts`, `error.interceptor.spec.ts` |
| **RF-02** | Enrutamiento Inicial Diferenciado por Rol | `LoginComponent`, `app.routes.ts` | `AuthService.redirectByRole()`, `RoleGuard` | `login.component.spec.ts`, `auth.service.spec.ts`, `role.guard.spec.ts` |
| **RF-03** | Cierre de Sesión Seguro | `NavbarComponent` | `AuthService.logout()`, `AuthService.clearSession()`, `ErrorInterceptor` | `navbar.component.spec.ts`, `auth.service.spec.ts`, `error.interceptor.spec.ts` |
| **RF-04** | Protección de Rutas y Control de Expiración | `UnauthorizedComponent`, `app.routes.ts` | `AuthGuard`, `RoleGuard`, `ErrorInterceptor` | `auth.guard.spec.ts`, `role.guard.spec.ts`, `error.interceptor.spec.ts`, `unauthorized.component.spec.ts` |
| **RF-05** | Panel de Inicio del Administrador | `AdminDashboardComponent`, `NavbarComponent` | `AuthService.getCurrentUser()` | `admin-dashboard.component.spec.ts`, `navbar.component.spec.ts` |
| **RF-06** | Consulta de Personas Vinculadas a Cargo | `ProfessorAssignmentsComponent`, `EmptyStateComponent` | `AssignmentService.getAssignments()` | `professor-assignments.component.spec.ts`, `assignment.service.spec.ts` |
| **RF-07** | Detalle Semanal de Trabajo de Persona Vinculada | `ProfessorWeeklyDetailComponent` | `AssignmentService.getWeeklyDetail()`, `IsoWeekPipe` | `professor-weekly-detail.component.spec.ts`, `assignment.service.spec.ts`, `iso-week.pipe.spec.ts` |
| **RF-08** | Consolidado Histórico Acumulado de Vinculación | `ProfessorConsolidatedDetailComponent` | `AssignmentService.getConsolidatedDetail()` | `professor-consolidated-detail.component.spec.ts`, `assignment.service.spec.ts` |
| **RF-09** | Generación y Descarga de Reportes en PDF | `ProfessorReportsComponent` | `ReportService`, `ErrorInterceptor` | `professor-reports.component.spec.ts`, `report.service.spec.ts`, `error.interceptor.spec.ts` |
| **RF-10** | Consulta de Espacios de Trabajo Asignados | `OperationalWorkspacesComponent`, `EmptyStateComponent` | `WorkspaceService.getMyWorkspaces()` | `operational-workspaces.component.spec.ts`, `workspace.service.spec.ts` |
| **RF-11** | Registro de Tareas Semanales | `OperationalTasksComponent` | `TaskService.createTask()`, `IsoWeekPipe` | `operational-tasks.component.spec.ts`, `task.service.spec.ts` |
| **RF-12** | Edición y Eliminación de Tareas | `OperationalTasksComponent` | `TaskService.updateTask()`, `TaskService.deleteTask()` | `operational-tasks.component.spec.ts`, `task.service.spec.ts` |
| **RF-13** | Historial de Registros Semanales | `OperationalHistoryComponent` | `TaskService.getTaskHistory()`, `IsoWeekPipe` | `operational-history.component.spec.ts`, `task.service.spec.ts`, `iso-week.pipe.spec.ts` |
| **RNF-01**| Cero estados de carga intrusivos | Todos los componentes de features | Arquitectura de suscripción directa sin banderas `isLoading` | Pruebas de componentes validan renderizado directo sin esperar desactivación de loaders |
| **RNF-02**| Notificación de errores centralizada vía Toastr | `ErrorInterceptor`, `ToastrService` | `ErrorInterceptor` | `error.interceptor.spec.ts` |
| **RNF-03**| Bilingüismo normativo | Todos los componentes y archivos TypeScript | Convención de nombres en inglés y textos UI en español | Revisión de templates y archivos de especificación |
| **RNF-04**| Claridad y minimalismo visual con Bootstrap 5 | Todos los templates HTML | Clases estándar de Bootstrap 5 (`table`, `card`, `badge`) | Inspección de layout en pruebas de componentes |
| **RNF-05**| Consistencia temporal ISO 8601 (`AAAA-Www`) | `IsoWeekPipe`, formularios y selectores de semana | `IsoWeekPipe`, `TaskService`, `ReportService` | `iso-week.pipe.spec.ts` |
| **RNF-06**| Descargas transparentes de archivos binarios | `ProfessorReportsComponent` | `ReportService` con `responseType: 'blob'` | `report.service.spec.ts`, `professor-reports.component.spec.ts` |

---

## 7. Verificación del Plan y Próximos Pasos

Una vez validado y aprobado el presente plan arquitectónico:
1. Se procederá con la inicialización del proyecto Angular 17+ configurado con Bootstrap 5 y `ngx-toastr`.
2. Se implementará la capa transversal (`core`): modelos, interceptores, guards y servicios base.
3. Se desarrollarán las vistas del módulo de autenticación (`features/auth`).
4. Se construirán progresivamente las vistas por rol (`features/admin`, `features/professor`, `features/operational`).
5. Se implementará la suite completa de pruebas unitarias automatizadas garantizando el cumplimiento de cada criterio de aceptación EARS y la cobertura del 100% de los requisitos funcionales.
