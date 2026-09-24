import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SharedService, DatosOrganizacion } from '../../core/services/shared.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <h3 class="page-title">REGISTRO UNICO DE TRABAJADORES EXTRANJEROS EN COLOMBIA - RUTEC</h3>

    <div class="info-bar">
      <i class="pi pi-info-circle info-icon"></i>
      <div>
        <strong>Area administrativa!</strong><br>
        Solo los usuarios autorizados pueden hacer uso de esta area.
      </div>
    </div>

    <div class="cards-grid">
      <a routerLink="/reportes" class="action-card card-gray">
        <div class="card-body">
          <span class="card-title">REPORTES</span>
          <i class="pi pi-chart-bar card-icon"></i>
        </div>
        <div class="card-footer">VER <i class="pi pi-chevron-right"></i></div>
      </a>

      <a routerLink="/calidad/verificadores" class="action-card card-cyan">
        <div class="card-body">
          <span class="card-title">ASIGNAR REVISORES</span>
          <i class="pi pi-user-plus card-icon"></i>
        </div>
        <div class="card-footer">VER <i class="pi pi-chevron-right"></i></div>
      </a>

      <a routerLink="/admin/eliminacion-masiva" class="action-card card-red">
        <div class="card-body">
          <span class="card-title">ELIMINAR REGISTROS</span>
          <i class="pi pi-trash card-icon"></i>
        </div>
        <div class="card-footer">VER <i class="pi pi-chevron-right"></i></div>
      </a>

      <a routerLink="/calidad/gestion" class="action-card card-green">
        <div class="card-body">
          <span class="card-title">GESTION DE ACLARACION</span>
          <i class="pi pi-question-circle card-icon"></i>
        </div>
        <div class="card-footer">VER <i class="pi pi-chevron-right"></i></div>
      </a>

      <a routerLink="/admin/modificar-fechas" class="action-card card-dark">
        <div class="card-body">
          <span class="card-title">MODIFICAR FECHAS CONTRATOS</span>
          <i class="pi pi-calendar card-icon"></i>
        </div>
        <div class="card-footer">VER <i class="pi pi-chevron-right"></i></div>
      </a>
    </div>

    <h4 class="section-title">Datos de la organizacion</h4>
    <hr>
    <div class="data-row">
      <span class="data-label">Nombre de la organizacion</span>
      <span class="data-value text-capitalize">{{ org()?.nombreOrganizacion || '-' }}</span>
    </div>
    <hr>
    <div class="data-row">
      <span class="data-label">Tipo actividad economica</span>
      <span class="data-value text-capitalize">{{ org()?.actividadEconomica || '-' }}</span>
    </div>
    <hr>
    <div class="data-row">
      <span class="data-label">Numero de documento</span>
      <span class="data-value">{{ org()?.numeroDocumento || '-' }}</span>
    </div>
    <hr>

    @if (org()?.representante) {
      <br>
      <h4 class="section-title">Datos del representante legal</h4>
      <hr>
      <div class="data-row">
        <span class="data-label">Nombre completo</span>
        <span class="data-value text-capitalize">{{ org()?.representante?.nombreCompleto || '-' }}</span>
      </div>
      <hr>
      <div class="data-row">
        <span class="data-label">Documento de identificacion</span>
        <span class="data-value">{{ org()?.representante?.documentoIdentificacion || '-' }}</span>
      </div>
      <hr>
    }
  `,
  styles: [`
    .page-title { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #26c6da; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.5rem;
      background: white; font-size: 0.85rem;
    }
    .info-icon { font-size: 2rem; color: #26c6da; }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .action-card {
      border-radius: 8px;
      text-decoration: none;
      color: white;
      overflow: hidden;
      transition: transform 0.15s, box-shadow 0.15s;
      display: flex;
      flex-direction: column;
    }
    .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .card-body {
      padding: 1.25rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      min-height: 90px;
    }
    .card-title { font-size: 0.95rem; font-weight: 700; line-height: 1.3; max-width: 70%; }
    .card-icon { font-size: 2.5rem; opacity: 0.5; }
    .card-footer {
      padding: 0.5rem 1rem;
      background: rgba(0,0,0,0.15);
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-gray { background: #607d8b; }
    .card-cyan { background: #00bcd4; }
    .card-red { background: #e53935; }
    .card-green { background: #43a047; }
    .card-dark { background: #37474f; }

    .section-title { color: #1565c0; font-size: 0.95rem; margin-top: 1rem; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 0.5rem 0; }
    .data-row { display: flex; padding: 0.75rem 0; }
    .data-label { font-weight: 700; font-size: 0.85rem; width: 300px; }
    .data-value { font-size: 0.85rem; color: #555; }
    .text-capitalize { text-transform: capitalize; }
  `]
})
export class DashboardComponent implements OnInit {
  org = signal<DatosOrganizacion | null>(null);

  constructor(
    public authService: AuthService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.sharedService.getMiOrganizacion().subscribe({
      next: (datos) => this.org.set(datos),
      error: () => {}
    });
  }
}
