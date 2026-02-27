import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const empresaActiva = authService.empresaActiva();

  // Si no hay token ni empresa, continuar sin modificar
  if (!token && !empresaActiva) {
    return next(req);
  }

  // Crear objeto de headers
  const headers: Record<string, string> = {};

  // Agregar token si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Agregar empresa_id si existe
  if (empresaActiva?.id) {
    headers['X-Empresa-Id'] = empresaActiva.id;
  }

  // Clonar request con nuevos headers
  const clonedReq = req.clone({
    setHeaders: headers
  });

  return next(clonedReq);
};
