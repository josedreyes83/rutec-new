import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrabajadoresService } from '../../../core/services/trabajadores.service';
import { PaginatedList, TrabajadorList } from '../../../core/models/rutec.models';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-trabajador-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, InputTextModule, ButtonModule,
    IconFieldModule, InputIconModule
  ],
  template: `
    <div class="page-header">
      <h2>REGISTRO UNICO DE TRABAJADORES EXTRANJEROS EN COLOMBIA - TRABAJADORES</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-users" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>GESTIONAR TRABAJADORES</strong><br>
        Consulte, registre y administre la informacion de los trabajadores extranjeros.
      </div>
    </div>

    <div class="toolbar">
      <div class="filters">
        <p-iconfield iconPosition="left">
          <p-inputicon><i class="pi pi-id-card"></i></p-inputicon>
          <input pInputText [(ngModel)]="filtroCedula" placeholder="Cedula / Documento" (keyup.enter)="buscar()" />
        </p-iconfield>
        <p-iconfield iconPosition="left">
          <p-inputicon><i class="pi pi-search"></i></p-inputicon>
          <input pInputText [(ngModel)]="filtroNombre" placeholder="Nombre del trabajador" (keyup.enter)="buscar()" />
        </p-iconfield>
        <p-button label="Buscar" icon="pi pi-search" (click)="buscar()" />
      </div>
      <p-button label="Registrar Trabajador" icon="pi pi-plus" severity="success" (click)="irARegistrar()" />
    </div>

    <p-table
      [value]="data()?.items || []"
      [paginator]="true"
      [rows]="pageSize"
      [totalRecords]="data()?.totalCount || 0"
      [loading]="loading()"
      [rowsPerPageOptions]="[10, 25, 50]"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
      [tableStyle]="{'min-width': '60rem'}"
      [lazy]="true"
      (onLazyLoad)="onLazyLoad($event)"
      [first]="(page - 1) * pageSize"
      stripedRows
      selectionMode="single"
      (onRowSelect)="onRowSelect($event)"
    >
      <ng-template #header>
        <tr>
          <th>CEDULA / DOCUMENTO</th>
          <th>NOMBRE COMPLETO</th>
          <th>GENERO</th>
          <th>PAIS NACIMIENTO</th>
          <th>FECHA REGISTRO</th>
        </tr>
      </ng-template>
      <ng-template #body let-t>
        <tr [pSelectableRow]="t" style="cursor:pointer">
          <td>{{ t.numeroCedulaExtranjeria }}</td>
          <td>{{ t.primerNombre }} {{ t.segundoNombre }} {{ t.primerApellido }} {{ t.segundoApellido }}</td>
          <td>{{ t.generoDescripcion }}</td>
          <td>{{ t.paisNacimientoNombre }}</td>
          <td>{{ t.fechaRegistro | date:'dd/MM/yyyy' }}</td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td colspan="5" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron trabajadores</td></tr>
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
    .toolbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;
    }
    .filters {
      display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;
    }
  `]
})
export class TrabajadorListComponent {
  private router = inject(Router);
  private service = inject(TrabajadoresService);

  data = signal<PaginatedList<TrabajadorList> | null>(null);
  loading = signal(false);
  filtroCedula = '';
  filtroNombre = '';
  page = 1;
  pageSize = 10;

  buscar() {
    this.page = 1;
    this.cargar();
  }

  onLazyLoad(event: any) {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.cargar();
  }

  onRowSelect(event: any) {
    this.router.navigate(['/trabajadores', event.data.id]);
  }

  irARegistrar() {
    this.router.navigate(['/trabajadores/registrar']);
  }

  private cargar() {
    this.loading.set(true);
    this.service.getAll({
      cedula: this.filtroCedula || undefined,
      nombre: this.filtroNombre || undefined,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: (data) => { this.data.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
