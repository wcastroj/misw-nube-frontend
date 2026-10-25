# Guía de Desarrollo para Agentes IA (AGENTS.md)
## Aplicación Frontend Angular + Bootstrap — Sistema de Gestión y Reporte de Actividades

Este documento define los estándares arquitectónicos, convenciones de código y directrices de implementación para cualquier agente o desarrollador que trabaje en esta aplicación frontend.

---

## 1. Filosofía y Reglas Fundamentales (Invariantes del Proyecto)

> [!IMPORTANT]
> **REGLAS MANDATORIAS NO NEGOCIABLES:**
> 1. **Orientación EXCLUSIVA a los requerimientos:** Implementar únicamente los flujos y endpoints especificados en `FRONTEND_API_GUIDE.md` y `ENDPOINTS_BACKEND.md`. Queda prohibido el sobre-diseño, abstracciones innecesarias o adición de funciones no solicitadas.
> 2. **CERO ESTADOS DE CARGA (Sin Spinners ni Skeletons):**
>    - **NO** implementar variables de carga (`loading`, `isLoading`, `isSubmitting`, `isPending`).
>    - **NO** incluir spinners de Bootstrap (`spinner-border`, `spinner-grow`), barras de progreso ni pantallas de carga/esqueletos.
>    - Las peticiones HTTP se disparan directamente y los componentes actualizan su estado/renderizado al resolver la respuesta.
> 3. **MANEJO DE ERRORES CENTRALIZADO MEDIANTE TOASTR:**
>    - Cualquier fallo de red, validación HTTP (4xx / 5xx) o error funcional debe ser capturado e informado al usuario exclusivamente mediante una notificación **Toastr** (`toastr.error(...)`).
>    - No usar alertas intrusivas en el DOM ni banners de error en formularios salvo que el requerimiento lo exija expresamente.

---

## 2. Stack Tecnológico

- **Framework:** Angular 17+ (Componentes Standalone, arquitectura modular sin complejidad innecesaria).
- **Estilos & UI:** Bootstrap 5 (Uso de utilidades nativas, grid system, cards, tablas y badges).
- **Notificaciones:** `ngx-toastr` (con configuración accesible y minimalista).
- **Iconografía:** Bootstrap Icons o SVGs inline simples.
- **Cliente HTTP:** `@angular/common/http` con `provideHttpClient(withInterceptors([...]))`.
- **Ruteo:** Angular Router con Guards basados en autenticación y roles.

---

## 3. Estructura del Proyecto

La estructura del código debe mantenerse plana, legible y directamente mapeada al dominio:

```text
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts           # Verifica token activo
│   │   └── role.guard.ts           # Verifica permisos por rol (admin, professor, operational)
│   ├── interceptors/
│   │   ├── auth.interceptor.ts     # Agrega encabezado Bearer <token>
│   │   └── error.interceptor.ts    # Captura errores HTTP y lanza toastr.error()
│   ├── models/                     # Interfaces TypeScript de la API
│   │   ├── auth.model.ts
│   │   ├── user.model.ts
│   │   ├── period.model.ts
│   │   ├── workspace.model.ts
│   │   ├── assignment.model.ts
│   │   ├── task.model.ts
│   │   └── report.model.ts
│   └── services/                   # Servicios HTTP mapeados 1:1 a los dominios requeridos
│       ├── auth.service.ts
│       ├── workspace.service.ts
│       ├── assignment.service.ts
│       ├── task.service.ts
│       └── report.service.ts
├── features/                       # Módulos/Componentes organizados por Rol
│   ├── auth/
│   │   └── login/                  # Pantalla de inicio de sesión
│   ├── admin/                      # Vista del Administrador (solo Home/Dashboard en este alcance)
│   │   └── dashboard/              # Home básico de bienvenida/resumen para el administrador
│   ├── professor/                  # Vistas del Docente
│   │   ├── workspaces/             # Gestión de cursos/proyectos y cierre
│   │   ├── assignments/            # Vinculación de monitores/asistentes y seguimiento semanal/acumulado
│   │   └── reports/                # Generación de lote IA y descarga PDF/ZIP
│   └── operational/                # Vistas de Monitor / Asistente Graduado
│       ├── workspaces/             # Cursos asignados
│       └── tasks/                  # CRUD de tareas semanales e historial
├── shared/
│   ├── components/
│   │   └── navbar/                 # Barra superior limpia con usuario, rol y logout
│   └── pipes/                      # Formateadores (ej. formato de semana ISO o horas)
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

---

## 4. Patrones de Implementación Específicos

### 4.1. Interceptor de Errores con Toastr (`error.interceptor.ts`)

Todo error HTTP debe pasar por el interceptor que dispara la notificación toastr:

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMsg = 'An unexpected error occurred while processing the request.';

      if (error.error?.message) {
        errorMsg = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMsg = error.error;
      } else if (error.status === 401) {
        errorMsg = 'Session invalid or expired. Please sign in again.';
      } else if (error.status === 403) {
        errorMsg = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMsg = 'The requested resource was not found.';
      } else if (error.status >= 500) {
        errorMsg = 'Internal server error. Please try again later.';
      }

      toastr.error(errorMsg, `Error (${error.status || 'Network'})`, {
        timeOut: 4500,
        positionClass: 'toast-top-right',
        progressBar: false,
        closeButton: true
      });

      return throwError(() => error);
    })
  );
};
```

### 4.2. Consumo de Servicios sin Estados de Carga

Ejemplo de cómo deben ser implementados los métodos en los componentes. **Sin variables de carga**:

```typescript
// RECOMMENDED (Minimalist, strictly requirement-oriented):
loadTasks(assignmentId: number, week?: string): void {
  this.taskService.getTasks(assignmentId, week).subscribe({
    next: (tasks) => {
      this.tasks = tasks;
    }
    // Failures are automatically handled by errorInterceptor and Toastr
  });
}

// FORBIDDEN (Over-engineering loading states):
// this.isLoading = true;
// this.spinner.show();
```

### 4.3. Notificaciones de Éxito Opcionales / Silenciosas

- Para operaciones mutacionales exitosas (`POST`, `PUT`, `DELETE`), se puede emitir un toastr informativo simple (`toastr.success('Record created successfully')`) y refrescar la lista o redirigir de inmediato.

---

## 5. Diseño Visual y UX Minimalista con Bootstrap 5

1. **Intuitividad y Claridad:**
   - La pantalla principal de cada rol debe presentar una tabla o tarjetas de resumen directas.
   - Acciones claras con botones estándar:
     - Primarias: `btn btn-sm btn-primary`
     - Acciones de peligro/borrado: `btn btn-sm btn-outline-danger`
     - Filtros o descargas: `btn btn-sm btn-outline-secondary`
2. **Tablas de Datos:**
   - Usar la clase `table table-hover align-middle mb-0` dentro de un `card shadow-sm border-0`.
3. **Badges Semánticos:**
   - Estado `ACTIVO` / `FINALIZADA` / `REPORTED`: `badge bg-success`
   - Estado `CERRADO` / `PENDIENTE`: `badge bg-secondary` o `badge bg-warning text-dark`
   - Estado `NO_REPORT` / Alerta de horas: `badge bg-danger`
   - Reporte tardío (`is_late_report`): `badge bg-warning text-dark` con texto "Tardío"
4. **Formularios:**
   - `form-label fw-semibold` y `form-control form-control-sm` o estándar.
   - Modales estándar de Bootstrap (`data-bs-toggle="modal"` o modales limpios con Angular template refs) para creación/edición rápida sin cambiar de página innecesariamente.

---

## 6. Mapeo de Requerimientos y Reglas de Negocio Clave

El desarrollo del frontend debe enfocarse **EXCLUSIVAMENTE** en las siguientes tres funcionalidades principales:

### Funcionalidad 1: Autenticación y Acceso
- **Inicio de sesión local:** Pantalla de login que consume `POST /auth/login` con credenciales locales (`email` y `password`). Las credenciales ya se encuentran creadas en la base de datos (no implementar registro ni recuperación de contraseñas).
- **Control de acceso por 3 roles:**
  - `admin` (Administrador): **Sin flujos operativos adicionales para este alcance.** Su alcance se limita estrictamente a iniciar sesión y acceder a su **Dashboard / Home de Administrador** (pantalla de bienvenida informativa con sus datos de sesión).
  - `professor` (Profesor): Acceso a la supervisión y reportes de la Funcionalidad 2.
  - `operational` (Monitor o Asistente Graduado): Acceso a los cursos, registro de tareas e historial de la Funcionalidad 3.
- **Home diferenciado por rol:** Tras autenticarse exitosamente, el usuario debe ser redirigido a un **Home DIFERENTE** adaptado a su perfil, mostrando únicamente las opciones, métricas y datos que le corresponden:
  - `admin` → Dashboard / Home básico de Administrador (`/admin/dashboard`).
  - `professor` → Panel de Supervisión y Vinculaciones (`/professor/assignments`).
  - `operational` → Panel de Cursos y Proyectos Asignados (`/operational/workspaces`).
- **Referencia de permisos y opciones por perfil:** Para verificar en detalle las rutas, accesos y opciones de navegación de cada rol, consultar la guía de acciones:
  👉 **[actions_by_role.md](docs/ACTIONS_BY_ROLE.md)**.

### Funcionalidad 2: Vista del Rol Profesor
El usuario con rol `professor` debe disponer de las siguientes capacidades:
1. **Listado de vinculaciones:** Consultar el listado de monitores y asistentes graduados vinculados a sus cursos y proyectos (`GET /assignments`).
2. **Supervisión semanal de trabajo:** Examinar el detalle semanal del trabajo reportado por cada persona (`GET /assignments/:id/weekly`), distinguiendo con claridad inmediata quién ha reportado (`REPORTED` - badge verde) y quién no (`NO_REPORT` - badge rojo), además del contraste de horas reportadas vs contratadas.
3. **Generación de reportes PDF:** Ejecutar la generación de reportes semanales en formato PDF (`POST /reports/batch`) y permitir la descarga del archivo PDF individual o del lote comprimido (`GET /reports/:id/download`).

### Funcionalidad 3: Vista del Monitor y/o Asistente Graduado (`operational`)
El usuario operativo (monitor o asistente graduado) debe disponer de las siguientes capacidades:
1. **Consulta de cursos y proyectos:** Consultar la lista de cursos y proyectos en los que participa actualmente con su respectivo rol y horas contratadas (`GET /workspaces`).
2. **Registro de tareas semanales:** Registrar actividades realizadas (`POST /tasks`) enviando los datos requeridos por la especificación: semana en formato ISO (`YYYY-Www`), título, descripción, estado (`FINALIZADA` / `PENDIENTE`), horas dedicadas (entero mayor a cero `integer > 0`), observaciones y adjuntos opcionales. Notificar mediante Toastr si se detecta un reporte tardío (`is_late_report`).
3. **Historial de registros:** Acceder y navegar en el historial de tareas y registros previos asociados a sus asignaciones (`GET /tasks`).

---

## 7. Directrices para Agentes de Código

Al generar, modificar o refactorizar componentes en este repositorio:
1. **Verificar siempre `FRONTEND_API_GUIDE.md`:** Respetar los nombres exactos de los campos del JSON y parámetros de consulta (`query params`).
2. **No agregar librerías de UI complejas:** Mantener todo con Bootstrap 5 y `ngx-toastr`. No instalar Angular Material, PrimeNG, NgRx ni Tailwind salvo indicación explícita del usuario.
3. **Código conciso:** Implementar componentes legibles y enfocados únicamente en la vista requerida. Evitar métodos vacíos o handlers de eventos innecesarios.
4. **Manejo de Errores Impecable:** Asegurarse de que el interceptor capture todos los errores y que en ningún caso la aplicación quede congelada o rompa la consola silenciosamente.
