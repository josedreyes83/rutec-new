import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, ContratoFullModificar } from '../../../core/services/admin.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-modificar-fechas',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, MessageModule],
  template: `
    <h3 class="page-title">REGISTRO UNICO DE TRABAJADORES EXTRANJEROS EN COLOMBIA - RUTEC</h3>

    @if (!contrato()) {
      <!-- Pantalla 1: Consultar -->
      <div class="info-bar">
        <i class="pi pi-id-card" style="font-size:1.5rem; color:#1565c0"></i>
        <div><strong>CONSULTAR CONTRATO POR NUMERO!</strong></div>
      </div>

      <h4 class="section-header">MODIFICAR FECHAS DE CONTRATOS</h4>
      <hr>

      <div class="search-form">
        <label class="search-label">Numero de registro de Contrato:</label>
        <input type="number" pInputText [(ngModel)]="numeroContrato" class="search-input" />
        <p-button label="Consultar contrato" severity="info" (onClick)="buscar()" [loading]="buscando()" />
      </div>

      @if (mensaje()) {
        <p-message severity="error" [text]="mensaje()" styleClass="msg-block" />
      }
    } @else {
      <!-- Pantalla 2: Detalle + Modificar -->
      <div class="info-bar">
        <i class="pi pi-id-card" style="font-size:1.5rem; color:#1565c0"></i>
        <div>
          <strong>Detalles del contrato del trabajador extranjero!</strong><br>
          Se muestran los datos referentes al contrato.
        </div>
      </div>

      <h4 class="contrato-id">Datos del contrato: <span class="red">{{ contrato()!.id }}</span></h4>

      <div class="section-label">Datos de la Organizacion</div>
      <table class="detail-table">
        <tr>
          <td class="label">Num. Documento Organizacion</td>
          <td>{{ contrato()!.docOrganizacion || '-' }}</td>
        </tr>
        <tr>
          <td class="label">Nombre de la Organizacion</td>
          <td>{{ contrato()!.nombreOrganizacion || '-' }}</td>
        </tr>
      </table>

      <div class="section-label">Datos del Trabajador</div>
      <table class="detail-table">
        <tr>
          <td class="label">Tipo de documento</td>
          <td>{{ contrato()!.tipoDocumentoTrabajador || '-' }}</td>
        </tr>
        <tr>
          <td class="label">Numero de documento</td>
          <td>{{ contrato()!.numeroDocumentoTrabajador || '-' }}</td>
        </tr>
        <tr>
          <td class="label">Nombre del trabajador</td>
          <td>{{ contrato()!.nombreTrabajador || '-' }}</td>
        </tr>
      </table>

      <div class="section-label">Datos del Contrato</div>
      <table class="detail-table">
        <tr>
          <td class="label">Denominacion del contrato</td>
          <td>{{ contrato()!.denominacionContrato || '-' }}</td>
        </tr>
        <tr>
          <td class="label">Cargo u Oficio a desempeñar</td>
          <td>{{ contrato()!.cargoTrabajador || '-' }}</td>
        </tr>
        <tr>
          <td class="label">Fecha Desde</td>
          <td><p-datepicker [(ngModel)]="vigenciaDesde" dateFormat="dd/mm/yy" [showIcon]="true" /></td>
        </tr>
        <tr>
          <td class="label">Fecha Hasta</td>
          <td><p-datepicker [(ngModel)]="vigenciaHasta" dateFormat="dd/mm/yy" [showIcon]="true" /></td>
        </tr>
      </table>

      <hr>

      <div class="actions-row">
        <p-button label="Regresar" severity="secondary" (onClick)="regresar()" />
        <p-button label="Modificar" severity="warn" (onClick)="modificar()" [loading]="guardando()" />
      </div>

      @if (mensaje()) {
        <p-message [severity]="mensajeSeverity()" [text]="mensaje()" styleClass="msg-block" />
      }
    }
  `,
  styles: [`
    .page-title { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #26c6da; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.25rem;
      background: white; font-size: 0.85rem;
    }
    .section-header { font-weight: 700; font-size: 0.95rem; color: #333; margin-bottom: 0.25rem; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 0.5rem 0 1rem; }
    .search-form {
      display: flex; align-items: center; gap: 1rem; padding: 1rem 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .search-label { font-size: 0.9rem; min-width: 210px; }
    .search-input { width: 250px; }
    .contrato-id { color: #333; font-size: 0.95rem; margin: 1rem 0 0.5rem; }
    .contrato-id .red { color: #c62828; }
    .section-label {
      font-size: 0.85rem; color: #546e7a; margin: 1rem 0 0.5rem;
      padding-bottom: 0.25rem; border-bottom: 1px solid #e0e0e0;
    }
    .detail-table {
      width: 100%; border-collapse: collapse; margin-bottom: 0.5rem;
    }
    .detail-table tr:nth-child(odd) { background: #f5f5f5; }
    .detail-table td {
      padding: 0.6rem 0.75rem; font-size: 0.85rem; border: 1px solid #e0e0e0;
    }
    .detail-table td.label {
      font-weight: 400; color: #333; width: 300px;
    }
    .actions-row {
      display: flex; justify-content: space-between; margin-top: 1rem;
    }
    :host ::ng-deep .msg-block { display: block; margin-top: 1rem; }
  `]
})
export class ModificarFechasComponent {
  private adminService = inject(AdminService);

  numeroContrato: number | null = null;
  contrato = signal<ContratoFullModificar | null>(null);
  buscando = signal(false);
  guardando = signal(false);
  mensaje = signal('');
  mensajeSeverity = signal<'success' | 'error' | 'info' | 'warn'>('info');

  vigenciaDesde: Date | null = null;
  vigenciaHasta: Date | null = null;

  buscar() {
    if (!this.numeroContrato) return;
    this.buscando.set(true);
    this.mensaje.set('');

    this.adminService.getContratoFull(this.numeroContrato).subscribe({
      next: (data) => {
        this.contrato.set(data);
        this.vigenciaDesde = data.vigenciaDesde ? new Date(data.vigenciaDesde) : null;
        this.vigenciaHasta = data.vigenciaHasta ? new Date(data.vigenciaHasta) : null;
        this.buscando.set(false);
      },
      error: () => {
        this.mensaje.set('No se encontro el contrato con ese numero.');
        this.mensajeSeverity.set('error');
        this.buscando.set(false);
      }
    });
  }

  regresar() {
    this.contrato.set(null);
    this.numeroContrato = null;
    this.mensaje.set('');
  }

  modificar() {
    const c = this.contrato();
    if (!c || !this.vigenciaDesde || !this.vigenciaHasta) return;
    this.guardando.set(true);
    this.mensaje.set('');

    const desde = this.vigenciaDesde.toISOString();
    const hasta = this.vigenciaHasta.toISOString();

    this.adminService.modificarFechasContrato(c.id, desde, hasta).subscribe({
      next: () => {
        this.mensaje.set('Fechas actualizadas correctamente.');
        this.mensajeSeverity.set('success');
        this.guardando.set(false);
      },
      error: () => {
        this.mensaje.set('Error al actualizar las fechas del contrato.');
        this.mensajeSeverity.set('error');
        this.guardando.set(false);
      }
    });
  }
}
