import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CalidadService } from '../../../core/services/calidad.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-contrato-verificacion-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, SelectModule, TableModule],
  template: `
    <div class="banner">
      <i class="pi pi-info-circle"></i>
      INFORMACION DE LA ORGANIZACION Y DEL TRABAJADOR EXTRANJERO!
    </div>

    <p-button label="Regresar" icon="pi pi-arrow-left" severity="secondary" (onClick)="regresar()" styleClass="mb-3" />

    <h3 class="titulo-solicitud">DETALLE DE LA SOLICITUD NUMERO: {{ contratoId }}</h3>

    @if (data()) {
      <!-- DATOS DE LA ORGANIZACION -->
      <p-card>
        <ng-template #header>
          <div class="card-title green">DATOS DE LA ORGANIZACION (Registrada en RUE)</div>
        </ng-template>
        <table class="detail-table">
          <tr><td class="label">Tipo documento:</td><td>{{ data().organizacion?.tipoDocumento }}</td></tr>
          <tr><td class="label">Numero documento:</td><td>{{ data().organizacion?.numeroDocumento }}</td></tr>
          <tr><td class="label">Digito chequeo:</td><td>{{ data().organizacion?.digitoChequeo }}</td></tr>
          <tr><td class="label">Nombre completo:</td><td>{{ data().organizacion?.nombreCompleto }}</td></tr>
          <tr><td class="label">Regimen tributario:</td><td>{{ data().organizacion?.regimenTributario }}</td></tr>
          <tr><td class="label">Actividad economica:</td><td>{{ data().organizacion?.actividadEconomica }}</td></tr>
          <tr><td class="label">Habilitada:</td><td>{{ data().organizacion?.habilitada ? 'Si' : 'No' }}</td></tr>
          <tr><td class="label">Fecha registro:</td><td>{{ data().organizacion?.fechaRegistro | date:'dd/MM/yyyy HH:mm' }}</td></tr>
        </table>
      </p-card>

      <!-- DATOS DEL TRABAJADOR -->
      <p-card>
        <ng-template #header>
          <div class="card-title green">DATOS DEL TRABAJADOR</div>
        </ng-template>
        <table class="detail-table">
          <tr><td class="label">Tipo documento:</td><td>{{ data().trabajador?.tipoDocumento }}</td></tr>
          <tr><td class="label">Numero cedula:</td><td>{{ data().trabajador?.numeroCedula }}</td></tr>
          <tr><td class="label">Nombre completo:</td><td>{{ data().trabajador?.nombreCompleto }}</td></tr>
          <tr><td class="label">Fecha nacimiento:</td><td>{{ data().trabajador?.fechaNacimiento | date:'dd/MM/yyyy' }}</td></tr>
          <tr><td class="label">Pais nacimiento:</td><td>{{ data().trabajador?.paisNacimiento }}</td></tr>
          <tr><td class="label">Pais ciudadania:</td><td>{{ data().trabajador?.paisCiudadania }}</td></tr>
          <tr><td class="label">Genero:</td><td>{{ data().trabajador?.genero }}</td></tr>
          <tr><td class="label">Estado civil:</td><td>{{ data().trabajador?.estadoCivil }}</td></tr>
          <tr><td class="label">Pasaporte:</td><td>{{ data().trabajador?.pasaporte }}</td></tr>
          <tr><td class="label">Fecha registro:</td><td>{{ data().trabajador?.fechaRegistro | date:'dd/MM/yyyy HH:mm' }}</td></tr>
          <tr><td class="label">Contrato habilitado:</td><td>{{ data().trabajador?.contratoHabilitado ? 'Si' : 'No' }}</td></tr>
        </table>
      </p-card>

      <!-- DATOS DE LOS IDIOMAS -->
      <p-card>
        <ng-template #header>
          <div class="card-title green">DATOS DE LOS IDIOMAS QUE DOMINA EL TRABAJADOR</div>
        </ng-template>
        <p-table [value]="data().idiomas" [tableStyle]="{'min-width': '40rem'}" stripedRows>
          <ng-template #header>
            <tr>
              <th>Idioma</th>
              <th>Nivel hablado</th>
              <th>Nivel leido</th>
              <th>Nivel escrito</th>
            </tr>
          </ng-template>
          <ng-template #body let-i>
            <tr>
              <td>{{ i.idioma }}</td>
              <td>{{ i.nivelHablado }}</td>
              <td>{{ i.nivelLeido }}</td>
              <td>{{ i.nivelEscrito }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="4" style="text-align:center; padding:1rem; color:#90a4ae;">Sin idiomas registrados</td></tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- DATOS DE EDUCACION -->
      <p-card>
        <ng-template #header>
          <div class="card-title green">DATOS DE EDUCACION</div>
        </ng-template>
        <p-table [value]="data().nivelesEducativos" [tableStyle]="{'min-width': '40rem'}" stripedRows>
          <ng-template #header>
            <tr>
              <th>Nivel educativo</th>
              <th>Semestres cursados</th>
              <th>Obtuvo titulo?</th>
              <th>Titulo</th>
            </tr>
          </ng-template>
          <ng-template #body let-n>
            <tr>
              <td>{{ n.nivelEducativo }}</td>
              <td>{{ n.semestresCursados }}</td>
              <td>{{ n.obtuvoTitulo }}</td>
              <td>{{ n.titulo }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="4" style="text-align:center; padding:1rem; color:#90a4ae;">Sin niveles educativos registrados</td></tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- DATOS DEL CONTRATO -->
      <p-card>
        <ng-template #header>
          <div class="card-title green">DATOS DEL CONTRATO</div>
        </ng-template>
        <table class="detail-table">
          <tr><td class="label">Denominacion:</td><td>{{ data().contrato?.denominacion }}</td></tr>
          <tr><td class="label">Tipo contrato:</td><td>{{ data().contrato?.tipoContrato }}</td></tr>
          <tr><td class="label">Vigencia desde:</td><td>{{ data().contrato?.vigenciaDesde | date:'dd/MM/yyyy' }}</td></tr>
          <tr><td class="label">Vigencia hasta:</td><td>{{ data().contrato?.vigenciaHasta | date:'dd/MM/yyyy' }}</td></tr>
          <tr><td class="label">Ocupacion laboral 1:</td><td>{{ data().contrato?.ocupacionLaboral1 }}</td></tr>
          <tr><td class="label">Ocupacion laboral 2:</td><td>{{ data().contrato?.ocupacionLaboral2 }}</td></tr>
          <tr><td class="label">Ocupacion laboral 3:</td><td>{{ data().contrato?.ocupacionLaboral3 }}</td></tr>
          <tr><td class="label">Cargo:</td><td>{{ data().contrato?.cargo }}</td></tr>
          <tr><td class="label">Descripcion:</td><td>{{ data().contrato?.descripcion }}</td></tr>
          <tr><td class="label">Entidad pension:</td><td>{{ data().contrato?.entidadPension }}</td></tr>
          <tr><td class="label">Entidad salud:</td><td>{{ data().contrato?.entidadSalud }}</td></tr>
          <tr><td class="label">Entidad riesgos:</td><td>{{ data().contrato?.entidadRiesgos }}</td></tr>
          <tr><td class="label">Entidad caja:</td><td>{{ data().contrato?.entidadCaja }}</td></tr>
          <tr><td class="label">Profesion:</td><td>{{ data().contrato?.profesion }}</td></tr>
          <tr><td class="label">Tarjeta profesional:</td><td>{{ data().contrato?.tarjetaProfesional }}</td></tr>
          <tr><td class="label">Departamento:</td><td>{{ data().contrato?.departamento }}</td></tr>
          <tr><td class="label">Municipio:</td><td>{{ data().contrato?.municipio }}</td></tr>
          <tr><td class="label">Fecha registro:</td><td>{{ data().contrato?.fechaRegistro | date:'dd/MM/yyyy HH:mm' }}</td></tr>
          <tr><td class="label">Fecha modificacion:</td><td>{{ data().contrato?.fechaModificacion | date:'dd/MM/yyyy HH:mm' }}</td></tr>
          <tr><td class="label">Usuario modificacion:</td><td>{{ data().contrato?.usuarioModificacion }}</td></tr>
          <tr><td class="label">Eliminado:</td><td>{{ data().contrato?.eliminado ? 'Si' : 'No' }}</td></tr>
          <tr><td class="label">Motivo eliminado:</td><td>{{ data().contrato?.motivoEliminado }}</td></tr>
        </table>
      </p-card>

      <!-- ACTION CARDS -->
      <div class="action-row">
        <div class="action-card aclarar">
          <h4>Aclarar</h4>
          <p>Marcar este contrato como aclarado (informacion verificada correctamente).</p>
          <p-button label="Aclarado" icon="pi pi-check" severity="success" (onClick)="aclarar()" [loading]="enviando()" />
        </div>
        <div class="action-card solicitar">
          <h4>Solicitar Aclaracion</h4>
          <p>Seleccione los motivos por los cuales se requiere aclaracion:</p>
          <div class="motivo-selector">
            <p-select
              [options]="motivosDisponibles"
              [(ngModel)]="motivoSeleccionado"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione motivo..."
              [style]="{ width: '100%' }"
            />
            <p-button label="Agregar" icon="pi pi-plus" severity="warn" size="small" (onClick)="agregarMotivo()" [disabled]="!motivoSeleccionado" />
          </div>
          @if (motivosAgregados().length) {
            <ul class="motivos-list">
              @for (m of motivosAgregados(); track m) {
                <li>
                  {{ m.label }}
                  <i class="pi pi-times remove-motivo" (click)="quitarMotivo(m.value)"></i>
                </li>
              }
            </ul>
          }
          <p-button label="Solicitar Aclaracion" icon="pi pi-send" severity="warn" (onClick)="solicitarAclaracion()" [disabled]="!motivosAgregados().length" [loading]="enviando()" />
        </div>
      </div>
    } @else if (loading()) {
      <div style="text-align:center; padding:3rem; color:#90a4ae;">
        <i class="pi pi-spin pi-spinner" style="font-size:2rem"></i>
        <p>Cargando detalle del contrato...</p>
      </div>
    }
  `,
  styles: [`
    .banner {
      display: flex; align-items: center; gap: 0.75rem;
      background: #1565c0; color: white; font-weight: 600;
      padding: 0.75rem 1.25rem; border-radius: 8px; margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .titulo-solicitud {
      color: #1565c0; font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem;
    }
    :host ::ng-deep p-card {
      display: block; margin-bottom: 1rem;
    }
    .card-title {
      padding: 0.6rem 1rem; font-weight: 700; font-size: 0.85rem;
    }
    .card-title.green {
      background: #e8f5e9; color: #2e7d32; border-bottom: 2px solid #66bb6a;
    }
    .detail-table {
      width: 100%; border-collapse: collapse;
    }
    .detail-table td {
      padding: 0.35rem 0.75rem; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0;
    }
    .detail-table td.label {
      font-weight: 600; color: #555; width: 220px; white-space: nowrap;
    }
    .action-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;
    }
    .action-card {
      border-radius: 8px; padding: 1.25rem;
    }
    .action-card h4 { margin: 0 0 0.5rem 0; font-size: 1rem; }
    .action-card p { font-size: 0.85rem; margin-bottom: 0.75rem; }
    .action-card.aclarar {
      background: #e8f5e9; border: 2px solid #66bb6a;
    }
    .action-card.solicitar {
      background: #fce4ec; border: 2px solid #ef9a9a;
    }
    .motivo-selector {
      display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem;
    }
    .motivos-list {
      list-style: none; padding: 0; margin: 0 0 0.75rem 0;
    }
    .motivos-list li {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.3rem 0.5rem; background: white; border-radius: 4px;
      margin-bottom: 0.25rem; font-size: 0.85rem;
    }
    .remove-motivo {
      cursor: pointer; color: #c62828; font-size: 0.75rem;
    }
  `]
})
export class ContratoVerificacionDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(CalidadService);

  contratoId = 0;
  data = signal<any>(null);
  loading = signal(false);
  enviando = signal(false);

  motivosDisponibles: { label: string; value: string }[] = [];
  motivoSeleccionado = '';
  motivosAgregados = signal<{ label: string; value: string }[]>([]);

  ngOnInit() {
    this.contratoId = +this.route.snapshot.params['contratoId'];
    this.cargar();
    this.service.getMotivosAclaracion().subscribe({
      next: (motivos) => this.motivosDisponibles = motivos,
      error: () => this.motivosDisponibles = []
    });
  }

  private cargar() {
    this.loading.set(true);
    this.service.getContratoDetalle(this.contratoId).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => { this.data.set(null); this.loading.set(false); }
    });
  }

  regresar() {
    this.router.navigate(['/calidad/gestion']);
  }

  agregarMotivo() {
    if (!this.motivoSeleccionado) return;
    const existe = this.motivosAgregados().find(m => m.value === this.motivoSeleccionado);
    if (existe) return;
    const motivo = this.motivosDisponibles.find(m => m.value === this.motivoSeleccionado);
    if (motivo) {
      this.motivosAgregados.update(list => [...list, motivo]);
    }
    this.motivoSeleccionado = '';
  }

  quitarMotivo(value: string) {
    this.motivosAgregados.update(list => list.filter(m => m.value !== value));
  }

  aclarar() {
    this.enviando.set(true);
    this.service.registrarVerificacion(this.contratoId, 'A').subscribe({
      next: () => { this.enviando.set(false); this.regresar(); },
      error: () => this.enviando.set(false)
    });
  }

  solicitarAclaracion() {
    if (!this.motivosAgregados().length) return;
    this.enviando.set(true);
    const motivos = this.motivosAgregados().map(m => m.value).join(',');
    this.service.registrarVerificacion(this.contratoId, 'PN', motivos).subscribe({
      next: () => { this.enviando.set(false); this.regresar(); },
      error: () => this.enviando.set(false)
    });
  }
}
