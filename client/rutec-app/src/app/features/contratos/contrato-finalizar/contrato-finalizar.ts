import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratosService } from '../../../core/services/contratos.service';
import { ContratoDetail } from '../../../core/models/rutec.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-contrato-finalizar',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  template: `
    <div class="page-header">
      <h2>FINALIZAR CONTRATO</h2>
    </div>

    @if (contrato(); as c) {
      <p-card>
        <div class="confirm-content">
          <i class="pi pi-exclamation-triangle" style="font-size:3rem; color:#f59e0b"></i>
          <p class="confirm-text">
            Esta seguro de finalizar el contrato de <strong>{{ c.cargoTrabajador }}</strong>
            con vigencia <strong>{{ c.vigenciaDesde | date:'dd/MM/yyyy' }}</strong> - <strong>{{ c.vigenciaHasta | date:'dd/MM/yyyy' }}</strong>?
          </p>
          <div class="detail-summary">
            <div><strong>Denominacion:</strong> {{ c.denominacionContrato }}</div>
            <div><strong>Tipo:</strong> {{ c.tipoContratoDescripcion }}</div>
            <div><strong>Departamento:</strong> {{ c.deptoNombre }}</div>
            <div><strong>Municipio:</strong> {{ c.mpioNombre }}</div>
          </div>
        </div>
      </p-card>

      <div class="actions-bar">
        <p-button
          label="Confirmar finalizacion"
          icon="pi pi-check"
          severity="warn"
          (click)="confirmar()"
          [disabled]="procesando()"
        />
        <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [outlined]="true" (click)="cancelar()" />
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1rem; }
    .page-header h2 { color: #333; font-size: 1rem; font-weight: 600; }
    .confirm-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      text-align: center;
      padding: 1rem;
    }
    .confirm-text { font-size: 1.05rem; color: #37474f; max-width: 500px; }
    .detail-summary {
      text-align: left;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 1rem 1.5rem;
      font-size: 0.9rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      width: 100%;
      max-width: 500px;
    }
    .actions-bar {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
      justify-content: center;
    }
  `]
})
export class ContratoFinalizarComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contratosService = inject(ContratosService);

  contrato = signal<ContratoDetail | null>(null);
  procesando = signal(false);
  trabajadorId = 0;
  contratoId = 0;

  ngOnInit() {
    this.trabajadorId = Number(this.route.snapshot.paramMap.get('trabajadorId'));
    this.contratoId = Number(this.route.snapshot.paramMap.get('contratoId'));
    this.contratosService.getById(this.trabajadorId, this.contratoId).subscribe(data => this.contrato.set(data));
  }

  confirmar() {
    this.procesando.set(true);
    this.contratosService.finalizar(this.trabajadorId, this.contratoId).subscribe({
      next: () => {
        this.procesando.set(false);
        this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos', this.contratoId]);
      },
      error: () => this.procesando.set(false)
    });
  }

  cancelar() {
    this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos', this.contratoId]);
  }
}
