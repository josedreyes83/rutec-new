import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CalidadService } from '../../../core/services/calidad.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-empresa-contratos',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, DialogModule, TextareaModule],
  template: `
    <div class="page-header">
      <h2>CALIDAD - CONTRATOS DE EMPRESA</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-list-check" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>VERIFICACION DE CONTRATOS</strong><br>
        Revise cada contrato y apruebe o solicite aclaracion segun corresponda.
      </div>
    </div>

    <p-table
      [value]="contratos()"
      [loading]="loading()"
      [tableStyle]="{'min-width': '70rem'}"
      [paginator]="true"
      [rows]="15"
      [rowsPerPageOptions]="[10, 15, 25, 50]"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} contratos"
      stripedRows
    >
      <ng-template #header>
        <tr>
          <th>TRABAJADOR</th>
          <th>CEDULA</th>
          <th>CARGO</th>
          <th>VIGENCIA</th>
          <th>ACLARACION</th>
          <th>ALERTAS</th>
          <th style="width:14rem">ACCIONES</th>
        </tr>
      </ng-template>
      <ng-template #body let-c>
        <tr>
          <td>{{ c.trabajadorNombre }}</td>
          <td>{{ c.trabajadorCedula }}</td>
          <td>{{ c.cargoTrabajador }}</td>
          <td>{{ c.vigenciaDesde | date:'dd/MM/yyyy' }} - {{ c.vigenciaHasta | date:'dd/MM/yyyy' }}</td>
          <td>
            @if (c.aclaracion) {
              <p-tag [value]="c.aclaracion" severity="warn" />
            } @else {
              <span style="color:#90a4ae">-</span>
            }
          </td>
          <td>
            @if (c.eliminado) {
              <i class="pi pi-exclamation-triangle" style="color:#c62828" pTooltip="Contrato eliminado"></i>
            }
            @if (c.vigenciaVencida) {
              <i class="pi pi-clock" style="color:#e65100" pTooltip="Vigencia vencida"></i>
            }
            @if (!c.eliminado && !c.vigenciaVencida) {
              <i class="pi pi-check" style="color:#2e7d32"></i>
            }
          </td>
          <td>
            <div class="acciones">
              <p-button
                label="Aprobar"
                icon="pi pi-check"
                severity="success"
                size="small"
                (click)="aprobar(c)"
              />
              <p-button
                label="Aclaracion"
                icon="pi pi-comment"
                severity="warn"
                size="small"
                (click)="abrirDialogAclaracion(c)"
              />
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td colspan="7" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron contratos</td></tr>
      </ng-template>
    </p-table>

    <p-dialog
      header="Solicitar Aclaracion"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '450px' }"
    >
      <div class="dialog-content">
        <label style="font-weight:600; margin-bottom:0.5rem; display:block;">Motivo de la aclaracion</label>
        <textarea pTextarea [(ngModel)]="motivoAclaracion" rows="4" style="width:100%"
          placeholder="Describa el motivo por el cual solicita aclaracion..."></textarea>
      </div>
      <ng-template #footer>
        <p-button label="Cancelar" severity="secondary" (click)="dialogVisible = false" />
        <p-button label="Enviar" icon="pi pi-send" (click)="enviarAclaracion()" [disabled]="!motivoAclaracion.trim()" />
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
    .acciones { display: flex; gap: 0.5rem; }
    .dialog-content { padding: 0.5rem 0; }
  `]
})
export class EmpresaContratosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(CalidadService);

  contratos = signal<any[]>([]);
  loading = signal(false);
  dialogVisible = false;
  motivoAclaracion = '';
  private contratoSeleccionado: any = null;
  private idOrganizacion = 0;

  ngOnInit() {
    this.idOrganizacion = +this.route.snapshot.params['id'];
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.service.getContratosEmpresa(this.idOrganizacion).subscribe({
      next: (data) => { this.contratos.set(data); this.loading.set(false); },
      error: () => { this.contratos.set([]); this.loading.set(false); }
    });
  }

  aprobar(contrato: any) {
    this.service.registrarVerificacion(contrato.id, 'Aprobado').subscribe({
      next: () => this.cargar()
    });
  }

  abrirDialogAclaracion(contrato: any) {
    this.contratoSeleccionado = contrato;
    this.motivoAclaracion = '';
    this.dialogVisible = true;
  }

  enviarAclaracion() {
    if (!this.contratoSeleccionado || !this.motivoAclaracion.trim()) return;
    this.service.registrarVerificacion(this.contratoSeleccionado.id, 'Aclaracion', this.motivoAclaracion.trim()).subscribe({
      next: () => {
        this.dialogVisible = false;
        this.cargar();
      }
    });
  }
}
