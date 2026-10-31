import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let title = `Error (${error.status || 'Red'})`;
      let errorMsg = 'Ocurrió un error inesperado al procesar la solicitud.';

      if (error.status === 401) {
        if (req.url.includes('/auth/login')) {
          title = 'Falla de Autenticación';
          errorMsg = error.error?.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.';
        } else {
          title = 'Sesión Expirada';
          errorMsg = 'Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.';
          authService.clearSession();
        }
      } else if (error.status === 403) {
        title = 'Acceso Denegado';
        errorMsg = 'No dispones de permisos suficientes para realizar esta acción.';
      } else if (error.status === 404) {
        title = 'No Encontrado';
        errorMsg = error.error?.message || 'El recurso solicitado no fue encontrado.';
      } else if (error.status === 400 || error.status === 422) {
        title = 'Error de Validación';
        errorMsg = error.error?.message || (typeof error.error === 'string' ? error.error : 'Los datos suministrados no son válidos.');
      } else if (error.status >= 500) {
        title = 'Error del Servidor';
        errorMsg = 'Ocurrió un error interno en el servidor. Inténtalo de nuevo más tarde.';
      } else if (error.status === 0) {
        title = 'Error de Conexión';
        errorMsg = 'No se pudo establecer conexión con el servidor. Revisa tu red.';
      } else if (error.error?.message) {
        errorMsg = error.error.message;
      }

      toastr.error(errorMsg, title, {
        timeOut: 4500,
        positionClass: 'toast-top-right',
        progressBar: false,
        closeButton: true
      });

      return throwError(() => error);
    })
  );
};
