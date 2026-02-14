import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface DashboardCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user = this.authService.currentUser;
  
  cards = signal<DashboardCard[]>([
    {
      title: 'Contabilidad',
      value: 'Plan de Cuentas',
      icon: 'receipt',
      color: '#2563EB',
      route: '/contabilidad'
    },
    {
      title: 'Nóminas',
      value: 'Planillas',
      icon: 'people',
      color: '#7C3AED',
      route: '/nominas'
    },
    {
      title: 'Facturación',
      value: 'SIAT Integrado',
      icon: 'receipt_long',
      color: '#10B981',
      route: '/facturacion'
    },
    {
      title: 'Reportes',
      value: 'Análisis',
      icon: 'analytics',
      color: '#F59E0B',
      route: '/reportes'
    }
  ]);

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Usuario actual:', this.user());
  }

  logout(): void {
    this.authService.logout();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
