import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'contabilidad',
    loadChildren: () => import('./features/contabilidad/contabilidad.routes').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'comprobantes',
    loadChildren: () => import('./features/comprobantes/comprobantes.routes').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
