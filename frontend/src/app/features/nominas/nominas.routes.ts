import { Routes } from '@angular/router';

export const NOMINAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./nominas.component').then(m => m.NominasComponent)
  }
];
