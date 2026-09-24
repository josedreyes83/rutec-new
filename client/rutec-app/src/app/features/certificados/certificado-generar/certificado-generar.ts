import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CertificadosService } from '../../../core/services/certificados.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-certificado-generar',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  template: `
    <div class="page-header">
      <h2>GENERAR CONSTANCIA LABORAL</h2>
    </div>

    @if (loading()) {
      <div style="text-align:center; padding:3rem;">
        <i class="pi pi-spin pi-spinner" style="font-size:2rem"></i>
        <p>Cargando informacion del contrato...</p>
      </div>
    }

    @if (contrato(); as c) {
      <p-card header="Informacion del Contrato">
        <div class="detalle-grid">
          <div class="campo">
            <label>Denominacion del Contrato</label>
            <span>{{ c.denominacionContrato }}</span>
          </div>
          <div class="campo">
            <label>Cargo</label>
            <span>{{ c.cargoTrabajador }}</span>
          </div>
          <div class="campo">
            <label>Tipo de Contrato</label>
            <span>{{ c.tipoContratoDescripcion }}</span>
          </div>
          <div class="campo">
            <label>Vigencia Desde</label>
            <span>{{ c.vigenciaDesde | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="campo">
            <label>Vigencia Hasta</label>
            <span>{{ c.vigenciaHasta | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="campo">
            <label>Trabajador</label>
            <span>{{ c.trabajadorNombre }}</span>
          </div>
          <div class="campo">
            <label>Cedula</label>
            <span>{{ c.trabajadorCedula }}</span>
          </div>
          <div class="campo">
            <label>Empresa</label>
            <span>{{ c.empresaNombre }}</span>
          </div>
        </div>

        <div style="margin-top:1.5rem; text-align:center;">
          <p-button
            label="Generar Constancia"
            icon="pi pi-download"
            severity="success"
            size="large"
            [loading]="descargando()"
            (click)="generarConstancia()"
          />
        </div>
      </p-card>
    }

    @if (error()) {
      <div class="error-msg">
        <i class="pi pi-exclamation-triangle"></i>
        No se pudo cargar la informacion del contrato.
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1rem; }
    .page-header h2 { color: #333; font-size: 1rem; font-weight: 600; }
    .detalle-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .campo {
      display: flex; flex-direction: column; gap: 0.25rem;
    }
    .campo label {
      font-weight: 600; font-size: 0.8rem; color: #666; text-transform: uppercase;
    }
    .campo span { font-size: 0.95rem; }
    .error-msg {
      text-align: center; padding: 2rem; color: #c62828;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      font-size: 1rem;
    }
  `]
})
export class CertificadoGenerarComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(CertificadosService);

  contrato = signal<any>(null);
  loading = signal(false);
  descargando = signal(false);
  error = signal(false);
  private contratoId = 0;

  ngOnInit() {
    this.contratoId = +this.route.snapshot.params['contratoId'];
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.service.getInfoContrato(this.contratoId).subscribe({
      next: (data) => { this.contrato.set(data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }

  generarConstancia() {
    this.descargando.set(true);
    this.service.descargarConstancia(this.contratoId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `constancia_${this.contratoId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.descargando.set(false);
      },
      error: () => this.descargando.set(false)
    });
  }
}
