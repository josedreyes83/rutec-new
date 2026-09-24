import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-eliminacion-masiva',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, SelectButtonModule, ConfirmDialogModule, InputTextModule],
  providers: [ConfirmationService],
  template: `
    <h3 class="page-title">REGISTRO UNICO DE TRABAJADORES EXTRANJEROS EN COLOMBIA - RUTEC</h3>

    <div class="info-bar">
      <i class="pi pi-id-card" style="font-size:1.5rem; color:#1565c0"></i>
      <div><strong>Contratos cargados en el aplicativo</strong></div>
    </div>

    <h4 class="section-title">Contratos de prueba cargados en el aplicativo</h4>

    <p-selectbutton
      [options]="tabOptions"
      [(ngModel)]="tabActivo"
      (onChange)="cargar()"
      optionLabel="label"
      optionValue="value"
    />

    <p-table
      #dt
      [value]="registros()"
      [loading]="loading()"
      [paginator]="true"
      [rows]="10"
      [rowsPerPageOptions]="[10, 25, 50]"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
      [globalFilterFields]="['docOrganizacion','nombreOrganizacion','docTrabajador','trabajador','usuarioRegistro','cedula','nombre','numeroDocumento','nombreTrabajador','idioma','nivelEducativo']"
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
          @if (tabActivo === 'contratos') {
            <th>Num. de documento organizacion</th>
            <th>Nombres organizacion</th>
            <th>Num. de documento trabajador</th>
            <th>Trabajador</th>
            <th>Usuario Registro</th>
            <th>Opciones</th>
          }
          @if (tabActivo === 'trabajadores') {
            <th>Numero de documento</th>
            <th>Nombre del trabajador</th>
            <th>Usuario Registro</th>
            <th>Opciones</th>
          }
          @if (tabActivo === 'idiomas') {
            <th>Numero de Documento</th>
            <th>Nombre del trabajador</th>
            <th>Idioma</th>
            <th>Usuario Registro</th>
            <th>Opciones</th>
          }
          @if (tabActivo === 'niveles') {
            <th>Num. de documento</th>
            <th>Nombre del trabajador</th>
            <th>Nivel Educativo</th>
            <th>Usuario Registro</th>
            <th>Opciones</th>
          }
        </tr>
      </ng-template>
      <ng-template #body let-r>
        <tr>
          @if (tabActivo === 'contratos') {
            <td>{{ r.docOrganizacion }}</td>
            <td>{{ r.nombreOrganizacion }}</td>
            <td>{{ r.docTrabajador }}</td>
            <td>{{ r.trabajador }}</td>
            <td>{{ r.usuarioRegistro }}</td>
            <td><p-button label="Eliminar" severity="danger" size="small" (click)="eliminar(r)" /></td>
          }
          @if (tabActivo === 'trabajadores') {
            <td>{{ r.cedula }}</td>
            <td>{{ r.nombre }}</td>
            <td>{{ r.usuarioRegistro }}</td>
            <td><p-button label="Eliminar" severity="danger" size="small" (click)="eliminar(r)" /></td>
          }
          @if (tabActivo === 'idiomas') {
            <td>{{ r.numeroDocumento }}</td>
            <td>{{ r.nombreTrabajador }}</td>
            <td>{{ r.idioma }}</td>
            <td>{{ r.usuarioRegistro }}</td>
            <td><p-button label="Eliminar" severity="danger" size="small" (click)="eliminar(r)" /></td>
          }
          @if (tabActivo === 'niveles') {
            <td>{{ r.numeroDocumento }}</td>
            <td>{{ r.nombreTrabajador }}</td>
            <td>{{ r.nivelEducativo }}</td>
            <td>{{ r.usuarioRegistro }}</td>
            <td><p-button label="Eliminar" severity="danger" size="small" (click)="eliminar(r)" /></td>
          }
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td [attr.colspan]="tabActivo === 'contratos' ? 6 : tabActivo === 'trabajadores' ? 4 : 5" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron registros</td></tr>
      </ng-template>
    </p-table>

    <p-confirmDialog />
  `,
  styles: [`
    .table-header { display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; }
    .search-input { padding: 0.4rem 0.6rem; font-size: 0.85rem; width: 250px; }
    .page-title { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #1565c0; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.25rem;
      background: white; font-size: 0.85rem;
    }
    .section-title { font-size: 0.95rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    :host ::ng-deep .p-selectbutton { margin-bottom: 1rem; }
  `]
})
export class EliminacionMasivaComponent implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private confirmService = inject(ConfirmationService);

  tabActivo = 'contratos';
  tabOptions = [
    { label: 'Eliminar Contratos', value: 'contratos' },
    { label: 'Eliminar Trabajadores', value: 'trabajadores' },
    { label: 'Eliminar Idiomas', value: 'idiomas' },
    { label: 'Eliminar Niveles de Estudios', value: 'niveles' }
  ];

  registros = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    let url = '';
    switch (this.tabActivo) {
      case 'contratos': url = `${this.api.baseUrl}/admin/eliminacion/contratos`; break;
      case 'trabajadores': url = `${this.api.baseUrl}/admin/eliminacion/trabajadores`; break;
      case 'idiomas': url = `${this.api.baseUrl}/admin/eliminacion/idiomas`; break;
      case 'niveles': url = `${this.api.baseUrl}/admin/eliminacion/niveles`; break;
    }
    this.http.get<any[]>(url).subscribe({
      next: (data) => { this.registros.set(data); this.loading.set(false); },
      error: () => { this.registros.set([]); this.loading.set(false); }
    });
  }

  eliminar(registro: any) {
    this.confirmService.confirm({
      message: 'Esta seguro de eliminar este registro? Esta accion es irreversible.',
      header: 'Confirmar Eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        let url = '';
        switch (this.tabActivo) {
          case 'contratos': url = `${this.api.baseUrl}/admin/eliminacion/contratos/${registro.id}`; break;
          case 'trabajadores': url = `${this.api.baseUrl}/admin/eliminacion/trabajadores/${registro.id}`; break;
          case 'idiomas': url = `${this.api.baseUrl}/admin/eliminacion/idiomas/${registro.id}`; break;
          case 'niveles': url = `${this.api.baseUrl}/admin/eliminacion/niveles/${registro.id}`; break;
        }
        this.http.delete(url).subscribe({
          next: () => this.cargar(),
          error: () => this.cargar()
        });
      }
    });
  }
}
