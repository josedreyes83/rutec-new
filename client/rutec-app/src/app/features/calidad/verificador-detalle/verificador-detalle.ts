import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-verificador-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, ConfirmDialogModule, InputTextModule],
  providers: [ConfirmationService],
  template: `
    <h3 class="page-title">REGISTRO UNICO DE TRABAJADORES EXTRANJEROS EN COLOMBIA - RUTEC</h3>

    <div class="info-bar">
      <i class="pi pi-id-card" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>CONSULTAR REGISTROS!</strong><br>
        Informacion sobre los trabajadores extranjeros cargados en el aplicativo.
      </div>
    </div>

    <h4 class="section-title">REGISTROS DE EXTRANJEROS ALMACENADOS EN EL APLICATIVO</h4>
    <p class="verificador-label">Usuario Verificador: <strong class="text-primary">{{ usuario }}</strong></p>

    <p-table
      #dt
      [value]="registros()"
      [loading]="loading()"
      [paginator]="true"
      [rows]="10"
      [rowsPerPageOptions]="[10, 25, 50]"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
      [globalFilterFields]="['contratoId','nombreOrganizacion','docTrabajador','nombreTrabajador','motivos']"
      stripedRows
      styleClass="p-datatable-sm"
    >
      <ng-template #caption>
        <div class="table-header">
          <span>Buscar:</span>
          <input type="text" pInputText placeholder="Buscar..." (input)="dt.filterGlobal($any($event.target).value, 'contains')" class="search-input" />
        </div>
      </ng-template>
      <ng-template #header>
        <tr>
          <th pSortableColumn="contratoId">Num. de contrato <p-sortIcon field="contratoId" /></th>
          <th pSortableColumn="nombreOrganizacion">Nombre de la organizacion <p-sortIcon field="nombreOrganizacion" /></th>
          <th pSortableColumn="docTrabajador">Num. documento de trabajador <p-sortIcon field="docTrabajador" /></th>
          <th pSortableColumn="nombreTrabajador">Nombre del trabajador <p-sortIcon field="nombreTrabajador" /></th>
          <th pSortableColumn="fechaGestion">Fecha de Gestion <p-sortIcon field="fechaGestion" /></th>
          <th>Motivos</th>
          <th>Respuesta</th>
        </tr>
      </ng-template>
      <ng-template #body let-r>
        <tr>
          <td>{{ r.contratoId }}</td>
          <td>{{ r.nombreOrganizacion }}</td>
          <td>{{ r.docTrabajador }}</td>
          <td>{{ r.nombreTrabajador }}</td>
          <td>{{ r.fechaGestion }}</td>
          <td>{{ r.motivos }}</td>
          <td>
            @if (r.alertaDias) {
              <span class="text-danger"><strong>Tiempo Agotado</strong></span>
            }
            @if (r.alertaModificado) {
              <span class="text-success"><strong>Ha Hecho Cambios</strong></span>
            }
            @if (r.verificado) {
              <p-button label="Quitar" severity="warn" size="small" (click)="quitar(r)" />
            }
          </td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td colspan="7" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron registros</td></tr>
      </ng-template>
    </p-table>

    <hr>
    <a routerLink="/calidad/verificadores" class="back-link">Regresar</a>

    <p-confirmDialog />
  `,
  styles: [`
    .page-title { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #1565c0; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.25rem;
      background: white; font-size: 0.85rem;
    }
    .section-title { font-size: 0.95rem; font-weight: 700; color: #333; margin-bottom: 0.5rem; }
    .text-danger { color: #c62828; font-size: 0.85rem; }
    .text-success { color: #2e7d32; font-size: 0.85rem; }
    .verificador-label { font-size: 0.9rem; margin-bottom: 1rem; }
    .text-primary { color: #1565c0; }
    .back-link { color: #37474f; text-decoration: none; font-size: 0.85rem; border: 1px solid #ccc; padding: 0.4rem 1rem; border-radius: 4px; }
    .back-link:hover { background: #f5f5f5; }
    .table-header { display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; }
    .search-input { padding: 0.4rem 0.6rem; font-size: 0.85rem; width: 250px; }
  `]
})
export class VerificadorDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private confirmService = inject(ConfirmationService);

  usuario = '';
  registros = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.usuario = this.route.snapshot.paramMap.get('usuario') || '';
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.http.get<any[]>(`${this.api.baseUrl}/calidad/verificador/${this.usuario}/contratos`).subscribe({
      next: (data) => { this.registros.set(data); this.loading.set(false); },
      error: () => { this.registros.set([]); this.loading.set(false); }
    });
  }

  quitar(r: any) {
    this.confirmService.confirm({
      message: `Quitar verificacion del contrato ${r.contratoId}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Quitar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.http.delete(`${this.api.baseUrl}/calidad/verificacion/${r.verificacionId}`).subscribe({
          next: () => this.cargar(),
          error: () => this.cargar()
        });
      }
    });
  }
}
