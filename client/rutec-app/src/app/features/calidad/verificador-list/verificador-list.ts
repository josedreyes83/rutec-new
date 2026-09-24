import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CalidadService, VerificadorGestion } from '../../../core/services/calidad.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-verificador-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule, InputTextModule],
  template: `
    <h3 class="page-title">REGISTRO UNICO DE TRABAJADORES EXTRANJEROS EN COLOMBIA - RUTEC</h3>

    <div class="info-bar">
      <i class="pi pi-id-card" style="font-size:1.5rem; color:#1565c0"></i>
      <div><strong>CONSULTAR USUARIOS VERIFICADORES!</strong></div>
    </div>

    <div class="section-header">
      <h4>USUARIOS DE GESTION</h4>
      <a routerLink="/calidad/asignar-revisor" class="p-button p-button-success">
        <i class="pi pi-plus"></i> Asignar revisores a los contratos
      </a>
    </div>

    <p-table
      #dt
      [value]="verificadores()"
      [loading]="loading()"
      [paginator]="true"
      [rows]="10"
      [rowsPerPageOptions]="[10, 25, 50]"
      [globalFilterFields]="['usuarioRegistro']"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
      stripedRows
      styleClass="p-datatable-sm"
    >
      <ng-template #caption>
        <div class="table-header">
          <span>Buscar:</span>
          <input type="text" pInputText placeholder="Buscar verificador..." (input)="dt.filterGlobal($any($event.target).value, 'contains')" class="search-input" />
        </div>
      </ng-template>
      <ng-template #header>
        <tr>
          <th pSortableColumn="usuarioRegistro">Usuario para revision <p-sortIcon field="usuarioRegistro" /></th>
          <th pSortableColumn="registrosTotales">Registros asignados <p-sortIcon field="registrosTotales" /></th>
          <th pSortableColumn="registrosProcesados">Registros gestionados <p-sortIcon field="registrosProcesados" /></th>
          <th pSortableColumn="registrosPendientes">Registros pendientes <p-sortIcon field="registrosPendientes" /></th>
          <th>Opciones</th>
        </tr>
      </ng-template>
      <ng-template #body let-v>
        <tr>
          <td>{{ v.usuarioRegistro }}</td>
          <td>{{ v.registrosTotales }}</td>
          <td>{{ v.registrosProcesados }}</td>
          <td>
            @if (v.registrosPendientes > 0) {
              <p-tag [value]="'' + v.registrosPendientes" severity="warn" />
            } @else {
              {{ v.registrosPendientes }}
            }
          </td>
          <td>
            <p-button label="Ver Detalle" icon="pi pi-eye" severity="info" size="small" (click)="verDetalle(v)" />
          </td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td colspan="5" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron verificadores</td></tr>
      </ng-template>
    </p-table>
  `,
  styles: [`
    .page-title { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #1565c0; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.25rem;
      background: white; font-size: 0.85rem;
    }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1rem;
    }
    .section-header h4 { font-size: 0.95rem; font-weight: 700; color: #333; }
    .table-header { display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; }
    .search-input { padding: 0.4rem 0.6rem; font-size: 0.85rem; width: 250px; }
    .p-button-success {
      background: #43a047; border: none; color: white; padding: 0.5rem 1rem;
      border-radius: 4px; text-decoration: none; font-size: 0.85rem;
      display: flex; align-items: center; gap: 0.5rem;
    }
  `]
})
export class VerificadorListComponent implements OnInit {
  private service = inject(CalidadService);
  private router = inject(Router);
  verificadores = signal<VerificadorGestion[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loading.set(true);
    this.service.getVerificadores().subscribe({
      next: (data) => { this.verificadores.set(data); this.loading.set(false); },
      error: () => { this.verificadores.set([]); this.loading.set(false); }
    });
  }

  verDetalle(v: VerificadorGestion) {
    this.router.navigate(['/calidad/verificadores', v.usuarioRegistro]);
  }
}
