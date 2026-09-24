import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TrabajadoresService } from '../../../core/services/trabajadores.service';
import { TrabajadorDetail } from '../../../core/models/rutec.models';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-trabajador-buscar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    InputTextModule, ButtonModule, CardModule,
    IconFieldModule, InputIconModule
  ],
  template: `
    <div class="page-header">
      <h2>BUSCAR TRABAJADOR POR CEDULA</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-search" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>BUSQUEDA RAPIDA</strong><br>
        Ingrese el numero de cedula de extranjeria para buscar un trabajador.
      </div>
    </div>

    <div class="search-bar">
      <p-iconfield iconPosition="left">
        <p-inputicon><i class="pi pi-id-card"></i></p-inputicon>
        <input pInputText [(ngModel)]="cedula" placeholder="Numero de cedula de extranjeria" (keyup.enter)="buscar()" style="width:300px" />
      </p-iconfield>
      <p-button label="Buscar" icon="pi pi-search" (click)="buscar()" [loading]="loading()" />
    </div>

    @if (error()) {
      <div class="error-msg">
        <i class="pi pi-exclamation-triangle"></i> {{ error() }}
      </div>
    }

    @if (trabajador()) {
      <p-card>
        <ng-template #title>
          {{ trabajador()!.primerNombre }} {{ trabajador()!.segundoNombre }}
          {{ trabajador()!.primerApellido }} {{ trabajador()!.segundoApellido }}
        </ng-template>
        <ng-template #subtitle>
          Cedula: {{ trabajador()!.numeroCedulaExtranjeria }}
        </ng-template>
        <div class="detail-grid">
          <div><strong>Genero:</strong> {{ trabajador()!.generoDescripcion }}</div>
          <div><strong>Estado Civil:</strong> {{ trabajador()!.estadoCivilDescripcion }}</div>
          <div><strong>Pais Nacimiento:</strong> {{ trabajador()!.paisNacimientoNombre }}</div>
          <div><strong>Pais Ciudadania:</strong> {{ trabajador()!.paisCiudadaniaNombre }}</div>
          <div><strong>Fecha Nacimiento:</strong> {{ trabajador()!.fechaNacimiento | date:'dd/MM/yyyy' }}</div>
          <div><strong>Tipo Visa:</strong> {{ trabajador()!.tipoVisaDescripcion }}</div>
          <div><strong>Contratos:</strong> {{ trabajador()!.cantidadContratos }}</div>
          <div><strong>Fecha Registro:</strong> {{ trabajador()!.fechaRegistro | date:'dd/MM/yyyy' }}</div>
        </div>
        <div class="card-actions">
          <p-button label="Ver Resumen Completo" icon="pi pi-eye" [routerLink]="['/trabajadores', trabajador()!.id]" />
        </div>
      </p-card>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1rem; }
    .page-header h2 { color: #333; font-size: 1rem; font-weight: 600; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #1565c0; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.25rem;
      background: white; font-size: 0.85rem;
    }
    .search-bar {
      display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1.5rem;
    }
    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 2rem;
      font-size: 0.9rem; margin-bottom: 1rem;
    }
    .card-actions { margin-top: 1rem; }
    .error-msg {
      background: #ffebee; color: #c62828; padding: 0.75rem 1rem;
      border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem;
    }
  `]
})
export class TrabajadorBuscarComponent {
  private service = inject(TrabajadoresService);

  cedula = '';
  trabajador = signal<TrabajadorDetail | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  buscar() {
    if (!this.cedula.trim()) return;
    this.loading.set(true);
    this.error.set(null);
    this.trabajador.set(null);

    this.service.buscarPorCedula(this.cedula.trim()).subscribe({
      next: (data) => {
        this.trabajador.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 404 ? 'No se encontro un trabajador con esa cedula.' : 'Error al buscar el trabajador.');
        this.loading.set(false);
      }
    });
  }
}
