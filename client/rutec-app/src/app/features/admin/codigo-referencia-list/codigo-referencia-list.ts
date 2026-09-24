import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { CodigoReferencia } from '../../../core/models/rutec.models';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-codigo-referencia-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule],
  template: `
    <div class="page-header">
      <h2>ADMINISTRACION - CODIGOS DE REFERENCIA</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-cog" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>CODIGOS DE REFERENCIA</strong><br>
        Administre los codigos de referencia del sistema (tipos de contrato, generos, estados civiles, etc.).
      </div>
    </div>

    <div class="toolbar">
      <div class="filters">
        <p-select
          [options]="grupos()"
          [(ngModel)]="grupoSeleccionado"
          placeholder="Filtrar por grupo"
          [showClear]="true"
          (onChange)="cargar()"
          [style]="{ 'min-width': '200px' }"
        />
      </div>
      <p-button label="Nuevo Codigo" icon="pi pi-plus" severity="success" (click)="abrirDialogNuevo()" />
    </div>

    <p-table
      [value]="codigos()"
      [loading]="loading()"
      [tableStyle]="{'min-width': '50rem'}"
      [paginator]="true"
      [rows]="15"
      [rowsPerPageOptions]="[10, 15, 25, 50]"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} codigos"
      stripedRows
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="codigo">CODIGO <p-sortIcon field="codigo" /></th>
          <th pSortableColumn="nombre">NOMBRE <p-sortIcon field="nombre" /></th>
          <th pSortableColumn="grupo">GRUPO <p-sortIcon field="grupo" /></th>
          <th pSortableColumn="dominio">DOMINIO <p-sortIcon field="dominio" /></th>
          <th pSortableColumn="orden">ORDEN <p-sortIcon field="orden" /></th>
          <th style="width:10rem">ACCIONES</th>
        </tr>
      </ng-template>
      <ng-template #body let-c>
        <tr>
          <td>{{ c.codigo }}</td>
          <td>{{ c.nombre }}</td>
          <td>{{ c.grupo }}</td>
          <td>{{ c.dominio }}</td>
          <td>{{ c.orden }}</td>
          <td>
            <div class="acciones">
              <p-button icon="pi pi-pencil" severity="info" size="small" [rounded]="true" [text]="true" (click)="abrirDialogEditar(c)" />
              <p-button icon="pi pi-trash" severity="danger" size="small" [rounded]="true" [text]="true" (click)="confirmarEliminar(c)" />
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td colspan="6" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron codigos de referencia</td></tr>
      </ng-template>
    </p-table>

    <p-dialog
      [header]="editando ? 'Editar Codigo de Referencia' : 'Nuevo Codigo de Referencia'"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '450px' }"
    >
      <div class="form-grid">
        <div class="form-field">
          <label>Codigo</label>
          <input pInputText [(ngModel)]="form.codigo" style="width:100%" />
        </div>
        <div class="form-field">
          <label>Nombre</label>
          <input pInputText [(ngModel)]="form.nombre" style="width:100%" />
        </div>
        <div class="form-field">
          <label>Grupo</label>
          <input pInputText [(ngModel)]="form.grupo" style="width:100%" />
        </div>
        <div class="form-field">
          <label>Dominio</label>
          <input pInputText [(ngModel)]="form.dominio" style="width:100%" />
        </div>
        <div class="form-field">
          <label>Orden</label>
          <input pInputText [(ngModel)]="form.orden" type="number" style="width:100%" />
        </div>
      </div>
      <ng-template #footer>
        <p-button label="Cancelar" severity="secondary" (click)="dialogVisible = false" />
        <p-button label="Guardar" icon="pi pi-save" (click)="guardar()" [disabled]="!form.codigo || !form.nombre || !form.grupo" />
      </ng-template>
    </p-dialog>

    <p-dialog header="Confirmar Eliminacion" [(visible)]="confirmVisible" [modal]="true" [style]="{ width: '400px' }">
      <p>Esta seguro de eliminar el codigo <strong>{{ codigoAEliminar?.codigo }}</strong> - {{ codigoAEliminar?.nombre }}?</p>
      <ng-template #footer>
        <p-button label="Cancelar" severity="secondary" (click)="confirmVisible = false" />
        <p-button label="Eliminar" icon="pi pi-trash" severity="danger" (click)="eliminar()" />
      </ng-template>
    </p-dialog>
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
    .filters { display: flex; gap: 0.75rem; align-items: center; }
    .acciones { display: flex; gap: 0.25rem; }
    .form-grid { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .form-field { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-field label { font-weight: 600; font-size: 0.85rem; }
  `]
})
export class CodigoReferenciaListComponent implements OnInit {
  private service = inject(AdminService);

  codigos = signal<any[]>([]);
  grupos = signal<string[]>([]);
  loading = signal(false);
  grupoSeleccionado: string | null = null;

  dialogVisible = false;
  confirmVisible = false;
  editando = false;
  editandoId = 0;
  codigoAEliminar: any = null;

  form = { codigo: '', nombre: '', grupo: '', dominio: '', orden: 0 };

  ngOnInit() {
    this.cargar();
    this.cargarGrupos();
  }

  cargar() {
    this.loading.set(true);
    this.service.getCodigosReferencia(this.grupoSeleccionado || undefined).subscribe({
      next: (data) => { this.codigos.set(data); this.loading.set(false); },
      error: () => { this.codigos.set([]); this.loading.set(false); }
    });
  }

  private cargarGrupos() {
    this.service.getCodigosReferencia().subscribe({
      next: (data) => {
        const gruposSet = new Set(data.map((c: any) => c.grupo).filter(Boolean));
        this.grupos.set([...gruposSet].sort());
      }
    });
  }

  abrirDialogNuevo() {
    this.editando = false;
    this.form = { codigo: '', nombre: '', grupo: '', dominio: '', orden: 0 };
    this.dialogVisible = true;
  }

  abrirDialogEditar(c: any) {
    this.editando = true;
    this.editandoId = c.id;
    this.form = { codigo: c.codigo, nombre: c.nombre, grupo: c.grupo, dominio: c.dominio || '', orden: c.orden || 0 };
    this.dialogVisible = true;
  }

  guardar() {
    if (this.editando) {
      this.service.modificarCodigoReferencia(this.editandoId, this.form).subscribe({
        next: () => { this.dialogVisible = false; this.cargar(); }
      });
    } else {
      this.service.crearCodigoReferencia(this.form).subscribe({
        next: () => { this.dialogVisible = false; this.cargar(); this.cargarGrupos(); }
      });
    }
  }

  confirmarEliminar(c: any) {
    this.codigoAEliminar = c;
    this.confirmVisible = true;
  }

  eliminar() {
    if (!this.codigoAEliminar) return;
    this.service.eliminarCodigoReferencia(this.codigoAEliminar.id).subscribe({
      next: () => { this.confirmVisible = false; this.codigoAEliminar = null; this.cargar(); }
    });
  }
}
