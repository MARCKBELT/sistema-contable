import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  salarioMinimo = 3300;
  tipoCambio = 6.96;
  ufvActual = 2.58347;

  constructor(private authService: AuthService) {}

  // Usar computed() en métodos en lugar de propiedades
  get usuario() {
    return this.authService.usuario();
  }

  get empresaActiva() {
    return this.authService.empresaActiva();
  }

  ngOnInit(): void {
    console.log('Dashboard cargado');
    console.log('Usuario:', this.usuario);
    console.log('Empresa activa:', this.empresaActiva);
  }
}
