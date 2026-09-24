import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empresa-rutec-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule],
  template: `
    <div class="page-header">
      <h2>ADMINISTRACION - EMPRESAS RUTEC</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-building" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>EMPRESAS REGISTRADAS EN RUTEC</strong><br>
        Consulte las empresas que han registrado trabajadores extranjeros.
      </div>
    </div>

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
          <th pSortableColumn="idOrganizacion">ID ORGANIZACION <p-sortIcon field="idOrganizacion" /></th>
          <th pSortableColumn="nombreOrganizacion">ORGANIZACION <p-sortIcon field="nombreOrganizacion" /></th>
          <th pSortableColumn="cantTrabajadores">CANT. TRABAJADORES <p-sortIcon field="cantTrabajadores" /></th>
          <th pSortableColumn="cantContratos">CANT. CONTRATOS <p-sortIcon field="cantContratos" /></th>
          <th pSortableColumn="fechaPrimerRegistro">FECHA PRIMER REGISTRO <p-sortIcon field="fechaPrimerRegistro" /></th>
        </tr>
      </ng-template>
      <ng-template #body let-e>
        <tr [pSelectableRow]="e" style="cursor:pointer">
          <td>{{ e.idOrganizacion }}</td>
          <td>{{ e.nombreOrganizacion }}</td>
          <td>{{ e.cantTrabajadores }}</td>
          <td>{{ e.cantContratos }}</td>
          <td>{{ e.fechaPrimerRegistro | date:'dd/MM/yyyy' }}</td>
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
  `]
})
export class EmpresaRutecListComponent implements OnInit {
  private router = inject(Router);
  private service = inject(AdminService);

  empresas = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.cargar();
  }

  onRowSelect(event: any) {
    this.router.navigate(['/admin/empresas', event.data.idOrganizacion, 'contratos']);
  }

  private cargar() {
    this.loading.set(true);
    this.service.getEmpresas().subscribe({
      next: (data) => { this.empresas.set(data); this.loading.set(false); },
      error: () => { this.empresas.set([]); this.loading.set(false); }
    });
  }
}
