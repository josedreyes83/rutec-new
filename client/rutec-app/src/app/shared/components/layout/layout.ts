import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { InstitutionalFooterComponent } from '../institutional-footer/institutional-footer';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, InstitutionalFooterComponent, ButtonModule],
  template: `
    <div class="user-bar">
      Esta autenticado como: <strong>{{ authService.user()?.email }}</strong>
      {{ authService.user()?.nombreCompleto ? 'de ' + authService.user()?.nombreCompleto : '' }}
    </div>

    <header class="header">
      <div class="header-content">
        <img src="images/mintrabajo_logo.png" alt="Ministerio del Trabajo" class="header-logo" />
        <img src="images/rutec.png" alt="RUTEC" class="header-rutec" />
      </div>
    </header>

    <nav class="navbar">
      <div class="navbar-content">
        <span class="navbar-title">RUTEC - Registro Unico de Trabajadores Extranjeros en Colombia</span>
        <div class="navbar-actions">
          <a routerLink="/dashboard" class="nav-link">Inicio</a>
          <a routerLink="/cambiar-clave" class="nav-link">Cambiar Clave</a>
          <a class="nav-link" (click)="authService.logout()" style="cursor:pointer">Salir</a>
        </div>
      </div>
    </nav>

    <div class="app-body">
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <i class="pi pi-home"></i> Dashboard
          </a>

          <div class="sidebar-section">Trabajadores</div>
          <a routerLink="/trabajadores" routerLinkActive="active">
            <i class="pi pi-users"></i> Consultar
          </a>
          <a routerLink="/trabajadores/registrar" routerLinkActive="active">
            <i class="pi pi-user-plus"></i> Registrar
          </a>

          <div class="sidebar-section">Certificados</div>
          <a routerLink="/certificados" routerLinkActive="active">
            <i class="pi pi-file"></i> Constancias
          </a>

          <div class="sidebar-section">Calidad</div>
          <a routerLink="/calidad/empresas" routerLinkActive="active">
            <i class="pi pi-check-circle"></i> Verificacion
          </a>

          <div class="sidebar-section">Reportes</div>
          <a routerLink="/reportes" routerLinkActive="active">
            <i class="pi pi-chart-bar"></i> Reportes
          </a>

          <div class="sidebar-section">Administracion</div>
          <a routerLink="/admin/usuarios" routerLinkActive="active">
            <i class="pi pi-cog"></i> Usuarios
          </a>
          <a routerLink="/admin/codigos-referencia" routerLinkActive="active">
            <i class="pi pi-list"></i> Codigos Referencia
          </a>
          <a routerLink="/admin/empresas" routerLinkActive="active">
            <i class="pi pi-building"></i> Empresas
          </a>
        </nav>
      </aside>

      <div class="main-wrapper">
        <main class="main-content">
          <router-outlet />
        </main>
        <app-institutional-footer />
      </div>
    </div>
  `,
  styles: [`
    .user-bar { background: #3949ab; color: white; text-align: center; padding: 0.4rem 1rem; font-size: 0.8rem; }
    .header { background: white; border-bottom: 1px solid #e0e0e0; padding: 0.5rem 2rem; }
    .header-content { display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto; }
    .header-logo { height: 60px; }
    .header-rutec { height: 35px; }
    .navbar { background: #1a237e; color: white; padding: 0 2rem; }
    .navbar-content { display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto; height: 42px; }
    .navbar-title { font-size: 0.85rem; font-weight: 500; }
    .navbar-actions { display: flex; gap: 1.5rem; }
    .nav-link { color: white; text-decoration: none; font-size: 0.85rem; opacity: 0.85; }
    .nav-link:hover { opacity: 1; }
    .app-body { display: flex; min-height: calc(100vh - 152px); }
    .sidebar { width: 230px; min-width: 230px; background: white; border-right: 1px solid #e0e0e0; padding: 0.75rem 0; }
    .sidebar-nav { display: flex; flex-direction: column; }
    .sidebar-section { padding: 1rem 1.25rem 0.3rem; font-size: 0.7rem; text-transform: uppercase; color: #1a237e; font-weight: 700; letter-spacing: 0.5px; }
    .sidebar-nav a { padding: 0.55rem 1.25rem; color: #37474f; text-decoration: none; font-size: 0.85rem; display: flex; align-items: center; gap: 0.6rem; transition: background 0.15s; }
    .sidebar-nav a i { font-size: 0.9rem; width: 18px; text-align: center; }
    .sidebar-nav a:hover { background: #f5f5f5; }
    .sidebar-nav a.active { background: #e8eaf6; color: #1a237e; font-weight: 600; border-left: 3px solid #1a237e; }
    .main-wrapper { flex: 1; display: flex; flex-direction: column; background: #f5f5f5; }
    .main-content { flex: 1; padding: 1.5rem 2rem; max-width: 1400px; width: 100%; }
  `]
})
export class LayoutComponent {
  constructor(public authService: AuthService) {}
}
