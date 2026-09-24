import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CertificadosService } from '../../../core/services/certificados.service';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-certificado-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, InputTextModule, ButtonModule,
    IconFieldModule, InputIconModule
  ],
  template: `
    <div class="page-header">
      <h2>CERTIFICADOS - CONSTANCIAS LABORALES</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-file-check" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>GENERAR CONSTANCIAS</strong><br>
        Busque un trabajador por su ID o cedula para generar constancias de sus contratos registrados.
      </div>
    </div>

    <div class="toolbar">
      <div class="filters">
        <p-iconfield iconPosition="left">
          <p-inputicon><i class="pi pi-id-card"></i></p-inputicon>
          <input pInputText [(ngModel)]="filtroBusqueda" placeholder="ID Trabajador o Cedula" (keyup.enter)="buscar()" />
        </p-iconfield>
        <p-button label="Buscar" icon="pi pi-search" (click)="buscar()" />
      </div>
    </div>

    @if (buscado()) {
      <p-table
        [value]="contratos()"
        [loading]="loading()"
        [tableStyle]="{'min-width': '50rem'}"
        stripedRows
      >
        <ng-template #header>
          <tr>
            <th>CONTRATO</th>
            <th>CARGO</th>
            <th>TIPO</th>
            <th>VIGENCIA DESDE</th>
            <th>VIGENCIA HASTA</th>
            <th style="width:10rem">ACCIONES</th>
          </tr>
        </ng-template>
        <ng-template #body let-c>
          <tr>
            <td>{{ c.denominacionContrato }}</td>
            <td>{{ c.cargoTrabajador }}</td>
            <td>{{ c.tipoContratoDescripcion }}</td>
            <td>{{ c.vigenciaDesde | date:'dd/MM/yyyy' }}</td>
            <td>{{ c.vigenciaHasta | date:'dd/MM/yyyy' }}</td>
            <td>
              <p-button
                label="Descargar"
                icon="pi pi-download"
                severity="success"
                size="small"
                [loading]="descargandoId() === c.id"
                (click)="descargar(c.id)"
              />
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr><td colspan="6" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron contratos para este trabajador</td></tr>
        </ng-template>
      </p-table>
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
    .toolbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;
    }
    .filters {
      display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;
    }
  `]
})
export class CertificadoListComponent {
  private router = inject(Router);
  private service = inject(CertificadosService);

  contratos = signal<any[]>([]);
  loading = signal(false);
  buscado = signal(false);
  descargandoId = signal<number | null>(null);
  filtroBusqueda = '';

  buscar() {
    const valor = this.filtroBusqueda.trim();
    if (!valor) return;

    this.loading.set(true);
    this.buscado.set(true);
    const id = parseInt(valor, 10);
    if (isNaN(id)) return;

    this.service.getByTrabajador(id).subscribe({
      next: (data) => { this.contratos.set(data); this.loading.set(false); },
      error: () => { this.contratos.set([]); this.loading.set(false); }
    });
  }

  descargar(contratoId: number) {
    this.descargandoId.set(contratoId);
    this.service.descargarConstancia(contratoId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `constancia_${contratoId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.descargandoId.set(null);
      },
      error: () => this.descargandoId.set(null)
    });
  }
}
