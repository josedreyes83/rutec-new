import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CalidadService, ContratoGestion } from '../../../core/services/calidad.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-contratos-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, SelectButtonModule, InputTextModule],
  template: `
    <div class="page-header">
      <h2>CONTRATOS EN GESTION!</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-info-circle" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>GESTION DE ACLARACION</strong><br>
        Consulte los contratos segun su estado de aclaracion: por aclarar, aclarada o pendiente.
      </div>
    </div>

    <p-selectbutton
      [options]="tabOptions"
      [(ngModel)]="tabSeleccionado"
      (onChange)="cambiarTab($event.value)"
      optionLabel="label"
      optionValue="value"
    />

    <p-table
      #dt
      [value]="contratos()"
      [loading]="loading()"
      [tableStyle]="{'min-width': '60rem'}"
      [paginator]="true"
      [rows]="15"
      [rowsPerPageOptions]="[10, 15, 25, 50]"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} contratos"
      [globalFilterFields]="['contratoId','nombreOrganizacion','docTrabajador','nombreTrabajador','motivosTexto']"
      stripedRows
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
          @if (tabSeleccionado === 'pendiente') {
            <th pSortableColumn="fechaGestion">Fecha de Gestion <p-sortIcon field="fechaGestion" /></th>
            <th>Motivos</th>
          } @else {
            <th pSortableColumn="cantidadIdiomas">Idiomas <p-sortIcon field="cantidadIdiomas" /></th>
            <th pSortableColumn="cantidadEstudios">Estudios <p-sortIcon field="cantidadEstudios" /></th>
          }
          <th>Opciones</th>
        </tr>
      </ng-template>
      <ng-template #body let-c>
        <tr>
          <td>{{ c.contratoId }}</td>
          <td>{{ c.nombreOrganizacion }}</td>
          <td>{{ c.docTrabajador }}</td>
          <td>{{ c.nombreTrabajador }}</td>
          @if (tabSeleccionado === 'pendiente') {
            <td>{{ c.fechaGestion | date:'dd/MM/yyyy HH:mm' }}</td>
            <td class="motivos-cell">{{ c.motivosTexto || '-' }}</td>
            <td>
              <div class="opciones-cell">
                @if (c.alertaDias) {
                  <span class="text-danger"><strong>Tiempo Agotado</strong></span>
                }
                @if (c.alertaModificado) {
                  <p-button label="Ver Cambios" icon="pi pi-refresh" severity="success" size="small" (onClick)="verDetalle(c)" />
                }
                <p-button label="Ver Detalles" icon="pi pi-eye" severity="info" [text]="true" size="small" (onClick)="verDetalle(c)" />
              </div>
            </td>
          } @else {
            <td>{{ c.cantidadIdiomas }}</td>
            <td>{{ c.cantidadEstudios }}</td>
            <td>
              <p-button label="Ver Detalles" icon="pi pi-eye" severity="info" [text]="true" size="small" (onClick)="verDetalle(c)" />
            </td>
          }
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td colspan="7" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron contratos</td></tr>
      </ng-template>
    </p-table>
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
    :host ::ng-deep .p-selectbutton { margin-bottom: 1rem; }
    .table-header { display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; }
    .search-input { padding: 0.4rem 0.6rem; font-size: 0.85rem; width: 250px; }
    .text-danger { color: #c62828; font-size: 0.85rem; }
    .text-muted { color: #90a4ae; font-size: 0.85rem; }
    .motivos-cell { font-size: 0.75rem; text-transform: capitalize; max-width: 200px; }
    .opciones-cell { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
  `]
})
export class ContratosGestionComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(CalidadService);

  contratos = signal<ContratoGestion[]>([]);
  loading = signal(false);
  verificador: string | null = null;
  tabSeleccionado = 'por-aclarar';
  tabOptions = [
    { label: 'Informacion por aclarar', value: 'por-aclarar' },
    { label: 'Informacion aclarada', value: 'aclarada' },
    { label: 'Informacion pendiente aclaracion', value: 'pendiente' }
  ];

  ngOnInit() {
    this.verificador = this.route.snapshot.queryParamMap.get('verificador');
    this.cargar();
  }

  cambiarTab(tab: string) {
    this.tabSeleccionado = tab;
    this.cargar();
  }

  verDetalle(c: ContratoGestion) {
    this.router.navigate(['/calidad/contrato-detalle', c.contratoId]);
  }

  private cargar() {
    this.loading.set(true);
    this.service.getContratosGestion(this.tabSeleccionado, this.verificador ?? undefined).subscribe({
      next: (data) => { this.contratos.set(data); this.loading.set(false); },
      error: () => { this.contratos.set([]); this.loading.set(false); }
    });
  }
}
