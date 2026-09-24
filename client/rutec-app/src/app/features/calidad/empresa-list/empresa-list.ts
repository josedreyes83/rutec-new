import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CalidadService } from '../../../core/services/calidad.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, SelectButtonModule],
  template: `
    <div class="page-header">
      <h2>CALIDAD - VERIFICACION DE EMPRESAS</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-check-circle" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>CONTROL DE CALIDAD</strong><br>
        Revise y apruebe los registros de contratos por empresa.
      </div>
    </div>

    <p-selectbutton [options]="tabOptions" [(ngModel)]="tabSeleccionado" (onChange)="cambiarTab($event.value)" optionLabel="label" optionValue="value" />

    <p-table
      [value]="empresas()"
      [loading]="loading()"
      [tableStyle]="{'min-width': '50rem'}"
      [paginator]="true"
      [rows]="15"
      [rowsPerPageOptions]="[10, 15, 25, 50]"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} empresas"
      stripedRows
      selectionMode="single"
      (onRowSelect)="onRowSelect($event)"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="organizacion">ORGANIZACION <p-sortIcon field="organizacion" /></th>
          <th pSortableColumn="totalContratos">TOTAL CONTRATOS <p-sortIcon field="totalContratos" /></th>
          <th pSortableColumn="pendientes">PENDIENTES <p-sortIcon field="pendientes" /></th>
          <th pSortableColumn="aprobados">APROBADOS <p-sortIcon field="aprobados" /></th>
          <th>ESTADO</th>
        </tr>
      </ng-template>
      <ng-template #body let-e>
        <tr [pSelectableRow]="e" style="cursor:pointer">
          <td>{{ e.organizacion }}</td>
          <td>{{ e.totalContratos }}</td>
          <td>
            @if (e.pendientes > 0) {
              <p-tag [value]="'' + e.pendientes" severity="warn" />
            } @else {
              {{ e.pendientes }}
            }
          </td>
          <td>{{ e.aprobados }}</td>
          <td>
            @if (e.pendientes === 0) {
              <p-tag value="Completa" severity="success" />
            } @else {
              <p-tag value="Pendiente" severity="warn" />
            }
          </td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td colspan="5" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron empresas</td></tr>
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
  `]
})
export class EmpresaListComponent implements OnInit {
  private router = inject(Router);
  private service = inject(CalidadService);

  empresas = signal<any[]>([]);
  loading = signal(false);
  tabActivo = signal<string>('todas');
  tabSeleccionado = 'todas';
  tabOptions = [
    { label: 'Todas', value: 'todas' },
    { label: 'Pendientes', value: 'pendientes' },
    { label: 'Aprobadas', value: 'aprobadas' }
  ];

  ngOnInit() {
    this.cargar();
  }

  cambiarTab(tab: any) {
    this.tabActivo.set(tab);
    this.cargar();
  }

  onRowSelect(event: any) {
    this.router.navigate(['/calidad/empresas', event.data.idOrganizacion, 'contratos']);
  }

  private cargar() {
    this.loading.set(true);
    let obs;
    switch (this.tabActivo()) {
      case 'pendientes': obs = this.service.getEmpresasPendientes(); break;
      case 'aprobadas': obs = this.service.getEmpresasAprobadas(); break;
      default: obs = this.service.getEmpresas(); break;
    }
    obs.subscribe({
      next: (data) => { this.empresas.set(data); this.loading.set(false); },
      error: () => { this.empresas.set([]); this.loading.set(false); }
    });
  }
}
