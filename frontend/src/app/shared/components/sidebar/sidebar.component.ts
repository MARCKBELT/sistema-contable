import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📒', label: 'Plan de Cuentas', route: '/contabilidad' },
    { icon: '📝', label: 'Comprobantes', route: '/comprobantes' },
    { icon: '👥', label: 'Nóminas', route: '/nominas' },
    { icon: '🧾', label: 'Facturación', route: '/facturacion' },
    { icon: '📈', label: 'Reportes', route: '/reportes' },
    { icon: '⚙️', label: 'Configuración', route: '/configuracion', roles: ['ADMINISTRADOR'] }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  puedeVerItem(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    const userRole = this.authService.usuario()?.rol;
    return item.roles.includes(userRole || '');
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
