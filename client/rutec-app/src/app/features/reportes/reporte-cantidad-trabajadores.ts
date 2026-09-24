import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ReportesService, ReporteItem } from '../../core/services/reportes.service';

@Component({
  selector: 'app-reporte-cantidad-trabajadores',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, InputTextModule],
  template: `
    <h3 class="page-title">REGISTRO UNICO DE TRABAJADORES EXTRANJEROS EN COLOMBIA - RUTEC</h3>
    <div class="info-bar">
      <i class="pi pi-id-card" style="font-size:1.5rem; color:#1565c0"></i>
      <div><strong>Reportes y estadisticas del RUTEC</strong></div>
    </div>

    <h2>Reporte Cantidad de Trabajadores</h2>
    <div style="margin-bottom:1rem">
      <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (click)="exportar()" />
    </div>
    <div style="margin-bottom:0.5rem">
      <span class="p-input-icon-left">
        <i class="pi pi-search"></i>
        <input pInputText type="text" placeholder="Buscar:" (input)="dt.filterGlobal($any($event.target).value, 'contains')" />
      </span>
    </div>
    <p-table #dt [value]="data()" [loading]="loading()" [paginator]="true" [rows]="20"
             [globalFilterFields]="['categoria']" styleClass="p-datatable-sm">
      <ng-template #header>
        <tr><th>Categoria</th><th>Cantidad</th></tr>
      </ng-template>
      <ng-template #body let-item>
        <tr><td>{{ item.categoria }}</td><td>{{ item.cantidad }}</td></tr>
      </ng-template>
    </p-table>

    <hr>
    <a routerLink="/reportes" class="back-link">Regresar</a>
  `,
  styles: [`
    .page-title { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #26c6da; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.25rem;
      background: white; font-size: 0.85rem;
    }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 1rem 0; }
    .back-link {
      color: #37474f; text-decoration: none; font-size: 0.85rem;
      border: 1px solid #ccc; padding: 0.4rem 1rem; border-radius: 4px;
    }
    .back-link:hover { background: #f5f5f5; }
  `]
})
export class ReporteCantidadTrabajadoresComponent implements OnInit {
  private reportesService = inject(ReportesService);
  data = signal<ReporteItem[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.reportesService.getCantidadTrabajadores().subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  exportar() {
    this.reportesService.exportarExcel('cantidad-trabajadores').subscribe((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte-cantidad-trabajadores.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
