import { Routes } from '@angular/router';

export const FACTURACION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./facturacion.component').then(m => m.FacturacionComponent)
  }
];
