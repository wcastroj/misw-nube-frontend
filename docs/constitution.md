# Constitución del Proyecto

1. **Stack minimalista:** Solo Angular Standalone, Bootstrap 5 y ngx-toastr; sin librerías UI complejas ni sobre-diseño.
2. **Cero estados de carga:** Prohibido implementar spinners, skeletons o variables de carga (`loading`/`isLoading`).
3. **Fidelidad a la especificación:** El código debe ajustarse de forma estricta y exclusiva a `FRONTEND_API_GUIDE.md`.
4. **Separación lógica/vista:** Componentes limitados a la presentación; llamadas HTTP y lógica de negocio en servicios.
5. **Manejo centralizado de errores:** Errores HTTP y validaciones notificados únicamente vía Toastr e interceptores.
6. **Bilingüismo normativo:** Código, nombres técnicos y commits en inglés; interfaz y mensajes al usuario en español.
7. **Política de pruebas:** Cada servicio y flujo principal debe contar con pruebas unitarias simples y directas.
8. **Claridad para juniors:** Soluciones planas, legibles y mantenibles; prohibida la abstracción prematura innecesaria.
