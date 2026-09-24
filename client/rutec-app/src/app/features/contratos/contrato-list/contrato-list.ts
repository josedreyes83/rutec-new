import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ContratosService } from '../../../core/services/contratos.service';
import { ContratoList } from '../../../core/models/rutec.models';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-contrato-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule],
  template: `
    <div class="page-header">
      <h2>CONTRATOS DEL TRABAJADOR</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-file-edit" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>CONTRATOS REGISTRADOS</strong><br>
        Listado de contratos asociados al trabajador extranjero.
      </div>
    </div>

    <div class="actions-bar">
      <p-button label="Agregar Contrato" icon="pi pi-plus" (click)="agregarContrato()" />
      <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (click)="volver()" />
    </div>

    <p-table
      [value]="contratos()"
      [loading]="loading()"
      [paginator]="contratos().length > 10"
      [rows]="10"
      [rowsPerPageOptions]="[10, 25, 50]"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
      [tableStyle]="{'min-width': '50rem'}"
      selectionMode="single"
      (onRowSelect)="onRowSelect($event)"
      stripedRows
    >
      <ng-template #header>
        <tr>
          <th>DENOMINACION</th>
          <th>CARGO</th>
          <th>VIGENCIA DESDE</th>
          <th>VIGENCIA HASTA</th>
          <th>ESTADO</th>
        </tr>
      </ng-template>
      <ng-template #body let-contrato>
        <tr [pSelectableRow]="contrato" style="cursor: pointer">
          <td>{{ contrato.denominacionContrato }}</td>
          <td>{{ contrato.cargoTrabajador }}</td>
          <td>{{ contrato.vigenciaDesde | date:'dd/MM/yyyy' }}</td>
          <td>{{ contrato.vigenciaHasta | date:'dd/MM/yyyy' }}</td>
          <td>
            <p-tag [value]="getEstadoLabel(contrato)" [severity]="getEstadoSeverity(contrato)" />
          </td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr>
          <td colspan="5" style="text-align:center; padding:2rem; color:#90a4ae;">
            No se encontraron contratos para este trabajador
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
  styles: [`
    .page-header { margin-bottom: 1rem; }
    .page-header h2 { color: #333; font-size: 1rem; font-weight: 600; }
    .info-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 2px solid #1565c0;
      border-radius: 8px;
      padding: 0.75rem 1.25rem;
      margin-bottom: 1.25rem;
      background: white;
      font-size: 0.85rem;
    }
    .actions-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
  `]
})
export class ContratoListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contratosService = inject(ContratosService);

  contratos = signal<ContratoList[]>([]);
  loading = signal(false);
  trabajadorId = 0;

  ngOnInit() {
    this.trabajadorId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.contratosService.getByTrabajador(this.trabajadorId).subscribe({
      next: (data) => { this.contratos.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getEstadoLabel(contrato: ContratoList): string {
    if (contrato.eliminado) return 'ELIMINADO';
    if (contrato.aclaracion) return 'ACLARACION';
    return 'VIGENTE';
  }

  getEstadoSeverity(contrato: ContratoList): 'success' | 'danger' | 'warn' {
    if (contrato.eliminado) return 'danger';
    if (contrato.aclaracion) return 'warn';
    return 'success';
  }

  onRowSelect(event: any) {
    const contrato = event.data as ContratoList;
    this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos', contrato.id]);
  }

  agregarContrato() {
    this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos', 'agregar']);
  }

  volver() {
    this.router.navigate(['/trabajadores', this.trabajadorId]);
  }
}
