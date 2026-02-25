import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const empresaActiva = authService.empresaActiva();

  // Clonar la petición y agregar headers
  let clonedReq = req;

  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Agregar empresa_id en header si existe
  if (empresaActiva) {
    clonedReq = clonedReq.clone({
      setHeaders: {
        ...clonedReq.headers,
        'X-Empresa-Id': empresaActiva.id
      }
    });
  }

  return next(clonedReq);
};
