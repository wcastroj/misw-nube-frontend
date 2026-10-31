# Especificación Funcional: MVP Frontend — Sistema de Gestión y Reporte de Actividades

## 1. Contexto y Objetivo

### 1.1. Contexto
En entornos académicos y de gestión de proyectos universitarios, los docentes requieren coordinar y supervisar el trabajo de apoyo realizado por monitores y asistentes graduados. A su vez, el personal operativo necesita reportar periódicamente el tiempo invertido y las actividades ejecutadas, garantizando transparencia frente a las horas contratadas y facilitando la rendición de cuentas institucional.

### 1.2. Objetivo
Proveer una interfaz de usuario web intuitiva, directa y sin sobrecarga visual que permita:
1. Autenticar a los usuarios mediante credenciales locales y canalizarlos a un panel de inicio personalizado según su rol asignado.
2. Permitir a los docentes supervisar en tiempo real el cumplimiento semanal y acumulado de su equipo de apoyo, así como solicitar y descargar reportes consolidados en formato PDF.
3. Habilitar al personal operativo (monitores y asistentes graduados) para consultar sus espacios de trabajo vinculados, registrar y gestionar sus actividades semanales y revisar su historial de desempeño.

---

## 2. Usuarios y Roles

| Rol | Denominación en Sistema | Responsabilidad Principal en el MVP |
| :--- | :--- | :--- |
| **Administrador** | Administrador de Sistema | Acceso a panel de bienvenida informativo con datos de sesión y opción de cierre de sesión. Sin operaciones de gestión en este alcance. |
| **Profesor** | Docente Responsable | Supervisión semanal y acumulada de vinculaciones a su cargo, identificación de estados de reporte y generación/descarga de reportes en PDF. |
| **Operacional** | Monitor / Asistente Graduado | Consulta de cursos y proyectos asignados, registro semanal de actividades dedicadas, gestión de tareas (semana activa) y consulta de su historial de trabajo. |

---

## 3. Historias de Usuario

### Épica 1: Autenticación, Control de Acceso y Navegación
- **HU-01:** Como usuario del sistema, quiero ingresar mis credenciales de acceso para acceder de manera segura a la plataforma según mis permisos.
- **HU-02:** Como usuario autenticado, quiero ser dirigido automáticamente a una pantalla de inicio específica para mi perfil para acceder de inmediato a la información relevante para mis labores.
- **HU-03:** Como usuario autenticado, quiero cerrar mi sesión en cualquier momento para proteger la privacidad de mi cuenta y evitar accesos no autorizados.
- **HU-04:** Como usuario con un rol específico, quiero ser informado claramente si intento ingresar a una sección no autorizada para conocer la restricción sin desorientarme.

### Épica 2: Supervisión y Reportes para Docentes
- **HU-05:** Como profesor, quiero visualizar la lista consolidada de todas las personas a mi cargo para conocer su espacio de asignación, rol y horas de la semana activa.
- **HU-06:** Como profesor, quiero examinar el detalle de actividades semanales de una persona vinculada para revisar las tareas desarrolladas, el total de horas reportadas y si cumplió con el reporte.
- **HU-07:** Como profesor, quiero consultar el consolidado histórico acumulado de una persona vinculada para evaluar su porcentaje de cumplimiento global y detectar semanas sin reporte.
- **HU-08:** Como profesor, quiero solicitar la generación de reportes en PDF para semanas concluidas y descargar reportes individuales o el lote comprimido para sustentar la labor académica.

### Épica 3: Gestión de Actividades para Personal Operativo
- **HU-09:** Como monitor o asistente graduado, quiero consultar la lista de cursos y proyectos en los que participo para conocer las horas contratadas y el docente a cargo.
- **HU-10:** Como monitor o asistente graduado, quiero registrar mis tareas semanales con título, descripción, horas enteras invertidas, estado y observaciones para justificar mis horas contratadas.
- **HU-11:** Como monitor o asistente graduado, quiero ser advertido si intento registrar una tarea de una semana concluida para comprender que se registrará como reporte tardío e inmutable.
- **HU-12:** Como monitor o asistente graduado, quiero modificar o eliminar tareas registradas en la semana activa de un curso abierto para corregir errores u omisiones.
- **HU-13:** Como monitor o asistente graduado, quiero acceder al historial detallado de mis actividades semana a semana para consultar mis horas acumuladas y el estado de cumplimiento histórico.

---

## 4. Requisitos Funcionales y Criterios de Aceptación (Notación EARS)

### Módulo 1: Autenticación y Control de Acceso

#### RF-01: Autenticación Local de Usuarios
El sistema debe proporcionar un formulario de acceso para validar la identidad de los usuarios mediante correo electrónico y contraseña.
- **EARS-01.1 (Dirigido por eventos):** CUANDO el usuario ingrese un correo y contraseña válidos y envíe el formulario, el sistema DEBE autenticar la sesión, almacenar de forma segura la sesión activa y redirigir al usuario a la pantalla de inicio correspondiente a su rol.
- **EARS-01.2 (Excepcional):** SI las credenciales ingresadas son incorrectas o inválidas, ENTONCES el sistema DEBE mantener al usuario en el formulario de inicio de sesión y mostrar un mensaje emergente de error indicando la falla de autenticación.
- **EARS-01.3 (Excepcional):** SI el usuario intenta enviar el formulario de inicio de sesión con campos vacíos o con formato de correo inválido, ENTONCES el sistema DEBE resaltar visualmente los campos requeridos y evitar el envío de la solicitud.

#### RF-02: Enrutamiento Inicial Diferenciado por Rol
El sistema debe direccionar a cada usuario tras su autenticación a un entorno adaptado exclusivamente a su perfil.
- **EARS-02.1 (Dirigido por eventos):** CUANDO un usuario con rol de Administrador inicie sesión exitosamente, el sistema DEBE dirigirlo a su panel informativo de bienvenida.
- **EARS-02.2 (Dirigido por eventos):** CUANDO un usuario con rol de Profesor inicie sesión exitosamente, el sistema DEBE dirigirlo a la vista de supervisión de personas a cargo.
- **EARS-02.3 (Dirigido por eventos):** CUANDO un usuario con rol Operacional inicie sesión exitosamente, el sistema DEBE dirigirlo a su panel de cursos y proyectos asignados.

#### RF-03: Cierre de Sesión Seguro
El sistema debe permitir finalizar la sesión de trabajo y revocar el acceso.
- **EARS-03.1 (Dirigido por eventos):** CUANDO el usuario autenticado seleccione la opción de cerrar sesión, el sistema DEBE invalidar la sesión en el servidor, eliminar todos los datos de sesión almacenados localmente en el navegador y redirigir a la pantalla de inicio de sesión.
- **EARS-03.2 (Excepcional):** SI ocurre un error de red durante la comunicación de cierre de sesión con el servidor, ENTONCES el sistema DEBE forzar la eliminación de los datos de sesión locales y redirigir al usuario al formulario de inicio de sesión.

#### RF-04: Protección de Rutas y Control de Expiración
El sistema debe salvaguardar las secciones privadas de accesos indebidos o sesiones caducadas.
- **EARS-04.1 (Excepcional):** SI un usuario no autenticado intenta acceder a una ruta protegida del sistema, ENTONCES el sistema DEBE redirigirlo de inmediato al formulario de inicio de sesión.
- **EARS-04.2 (Excepcional):** SI un usuario autenticado intenta navegar a una ruta que no corresponde a los privilegios de su rol, ENTONCES el sistema DEBE mostrar una pantalla intermedia de "Acceso No Autorizado" que informe la restricción y ofrezca un enlace para regresar a su panel principal.
- **EARS-04.3 (Excepcional):** SI durante la navegación o realización de una petición la sesión expira o es rechazada por el servidor con código de desautorización, ENTONCES el sistema DEBE limpiar los datos de sesión locales, redirigir al formulario de inicio de sesión y presentar un mensaje emergente notificando que la sesión ha expirado.

#### RF-05: Panel de Inicio del Administrador
El sistema debe ofrecer una vista informativa minimalista para el rol de administrador.
- **EARS-05.1 (Ubicuo):** El sistema DEBE mostrar en el panel del Administrador el nombre completo del usuario, su dirección de correo institucional, el rol activo y el estado de la sesión.
- **EARS-05.2 (Ubicuo):** El sistema DEBE omitir en el panel del Administrador opciones operativas, enlaces de gestión de usuarios, edición de períodos académicos o auditorías de vinculaciones.

---

### Módulo 2: Vista del Rol Profesor (Supervisión y Reportes)

#### RF-06: Consulta de Personas Vinculadas a Cargo
El sistema debe presentar al docente la lista unificada de todos los monitores y asistentes graduados vinculados a sus espacios en la semana activa.
- **EARS-06.1 (Ubicuo):** El sistema DEBE mostrar una tabla directa y unificada con todas las vinculaciones activas asociadas al docente, indicando para cada una: nombre de la persona, curso o proyecto asignado, rol de vinculación (Monitor o Asistente Graduado), horas semanales contratadas, horas reportadas en la semana activa y distintivo visual de estado de reporte.
- **EARS-06.2 (Basado en estado):** MIENTRAS la persona vinculada cuente con actividades registradas en la semana de consulta, el sistema DEBE mostrar un distintivo visual positivo con la etiqueta "Reportado".
- **EARS-06.3 (Basado en estado):** MIENTRAS la persona vinculada no cuente con ninguna actividad registrada en la semana de consulta, el sistema DEBE mostrar un distintivo visual de alerta con la etiqueta "Sin reporte".
- **EARS-06.4 (Excepcional):** SI el profesor no cuenta con ningún monitor o asistente vinculado a sus cursos o proyectos, ENTONCES el sistema DEBE presentar un mensaje informativo amigable indicando la ausencia de personas a cargo.

#### RF-07: Detalle Semanal de Trabajo de una Persona Vinculada
El sistema debe permitir profundizar en el desglose de actividades de un estudiante para una semana determinada.
- **EARS-07.1 (Dirigido por eventos):** CUANDO el profesor seleccione una persona del listado, el sistema DEBE mostrar el detalle semanal de actividades, el balance de horas (contratadas vs reportadas), el estado del reporte y el listado de tareas individuales registradas.
- **EARS-07.2 (Dirigido por eventos):** CUANDO el profesor seleccione una semana distinta mediante el selector temporal, el sistema DEBE actualizar el detalle de actividades y balance correspondiente a dicha semana.
- **EARS-07.3 (Basado en estado):** MIENTRAS las horas reportadas por la persona superen las horas semanales contratadas, el sistema DEBE exhibir las horas reales reportadas y destacar visualmente un indicador de sobrecumplimiento de horas.
- **EARS-07.4 (Ubicuo):** El sistema DEBE exhibir para cada tarea del detalle: título, descripción, horas invertidas, estado (Finalizada / Pendiente), observaciones y si la tarea fue reportada de manera tardía.

#### RF-08: Consolidado Histórico Acumulado de la Vinculación
El sistema debe brindar un resumen acumulado de desempeño a lo largo del período académico.
- **EARS-08.1 (Dirigido por eventos):** CUANDO el profesor acceda a la sección de consolidado histórico de la persona vinculada, el sistema DEBE presentar el balance global de horas acumuladas, el porcentaje de cumplimiento sobre el total esperado, el desglose semana a semana y el conteo de semanas sin reporte.
- **EARS-08.2 (Basado en estado):** MIENTRAS existan semanas transcurridas en las que la persona no haya registrado actividades, el sistema DEBE listar dichas semanas resaltadas bajo el estado "Sin reporte".

#### RF-09: Generación y Descarga de Reportes en PDF
El sistema debe facultar al docente para tramitar y descargar reportes oficiales en formato PDF.
- **EARS-09.1 (Ubicuo):** El sistema DEBE ofrecer una sección de reportes que liste las semanas cerradas (concluidas) del período académico y permita seleccionar una semana para su procesamiento y consulta.
- **EARS-09.2 (Basado en estado):** MIENTRAS la semana seleccionada corresponda a la semana en curso o a una semana futura, el sistema DEBE mantener deshabilitada la acción de "Generar Reportes por Lote".
- **EARS-09.3 (Dirigido por eventos):** CUANDO el profesor pulse la acción de generar reportes para una semana cerrada seleccionada, el sistema DEBE emitir la solicitud de procesamiento y notificar mediante un mensaje emergente de éxito que la generación del lote ha sido iniciada.
- **EARS-09.4 (Dirigido por eventos):** CUANDO existan reportes generados para la semana consultada, el sistema DEBE permitir descargar el archivo individual en formato PDF de cada estudiante vinculado.
- **EARS-09.5 (Dirigido por eventos):** CUANDO existan reportes generados para la semana consultada, el sistema DEBE ofrecer una acción global para descargar el paquete comprimido en formato ZIP con la totalidad de los reportes del lote.
- **EARS-09.6 (Excepcional):** SI la solicitud de generación o descarga de un reporte experimenta una falla en el servidor, ENTONCES el sistema DEBE informar al usuario exclusivamente a través de una notificación emergente de error, manteniendo la pantalla disponible.

---

### Módulo 3: Vista del Rol Operacional (Monitor y Asistente Graduado)

#### RF-10: Consulta de Espacios de Trabajo Asignados
El sistema debe mostrar los cursos y proyectos donde el estudiante operativo ejerce sus funciones.
- **EARS-10.1 (Ubicuo):** El sistema DEBE listar los cursos y proyectos vinculados al usuario en sesión, detallando: nombre del espacio, nombre del docente responsable, rol asignado (Monitor o Asistente Graduado), horas semanales contratadas y estado del espacio (Activo o Cerrado).
- **EARS-10.2 (Excepcional):** SI el usuario no tiene ninguna vinculación vigente o histórica en el período, ENTONCES el sistema DEBE exhibir un mensaje ilustrativo indicando que no cuenta con espacios de trabajo asignados.

#### RF-11: Registro de Tareas Semanales
El sistema debe suministrar un formulario claro para registrar las labores desarrolladas.
- **EARS-11.1 (Ubicuo):** El sistema DEBE solicitar en el formulario de registro: espacio de trabajo asociado, semana de ejecución (estándar ISO), título de la actividad, descripción, estado de la tarea (Finalizada o Pendiente), tiempo invertido en horas enteras mayores a cero y observaciones complementarias.
- **EARS-11.2 (Ubicuo):** El sistema DEBE omitir la carga o adjuntos de archivos en el formulario para este alcance.
- **EARS-11.3 (Basado en estado):** MIENTRAS el selector de semanas esté activo en el formulario, el sistema DEBE impedir la selección de semanas futuras.
- **EARS-11.4 (Basado en estado):** MIENTRAS el usuario seleccione una semana pasada (ya concluida), el formulario DEBE mostrar una advertencia visible indicando que la actividad se guardará como "Reporte Tardío" y no podrá ser modificada ni eliminada con posterioridad.
- **EARS-11.5 (Dirigido por eventos):** CUANDO el usuario envíe el formulario con datos válidos, el sistema DEBE registrar la tarea, notificar la confirmación mediante un mensaje emergente de éxito y actualizar el listado de tareas de inmediato.
- **EARS-11.6 (Basado en estado):** MIENTRAS la suma de horas reportadas supere las horas semanales contratadas de la vinculación, el sistema DEBE permitir registrar la tarea y actualizar el balance semanal reflejando el sobrecumplimiento.
- **EARS-11.7 (Excepcional):** SI el usuario ingresa un valor de horas fraccionario, igual a cero o negativo, ENTONCES el sistema DEBE invalidar el campo y mostrar una advertencia requiriendo un número entero mayor a cero.

#### RF-12: Edición y Eliminación de Tareas
El sistema debe posibilitar el mantenimiento de tareas bajo condiciones controladas de vigencia.
- **EARS-12.1 (Basado en estado):** MIENTRAS la tarea pertenezca a la semana en curso activa, el espacio de trabajo se encuentre abierto y la tarea no sea un reporte tardío, el sistema DEBE habilitar las opciones de modificar y eliminar la tarea.
- **EARS-12.2 (Basado en estado):** MIENTRAS una tarea corresponda a un reporte tardío o pertenezca a una semana concluida o a un espacio de trabajo cerrado, el sistema DEBE deshabilitar u ocultar los controles de edición y eliminación, mostrando la tarea en modo de solo lectura.
- **EARS-12.3 (Dirigido por eventos):** CUANDO el usuario solicite la eliminación de una tarea elegible, el sistema DEBE solicitar una confirmación previa antes de ejecutar el borrado definitivo.
- **EARS-12.4 (Dirigido por eventos):** CUANDO una tarea elegible sea actualizada o eliminada exitosamente, el sistema DEBE notificar la operación mediante un mensaje emergente de éxito y actualizar el balance de horas semanal.

#### RF-13: Historial de Registros Semanales
El personal operativo debe poder inspeccionar todo su registro cronológico de trabajo.
- **EARS-13.1 (Dirigido por eventos):** CUANDO el usuario acceda a la sección de historial de una vinculación, el sistema DEBE desplegar la relación histórica semana a semana con: identificación de la semana, cantidad de tareas registradas, total de horas acumuladas, estado de la semana (Reportado o Sin reporte) e indicador si contiene reportes tardíos.
- **EARS-13.2 (Dirigido por eventos):** CUANDO el usuario seleccione una semana del historial, el sistema DEBE expandir o detallar las tareas individuales registradas en esa semana específica.

---

## 5. Requisitos No Funcionales (RNF)

- **RNF-01 (Cero estados de carga intrusivos):** La interfaz de usuario no debe implementar pantallas de bloqueo, barras de progreso indefinidas, esqueletos gráficos ni iconos giratorios de carga (spinners). La interacción debe ser directa y los componentes deben renderizar el resultado inmediatamente al resolverse la respuesta de datos.
- **RNF-02 (Notificación de errores centralizada y no intrusiva):** Todo error de red, fallo de servidor (códigos HTTP 4xx y 5xx) o validación funcional debe ser comunicado al usuario única y exclusivamente a través de notificaciones emergentes de corta duración (toasts), evitando alertas modales bloqueantes o banners disruptivos en el diseño.
- **RNF-03 (Bilingüismo normativo en la experiencia de usuario):** Todos los textos de la interfaz gráfica, etiquetas de formularios, encabezados de tablas, opciones de menú, mensajes informativos y textos de error dirigidos al usuario deben presentarse rigurosamente en idioma español.
- **RNF-04 (Claridad y minimalismo visual):** La disposición de la información debe privilegiar la legibilidad, organizando los datos en tarjetas de contenido limpias y tablas estructuradas con distintivos semánticos claros para estados y balances.
- **RNF-05 (Consistencia temporal estandarizada):** El sistema debe manejar y formatear la identificación de semanas bajo el estándar temporal internacional ISO 8601 (`AAAA-Www`), garantizando uniformidad entre lo visualizado y lo procesado.
- **RNF-06 (Descargas de archivos transparentes):** La descarga de archivos binarios (reportes PDF y archivos comprimidos ZIP) debe desencadenar la descarga directa en el navegador sin redireccionar ni alterar el estado visual de la página activa.

---

## 6. Casos Límite y Reglas de Negocio Especiales

1. **Horas reportadas que exceden las horas contratadas:**
   - Si un monitor con 10 horas semanales registra actividades por un total de 14 horas en una semana, el sistema no bloquea el guardado. La interfaz actualiza el balance reflejando 14/10 horas e incorpora un distintivo visual de alerta para que tanto el estudiante como el docente tengan visibilidad del sobrecumplimiento.
2. **Registro extemporáneo (Reporte Tardío):**
   - Si el estudiante registra una tarea para una semana que ya concluyó (domingo previo ya transcurrido), el sistema advierte en el formulario sobre el carácter tardío. Una vez creada, la tarea queda marcada permanentemente con la etiqueta "Tardío" y sus acciones de edición y eliminación quedan inhabilitadas.
3. **Intentos de registrar actividades en semanas futuras:**
   - El selector de semanas en el formulario de creación de tareas restringe la selección a la semana en curso o semanas pasadas. No es posible elegir semanas que aún no han comenzado.
4. **Espacios de trabajo en estado Cerrado:**
   - Si un curso o proyecto tiene estado `CERRADO`, el personal operativo puede visualizar sus tareas pasadas y su historial, pero los botones para crear nuevas tareas, editar o borrar quedan completamente deshabilitados.
5. **Generación de reportes para semanas en curso o futuras:**
   - La acción de generar lote de reportes se restringe a semanas pasadas (cerradas). El sistema exhibe un selector de semanas anteriores concluidas para su disparo.
6. **Token de sesión caducado durante el uso activo:**
   - Si durante cualquier interacción el servidor responde con un código de desautorización (401), el sistema destruye inmediatamente los datos de sesión locales, redirige al inicio de sesión y notifica mediante mensaje emergente que la sesión ha vencido.
7. **Intento de acceso cruzado entre roles:**
   - Si un usuario autenticado como monitor intenta navegar a la vista de supervisión de profesor, el sistema intercepta el acceso y lo conduce a una vista amigable de "Acceso No Autorizado", con la opción de regresar a su panel correspondiente.
8. **Ausencia total de registros o vinculaciones (Estados Vacíos):**
   - En cualquier tabla o vista donde no existan registros (ej. profesor sin asistentes asignados, estudiante sin cursos, semana sin tareas), el sistema debe mostrar un mensaje ilustrativo claro en lugar de una tabla vacía sin contexto.

---

## 7. Fuera de Alcance para el MVP

Para garantizar el cumplimiento estricto del alcance y evitar sobre-diseño, quedan expresamente excluidos de este MVP:
1. **Módulos de administración operativa:** Pantallas de creación y edición de cuentas de usuario, creación y cierre de períodos académicos, auditoría global y rectificación manual de horas por parte del administrador.
2. **Gestión de espacios y vinculaciones por el profesor:** Formularios para que el docente cree cursos, cierre espacios o vincule manualmente a los monitores/asistentes (dichas vinculaciones se asumen preexistentes en la base de datos).
3. **Carga física de adjuntos en tareas:** Funcionalidad de subida de archivos físicos o almacenamiento en la nube; el formulario de tareas se restringe a campos de texto, números enteros y estados.
4. **Filtros avanzados y buscadores complejos en la tabla del profesor:** No se incluirán filtros combinados ni barras de búsqueda; se utilizará una tabla simple directa y unificada.
5. **Autoregistro y recuperación de contraseñas:** No habrá flujos de registro público, activación de cuenta ni reseteo de clave por correo electrónico. Las credenciales se gestionan previamente en la base de datos.
6. **Exportaciones a otros formatos:** No se contemplan exportaciones a formatos Excel, CSV ni visualizadores gráficos de analítica avanzada.

---

## 8. Criterios de Finalización (Definition of Done)

El presente MVP se considerará completado cuando se cumpla la totalidad de los siguientes criterios:
1. **Cobertura integral de las 3 funcionalidades base:**
   - Acceso con inicio de sesión local para los 3 perfiles con redirección a su panel correspondiente (`/admin`, `/professor`, `/operational`).
   - Vista de supervisión del profesor con tabla de personas vinculadas, detalle semanal, consolidado acumulado y generación/descarga de reportes PDF/ZIP para semanas cerradas.
   - Vista operativa con consulta de espacios asignados, registro de tareas con validación de enteros positivos, advertencia de reportes tardíos, edición/eliminación condicionada e historial semanal.
2. **Adherencia a la Notación EARS:**
   - Todos los requisitos funcionales (RF-01 al RF-13) satisfacen sus criterios de aceptación descritos bajo las cláusulas EARS correspondientes.
3. **Cumplimiento de las directrices constitucionales:**
   - Cero variables ni componentes visuales de carga (spinners, skeletons, barras de progreso).
   - Manejo centralizado de notificaciones de error mediante mensajes emergentes tipo toast.
   - Bilingüismo respetado: interfaz y avisos íntegramente en español.
4. **Respeto a las reglas de casos límite y exclusiones:**
   - Verificación de que las funcionalidades catalogadas como fuera de alcance no formen parte de la interfaz.

---

## 9. Dudas Abiertas

- `[RESUELTO EN FASE DE ACLARACIÓN]` **Edición y eliminación de tareas:** Incluidas en el MVP, condicionadas a semana activa, espacio abierto y tarea no tardía.
- `[RESUELTO EN FASE DE ACLARACIÓN]` **Gestión de adjuntos en formulario de tareas:** Omitidos para el MVP para simplificar el formulario.
- `[RESUELTO EN FASE DE ACLARACIÓN]` **Reporte de horas que exceden las contratadas:** Permitido; el sistema visualiza el balance real y resalta el sobrecumplimiento.
- `[RESUELTO EN FASE DE ACLARACIÓN]` **Generación de reportes PDF:** Restringida a semanas concluidas (cerradas), mostrando selector de semanas anteriores.
- `[RESUELTO EN FASE DE ACLARACIÓN]` **Alcance de supervisión del docente:** Incluye tanto detalle semanal de actividades como consolidado histórico acumulado.
- `[RESUELTO EN FASE DE ACLARACIÓN]` **Semanas en formulario de tareas:** Bloqueo de semanas futuras y advertencia de reporte tardío en semanas pasadas.
- `[RESUELTO EN FASE DE ACLARACIÓN]` **Filtros en tabla del docente:** Tabla directa y simple sin filtros adicionales.
- `[RESUELTO EN FASE DE ACLARACIÓN]` **Control de acceso y expiración:** Redirección a inicio de sesión ante expiración de token; pantalla intermedia ante acceso a rutas de otro rol.
- `[SIN DUDAS ABIERTAS PENDIENTES]` Todas las ambigüedades identificadas han sido resueltas conforme a las respuestas provistas.
