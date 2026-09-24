import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrabajadoresService } from '../../../core/services/trabajadores.service';
import { TrabajadorDetail } from '../../../core/models/rutec.models';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-trabajador-resumen',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, ButtonModule, TagModule],
  template: `
    @if (loading()) {
      <div class="loading-msg"><i class="pi pi-spin pi-spinner"></i> Cargando informacion del trabajador...</div>
    }

    @if (trabajador(); as t) {
      <div class="page-header">
        <h2>RESUMEN DEL TRABAJADOR</h2>
      </div>

      <div class="actions-bar">
        <p-button label="Editar" icon="pi pi-pencil" (click)="editar()" />
        <p-button label="Ver Contratos" icon="pi pi-file" severity="info" (click)="verContratos()" />
        <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" (click)="volver()" />
      </div>

      <!-- Datos Personales -->
      <p-card>
        <ng-template #title>Datos Personales</ng-template>
        <div class="detail-grid">
          <div><strong>Nombre Completo:</strong> {{ t.primerNombre }} {{ t.segundoNombre }} {{ t.primerApellido }} {{ t.segundoApellido }}</div>
          <div><strong>Genero:</strong> {{ t.generoDescripcion }}</div>
          <div><strong>Estado Civil:</strong> {{ t.estadoCivilDescripcion }}</div>
          <div><strong>Fecha Nacimiento:</strong> {{ t.fechaNacimiento | date:'dd/MM/yyyy' }}</div>
          <div><strong>Fecha Registro:</strong> {{ t.fechaRegistro | date:'dd/MM/yyyy' }}</div>
        </div>
      </p-card>

      <!-- Documento -->
      <p-card>
        <ng-template #title>Documento</ng-template>
        <div class="detail-grid">
          <div><strong>Tipo Documento:</strong> {{ t.tipoDocumento }}</div>
          <div><strong>Cedula Extranjeria:</strong> {{ t.numeroCedulaExtranjeria || '-' }}</div>
          <div><strong>PEP:</strong> {{ t.numeroPep || '-' }}</div>
          <div><strong>Pasaporte:</strong> {{ t.numeroPasaporte || '-' }}</div>
        </div>
      </p-card>

      <!-- Origen -->
      <p-card>
        <ng-template #title>Origen</ng-template>
        <div class="detail-grid">
          <div><strong>Pais Nacimiento:</strong> {{ t.paisNacimientoNombre }}</div>
          <div><strong>Pais Ciudadania:</strong> {{ t.paisCiudadaniaNombre }}</div>
          <div><strong>Tipo de Visa:</strong> {{ t.tipoVisaDescripcion || '-' }}</div>
        </div>
      </p-card>

      <!-- Idiomas -->
      <p-card>
        <ng-template #title>Idiomas</ng-template>
        <p-table [value]="t.idiomas" [tableStyle]="{'min-width': '40rem'}">
          <ng-template #header>
            <tr>
              <th>IDIOMA</th>
              <th>NIVEL HABLADO</th>
              <th>NIVEL ESCRITO</th>
              <th>NIVEL LEIDO</th>
            </tr>
          </ng-template>
          <ng-template #body let-i>
            <tr>
              <td>{{ i.idioma }}</td>
              <td>{{ i.nivelHablado }}</td>
              <td>{{ i.nivelEscrito }}</td>
              <td>{{ i.nivelLeido }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="4" style="text-align:center; padding:1rem; color:#90a4ae;">Sin idiomas registrados</td></tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Educacion -->
      <p-card>
        <ng-template #title>Educacion</ng-template>
        <p-table [value]="t.nivelesEducativos" [tableStyle]="{'min-width': '40rem'}">
          <ng-template #header>
            <tr>
              <th>NIVEL EDUCATIVO</th>
              <th>SEMESTRES</th>
              <th>OBTUVO TITULO</th>
              <th>TITULO</th>
            </tr>
          </ng-template>
          <ng-template #body let-e>
            <tr>
              <td>{{ e.nivelEducativo }}</td>
              <td>{{ e.semestresCursados }}</td>
              <td>
                <p-tag [value]="e.obtuvoTitulo === 'S' ? 'Si' : 'No'" [severity]="e.obtuvoTitulo === 'S' ? 'success' : 'secondary'" />
              </td>
              <td>{{ e.titulo || '-' }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="4" style="text-align:center; padding:1rem; color:#90a4ae;">Sin educacion registrada</td></tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Contratos -->
      <p-card>
        <ng-template #title>Contratos</ng-template>
        <div class="contract-info">
          <p-tag [value]="t.cantidadContratos + ' contrato(s) registrado(s)'" severity="info" />
          <p-button label="Ver Contratos" icon="pi pi-external-link" size="small" [text]="true" (click)="verContratos()" />
        </div>
      </p-card>
    }

    @if (error()) {
      <div class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error() }}</div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1rem; }
    .page-header h2 { color: #333; font-size: 1rem; font-weight: 600; }
    .actions-bar {
      display: flex; gap: 0.75rem; margin-bottom: 1.25rem;
    }
    :host ::ng-deep p-card { display: block; margin-bottom: 1rem; }
    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 2rem;
      font-size: 0.9rem;
    }
    .contract-info {
      display: flex; align-items: center; gap: 1rem;
    }
    .loading-msg { padding: 2rem; text-align: center; color: #666; font-size: 0.95rem; }
    .error-msg {
      background: #ffebee; color: #c62828; padding: 0.75rem 1rem;
      border-radius: 6px; margin-top: 1rem; font-size: 0.9rem;
    }
  `]
})
export class TrabajadorResumenComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(TrabajadoresService);

  trabajador = signal<TrabajadorDetail | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error.set('ID de trabajador no valido.'); return; }

    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: (data) => { this.trabajador.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar el trabajador.'); this.loading.set(false); }
    });
  }

  editar() {
    this.router.navigate(['/trabajadores', this.trabajador()!.id, 'editar']);
  }

  verContratos() {
    this.router.navigate(['/trabajadores', this.trabajador()!.id, 'contratos']);
  }

  volver() {
    this.router.navigate(['/trabajadores']);
  }
}
