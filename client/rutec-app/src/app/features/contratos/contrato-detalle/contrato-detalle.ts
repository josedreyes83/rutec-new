import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContratosService } from '../../../core/services/contratos.service';
import { ContratoDetail } from '../../../core/models/rutec.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-contrato-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TagModule, DialogModule, InputTextModule],
  template: `
    <div class="page-header">
      <h2>DETALLE DEL CONTRATO</h2>
    </div>

    @if (contrato(); as c) {
      <p-card>
        <div class="detail-grid">
          <div class="detail-field">
            <label>Denominacion</label>
            <span>{{ c.denominacionContrato }}</span>
          </div>
          <div class="detail-field">
            <label>Tipo de contrato</label>
            <span>{{ c.tipoContratoDescripcion }}</span>
          </div>
          <div class="detail-field">
            <label>Cargo</label>
            <span>{{ c.cargoTrabajador }}</span>
          </div>
          <div class="detail-field">
            <label>Profesion</label>
            <span>{{ c.profesion || '-' }}</span>
          </div>
          <div class="detail-field">
            <label>Vigencia desde</label>
            <span>{{ c.vigenciaDesde | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="detail-field">
            <label>Vigencia hasta</label>
            <span>{{ c.vigenciaHasta | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="detail-field">
            <label>Departamento</label>
            <span>{{ c.deptoNombre || '-' }}</span>
          </div>
          <div class="detail-field">
            <label>Municipio</label>
            <span>{{ c.mpioNombre || '-' }}</span>
          </div>
          <div class="detail-field full-width">
            <label>Descripcion</label>
            <span>{{ c.descripcionContrato || '-' }}</span>
          </div>
          <div class="detail-field">
            <label>Estado</label>
            <p-tag
              [value]="c.eliminado ? 'ELIMINADO' : 'VIGENTE'"
              [severity]="c.eliminado ? 'danger' : 'success'"
            />
          </div>
          @if (c.eliminado && c.motivoEliminado) {
            <div class="detail-field">
              <label>Motivo eliminacion</label>
              <span>{{ c.motivoEliminado }}</span>
            </div>
          }
          <div class="detail-field">
            <label>Fecha de registro</label>
            <span>{{ c.fechaRegistro | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>
      </p-card>

      <div class="actions-bar">
        @if (!c.eliminado) {
          <p-button label="Editar" icon="pi pi-pencil" (click)="editar()" />
          <p-button label="Finalizar" icon="pi pi-check-circle" severity="warn" (click)="finalizar()" />
          <p-button label="Eliminar" icon="pi pi-trash" severity="danger" (click)="mostrarDialogEliminar()" />
        }
        <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (click)="volver()" />
      </div>
    }

    <p-dialog
      header="Eliminar contrato"
      [(visible)]="dialogEliminarVisible"
      [modal]="true"
      [style]="{ width: '450px' }"
    >
      <div class="dialog-content">
        <p>Indique el motivo de la eliminacion del contrato:</p>
        <input pInputText [(ngModel)]="motivoEliminacion" placeholder="Motivo de eliminacion" style="width:100%" />
      </div>
      <ng-template #footer>
        <p-button label="Cancelar" severity="secondary" [text]="true" (click)="dialogEliminarVisible = false" />
        <p-button label="Confirmar eliminacion" severity="danger" icon="pi pi-trash" (click)="confirmarEliminar()" [disabled]="!motivoEliminacion.trim()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .page-header { margin-bottom: 1rem; }
    .page-header h2 { color: #333; font-size: 1rem; font-weight: 600; }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.5rem;
    }
    .detail-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .detail-field label { font-size: 0.8rem; font-weight: 600; color: #78909c; text-transform: uppercase; }
    .detail-field span { font-size: 0.95rem; color: #263238; }
    .full-width { grid-column: 1 / -1; }
    .actions-bar {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
  `]
})
export class ContratoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contratosService = inject(ContratosService);

  contrato = signal<ContratoDetail | null>(null);
  trabajadorId = 0;
  contratoId = 0;
  dialogEliminarVisible = false;
  motivoEliminacion = '';

  ngOnInit() {
    this.trabajadorId = Number(this.route.snapshot.paramMap.get('trabajadorId'));
    this.contratoId = Number(this.route.snapshot.paramMap.get('contratoId'));
    this.cargar();
  }

  private cargar() {
    this.contratosService.getById(this.trabajadorId, this.contratoId).subscribe(data => this.contrato.set(data));
  }

  editar() {
    this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos', this.contratoId, 'editar']);
  }

  finalizar() {
    this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos', this.contratoId, 'finalizar']);
  }

  mostrarDialogEliminar() {
    this.motivoEliminacion = '';
    this.dialogEliminarVisible = true;
  }

  confirmarEliminar() {
    if (!this.motivoEliminacion.trim()) return;
    this.contratosService.eliminar(this.trabajadorId, this.contratoId, this.motivoEliminacion).subscribe({
      next: () => {
        this.dialogEliminarVisible = false;
        this.cargar();
      }
    });
  }

  volver() {
    this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos']);
  }
}
