import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  usuario = computed(() => this.authService.usuario());
  empresaActiva = computed(() => this.authService.empresaActiva());
  empresas = computed(() => this.authService.empresas());
  
  mostrarMenuUsuario = false;
  mostrarSelectorEmpresa = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMenuUsuario(): void {
    this.mostrarMenuUsuario = !this.mostrarMenuUsuario;
    this.mostrarSelectorEmpresa = false;
  }

  toggleSelectorEmpresa(): void {
    this.mostrarSelectorEmpresa = !this.mostrarSelectorEmpresa;
    this.mostrarMenuUsuario = false;
  }

  cambiarEmpresa(empresaId: string): void {
    const empresa = this.empresas().find(e => e.id === empresaId);
    if (empresa) {
      this.authService.cambiarEmpresa(empresa);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  cerrarMenus(): void {
    this.mostrarMenuUsuario = false;
    this.mostrarSelectorEmpresa = false;
  }
}
