# MISW Nube Frontend

Aplicación frontend desarrollada con Angular para la gestión y seguimiento de actividades académicas de profesores, monitores y asistentes graduados.

## Features principales

### Autenticación y control de acceso

- Inicio de sesión mediante correo y contraseña.
- Autenticación basada en token.
- Protección de rutas mediante guards.
- Redirección según el rol del usuario:
  - `admin`: dashboard administrativo.
  - `professor`: gestión y supervisión de vinculaciones.
  - `operational`: cursos, proyectos y tareas asignadas.
- Cierre de sesión y limpieza de la sesión local.
- Notificaciones de errores mediante Toastr.

### Módulo de administrador

- Dashboard de bienvenida.
- Visualización de la información del usuario autenticado.

### Módulo de profesor

- Consulta de vinculaciones con monitores y asistentes.
- Visualización del detalle semanal de actividades.
- Consulta consolidada del trabajo reportado.
- Comparación entre horas contratadas y horas reportadas.
- Identificación de reportes realizados y pendientes.
- Generación de reportes semanales.
- Descarga de reportes individuales en PDF.
- Descarga de lotes de reportes en formato ZIP.

### Módulo operativo

- Consulta de cursos y proyectos asignados.
- Visualización del rol y las horas contratadas.
- Registro de tareas semanales.
- Edición y eliminación de tareas.
- Registro de semana en formato ISO (`YYYY-Www`).
- Registro de título, descripción, estado, horas, observaciones y adjuntos.
- Notificación de reportes tardíos.
- Consulta del historial de tareas por asignación.

## Tecnologías utilizadas

- Angular 21
- TypeScript
- Bootstrap 5
- Bootstrap Icons
- RxJS
- ngx-toastr
- Angular Router
- Angular HttpClient
- SDD

## Conexión con el backend

El frontend consume una API REST mediante `HttpClient`. La URL base se configura en los archivos de entorno:

- Desarrollo: `src/environments/environment.ts`
- Producción: `src/environments/environment.prod.ts`

La URL actual del backend es:

```text
http://35.254.96.36/api/v1
```

Los principales endpoints utilizados son:

```text
POST   /auth/login
POST   /auth/logout

GET    /assignments
GET    /assignments/:id/weekly
GET    /assignments/:id/consolidated

GET    /workspaces

POST   /tasks
GET    /tasks
PUT    /tasks/:id
DELETE /tasks/:id
GET    /tasks/history

POST   /reports/batch
GET    /reports
GET    /reports/:id/download
GET    /reports/batch/:id/download
```

Las peticiones autenticadas incluyen automáticamente la credencial de autenticación mediante un interceptor HTTP. Los errores HTTP son gestionados centralmente y reportados mediante notificaciones Toastr.

## Configuración de `environment.ts`

El archivo `src/environments/environment.ts` contiene la configuración utilizada durante el desarrollo local:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://35.254.96.36/api/v1'
};
```

Para producción se utiliza `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://35.254.96.36/api/v1'
};
```

Durante el build de producción, Angular reemplaza automáticamente `environment.ts` por `environment.prod.ts`, según la configuración definida en `angular.json`.

Si la URL del backend cambia, debe actualizarse en ambos archivos de entorno.

## Ejecución local

### Requisitos

- Node.js
- npm
- Angular CLI, opcionalmente instalado de forma global

### Instalación

Clonar el repositorio e instalar las dependencias:

```bash
git clone <URL_DEL_REPOSITORIO>
cd misw-nube-frontend
npm install
```

### Iniciar el servidor de desarrollo

```bash
npm start
```

También se puede utilizar Angular CLI directamente:

```bash
ng serve
```

La aplicación estará disponible en:

```text
http://localhost:4200/
```

### Compilar el proyecto

Para generar el build de producción:

```bash
npm run build
```

Los archivos generados estarán en:

```text
dist/misw-nube-frontend/browser/
```

### Ejecutar pruebas

```bash
npm test
```

## Aplicación desplegada

Actualmente, la aplicación se encuentra desplegada en un bucket de Google Cloud Storage.

Puede acceder a la aplicación desde la siguiente URL:

[http://entrega-frontend-nube-1793477639.storage.googleapis.com/browser/index.html](http://entrega-frontend-nube-1793477639.storage.googleapis.com/browser/index.html)
